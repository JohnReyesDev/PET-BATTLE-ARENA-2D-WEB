/**
 * PET BATTLE ARENA - Punto de Entrada del Servidor
 * Node.js + Express + Socket.IO + Conector TikTok Live
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
        this.stateBroadcastIntervalMs = parseInt(process.env.STATE_BROADCAST_INTERVAL_MS) || 250;
        this.lastStateBroadcastAt = 0;

        // Estado del juego
        this.gameState = {
            pets: new Map(),
            enemies: new Map(),
            wave: 0,
            waveTimer: 0,
            likesPerMinute: 0,
            likesCurrentMinute: 0,
            totalLikes: 0,
            totalGifts: 0,
            isMegaPetActive: false,
            megaPetEndTime: 0
        };

        // Conexión TikTok
        this.tiktokConnector = null;
        this.tiktokUsername = null;
        this.isTikTokConnected = false;
        this.isShuttingDown = false;
        this.waveIntervalRef = null;
        this.lpmIntervalRef = null;

        // Inicializar componentes
        this.eventProcessor = new EventProcessor(this);

        // Configurar middleware
        this.setupMiddleware();

        // Configurar rutas
        this.setupRoutes();

        // Configurar Socket.IO
        this.setupSocketIO();

        // Iniciar bucle del juego
        this.startGameLoop();

        // Manejo de apagado
        this.setupProcessHandlers();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // Servir archivos estáticos del directorio cliente
        this.app.use(express.static(path.join(__dirname, '..', 'client')));
    }

    setupRoutes() {
        // Punto de conexión
        this.app.post('/connect', async (req, res) => {
            const { username } = req.body;
            
            if (!username) {
                return res.status(400).json({ error: 'Nombre de usuario requerido' });
            }

            try {
                // Desconectar conexión anterior si existe
                if (this.tiktokConnector) {
                    this.tiktokConnector.disconnect();
                }

                this.tiktokUsername = username.replace('@', '');
                console.log(`[Servidor] Intentando conectar a TikTok: @${this.tiktokUsername}`);

                // Crear nuevo conector de TikTok
                this.tiktokConnector = new TikTokConnector(this.tiktokUsername, this.eventProcessor);
                
                // Conectar a TikTok
                await this.tiktokConnector.connect();
                this.isTikTokConnected = true;

                console.log(`[Servidor] Conectado exitosamente a TikTok live @${this.tiktokUsername}`);

                res.json({ 
                    success: true, 
                    username: this.tiktokUsername,
                    message: 'Conectado exitosamente a TikTok Live'
                });

            } catch (error) {
                console.error('[Servidor] Error de conexión a TikTok:', error.message);
                this.isTikTokConnected = false;
                res.status(500).json({ 
                    error: 'No se pudo conectar a TikTok. Asegúrate de tener un live activo.',
                    details: error.message
                });
            }
        });

        // Punto de estado
        this.app.get('/status', (req, res) => {
            res.json({
                connected: this.isTikTokConnected,
                username: this.tiktokUsername,
                gameState: this.getGameState()
            });
        });

        // Verificación de salud
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: Date.now() });
        });
    }

    setupSocketIO() {
        this.io.on('connection', (socket) => {
            console.log(`[Socket.IO] Cliente conectado: ${socket.id}`);

            // Enviar estado inicial del juego
            socket.emit('game:init', this.getGameState());

            // Manejar generación de mascotas de demostración (para pruebas sin TikTok)
            socket.on('demo:spawn', (data) => {
                this.eventProcessor.processPetSpawn(data || {});
            });

            socket.on('pet:spawn', (data) => {
                this.eventProcessor.processPetSpawn(data || {});
            });

            socket.on('likes:add', (count) => {
                const likes = Number(count) || 0;
                if (likes > 0) {
                    this.eventProcessor.processLikes(likes);
                }
            });

            socket.on('gift:send', (data) => {
                const payload = data || {};
                this.eventProcessor.processGift({
                    username: payload.username || 'demo_user',
                    nickname: payload.username || 'Usuario Demo',
                    giftName: payload.giftName || 'Demo Gift',
                    giftCount: Number(payload.giftCount) || 1,
                    diamondCount: Number(payload.diamondCount) || 1,
                    isViralGift: Number(payload.diamondCount) >= 3000
                });
            });

            socket.on('disconnect', () => {
                console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`);
            });
        });
    }

    startGameLoop() {
        // Tick del juego cada 100ms (10 FPS para sincronización de estado)
        this.tickInterval = setInterval(() => this.gameTick(), 100);
        
        // Generador de oleadas
        const waveInterval = parseInt(process.env.WAVE_INTERVAL) || 15000;
        this.waveIntervalRef = setInterval(() => this.spawnWave(), waveInterval);

        // Calculadora de likes por minuto
        this.lpmIntervalRef = setInterval(() => this.calculateLPM(), 60000);

        console.log(`[Servidor] Bucle del juego iniciado - Puerto: ${this.port}`);
    }

    gameTick() {
        // Actualizar estado del juego cada tick
        this.gameState.waveTimer += 100;

        // Verificar expiración de Mega Mascota
        if (this.gameState.isMegaPetActive && Date.now() > this.gameState.megaPetEndTime) {
            this.endMegaPetMode();
        }

        // Solo transmitir si hay cambios significativos o clientes conectados
        const now = Date.now();
        if (
            this.io.engine.clientsCount > 0 &&
            now - this.lastStateBroadcastAt >= this.stateBroadcastIntervalMs
        ) {
            this.lastStateBroadcastAt = now;
            const state = this.getGameState();
            this.io.emit('game:update', state);
        }
    }

    spawnWave() {
        // `gameState.wave` representa la oleada activa/actual.
        // Incrementamos primero para que `wave:spawn` y `game:update` queden sincronizados.
        const wave = this.gameState.wave + 1;
        this.gameState.wave = wave;

        const enemyCount = Math.min(3 + Math.floor(wave / 2), 10);
        
        this.io.emit('wave:spawn', {
            wave: wave,
            enemyCount: enemyCount,
            difficulty: this.calculateDifficulty(wave)
        });

        this.gameState.waveTimer = 0;

        console.log(`[Oleada] Oleada ${wave} generada con ${enemyCount} enemigos`);
    }

    calculateDifficulty(wave = this.gameState.wave) {
        return {
            speed: 1 + (wave * 0.1),
            health: 1 + (wave * 0.15),
            damage: 1 + (wave * 0.12)
        };
    }

    calculateLPM() {
        this.gameState.likesPerMinute = this.gameState.likesCurrentMinute;
        this.gameState.likesCurrentMinute = 0;
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

        console.log(`[MegaPet] ACTIVADA por ${donorName} por ${duration}ms`);
    }

    endMegaPetMode() {
        this.gameState.isMegaPetActive = false;
        this.io.emit('megaPet:deactivate', {});
        console.log('[MegaPet] Desactivada');
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════╗
║           🐾 PET BATTLE ARENA - SERVIDOR 🐾             ║
╠═══════════════════════════════════════════════════════════╣
║  Estado: EJECUTÁNDOSE                                  ║
║  Puerto: ${this.port}                                              ║
║  Modo: TIKTOK LIVE                                     ║
║  Web:  http://localhost:${this.port}                           ║
╚═══════════════════════════════════════════════════════════╝
            `);
        });
    }

    setupProcessHandlers() {
        const shutdown = (signal) => {
            this.shutdown(signal);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }

    shutdown(signal) {
        if (this.isShuttingDown) {
            return;
        }
        this.isShuttingDown = true;
        console.log(`[Servidor] Apagando por ${signal}...`);

        if (this.tickInterval) clearInterval(this.tickInterval);
        if (this.waveIntervalRef) clearInterval(this.waveIntervalRef);
        if (this.lpmIntervalRef) clearInterval(this.lpmIntervalRef);

        if (this.tiktokConnector) {
            this.tiktokConnector.disconnect();
        }

        this.io.close(() => {
            this.server.close(() => {
                console.log('[Servidor] Apagado limpio completado');
                process.exit(0);
            });
        });
    }
}

// Iniciar servidor
const server = new PetBattleArenaServer();
server.start();
