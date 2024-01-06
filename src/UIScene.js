import Phaser from 'phaser';
import { textStyles } from './styles.js';
import chroma from 'chroma-js';
import { getSkillXP, getSkillLevel, xpRequiredForLevel, PlayerState } from './playerState';
import { unlockedAttacksForLevel } from './attacks'; // Adjust the path as per your project structure
import WebFont from 'webfontloader';
import { Tooltip } from './Tooltip';


export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    preload() {
        this.load.image('dancingFrame', '/skill-bars.png');
    }

    create() {
        this.timeFilter = this.add.graphics();
        this.energyText = null;
        this.activeChangeTexts = 0;
        this.isLevelingUp = false;
        this.game.events.on('gameTime', (gameTime) => {
            this.updateTimeCircle(gameTime);
        });
        let dayText = null;

        WebFont.load({
            typekit: {
                id: 'trh2dsl'
            },
            active: () => {
                this.energyText = this.add.text(910, 38, ``, textStyles.energyText);
                this.add.existing(this.energyText);
                this.createAttackSelectionMenu();
                this.attackProbabilitiesContainer = this.add.container(0, 0);

                this.dancingContainer = this.add.container(0, 0);

                if (this.dancingBar && this.dancingBar.x && this.dancingBar.y) {
                    this.dancingText = this.add.text(this.dancingBar.x, this.dancingBar.y, `Lv.${getSkillLevel('dancing')}`, textStyles.playerLevelText).setOrigin(0.5);
                    this.dancingContainer.add(this.dancingText);
                }

                // Create dayText with initial value
                dayText = this.add.text(143, 67, `DAY 0`, textStyles.daysPassed);

                // Create progress bar and add it to the container
                this.dancingBar = this.createProgressBar(25, 25);
                this.dancingContainer.add([this.dancingBar.outer, this.dancingBar.fill, this.dancingBar.inner]);

                // Set the depth of the container to ensure it's rendered above other elements
                this.dancingContainer.setDepth(10);
                this.updateSkillsDisplay();
            }
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

        this.inventoryContainer = this.add.container(10, 10);

        this.updateInventoryDisplay();
        this.game.events.on('updateSkillsDisplay', this.updateSkillsDisplay, this);

        this.game.events.on('levelUp', (skillName) => {
            if (skillName === 'dancing') {
                this.handleDancingLevelUp();
            }
        });

        this.energyBar = this.createEnergyBar((this.cameras.main.width / 2 - 150), 50);
        this.add.existing(this.energyBar.outer);
        this.add.existing(this.energyBar.fill);
        this.updateEnergyBar();
        this.game.events.on('energyChanged', this.updateEnergyBar, this);
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
        if (this.attackSelectionContainer) {
            this.attackSelectionContainer.removeAll(true);
        } else {
            this.attackSelectionContainer = this.add.container(0, 0);
        }
    
        const unlockedAttacks = unlockedAttacksForLevel(PlayerState.level);
        this.attackSelectionButtons = {};
    
        unlockedAttacks.forEach((attack, index) => {
            if (attack.name === 'scratch') return;
    
            let circleColor = PlayerState.selectedAttacks.includes(attack.name) ? 0xff4c4c : 0xffffff;
            let circle = this.add.graphics({ fillStyle: { color: circleColor } });
            circle.fillCircle(0, 0, 30);
    
            const image = this.add.image(0, 0, attack.name).setScale(.4);
            const attackInfoText = this.add.text(60, -12, '', textStyles.attacks);
            const keyReferenceText = this.add.text(60, -32, '', textStyles.keys);
    
            const button = this.add.container(50, 100 * index + 180, [circle, image, attackInfoText, keyReferenceText])
                .setSize(100, 120)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.toggleAttackSelection(attack.name));
    
            this.attackSelectionContainer.add(button);
            this.attackSelectionButtons[attack.name] = { button, attackInfoText, keyReferenceText };
    if (PlayerState.selectedAttacks.includes(attack.name)) {
        let knockbackText = attack.knockback < 1 ? 0 : attack.knockback;
        let attackIndex = PlayerState.selectedAttacks.indexOf(attack.name);
        let keyReference = attackIndex === 1 ? 'KEY Z' : attackIndex === 2 ? 'KEY X' : '';
        keyReferenceText.setText(keyReference);
        attackInfoText.setText(`Knockback: ${knockbackText}\nDamage: ${attack.damage}\nSpeed: ${attack.speed}`);
    } else {
        attackInfoText.setText('');
        keyReferenceText.setText('');
    }
        });
    }
    
    toggleAttackSelection(attackName) {
        if (PlayerState.selectedAttacks.includes(attackName)) {
            PlayerState.selectedAttacks = PlayerState.selectedAttacks.filter(a => a !== attackName);
        } else if (PlayerState.selectedAttacks.length < 3) {
            PlayerState.selectedAttacks.push(attackName);
        }
    
        Object.keys(this.attackSelectionButtons).forEach(name => {
            let container = this.attackSelectionButtons[name].button;
            let circle = container.getAt(0);
    
            circle.clear();
            let circleColor = PlayerState.selectedAttacks.includes(name) ? 0xff4c4c : 0xffffff;
            circle.fillStyle(circleColor);
            circle.fillCircle(0, 0, 30);
    
            let attackInfoText = this.attackSelectionButtons[name].attackInfoText;
            let keyReferenceText = this.attackSelectionButtons[name].keyReferenceText;
            if (PlayerState.selectedAttacks.includes(name)) {
                const attack = unlockedAttacksForLevel(PlayerState.level).find(a => a.name === name);
                let knockbackText = attack.knockback < 1 ? 0 : attack.knockback;
                let attackIndex = PlayerState.selectedAttacks.indexOf(name);
                let keyReference = attackIndex === 1 ? 'KEY Z' : attackIndex === 2 ? 'KEY X' : '';
                attackInfoText.setText(`Knockback: ${knockbackText}\nDamage: ${attack.damage}\nSpeed: ${attack.speed}`);
                keyReferenceText.setText(keyReference);
            } else {
                attackInfoText.setText('');
                keyReferenceText.setText('');
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
            targets: this.dancingBar,
            endAngle: 360,
            duration: 500,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                this.dancingBar.fill.clear();
                this.dancingBar.fill.fillStyle(0x9AA3D9, 1); // Set fill color before drawing the slice
                this.dancingBar.fill.slice(this.dancingBar.x, this.dancingBar.y, this.dancingBar.radius, Phaser.Math.DegToRad(this.dancingBar.startAngle), Phaser.Math.DegToRad(this.dancingBar.endAngle), false);
                this.dancingBar.fill.fillPath();
            },
            onComplete: () => {
                this.dancingBar.endAngle = 0;
                this.isLevelingUp = false;
                this.updateSkillsDisplay();
            }
        });
    }

    createProgressBar(x, y) {
        const outerRadius = 53 // Reduced by 25%
        const borderThickness = 18; // Reduced by 25%

        const outerCircle = this.add.graphics();
        outerCircle.lineStyle(borderThickness, 0x00000, 1);
        outerCircle.strokeCircle(x + 50, y + 50, outerRadius);

        const progressFill = this.add.graphics();
        progressFill.fillStyle(0x54C1EF, 1);
        progressFill.slice(x + 50, y + 50, outerRadius, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(0), false);
        progressFill.fillPath();

        const innerCircle = this.add.graphics();
        innerCircle.fillStyle(0x000000, 1);
        innerCircle.fillCircle(x + 50, y + 50, 45); // Draw the inner circle

        return { outer: outerCircle, inner: innerCircle, fill: progressFill, startAngle: 0, endAngle: 0, x: x + 50, y: y + 50, radius: outerRadius };
    }

    updateSkillsDisplay() {
        if (this.isLevelingUp) {
            this.time.delayedCall(600, this.updateSkillsDisplay, [], this);
            return;
        }

        // Destroy the existing dancingText if it exists
        if (this.dancingText) {
            this.dancingText.destroy();
        }

        // Calculate the progress and target angle for the progress bar
        const currentXP = getSkillXP('dancing');
        const requiredXP = xpRequiredForLevel(getSkillLevel('dancing'));
        const dancingXPProgress = currentXP / requiredXP;
        const targetAngle = 360 * dancingXPProgress;

        if (this.dancingBar && this.dancingBar.x && this.dancingBar.y) {
            this.dancingText = this.add.text(this.dancingBar.x, this.dancingBar.y, `Lv.${getSkillLevel('dancing')}`, textStyles.playerLevelText).setOrigin(0.5);
            this.dancingContainer.add(this.dancingText);
        }

        // Animate the progress bar's end angle to reflect the new XP progress
        this.tweens.add({
            targets: this.dancingBar,
            endAngle: targetAngle,
            duration: 500,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                this.dancingBar.fill.clear();
                this.dancingBar.fill.fillStyle(0x54C1EF, 1); // Set fill color before drawing the slice
                this.dancingBar.fill.slice(this.dancingBar.x, this.dancingBar.y, this.dancingBar.radius, Phaser.Math.DegToRad(this.dancingBar.startAngle), Phaser.Math.DegToRad(this.dancingBar.endAngle), false);
                this.dancingBar.fill.fillPath();
            }
        });
        this.createAttackSelectionMenu();
    }

    createEnergyBar(x, y) {
        const progressBarWidth = 300;
        const progressBarHeight = 15;
        const borderOffset = 2;
        const outerRect = this.add.rectangle(x, y, progressBarWidth + 2 * borderOffset, progressBarHeight + 2 * borderOffset, 0x000000);
        outerRect.setOrigin(0, 0.5);

        const progressFill = this.add.rectangle(x + borderOffset, y, progressBarWidth, progressBarHeight, 0x00ff00);
        progressFill.setOrigin(0, 0.5);
        progressFill.displayWidth = 0;

        return { outer: outerRect, fill: progressFill };
    }


    updateEnergyBar() {
        const previousEnergy = PlayerState.previousEnergy || PlayerState.energy;
        const displayedEnergy = Math.max(0, PlayerState.energy); // Cap the energy to be non-negative
        const energyProgress = Math.max(0, PlayerState.energy / 100);
        const targetWidth = 300 * energyProgress;
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
                735 + xOffset,
                425 + yOffset,
                `${Math.abs(energyChange).toFixed(0)}`, // Use Math.abs to remove the negative sign
                {
                    font: '900 42px redonda', 
                    fill: '#ff0000', // Only negative changes, so color is always red
                    stroke: '#000000',
                    strokeThickness: 6,
                    fontStyle: 'italic'
                }
                ).setDepth(5).setOrigin(0.5, 0); // Set origin to center
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
                735 + xOffset,
                425 + yOffset,
                'miss',
                {
                    font: '900 42px redonda', 
                    fill: '#2196f3',
                    stroke: '#000000',
                    strokeThickness: 6,
                    fontStyle: 'italic'
                }
                ).setDepth(5).setOrigin(0.5, 0); // Set origin to center
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
        const inventory = this.registry.get('inventory') || [];
        inventory.forEach((item, index) => {
            const x = index * 50 + 25;
            const y = 850;
            const sprite = this.add.sprite(x, y, item.name.toLowerCase()).setInteractive().setScale(2);
            this.inventoryContainer.add(sprite);
            if (item.quantity > 1) {
                const quantityText = this.add.text(x, y, item.quantity, textStyles.quantity);
                this.inventoryContainer.add(quantityText);
            }
        });
    }

}