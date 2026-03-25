/**
 * PET BATTLE ARENA - Main Client Entry Point
 * Phaser.js + Socket.IO Client
 */

// Game Configuration
const CONFIG = {
    serverUrl: window.location.origin,
    gameWidth: 1920,
    gameHeight: 1080,
    physics: {
        arcade: {
            debug: false
        }
    }
};

// Import scenes
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';

// Socket.IO connection
let socket = null;

// Game instance
let game = null;

// Connect to server
function connectToServer() {
    return new Promise((resolve, reject) => {
        socket = io(CONFIG.serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10
        });

        // Connection events
        socket.on('connect', () => {
            console.log('[Socket] Connected to server');
            updateConnectionStatus(true);
            resolve(socket);
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected from server');
            updateConnectionStatus(false);
        });

        socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error);
            updateConnectionStatus(false);
            reject(error);
        });

        // Game events
        socket.on('game:init', (state) => {
            console.log('[Game] Initial state received', state);
            GameState.sync(state);
        });

        socket.on('game:update', (state) => {
            GameState.sync(state);
            updateUI(state);
        });

        socket.on('pet:added', (pet) => {
            console.log('[Pet] Added:', pet);
            GameState.addPet(pet);
            if (GameScene.instance) {
                GameScene.instance.spawnPet(pet);
            }
        });

        socket.on('pet:removed', (data) => {
            GameState.removePet(data.id);
            if (GameScene.instance) {
                GameScene.instance.removePet(data.id);
            }
        });

        socket.on('wave:spawn', (data) => {
            console.log('[Wave] Spawning:', data);
            if (GameScene.instance) {
                GameScene.instance.spawnWave(data);
            }
        });

        socket.on('megaPet:activate', (data) => {
            console.log('[MegaPet] Activated by:', data.donorName);
            if (GameScene.instance) {
                GameScene.instance.activateMegaPet(data);
            }
            showMegaPetBanner(data);
        });

        socket.on('megaPet:deactivate', () => {
            if (GameScene.instance) {
                GameScene.instance.deactivateMegaPet();
            }
            hideMegaPetBanner();
        });

        socket.on('pets:upgrade', (data) => {
            console.log('[Pets] All upgraded:', data);
            if (GameScene.instance) {
                GameScene.instance.showUpgradeEffect(data);
            }
        });

        socket.on('event:follow', (data) => {
            console.log('[Follow]', data.username);
            if (GameScene.instance) {
                GameScene.instance.showFloatingText(data.username, data.message, 0xff69b4);
            }
        });

        socket.on('event:chat', (data) => {
            console.log('[Chat]', data.username, ':', data.text);
            if (GameScene.instance) {
                GameScene.instance.showFloatingText(100, 100, `${data.username}: ${data.text}`, 0x00ffff);
            }
        });
    });
}

// Game State Management
const GameState = {
    pets: new Map(),
    enemies: new Map(),
    wave: 1,
    likesPerMinute: 0,
    totalLikes: 0,
    totalGifts: 0,
    isMegaPetActive: false,
    maxPets: 200,
    tiktokConnected: false,
    tiktokUsername: '',

    sync(state) {
        // Sync pets
        const serverPetIds = new Set(state.pets.map(p => p.id));
        
        // Remove pets that no longer exist
        for (const [id] of this.pets) {
            if (!serverPetIds.has(id)) {
                this.pets.delete(id);
            }
        }

        // Update or add pets
        for (const petData of state.pets) {
            this.pets.set(petData.id, petData);
        }

        // Sync enemies
        const serverEnemyIds = new Set(state.enemies.map(e => e.id));
        for (const [id] of this.enemies) {
            if (!serverEnemyIds.has(id)) {
                this.enemies.delete(id);
            }
        }
        for (const enemyData of state.enemies) {
            this.enemies.set(enemyData.id, enemyData);
        }

        // Sync other state
        this.wave = state.wave;
        this.likesPerMinute = state.likesPerMinute;
        this.totalLikes = state.totalLikes;
        this.totalGifts = state.totalGifts;
        this.isMegaPetActive = state.isMegaPetActive;
        this.maxPets = state.maxPets;
        this.tiktokConnected = state.tiktokConnected;
        this.tiktokUsername = state.tiktokUsername;
    },

    addPet(pet) {
        this.pets.set(pet.id, pet);
    },

    removePet(id) {
        this.pets.delete(id);
    },

    getPets() {
        return Array.from(this.pets.values());
    },

    getEnemies() {
        return Array.from(this.enemies.values());
    }
};

