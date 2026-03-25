/**
 * Game Scene
 * Main game logic - combat, spawning, particles
 */

import { GAME_CONFIG } from '../config/GameConfig.js';
import { ObjectPool } from '../systems/ObjectPool.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { WaveSystem } from '../systems/WaveSystem.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        GameScene.instance = this;
    }

    create() {
        console.log('[GameScene] Starting...');

        // Initialize systems
        this.objectPool = new ObjectPool(this);
        this.combatSystem = new CombatSystem(this);
        this.particleSystem = new ParticleSystem(this);
        this.waveSystem = new WaveSystem(this);

        // Create game world
        this.createWorld();

        // Entity groups
        this.pets = this.add.group();
        this.enemies = this.add.group();
        this.projectiles = this.add.group();

        // Mega Pet state
        this.isMegaPetActive = false;
        this.megaPetSprite = null;
        this.fusedPets = [];

        // Create background effects
        this.createBackground();

        // Start game loop
        this.lastUpdate = 0;
        this.gameTime = 0;

        console.log('[GameScene] Ready');
    }

    createWorld() {
        const { width, height } = this.cameras.main;

        // Arena boundaries (invisible walls)
        this.physics.world.setBounds(50, 50, width - 100, height - 100);

        // Arena floor with grid pattern
        const graphics = this.add.graphics();
        
        // Dark background
        graphics.fillStyle(0x0a0a0f, 1);
        graphics.fillRect(0, 0, width, height);

        // Grid lines
        graphics.lineStyle(1, 0x1a1a2e, 0.5);
        const gridSize = 50;
        
        for (let x = 0; x < width; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }
        for (let y = 0; y < height; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }
        graphics.strokePath();

        // Arena border glow
        graphics.lineStyle(4, 0x00ffff, 0.3);
        graphics.strokeRect(50, 50, width - 100, height - 100);

        // Corner decorations
        const corners = [
            { x: 50, y: 50 },
            { x: width - 50, y: 50 },
            { x: 50, y: height - 50 },
            { x: width - 50, y: height - 50 }
        ];

        corners.forEach(corner => {
            graphics.fillStyle(0x00ffff, 0.5);
            graphics.fillCircle(corner.x, corner.y, 10);
        });
    }

    createBackground() {
        const { width, height } = this.cameras.main;

        // Ambient floating particles
        this.ambientParticles = [];
        for (let i = 0; i < 30; i++) {
            const particle = this.add.circle(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 3 + 1,
                0xffffff,
                0.1 + Math.random() * 0.2
            );
            
            this.tweens.add({
                targets: particle,
                y: particle.y - 50 - Math.random() * 100,
                alpha: 0,
                duration: 3000 + Math.random() * 2000,
                repeat: -1,
                yoyo: false,
                onRepeat: () => {
                    particle.x = Math.random() * width;
                    particle.y = height + 20;
                    particle.alpha = 0.1 + Math.random() * 0.2;
                }
            });
        }
    }

    update(time, delta) {
        this.gameTime += delta;
        this.lastUpdate = time;

        // Update all systems
        this.combatSystem.update(delta);
        this.waveSystem.update(delta);
        this.particleSystem.update(delta);

        // Update pet AI
        this.pets.getChildren().forEach(pet => {
            if (pet.active && pet.alive) {
                this.updatePetAI(pet, delta);
            }
        });

        // Update enemies
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active && enemy.alive) {
                this.updateEnemyAI(enemy, delta);
            }
        });

        // Update mega pet
        if (this.isMegaPetActive && this.megaPetSprite) {
            this.updateMegaPet(delta);
        }
    }

    updatePetAI(pet, delta) {
        // Find nearest enemy
        let nearestEnemy = null;
        let nearestDist = Infinity;

        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active && enemy.alive) {
                const dist = Phaser.Math.Distance.Between(
                    pet.x, pet.y, enemy.x, enemy.y
                );
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            }
        });

        // Movement and attack
        if (nearestEnemy) {
            const attackRange = pet.petData.type === 'dragon' ? 150 : 80;
            
            if (nearestDist > attackRange) {
                // Move toward enemy
                const angle = Phaser.Math.Angle.Between(
                    pet.x, pet.y, nearestEnemy.x, nearestEnemy.y
                );
                
                const speed = pet.petData.speed * (delta / 1000) * 60;
                pet.x += Math.cos(angle) * speed;
                pet.y += Math.sin(angle) * speed;
                
                // Face enemy
                pet.setFlipX(Math.cos(angle) < 0);
            } else {
                // Attack
                if (pet.attackCooldown <= 0) {
                    this.combatSystem.petAttack(pet, nearestEnemy);
                    pet.attackCooldown = 500; // 0.5s cooldown
                }
            }
        } else {
            // Wander
            this.wanderPet(pet, delta);
        }

        // Update cooldown
        pet.attackCooldown -= delta;
    }

    wanderPet(pet, delta) {
        // Random movement when no enemies
        if (!pet.wanderTimer || pet.wanderTimer <= 0) {
            pet.wanderDirection = Math.random() * Math.PI * 2;
            pet.wanderTimer = 1000 + Math.random() * 2000;
        }
        
        const speed = pet.petData.speed * 0.3 * (delta / 1000) * 60;
        pet.x += Math.cos(pet.wanderDirection) * speed;
        pet.y += Math.sin(pet.wanderDirection) * speed;
        pet.wanderTimer -= delta;

        // Keep in bounds
        const { width, height } = this.cameras.main;
        pet.x = Phaser.Math.Clamp(pet.x, 100, width - 100);
        pet.y = Phaser.Math.Clamp(pet.y, 100, height - 100);
    }

    updateEnemyAI(enemy, delta) {
        // Find nearest pet
        let nearestPet = null;
        let nearestDist = Infinity;

        this.pets.getChildren().forEach(pet => {
            if (pet.active && pet.alive) {
                const dist = Phaser.Math.Distance.Between(
                    enemy.x, enemy.y, pet.x, pet.y
                );
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestPet = pet;
                }
            }
        });

        // Move and attack
        if (nearestPet) {
            const attackRange = 60;
            
            if (nearestDist > attackRange) {
                const angle = Phaser.Math.Angle.Between(
                    enemy.x, enemy.y, nearestPet.x, nearestPet.y
                );
                
                const speed = enemy.enemyData.speed * (delta / 1000) * 60;
                enemy.x += Math.cos(angle) * speed;
                enemy.y += Math.sin(angle) * speed;
                enemy.setFlipX(Math.cos(angle) < 0);
            } else {
                if (enemy.attackCooldown <= 0) {
                    this.combatSystem.enemyAttack(enemy, nearestPet);
                    enemy.attackCooldown = 800;
                }
            }
        }

        enemy.attackCooldown -= delta;
    }

    updateMegaPet(delta) {
        // Mega pet moves toward enemies and attacks all in range
        if (!this.megaPetSprite) return;

        let nearestEnemy = null;
        let nearestDist = Infinity;

        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active && enemy.alive) {
                const dist = Phaser.Math.Distance.Between(
                    this.megaPetSprite.x, this.megaPetSprite.y,
                    enemy.x, enemy.y
                );
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            }
        });

        if (nearestEnemy && nearestDist > 200) {
            const angle = Phaser.Math.Angle.Between(
                this.megaPetSprite.x, this.megaPetSprite.y,
                nearestEnemy.x, nearestEnemy.y
            );
            
            const speed = 8 * (delta / 1000) * 60;
            this.megaPetSprite.x += Math.cos(angle) * speed;
            this.megaPetSprite.y += Math.sin(angle) * speed;
        }

        // Mass attack effect
        if (this.megaPetAttackTimer <= 0) {
            this.megaPetMassAttack();
            this.megaPetAttackTimer = 300;
        }
        this.megaPetAttackTimer -= delta;

        // Pulse effect
        const scale = 1 + Math.sin(this.gameTime * 0.01) * 0.1;
        this.megaPetSprite.setScale(scale);
    }

    megaPetMassAttack() {
        if (!this.megaPetSprite) return;

        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active && enemy.alive) {
                const dist = Phaser.Math.Distance.Between(
                    this.megaPetSprite.x, this.megaPetSprite.y,
                    enemy.x, enemy.y
                );
                
                if (dist < 300) {
                    // Damage based on distance
                    const damage = Math.floor(50 * (1 - dist / 300));
                    enemy.enemyData.hp -= damage;
                    
                    // Visual feedback
                    this.particleSystem.explosion(enemy.x, enemy.y, 0xff00ff);
                    this.tweens.add({
                        targets: enemy,
                        alpha: 0.5,
                        duration: 100,
                        yoyo: true
                    });
                }
            }
        });
    }

    // Public methods for spawning
    spawnPet(petData) {
        const { width, height } = this.cameras.main;
        
        // Random spawn position
        const x = 100 + Math.random() * (width - 200);
        const y = 100 + Math.random() * (height - 200);

        // Create sprite
        const sprite = this.add.sprite(x, y, `pet_${petData.type}`);
        sprite.setScale(petData.scale || 1);
        sprite.setDepth(10);

        // Add health bar
        const hpBar = this.add.graphics();
        hpBar.setDepth(11);

        // Store pet data
        sprite.petData = petData;
        sprite.alive = true;
        sprite.attackCooldown = 0;
        sprite.wanderTimer = 0;

        // Owner name
        const nameText = this.add.text(x, y - 30, petData.ownerName, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        nameText.setOrigin(0.5);
        nameText.setDepth(12);
        sprite.nameText = nameText;

        // Level indicator
        const levelText = this.add.text(x + 20, y - 20, `Lv${petData.level}`, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 1
        });
        levelText.setOrigin(0.5);
        levelText.setDepth(12);
        sprite.levelText = levelText;

        // Physics body
        this.physics.add.existing(sprite);
        sprite.body.setCircle(20);
        sprite.body.setCollideWorldBounds(true);

        // Add to group
        this.pets.add(sprite);

        // Spawn effect
        this.particleSystem.burst(x, y, petData.color, 10);

        // Floating text
        this.showFloatingText(x, y - 50, `+${petData.name}`, petData.color);

        return sprite;
    }

    removePet(petId) {
        this.pets.getChildren().forEach(pet => {
            if (pet.petData && pet.petData.id === petId) {
                // Death effect
                this.particleSystem.explosion(pet.x, pet.y, 0xff0000, 20);
                
                // Remove name text
                if (pet.nameText) pet.nameText.destroy();
                if (pet.levelText) pet.levelText.destroy();
                
                pet.destroy();
            }
        });
    }

    spawnWave(waveData) {
        this.waveSystem.spawnWave(waveData, this);
    }

    spawnEnemy(enemyData) {
        const { width, height } = this.cameras.main;
        
        // Spawn from edges
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch (side) {
            case 0: x = Math.random() * width; y = -30; break;
            case 1: x = width + 30; y = Math.random() * height; break;
            case 2: x = Math.random() * width; y = height + 30; break;
            case 3: x = -30; y = Math.random() * height; break;
        }

        const typeIndex = Math.min(Math.floor(enemyData.difficulty / 2), 3);
        const sprite = this.add.sprite(x, y, `enemy_${typeIndex}`);
        sprite.setScale(0.8 + Math.random() * 0.4);
        sprite.setDepth(5);
        sprite.setTint(0xff6666);

        sprite.enemyData = {
            hp: Math.floor(50 * enemyData.difficulty.health),
            maxHp: Math.floor(50 * enemyData.difficulty.health),
            damage: Math.floor(10 * enemyData.difficulty.damage),
            speed: 2 + enemyData.difficulty.speed
        };
        sprite.alive = true;
        sprite.attackCooldown = 0;

        // Health bar
        const hpBarBg = this.add.graphics();
        hpBarBg.fillStyle(0x333333, 1);
        hpBarBg.fillRect(x - 25, y - 25, 50, 6);
        hpBarBg.setDepth(6);

        const hpBarFill = this.add.graphics();
        hpBarFill.setDepth(6);
        sprite.hpBar = hpBarFill;
        sprite.hpBarBg = hpBarBg;

        this.enemies.add(sprite);

        // Spawn effect
        this.particleSystem.burst(x, y, 0xff0000, 5);

        return sprite;
    }

    activateMegaPet(data) {
        this.isMegaPetActive = true;
        this.megaPetAttackTimer = 0;

        const { width, height } = this.cameras.main;
        
        // Create mega pet at center
        this.megaPetSprite = this.add.sprite(width / 2, height / 2, 'mega_pet');
        this.megaPetSprite.setScale(2);
        this.megaPetSprite.setDepth(100);
        this.megaPetSprite.setAlpha(0);

        // Fade in
        this.tweens.add({
            targets: this.megaPetSprite,
            alpha: 1,
            scale: 2.5,
            duration: 1000,
            ease: 'Back.easeOut'
        });

        // Particle storm
        this.particleSystem.megaPetActivation(width / 2, height / 2);

        // Hide fused pets temporarily
        this.fusedPets = [];
        this.pets.getChildren().forEach(pet => {
            if (pet.active) {
                this.fusedPets.push(pet);
                this.tweens.add({
                    targets: [pet, pet.nameText, pet.levelText],
                    alpha: 0,
                    duration: 500
                });
            }
        });

        // Sound effect placeholder
        console.log('[MegaPet] Sound effect would play here');
    }

    deactivateMegaPet() {
        this.isMegaPetActive = false;

        if (this.megaPetSprite) {
            // Fade out and destroy
            this.tweens.add({
                targets: this.megaPetSprite,
                alpha: 0,
                scale: 0,
                duration: 500,
                onComplete: () => {
                    this.megaPetSprite.destroy();
                    this.megaPetSprite = null;
                }
            });
        }

        // Restore pets
        this.fusedPets.forEach(pet => {
            this.tweens.add({
                targets: [pet, pet.nameText, pet.levelText],
                alpha: 1,
                duration: 500
            });
        });
    }

    showUpgradeEffect(data) {
        this.pets.getChildren().forEach(pet => {
            if (pet.active && pet.alive) {
                this.particleSystem.burst(pet.x, pet.y, 0xffff00, 5);
                
                // Level up text
                const levelUpText = this.add.text(pet.x, pet.y - 40, `↑ Lv${pet.petData.level}`, {
                    fontSize: '16px',
                    fontFamily: 'Arial Black',
                    color: '#ffff00',
                    stroke: '#000000',
                    strokeThickness: 2
                });
                levelUpText.setOrigin(0.5);
                levelUpText.setDepth(50);

                this.tweens.add({
                    targets: levelUpText,
                    y: pet.y - 80,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => levelUpText.destroy()
                });
            }
        });
    }

    showFloatingText(x, y, text, color = 0xffffff) {
        const floatText = this.add.text(x, y, text, {
            fontSize: '18px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        floatText.setOrigin(0.5);
        floatText.setDepth(100);

        this.tweens.add({
            targets: floatText,
            y: y - 50,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => floatText.destroy()
        });
    }

    // Called when enemy dies
    onEnemyDeath(enemy) {
        // Update health bar reference
        if (enemy.hpBar) enemy.hpBar.destroy();
        if (enemy.hpBarBg) enemy.hpBarBg.destroy();
        
        // Explosion effect
        this.particleSystem.explosion(enemy.x, enemy.y, 0xff0000, 15);
        
        // Remove
        this.time.delayedCall(100, () => {
            enemy.destroy();
        });
    }

    // Called when pet takes damage
    onPetDamaged(pet, damage) {
        // Flash red
        this.tweens.add({
            targets: pet,
            tint: 0xff0000,
            duration: 50,
            yoyo: true
        });

        // Damage number
        const dmgText = this.add.text(pet.x, pet.y - 20, `-${damage}`, {
            fontSize: '14px',
            fontFamily: 'Arial Black',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 2
        });
        dmgText.setOrigin(0.5);
        dmgText.setDepth(50);

        this.tweens.add({
            targets: dmgText,
            y: pet.y - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => dmgText.destroy()
        });
    }
}
