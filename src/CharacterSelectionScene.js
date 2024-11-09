import Phaser from 'phaser';
import { PlayerState } from './playerState';
import { createSkinAnims } from './createAnims';
import FontFaceObserver from 'fontfaceobserver';

export class CharacterSelectionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectionScene' });
        this.selectedIndex = 0;
    }

    preload() {
        console.log('CharacterSelectionScene preload');
        const skins = ['nori', 'mochi', 'ume', 'yaku', 'cat'];
        skins.forEach(skin => {
            console.log(`Loading atlas for ${skin}`);
            this.load.atlas(skin, `/characters/${skin}.png`, `/characters/${skin}.json`);
        });

        // Load the Ninja font
        const ninjaFontObserver = new FontFaceObserver('Ninja');
        ninjaFontObserver.load().then(() => {
            console.log('Ninja font loaded');
        }).catch(err => {
            console.error('Ninja font failed to load', err);
        });
    }

    create() {
        console.log('CharacterSelectionScene create');
        const skins = ['nori', 'mochi', 'ume', 'yaku', 'cat'];
        this.sprites = [];

        if (!PlayerState.skin || PlayerState.skin === 'default') {
            console.log('No skin selected, showing character selection');
            this.add.text(this.cameras.main.centerX, 50, 'Select   your   character', { fontSize: '32px', fill: '#fff', fontFamily: 'Ninja' }).setOrigin(0.5);

            const spacing = 150;
            const startX = this.cameras.main.centerX - (skins.length - 1) * spacing / 2;

            skins.forEach((skin, index) => {
                console.log(`Displaying sprite for ${skin}`);
                const x = startX + index * spacing;
                const y = 200;

                const sprite = this.add.sprite(x, y, skin).setScale(1).setInteractive();
                sprite.on('pointerdown', () => this.selectSkin(skin));

                // Create animations for the skin
                createSkinAnims(this, skin);

                // Play sit animation starting from different frames
                sprite.anims.play(`${skin}-sit`, true, index);

                this.sprites.push(sprite);

                // Add text label below the sprite
                const skinName = skin === 'cat' ? 'suki' : skin;
                this.add.text(x, y + 70, skinName, { fontSize: '18px', fill: '#fff', fontFamily: 'Ninja' }).setOrigin(0.5);
            });

            // Create a graphics object for the triangle
            this.triangle = this.add.graphics();
            this.triangle.fillStyle(0xffff, 1); // Set the fill color to red with full opacity for better visibility
            this.triangle.setDepth(10); // Ensure the triangle is drawn on top

            // Handle keyboard input
            this.input.keyboard.on('keydown-LEFT', this.selectPrevious, this);
            this.input.keyboard.on('keydown-RIGHT', this.selectNext, this);
            this.input.keyboard.on('keydown-SPACE', this.confirmSelection, this);

            // Update the selected skin
            this.updateSelection();
        } else {
            console.log('Skin already selected, starting mainScene');
            this.scene.start('mainScene');
        }
    }

    selectPrevious() {
        this.selectedIndex = (this.selectedIndex - 1 + this.sprites.length) % this.sprites.length;
        this.updateSelection();
    }

    selectNext() {
        this.selectedIndex = (this.selectedIndex + 1) % this.sprites.length;
        this.updateSelection();
    }

    confirmSelection() {
        const selectedSkin = ['nori', 'mochi', 'ume', 'yaku', 'cat'][this.selectedIndex];
        this.selectSkin(selectedSkin);
    }

    updateSelection() {
        this.triangle.clear();
        const selectedSprite = this.sprites[this.selectedIndex];
        this.triangle.fillStyle(0xffff, 1); // Ensure the fill color is set before drawing
        this.triangle.fillTriangle(
            selectedSprite.x + 20, selectedSprite.y - selectedSprite.displayHeight / 2 - 10,
            selectedSprite.x + 10, selectedSprite.y - selectedSprite.displayHeight / 2 - 30,
            selectedSprite.x + 30, selectedSprite.y - selectedSprite.displayHeight / 2 - 30
        );
    }
    selectSkin(skin) {
        console.log(`Skin selected: ${skin}`);
        PlayerState.skin = skin;
        this.scene.start('mainScene');
    }
}