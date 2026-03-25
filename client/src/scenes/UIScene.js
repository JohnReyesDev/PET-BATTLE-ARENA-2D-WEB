/**
 * UI Scene
 * Handles HUD elements and overlays
 */

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // This scene runs parallel to GameScene
        // UI elements are handled via HTML/CSS overlay in index.html
        console.log('[UIScene] UI overlay ready');
    }
}
