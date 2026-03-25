/**
 * Object Pool
 * Manages object pooling for performance optimization
 */

export class ObjectPool {
    constructor(scene) {
        this.scene = scene;
        this.pools = new Map();
        this.maxPoolSize = 100;
    }

    createPool(key, factory, initialSize = 10) {
        if (this.pools.has(key)) {
            console.warn(`Pool ${key} already exists`);
            return this.pools.get(key);
        }

        const pool = {
            available: [],
            inUse: new Set(),
            factory: factory
        };

        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            const obj = factory();
            obj.active = false;
            pool.available.push(obj);
        }

        this.pools.set(key, pool);
        console.log(`[ObjectPool] Created pool: ${key} with ${initialSize} objects`);

        return pool;
    }

    get(key) {
        const pool = this.pools.get(key);
        if (!pool) {
            console.warn(`Pool ${key} does not exist`);
            return null;
        }

        let obj;
        if (pool.available.length > 0) {
            obj = pool.available.pop();
        } else if (pool.inUse.size < this.maxPoolSize) {
            // Create new if under limit
            obj = pool.factory();
        } else {
            // Pool exhausted, return null
            console.warn(`Pool ${key} exhausted`);
            return null;
        }

        obj.active = true;
        pool.inUse.add(obj);
        return obj;
    }

    release(key, obj) {
        const pool = this.pools.get(key);
        if (!pool) {
            console.warn(`Pool ${key} does not exist`);
            return;
        }

        if (!pool.inUse.has(obj)) {
            return;
        }

        obj.active = false;
        pool.inUse.delete(obj);
        pool.available.push(obj);
    }

    releaseAll(key) {
        const pool = this.pools.get(key);
        if (!pool) return;

        pool.available.push(...pool.inUse);
        pool.inUse.clear();
    }

    clear(key) {
        const pool = this.pools.get(key);
        if (!pool) return;

        pool.available.forEach(obj => {
            if (obj.destroy) obj.destroy();
        });
        pool.inUse.forEach(obj => {
            if (obj.destroy) obj.destroy();
        });

        pool.available = [];
        pool.inUse.clear();
    }

    getStats() {
        const stats = {};
        this.pools.forEach((pool, key) => {
            stats[key] = {
                available: pool.available.length,
                inUse: pool.inUse.size,
                total: pool.available.length + pool.inUse.size
            };
        });
        return stats;
    }

    // Utility to create particle pool
    createParticlePool() {
        return this.createPool('particles', () => {
            const sprite = this.scene.add.sprite(0, 0, 'particle');
            sprite.setActive(false);
            sprite.setVisible(false);
            return sprite;
        }, 50);
    }

    // Utility to create projectile pool
    createProjectilePool() {
        return this.createPool('projectiles', () => {
            const sprite = this.scene.add.sprite(0, 0, 'projectile');
            sprite.setActive(false);
            sprite.setVisible(false);
            return sprite;
        }, 30);
    }
}
