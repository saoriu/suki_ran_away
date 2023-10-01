import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' }); // Removed active: true from here
    }

    create() {
        this.inventoryContainer = this.add.container(10, 10);
        this.updateInventoryDisplay(); // To display initial items if any
    }

    updateInventoryDisplay() {
        console.log('UIScene Updating Inventory Display'); // Check if this method is being called in UIScene
        this.inventoryContainer.removeAll(true);
        const inventory = this.registry.get('inventory') || [];
        console.log('Inventory At Update in UIScene:', inventory); // Log the current state of inventory in UIScene
        inventory.forEach((item, index) => {
            const x = (index % 4) * 50 + 25;
            const y = Math.floor(index / 4) * 50 + 25;
            const sprite = this.add.sprite(x, y, item.name.toLowerCase()).setInteractive();
            this.inventoryContainer.add(sprite);
            if (item.quantity > 1) {
                const quantityText = this.add.text(x, y, item.quantity, {
                    fontSize: '16px',
                    fill: '#000',
                    backgroundColor: '#fff'
                });
                this.inventoryContainer.add(quantityText);
            }
        });
    }
}