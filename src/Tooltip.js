import Phaser from 'phaser';
import { textStyles } from './styles.js'; 

export class Tooltip extends Phaser.GameObjects.Container {
    constructor(scene, x, y, text) {
        super(scene, x, y);
        this.scene = scene;
        this.text = text;
        this.background = this.scene.add.graphics();
        this.setupTooltip();
    }

    setupTooltip() {
        // Create text objects for each line and style them as needed
        this.nameText = this.scene.add.text(0, 0, '', textStyles.tooltip);
        this.levelText = this.scene.add.text(0, 20, '', textStyles.tooltip); // Adjust y position as needed
        this.descriptionText = this.scene.add.text(0, 40, '', textStyles.tooltipdescription); // Adjust y position as needed
    
        // Add background and text to the container
        this.add(this.background);
        this.add(this.nameText);
        this.add(this.levelText);
        this.add(this.descriptionText);
    
        // Hide the tooltip initially
        this.setVisible(false);
        this.scene.input.on('pointermove', this.followPointer, this);
    
        this.scene.add.existing(this);
    }

    showTooltip(x, y) {
        //console log the text and x y
        this.setPosition(x, y);
        this.setVisible(true);
        this.setDepth(100);
    }
    
    updateText(newText) {
        // Split the text into lines
        const [name, level, description] = newText.split('\n');
    
        // Update each text object
        this.nameText.setText(name);
        this.levelText.setText(level);
        this.descriptionText.setText(description);
    
        this.updateBackground();
    }
    

    updateBackground() {
        this.background.clear();
        this.background.fillStyle(0xFFFFFF, 0.7);
    
        // Check if text objects are defined
        if (this.nameText && this.levelText && this.descriptionText) {
            const width = Math.max(this.nameText.width, this.levelText.width, this.descriptionText.width);
            const height = this.nameText.height + this.levelText.height + this.descriptionText.height;
    
            this.background.fillRect(-10, -10, width + 20, height + 20);
        }
    }

    hideTooltip() {
        this.setVisible(false);
        this.scene.input.off('pointermove', this.followPointer, this); // Stop following the pointer
    }

    followPointer(pointer) {
        if (this.visible) {
            this.setPosition(pointer.worldX + 15, pointer.worldY); // Adjust offset as needed
        }
    }
}