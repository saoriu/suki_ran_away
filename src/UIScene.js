import Phaser from 'phaser';
import { textStyles } from './styles.js';
import { getSkillXP, getSkillLevel, xpRequiredForLevel, PlayerState } from './playerState';
import { unlockedAttacksForLevel, getAttacksForCurrentLevel } from './attacks'; // Adjust the path as per your project structure
import { Tooltip } from './Tooltip';
import { updatePlayerState } from './api'; // Adjust the path according to your project structure
import FontFaceObserver from 'fontfaceobserver';
import { itemInfo } from './itemInfo.js';
import { attacks } from './attacks.js';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.attackTimeouts = {}; // Initialize this.attackTimeouts
        this.isSaving = false;
        this.selectedIndex = 0;
        this.energyx = 415;
        this.energyy = 70;
        this.craftMenuIsOpen = false;
        this.itemsGrid = [];
        this.selectedItem = { row: 0, col: 0 };
        this.isAttackMenuOpen = false;
    }

    create() {

        this.mainScene = this.scene.get('mainScene');
        this.x = this.cameras.main.width / 2;
        this.y = this.cameras.main.height / 2;
        this.timeFilter = this.add.graphics();
        this.energyText = null;
        this.activeChangeTexts = 0;
        this.postFxPlugin = this.plugins.get('rexoutlinepipelineplugin');


        this.saveButton = this.add.image((this.x * 2) - 50, (this.y * 2) - 40, 'save')
            .setInteractive()
            .on('pointerover', () => {
                this.saveButton.setTint(0xffd700);
                this.saveButtonText.setVisible(true);  // Show the text
            })
            .on('pointerout', () => {
                this.saveButton.setTint(0xffffff);
                this.saveButtonText.setVisible(false);  // Hide the text
            })
            .on('pointerdown', () => this.saveGame())
            .setDepth(10);

        this.attackMenuButton = this.add.image(50, (this.y * 2) - 40, 'attacks-menu').setScale(.5)
            .setInteractive()
            .on('pointerover', () => {
                this.attackMenuButton.setTint(0xffd700);
                this.attackMenuButtonText.setVisible(true);  // Show the text
            })
            .on('pointerout', () => {
                this.attackMenuButton.setTint(0xffffff);
                this.attackMenuButtonText.setVisible(false);  // Hide the text
            })
            .on('pointerdown', () => {
                this.attackMenu();
                this.isAttackMenuOpen = true;
            })
            .setDepth(10);
        this.isLevelingUp = false;
        let dayText = null;


        let graphics = this.make.graphics({});
        graphics.fillStyle(0x073336);
        graphics.fillRect(0, 0, 200, 50);
        graphics.fillStyle(0x066B72);
        graphics.fillRect(0, 25, 200, 5);
        graphics.generateTexture('lux', 200, 50);

        let graphics2 = this.make.graphics({});
        graphics2.fillStyle(0xFFD700); // Gold
        graphics2.fillRect(0, 0, 300, 300);
        graphics2.fillStyle(0xB8860B); // Dark Gold
        graphics2.fillRect(0, 150, 300, 10);
        graphics2.generateTexture('goldTexture', 300, 300);
        this.game.events.on('energyUpdate', this.updateEnergyBar, this);

        const ninjaFontObserver = new FontFaceObserver('Ninja');
        const ManaSeedBodyFontObserver = new FontFaceObserver('ManaSeedBody');
        Promise.all([ninjaFontObserver.load(), ManaSeedBodyFontObserver.load()]).then(() => {
            this.updateInventoryDisplay();
            const userid = PlayerState.userid;
            let useridText = `${userid}`;
            this.userText = this.add.text(125, 18, useridText, { fontFamily: 'Ninja', fontSize: '20px', fill: 'gold', stroke: 'black', strokeThickness: 3 });
            this.energyText = this.add.text(this.energyx, this.energyy, ``, textStyles.energyText);
            this.add.existing(this.energyText);
            this.createAttackSelectionMenu();
            this.energyBar = this.createEnergyBar(74, 73);
            this.add.existing(this.energyBar.outer);
            this.add.existing(this.energyBar.fill);
            this.updateEnergyBar();
            this.game.events.on('energyChanged', this.updateEnergyBar, this);
            this.initializeStaticElements();


            this.saveButtonText = this.add.text((this.x * 2) - 140, (this.y * 2) - 40, 'SAVE', textStyles.indicator).setVisible(false);
            this.attackMenuButtonText = this.add.text(75, (this.y * 2) - 40, 'ATTACKS', textStyles.indicator).setVisible(false);


            // Create dayText with initial value
            dayText = this.add.text((this.x * 2) - 130, 30, `DAY ${PlayerState.days}`, textStyles.daysPassed);

            // Create progress bar and add it to the container

            // Set the depth of the container to ensure it's rendered above other elements
            this.updateSkillsDisplay();
            this.updateAttackBonusDisplay();
            this.updateFireBonusDisplay();
            this.updateTreesBonusDisplay();
            this.updateDefenceBonusDisplay();
        });


        this.tooltip = new Tooltip(this, 0, 0, '');
        this.add.existing(this.tooltip);
        this.tooltip.setVisible(false);

        this.game.events.on('showTooltip', this.showTooltip, this);
        this.game.events.on('hideTooltip', this.hideTooltip, this);

        this.game.events.on('daysPassed', (daysPassed) => {
            if (dayText) {
                dayText.setText(`DAY ${daysPassed}`);
            }
        });

        const bag = this.add.container(this.x, (this.y * 2) - 50).setDepth(1);
        const bagImage = this.add.image(0, 0, 'bag').setOrigin(0.5);
        bag.add(bagImage);

        this.itemMenuButton = this.add.image(-310, 0, 'craft')
            .setInteractive()
            .on('pointerover', () => {
                this.postFxPlugin.add(this.itemMenuButton, {
                    thickness: 3,
                    outlineColor: 0xc41c00
                });
            })
            .on('pointerout', () => {
                this.postFxPlugin.remove(this.itemMenuButton);
            })
            .on('pointerdown', () => {
                this.itemMenu();
                PlayerState.isMenuOpen = true;
            })
            .setDepth(10)

        bag.add(this.itemMenuButton);
        this.input.keyboard.on('keydown-UP', () => {
            if (PlayerState.isMenuOpen && this.selectedItem.row > 0) {
                this.updateSelectedItem(this.selectedItem.row - 1, this.selectedItem.col);
            }
        });

        this.input.keyboard.on('keydown-DOWN', () => {
            if (PlayerState.isMenuOpen && this.selectedItem.row < this.itemsGrid.length - 1) {
                this.updateSelectedItem(this.selectedItem.row + 1, this.selectedItem.col);
            }
        });

        this.input.keyboard.on('keydown-LEFT', () => {
            if (PlayerState.isMenuOpen && this.selectedItem.col > 0) {
                this.updateSelectedItem(this.selectedItem.row, this.selectedItem.col - 1);
            }
        });

        this.input.keyboard.on('keydown-RIGHT', () => {
            if (PlayerState.isMenuOpen && this.selectedItem.col < this.itemsGrid[this.selectedItem.row].length - 1) {
                this.updateSelectedItem(this.selectedItem.row, this.selectedItem.col + 1);
            }
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            if (PlayerState.isMenuOpen && this.itemsGrid[this.selectedItem.row] && this.itemsGrid[this.selectedItem.row][this.selectedItem.col]) {
                const selectedItem = this.itemsGrid[this.selectedItem.row][this.selectedItem.col].item;
                if (selectedItem && selectedItem.itemName) {
                    this.createItem(selectedItem.itemName);
                }
            }
        });

        // Listen for the ` key
        this.input.keyboard.on('keydown-BACKTICK', () => {
            this.itemMenu();
            PlayerState.isMenuOpen = true;
        });

        // Listen for the B key
        this.input.keyboard.on('keydown-B', () => {
            this.itemMenu();
            PlayerState.isMenuOpen = true;
        });
        this.inventoryContainer = this.add.container(this.x, (this.y * 2) - 50).setDepth(3);

        this.game.events.on('playerStateUpdated', this.createAttackSelectionMenu, this);
        this.game.events.on('updateSkillsDisplay', this.updateSkillsDisplay, this);

        this.game.events.on('levelUp', (skillName) => {
            if (skillName === 'dancing') {
                this.handleDancingLevelUp();
            }
        });


        this.input.keyboard.on('keydown', (event) => {
            if (event.code.startsWith('Digit') || event.code === 'Minus') {
                this.displayInventoryIndices();
                let index;
                if (event.code === 'Digit0') {
                    index = 9; // 0 key corresponds to the 10th item
                } else if (event.code === 'Minus') {
                    index = 10; // '-' key corresponds to the 11th item
                } else {
                    const digit = parseInt(event.code.replace('Digit', ''), 10);
                    index = digit - 1; // Other number keys correspond to their respective items
                }

                if (index < PlayerState.inventory.length) {
                    if (this.selectedIndex === index) {
                        // If the pressed key corresponds to the currently selected index, use the item
                        const selectedItem = PlayerState.inventory[this.selectedIndex];
                        if (selectedItem) {
                            this.useItem(selectedItem.name);
                        }
                    } else {
                        // Otherwise, select the item
                        this.selectedIndex = index;
                        this.handleInventorySelection();
                    }
                }
            } else {
                switch (event.key) {
                    case 's':
                        this.saveGame();
                        break;
                    default:
                        break;
                }
            }
        });
    }
    async saveGame() {
        const now = Date.now();
        if (now - PlayerState.lastDamageTime < 3000 && !this.isSaveTextVisible) {
            if (!this.isUnderAttackTextVisible) {
                this.isUnderAttackTextVisible = true;
                const blockSaveText = this.add.text(this.x, this.y - 100, "CAN'T   SAVE   UNDER   ATTACK!", textStyles.saveblock).setOrigin(0.5);
                this.time.delayedCall(3000, () => {
                    blockSaveText.destroy();
                    this.isUnderAttackTextVisible = false;
                });
            }
            return;
        }

        if (this.isSaving || this.isSaveTextVisible || this.isUnderAttackTextVisible) {
            return;
        }

        try {


            this.isSaving = true; // Set isSaving to true when the save process starts

            const userid = sessionStorage.getItem('userid');
            const token = sessionStorage.getItem('token');

            // Display "Saving..." text
            const savingText = this.add.text(this.x, this.y - 100, 'SAVING...', textStyles.save).setOrigin(0.5);
            this.isSaveTextVisible = true; // Set isSaveTextVisible to true when the save confirmation is displayed

            await updatePlayerState(userid, PlayerState, token);

            // Remove "Saving..." text
            savingText.destroy();

            // Display "Game saved successfully" text
            const savedText = this.add.text(this.x, this.y - 100, 'GAME   SAVED !', textStyles.save).setOrigin(0.5);

            // Remove "Game saved successfully" text after 3 seconds
            this.time.delayedCall(3000, () => {
                savedText.destroy();
                this.isSaveTextVisible = false; // Set isSaveTextVisible back to false when the save confirmation is destroyed
            });
        } catch (error) {
            console.error('Error saving game:', error);
        } finally {
            this.isSaving = false; // Set isSaving back to false when the save process ends
        }
    }

    displayInventoryIndices() {
        const textObjects = PlayerState.inventory.map((item, index) => {
            const x = (this.x - 265) + (index * 56.4);
            const y = (this.y * 2) - 115;

            let displayIndex;
            if (index === 9) {
                displayIndex = '0'; // Display '0' for the 10th item
            } else if (index === 10) {
                displayIndex = '-'; // Display '-' for the 11th item
            } else {
                displayIndex = index + 1; // Display the index + 1 for other items
            }

            const text = this.add.text(x, y, displayIndex, textStyles.counts);
            text.setDepth(1001);

            return text;
        });

        setTimeout(() => {
            textObjects.forEach(text => text.destroy());
        }, 3000);
    }
    showTooltip(data) {
        this.tooltip.updateText(data.text);
        this.tooltip.setPosition(data.x, data.y);
        this.tooltip.setVisible(true);
        this.tooltip.setDepth(100);
    }

    hideTooltip() {
        this.tooltip.setVisible(false);
    }

    createAttackSelectionMenu() {
        let unlockedAttacks = unlockedAttacksForLevel(PlayerState.skills.dancing.level);
        unlockedAttacks.sort((a, b) => a.level - b.level);

        unlockedAttacks.forEach((attack, index) => {
            if (attack.name === 'scratch') return;

            if (!PlayerState.selectedAttacks.includes(attack.name) && PlayerState.skills.dancing.level >= attack.level) {
                PlayerState.selectedAttacks[index] = attack.name;
            }
        });
    }

    createMonsterHealthBar(x, y) {
        const progressBarWidth = 80;
        const progressBarHeight = 6;
        const borderOffset = 2;
        const outerRect = this.add.rectangle(x, y, progressBarWidth + 2 * borderOffset, progressBarHeight + 2 * borderOffset, 0x000000);
        outerRect.setOrigin(0, 0.5);

        const progressFill = this.add.rectangle(x + borderOffset, y, progressBarWidth, progressBarHeight, 0xff0000);
        progressFill.setOrigin(0, 0.5);
        progressFill.displayWidth = 0;

        return { outer: outerRect, fill: progressFill };
    }

    attackMenu() {
        if (this.isAttackMenuOpen) {
            return;
        }

        const allAttacks = Object.values(attacks);

        const menu = this.add.container(-340, this.y - 300);
        const menuBackground = this.add.image(0, 0, 'menu').setOrigin(0);
        menu.add(menuBackground);
        const titlePrefix = this.add.text(175, 55, 'ATTACKS', textStyles.mainTitle).setOrigin(0.5);
        menu.add(titlePrefix);
        //alpha 0 on menu
        menu.alpha = 0;

        const closeButton = this.add.text(315, 30, 'x', textStyles.close).setInteractive().setOrigin(0.5);
        menu.add(closeButton);

        closeButton.on('pointerover', () => {
            closeButton.setStyle({ fill: '#ff0000', stroke: '#ff0000' });
        });

        closeButton.on('pointerout', () => {
            closeButton.setStyle(textStyles.close);
        });

        closeButton.on('pointerdown', () => {
            menu.destroy();
            this.isAttackMenuOpen = false;
        });

        this.input.on('pointerdown', (pointer) => {
            if (!menu.getBounds().contains(pointer.x, pointer.y) &&
                !this.attackMenuButton.getBounds().contains(pointer.x, pointer.y)) {
                menu.destroy();
                this.isAttackMenuOpen = false;
            }
        });

        this.tweens.add({
            targets: menu,
            alpha: 1, // Final opacity
            //position x is 165
            x: 50,
            duration: 1500, // Duration of the tween in milliseconds
            ease: 'Power2', // Easing function
        });

        allAttacks.forEach((attack, index) => {
            const attackContainer = this.add.container(0, index * 100); // Increase the y-offset to add spacing

            if (attack.level > PlayerState.skills.dancing.level) {
                const lockedImage = this.add.image(70, 120, 'locked').setScale(1).setDepth(3).setOrigin(0.5);
                attackContainer.add(lockedImage);
            }
            else {
                const image = this.add.image(70, 120, attack.name).setScale(.5).setDepth(2).setOrigin(0.5);
                attackContainer.add(image);
            }

            const titlePrefix = this.add.text(110, 95, attack.name.toUpperCase(), textStyles.title).setOrigin(0);
            const damage = this.add.text(110, 125, `DMG:   ${attack.damage}`, textStyles.other).setOrigin(0);
            const speed = this.add.text(190, 125, `SPEED:   ${attack.speed}`, textStyles.other).setOrigin(0);
            const knockbackValue = attack.knockback < 1 ? 0 : attack.knockback;
            const knockback = this.add.text(110, 150, `KNOCKBACK:   ${knockbackValue}`, textStyles.other).setOrigin(0);
            attackContainer.add([titlePrefix, damage, knockback, speed]);
            menu.add(attackContainer);
        });
    }

    itemMenu() {
        if (PlayerState.isMenuOpen) {
    return;
        }

        const allItems = Object.values(itemInfo);

        const itemsContainer = this.add.container(250, 150);

        const menu = this.add.container(Math.round(this.x - 345), (this.y * 2) - 448);
        const menuBackground = this.add.image(0, 0, 'craftModal').setOrigin(0, 0);
        menu.add(menuBackground);
        const titlePrefix = this.add.text(150, 30, 'CRAFT', textStyles.mainTitleTwo).setOrigin(0, 0);
        menu.add(titlePrefix);
        menu.alpha = 0;

        const closeButton = this.add.text(640, 20, 'x', textStyles.close).setInteractive().setOrigin(0, 0);
        menu.add(closeButton);

        menu.add(itemsContainer);

        // In the itemMenu function
        this.input.keyboard.on('keydown-ESC', () => {
            menu.destroy();
            PlayerState.isMenuOpen = false;
        });

        closeButton.on('pointerover', () => {
            closeButton.setStyle({ fill: '#ff0000', stroke: '#ff0000' });
        });

        closeButton.on('pointerout', () => {
            closeButton.setStyle(textStyles.close);
        });

        closeButton.on('pointerdown', () => {
            menu.destroy();
            PlayerState.isMenuOpen = false;
        });

        this.input.on('pointerdown', (pointer) => {
            if (!menu.getBounds().contains(pointer.x, pointer.y) &&
                !this.itemMenuButton.getBounds().contains(pointer.x, pointer.y)) {
                menu.destroy();
                PlayerState.isMenuOpen = false;
            }
        });

        // Create a graphics object
        const mask = this.add.graphics({});
        // Draw a rectangle on the graphics object
        mask.fillRect((this.x - 170), (this.y * 2) - 368, 500, 260);
        menu.add(mask);

        this.tweens.add({
            targets: menu,
            alpha: 1, // Final opacity
            duration: 1200, // Duration of the tween in milliseconds
            ease: 'Power2', // Easing function
            onComplete: () => { // Add an onComplete callback
                // Round the final position of the menu to the nearest whole pixel
                menu.x = Math.round(menu.x);
                menu.y = Math.round(menu.y);
            }
        });
        const filteredItems = allItems.filter(item => item.ingredients && item.ingredients.length > 0);

        this.ingredientsContainer = this.add.container(0, 0);
        menu.add(this.ingredientsContainer);


        filteredItems.forEach((item, index) => {
            const row = Math.floor(index / 3); // Change 3 to the number of columns you want
            const col = index % 3; // Change 3 to the number of columns you want

            if (!this.itemsGrid[row]) {
                this.itemsGrid[row] = [];
            }
            this.itemContainer = this.add.container(col * 160, row * 150); // Increase the y-offset to add spacing
            const backgroundSprite = this.add.sprite(0, 0, 'craftSlot').setOrigin(0.5, 0.5);
            this.itemContainer.add(backgroundSprite);

            // Add a second background sprite for the selected state
            const selectedBackgroundSprite = this.add.sprite(0, 0, 'craftSlotSelect').setOrigin(0.5, 0.5).setVisible(false);
            this.itemContainer.add(selectedBackgroundSprite);

            const sprite = this.add.sprite(0, 0, item.itemName.toLowerCase()).setInteractive().setScale(2).setOrigin(0.5, 0.5);
            this.itemContainer.add(sprite);

            // Check if the player has all the ingredients for the item
if (!this.playerHasIngredients(item)) {
    // If the player does not have all the ingredients, add a grey alpha to the sprite
    sprite.setTint(0x808080); // Set the color to grey
    sprite.setAlpha(0.5); // Set the alpha to 0.5
}

            itemsContainer.add(this.itemContainer);

            // Set the interactive property on the item container
            this.itemContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.itemContainer.getBounds().width, this.itemContainer.getBounds().height), Phaser.Geom.Rectangle.Contains);

            // Attach the pointerdown event to the item container
            this.itemContainer.on('pointerdown', () => {
                this.createItem(item.itemName);
            });
            this.itemsGrid[row][col] = { item, itemContainer: this.itemContainer, selectedBackgroundSprite };
        });

        // Create a geometry mask using the graphics object
        const geometryMask = new Phaser.Display.Masks.GeometryMask(this, mask);
        itemsContainer.setMask(geometryMask);

        this.updateSelectedItem(0, 0); // Select the first item


        //apply this.mask to menu
    }

    // Function to check if the player has all the ingredients for an item
    playerHasIngredients(item) {
        // Iterate over the ingredients of the item
        for (let ingredient of item.ingredients) {
            // Find the ingredient in the player's inventory
            const inventoryItem = PlayerState.inventory.find(i => i.name === ingredient);

            // Check if the ingredient is in the player's inventory and the player has enough quantity
            if (!inventoryItem || inventoryItem.quantity < 1) {
                // If the ingredient is not in the player's inventory or the player doesn't have enough quantity, return false
                return false;
            }
        }

        // If all the ingredients are in the player's inventory and the player has enough quantity, return true
        return true;
    }

    updateSelectedItem(newRow, newCol) {
        if (!this.itemsGrid[newRow] || !this.itemsGrid[newRow][newCol]) {
            return; // If the cell doesn't exist, exit the function
        }
        const shift = (newRow - this.selectedItem.row) * 20;

        // In your updateSelectedItem function
        const currentItem = this.itemsGrid[this.selectedItem.row][this.selectedItem.col];
        currentItem.selectedBackgroundSprite.setVisible(false); // Hide the selected background sprite of the current item

        // Clear the ingredients container
        this.ingredientsContainer.removeAll(true);

        // Select the new item
        this.selectedItem = { row: newRow, col: newCol };
        const newItem = this.itemsGrid[this.selectedItem.row][this.selectedItem.col];
        newItem.selectedBackgroundSprite.setVisible(true); // Show the selected background sprite of the new item

        // Add the item name to the ingredients container
        const itemNameText = this.add.text(25, 25, newItem.item.friendlyName, { ...textStyles.titleIngredients, wordWrap: { width: 100 } }).setOrigin(0, 0);
        this.ingredientsContainer.add(itemNameText);

        // Calculate the height of itemNameText after it wraps
        const itemNameTextHeight = itemNameText.getBounds().height;

        // Set the y position of itemDescriptionText to be a fixed distance below itemNameText
        const itemDescriptionText = this.add.text(25, itemNameTextHeight + 35, newItem.item.description, { ...textStyles.titleIngredients, wordWrap: { width: 100 } }).setOrigin(0, 0);
        this.ingredientsContainer.add(itemDescriptionText);

        for (let row of this.itemsGrid) {
            // Loop through each item in the row
            for (let item of row) {
                // Adjust the y position of the item container
                item.itemContainer.y -= shift;
            }
        }

        // In the updateSelectedItem function
        if (newItem.item.ingredients) {
            // Calculate the height of itemDescriptionText after it wraps
            const itemDescriptionTextHeight = itemDescriptionText.getBounds().height;

            // Create a new array that only contains unique ingredients
            const uniqueIngredients = [...new Set(newItem.item.ingredients)];

            uniqueIngredients.forEach((ingredient, ingredientIndex) => {
                // Calculate the quantity required for the ingredient
                const quantityRequired = newItem.item.ingredients.filter(i => i === ingredient).length;

                // Create a text object that shows the quantity required
                const quantityText = this.add.text(25, (itemNameTextHeight) + itemDescriptionTextHeight + 55 + ingredientIndex * 35, `${quantityRequired}x`, textStyles.other).setOrigin(0, 0.5);
                this.ingredientsContainer.add(quantityText);

                // Adjust the x-coordinate of the ingredient sprite to make room for the quantity text
                const ingredientSprite = this.add.sprite(50, (itemNameTextHeight) + itemDescriptionTextHeight + 55 + ingredientIndex * 35, ingredient.toLowerCase()).setScale(1).setOrigin(0, 0.5);
                this.ingredientsContainer.add(ingredientSprite);

                // Check if the player has the ingredient
                const inventoryItem = PlayerState.inventory.find(i => i.name === ingredient);
                const hasIngredient = inventoryItem && inventoryItem.quantity >= quantityRequired;

                // Add a 'check' or 'cross' image next to the ingredient
                const checkCrossSprite = this.add.sprite(85, (itemNameTextHeight) + itemDescriptionTextHeight + 55 + ingredientIndex * 35, hasIngredient ? 'check' : 'cross').setScale(1).setOrigin(0, 0.5);
                this.ingredientsContainer.add(checkCrossSprite);
            });
        } else {
            const noIngredientsText = this.add.text(110, 25, 'No ingredients', textStyles.other).setOrigin(0, 0);
            this.ingredientsContainer.add(noIngredientsText);
        }

    }


    handleDancingLevelUp() {
        this.isLevelingUp = true;
        this.tweens.add({
            targets: this.dancingBar.fill,
            displayWidth: 142,
            duration: 500,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.dancingBar.fill.displayWidth = 0;
                this.isLevelingUp = false;
                this.updateSkillsDisplay();
                this.updateAttackBonusDisplay();
                this.updateFireBonusDisplay();
                this.updateTreesBonusDisplay();
                this.updateDefenceBonusDisplay();


                // Get the attacks that match the player's current level
                const currentLevelAttacks = getAttacksForCurrentLevel(PlayerState.level);
                const unlockedAttacks = unlockedAttacksForLevel();


                // Check if there are any attacks for the current level
                if (currentLevelAttacks.length > 0) {
                    const modal = this.add.container(this.x - 165, this.y - 150); // Start off-screen
                    const modalBackground = this.add.image(0, 0, 'modal').setOrigin(0);
                    const modalWidth = 330; // Replace with your modal's width
                    modal.add(modalBackground);
                    //set depth to 0:
                    modalBackground.setDepth(0);
                    modal.alpha = 0;

                    this.tweens.add({
                        targets: modal,
                        y: this.y - 275, // Final position
                        alpha: 1, // Final opacity
                        duration: 1500, // Duration of the tween in milliseconds
                        ease: 'Power2', // Easing function
                    });

                    const keys = ['Z', 'Z', 'X', 'C'];

                    currentLevelAttacks.forEach((attack, index) => {
                        const attackIndex = unlockedAttacks.findIndex(unlockedAttack => unlockedAttack.name === attack.name);
                        const frame = this.add.container(0, index * 60);
                        const image = this.add.image(0, 0, attack.name).setScale(.5).setDepth(2).setOrigin(0.5);
                        image.setPosition(modalWidth / 2, 50);
                        const titlePrefix = this.add.text(30, 75, 'UNLOCKED    ' + attack.name.toUpperCase(), textStyles.title).setOrigin(0);
                        const key = this.add.text(30, 105, `KEY:   ${keys[attackIndex]}`, textStyles.other).setOrigin(0);
                        const damage = this.add.text(190, 105, `DMG:   ${attack.damage}`, textStyles.other).setOrigin(0);
                        const speed = this.add.text(190, 130, `SPEED:   ${attack.speed}`, textStyles.other).setOrigin(0);
                        const knockback = this.add.text(30, 130, `KNOCKBACK:   ${attack.knockback}`, textStyles.other).setOrigin(0);

                        frame.add([image, titlePrefix, key, damage, knockback, speed]);
                        modal.add(frame);
                    });

                    // Set a timer to destroy the modal after 5 seconds
                    this.time.delayedCall(6500, () => {
                        this.tweens.add({
                            targets: modal,
                            alpha: 0, // Final alpha (0 = transparent, 1 = opaque)
                            duration: 1000, // Duration of the tween in milliseconds
                            ease: 'Power2', // Easing function
                            onComplete: () => modal.destroy() // Destroy the modal when the tween completes
                        });
                    });
                }
                // Create a sprite for the heal animation
                const heal = this.add.sprite(this.x, this.y, 'heal');
                heal.play('heal');

                heal.on('animationcomplete', () => {
                    heal.destroy();
                }, this);
                // Add level up text
                const levelUpText = this.add.text(this.x, this.y, 'LEVEL   UP!', textStyles.levelUpText).setOrigin(0.5);
                this.createGradientText2(levelUpText);
                this.tweens.add({
                    targets: [levelUpText, levelUpText.gradientSprite2],
                    y: '-=150',
                    alpha: 0, // Fade out the text
                    duration: 6000, // Duration of 2 seconds
                    ease: 'Power2',
                    onComplete: () => {
                        levelUpText.destroy(); // Destroy the text object after the tween completes
                        //destroy the greadient sprite
                        if (levelUpText.gradientSprite2) {
                            levelUpText.gradientSprite2.destroy();
                        }
                    }
                });
            }
        });
    }

    createProgressBar(x, y) {
        const progressBarWidth = 142;
        const progressBarHeight = 15;
        const outerRect = this.add.rectangle(228, 113 + progressBarHeight / 2, progressBarWidth, progressBarHeight, 0x000000);
        outerRect.setOrigin(0, 1); // Set the origin to the bottom left corner

        const progressFill = this.add.rectangle(228, 113 + progressBarHeight / 2, progressBarWidth, progressBarHeight, 0x42C5E6);
        progressFill.setOrigin(0, 1); // Set the origin to the bottom left corner
        progressFill.displayWidth = 0;
        outerRect.setDepth(1);
        progressFill.setDepth(1);

        return { outer: outerRect, fill: progressFill };
    }

    // Initialize static elements in a separate method or in the constructor
    initializeStaticElements() {

        this.dancingFrame = this.add.image(245, 80, 'frame').setOrigin(0.5).setDepth(2);
        this.dancingBar = this.createProgressBar(0, 0);
        this.skillsContainer = this.add.container(0, 0);
        this.skillsContainer.add([this.dancingBar.outer, this.dancingBar.fill]);
        this.xpText = this.add.text(204, 110, `XP`, textStyles.playerLevelText).setOrigin(0.5).setDepth(3).setScale(.8, 1.1);
        this.createGradientText(this.xpText);
        this.skillsContainer.add([this.dancingFrame, this.xpText]);
        //play the sit animation for cat inside the skills container
        this.cat = this.add.sprite(58, 85, 'cat').setOrigin(0.5).setScale(1);
        //add the first frame of sit anim
        this.cat.play('sit');
        //add a circle masking the cat
        // Create a graphics object
        let graphics = this.make.graphics({ x: 0, y: 0, add: false });
        // Draw a circle on the graphics object
        graphics.fillCircle(76, 70, 50);
        // Create a mask using the graphics object
        let mask = graphics.createGeometryMask();
        // Apply the mask to the cat
        this.cat.setMask(mask);
        // Add the cat to the skillsContainer
        this.skillsContainer.add(this.cat);
        this.attackBonusIcon = this.add.image(0, 0, 'bonusattack').setOrigin(0.5).setDepth(2);
        this.fireBonusIcon = this.add.image(0, 0, 'bonusfire').setOrigin(0.5).setDepth(2);
        this.defenceBonusIcon = this.add.image(0, 0, 'bonusdefence').setOrigin(0.5).setDepth(2);
        this.treesBonusIcon = this.add.image(0, 0, 'bonustrees').setOrigin(0.5).setDepth(2);

        this.mainBonusContainer = this.add.container((this.x * 2) - 50, this.y - 60);

        this.attackBonusContainer = this.add.container(0, -110);
        this.attackBonusContainer.add(this.attackBonusIcon);
        this.mainBonusContainer.add(this.attackBonusContainer);

        this.defenceBonusContainer = this.add.container(0, 0);
        this.defenceBonusContainer.add(this.defenceBonusIcon);
        this.mainBonusContainer.add(this.defenceBonusContainer);

        this.fireBonusContainer = this.add.container(0, 110);
        this.fireBonusContainer.add(this.fireBonusIcon);
        this.mainBonusContainer.add(this.fireBonusContainer);

        this.treesBonusContainer = this.add.container(0, 220);
        this.treesBonusContainer.add(this.treesBonusIcon);
        this.mainBonusContainer.add(this.treesBonusContainer);

    }

    // Function to get the attacks for a specific level
    getAttacksForLevel(level) {
        return this.attacks.filter(attack => attack.level === level);
    }

    updateSkillsDisplay() {
        if (this.isLevelingUp) {
            this.time.delayedCall(600, this.updateSkillsDisplay, [], this);
            return;
        }

        if (this.dancingText) {
            // Destroy the gradient sprite
            if (this.dancingText.gradientSprite) {
                this.dancingText.gradientSprite.destroy();
            }

            this.dancingText.destroy();
            this.dancingText = null;
            this.dancingTextReady = false; // Set the flag to false here
        }

        const currentXP = getSkillXP('dancing');
        const requiredXP = xpRequiredForLevel(getSkillLevel('dancing'));
        const dancingXPProgress = currentXP / requiredXP;
        const targetWidth = 142 * dancingXPProgress;

        this.tweens.add({
            targets: this.dancingBar.fill,
            displayWidth: targetWidth,
            duration: 500,
            ease: 'Sine.easeInOut'
        });

        this.dancingText = this.add.text(131, 113, `${getSkillLevel('dancing')}`, textStyles.playerLevelText).setOrigin(0.5).setDepth(3);
        this.dancingTextReady = true; // Set the flag to true here

        if (this.dancingTextReady) {
            this.createGradientText(this.dancingText);
        }

        // Add the dancingText to the skillsContainer
        this.skillsContainer.add(this.dancingText);

        this.createAttackSelectionMenu();
    }

    updateAttackBonusDisplay() {
        if (this.attackBonusText) {
            this.attackBonusText.destroy();
            this.attackBonusContainer.remove(this.attackBonusText);
        }

        this.attackBonusText = this.add.text(0, 40, `${(PlayerState.attackBonus / 100)}`, textStyles.playerBonus).setOrigin(0.5).setDepth(3).setScale(0.9, 1);

        this.attackBonusContainer.add(this.attackBonusText);
    }

    updateTreesBonusDisplay() {
        if (this.treesBonusText) {
            this.treesBonusText.destroy();
            this.treesBonusContainer.remove(this.treesBonusText);
        }

        this.treesBonusText = this.add.text(0, 40, `${(PlayerState.treesBonus / 100)}`, textStyles.playerBonus).setOrigin(0.5).setDepth(3).setScale(0.9, 1);

        this.treesBonusContainer.add(this.treesBonusText);
    }

    updateFireBonusDisplay() {
        if (this.fireBonusText) {
            this.fireBonusText.destroy();
            this.fireBonusContainer.remove(this.fireBonusText);
        }

        this.fireBonusText = this.add.text(0, 40, `${(PlayerState.fireBonus / 100)}`, textStyles.playerBonus).setOrigin(0.5).setDepth(3).setScale(0.9, 1);

        this.fireBonusContainer.add(this.fireBonusText);
    }

    updateDefenceBonusDisplay() {
        if (this.defenceBonusText) {
            this.defenceBonusText.destroy();
            this.defenceBonusContainer.remove(this.defenceBonusText);
        }

        this.defenceBonusText = this.add.text(0, 40, `${(PlayerState.defenceBonus / 100)}`, textStyles.playerBonus).setOrigin(0.5).setDepth(3).setScale(0.9, 1);

        this.defenceBonusContainer.add(this.defenceBonusText);
    }

    createGradientText(textObject) {
        // Check if the text object exists
        if (textObject) {
            // Create a sprite with the gradient texture at the same position as the text object
            let gradientSprite = this.add.sprite(textObject.x, textObject.y, 'lux').setOrigin(0.5);

            // Create a mask using the text object
            let mask = textObject.createBitmapMask();

            // Apply the mask to the sprite
            gradientSprite.setMask(mask);

            // Hide the text so only the gradientSprite is visible
            textObject.setVisible(false);

            // Store the gradient sprite in the text object for later use
            textObject.gradientSprite = gradientSprite;
        }
    }


    createGradientText2(textObject) {
        // Check if the text object exists
        if (textObject) {
            // Create a sprite with the gradient texture at the same position as the text object
            let gradientSprite2 = this.add.sprite(textObject.x, textObject.y, 'goldTexture').setOrigin(0.5);

            // Create a mask using the text object
            let mask2 = textObject.createBitmapMask();

            // Apply the mask to the sprite
            gradientSprite2.setMask(mask2);

            // Hide the text so only the gradientSprite is visible
            textObject.setVisible(false);

            // Store the gradient sprite in the text object for later use
            textObject.gradientSprite2 = gradientSprite2;
        }
    }

    createEnergyBar(x, y) {

        const progressBarWidth = 256;
        const progressBarHeight = 32;
        const borderOffset = 2;
        const outerRect = this.add.rectangle(x + 53, y, progressBarWidth + 2 * borderOffset, progressBarHeight + 2 * borderOffset, 0x000000);
        outerRect.setOrigin(0, 0.5);

        const progressFill = this.add.rectangle(x + borderOffset + 53, y, progressBarWidth, progressBarHeight, 0x00ff00);
        progressFill.setOrigin(0, 0.5);
        progressFill.displayWidth = 0;

        return { outer: outerRect, fill: progressFill };
    }

    updateEnergyBar() {
        const previousEnergy = PlayerState.previousEnergy || PlayerState.energy;
        const displayedEnergy = Math.max(0, PlayerState.energy); // Cap the energy to be non-negative
        const energyProgress = Math.max(0, PlayerState.energy / 100);
        const targetWidth = 256 * energyProgress;
        const hue = (PlayerState.energy / 100) * 120;
        const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.8, 0.5).color;

        this.energyBar.fill.setFillStyle(color);
        this.tweens.add({
            targets: this.energyBar.fill,
            displayWidth: targetWidth,
            duration: 100,
            ease: 'Sine.easeInOut'
        });
        if (this.energyText) {
            // Destroy the gradient sprite
            if (this.energyText.gradientSprite) {
                this.energyText.gradientSprite.destroy();
            }

            this.energyText.destroy();
            this.energyText = null;

            this.energyText = this.add.text(this.energyx, this.energyy, `${displayedEnergy.toFixed(0)}`, textStyles.energyText).setOrigin(0.5).setDepth(3);

            this.createGradientText(this.energyText);
        }
        this.trianglePosition = this.trianglePosition || 0;
        const energyChange = displayedEnergy - previousEnergy;
        this.trianglePosition = (this.trianglePosition + 1) % 3;

        let xOffset, yOffset;
        if (this.trianglePosition === 0) {
            xOffset = 0;
            yOffset = 0;
        } else if (this.trianglePosition === 1) {
            xOffset = 0;
            yOffset = 40; // 40 is the vertical distance between texts
        } else {
            xOffset = 40; // 40 is the horizontal distance between texts
            yOffset = 0;
        }

        if (energyChange > 0 && PlayerState.JustAte) {
            const changeText = this.add.text(
                this.x + xOffset,
                this.y + yOffset,
                `+${energyChange.toFixed(0)}`, // Add a plus sign before the energy change
                {
                    fill: '#00ff00', // Change the color to green
                    stroke: '#000000',
                    strokeThickness: 6,
                    fontFamily: 'Ninja',
                    fontSize: '42px'
                }
            ).setDepth(5).setOrigin(0.5); // Set origin to center
            this.activeChangeTexts++;

            this.tweens.add({
                targets: changeText,
                y: changeText.y - 20,
                alpha: 0,
                duration: 1200,
                onComplete: () => {
                    changeText.destroy();
                    this.activeChangeTexts--; // Decrease the counter when a text is removed
                }
            });
        }
        else if (energyChange < 0 && PlayerState.isUnderAttack) {
            const changeText = this.add.text(
                this.x
                + xOffset,
                this.y + yOffset,
                `${Math.abs(energyChange).toFixed(0)}`, // Use Math.abs to remove the negative sign
                {
                    fill: '#ff0000',
                    stroke: '#000000',
                    strokeThickness: 6,
                    fontFamily: 'Ninja',
                    fontSize: '42px'
                }
            ).setDepth(5).setOrigin(0.5); // Set origin to center
            this.activeChangeTexts++;

            this.tweens.add({
                targets: changeText,
                y: changeText.y - 20,
                alpha: 0,
                duration: 1200,
                onComplete: () => {
                    changeText.destroy();
                    this.activeChangeTexts--; // Decrease the counter when a text is removed
                }
            });
        } else if (energyChange === 0 && PlayerState.isUnderAttack) {
            const missText = this.add.text(
                this.x
                + xOffset,
                this.y + yOffset,
                'MISS',
                {
                    fontFamily: 'Ninja',
                    fontSize: '42px',
                    fill: '#2196f3',
                    stroke: '#000000',
                    fontWeight: 'bold',
                    strokeThickness: 6,
                }
            ).setDepth(5).setOrigin(0.5); // Set origin to center
            this.activeChangeTexts++;

            this.tweens.add({
                targets: missText,
                y: missText.y - 20,
                alpha: 0,
                duration: 1200,
                onComplete: () => {
                    missText.destroy();
                    this.activeChangeTexts--;
                }
            });
        }

        PlayerState.previousEnergy = displayedEnergy; // Store the capped energy as previous for next update
    }


    handleInventorySelection() {
        this.inventoryContainer.removeAll(true);

        const xOffset = -260;

        PlayerState.inventory.forEach((item, index) => {
            const x = xOffset + index * 56.5; // x increments by the index, starting from xOffset
            const y = -2; // y is a fixed value

            // Display the 'select.png' icon over the selected slot
            if (index === this.selectedIndex) {
                // Add a semi-transparent rectangle behind the selected item
                const highlight = this.add.rectangle(x, y + 1, 55, 55, 0xffffff, 0.75);
                this.inventoryContainer.add(highlight);
            }

            const sprite = this.add.sprite(x, y, item.name.toLowerCase()).setInteractive().setScale(1).setOrigin(0.5);
            const zone = this.add.zone(x, y, 55, 55).setOrigin(0.5).setInteractive().setDepth(2);
            zone.on('pointerdown', (pointer) => {
                this.selectedIndex = index;
                if (pointer.leftButtonDown()) {
                    this.useItem(item.name);
                }
                this.handleInventorySelection();
            });

            this.inventoryContainer.add([sprite, zone]);

            if (item.quantity > 1) {
                let quantityStr = this.formatQuantity(item.quantity);
                let textWidth = quantityStr.length * 6; // Approximate width of one character. Adjust as needed.
                const quantityText = this.add.text(x - textWidth, y, quantityStr, {
                    fontSize: '18px',
                    fontFamily: 'Ninja',
                    fill: 'black',
                    stroke: 'white',
                    strokeThickness: 3,
                });
                this.inventoryContainer.add(quantityText);
            }

            if (index === this.selectedIndex) {
                const selectIcon = this.add.image(x, y + 1, 'select').setOrigin(0.5);
                this.inventoryContainer.add(selectIcon);
            }
        });
    }

    formatQuantity(quantity) {
        if (quantity >= 1000) {
            let divided = quantity / 1000;
            if (Math.floor(divided) === divided) {
                return divided + 'k';
            } else {
                return divided.toFixed(1) + 'k';
            }
        } else {
            return quantity.toString();
        }
    }

    updateInventoryDisplay() {
        this.inventoryContainer.removeAll(true);

        const inventory = PlayerState.inventory || [];
        const xOffset = -260; // Change this value to adjust the starting position of the items

        inventory.forEach((item, index) => {
            const x = xOffset + index * 56.5; // x increments by the index, starting from xOffset
            const y = -2; // y is a fixed value

            const sprite = this.add.sprite(x, y, item.name.toLowerCase()).setInteractive({ draggable: true }).setScale(1).setOrigin(0.5).setDepth(1);
            const zone = this.add.zone(x, y, 55, 55).setOrigin(0.5).setInteractive().setDepth(2);

            sprite.on('drag', (pointer, dragX, dragY) => {
                sprite.x = dragX; // Update the sprite's x position as it's being dragged
                sprite.y = dragY; // Update the sprite's y position as it's being dragged
            });

            sprite.on('dragend', (pointer, dragX, dragY) => {
                const dropIndex = Math.round((dragX - xOffset) / 56.5); // Calculate the index of the slot where the sprite was dropped
                if (dropIndex >= 0 && dropIndex < inventory.length) {
                    // If the drop index is valid, swap the items in the inventory array
                    const temp = inventory[index];
                    inventory[index] = inventory[dropIndex];
                    inventory[dropIndex] = temp;

                    this.updateInventoryDisplay(); // Update the inventory display
                } else {
                    // If the drop index is not valid, return the sprite to its original position
                    sprite.x = x;
                    sprite.y = y;
                }
            });

            zone.on('pointerdown', (pointer) => {
                this.selectedIndex = index;
                if (pointer.leftButtonDown()) {
                    this.useItem(item.name);
                }
            });


            // Display the 'select.png' icon over the selected slot
            if (index === this.selectedIndex) {
                // Add a semi-transparent rectangle behind the selected item
                const highlight = this.add.rectangle(x, y + 1, 55, 55, 0xffffff, 0.75);
                this.inventoryContainer.add(highlight);
            }

            this.inventoryContainer.add([sprite, zone]);

            if (item.quantity > 1) {
                let quantityStr = this.formatQuantity(item.quantity);
                let textWidth = quantityStr.length * 6; // Approximate width of one character. Adjust as needed.
                const quantityText = this.add.text(x - textWidth, y, quantityStr, {
                    fontSize: '18px',
                    fontFamily: 'Ninja',
                    fill: 'black',
                    stroke: 'white',
                    strokeThickness: 3,
                });
                this.inventoryContainer.add(quantityText);
            }

            if (index === this.selectedIndex) {
                const selectIcon = this.add.image(x, y + 1, 'select').setOrigin(0.5);
                this.inventoryContainer.add(selectIcon);
            }
        });
    }

    consumeItem(itemName) {
        const item = itemInfo[itemName];
        if (item && item.itemConsumable) {
            //return if player is eating already
            if (PlayerState.isEating || PlayerState.isAttacking) {
                return;
            }
            PlayerState.isEating = true;
            PlayerState.JustAte = true;

            // Apply consumeEffects
            Object.keys(item.consumeEffects).forEach(effect => {
                PlayerState[effect] += item.consumeEffects[effect];
            });

            // Cap energy at 100
            if (PlayerState.energy > 100) {
                PlayerState.energy = 100;
            }

            const heal = this.add.sprite(this.x, this.y, 'heal');
            heal.play('heal');
            heal.setTint(0x00ff00);

            heal.on('animationcomplete', () => {
                heal.destroy();
            }, this);

            this.destroyItem(itemName);
            this.updateInventoryDisplay(); // Update the inventory display
            this.updateAttackBonusDisplay();
            this.updateFireBonusDisplay();
            this.updateTreesBonusDisplay();
            this.updateDefenceBonusDisplay();
            this.updateEnergyBar()
            PlayerState.JustAte = false;
        } else {
            this.destroyItem(itemName);
        }
    }

    //craft item function
    createItem(itemName) {
        const item = itemInfo[itemName];
        if (item && item.ingredients) {
            // Check if player has all the required ingredients
            const hasIngredients = item.ingredients.every(ingredientName => {
                const ingredient = PlayerState.inventory.find(invItem => invItem.name.toLowerCase() === ingredientName.toLowerCase());
                return ingredient && ingredient.quantity >= 1;  // Check if ingredient exists and quantity is enough
            });

            if (hasIngredients) {
                // Reduce the quantity of the ingredients used
                item.ingredients.forEach(ingredientName => {
                    const ingredient = PlayerState.inventory.find(invItem => invItem.name === ingredientName);
                    if (ingredient.quantity > 1) {
                        ingredient.quantity--;
                    } else {
                        const ingredientIndex = PlayerState.inventory.indexOf(ingredient);
                        PlayerState.inventory.splice(ingredientIndex, 1);
                    }
                });

                // Check if the new item already exists in the inventory
                const existingItem = PlayerState.inventory.find(invItem => invItem.name === item.itemName);

                if (existingItem) {
                    // If the item already exists, increment its quantity
                    existingItem.quantity++;
                } else {
                    // If the item doesn't exist, add it to the inventory
                    const newItem = {
                        name: item.itemName,
                        quantity: 1
                    };
                    PlayerState.inventory.push(newItem);
                }

                this.updateInventoryDisplay(); // Update the inventory display
            } else {
                console.log('You do not have the required ingredients to create this item.');
            }
        } else {
            console.log('This item cannot be created.');
        }

        console.log('Final inventory:', JSON.stringify(PlayerState.inventory));  // Print final inventory
    }

    destroyItem(itemName) {
        const index = PlayerState.inventory.findIndex(item => item.name === itemName);
        if (index !== -1) {
            const item = PlayerState.inventory[index];
            if (item.quantity > 1) {
                item.quantity--;
            } else {
                PlayerState.inventory.splice(index, 1);
            }
            this.updateInventoryDisplay(); // Update the inventory display
        } else {
        }
    }
    useItem(itemName) {
        const item = itemInfo[itemName.charAt(0).toUpperCase() + itemName.slice(1)];
        if (item) {
            if (itemName.toLowerCase() === 'log' && PlayerState.isNearFire) {
                this.mainScene.useLogOnFire(this.fire);
                this.consumeItem(itemName);
            } else if (item.itemConsumable) {
                this.consumeItem(itemName);
            }
            this.updateInventoryDisplay(); // Update the inventory display
        } else {
        }
    }

    clearInventory() {
        PlayerState.inventory = [];
        this.inventoryContainer.removeAll(true);
        //delete the items from the inventory container;
        this.selectedIndex = 0;

        this.updateInventoryDisplay(); // Update the inventory display
    }


}