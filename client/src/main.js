/**
 * PET BATTLE ARENA - Punto de Entrada Principal del Cliente
 * Phaser.js + Socket.IO Client
 */

import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';

const CONFIG = {
    serverUrl: window.location.origin,
    gameWidth: 1920,
    gameHeight: 1080,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

let socket = null;
let game = null;
let demoPetInterval = null;
let demoLikesInterval = null;
let demoGiftInterval = null;
let megaPetCountdownInterval = null;

const GameState = {
    pets: new Map(),
    wave: 1,
    likesPerMinute: 0,
    totalLikes: 0,
    totalGifts: 0,
    isMegaPetActive: false,
    maxPets: 200,
    tiktokConnected: false,
    tiktokUsername: '',

    sync(state) {
        const serverPetIds = new Set(state.pets.map((p) => p.id));
        for (const [id] of this.pets) {
            if (!serverPetIds.has(id)) {
                this.pets.delete(id);
            }
        }
        for (const petData of state.pets) {
            this.pets.set(petData.id, petData);
        }

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
    }
};

function connectToServer() {
    return new Promise((resolve, reject) => {
        let settled = false;

        socket = io(CONFIG.serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10
        });

        socket.on('connect', () => {
            updateConnectionStatus(true);
            if (!settled) {
                settled = true;
                resolve(socket);
            }
        });

        socket.on('disconnect', () => {
            updateConnectionStatus(false);
        });

        socket.on('connect_error', (error) => {
            updateConnectionStatus(false);
            if (!settled) {
                settled = true;
                reject(error);
            }
        });

        socket.on('game:init', (state) => {
            GameState.sync(state);
            syncSceneWithState();
            updateUI(state);
        });

        socket.on('game:update', (state) => {
            GameState.sync(state);
            syncSceneWithState();
            updateUI(state);
        });

        socket.on('pet:added', (pet) => {
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
            if (GameScene.instance) {
                GameScene.instance.spawnWave(data);
            }
        });

        socket.on('megaPet:activate', (data) => {
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
            if (GameScene.instance) {
                GameScene.instance.showUpgradeEffect(data);
            }
        });

        socket.on('event:follow', (data) => {
            if (GameScene.instance) {
                GameScene.instance.showFloatingText(
                    260,
                    160 + (Math.random() * 60),
                    data.message,
                    0xff69b4
                );
            }
        });

        socket.on('event:chat', (data) => {
            if (GameScene.instance) {
                GameScene.instance.showFloatingText(
                    320,
                    220 + (Math.random() * 80),
                    `${data.username}: ${data.text}`,
                    0x00ffff
                );
            }
        });
    });
}

function syncSceneWithState() {
    if (!GameScene.instance) return;

    const scene = GameScene.instance;
    const renderedPetIds = new Set(
        scene.pets.getChildren()
            .map((pet) => pet?.petData?.id)
            .filter(Boolean)
    );

    for (const pet of GameState.pets.values()) {
        if (!renderedPetIds.has(pet.id)) {
            scene.spawnPet(pet);
        }
    }

    for (const renderedPetId of renderedPetIds) {
        if (!GameState.pets.has(renderedPetId)) {
            scene.removePet(renderedPetId);
        }
    }
}

