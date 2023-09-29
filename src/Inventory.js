export function handleItemPickup() {
    console.log('Current Inventory:', this.inventory);

    const cameraView = this.cameras.main.worldView;
    
    // filter out the items that are picked up
    this.items = this.items.filter(item => {
        if (cameraView.contains(item.sprite.x, item.sprite.y)) {
            if (addToInventory.call(this, item.config)) {
                item.sprite.destroy();
                return false; // don’t include this item in the new items array
            } else {
                console.log('Inventory is full.');
            }
        }
        return true; // include the item in the new items array if it hasn’t been picked up
    });
}


export function addToInventory(itemConfig) {
    if (this.inventory.length < this.maxInventorySize) {
        this.inventory.push(itemConfig);
        updateInventoryDisplay.call(this);
        return true;
    } else {
        return false;
    }
}

export function updateInventoryDisplay() {
    this.inventoryContainer.removeAll(true);
    this.inventory.forEach((item, index) => {
        const x = (index % 4) * 50;
        const y = Math.floor(index / 4) * 50;
        const sprite = this.add.sprite(x, y, item.name).setInteractive();
        this.inventoryContainer.add(sprite);
    });
}
