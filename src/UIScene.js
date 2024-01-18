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
        this.isMenuOpen = false;
    }

    create() {

        this.x = this.cameras.main.width / 2;
        this.y = this.cameras.main.height / 2;
        this.timeFilter = this.add.graphics();
        this.energyText = null;
        this.activeChangeTexts = 0;
        // Create the text objects
        this.saveButtonText = this.add.text((this.x * 2) - 140, (this.y * 2) - 40, 'SAVE', textStyles.indicator).setVisible(false);
        this.attackMenuButtonText = this.add.text(80, (this.y * 2) - 40, 'ATTACKS', textStyles.indicator).setVisible(false);

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
            .on('pointerdown', () => this.attackMenu())
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
        Promise.all([ninjaFontObserver.load()]).then(() => {
            this.updateInventoryDisplay();
            const userid = PlayerState.userid;
            let useridText = `${userid}`;
            this.userText = this.add.text(20, 85, useridText, { fontFamily: 'Ninja', fontSize: '20px', fill: 'gold', stroke: 'black', strokeThickness: 3 });
            this.energyText = this.add.text(this.x + 182, 48, ``, textStyles.energyText);
            this.add.existing(this.energyText);
            this.createAttackSelectionMenu();
            this.initializeStaticElements();

            // Create dayText with initial value
            dayText = this.add.text((this.x * 2) - 130, 30, `DAY ${PlayerState.days}`, textStyles.daysPassed);

            // Create progress bar and add it to the container

            // Set the depth of the container to ensure it's rendered above other elements
            this.updateSkillsDisplay();
            this.updateEnergyBonusDisplay();
            this.updateAttackBonusDisplay();
            this.updateKnockbackBonusDisplay();
            this.updateExploreBonusDisplay();
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

        const bag = this.add.image(this.x, (this.y * 2) - 50, 'bag').setOrigin(0.5);
        this.add.existing(bag);

        this.inventoryContainer = this.add.container(this.x, (this.y * 2) - 50);

        this.game.events.on('playerStateUpdated', this.createAttackSelectionMenu, this);
        this.game.events.on('updateSkillsDisplay', this.updateSkillsDisplay, this);

        this.game.events.on('levelUp', (skillName) => {
            if (skillName === 'dancing') {
                this.handleDancingLevelUp();
            }
        });

        this.energyBar = this.createEnergyBar((this.x - 215), 50);
        this.add.existing(this.energyBar.outer);
        this.add.existing(this.energyBar.fill);
        this.updateEnergyBar();
        this.game.events.on('energyChanged', this.updateEnergyBar, this);

        this.input.keyboard.on('keydown', (event) => {
            switch (event.key) {
                case 'q':
                    if (this.selectedIndex !== undefined) {
                        this.selectedIndex--; // If an index is already selected, move selection to the left
                        if (this.selectedIndex < 0) {
                            this.selectedIndex = PlayerState.inventory.length - 1; // Wrap around to the end if index goes below 0
                        }
                    } else {
                        this.selectedIndex = 0; // If no index is selected, focus on the first item in the inventory
                    }
                    this.handleInventorySelection();
                    break;
                case 'w':
                    if (this.selectedIndex !== undefined) {
                        this.selectedIndex++; // If an index is already selected, move selection to the right
                        if (this.selectedIndex >= PlayerState.inventory.length) {
                            this.selectedIndex = 0; // Wrap around to the start if index goes above the inventory length
                        }
                    } else {
                        this.selectedIndex = 0; // If no index is selected, focus on the first item in the inventory
                    }
                    this.handleInventorySelection();
                    break;
                case 's':
                    this.saveGame();
                    break;
                case 'e':
                    const selectedItem = PlayerState.inventory[this.selectedIndex];
                    if (selectedItem) {
                        this.useItem(selectedItem.name);
                    }
                    break;
                default:
                    break;
            }
        });
    }

    async saveGame() {
        if (PlayerState.isUnderAttack && !this.isSaveTextVisible) {
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
            if (attack.name === 'scratch' ) return;
    
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
        if (this.isMenuOpen) {
            return;
        }

        this.isMenuOpen = true;
    
        const allAttacks = Object.values(attacks);

        const menu = this.add.container(-340, this.y- 300); 
        const menuBackground = this.add.image(0, 0, 'menu').setOrigin(0);
        menu.add(menuBackground);
        const titlePrefix = this.add.text(175, 55, 'ATTACKS', textStyles.mainTitle).setOrigin(0.5);
        menu.add(titlePrefix);
        //alpha 0 on menu
        menu.alpha = 0;
        
        const closeButton = this.add.text(315, 30, 'x', textStyles.close).setInteractive().setOrigin(0.5);
        menu.add(closeButton);

        closeButton.on('pointerover', () => {
            closeButton.setStyle({ fill: '#ff0000', stroke: '#ff0000'});
        });
        
        closeButton.on('pointerout', () => {
            closeButton.setStyle(textStyles.close);
        });
    
        closeButton.on('pointerdown', () => {
            menu.destroy();
            this.isMenuOpen = false;
        });
    
        this.input.on('pointerdown', (pointer) => {
            if (!menu.getBounds().contains(pointer.x, pointer.y) && 
                !this.attackMenuButton.getBounds().contains(pointer.x, pointer.y)) {
                    menu.destroy();
                    this.isMenuOpen = false;
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

    handleDancingLevelUp() {
        this.isLevelingUp = true;
        this.tweens.add({
            targets: this.dancingBar.fill,
            displayWidth: 126,
            duration: 500,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.dancingBar.fill.displayWidth = 0;
                this.isLevelingUp = false;
                this.updateSkillsDisplay();
                this.updateEnergyBonusDisplay();
                this.updateAttackBonusDisplay();
                this.updateKnockbackBonusDisplay();
                this.updateExploreBonusDisplay();
                this.updateDefenceBonusDisplay();


                // Get the attacks that match the player's current level
                const currentLevelAttacks = getAttacksForCurrentLevel(PlayerState.level);
                const unlockedAttacks = unlockedAttacksForLevel();


                // Check if there are any attacks for the current level
                if (currentLevelAttacks.length > 0) {
                    const modal = this.add.container(this.x - 165, -500); // Start off-screen
                    const modalBackground = this.add.image(0, 0, 'modal').setOrigin(0);
                    const modalWidth = 330; // Replace with your modal's width
                    modal.add(modalBackground);
                    modal.alpha = 0;

                    this.tweens.add({
                        targets: modal,
                        y: 100, // Final position
                        alpha: 1, // Final opacity
                        duration: 1500, // Duration of the tween in milliseconds
                        ease: 'Power2', // Easing function
                    });
                    
                    currentLevelAttacks.forEach((attack, index) => {
                        const attackIndex = unlockedAttacks.findIndex(unlockedAttack => unlockedAttack.name === attack.name);
                       
                        const frame = this.add.container(0, index * 60);
                        const image = this.add.image(0, 0, attack.name).setScale(.5).setDepth(2).setOrigin(0.5);
                        image.setPosition(modalWidth / 2, 50);
                        const titlePrefix = this.add.text(30, 75, 'UNLOCKED    ' + attack.name.toUpperCase(), textStyles.title).setOrigin(0);
                        const key = this.add.text(30, 105, `KEY:   ${attackIndex}`, textStyles.other).setOrigin(0);
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
        const progressBarWidth = 126;
        const progressBarHeight = 35;
        const outerRect = this.add.rectangle(165, 48 + progressBarHeight / 2, progressBarWidth, progressBarHeight, 0x000000);
        outerRect.setOrigin(0, 1); // Set the origin to the bottom left corner

        const progressFill = this.add.rectangle(165, 48 + progressBarHeight / 2, progressBarWidth, progressBarHeight, 0x42C5E6);
        progressFill.setOrigin(0, 1); // Set the origin to the bottom left corner
        progressFill.displayWidth = 0;
        outerRect.setDepth(1);
        progressFill.setDepth(1);

        return { outer: outerRect, fill: progressFill };
    }

    // Initialize static elements in a separate method or in the constructor
    initializeStaticElements() {
        this.dancingBar = this.createProgressBar(0, 0);

        this.skillsContainer = this.add.container(0, 0);
        this.skillsContainer.add([this.dancingBar.outer, this.dancingBar.fill]);

        this.lvText = this.add.text(45, 48, `lv`, textStyles.playerLevelText2).setOrigin(0.5).setDepth(3).setScale(1, 1.1);
        this.createGradientText(this.lvText);
        this.xpText = this.add.text(140, 48, `XP`, textStyles.playerLevelText).setOrigin(0.5).setDepth(3).setScale(.8, 1.1);
        this.createGradientText(this.xpText);
        this.dancingFrame = this.add.image(165, 50, 'frame').setOrigin(0.5).setDepth(2);
        this.skillsContainer.add([this.dancingFrame, this.xpText, this.lvText]);
        this.energyBonusIcon = this.add.image(0, 0, 'bonusenergy').setOrigin(0.5).setDepth(2);
        this.attackBonusIcon = this.add.image(0, 0, 'bonusattack').setOrigin(0.5).setDepth(2);
        this.knockbackBonusIcon = this.add.image(0, 0, 'bonusknockback').setOrigin(0.5).setDepth(2);
        this.exploreBonusIcon = this.add.image(0, 0, 'bonusexplore').setOrigin(0.5).setDepth(2);
        this.defenceBonusIcon = this.add.image(0, 0, 'bonusdefence').setOrigin(0.5).setDepth(2);

        this.mainBonusContainer = this.add.container((this.x * 2) - 50, this.y - 60);

        this.energyBonusContainer = this.add.container(0, 0);
        this.energyBonusContainer.add(this.energyBonusIcon);
        this.mainBonusContainer.add(this.energyBonusContainer);

        this.attackBonusContainer = this.add.container(0, -110);
        this.attackBonusContainer.add(this.attackBonusIcon);
        this.mainBonusContainer.add(this.attackBonusContainer);

        this.knockbackBonusContainer = this.add.container(0, -220);
        this.knockbackBonusContainer.add(this.knockbackBonusIcon);
        this.mainBonusContainer.add(this.knockbackBonusContainer);

        this.exploreBonusContainer = this.add.container(0, 110);
        this.exploreBonusContainer.add(this.exploreBonusIcon);
        this.mainBonusContainer.add(this.exploreBonusContainer);

        this.defenceBonusContainer = this.add.container(0, 220);
        this.defenceBonusContainer.add(this.defenceBonusIcon);
        this.mainBonusContainer.add(this.defenceBonusContainer);
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
        const targetWidth = 126 * dancingXPProgress;

        this.tweens.add({
            targets: this.dancingBar.fill,
            displayWidth: targetWidth,
            duration: 500,
            ease: 'Sine.easeInOut'
        });

        this.dancingText = this.add.text(82, 48, `${getSkillLevel('dancing')}`, textStyles.playerLevelText).setOrigin(0.5).setDepth(3);
        this.dancingTextReady = true; // Set the flag to true here

        if (this.dancingTextReady) {
            this.createGradientText(this.dancingText);
        }

        // Add the dancingText to the skillsContainer
        this.skillsContainer.add(this.dancingText);

        this.createAttackSelectionMenu();
    }




    updateEnergyBonusDisplay() {
        // If the energyBonusText already exists, destroy it
        if (this.energyBonusText) {
            this.energyBonusText.destroy();
            this.energyBonusContainer.remove(this.energyBonusText);
        }

        // Create new text for the energy bonus
        this.energyBonusText = this.add.text(0, 40, `${(PlayerState.energyBonus / 100)}`, textStyles.playerBonus).setOrigin(0.5).setDepth(3).setScale(0.9, 1);

        // Add the energyBonusText to the skillsContainer
        this.energyBonusContainer.add(this.energyBonusText);
    }

    updateAttackBonusDisplay() {
        if (this.attackBonusText) {
            this.attackBonusText.destroy();
            this.attackBonusContainer.remove(this.attackBonusText);
        }

        this.attackBonusText = this.add.text(0, 40, `${(PlayerState.attackBonus / 100)}`, textStyles.playerBonus).setOrigin(0.5).setDepth(3).setScale(0.9, 1);

        this.attackBonusContainer.add(this.attackBonusText);
    }


    updateKnockbackBonusDisplay() {
        if (this.knockbackBonusText) {
            this.knockbackBonusText.destroy();
            this.knockbackBonusContainer.remove(this.knockbackBonusText);
        }

        this.knockbackBonusText = this.add.text(0, 40, `${(PlayerState.knockbackBonus / 100)}`, textStyles.playerBonus).setOrigin(0.5).setDepth(3).setScale(0.9, 1);

        this.knockbackBonusContainer.add(this.knockbackBonusText);
    }

    updateExploreBonusDisplay() {
        if (this.exploreBonusText) {
            this.exploreBonusText.destroy();
            this.exploreBonusContainer.remove(this.exploreBonusText);
        }

        this.exploreBonusText = this.add.text(0, 40, `${(PlayerState.exploreBonus / 100)}`, textStyles.playerBonus).setOrigin(0.5).setDepth(3).setScale(0.9, 1);

        this.exploreBonusContainer.add(this.exploreBonusText);
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

        const progressBarWidth = 315;
        const progressBarHeight = 35;
        const borderOffset = 2;
        const outerRect = this.add.rectangle(x + 53, y, progressBarWidth + 2 * borderOffset, progressBarHeight + 2 * borderOffset, 0x000000);
        outerRect.setOrigin(0, 0.5);

        const progressFill = this.add.rectangle(x + borderOffset + 53, y, progressBarWidth, progressBarHeight, 0x00ff00);
        progressFill.setOrigin(0, 0.5);
        progressFill.displayWidth = 0;

        const healthBar = this.add.image(x, y, 'health-bar');
        healthBar.setOrigin(0, 0.5);
        healthBar.setScale(1);

        return { outer: outerRect, fill: progressFill };
    }

    updateEnergyBar() {
        const previousEnergy = PlayerState.previousEnergy || PlayerState.energy;
        const displayedEnergy = Math.max(0, PlayerState.energy); // Cap the energy to be non-negative
        const energyProgress = Math.max(0, PlayerState.energy / 100);
        const targetWidth = 315 * energyProgress;
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

            this.energyText = this.add.text(this.x + 182, 48, `${displayedEnergy.toFixed(0)}`, textStyles.energyText).setOrigin(0.5).setDepth(3);

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

        const xOffset = -244;

        PlayerState.inventory.forEach((item, index) => {
            const x = xOffset + index * 56.5; // x increments by the index, starting from xOffset
            const y = 3; // y is a fixed value

            // Display the 'select.png' icon over the selected slot
            if (index === this.selectedIndex) {
                // Add a semi-transparent rectangle behind the selected item
                const highlight = this.add.rectangle(x, y, 55, 55, 0xffffff, 0.75);
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
                const selectIcon = this.add.image(x, y, 'select').setOrigin(0.5);
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
        const xOffset = -244; // Change this value to adjust the starting position of the items

        inventory.forEach((item, index) => {
            const x = xOffset + index * 56.5; // x increments by the index, starting from xOffset
            const y = 3; // y is a fixed value

            const sprite = this.add.sprite(x, y, item.name.toLowerCase()).setInteractive().setScale(1).setOrigin(0.5).setDepth(1);
            const zone = this.add.zone(x, y, 55, 55).setOrigin(0.5).setInteractive().setDepth(2);
            zone.on('pointerdown', (pointer) => {
                this.selectedIndex = index;
                if (pointer.leftButtonDown()) {
                    this.useItem(item.name);
                }
            });


            // Display the 'select.png' icon over the selected slot
            if (index === this.selectedIndex) {
                // Add a semi-transparent rectangle behind the selected item
                const highlight = this.add.rectangle(x, y, 55, 55, 0xffffff, 0.75);
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
                const selectIcon = this.add.image(x, y, 'select').setOrigin(0.5);
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
            this.updateEnergyBonusDisplay();
            this.updateAttackBonusDisplay();
            this.updateKnockbackBonusDisplay();
            this.updateExploreBonusDisplay();
            this.updateDefenceBonusDisplay();
            this.updateEnergyBar()
            PlayerState.JustAte = false;
        } else {
        }
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
        const item = itemInfo[itemName];
        if (item) {
            if (item.itemConsumable) {
                this.consumeItem(itemName);
            } else {
                // Implement other item use cases here
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