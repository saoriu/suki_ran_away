import Phaser from 'phaser';
import { PlayerState } from './playerState';

export function handleItemPickup(cat) {
    const cameraView = this.cameras.main.worldView;

    this.items = this.items.filter(item => {
        if (cameraView.contains(item.sprite.x, item.sprite.y)) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(cat.getBounds(), item.sprite.getBounds())) {
                if (addToInventory.call(this, item.config)) {
                    item.sprite.destroy();
                    console.log(`Picked up ${item.config.name}`);
                    //console log the inventory
                    console.log(PlayerState.inventory);
                    return false;
                } else {
                    console.log('Inventory is full.');
                }
            }
        }
        return true;
    });
}

export function addToInventory(itemConfig) {
    let inventory = PlayerState.inventory || [];
    const existingItem = inventory.find(item => item.name === itemConfig.name);

    if (existingItem) {
        // If found, increment the quantity of the existing item.
        existingItem.quantity += 1;
    } else if (inventory.length < this.maxInventorySize) {
        // If not found and there is space, add a new item with quantity 1.
        itemConfig.quantity = 1; // initialize quantity
        inventory.push(itemConfig);
    } else {
        // If inventory is full, return false.
        return false;
    }

    PlayerState.inventory = inventory; // Update the inventory in the PlayerState.
    this.scene.get('UIScene').updateInventoryDisplay(); // Update the UIScene without passing inventory as a parameter.
    return true;
}

export function clearInventory() {
    PlayerState.inventory = [];
    this.scene.get('UIScene').updateInventoryDisplay();
}