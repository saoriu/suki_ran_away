import Phaser from 'phaser';
import { textStyles } from './styles.js';
import { getSkillXP, getSkillLevel, getTotalSkillXP, xpRequiredForLevel, PlayerState } from './playerState';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    preload() {
        this.load.image('dancingFrame', '/skill-bars.png');
      }
    

    create() {
        this.energyText = null;
        this.isLevelingUp = false;
        this.game.events.on('updatePlayerPosition', this.handlePlayerPositionUpdate, this);

        this.inventoryContainer = this.add.container(10, 10);
        this.skillsContainer = this.add.container(580, 10);

        this.dancingBar = this.createProgressBar(-530, 45);
        this.skillsContainer.add([this.dancingBar.outer, this.dancingBar.fill]);

        this.updateInventoryDisplay();
        this.updateSkillsDisplay();
        this.game.events.on('updateSkillsDisplay', this.updateSkillsDisplay, this);

        this.game.events.on('levelUp', (skillName) => {
            if (skillName === 'dancing') {
                this.handleDancingLevelUp();
            }
        });

        this.game.events.on('startBattle', this.initPlayerAttack, this);
        this.game.events.on('startMonster', this.initMonsterAttack, this);
        this.game.events.on('runAway', this.endBattleUI, this);


        this.energyBar = this.createEnergyBar(310, 318);
        this.add.existing(this.energyBar.outer);
        this.add.existing(this.energyBar.fill);
        this.energyText = this.add.text(310, 330, ``, textStyles.energyText); //dont display energy count until i wanna move it to a UI
        this.updateEnergyBar();
        this.game.events.on('energyChanged', this.updateEnergyBar, this);
    }

    initPlayerAttack() {
        if (this.playerRollText) {
            this.playerRollText.destroy();
        }
        this.playerRollText = this.add.text(10, 370, '', textStyles.battleUI);
    }

    initMonsterAttack() {
        if (this.monsterRollText) {
            this.monsterRollText.destroy();
        }
        this.monsterRollText = this.add.text(250, 370, '', textStyles.battleUI);
    }

    endBattleUI() {
        this.time.delayedCall(1000, () => {
            if (this.playerRollText) {
                this.playerRollText.destroy();
            }
            if (this.monsterRollText) {
                this.monsterRollText.destroy();
            }
        }, [], this);
            }

    handlePlayerPositionUpdate(position) {
        this.petEnergyText.setPosition(position.x, position.y - 50);
    }

    updateEnergyBar() {
        const previousEnergy = PlayerState.previousEnergy || PlayerState.energy;
        const displayedEnergy = Math.max(0, PlayerState.energy); // Cap the energy to be non-negative
        const energyProgress = displayedEnergy / 100;
        const targetWidth = 80 * energyProgress;
        const hue = (displayedEnergy / 100) * 120; // Use displayedEnergy for hue calculation
        const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.8, 0.5).color;
      
        this.energyBar.fill.setFillStyle(color);
        this.tweens.add({
          targets: this.energyBar.fill,
          displayWidth: targetWidth,
          duration: 100,
          ease: 'Sine.easeInOut'
        });
    
        // Update the text with the capped energy value
       // this.energyText.setText(`${displayedEnergy.toFixed(0)}`, textStyles.energyText);
      
        const energyChange = displayedEnergy - previousEnergy;
        if (energyChange < 0) {
          const changeText = this.add.text(this.energyText.x + 25, this.energyText.y, `${previousEnergy > displayedEnergy ? '' : '+'}${energyChange.toFixed(0)}`, { fontFamily: 'bitcount-mono-single-square',fontSize: '20px' ,fill: previousEnergy > displayedEnergy ? '#ff0000' : '#00ff00' });
          this.tweens.add({
            targets: changeText,
            y: changeText.y - 20,
            alpha: 0,
            duration: 1200,
            onComplete: () => {
              changeText.destroy();
            }
          });
        }
    
        PlayerState.previousEnergy = displayedEnergy; // Store the capped energy as previous for next update
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
            displayHeight: 184,
            duration: 500,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.dancingBar.fill.displayHeight = 0;
                this.isLevelingUp = false;
                this.updateSkillsDisplay();
            }
        });
    }

    createProgressBar(x, y) {
        const progressBarWidth = 10;
        const progressBarHeight = 184;
        const borderOffset = 2;
        const outerRect = this.add.rectangle(-560, 200 + progressBarHeight / 2, progressBarWidth + 2 * borderOffset, progressBarHeight + 2 * borderOffset, 0x000000);
        outerRect.setOrigin(0, 1); // Set the origin to the bottom left corner
      
        const progressFill = this.add.rectangle(-560 + borderOffset, 200 + progressBarHeight / 2, progressBarWidth, progressBarHeight, 0x00ff00);
        progressFill.setOrigin(0, 1); // Set the origin to the bottom left corner
        progressFill.displayHeight = 0;
      
        return { outer: outerRect, fill: progressFill };
      }

    createEnergyBar(x, y) {
        const progressBarWidth = 80;
        const progressBarHeight = 6;
        const borderOffset = 2;
        const outerRect = this.add.rectangle(x, y, progressBarWidth + 2 * borderOffset, progressBarHeight + 2 * borderOffset, 0x000000);
        outerRect.setOrigin(0, 0.5);

        const progressFill = this.add.rectangle(x + borderOffset, y, progressBarWidth, progressBarHeight, 0x00ff00);
        progressFill.setOrigin(0, 0.5);
        progressFill.displayWidth = 0;

        return { outer: outerRect, fill: progressFill };
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

    updateSkillsDisplay() {
        if (this.isLevelingUp) {
            this.time.delayedCall(600, this.updateSkillsDisplay, [], this);
            return;
        }

        if (this.dancingText && this.dancingXPText) {
            this.skillsContainer.remove([this.dancingText, this.dancingXPText, this.dancingFrame], true);
        }

        const currentXP = getSkillXP('dancing');
        const requiredXP = xpRequiredForLevel(getSkillLevel('dancing'));
        const dancingXPProgress = currentXP / requiredXP;
        const targetWidth = 184 * dancingXPProgress;

        this.tweens.add({
            targets: this.dancingBar.fill,
            displayHeight: targetWidth,
            duration: 500,
            ease: 'Sine.easeInOut'
        });

        this.dancingFrame = this.add.image(-550, 200, 'dancingFrame').setScale(0.4).setAngle(90);
        this.dancingText = this.add.text(-560, 70, `Lvl ${getSkillLevel('dancing')}`, textStyles.playerLevelText);
        this.dancingXPText = this.add.text(-280, 20, `${getTotalSkillXP('dancing')} XP`, textStyles.playerLevelText);
        this.skillsContainer.add([this.dancingText, this.dancingFrame]);
      }
}