function updateUI(state) {
    const waveEl = document.getElementById('wave-number');
    if (waveEl) waveEl.textContent = String(state.wave);

    const scene = GameScene.instance;
    const localPetCount = scene ? scene.pets.getChildren().filter((p) => p.active).length : GameState.pets.size;
    const localEnemyCount = scene ? scene.enemies.getChildren().filter((e) => e.active).length : 0;

    const petCountEl = document.getElementById('pet-count');
    if (petCountEl) petCountEl.textContent = String(localPetCount);

    const enemyCountEl = document.getElementById('enemy-count');
    if (enemyCountEl) enemyCountEl.textContent = String(localEnemyCount);

    const giftCountEl = document.getElementById('gift-count');
    if (giftCountEl) giftCountEl.textContent = String(state.totalGifts);

    const activePetsEl = document.getElementById('active-pets');
    if (activePetsEl) activePetsEl.textContent = String(localPetCount);

    const maxPetsEl = document.getElementById('max-pets');
    if (maxPetsEl) maxPetsEl.textContent = String(state.maxPets);

    const likesFillEl = document.getElementById('likes-fill');
    if (likesFillEl) {
        const percentage = Math.min((state.likesPerMinute / 200) * 100, 100);
        likesFillEl.style.width = `${percentage}%`;
    }

    const lpmEl = document.getElementById('lpm-value');
    if (lpmEl) lpmEl.textContent = String(state.likesPerMinute);
}

function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connection-status');
    if (statusEl) {
        statusEl.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
        statusEl.textContent = connected ? '⚡ Conectado al servidor' : '⚡ Desconectado';
    }
}

function showMegaPetBanner(data) {
    const banner = document.getElementById('mega-pet-banner');
    const donor = document.getElementById('mega-pet-donor');
    const timer = document.getElementById('mega-pet-timer');
    if (!banner || !donor || !timer) return;

    donor.textContent = data.donorName;
    banner.classList.add('active');

    if (megaPetCountdownInterval) {
        clearInterval(megaPetCountdownInterval);
        megaPetCountdownInterval = null;
    }

    let remaining = Math.ceil((data.duration || 30000) / 1000);
    timer.textContent = String(remaining);

    megaPetCountdownInterval = setInterval(() => {
        remaining -= 1;
        timer.textContent = String(Math.max(remaining, 0));
        if (remaining <= 0) {
            clearInterval(megaPetCountdownInterval);
            megaPetCountdownInterval = null;
        }
    }, 1000);
}

function hideMegaPetBanner() {
    const banner = document.getElementById('mega-pet-banner');
    if (banner) {
        banner.classList.remove('active');
    }
    if (megaPetCountdownInterval) {
        clearInterval(megaPetCountdownInterval);
        megaPetCountdownInterval = null;
    }
}

function clearDemoLoop() {
    if (demoPetInterval) clearInterval(demoPetInterval);
    if (demoLikesInterval) clearInterval(demoLikesInterval);
    if (demoGiftInterval) clearInterval(demoGiftInterval);
    demoPetInterval = null;
    demoLikesInterval = null;
    demoGiftInterval = null;
}

function startDemoLoop() {
    clearDemoLoop();
    if (!socket) return;

    const petTypes = ['gato', 'perro', 'dragon', 'conejo'];

    demoPetInterval = setInterval(() => {
        const type = petTypes[Math.floor(Math.random() * petTypes.length)];
        socket.emit('demo:spawn', {
            owner: 'demo_user',
            type
        });
    }, 2500);

    demoLikesInterval = setInterval(() => {
        socket.emit('likes:add', 5 + Math.floor(Math.random() * 20));
    }, 3000);

    demoGiftInterval = setInterval(() => {
        if (Math.random() > 0.35) return;
        socket.emit('gift:send', {
            username: 'demo_user',
            giftName: 'Demo Gift',
            giftCount: 1,
            diamondCount: 100 + Math.floor(Math.random() * 800)
        });
    }, 12000);
}

window.hydrateSceneFromState = () => {
    syncSceneWithState();
};

window.initGame = async function() {
    try {
        await connectToServer();

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

        if (window.isDemoMode) {
            startDemoLoop();
        }
    } catch (error) {
        console.error('[Juego] Error al inicializar:', error);
        alert('Error al conectar con el servidor. Por favor recarga la página.');
    }
};

window.addEventListener('resize', () => {
    if (game) {
        game.scale.refresh();
    }
});

window.addEventListener('beforeunload', () => {
    clearDemoLoop();
    if (socket) {
        socket.disconnect();
    }
});
