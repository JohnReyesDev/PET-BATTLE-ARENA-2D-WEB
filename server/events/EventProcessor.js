/**
 * Event Processor
 * Processes TikTok events and converts them to game actions
 */

class EventProcessor {
    constructor(server) {
        this.server = server;
        
        // Pet type configurations
        this.petTypes = {
            'gato': {
                name: 'Gato',
                hp: 80,
                damage: 15,
                speed: 12,
                color: 0xFF6B9D,  // Pink
                emoji: '🐱',
                scale: 1.0
            },
            'perro': {
                name: 'Perro',
                hp: 120,
                damage: 20,
                speed: 8,
                color: 0xC4A484,  // Brown
                emoji: '🐕',
                scale: 1.2
            },
            'dragon': {
                name: 'Dragón',
                hp: 200,
                damage: 40,
                speed: 5,
                color: 0xFF4500,  // Red-Orange
                emoji: '🐉',
                scale: 1.5,
                special: 'fire'
            },
            'conejo': {
                name: 'Conejo',
                hp: 50,
                damage: 8,
                speed: 15,
                color: 0xFFFFFF,  // White
                emoji: '🐰',
                scale: 0.8
            }
        };

        // Cooldown tracking per user
        this.userCooldowns = new Map();
        this.GLOBAL_COOLDOWN = 1000; // 1 second between spawns per user
    }

    generatePetId() {
        return `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    checkCooldown(userId) {
        const lastSpawn = this.userCooldowns.get(userId);
        if (lastSpawn && (Date.now() - lastSpawn) < this.GLOBAL_COOLDOWN) {
            return false;
        }
        this.userCooldowns.set(userId, Date.now());
        return true;
    }

    processComment(comment) {
        const { username, text, nickname } = comment;
        
        // Normalize text
        const normalizedText = text.toLowerCase().trim();

        // Check for pet type triggers
        for (const [trigger, config] of Object.entries(this.petTypes)) {
            if (normalizedText.includes(trigger)) {
                if (this.checkCooldown(username)) {
                    this.spawnPet({
                        owner: username,
                        ownerName: nickname,
                        type: trigger,
                        ...config
                    });
                    console.log(`[Event] ${nickname} spawned a ${config.name}!`);
                }
                return;
            }
        }

        // Check for emoji triggers
        if (text.includes('🔥')) {
            this.spawnPet({
                owner: username,
                ownerName: nickname,
                type: 'dragon',
                ...this.petTypes['dragon']
            });
        } else if (text.includes('🐱') || text.includes('😺')) {
            this.spawnPet({
                owner: username,
                ownerName: nickname,
                type: 'gato',
                ...this.petTypes['gato']
            });
        } else if (text.includes('🐕') || text.includes('🐶')) {
            this.spawnPet({
                owner: username,
                ownerName: nickname,
                type: 'perro',
                ...this.petTypes['perro']
            });
        } else if (text.includes('🐰') || text.includes('🐇')) {
            this.spawnPet({
                owner: username,
                ownerName: nickname,
                type: 'conejo',
                ...this.petTypes['conejo']
            });
        }
    }

    processPetSpawn(data) {
        // Handle pet spawns from Socket.IO (demo mode)
        const { owner, type } = data;
        
        if (this.petTypes[type]) {
            this.spawnPet({
                owner: owner || 'demo_user',
                ownerName: owner || 'Demo User',
                type: type,
                ...this.petTypes[type]
            });
        }
    }

    spawnPet(config) {
        const id = this.generatePetId();
        
        const pet = {
            id: id,
            owner: config.owner,
            ownerName: config.ownerName,
            type: config.type,
            name: config.name,
            hp: config.hp,
            maxHp: config.hp,
            damage: config.damage,
            speed: config.speed,
            color: config.color,
            emoji: config.emoji,
            scale: config.scale,
            special: config.special || null,
            level: 1,
            xp: 0,
            // Position will be set by client
            x: 0,
            y: 0,
            createdAt: Date.now(),
            // Combat stats
            attackCooldown: 0,
            targetId: null,
            isAttacking: false,
            isDead: false
        };

        this.server.addPet(pet);
        return pet;
    }

    processGift(gift) {
        const { username, nickname, giftName, giftCount, diamondCount, isViralGift } = gift;

        // Update gift total
        this.server.gameState.totalGifts += diamondCount;

        console.log(`[Gift] ${nickname} sent ${giftCount}x ${giftName} (${diamondCount} diamonds)`);

        // Tier-based effects
        if (isViralGift) {
            // MEGA PET ACTIVATION
            this.server.activateMegaPet(nickname, 30000);
            return;
        }

        if (diamondCount >= 500) {
            // Major gift - spawn 3 pets at once
            const types = ['gato', 'perro', 'dragon'];
            types.forEach(type => {
                this.spawnPet({
                    owner: username,
                    ownerName: nickname,
                    type: type,
                    ...this.petTypes[type]
                });
            });
            
            // Upgrade all existing pets
            this.upgradeAllPets(2);
        } else if (diamondCount >= 100) {
            // Minor gift - spawn 2 pets
            const types = ['gato', 'perro'];
            types.forEach(type => {
                this.spawnPet({
                    owner: username,
                    ownerName: nickname,
                    type: type,
                    ...this.petTypes[type]
                });
            });
        } else {
            // Micro gift - spawn 1 pet
            this.spawnPet({
                owner: username,
                ownerName: nickname,
                type: 'gato',
                ...this.petTypes['gato']
            });
        }
    }

    processLikes(count) {
        this.server.gameState.totalLikes += count;
        
        // Every 50 likes, upgrade all pets slightly
        const likesMod = this.server.gameState.totalLikes % 50;
        if (likesMod < count) {
            this.upgradeAllPets(1);
            console.log(`[Likes] Pet upgrade triggered at ${this.server.gameState.totalLikes} total likes`);
        }

        // Update LPM
        this.server.gameState.likesPerMinute += count;
    }

    processFollow(subscriber) {
        // Follow gives a small HP boost to all pets
        console.log(`[Follow] ${subscriber.nickname} followed!`);
        
        this.server.io.emit('event:follow', {
            username: subscriber.nickname,
            message: `${subscriber.nickname} se unió como follower! 💜`
        });
    }

    processShare(sharer) {
        // Share spawns a special rainbow pet
        console.log(`[Share] ${sharer.username} shared the stream!`);
        
        this.spawnPet({
            owner: sharer.username,
            ownerName: sharer.username,
            type: 'conejo',
            name: 'Conejo Arcoíris',
            hp: 30,
            damage: 5,
            speed: 20,
            color: 0xFF69B4, // Rainbow pink
            emoji: '🌈',
            scale: 0.6
        });
    }

    upgradeAllPets(levels) {
        const pets = Array.from(this.server.gameState.pets.values());
        
        pets.forEach(pet => {
            pet.level += levels;
            pet.hp += levels * 10;
            pet.maxHp += levels * 10;
            pet.damage += levels * 5;
        });

        this.server.io.emit('pets:upgrade', {
            levelsGained: levels,
            petCount: pets.length
        });
    }
}

module.exports = EventProcessor;
