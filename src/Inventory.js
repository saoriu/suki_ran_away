export function handleItemPickup() {
    const cameraView = this.cameras.main.worldView;

    this.items = this.items.filter(item => {
        if (cameraView.contains(item.sprite.x, item.sprite.y)) {
            if (addToInventory.call(this, item.config)) {
                item.sprite.destroy();
                return false;
            } else {
                console.log('Inventory is full.');
            }
        }
        return true;
    });
}

export function addToInventory(itemConfig) {
    let inventory = this.registry.get('inventory') || [];
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

    this.registry.set('inventory', inventory); // Update the inventory in the registry.
    this.scene.get('UIScene').updateInventoryDisplay(); // Update the UIScene without passing inventory as a parameter.
    return true;
}

export function clearInventory() {
    this.registry.set('inventory', []);
    this.scene.get('UIScene').updateInventoryDisplay();
}


export function updateInventoryDisplay() {    
    this.inventoryContainer.removeAll(true);
    
    const inventory = this.registry.get('inventory') || [];

    inventory.forEach((item, index) => {
        const x = (index % 4) * 50;
        const y = Math.floor(index / 4) * 50;
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
