// usePhaserGame.js
import { useEffect } from 'react';
import Phaser from 'phaser';
import { spawnMonsters } from './spawnMonsters';
import { PlayerState } from './playerState';
import { GAME_CONFIG } from './gameConstants.js';
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
            width: GAME_CONFIG.CAMERA_WIDTH, // Add extra 200px for the UI
            height: GAME_CONFIG.CAMERA_HEIGHT + GAME_CONFIG.UI_HEIGHT,
            fps: {
                target: 100, // Set your desired frame rate here
            },
            physics: {
                default: 'matter',
                matter: {
                    gravity: { y: 0 },
                    debug: false // Set to false in production
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


        function preload() {
            // Loading sit frames
            for (let i = 1; i <= 8; i++) this.load.image(`sit${i}`, `/sit${i}.png`);
            for (let i = 1; i <= 8; i++) this.load.image(`run${i}`, `/run${i}.png`);
            for (let i = 1; i <= 11; i++) this.load.image(`dead${i}`, `/dead${i}.png`);
            for (let i = 1; i <= 4; i++) this.load.image(`scratch${i}`, `/scratch${i}.png`);
            for (let i = 1; i <= 13; i++) this.load.image(`tile${i}`, `/tile${i}.png`);
            for (let i = 1; i <= 8; i++) this.load.image(`sit-forward${i}`, `/sit-forward${i}.png`);
            for (let i = 1; i <= 8; i++) this.load.image(`sit-back${i}`, `/sit-back${i}.png`);
            for (let i = 1; i <= 8; i++) {
                this.load.image(`up${i}`, `/up${i}.png`);
                this.load.image(`down${i}`, `/down${i}.png`);
            };
            for (let i = 1; i <= 8; i++) this.load.image(`run-diagonal-back${i}`, `/rundiagonal${i}.png`);
            for (let i = 1; i <= 8; i++) this.load.image(`run-diagonal-front${i}`, `/rundiagonalfront${i}.png`);
            for (let i = 1; i <= 8; i++) this.load.image(`raccoon_run-${i}`, `/raccoon_run-${i}.png`);
            for (let i = 1; i <= 8; i++) this.load.image(`raccoon-${i}`, `/raccoon_idle-${i}.png`);
            for (let i = 1; i <= 7; i++) this.load.image(`raccoon_attack-${i}`, `/raccoon_attack-${i}.png`);
            for (let i = 1; i <= 8; i++) this.load.image(`panda_run-${i}`, `/panda_run-${i}.png`);
            for (let i = 1; i <= 4; i++) this.load.image(`panda-${i}`, `/panda_idle-${i}.png`);
            for (let i = 1; i <= 5; i++) this.load.image(`panda_attack-${i}`, `/panda_attack-${i}.png`);
            for (let i = 1; i <= 6; i++) this.load.image(`dragonfly_run-${i}`, `/dragonfly_run-${i}.png`);
            for (let i = 1; i <= 6; i++) this.load.image(`dragonfly-${i}`, `/dragonfly_idle-${i}.png`);
            for (let i = 1; i <= 7; i++) this.load.image(`dragonfly_attack-${i}`, `/dragonfly_attack-${i}.png`);
            for (let i = 1; i <= 4; i++) this.load.image(`chicken_run-${i}`, `/chicken_run-${i}.png`);
            for (let i = 1; i <= 4; i++) this.load.image(`chicken-${i}`, `/chicken_idle-${i}.png`);
            for (let i = 1; i <= 6; i++) this.load.image(`chicken_attack-${i}`, `/chicken_attack-${i}.png`);
            for (let i = 1; i <= 6; i++) this.load.image(`bunny_run-${i}`, `/bunny_run-${i}.png`);
            for (let i = 1; i <= 4; i++) this.load.image(`bunny-${i}`, `/bunny_idle-${i}.png`);
            for (let i = 1; i <= 6; i++) this.load.image(`bunny_attack-${i}`, `/bunny_attack-${i}.png`);
            for (let i = 1; i <= 7; i++) this.load.image(`raccoon_hurt-${i}`, `/raccoon_hurt-${i}.png`);
            for (let i = 1; i <= 7; i++) this.load.image(`panda_hurt-${i}`, `/panda_hurt-${i}.png`);
            for (let i = 1; i <= 5; i++) this.load.image(`dragonfly_hurt-${i}`, `/dragonfly_hurt-${i}.png`);
            for (let i = 1; i <= 5; i++) this.load.image(`chicken_hurt-${i}`, `/chicken_hurt-${i}.png`);
            for (let i = 1; i <= 6; i++) this.load.image(`bunny_hurt-${i}`, `/bunny_hurt-${i}.png`);
            for (let i = 1; i <= 16; i++) this.load.image(`bunny_die-${i}`, `/bunny_die-${i}.png`);
            for (let i = 1; i <= 10; i++) this.load.image(`chicken_die-${i}`, `/chicken_die-${i}.png`);
            for (let i = 1; i <= 8; i++) this.load.image(`dragonfly_die-${i}`, `/dragonfly_die-${i}.png`);
            for (let i = 1; i <= 8; i++) this.load.image(`panda_die-${i}`, `/panda_die-${i}.png`);
            for (let i = 1; i <= 8; i++) this.load.image(`raccoon_die-${i}`, `/raccoon_die-${i}.png`);
            for (let i = 1; i <= 12; i++) this.load.image(`turtle_die-${i}`, `/turtle_die-${i}.png`);
            for (let i = 1; i <= 6; i++) this.load.image(`turtle_hurt-${i}`, `/turtle_hurt-${i}.png`);
            for (let i = 1; i <= 6; i++) this.load.image(`turtle_attack-${i}`, `/turtle_hide-${i}.png`);
            for (let i = 1; i <= 5; i++) this.load.image(`turtle_run-${i}`, `/turtle_walk-${i}.png`);
            for (let i = 1; i <= 6; i++) this.load.image(`turtle-${i}`, `/turtle_idle-${i}.png`);



            this.load.image('frame', '/frame-mini.png');
            this.load.image('grid', '/grid.png');
            this.load.image('grid-hover', '/grid-hover.png');
            this.load.image('grid-hovers', '/grid-hovers.png');
            this.load.image('grid-new', '/grid-new.png');
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
            this.collidingMonsters = {};
            this.monsters = {};
            camera.setSize(720, GAME_CONFIG.CAMERA_HEIGHT); // restrict camera size

            cat = this.matter.add.sprite(80, 80, 'sit').setScale(0.35);
            this.cat = cat; // Attach the cat sprite to the scene

            const catBody = Phaser.Physics.Matter.Matter.Bodies.circle(80, 80, cat.width * 0.8, {
                inertia: Infinity, // Prevent rotation
                inverseInertia: 0,
                inStatic: false,
                mass: 20 // Set the mass greater than any monster, e.g., 2
            });
            this.cat.setExistingBody(catBody).setPosition(80, 80);

            this.collidingMonsterKey = null;

            this.anims.create({
                key: 'turtle',
                frames: Array.from({ length: 6 }, (_, i) => ({ key: `turtle-${i + 1}` })),
                frameRate: 12,
                repeat: 0
            });

            this.anims.create({
                key: 'turtle_run',
                frames: Array.from({ length: 5 }, (_, i) => ({ key: `turtle_run-${i + 1}` })),
                frameRate: 12,
                repeat: 0
            });

            this.anims.create({
                key: 'turtle_hurt',
                frames: Array.from({ length: 6 }, (_, i) => ({ key: `turtle_hurt-${i + 1}` })),
                frameRate: 12,
                repeat: 0
            });

            this.anims.create({
                key: 'turtle_die',
                frames: Array.from({ length: 12 }, (_, i) => ({ key: `turtle_die-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'turtle_attack',
                frames: Array.from({ length: 6 }, (_, i) => ({ key: `turtle_attack-${i + 1}` })),
                frameRate: 12,
                repeat: 0
            });

            this.anims.create({
                key: 'bunny',
                frames: Array.from({ length: 4 }, (_, i) => ({ key: `bunny-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'bunny_run',
                frames: Array.from({ length: 6 }, (_, i) => ({ key: `bunny_run-${i + 1}` })),
                frameRate: 12,
                repeat: 0
            });

            this.anims.create({
                key: 'bunny_attack',
                frames: Array.from({ length: 6 }, (_, i) => ({ key: `bunny_attack-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'bunny_hurt',
                frames: Array.from({ length: 6 }, (_, i) => ({ key: `bunny_hurt-${i + 1}` })),
                frameRate: 12,
                repeat: 0
            });

            this.anims.create({
                key: 'bunny_die',
                frames: Array.from({ length: 16 }, (_, i) => ({ key: `bunny_die-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'chicken',
                frames: Array.from({ length: 4 }, (_, i) => ({ key: `chicken-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'chicken_run',
                frames: Array.from({ length: 4 }, (_, i) => ({ key: `chicken_run-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'chicken_attack',
                frames: Array.from({ length: 6 }, (_, i) => ({ key: `chicken_attack-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'chicken_hurt',
                frames: Array.from({ length: 5 }, (_, i) => ({ key: `chicken_hurt-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'chicken_die',
                frames: Array.from({ length: 10 }, (_, i) => ({ key: `chicken_die-${i + 1}` })),
                frameRate: 20,
                repeat: 0
            });

            this.anims.create({
                key: 'dragonfly',
                frames: Array.from({ length: 6 }, (_, i) => ({ key: `dragonfly-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'dragonfly_run',
                frames: Array.from({ length: 6 }, (_, i) => ({ key: `dragonfly_run-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'dragonfly_attack',
                frames: Array.from({ length: 7 }, (_, i) => ({ key: `dragonfly_attack-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'dragonfly_hurt',
                frames: Array.from({ length: 5 }, (_, i) => ({ key: `dragonfly_hurt-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'dragonfly_die',
                frames: Array.from({ length: 8 }, (_, i) => ({ key: `dragonfly_die-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            // Panda Animations
            this.anims.create({
                key: 'panda',
                frames: Array.from({ length: 4 }, (_, i) => ({ key: `panda-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'panda_run',
                frames: Array.from({ length: 8 }, (_, i) => ({ key: `panda_run-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'panda_attack',
                frames: Array.from({ length: 5 }, (_, i) => ({ key: `panda_attack-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'panda_hurt',
                frames: Array.from({ length: 7 }, (_, i) => ({ key: `panda_hurt-${i + 1}` })),
                frameRate: 14,
                repeat: 0
            });

            this.anims.create({
                key: 'panda_die',
                frames: Array.from({ length: 8 }, (_, i) => ({ key: `panda_die-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            // Raccoon Animations
            this.anims.create({
                key: 'raccoon',
                frames: Array.from({ length: 8 }, (_, i) => ({ key: `raccoon-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'raccoon_run',
                frames: Array.from({ length: 8 }, (_, i) => ({ key: `raccoon_run-${i + 1}` })),
                frameRate: 14,
                repeat: 0
            });

            this.anims.create({
                key: 'raccoon_attack',
                frames: Array.from({ length: 7 }, (_, i) => ({ key: `raccoon_attack-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'raccoon_hurt',
                frames: Array.from({ length: 7 }, (_, i) => ({ key: `raccoon_hurt-${i + 1}` })),
                frameRate: 14,
                repeat: 0
            });

            this.anims.create({
                key: 'raccoon_die',
                frames: Array.from({ length: 8 }, (_, i) => ({ key: `raccoon_die-${i + 1}` })),
                frameRate: 10,
                repeat: 0
            });

            this.anims.create({
                key: 'sit',
                frames: Array.from({ length: 8 }, (_, i) => ({ key: `sit${i + 1}` })),
                frameRate: 7,
                repeat: 0 // to loop the animation indefinitely
            });
            this.anims.create({
                key: 'run-diagonal-back',
                frames: Array.from({ length: 8 }, (_, i) => ({ key: `run-diagonal-back${i + 1}` })),
                frameRate: 17,
                repeat: 0 // to loop the animation indefinitely
            });
            this.anims.create({
                key: 'run-diagonal-front',
                frames: Array.from({ length: 8 }, (_, i) => ({ key: `run-diagonal-front${i + 1}` })),
                frameRate: 17,
                repeat: 0 // to loop the animation indefinitely
            });
            this.anims.create({
                key: 'sit-forward',
                frames: Array.from({ length: 8 }, (_, i) => ({ key: `sit-forward${i + 1}` })),
                frameRate: 7,
                repeat: 0 // to loop the animation indefinitely
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
                repeat: 0 // to loop the animation indefinitely
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
                repeat: 0 // to loop the animation indefinitely
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
                repeat: 0
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
                repeat: 0
            });
            camera.startFollow(cat);
            this.gameEvents = new GameEvents(this, cat);
            createTilesAround(0, 0, this);
            cursors = this.input.keyboard.createCursorKeys();
            this.handleItemPickup = Inventory.handleItemPickup.bind(this);
            this.addToInventory = Inventory.addToInventory.bind(this);
            this.clearInventory = Inventory.clearInventory.bind(this);
            cat.on('animationcomplete', (animation, frame) => {
                if (animation.key === 'dead') {
                    cat.play('sit'); // Switch to sit animation after fainting
                    this.isFainting = false; // Reset the fainting flag
                    this.isDead = false;
                    canAttack = true;
                } else if (animation.key === 'scratch') {
                    isAttacking = false;
                    if (!this.isFainting) {
                        cat.play('sit'); // Return to sit animation after attacking
                    }
                }
            }, this);
            let canAttack = true;
            let spaceInterval;

            this.input.keyboard.on('keydown', (event) => {
                if (event.code === 'Space' && !spaceInterval && !this.isFainting) {
                    spaceInterval = setInterval(() => {
                        this.handleItemPickup();
                        isAttacking = true;

                        if (canAttack && this.collidingMonsterKey) {
                            this.gameEvents.playerAttack(monsters, this.collidingMonsterKey);
                            canAttack = false;
                            setTimeout(() => {
                                if (!this.isFainting) {
                                    canAttack = true;
                                    isAttacking = false;
                                }
                            }, 500);
                        }
                    }, 100);
                }
            });

            this.input.keyboard.on('keyup', (event) => {
                if (event.code === 'Space') {
                    clearInterval(spaceInterval);
                    spaceInterval = null;
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

        let lastPlayerX = 0;
let lastPlayerY = 0;
const positionChangeThreshold = 20; // Adjust this value as needed
let gameTime = 0; // In-game hours
let daysPassed = 0; // In-game days

function update(time, delta) {
    if (time - lastUpdateTime < updateInterval) {
        return; // Exit early if not enough time has passed since the last update
    }

    // Increment gameTime every second
    gameTime += delta / 10000;
    if (gameTime >= 24) {
        // A new day has passed
        gameTime = 0;
        daysPassed++;
    }

    this.game.events.emit('gameTime', gameTime);
    this.game.events.emit('daysPassed', daysPassed)




            if (PlayerState.energy <= 0 && !this.isFainting) {
                handlePlayerDeath.call(this);
            }

            if (Math.abs(cat.x - lastPlayerX) > positionChangeThreshold || 
            Math.abs(cat.y - lastPlayerY) > positionChangeThreshold) {
    
            createTilesAround(cat.x, cat.y, this);
            lastPlayerX = cat.x;
            lastPlayerY = cat.y;
        }

            updateTargetMonsterKey.call(this); // Update the target monster key after collision detection


            Object.keys(this.collidingMonsters).forEach(key => {
                if (!this.collidingMonsters[key].isColliding) {
                    delete this.collidingMonsters[key];
                    updateTargetMonsterKey.call(this); // Re-evaluate target monster after each deletion
                }
            });

            // Create a map of monster body IDs to monster keys
            const monsterBodyIdToKey = {};
            for (const [key, monster] of Object.entries(monsters)) {
                if (monster.sprite && monster.sprite.body) {
                    monsterBodyIdToKey[monster.sprite.body.id] = key;
                }
            }

            this.matter.world.on('collisionstart', (event) => {
                event.pairs.forEach(pair => {
                    // Ensure both bodies in the pair are defined
                    if (pair.bodyA && pair.bodyB) {
                        // Check if either body in the pair is a monster
                        const monsterKeyA = monsterBodyIdToKey[pair.bodyA.id];
                        const monsterKeyB = monsterBodyIdToKey[pair.bodyB.id];

                        if (monsterKeyA && pair.bodyB.id === this.cat.body.id) {
                            console.log(`Colliding with monster: ${monsterKeyA}`);
                            monsters[monsterKeyA].isColliding = true;
                            this.collidingMonsters[monsterKeyA] = monsters[monsterKeyA];
                        } else if (monsterKeyB && pair.bodyA.id === this.cat.body.id) {
                            console.log(`Colliding with monster: ${monsterKeyB}`);
                            monsters[monsterKeyB].isColliding = true;
                            this.collidingMonsters[monsterKeyB] = monsters[monsterKeyB];
                        }
                    }
                });
            });


            if (isAttacking && this.collidingMonsterKey) {
                cat.play('scratch', true);
                cat.on('animationcomplete', (animation, frame) => {
                    if (isAttacking) {
                        cat.play('sit');
                        isAttacking = false; // set flag to false to indicate scratch animation is finished
                    }
                }, this);
                updateTargetMonsterKey.call(this);
            } else if (isAttacking && !this.isDead) {
                cat.play('scratch', true);
                cat.on('animationcomplete', (animation, frame) => {
                    if (isAttacking) {
                        cat.play('sit');
                        isAttacking = false; // set flag to false to indicate scratch animation is finished
                    }
                }, this);
            }
            Object.values(monsters).forEach(monster => {
                if (!monster || !monster.sprite || !monster.sprite.active) return;

                if (cat.x < monster.sprite.x) {
                    // Player is to the left, flip monster to the left
                    monster.sprite.setFlipX(true);
                } else {
                    // Player is to the right, flip monster to the right
                    monster.sprite.setFlipX(false);
                }

                if (monster.isHurt) {
                    monster.sprite.play(`${monster.event.monster}_hurt`, true);
                    monster.sprite.once('animationcomplete', () => {
                        if (monster.sprite && monster.sprite.active) {
                            monster.isHurt = false; // Reset the flag after playing the hurt animation
                            // Optionally, you can switch to another animation here, such as idle
                            monster.sprite.play(`${monster.event.monster}`, true);
                        }
                    }, this);
                } else if (monster.isAttacking) {
                    monster.sprite.play(`${monster.event.monster}_attack`, true);
                    monster.sprite.once('animationcomplete', (animation) => {
                        if (animation.key === `${monster.event.monster}_attack`) {
                            monster.isAttacking = false;
                        }
                    }, this);
                } else if (monster.currentHealth <= 0) {
                    monster.sprite.play(`${monster.event.monster}_die`, true);
                } else if (monster.isMoving) {
                    monster.sprite.play(`${monster.event.monster}_run`, true);
                } else {
                    // Default animation (idle)
                    monster.sprite.play(`${monster.event.monster}`, true);
                }
            });


            const tileWidth = GAME_CONFIG.TILE_WIDTH * GAME_CONFIG.SCALE;


            const moveSpeed = tileWidth / GAME_CONFIG.MOVE_SPEED;
            const diagonalVelocity = (moveSpeed / Math.sqrt(2)) * 0.6 // Multiply by 0.7 to adjust diagonal speed

            this.gameEvents.update(monsters);
            regenerateEnergy(this); // Assuming 'this' is the scene
            removeFarTiles(cat.x, cat.y, this); // <--- Passing gameEvents here
            const moveTile = cursors.left.isDown && cursors.up.isDown ? 'upLeft' :
                cursors.right.isDown && cursors.up.isDown ? 'upRight' :
                    cursors.left.isDown && cursors.down.isDown ? 'downLeft' :
                        cursors.right.isDown && cursors.down.isDown ? 'downRight' :
                            cursors.left.isDown ? 'left' :
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
                lastDirection = 'left';
                if (!cat.anims.isPlaying) {
                    cat.play('run', true);
                }
            } else if (cursors.right.isDown) {
                cat.setVelocityX(moveSpeed);
                lastDirection = 'right';
                if (!cat.anims.isPlaying) {
                    cat.play('run', true);
                }
            } else {
                cat.setVelocityX(0);
            }

            if (cursors.up.isDown) {
                cat.setVelocityY(-moveSpeed);
                lastDirection = 'up';
                if (!cat.anims.isPlaying) {
                    cat.play('up', true);
                }
            } else if (cursors.down.isDown) {
                cat.setVelocityY(moveSpeed);
                lastDirection = 'down';
                if (!cat.anims.isPlaying) {
                    cat.play('down', true);
                }
            } else {
                cat.setVelocityY(0);
            }



            // Check if the cat has stopped moving and play the appropriate sitting animation based on the last direction
            if (cat.body.velocity.x === 0 && cat.body.velocity.y === 0) {
                switch (lastDirection) {
                    case 'up':
                        if (!cat.anims.isPlaying) {
                            cat.play('sit-back', true);
                        }
                        break;
                    case 'down':
                        if (!cat.anims.isPlaying) {
                            cat.play('sit-forward', true);
                        }
                        break;
                    default:
                        if (!cat.anims.isPlaying) {
                            cat.play('sit', true);
                        }
                        break;
                }
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
                    case 'upLeft':
                        cat.x -= diagonalVelocity;
                        cat.y -= diagonalVelocity;
                        cat.play('run-diagonal-back', true);
                        cat.flipX = true; // flip when moving left
                        this.scene.get('UIScene').events.emit('updatePlayerPosition', { x: cat.x, y: cat.y });
                        break;
                    case 'upRight':
                        cat.x += diagonalVelocity;
                        cat.y -= diagonalVelocity;
                        cat.play('run-diagonal-back', true);
                        cat.flipX = false; // don't flip when moving right
                        this.scene.get('UIScene').events.emit('updatePlayerPosition', { x: cat.x, y: cat.y });
                        break;
                    case 'downLeft':
                        cat.x -= diagonalVelocity;
                        cat.y += diagonalVelocity;
                        cat.play('run-diagonal-front', true);
                        cat.flipX = true; // flip when moving left
                        this.scene.get('UIScene').events.emit('updatePlayerPosition', { x: cat.x, y: cat.y });
                        break;
                    case 'downRight':
                        cat.x += diagonalVelocity;
                        cat.y += diagonalVelocity;
                        cat.play('run-diagonal-front', true);
                        cat.flipX = false; // don't flip when moving right
                        this.scene.get('UIScene').events.emit('updatePlayerPosition', { x: cat.x, y: cat.y });
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

            function updateHealthBar(scene, healthBar, currentHealth, maxHealth) {
                const hue = Phaser.Math.Clamp((currentHealth / maxHealth) * 120, 0, 120);
                const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.8, 0.5).color;
                const healthProgress = Math.max(0, currentHealth / maxHealth);
                const targetWidth = 80 * healthProgress;

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

            function handlePlayerDeath() {
                if (this.isFainting) return; // Prevent multiple calls if already processing death

                this.isDead = true;
                PlayerState.isDead = true;

                this.isFainting = true;
                isAttacking = false; // Ensure no attack is in progress
                cat.anims.stop(); // Stop current animations
                cat.play('dead'); // Play death animation

                //reset the colliding monsters and colliding monster key:
                this.collidingMonsters = {};
                this.collidingMonsterKey = null;

                // Clear monsters and inventory
                Object.values(monsters).forEach(monster => this.gameEvents.endBattleForMonster(monster));
                monsters = {};
                this.clearInventory();

                // Listen for the 'animationcomplete' event
                cat.on('animationcomplete', (animation) => {
                    // Check if the completed animation is 'dead'
                    if (animation.key === 'dead') {
                        PlayerState.isDead = false;
                        // Reset relevant player states
                        PlayerState.energy = 100; // Or any other logic for resetting player state
                        // ... other state resets as needed
                    }
                }, this);
            }

            function updateTargetMonsterKey() {
                this.collidingMonsterKey = null; // Reset the target monster key

                // Determine the colliding monster that the player is facing
                for (const [key, monster] of Object.entries(this.collidingMonsters)) {
                    if (isMonsterInFront(cat, monster, lastDirection)) {
                        this.collidingMonsterKey = key;
                        break; // Break the loop once the first facing monster is found
                    }
                }
            }


            function isMonsterInFront(player, monster, lastDirection) {
                switch (lastDirection) {
                    case 'left':
                        return monster.sprite.x < player.x;
                    case 'right':
                        return monster.sprite.x > player.x;
                    case 'up':
                        return monster.sprite.y < player.y;
                    case 'down':
                        return monster.sprite.y > player.y;
                    default:
                        return false;
                }
            }



            Object.values(monsters).forEach(monsterObj => {
                // Check if monster object and its essential properties still exist
                if (!monsterObj || !monsterObj.sprite || !monsterObj.sprite.active || !monsterObj.healthBar || !monsterObj.sprite.body) return;

                // If the previousHealth property is not set, initialize it to the current health
                if (!monsterObj.hasOwnProperty('previousHealth')) {
                    monsterObj.previousHealth = monsterObj.currentHealth;
                }

                const healthChange = monsterObj.previousHealth - monsterObj.currentHealth;
                if (healthChange !== 0 && monsterObj.sprite) {
                    const changeText = this.add.text(monsterObj.sprite.x, monsterObj.sprite.y - 20, `-${healthChange}`, { font: '16px Arial', fill: '#ff0000' });
                    this.tweens.add({
                        targets: changeText,
                        y: changeText.y - 20,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => {
                            changeText.destroy();
                        }
                    });
                }

                updateHealthBar(this, monsterObj.healthBar, monsterObj.currentHealth, monsterObj.maxHealth);

                // Check if healthText is valid and update it
                if (monsterObj.healthText && monsterObj.currentHealth > 0 && monsterObj.sprite) {
                    monsterObj.healthText.setText(`HP: ${monsterObj.currentHealth}`);
                }
                monsterObj.previousHealth = monsterObj.currentHealth;  // Update previousHealth for the next iteration

                // Update positions of monster health bar and text only if the sprite is still valid
                if (monsterObj.sprite) {
                    monsterObj.healthBar.outer.x = monsterObj.sprite.x - 30;
                    monsterObj.healthBar.outer.y = monsterObj.sprite.y + monsterObj.sprite.height + 55;

                    monsterObj.healthBar.fill.x = monsterObj.sprite.x - 28;
                    monsterObj.healthBar.fill.y = monsterObj.sprite.y + monsterObj.sprite.height + 55;

                    monsterObj.healthText.x = monsterObj.sprite.x + 20;
                    monsterObj.healthText.y = monsterObj.sprite.y + monsterObj.sprite.height + 75;

                    monsterObj.levelText.x = monsterObj.sprite.x + (tileWidth / 2);
                    monsterObj.levelText.y = monsterObj.sprite.y - 30;
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
        }

        return () => {
            // Clean up Phaser Game Instance
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
    }, [gameRef]);
    return gameRef.current;

}