/**
 * PET BATTLE ARENA - Server Entry Point
 * Node.js + Express + Socket.IO + TikTok Live Connector
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const TikTokConnector = require('./tiktok/TikTokConnector');
const EventProcessor = require('./events/EventProcessor');

class PetBattleArenaServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        this.port = process.env.PORT || 3000;
        this.maxPets = parseInt(process.env.MAX_PETS) || 200;

        // Game state
        this.gameState = {
            pets: new Map(),
            enemies: new Map(),
            wave: 1,
            waveTimer: 0,
            likesPerMinute: 0,
            totalLikes: 0,
            totalGifts: 0,
            isMegaPetActive: false,
            megaPetEndTime: 0
        };

        // TikTok connection
        this.tiktokConnector = null;
        this.tiktokUsername = null;
        this.isTikTokConnected = false;

        // Initialize components
        this.eventProcessor = new EventProcessor(this);

        // Setup middleware
        this.setupMiddleware();

        // Setup routes
        this.setupRoutes();

        // Setup Socket.IO
        this.setupSocketIO();

        // Start game loop
        this.startGameLoop();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // Serve static files from client directory
        this.app.use(express.static(path.join(__dirname, '..', 'client')));
    }

    setupRoutes() {
        // Connection endpoint
        this.app.post('/connect', async (req, res) => {
            const { username } = req.body;
            
            if (!username) {
                return res.status(400).json({ error: 'Username requerido' });
            }

            try {
                // Disconnect previous connection if exists
                if (this.tiktokConnector) {
                    this.tiktokConnector.disconnect();
                }

                this.tiktokUsername = username.replace('@', '');
                console.log(`[Server] Attempting to connect to TikTok: @${this.tiktokUsername}`);

                // Create new TikTok connector
                this.tiktokConnector = new TikTokConnector(this.tiktokUsername, this.eventProcessor);
                
                // Connect to TikTok
                await this.tiktokConnector.connect();
                this.isTikTokConnected = true;

                console.log(`[Server] Successfully connected to TikTok live @${this.tiktokUsername}`);

                res.json({ 
                    success: true, 
                    username: this.tiktokUsername,
                    message: 'Conectado exitosamente a TikTok Live'
                });

            } catch (error) {
                console.error('[Server] TikTok connection failed:', error.message);
                this.isTikTokConnected = false;
                res.status(500).json({ 
                    error: 'No se pudo conectar a TikTok. Asegúrate de tener un live activo.',
                    details: error.message
                });
            }
        });

        // Status endpoint
        this.app.get('/status', (req, res) => {
            res.json({
                connected: this.isTikTokConnected,
                username: this.tiktokUsername,
                gameState: this.getGameState()
            });
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: Date.now() });
        });
    }

    setupSocketIO() {
        this.io.on('connection', (socket) => {
            console.log(`[Socket.IO] Client connected: ${socket.id}`);

            // Send initial game state
            socket.emit('game:init', this.getGameState());

            // Handle demo pet spawns (for testing without TikTok)
            socket.on('demo:spawn', (data) => {
                this.eventProcessor.processDemoSpawn(data);
            });

            socket.on('disconnect', () => {
                console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
            });
        });
    }

    startGameLoop() {
        // Game tick every 100ms
        setInterval(() => this.gameTick(), 100);
        
        // Wave spawner
        const waveInterval = parseInt(process.env.WAVE_INTERVAL) || 15000;
        setInterval(() => this.spawnWave(), waveInterval);

        // Likes per minute calculator
        setInterval(() => this.calculateLPM(), 60000);

        console.log(`[Server] Game loop started - Port: ${this.port}`);
    }

    gameTick() {
        // Update game state every tick
        this.gameState.waveTimer += 100;

        // Check Mega Pet expiration
        if (this.gameState.isMegaPetActive && Date.now() > this.gameState.megaPetEndTime) {
            this.endMegaPetMode();
        }

        // Broadcast game state to all clients
        this.io.emit('game:update', this.getGameState());
    }

    spawnWave() {
        const wave = this.gameState.wave;
        const enemyCount = Math.min(3 + Math.floor(wave / 2), 10);
        
        this.io.emit('wave:spawn', {
            wave: wave,
            enemyCount: enemyCount,
            difficulty: this.calculateDifficulty()
        });

        this.gameState.wave++;
        this.gameState.waveTimer = 0;

        console.log(`[Wave] Spawned wave ${wave} with ${enemyCount} enemies`);
    }

    calculateDifficulty() {
        const wave = this.gameState.wave;
        return {
            speed: 1 + (wave * 0.1),
            health: 1 + (wave * 0.15),
            damage: 1 + (wave * 0.12)
        };
    }

    calculateLPM() {
        // Reset LPM counter (will be updated by actual like events from TikTok)
        this.gameState.likesPerMinute = Math.floor(Math.random() * 20); // Demo value, real from TikTok
    }

    getGameState() {
        return {
            pets: Array.from(this.gameState.pets.values()),
            enemies: Array.from(this.gameState.enemies.values()),
            wave: this.gameState.wave,
            waveTimer: this.gameState.waveTimer,
            likesPerMinute: this.gameState.likesPerMinute,
            totalLikes: this.gameState.totalLikes,
            totalGifts: this.gameState.totalGifts,
            isMegaPetActive: this.gameState.isMegaPetActive,
            megaPetEndTime: this.gameState.megaPetEndTime,
            maxPets: this.maxPets,
            tiktokConnected: this.isTikTokConnected,
            tiktokUsername: this.tiktokUsername
        };
    }

    addPet(pet) {
        if (this.gameState.pets.size < this.maxPets) {
            this.gameState.pets.set(pet.id, pet);
            this.io.emit('pet:added', pet);
            return true;
        }
        return false;
    }

    removePet(petId) {
        if (this.gameState.pets.has(petId)) {
            this.gameState.pets.delete(petId);
            this.io.emit('pet:removed', { id: petId });
        }
    }

    activateMegaPet(donorName, duration = 30000) {
        this.gameState.isMegaPetActive = true;
        this.gameState.megaPetEndTime = Date.now() + duration;

        this.io.emit('megaPet:activate', {
            donorName: donorName,
            duration: duration,
            pets: Array.from(this.gameState.pets.values())
        });

        console.log(`[MegaPet] ACTIVATED by ${donorName} for ${duration}ms`);
    }

    endMegaPetMode() {
        this.gameState.isMegaPetActive = false;
        this.io.emit('megaPet:deactivate', {});
        console.log('[MegaPet] Deactivated');
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════╗
║           🐾 PET BATTLE ARENA - SERVER 🐾               ║
╠═══════════════════════════════════════════════════════════╣
║  Status: RUNNING                                        ║
║  Port: ${this.port}                                              ║
║  Mode: TIKTOK LIVE                                     ║
║  Web:  http://localhost:${this.port}                           ║
╚═══════════════════════════════════════════════════════════╝
            `);
        });
    }
}

// Start server
const server = new PetBattleArenaServer();
server.start();
