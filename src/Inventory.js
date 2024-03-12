import Phaser from 'phaser';
import { PlayerState } from './playerState';

export function handleItemPickup(cat) {
    const cameraView = this.cameras.main.worldView;

    // Create an object to store the counts and configurations of each item
    let itemCounts = {};

    this.items = this.items.filter(item => {
        if (cameraView.contains(item.sprite.x, item.sprite.y)) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(cat.getBounds(), item.sprite.getBounds())) {
                // Increment the count of this item and store its configuration
                itemCounts[item.config.name] = {
                    count: (itemCounts[item.config.name]?.count || 0) + 1,
                    config: item.config
                };

                // Check if the item already exists in the inventory
                const existingItem = PlayerState.inventory.find(i => i.name === item.config.name);

                // If the item exists in the inventory or the inventory is not full, add the item to the inventory
                if (existingItem || PlayerState.inventory.length < this.maxInventorySize) {
                    addToInventory.call(this, item.config, itemCounts[item.config.name].count);
                    item.sprite.destroy();
                    this.allEntities = this.allEntities.filter(entity => entity !== item.sprite);
                    return false;
                } else {
                    // If the inventory is full, add a message to the UIScene
                    this.scene.get('UIScene').addMessage(`Bag is full! Cannot pick up ${item.config.name.toLowerCase()}.`, 'tomato');
                }
            }
        }
        return true;
    });
}

export function addToInventory(itemConfig, quantity = 1) {
    let inventory = PlayerState.inventory || [];
    const existingItem = inventory.find(item => item.name === itemConfig.name);

    if (existingItem) {
        existingItem.quantity += quantity;

    } else if (inventory.length < this.maxInventorySize) {
        itemConfig.quantity = quantity;
        inventory.push(itemConfig);
    }

    PlayerState.inventory = inventory;
    this.scene.get('UIScene').updateInventoryDisplay();
    return true;
}

