/**
 * Particle System
 * Handles all visual effects and particles
 */

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.activeParticles = [];
        this.maxParticles = 500; // Performance limit
    }

    update(delta) {
        // Clean up dead particles
        this.activeParticles = this.activeParticles.filter(p => {
            if (!p.active) {
                return false;
            }
            p.lifetime -= delta;
            if (p.lifetime <= 0) {
                p.sprite.destroy();
                return false;
            }
            return true;
        });
    }

    burst(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.createParticle(x, y, color);
        }
    }

    createParticle(x, y, color) {
        if (this.activeParticles.length >= this.maxParticles) {
            // Remove oldest particle
            const oldest = this.activeParticles.shift();
            if (oldest && oldest.sprite) oldest.sprite.destroy();
        }

        const sprite = this.scene.add.sprite(x, y, 'particle');
        sprite.setTint(color);
        sprite.setScale(0.5 + Math.random() * 0.5);
        sprite.setAlpha(1);
        sprite.setDepth(50);

        // Random velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        // Physics
        this.scene.physics.add.existing(sprite);
        sprite.body.setVelocity(vx, vy);
        sprite.body.setGravityY(200);

        // Fade out and shrink
        const lifetime = 500 + Math.random() * 500;
        
        this.scene.tweens.add({
            targets: sprite,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: lifetime,
            ease: 'Power2',
            onComplete: () => {
                if (sprite.active) sprite.destroy();
            }
        });

        this.activeParticles.push({
            sprite,
            lifetime,
            active: true
        });

        return sprite;
    }

    explosion(x, y, color, count = 20) {
        // Ring of particles expanding outward
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            
            const sprite = this.scene.add.sprite(x, y, 'particle');
            sprite.setTint(color);
            sprite.setScale(0.3 + Math.random() * 0.4);
            sprite.setDepth(50);

            this.scene.physics.add.existing(sprite);
            sprite.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );

            const lifetime = 600 + Math.random() * 400;
            
            this.scene.tweens.add({
                targets: sprite,
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                duration: lifetime,
                ease: 'Power2',
                onComplete: () => {
                    if (sprite.active) sprite.destroy();
                }
            });
        }
    }

    megaPetActivation(x, y) {
        // Massive particle explosion for mega pet activation
        const colors = [0xff00ff, 0x00ffff, 0xffff00, 0xff69b4];
        
        // Multiple waves
        for (let wave = 0; wave < 3; wave++) {
            this.scene.time.delayedCall(wave * 200, () => {
                colors.forEach(color => {
                    this.explosion(x, y, color, 30);
                });
            });
        }

        // Ring shockwave effect
        const shockwave = this.scene.add.circle(x, y, 50, 0xffffff, 0.5);
        shockwave.setStrokeStyle(4, 0x00ffff, 1);
        shockwave.setDepth(90);

        this.scene.tweens.add({
            targets: shockwave,
            scaleX: 6,
            scaleY: 6,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => shockwave.destroy()
        });

        // Screen flash
        const flash = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0xffffff, 0.5
        );
        flash.setDepth(200);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            onComplete: () => flash.destroy()
        });
    }

    trail(x, y, color) {
        // Light trail effect for fast-moving objects
        const sprite = this.scene.add.sprite(x, y, 'particle');
        sprite.setTint(color);
        sprite.setScale(0.3);
        sprite.setAlpha(0.7);
        sprite.setDepth(40);

        this.scene.tweens.add({
            targets: sprite,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                if (sprite.active) sprite.destroy();
            }
        });
    }

    screenShake(intensity = 5) {
        this.scene.cameras.main.shake(200, intensity / 1000);
    }

    colorFlash(color, duration = 100) {
        const flash = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            color, 0.3
        );
        flash.setDepth(150);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: duration,
            onComplete: () => flash.destroy()
        });
    }

    spawnAmbient() {
        // Ambient floating particles for atmosphere
        const { width, height } = this.scene.cameras.main;
        
        const sprite = this.scene.add.sprite(
            Math.random() * width,
            height + 20,
            'particle'
        );
        sprite.setTint(0xffffff);
        sprite.setScale(0.2 + Math.random() * 0.3);
        sprite.setAlpha(0.2);
        sprite.setDepth(1);

        const duration = 3000 + Math.random() * 3000;
        
        this.scene.tweens.add({
            targets: sprite,
            y: -20,
            alpha: 0,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                if (sprite.active) {
                    // Respawn at bottom
                    sprite.x = Math.random() * width;
                    sprite.y = height + 20;
                    sprite.alpha = 0.2;
                    sprite.setScale(0.2 + Math.random() * 0.3);
                    this.scene.tweens.add({
                        targets: sprite,
                        y: -20,
                        alpha: 0,
                        duration: duration,
                        ease: 'Linear',
                        repeat: -1
                    });
                }
            }
        });
    }
}
