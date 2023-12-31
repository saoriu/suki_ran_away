import Phaser from 'phaser';
import { textStyles } from './styles.js';
import chroma from 'chroma-js';
import { getSkillXP, getSkillLevel, xpRequiredForLevel, PlayerState, level } from './playerState';
import { unlockedAttacksForLevel } from './attacks'; // Adjust the path as per your project structure
import { Tooltip } from './Tooltip';
import { updatePlayerState } from './api'; // Adjust the path according to your project structure
import FontFaceObserver from 'fontfaceobserver';



export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.attackTimeouts = {}; // Initialize this.attackTimeouts
        this.isSaving = false;
    }

    create() {
        this.x = this.cameras.main.width / 2;
        this.y = this.cameras.main.height / 2;
        this.timeFilter = this.add.graphics();
        this.energyText = null;
        this.saveButton = this.add.image(50, (this.y * 2) - 50, 'save')
            .setInteractive()
            //make cursor a pointer on hover with gold tint
            .on('pointerover', () => this.saveButton.setTint(0xffd700))
            .on('pointerout', () => this.saveButton.setTint(0xffffff))
            .on('pointerdown', () => this.saveGame())
            .setDepth(10);
        this.activeChangeTexts = 0;
        this.isLevelingUp = false;
        this.game.events.on('gameTime', (gameTime) => {
            this.updateTimeCircle(gameTime);
        });
        let dayText = null;


        let graphics = this.make.graphics({});
        graphics.fillStyle(0x073336);
        graphics.fillRect(0, 0, 200, 50);
        graphics.fillStyle(0x066B72);
        graphics.fillRect(0, 25, 200, 5);
        graphics.generateTexture('lux', 200, 50);

        const ninjaFontObserver = new FontFaceObserver('Ninja');
        Promise.all([ninjaFontObserver.load()]).then(() => {
            this.updateInventoryDisplay();
            const userid = PlayerState.userid;
            this.add.text((this.x * 2) - 150, 25, `${userid}`, { fontFamily: 'Ninja', fontSize: '40px', fill: '#ffffff' });
            this.energyText = this.add.text(this.x + 162, 36, ``, textStyles.energyText);
            this.add.existing(this.energyText);
            this.createAttackSelectionMenu();
            this.initializeStaticElements();


            // Create dayText with initial value
            dayText = this.add.text(235, 105, `DAY 0`, textStyles.daysPassed);

            // Create progress bar and add it to the container

            // Set the depth of the container to ensure it's rendered above other elements
            this.updateSkillsDisplay();
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

        this.inventoryContainer = this.add.container(this.x, (this.y * 2) - 50);

        this.game.events.on('userLoggedIn', this.createAttackSelectionMenu, this);
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
        const unlockedAttacks = unlockedAttacksForLevel(level);
        const numberOfAttacks = unlockedAttacks.length - 1; // excluding 'scratch'
        const buttonHeight = 74; // from setSize(60, 60)
        const spaceBetweenButtons = 100; // from 100 * index

        if (this.attackSelectionContainer) {
            this.attackSelectionContainer.removeAll(true);
        } else {
            this.attackSelectionContainer = this.add.container(0, 0); // Initialize at (0, 0)
        }


        this.attackSelectionButtons = {};

        unlockedAttacks.forEach((attack, index) => {
            if (attack.name === 'scratch') return;

            let circle = this.add.graphics();
            let frameImageKey = PlayerState.selectedAttacks.includes(attack.name) ? 'attack-on' : 'attack-off';
            const frameImage = this.add.image(0, 0, frameImageKey).setScale(1).setDepth(1);
            const image = this.add.image(0, 0, attack.name).setScale(.4).setDepth(2);

            const button = this.add.container(50, 100 * index, [circle, frameImage, image])
                .setSize(60, 60)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.toggleAttackSelection(attack.name));
            this.attackSelectionContainer.add(button);
            this.attackSelectionButtons[attack.name] = { button };
        });
        const totalHeight = (numberOfAttacks) * spaceBetweenButtons + buttonHeight;
        this.attackSelectionContainer.y = this.y - totalHeight / 2;
    }


    toggleAttackSelection(attackName) {
        // Existing logic for updating PlayerState.selectedAttacks
        if (PlayerState.selectedAttacks.includes(attackName)) {
            PlayerState.selectedAttacks = PlayerState.selectedAttacks.filter(a => a !== attackName);
        } else if (PlayerState.selectedAttacks.length < 3) {
            PlayerState.selectedAttacks.push(attackName);
        }
        if (!this.attackTimeouts) {
            this.attackTimeouts = {};
        }

        // Iterate over all attack buttons to update their state
        Object.keys(this.attackSelectionButtons).forEach(name => {
            let button = this.attackSelectionButtons[name].button;

            // Update frame image based on selection
            let frameImageKey = PlayerState.selectedAttacks.includes(name) ? 'attack-on' : 'attack-off';
            let frameImage = button.getAt(1);
            frameImage.setTexture(frameImageKey).setDepth(1);

            // Create or update attackInfoFrame, attackInfoText, keyReferenceText
            let attackInfoFrame = this.attackSelectionButtons[name].attackInfoFrame;
            let attackInfoText = this.attackSelectionButtons[name].attackInfoText;
            let keyReferenceText = this.attackSelectionButtons[name].keyReferenceText;

            if (!attackInfoFrame) {
                // Create the attackInfoFrame if it doesn't exist
                attackInfoFrame = this.add.image(106, 3, 'attack-info').setScale(1.7, 1.425).setDepth(1);
                button.add(attackInfoFrame); // Add to the button container
                this.attackSelectionButtons[name].attackInfoFrame = attackInfoFrame;
            }

            if (!attackInfoText) {
                // Create the attackInfoText if it doesn't exist
                attackInfoText = this.add.text(60, -18, '', textStyles.attacks);
                button.add(attackInfoText); // Add to the button container
                this.attackSelectionButtons[name].attackInfoText = attackInfoText;
            }

            if (!keyReferenceText) {
                // Create the keyReferenceText if it doesn't exist
                keyReferenceText = this.add.text(60, -37, '', textStyles.keys);
                button.add(keyReferenceText); // Add to the button container
                this.attackSelectionButtons[name].keyReferenceText = keyReferenceText;
            }

            // Update visibility and content based on selection
            if (PlayerState.selectedAttacks.includes(name)) {
                const attack = unlockedAttacksForLevel(level).find(a => a.name === name);
                let knockbackText = attack.knockback < 1 ? 0 : attack.knockback;
                let attackIndex = PlayerState.selectedAttacks.indexOf(name);
                let keyReference = attackIndex === 1 ? 'KEY-Z' : attackIndex === 2 ? 'KEY-X' : '';

                attackInfoFrame.setVisible(true);
                attackInfoText.setText(`knockback: ${knockbackText}\ndamage: ${attack.damage}\nspeed: ${attack.speed}`).setVisible(true);
                keyReferenceText.setText(keyReference).setVisible(true);

                if (this.attackTimeouts[name]) {
                    clearTimeout(this.attackTimeouts[name]);
                }
                this.attackTimeouts[name] = setTimeout(() => {
                    if (PlayerState.selectedAttacks.includes(name)) {
                        let attackInfoText = this.attackSelectionButtons[name].attackInfoText;
                        let attackInfoFrame = this.attackSelectionButtons[name].attackInfoFrame;
                        let keyReferenceText = this.attackSelectionButtons[name].keyReferenceText;

                        if (attackInfoText) {
                            attackInfoText.setVisible(false).setText('');
                        }
                        if (attackInfoFrame) {
                            attackInfoFrame.setVisible(false);
                        }
                        if (keyReferenceText) {
                            keyReferenceText.setVisible(false).setText('');
                        }
                    }
                }, 7000);
            } else {
                // If the attack is not selected, ensure elements are hidden and clear any existing timeout
                attackInfoFrame.setVisible(false);
                attackInfoText.setVisible(false).setText('');
                keyReferenceText.setVisible(false).setText('');
                if (this.attackTimeouts[name]) {
                    clearTimeout(this.attackTimeouts[name]);
                    delete this.attackTimeouts[name];
                }
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
            }
        });
    }

    createProgressBar(x, y) {
        const progressBarWidth = 126;
        const progressBarHeight = 35;
        const outerRect = this.add.rectangle(165, 180 + progressBarHeight / 2, progressBarWidth, progressBarHeight, 0x000000);
        outerRect.setOrigin(0, 1); // Set the origin to the bottom left corner

        const progressFill = this.add.rectangle(165, 180 + progressBarHeight / 2, progressBarWidth, progressBarHeight, 0x42C5E6);
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

        this.lvText = this.add.text(45, 177, `lv`, textStyles.playerLevelText2).setOrigin(0.5).setDepth(3).setScale(1, 1.1);
        this.createGradientText(this.lvText);         
        this.xpText = this.add.text(140, 177, `XP`, textStyles.playerLevelText).setOrigin(0.5).setDepth(3).setScale(.8, 1.1);
        this.createGradientText(this.xpText);       
        this.dancingFrame = this.add.image(165, 115, 'frame').setOrigin(0.5).setDepth(2);
        this.skillsContainer.add([this.dancingFrame, this.xpText, this.lvText]);
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

        this.dancingText = this.add.text(82, 177, `${getSkillLevel('dancing')}`, textStyles.playerLevelText).setOrigin(0.5).setDepth(3);
        this.dancingTextReady = true; // Set the flag to true here
    
        if (this.dancingTextReady) {
            this.createGradientText(this.dancingText);
        }

        // Add the dancingText to the skillsContainer
        this.skillsContainer.add(this.dancingText);

        this.createAttackSelectionMenu();
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
            this.energyText.setText(`${displayedEnergy.toFixed(0)}`, textStyles.energyText);
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

        if (energyChange < 0) {
            // Adjust the y-position based on the number of active texts
            const changeText = this.add.text(
                this.x
                + xOffset,
                this.y + yOffset,
                `${Math.abs(energyChange).toFixed(0)}`, // Use Math.abs to remove the negative sign
                {
                    fill: '#ff0000', // Only negative changes, so color is always red
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

    updateTimeCircle(gameTime) {
        // Define a color scale
        const colorScale = chroma.scale([
            'midnightblue', // Midnight (0)
            'darkblue', // Early morning (3)
            'skyblue', // Morning (6)
            'lightcyan', // Midday (12)
            'skyblue', // Afternoon (18)
            'darkblue', // Evening (21)
            'midnightblue' // Night (24)
        ]).mode('lch').domain([0, 3, 6, 12, 18, 21, 24]);

        // Get the color for the current game time
        const color = colorScale(gameTime).rgb();

        // Convert the RGB color to a Phaser color
        const phaserColor = Phaser.Display.Color.RGBStringToColor(`rgb(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])})`);

        // Clear the previous circle and draw a rectangle that covers the entire game area
        this.timeFilter.clear();
        this.timeFilter.fillStyle(phaserColor.color);
        this.timeFilter.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        // Apply a blend mode to the rectangle and opacity lower:
        this.timeFilter.setBlendMode(Phaser.BlendModes.MULTIPLY)
        this.timeFilter.setAlpha(0.5);

        // Set the depth to 1 so the rectangle appears above other game objects
        this.timeFilter.setDepth(0);
    }

    updateInventoryDisplay() {
        this.inventoryContainer.removeAll(true);

        // Add the bag.png image as the background of the inventory display.
        const bag = this.add.image(0, 0, 'bag').setOrigin(0.5);
        this.inventoryContainer.add(bag);

        const inventory = PlayerState.inventory || [];
        const xOffset = -242; // Change this value to adjust the starting position of the items

        inventory.forEach((item, index) => {
            const x = xOffset + index * 56.3; // x increments by the index, starting from xOffset
            const y = 2.5; // y is a fixed value
            const sprite = this.add.sprite(x, y, item.name.toLowerCase()).setInteractive().setScale(1).setOrigin(0.5);
            this.inventoryContainer.add(sprite);

            if (item.quantity > 1) {
                const quantityText = this.add.text(x + 3, y, item.quantity, {
                    fontSize: '20px',
                    fontFamily: 'Ninja',
                    fill: 'black',
                    stroke: 'white',
                    strokeThickness: 3,
                });
                this.inventoryContainer.add(quantityText);
            }
        });
    }
}