/**
 * Wave System
 * Manages enemy wave spawning and difficulty progression
 */

export class WaveSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentWave = 0;
        this.enemiesRemaining = 0;
        this.waveInProgress = false;
        this.spawnTimer = 0;
        this.waveDelay = 5000; // 5 seconds between waves
    }

    update(delta) {
        if (this.waveInProgress) {
            // Check if wave is complete
            if (this.enemiesRemaining <= 0) {
                this.waveComplete();
            }
        }
    }

    spawnWave(waveData, gameScene) {
        this.currentWave = waveData.wave;
        this.enemiesRemaining = waveData.enemyCount;
        this.waveInProgress = true;
        this.spawnDelay = 0;

        // Show wave announcement
        this.showWaveAnnouncement(waveData.wave);

        // Spawn enemies with delay
        for (let i = 0; i < waveData.enemyCount; i++) {
            this.scene.time.delayedCall(i * 500, () => {
                if (this.waveInProgress) {
                    gameScene.spawnEnemy(waveData);
                    this.scene.particleSystem.burst(
                        Math.random() * this.scene.cameras.main.width,
                        -30,
                        0xff0000,
                        5
                    );
                }
            });
        }

        // Boss wave every 5 waves
        if (waveData.wave % 5 === 0) {
            this.scene.time.delayedCall(2000, () => {
                this.spawnBoss(gameScene, waveData);
            });
        }
    }

    showWaveAnnouncement(waveNumber) {
        const { width, height } = this.scene.cameras.main;
        
        // Wave text
        const waveText = this.scene.add.text(width / 2, height / 2 - 50, `OLEADA ${waveNumber}`, {
            fontSize: '72px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#ff00ff',
            strokeThickness: 6
        });
        waveText.setOrigin(0.5);
        waveText.setAlpha(0);
        waveText.setDepth(200);

        // Animate in
        this.scene.tweens.add({
            targets: waveText,
            alpha: 1,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: waveText,
                    alpha: 0,
                    scaleX: 0.5,
                    scaleY: 0.5,
                    duration: 500,
                    delay: 1000,
                    onComplete: () => waveText.destroy()
                });
            }
        });

        // Screen flash
        this.scene.particleSystem.colorFlash(0xff00ff, 200);

        // Screen shake
        this.scene.cameras.main.shake(300, 0.005);
    }

    spawnBoss(gameScene, waveData) {
        const { width, height } = this.scene.cameras.main;
        
        // Boss announcement
        const bossText = this.scene.add.text(width / 2, height / 2, '👹 BOSS 👹', {
            fontSize: '64px',
            fontFamily: 'Arial Black',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        });
        bossText.setOrigin(0.5);
        bossText.setDepth(200);

        this.scene.tweens.add({
            targets: bossText,
            alpha: 0,
            y: height / 2 - 100,
            duration: 1500,
            delay: 2000,
            onComplete: () => bossText.destroy()
        });

        // Spawn boss at center top
        const bossX = width / 2;
        const bossY = -50;

        const bossSprite = this.scene.add.sprite(bossX, bossY, 'enemy_0');
        bossSprite.setScale(3);
        bossSprite.setDepth(50);
        bossSprite.setTint(0xff0000);

        // Boss data
        bossSprite.enemyData = {
            hp: 500 * waveData.difficulty.health,
            maxHp: 500 * waveData.difficulty.health,
            damage: 30 * waveData.difficulty.damage,
            speed: 1 + waveData.difficulty.speed * 0.5,
            isBoss: true
        };
        bossSprite.alive = true;
        bossSprite.attackCooldown = 0;

        // Boss health bar
        const bossHealthBar = this.scene.add.graphics();
        bossHealthBar.setDepth(60);
        bossSprite.healthBar = bossHealthBar;

        // Drop in animation
        this.scene.tweens.add({
            targets: bossSprite,
            y: 150,
            duration: 1000,
            ease: 'Bounce.easeOut'
        });

        // Big entrance effect
        this.scene.particleSystem.explosion(bossX, 150, 0xff0000, 30);
        this.scene.particleSystem.screenShake(10);

        gameScene.enemies.add(bossSprite);
        this.enemiesRemaining++;
    }

    onEnemyDeath() {
        this.enemiesRemaining--;
    }

    waveComplete() {
        this.waveInProgress = false;
        
        // Wave complete effects
        const { width, height } = this.scene.cameras.main;
        
        // Victory text
        const victoryText = this.scene.add.text(width / 2, height / 2, 'OLEADA COMPLETADA!', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        victoryText.setOrigin(0.5);
        victoryText.setDepth(200);

        this.scene.tweens.add({
            targets: victoryText,
            alpha: 0,
            y: height / 2 - 100,
            duration: 1500,
            delay: 2000,
            onComplete: () => victoryText.destroy()
        });

        // Bonus points/effects
        this.scene.particleSystem.colorFlash(0x00ff00, 300);
    }

    getDifficultyMultiplier(wave) {
        return {
            health: 1 + (wave * 0.15),
            damage: 1 + (wave * 0.12),
            speed: 1 + (wave * 0.1)
        };
    }
}
