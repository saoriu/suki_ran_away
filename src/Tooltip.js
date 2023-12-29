import Phaser from 'phaser';
import { textStyles } from './styles.js'; 

export class Tooltip extends Phaser.GameObjects.Container {
    constructor(scene, x, y, text) {
        super(scene, x, y);
        this.scene = scene;
        this.text = text;
        this.setupTooltip();
    }

    setupTooltip() {
        // Create a text object and style it as needed
        this.tooltipText = this.scene.add.text(0, 0, this.text, textStyles.tooltip);

        // Create a background box for the text
        const background = this.scene.add.graphics();
        background.fillStyle(0x000000, 0.7);
        background.fillRect(-10, -10, this.tooltipText.width + 20, this.tooltipText.height + 20);

        // Add background and text to the container
        this.add(background);
        this.add(this.tooltipText);

        // Hide the tooltip initially
        this.setVisible(true);
        this.scene.input.on('pointermove', this.followPointer, this);
    
        this.scene.add.existing(this);
    }

    showTooltip(x, y) {
        console.log('Showing tooltip');
        //console log the text and x y
        this.setPosition(x, y);
        this.setVisible(true);
        this.setDepth(100);
    }
    
    updateText(newText) {
        console.log('Updating tooltip text:', newText);
        this.tooltipText.setText(newText);
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
