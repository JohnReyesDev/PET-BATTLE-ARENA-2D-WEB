/**
 * Combat System
 * Handles all combat logic between pets and enemies
 */

export class CombatSystem {
    constructor(scene) {
        this.scene = scene;
        this.damageNumbers = [];
    }

    update(delta) {
        // Update damage numbers
        this.damageNumbers = this.damageNumbers.filter(dn => {
            dn.lifetime -= delta;
            if (dn.lifetime <= 0) {
                dn.graphics.destroy();
                return false;
            }
            return true;
        });
    }

    petAttack(pet, enemy) {
        if (!pet.active || !enemy.active) return;
        
        const damage = pet.petData.damage + (pet.petData.level * 5);
        
        // Apply damage
        enemy.enemyData.hp -= damage;
        
        // Visual effects
        this.showAttackEffect(pet, enemy);
        this.createDamageNumber(enemy.x, enemy.y - 20, damage);
        
        // Check enemy death
        if (enemy.enemyData.hp <= 0) {
            this.enemyDeath(enemy);
        }
    }

    enemyAttack(enemy, pet) {
        if (!enemy.active || !pet.active) return;
        
        const damage = enemy.enemyData.damage;
        
        // Apply damage
        pet.petData.hp -= damage;
        
        // Visual feedback
        this.scene.onPetDamaged(pet, damage);
        
        // Check pet death
        if (pet.petData.hp <= 0) {
            this.petDeath(pet);
        }
    }

    showAttackEffect(attacker, target) {
        // Attack animation on attacker
        this.scene.tweens.add({
            targets: attacker,
            scaleX: attacker.scaleX * 1.2,
            scaleY: attacker.scaleY * 1.2,
            duration: 50,
            yoyo: true
        });

        // Hit effect on target
        this.scene.tweens.add({
            targets: target,
            alpha: 0.7,
            duration: 50,
            yoyo: true
        });

        // Particle burst at impact point
        this.scene.particleSystem.burst(target.x, target.y, 0xffff00, 5);

        // Screen shake (subtle)
        const shakeIntensity = 2;
        this.scene.cameras.main.shake(50, shakeIntensity / 1000);
    }

    createDamageNumber(x, y, damage) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(x - 15, y - 10, 30, 20);
        
        const text = this.scene.add.text(x, y, `-${damage}`, {
            fontSize: '14px',
            fontFamily: 'Arial Black',
            color: '#ffffff'
        });
        text.setOrigin(0.5);
        text.setDepth(100);

        // Animate
        this.scene.tweens.add({
            targets: [text],
            y: y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                graphics.destroy();
                text.destroy();
            }
        });

        this.damageNumbers.push({
            graphics,
            text,
            lifetime: 800
        });
    }

    enemyDeath(enemy) {
        enemy.alive = false;
        
        // Score/XP for killer pets
        this.scene.pets.getChildren().forEach(pet => {
            if (pet.active && pet.alive) {
                pet.petData.xp = (pet.petData.xp || 0) + 10;
                
                // Level up check
                if (pet.petData.xp >= pet.petData.level * 100) {
                    this.petLevelUp(pet);
                }
            }
        });

        // Death effects
        this.scene.onEnemyDeath(enemy);
    }

    petDeath(pet) {
        pet.alive = false;
        
        // Remove pet
        this.scene.removePet(pet.petData.id);
    }

    petLevelUp(pet) {
        pet.petData.level++;
        pet.petData.xp = 0;
        pet.petData.hp += 10;
        pet.petData.maxHp += 10;
        pet.petData.damage += 5;
        
        // Update level text
        if (pet.levelText) {
            pet.levelText.setText(`Lv${pet.petData.level}`);
        }
        
        // Level up effect
        this.scene.particleSystem.burst(pet.x, pet.y, 0xffff00, 15);
        
        const levelUpText = this.scene.add.text(pet.x, pet.y - 40, `LEVEL UP! Lv${pet.petData.level}`, {
            fontSize: '20px',
            fontFamily: 'Arial Black',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        });
        levelUpText.setOrigin(0.5);
        levelUpText.setDepth(100);

        this.scene.tweens.add({
            targets: levelUpText,
            y: pet.y - 80,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => levelUpText.destroy()
        });
    }

    // Calculate damage with type advantages (future feature)
    calculateDamage(attacker, defender, baseDamage) {
        // Type effectiveness could go here
        // Example: fire > grass > water > fire
        
        let multiplier = 1.0;
        
        // Critical hit chance (10%)
        const isCritical = Math.random() < 0.1;
        if (isCritical) {
            multiplier *= 1.5;
        }
        
        return Math.floor(baseDamage * multiplier);
    }
}