// UI Updates
function updateUI(state) {
    // Update wave number
    const waveEl = document.getElementById('wave-number');
    if (waveEl) waveEl.textContent = state.wave;

    // Update pet count
    const petCountEl = document.getElementById('pet-count');
    if (petCountEl) petCountEl.textContent = state.pets.length;

    // Update enemy count
    const enemyCountEl = document.getElementById('enemy-count');
    if (enemyCountEl) enemyCountEl.textContent = state.enemies.length;

    // Update gift count
    const giftCountEl = document.getElementById('gift-count');
    if (giftCountEl) giftCountEl.textContent = state.totalGifts;

    // Update active pets
    const activePetsEl = document.getElementById('active-pets');
    if (activePetsEl) activePetsEl.textContent = state.pets.length;

    // Update max pets
    const maxPetsEl = document.getElementById('max-pets');
    if (maxPetsEl) maxPetsEl.textContent = state.maxPets;

    // Update likes bar (LPM to percentage, max 200 LPM = 100%)
    const likesFillEl = document.getElementById('likes-fill');
    if (likesFillEl) {
        const percentage = Math.min((state.likesPerMinute / 200) * 100, 100);
        likesFillEl.style.width = percentage + '%';
    }

    // Update LPM value
    const lpmEl = document.getElementById('lpm-value');
    if (lpmEl) lpmEl.textContent = state.likesPerMinute;
}

function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connection-status');
    if (statusEl) {
        statusEl.className = 'connection-status ' + (connected ? 'connected' : 'disconnected');
        statusEl.textContent = connected ? '⚡ Conectado al servidor' : '⚡ Desconectado';
    }
}

function showMegaPetBanner(data) {
    const banner = document.getElementById('mega-pet-banner');
    const donor = document.getElementById('mega-pet-donor');
    const timer = document.getElementById('mega-pet-timer');
    
    if (banner && donor && timer) {
        donor.textContent = data.donorName;
        banner.classList.add('active');
        
        // Start countdown
        let remaining = Math.ceil((data.duration || 30000) / 1000);
        timer.textContent = remaining;
        
        const countdown = setInterval(() => {
            remaining--;
            timer.textContent = remaining;
            if (remaining <= 0) {
                clearInterval(countdown);
            }
        }, 1000);
    }
}

function hideMegaPetBanner() {
    const banner = document.getElementById('mega-pet-banner');
    if (banner) {
        banner.classList.remove('active');
    }
}

// Initialize game (called from HTML after TikTok connection)
window.initGame = async function() {
    console.log('[Game] Initializing PET BATTLE ARENA...');

    try {
        // Connect to Socket.IO server
        await connectToServer();
        console.log('[Socket] Connected successfully');

        // Create Phaser game
        game = new Phaser.Game({
            type: Phaser.AUTO,
            width: CONFIG.gameWidth,
            height: CONFIG.gameHeight,
            parent: 'game-container',
            backgroundColor: '#0a0a0f',
            physics: CONFIG.physics,
            scene: [BootScene, GameScene, UIScene],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        });

        console.log('[Game] Phaser initialized');
    } catch (error) {
        console.error('[Game] Failed to initialize:', error);
        alert('Error al conectar con el servidor. Por favor recarga la página.');
    }
};

// Handle window resize
window.addEventListener('resize', () => {
    if (game) {
        game.scale.refresh();
    }
});

// Auto-initialize if already connected to TikTok
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOM ready - waiting for TikTok connection...');
});
