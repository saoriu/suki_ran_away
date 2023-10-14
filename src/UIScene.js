import Phaser from 'phaser';
import { textStyles } from './styles.js';
import { getSkillXP, getSkillLevel, getTotalSkillXP, xpRequiredForLevel, PlayerState } from './playerState';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
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

        this.game.events.on('startBattle', this.initBattleUI, this);
        this.game.events.on('updateBattleDisplay', this.updateBattleDisplay, this);
        this.game.events.on('runAway', this.handleRunAway, this);

        this.energyBar = this.createEnergyBar(310, 318);
        this.add.existing(this.energyBar.outer);
        this.add.existing(this.energyBar.fill);
        this.energyText = this.add.text(310, 330, `Energy: ${PlayerState.energy.toFixed(0)}`, textStyles.energyText);
        this.updateEnergyBar();
        this.game.events.on('energyChanged', this.updateEnergyBar, this);
    }

    initBattleUI() {
        this.playerRollText = this.add.text(10, 370, '', textStyles.battleUI);
        this.monsterRollText = this.add.text(250, 370, '', textStyles.battleUI);

        // Commenting out the monster health bar
        // this.monsterHealthBar = this.createMonsterHealthBar(250, 330);
        // this.monsterHealthText = this.add.text(250, 350, '', textStyles.battleUI);

        // this.add.existing(this.monsterHealthBar.outer);
        // this.add.existing(this.monsterHealthBar.fill);
    }

    endBattleUI() {
        this.playerRollText.destroy();
        this.monsterRollText.destroy();

        // Destroying the monster health bar
        // this.monsterHealthBar.outer.destroy();
        // this.monsterHealthBar.fill.destroy();
        // this.monsterHealthText.destroy();
    }

    handleRunAway(runAwayValue) {
        if (runAwayValue) {
            this.endBattleUI();
        }
    }

    handlePlayerPositionUpdate(position) {
        this.petEnergyText.setPosition(position.x, position.y - 50);
    }

    updateEnergyBar() {
        const energyProgress = Math.max(0, PlayerState.energy / 100);
        const targetWidth = 100 * energyProgress;
        const hue = (PlayerState.energy / 100) * 120;
        const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.8, 0.5).color;

        this.energyBar.fill.setFillStyle(color);
        this.tweens.add({
            targets: this.energyBar.fill,
            displayWidth: targetWidth,
            duration: 100,
            ease: 'Sine.easeInOut'
        });
        this.energyText.setText(`Energy: ${PlayerState.energy.toFixed(0)}`);
    }

    updateBattleDisplay({ petEnergy, monsterHealth, playerRoll, monsterLevel, monsterRoll }) {
        if (playerRoll > 0) {
            this.playerRollText.setText(`Player rolled: ${playerRoll.toFixed(0)}`);
            this.monsterRollText.setText('');
        } else if (monsterRoll > 0) {
            this.monsterRollText.setText(`Monster rolled: ${monsterRoll.toFixed(0)}`);
            this.playerRollText.setText('');
        }
        if (petEnergy <= 0) {
            this.monsterRollText.setText(`Monster rolled: ${monsterRoll.toFixed(0)}`);
            this.time.delayedCall(1000, this.endBattleUI, [], this);
        } else if (monsterHealth <= 0) {
            this.playerRollText.setText(`Player rolled: ${playerRoll.toFixed(0)}`);
            this.time.delayedCall(1000, this.endBattleUI, [], this);
        }

    }
    
    createMonsterHealthBar(x, y) {
        const progressBarWidth = 100;
        const progressBarHeight = 4;
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
            displayWidth: 150,
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
        const progressBarWidth = 150;
        const progressBarHeight = 10;
        const borderOffset = 2;
        const outerRect = this.add.rectangle(x, y, progressBarWidth + 2 * borderOffset, progressBarHeight + 2 * borderOffset, 0x000000);
        outerRect.setOrigin(0, 0.5);

        const progressFill = this.add.rectangle(x + borderOffset, y, progressBarWidth, progressBarHeight, 0x00ff00);
        progressFill.setOrigin(0, 0.5);
        progressFill.displayWidth = 0;

        return { outer: outerRect, fill: progressFill };
    }

    createEnergyBar(x, y) {
        const progressBarWidth = 100;
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
            this.skillsContainer.remove([this.dancingText, this.dancingXPText], true);
        }

        const currentXP = getSkillXP('dancing');
        const requiredXP = xpRequiredForLevel(getSkillLevel('dancing'));
        const dancingXPProgress = currentXP / requiredXP;
        const targetWidth = 150 * dancingXPProgress;

        this.tweens.add({
            targets: this.dancingBar.fill,
            displayWidth: targetWidth,
            duration: 500,
            ease: 'Sine.easeInOut'
        });

        this.dancingText = this.add.text(-530, 0, `Dancing Lvl: ${getSkillLevel('dancing')}`, textStyles.playerLevelText);
        this.dancingXPText = this.add.text(-530, 25, `XP: ${getTotalSkillXP('dancing')}`, textStyles.playerLevelText);
        this.skillsContainer.add([this.dancingText, this.dancingXPText]);
    }
}