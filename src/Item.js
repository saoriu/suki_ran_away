export class Item {
    constructor(scene, x, y, key, config) {
        this.scene = scene;
        this.sprite = this.scene.add.sprite(x, y, key).setScale(1);
                this.config = config;
        this.sprite.setInteractive();
        this.sprite.setPipeline('Light2D')
    }
}

