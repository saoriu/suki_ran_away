import Phaser from 'phaser';
import { textStyles } from './styles.js';
import chroma from 'chroma-js';
import { getSkillXP, getSkillLevel, xpRequiredForLevel, PlayerState } from './playerState';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    preload() {
        this.load.image('dancingFrame', '/skill-bars.png');
    }


    create() {
        this.timeCircle = this.add.graphics();
        this.timeCircle.fillCircle(65, 65, 51); // Draw a circle at (100,100) with radius 50
        this.energyText = null;
        this.activeChangeTexts = 0;
        this.isLevelingUp = false;
        this.game.events.on('updatePlayerPosition', this.handlePlayerPositionUpdate, this);
        this.game.events.on('gameTime', (gameTime) => {
            this.updateTimeCircle(gameTime);
        });
        let dayText = null;

        this.game.events.on('daysPassed', (daysPassed) => {
            this.time.delayedCall(1000, () => {
                if (dayText) {
                    dayText.destroy();
                }
                dayText = this.add.text(43, 57, `DAY ${daysPassed}`, textStyles.daysPassed).setDepth(2);
            }, [], this);
        });
        
        this.inventoryContainer = this.add.container(10, 10);
        this.skillsContainer = this.add.container(580, 5);

        this.dancingBar = this.createProgressBar(-565, 11);
        this.skillsContainer.add([this.dancingBar.outer, this.dancingBar.fill]);

        this.updateInventoryDisplay();
        this.updateSkillsDisplay();
        this.game.events.on('updateSkillsDisplay', this.updateSkillsDisplay, this);

        this.game.events.on('levelUp', (skillName) => {
            if (skillName === 'dancing') {
                this.handleDancingLevelUp();
            }
        });

        let uiBackground = this.add.graphics();
        uiBackground.fillStyle(0x00000, 1); // Fill color (white) and alpha (fully opaque)
        // Draw the rectangle at position 0,0 with the width of the game and the height of the UI
        uiBackground.fillRect(0, this.game.config.height - 100, this.game.config.width, 100);

        // Set the depth to be lower than other UI elements
        uiBackground.setDepth(-1); 
//add text on the screen that reads 'Suki Ran Away (Alpha Version) by Saori Uchida':

        this.energyBar = this.createEnergyBar(15, 15);
        this.add.existing(this.energyBar.outer);
        this.add.existing(this.energyBar.fill);
        this.energyText = this.add.text(118, 38, `Energy: `, textStyles.energyText); 
        this.updateEnergyBar();
        this.game.events.on('energyChanged', this.updateEnergyBar, this);
        let progressBarBg = this.add.graphics();
        progressBarBg.fillStyle(0x000000, 1); // Black color for the empty area
        progressBarBg.slice(65, 65, 57, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(62), false); // Full circle with a radius of 50
        progressBarBg.fillPath();
        progressBarBg.setDepth(-1); // Set the depth to -1 so it appears behind the progress bar
    }


    handlePlayerPositionUpdate(position) {
        this.petEnergyText.setPosition(position.x, position.y - 50);
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
            endAngle: 60,
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

    createEnergyBar(x, y) {
        const outerRadius = 80 * 0.7 * 0.75; // Reduced by 25%
        const borderThickness = 18; // Reduced by 25%
    
    
        // Create the outer circle of the energy ring (background)
        const outerCircle = this.add.graphics();
        outerCircle.lineStyle(borderThickness, 0x000000, 1);
        outerCircle.strokeCircle(x + 50, y + 50, outerRadius); // Moved more to the right and down
    
        // Create the fill arc of the energy ring (progress bar)
        const energyFill = this.add.graphics();
        energyFill.fillStyle(0x00ff00, 1); // Green color for energy fill
        energyFill.slice(x + 50, y + 50, outerRadius, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(360 * 0.75), false); // Moved more to the right and down
        energyFill.fillPath();
    
        // Create the inner circle of the energy ring (hollow part)
        const innerCircle = this.add.graphics();
        innerCircle.fillStyle(0x000000, 1); // Black color to make it hollow
    
        return { outer: outerCircle, inner: innerCircle, fill: energyFill };
    }

    createProgressBar(x, y) {
        const outerRadius = 55 // Reduced by 25%
        const borderThickness = 0 * 0.75; // Reduced by 25%
    
        const outerCircle = this.add.graphics();
        outerCircle.lineStyle(borderThickness, 0x9AA3D9, 1);
        outerCircle.strokeCircle(x + 50, y + 50, outerRadius);
    
        const progressFill = this.add.graphics();
        progressFill.fillStyle(0x9AA3D9, 1);
        progressFill.slice(x + 50, y + 50, outerRadius, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(0), false);
        progressFill.fillPath();
    
        const innerCircle = this.add.graphics();
        innerCircle.fillStyle(0x9AA3D9, 1);
    
        return { outer: outerCircle, inner: innerCircle, fill: progressFill, startAngle: 0, endAngle: 0, x: x + 50, y: y + 50, radius: outerRadius };
    }

    updateSkillsDisplay() {
        if (this.isLevelingUp) {
            this.time.delayedCall(600, this.updateSkillsDisplay, [], this);
            return;
        }
    
        if (this.dancingText) {
            this.dancingText.destroy();
        }
    
        const currentXP = getSkillXP('dancing');
        const requiredXP = xpRequiredForLevel(getSkillLevel('dancing'));
        const dancingXPProgress = currentXP / requiredXP;
        const targetAngle = 60 * dancingXPProgress;
    
        this.tweens.add({
            targets: this.dancingBar,
            endAngle: targetAngle,
            duration: 500,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                this.dancingBar.fill.clear();
                this.dancingBar.fill.fillStyle(0x9AA3D9, 1); // Set fill color before drawing the slice
                this.dancingBar.fill.slice(this.dancingBar.x, this.dancingBar.y, this.dancingBar.radius, Phaser.Math.DegToRad(this.dancingBar.startAngle), Phaser.Math.DegToRad(this.dancingBar.endAngle), false);
                this.dancingBar.fill.fillPath();
            }
        });
    
        this.dancingText = this.add.text(-535, 120, `Lv.${getSkillLevel('dancing')}`, textStyles.playerLevelText);
        this.skillsContainer.add([this.dancingText]);
    }

    updateEnergyBar() {
        const previousEnergy = PlayerState.previousEnergy || PlayerState.energy;
        const displayedEnergy = Math.max(0, PlayerState.energy); // Cap the energy to be non-negative
        const energyProgress = displayedEnergy / 100;
        const targetAngle = 360 * energyProgress;
        const hue = (displayedEnergy / 100) * 120; // Use displayedEnergy for hue calculation
        const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.8, 0.5).color;
    
        this.energyBar.fill.clear();
        this.energyBar.fill.fillStyle(color);
        this.energyBar.fill.slice(65, 65, 92 * 0.7 * 0.75, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(targetAngle), false); // Reduced radius by 25%
        this.energyBar.fill.fillPath();
    
        // Update the text with the capped energy value
        this.energyText.setText(`${displayedEnergy.toFixed(0)}`, textStyles.energyText);

        const energyChange = displayedEnergy - previousEnergy;
        if (energyChange < 0) {
            // Adjust the y-position based on the number of active texts
            const changeText = this.add.text(
                 345,
                 215 + (this.activeChangeTexts * 20),
                `${Math.abs(energyChange).toFixed(0)}`, // Use Math.abs to remove the negative sign
                {
                    fontFamily: '"redonda-condensed", sans-serif',
                    fontSize: '25px',
                    fill: '#ff0000', // Only negative changes, so color is always red
                    fontWeight: '100',
                    stroke: '#000000',
                    strokeThickness: 6,
                    fontStyle: 'italic'
                }
            );
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
    
        PlayerState.previousEnergy = displayedEnergy; // Store the capped energy as previous for next update
    }

    updateTimeCircle(gameTime) {
        console.log(gameTime);

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

        // Clear the previous circle and redraw it with the new color
        this.timeCircle.clear();
        this.timeCircle.lineStyle(2, 0x000000); // Add a black border
        this.timeCircle.fillStyle(phaserColor.color);
        this.timeCircle.fillCircle(65, 65, 49 * 0.75); // Reduced radius by 25%
        this.timeCircle.strokeCircle(65, 65, 49 * 0.75); // Reduced radius by 25%
      this.timeCircle.setDepth(1);
    }

    updateInventoryDisplay() {
        this.inventoryContainer.removeAll(true);
        const inventory = this.registry.get('inventory') || [];
        inventory.forEach((item, index) => {
            const x = index * 50 + 25;
            const y = 455;
            const sprite = this.add.sprite(x, y, item.name.toLowerCase()).setInteractive();
            this.inventoryContainer.add(sprite);
            if (item.quantity > 1) {
                const quantityText = this.add.text(x, y, item.quantity, textStyles.quantity);
                this.inventoryContainer.add(quantityText);
            }
        });
    }
}