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


export const usePhaserGame = (gameRef) => {
    useEffect(() => {
        if (!gameRef.current) {
            const config = {
                type: Phaser.AUTO,
                parent: 'phaser-game',
                width: GAME_CONFIG.CAMERA_WIDTH,
                height: GAME_CONFIG.CAMERA_HEIGHT,
                fps: {
                    target: 100, // Set your desired frame rate here
                },
                autoRound: false,
                antialias: true,
                scene: {
                    preload: preload,
                    create: create,
                    update: update,
                },
            };


            gameRef.current = new Phaser.Game(config);

            // Initialize Phaser Game
            let tiles = {};
            const tileWidth = GAME_CONFIG.TILE_WIDTH * GAME_CONFIG.SCALE;
            let cat;
            let cursors;
            let monsters = {};
            const tilesBuffer = GAME_CONFIG.TILES_BUFFER;
            let playerLevelText; // Define at the start of your useEffect, where other game variables are defined


            function preload() {
                for (let i = 1; i <= 5; i++) this.load.image(`grass${i}`, `/grass${i}.png`);
                this.load.image('cat', '/cat.png');
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
                cat = this.add.sprite(80, 80, 'cat').setScale(GAME_CONFIG.SCALE);
                camera.startFollow(cat);
                this.gameEvents = new GameEvents(this);
                createTilesAround(0, 0, this);
                cursors = this.input.keyboard.createCursorKeys();
                playerLevelText = this.add.text(cat.x, cat.y - 20, `Level: ${PlayerState.level}`, textStyles.playerLevelText).setOrigin(0.5);
                playerLevelText.setDepth(100); // high value to ensure it renders above other objects
                this.handleItemPickup = Inventory.handleItemPickup.bind(this);
                this.addToInventory = Inventory.addToInventory.bind(this);
                this.updateInventoryDisplay = Inventory.updateInventoryDisplay.bind(this);                
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
                const startI = Math.floor((centerX - camera.width / 2 - tilesBuffer * tileWidth) / tileWidth);
                const endI = Math.ceil((centerX + camera.width / 2 + tilesBuffer * tileWidth) / tileWidth);
                const startJ = Math.floor((centerY - camera.height / 2 - tilesBuffer * tileWidth) / tileWidth);
                const endJ = Math.ceil((centerY + camera.height / 2 + tilesBuffer * tileWidth) / tileWidth);

                for (let i = startI; i <= endI; i++) {
                    for (let j = startJ; j <= endJ; j++) {
                        if (!tiles[`${i},${j}`]) {
                            const tileType = Phaser.Math.Between(1, 10);
                            let tileKey = tileType <= 9 ? 'grass1' : `grass${Phaser.Math.Between(2, 4)}`;
                            const tile = scene.add.image(i * tileWidth, j * tileWidth, tileKey).setOrigin(0).setScale(GAME_CONFIG.SCALE);
                            tiles[`${i},${j}`] = tile;
                        }
                    }
                }
                cat.setDepth(1);
                    spawnMonsters(centerX, centerY, scene, tileWidth, tilesBuffer, monsters);
            }

            let lastUpdateTime = 0;
            const updateInterval = 1000 / 10; // For 10 FPS
            
            function update(time) {            
              if(time - lastUpdateTime < updateInterval) {
                return; // Exit early if not enough time has passed since the last update
              }
                const tileWidth = GAME_CONFIG.TILE_WIDTH * GAME_CONFIG.SCALE;
                const moveSpeed = tileWidth / GAME_CONFIG.MOVE_SPEED;
                this.gameEvents.update(monsters);
                regenerateEnergy();
                removeFarTiles(cat.x, cat.y, this); // <--- Passing gameEvents here
                const moveTile = cursors.left.isDown ? 'left' :
                    cursors.right.isDown ? 'right' :
                        cursors.up.isDown ? 'up' :
                            cursors.down.isDown ? 'down' : null;

                if (moveTile) {
                    switch (moveTile) {
                        case 'left': cat.x -= moveSpeed; break;
                        case 'right': cat.x += moveSpeed; break;
                        case 'up': cat.y -= moveSpeed; break;
                        case 'down': cat.y += moveSpeed; break;
                    }
                    createTilesAround(cat.x, cat.y, this);
                    removeFarTiles(cat.x, cat.y, this);
                    
                }

                playerLevelText.x = cat.x;
                playerLevelText.y = cat.y - 50; // adjust as needed
                playerLevelText.setText(`Level: ${PlayerState.level}`);
            }

            function removeFarTiles(centerX, centerY, scene) {
                const camera = scene.cameras.main;
                
                const startI = Math.floor((centerX - camera.width / 2 - (tilesBuffer) * tileWidth) / tileWidth);
                const endI = Math.ceil((centerX + camera.width / 2 + (tilesBuffer) * tileWidth) / tileWidth);
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
    }

        return () => {
            // Clean up Phaser Game Instance
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
    }, [gameRef]);
}
