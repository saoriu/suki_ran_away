export class Item {
    constructor(scene, x, y, key, config) {
        this.scene = scene;
        this.config = config;
        this.sprite = this.scene.add.sprite(x, y, key).setScale(1);
        this.sprite.setInteractive();
        this.sprite.setPipeline('Light2D');
        this.sprite.setVisible(false); // Hide the sprite initially
    }

    show() {
        this.sprite.setVisible(true); // Show the sprite
    }
}