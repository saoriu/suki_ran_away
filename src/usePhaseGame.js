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
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 }, // No gravity in top-down games
                    debug: true // Change to true to see the physics bodies
                }
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
            // Loading sit frames
            for (let i = 1; i <= 8; i++) this.load.image(`sit${i}`, `/sit${i}.png`);
            for (let i = 1; i <= 8; i++) this.load.image(`run${i}`, `/run${i}.png`);
            for (let i = 1; i <= 11; i++) this.load.image(`dead${i}`, `/dead${i}.png`);
            for (let i = 1; i <= 8; i++) this.load.image(`scratch${i}`, `/scratch${i}.png`);
            for (let i = 1; i <= 13; i++) this.load.image(`tile${i}`, `/tile${i}.png`);
            for (let i = 1; i <= 8; i++) this.load.image(`sit-forward${i}`, `/sit-forward${i}.png`);
            for (let i = 1; i <= 8; i++) this.load.image(`sit-back${i}`, `/sit-back${i}.png`);
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

        let isAttacking = false; // flag to check if scratch animation is already playing

        function create() {
            const camera = this.cameras.main;
            this.scene.launch('UIScene');
            camera.setSize(720, GAME_CONFIG.CAMERA_HEIGHT); // restrict camera size
            //set the cat sprite to immovable:
            cat = this.physics.add.sprite(80, 80, 'sit').setScale(1);
            this.cat = cat; // Attach the cat sprite to the scene
            cat.body.setCircle(cat.width / 2);  // Circular hitbox for the cat
            cat.body.immovable = true;
            // Creating sit animation
            this.anims.create({
                key: 'sit',
                frames: [
                    { key: 'sit1' },
                    { key: 'sit2' },
                    { key: 'sit3' },
                    { key: 'sit4' },
                    { key: 'sit5' },
                    { key: 'sit6' },
                    { key: 'sit7' },
                    { key: 'sit8' }
                ],
                frameRate: 7,
                repeat: -1 // to loop the animation indefinitely
            });

            this.anims.create({
                key: 'sit-forward',
                frames: [
                    { key: 'sit-forward1' },
                    { key: 'sit-forward2' },
                    { key: 'sit-forward3' },
                    { key: 'sit-forward4' },
                    { key: 'sit-forward5' },
                    { key: 'sit-forward6' },
                    { key: 'sit-forward7' },
                    { key: 'sit-forward8' }
                ],
                frameRate: 7,
                repeat: -1 // to loop the animation indefinitely
            });

            this.anims.create({
                key: 'sit-back',
                frames: [
                    { key: 'sit-back1' },
                    { key: 'sit-back2' },
                    { key: 'sit-back3' },
                    { key: 'sit-back4' },
                    { key: 'sit-back5' },
                    { key: 'sit-back6' },
                    { key: 'sit-back7' },
                    { key: 'sit-back8' }
                ],
                frameRate: 7,
                repeat: -1 // to loop the animation indefinitely
            });

            this.anims.create({
                key: 'scratch',
                frames: [
                    { key: 'scratch1' },
                    { key: 'scratch2' },
                    { key: 'scratch3' },
                    { key: 'scratch4' }
                ],
                frameRate: 8,
                repeat: 0 // to loop the animation indefinitely
            });

            this.anims.create({
                key: 'dead',
                frames: [
                    { key: 'dead1' },
                    { key: 'dead2' },
                    { key: 'dead3' },
                    { key: 'dead4' },
                    { key: 'dead5' },
                    { key: 'dead6' },
                    { key: 'dead7' },
                    { key: 'dead8' },
                    { key: 'dead9' },
                    { key: 'dead10' },
                    { key: 'dead11' }
                ],
                frameRate: 9,
                override: true,  // Ensure that it can override other animations
                repeat: 0
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
            cat.on('animationcomplete', (animation, frame) => {
                if (animation.key === 'dead') {
                    this.isFainting = false; // Reset the fainting flag
                    cat.play('sit'); // Switch to sit animation after fainting
                } else if (animation.key === 'scratch') {
                    isAttacking = false;
                    if (!this.isFainting) {
                        cat.play('sit'); // Return to sit animation after attacking
                    }
                }
            }, this);            
            this.input.keyboard.on('keydown-SPACE', () => {
                if (this.isFainting) return; // Prevent any action if player is fainting
            
                this.gameEvents.handleEvent(monsters);
                this.handleItemPickup();
            
                if (!isAttacking && !this.isFainting) { 
                    isAttacking = true; 
                    cat.play('scratch', true);
                }
            });
            this.inventoryContainer = this.add.container(10, 10); // Adjust the position as needed
            this.inventory = []; // Initialize the inventory
            this.maxInventorySize = 20; // Or whatever your max inventory size is
            this.items = []; // Initialize the items array
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
        let lastDirection = null; // Variable to store the last direction the cat moved
        const updateInterval = 1000 / 10; // For 10 FPS

        function update(time) {

            if (time - lastUpdateTime < updateInterval) {
                return; // Exit early if not enough time has passed since the last update
            }
            this.physics.collide(cat, Object.values(monsters).map(m => m.sprite), function (catSprite, monsterSprite) {
                // Calculate angle between cat and monster
                const angle = Phaser.Math.Angle.Between(catSprite.x, catSprite.y, monsterSprite.x, monsterSprite.y);

                // Determine push distance
                const pushDistance = 1;

                // Calculate new x and y for the monster using the angle and push distance
                monsterSprite.x += pushDistance * Math.cos(angle);
                monsterSprite.y += pushDistance * Math.sin(angle);

                console.log("Collision detected!");
            });

            if (isAttacking) {
            cat.play('scratch', true);
            cat.on('animationcomplete', (animation, frame) => {
                if (isAttacking) {
                    cat.play('sit');
                    isAttacking = false; // set flag to false to indicate scratch animation is finished
                }
            }, this);
        }

        if (PlayerState.energy <= 0 && !this.isFainting) {
            this.isFainting = true;
            console.log("Player has fainted!");
            isAttacking = false; // Ensure the scratch state is also reset
            cat.anims.stop(); // Forcefully stop the current animation
            cat.play('dead');
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

            if (this.isFainting) {
                return;
            }

            if (isAttacking) {
                return;
            }

            if (cursors.left.isDown) {
                cat.setVelocityX(-moveSpeed);
                cat.play('run', true);
                lastDirection = 'left';
            } else if (cursors.right.isDown) {
                cat.setVelocityX(moveSpeed);
                cat.play('run', true);
                lastDirection = 'right';
            } else {
                cat.setVelocityX(0);
            }
            
            if (cursors.up.isDown) {
                cat.setVelocityY(-moveSpeed);
                cat.play('up', true);
                lastDirection = 'up';
            } else if (cursors.down.isDown) {
                cat.setVelocityY(moveSpeed);
                cat.play('down', true);
                lastDirection = 'down';
            } else {
                cat.setVelocityY(0);
            }
            
            // Check if the cat has stopped moving and play the appropriate sitting animation based on the last direction
            if (cat.body.velocity.x === 0 && cat.body.velocity.y === 0) {
                switch (lastDirection) {
                    case 'up':
                        cat.play('sit-back', true);
                        break;
                    case 'down':
                        cat.play('sit-forward', true);
                        break;
                    default:
                        cat.play('sit', true);
                        break;
                }
            }
            


            if (!moveTile) {
                switch (lastDirection) {
                    case 'up':
                        cat.play('sit-back', true);
                        break;
                    case 'down':
                        cat.play('sit-forward', true);
                        break;
                    default:
                        cat.play('sit', true);
                        break;
                }
            }
            
            
            if (moveTile) {

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

                if (this.isFainting || isAttacking) {
                    return;
                }        
                
            }
            playerLevelText.x = cat.x;
            playerLevelText.y = cat.y - 60; // adjust as needed
            playerLevelText.setText(`Level: ${PlayerState.level}`);

            function updateHealthBar(scene, healthBar, currentHealth, maxHealth) {
                const hue = Phaser.Math.Clamp((currentHealth / maxHealth) * 120, 0, 120);
                const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.8, 0.5).color;
                const healthProgress = Math.max(0, currentHealth / maxHealth);
                const targetWidth = 100 * healthProgress;

                if (healthBar.fill) {
                    healthBar.fill.setFillStyle(color);
                    scene.tweens.add({
                        targets: healthBar.fill,
                        displayWidth: targetWidth,
                        duration: 100,
                        ease: 'Sine.easeInOut'
                    });
                } else {
                    console.error("The healthBar object does not have a fill property.");
                }
            }
            Object.values(monsters).forEach(monsterObj => {
                if (monsterObj && monsterObj.healthBar) {
                    updateHealthBar(this, monsterObj.healthBar, monsterObj.currentHealth, monsterObj.maxHealth);
                    if (monsterObj.healthText) {
                        monsterObj.healthText.setText(`HP: ${monsterObj.currentHealth}`);
                    }
                }
                if (monsterObj.healthBar && monsterObj.sprite) {
                    monsterObj.healthBar.outer.x = monsterObj.sprite.x - 30;
                    monsterObj.healthBar.outer.y = monsterObj.sprite.y + monsterObj.sprite.height + 55; // Adjust this value as needed

                    monsterObj.healthBar.fill.x = monsterObj.sprite.x - 28;
                    monsterObj.healthBar.fill.y = monsterObj.sprite.y + monsterObj.sprite.height + 55; // Adjust this value as needed

                    monsterObj.healthText.x = monsterObj.sprite.x + 20;
                    monsterObj.healthText.y = monsterObj.sprite.y + monsterObj.sprite.height + 75; // Adjust this value as needed
                }
            });


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

            // Removing far monsters and their health
            Object.keys(monsters).forEach((key) => {
                const [i, j] = key.split(',').map(Number);
                if (i < startI || i > endI || j < startJ || j > endJ) {
                    if (monsters[key]) {
                        monsters[key].sprite && monsters[key].sprite.destroy();
                        monsters[key].levelText && monsters[key].levelText.destroy();
                        monsters[key].isRemoved = true; // Add this flag
                        monsters[key].healthBar.outer.destroy();
                        monsters[key].healthBar.fill.destroy();
                        monsters[key].healthText.destroy();
                        delete monsters[key];
                    }
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
