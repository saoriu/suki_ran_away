// usePhaserGame.js
import { useEffect } from 'react';
import Phaser from 'phaser';
import { spawnMonsters } from './spawnMonsters';
import { PlayerState } from './playerState';
import { GAME_CONFIG } from './gameConstants.js';
import { textStyles } from './styles.js';
import { GameEvents } from './GameEvents';
import { regenerateEnergy } from './Energy';
import * as Inventory from './Inventory';
import { UIScene } from './UIScene';


export const usePhaserGame = (gameRef) => {
    useEffect(() => {
            const mainScene = {
                preload,
                create,
                update,
            };

            const config = {
                type: Phaser.AUTO,
                parent: 'phaser-game',
                width: GAME_CONFIG.CAMERA_WIDTH + 220, // Add extra 200px for the UI
                height: GAME_CONFIG.CAMERA_HEIGHT,
                fps: {
                    target: 100, // Set your desired frame rate here
                },
                autoRound: false,
                antialias: true,
                scene: [mainScene, UIScene], // MainScene and UIScene included here

            };


            gameRef.current = new Phaser.Game(config);
            console.log("gameInstance created: ", gameRef.current);
            window.game = gameRef.current;


            // Initialize Phaser Game
            let tiles = {};
            const tileWidth = GAME_CONFIG.TILE_WIDTH * GAME_CONFIG.SCALE;
            let cat;
            let cursors;
            let monsters = {};
            const tilesBuffer = GAME_CONFIG.TILES_BUFFER;
            let playerLevelText; // Define at the start of your useEffect, where other game variables are defined


            function preload() {
                // Loading idle frames
                for (let i = 1; i <= 8; i++) this.load.image(`idle${i}`, `/idle${i}.png`);
                for (let i = 1; i <= 8; i++) this.load.image(`run${i}`, `/run${i}.png`);
                for (let i = 1; i <= 13; i++) this.load.image(`tile${i}`, `/tile${i}.png`);
                for (let i = 1; i <= 8; i++) {
                    this.load.image(`up${i}`, `/up${i}.png`);
                    this.load.image(`down${i}`, `/down${i}.png`);
                }
                this.load.image('frame', '/frame-mini.png');
                this.load.image('grid', '/grid.png');
                this.load.image('grid-hover', '/grid-hover.png');
                this.load.image('grid-hovers', '/grid-hovers.png');
                this.load.image('grid-new', '/grid-new.png');
                this.load.image('chicken', '/chicken.png');
                this.load.image('fox', '/fox.png');
                this.load.image('panda', '/panda.png');
                this.load.image('dragonfly', '/dragonfly.png');
                this.load.image('raccoon', '/raccoon.png');
                this.load.image('bunny', '/bunny.png');
                this.load.image('espe', '/espe.png');
                this.load.image('apple', '/apple.png');
                this.load.image('cotton', '/cotton.png');
                this.load.image('diamond', '/diamond.png');
                this.load.image('emerald', '/emerald.png');
                this.load.image('gold', '/gold.png');
                this.load.image('lemon', '/lemon.png');
                this.load.image('pebble', '/pebble.png');
                this.load.image('peach', '/peach.png');
                this.load.image('strawberry', '/strawberry.png');
                this.load.image('blueberry', '/blueberry.png');
                this.load.image('egg', '/egg.png');
                this.load.image('milk', '/milk.png');
                this.load.image('flour', '/flour.png');
                this.load.image('ruby', '/ruby.png');
                this.load.image('silk', '/silk.png');
                this.load.image('thread', '/thread.png');

            }


            function create() {
                const camera = this.cameras.main;
                this.scene.launch('UIScene');
                camera.setSize(720, GAME_CONFIG.CAMERA_HEIGHT); // restrict camera size
                cat = this.add.sprite(80, 80, 'idle').setScale(2.5); // start with the first frame
                this.cat = cat; // add this line
                // Creating idle animation
                this.anims.create({
                    key: 'idle',
                    frames: [
                        { key: 'idle1' },
                        { key: 'idle2' },
                        { key: 'idle3' },
                        { key: 'idle4' },
                        { key: 'idle5' },
                        { key: 'idle6' },
                        { key: 'idle7' },
                        { key: 'idle8' }
                    ],
                    frameRate: 7,
                    repeat: -1 // to loop the animation indefinitely
                });


                this.anims.create({
                    key: 'run',
                    frames: [
                        { key: 'run1' },
                        { key: 'run2' },
                        { key: 'run3' },
                        { key: 'run4' },
                        { key: 'run5' },
                        { key: 'run6' },
                        { key: 'run7' },
                        { key: 'run8' }
                    ],
                    frameRate: 10,
                    repeat: -1 // to loop the animation indefinitely
                });
                cat.play('run'); // start playing the animation

                this.anims.create({
                    key: 'up',
                    frames: [
                        { key: 'up1' }, { key: 'up2' },
                        { key: 'up3' }, { key: 'up4' },
                        { key: 'up5' }, { key: 'up6' },
                        { key: 'up7' }, { key: 'up8' }
                    ],
                    frameRate: 7,
                    repeat: -1
                });
                
                this.anims.create({
                    key: 'down',
                    frames: [
                        { key: 'down1' }, { key: 'down2' },
                        { key: 'down3' }, { key: 'down4' },
                        { key: 'down5' }, { key: 'down6' },
                        { key: 'down7' }, { key: 'down8' }
                    ],
                    frameRate: 7,
                    repeat: -1
                });
                camera.startFollow(cat);
                this.gameEvents = new GameEvents(this, cat);
                createTilesAround(0, 0, this);
                cursors = this.input.keyboard.createCursorKeys();
                playerLevelText = this.add.text(cat.x, cat.y - 20, `Level: ${PlayerState.level}`, textStyles.playerLevelText).setOrigin(0.5);
                playerLevelText.setDepth(100); // high value to ensure it renders above other objects
                this.handleItemPickup = Inventory.handleItemPickup.bind(this);
                this.addToInventory = Inventory.addToInventory.bind(this);
                this.input.keyboard.on('keydown-SPACE', () => {
                    this.gameEvents.handleEvent(monsters);
                    this.handleItemPickup();
                });
                ;
                this.inventoryContainer = this.add.container(10, 10); // Adjust the position as needed
                this.inventory = []; // Initialize the inventory
                this.maxInventorySize = 20; // Or whatever your max inventory size is
                this.items = []; // Initialize the items array
                createTilesAround(0, 0, this);

            }

            function createTilesAround(centerX, centerY, scene) {
                const camera = scene.cameras.main;
                const startI = Math.floor((centerX - 720 / 2 - tilesBuffer * tileWidth) / tileWidth);
                const endI = Math.ceil((centerX + 720 / 2 + tilesBuffer * tileWidth) / tileWidth);
                const startJ = Math.floor((centerY - camera.height / 2 - tilesBuffer * tileWidth) / tileWidth);
                const endJ = Math.ceil((centerY + camera.height / 2 + tilesBuffer * tileWidth) / tileWidth);
                for (let i = startI; i <= endI; i++) {
                    for (let j = startJ; j <= endJ; j++) {
                        if (!tiles[`${i},${j}`]) {
                            const roll = Phaser.Math.FloatBetween(0, 1);
                            let tileType;

                            if (roll <= 0.70) { // 50% chance for tile 1
                                tileType = 1;
                            } else if (roll <= 0.95) { // Additional 35% chance for tiles 2-6
                                tileType = Phaser.Math.Between(2, 5);
                            } else if (roll <= 0.97) { // Additional 10% chance for tiles 7-8
                                tileType = Phaser.Math.Between(6, 9);
                            } else { // Remaining 5% chance for tiles 9-12
                                tileType = Phaser.Math.Between(10, 13);
                            }

                            const tileKey = `tile${tileType}`;
                            const tile = scene.add.image(i * tileWidth, j * tileWidth, tileKey).setOrigin(0).setScale(GAME_CONFIG.SCALE);
                            tiles[`${i},${j}`] = tile;
                        }
                    }


                }
                cat.setDepth(3);
                spawnMonsters(centerX, centerY, scene, tileWidth, tilesBuffer, monsters);

            }

            let lastUpdateTime = 0;
            const updateInterval = 1000 / 10; // For 10 FPS

            function update(time) {
                if (time - lastUpdateTime < updateInterval) {
                    return; // Exit early if not enough time has passed since the last update
                }
                const tileWidth = GAME_CONFIG.TILE_WIDTH * GAME_CONFIG.SCALE;
                const moveSpeed = tileWidth / GAME_CONFIG.MOVE_SPEED;
                this.gameEvents.update(monsters);
                regenerateEnergy(this); // Assuming 'this' is the scene
                removeFarTiles(cat.x, cat.y, this); // <--- Passing gameEvents here
                const moveTile = cursors.left.isDown ? 'left' :
                    cursors.right.isDown ? 'right' :
                        cursors.up.isDown ? 'up' :
                            cursors.down.isDown ? 'down' : null;

                if (moveTile) {
                    // Resume running animation

                    switch (moveTile) {
                        case 'left':
                            cat.x -= moveSpeed;
                            cat.play('run', true);
                            cat.flipX = true; // flip when moving left
                            this.scene.get('UIScene').events.emit('updatePlayerPosition', { x: cat.x, y: cat.y });
                            break;
                        case 'right':
                            cat.x += moveSpeed;
                            cat.play('run', true);
                            cat.flipX = false; // don't flip when moving right
                            this.scene.get('UIScene').events.emit('updatePlayerPosition', { x: cat.x, y: cat.y });
                            break;
                        case 'up':
                            cat.y -= moveSpeed;
                            cat.play('up', true);
                            this.scene.get('UIScene').events.emit('updatePlayerPosition', { x: cat.x, y: cat.y });
                            break;
                        case 'down':
                            cat.y += moveSpeed;
                            cat.play('down', true);
                            break;
                        default:
                            console.warn(`Unexpected moveTile value: ${moveTile}`);
                            this.scene.get('UIScene').events.emit('updatePlayerPosition', { x: cat.x, y: cat.y });
                            break;
                    }

                    createTilesAround(cat.x, cat.y, this);
                    removeFarTiles(cat.x, cat.y, this);

                } else if (cat.anims.currentAnim.key !== 'idle') {
                    // Play idle animation if the player is not moving
                    cat.play('idle');
                }

                playerLevelText.x = cat.x;
                playerLevelText.y = cat.y - 60; // adjust as needed
                playerLevelText.setText(`Level: ${PlayerState.level}`);
            }

            function removeFarTiles(centerX, centerY, scene) {
                const camera = scene.cameras.main;

                const startI = Math.floor((centerX - 720 / 2 - tilesBuffer * tileWidth) / tileWidth);
                const endI = Math.ceil((centerX + 720 / 2 + tilesBuffer * tileWidth) / tileWidth);
                const startJ = Math.floor((centerY - camera.height / 2 - (tilesBuffer) * tileWidth) / tileWidth);
                const endJ = Math.ceil((centerY + camera.height / 2 + (tilesBuffer) * tileWidth) / tileWidth);

                // Removing far tiles
                Object.keys(tiles).forEach((key) => {
                    const [i, j] = key.split(',').map(Number);
                    if (i < startI || i > endI || j < startJ || j > endJ) {
                        tiles[key].destroy();
                        delete tiles[key];
                    }
                });

                // Removing far monsters
                Object.keys(monsters).forEach((key) => {
                    const [i, j] = key.split(',').map(Number);
                    if (i < startI || i > endI || j < startJ || j > endJ) {
                        monsters[key].sprite.destroy(); // destroy the sprite
                        monsters[key].levelText.destroy(); // also destroy the levelText
                        delete monsters[key];
                    }
                });
            }

        return () => {
            // Clean up Phaser Game Instance
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
    }, [gameRef]);
      return gameRef.current;

}
