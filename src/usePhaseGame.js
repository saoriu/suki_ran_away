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
import { preloadFrames } from './preloadFrames';
import { createAnims } from './createAnims';

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
        const moveSpeed = PlayerState.speed;
        const diagonalVelocity = (moveSpeed / Math.sqrt(2))


        function preload() {
            const boundPreloadFrames = preloadFrames.bind(this);
            boundPreloadFrames();
        }

        let isAttacking = false; // flag to check if scratch animation is already playing
        let canAttack = true;
        const monsterBodyIdToKey = {};
        const POSITION_CHANGE_THRESHOLD = 0.1;

        function create() {
            const camera = this.cameras.main;
            this.scene.launch('UIScene');
            console.log("Scene name:", this.scene.key);
            this.collidingMonsters = {};
            this.monsters = {};
            console.log("usePhaseGame scene:", this);
            camera.setSize(720, GAME_CONFIG.CAMERA_HEIGHT); // restrict camera size

            cat = this.matter.add.sprite(0, 0, 'sit', null, {
                isStatic: false,
                friction: 0,
            }).setScale(0.35).setCircle(25).setDepth(5);

            this.cat = cat; // Attach the cat sprite to the scene

            // Adjust the physics properties of the cat
            const catBody = this.cat.body;
            catBody.inertia = Infinity; // Prevent rotation
            catBody.inverseInertia = 0;
            catBody.mass = 1;
            cat.body.friction = 0;
            cat.body.frictionAir = 0;
            cat.setDepth(5)


            this.collidingMonsterKey = null;

            createAnims(this);
            camera.startFollow(cat);
            this.gameEvents = new GameEvents(this, cat);
            createTilesAround(0, 0, this);
            cursors = this.input.keyboard.createCursorKeys();
            this.handleItemPickup = Inventory.handleItemPickup.bind(this);
            this.addToInventory = Inventory.addToInventory.bind(this);
            this.clearInventory = Inventory.clearInventory.bind(this);
            let spaceInterval;

            this.input.keyboard.on('keydown', (event) => {
                if (event.code === 'Space' && !spaceInterval && !this.isFainting) {
                    spaceInterval = setInterval(() => {
                        this.handleItemPickup();
                        if (canAttack && this.collidingMonsterKey) {
                            this.gameEvents.playerAttack(monsters, this.collidingMonsterKey);
                            isAttacking = true;
                            canAttack = false;
                            setTimeout(() => {
                                if (!this.isFainting) {
                                    canAttack = true;
                                    isAttacking = false;
                                }
                            }, 1000);
                        }
                    }, 0);
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

        let daysPassed = 0; // In-game days

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

            spawnMonsters(centerX, centerY, scene, tileWidth, tilesBuffer, monsters, daysPassed);
        }




        let lastUpdateTime = 0;
        let lastDirection = null; // Variable to store the last direction the cat moved
        const updateInterval = 1000 / 10; // For 10 FPS

        let lastPlayerX = 0;
        let lastPlayerY = 0;
        const positionChangeThreshold = 20; // Adjust this value as needed
        let gameTime = 0; // In-game hours
        function handlePlayerMovement() {
            //if player is attacking or fainting velocity is 0
            if (isAttacking || PlayerState.isDead) {
                cat.setVelocity(0, 0);
                return;
            }


            let velocityX = 0, velocityY = 0;

            if (cursors.left.isDown && cursors.up.isDown) {
                // Handle up-left diagonal movement
                velocityX = -diagonalVelocity;
                velocityY = -diagonalVelocity;
                lastDirection = 'upLeft';
            } else if (cursors.right.isDown && cursors.up.isDown) {
                // Handle up-right diagonal movement
                velocityX = diagonalVelocity;
                velocityY = -diagonalVelocity;
                lastDirection = 'upRight';
            } else if (cursors.left.isDown && cursors.down.isDown) {
                // Handle down-left diagonal movement
                velocityX = -diagonalVelocity;
                velocityY = diagonalVelocity;
                lastDirection = 'downLeft';
            } else if (cursors.right.isDown && cursors.down.isDown) {
                // Handle down-right diagonal movement
                velocityX = diagonalVelocity;
                velocityY = diagonalVelocity;
                lastDirection = 'downRight';
            } else if (cursors.left.isDown) {
                // Handle left movement
                velocityX = -moveSpeed;
                lastDirection = 'left';
            } else if (cursors.right.isDown) {
                // Handle right movement
                velocityX = moveSpeed;
                lastDirection = 'right';
            } else if (cursors.up.isDown) {
                // Handle up movement
                velocityY = -moveSpeed;
                lastDirection = 'up';
            } else if (cursors.down.isDown) {
                // Handle down movement
                velocityY = moveSpeed;
                lastDirection = 'down';
            }

            cat.setVelocity(velocityX, velocityY);
            handlePlayerAnimations(lastDirection, velocityX, velocityY);
        }

        function handlePlayerAnimations(lastDirection, velocityX, velocityY) {

            if (PlayerState.isDead) {
                cat.play('dead', true);
                return;
            }

            if (isAttacking) {
                return;
            }

            if (velocityX === 0 && velocityY === 0) {
                // Handle idle animations based on last direction
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
            } else
                // Handle movement animations
                if (lastDirection === 'left') {
                    cat.play('run', true);
                    cat.flipX = true; // flip when moving left
                } else if (lastDirection === 'right') {
                    cat.play('run', true);
                    cat.flipX = false; // don't flip when moving right
                } else if (lastDirection === 'up') {
                    cat.play('up', true);
                } else if (lastDirection === 'down') {
                    cat.play('down', true);
                }
                else if (lastDirection === 'upLeft') {
                    cat.play('run-diagonal-back', true);
                    cat.flipX = true;
                }
                else if (lastDirection === 'upRight') {
                    cat.play('run-diagonal-back', true);
                    cat.flipX = false;
                }
                else if (lastDirection === 'downLeft') {
                    cat.play('run-diagonal-front', true);
                    cat.flipX = true;
                }
                else if (lastDirection === 'downRight') {
                    cat.play('run-diagonal-front', true);
                    cat.flipX = false;
                }
        }

        function update(time, delta) {
            if (time - lastUpdateTime < updateInterval) {
                return; // Exit early if not enough time has passed since the last update
            }

            // Increment gameTime every second
            gameTime += delta / 6000;
            if (gameTime >= 24) {
                // A new day has passed
                gameTime = 0;
                daysPassed++;
            }

            this.game.events.emit('gameTime', gameTime);
            this.game.events.emit('daysPassed', daysPassed)

            handlePlayerMovement();

            //call spawnMonsters by pressing the 'm' key:
            this.input.keyboard.on('keydown', (event) => {
                if (event.code === 'KeyM') {
                    spawnMonsters(cat.x, cat.y, this, tileWidth, tilesBuffer, monsters, daysPassed);
                }
            });

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
                            monsters[monsterKeyA].isColliding = true;
                            this.collidingMonsters[monsterKeyA] = monsters[monsterKeyA];
                        } else if (monsterKeyB && pair.bodyA.id === this.cat.body.id) {
                            monsters[monsterKeyB].isColliding = true;
                            this.collidingMonsters[monsterKeyB] = monsters[monsterKeyB];
                        }
                    }
                });
            });
            if (isAttacking && this.collidingMonsterKey) {
                let attackAnimationKey;
                const attackNumber = this.registry.get('selectedAttackNumber') || 1;
                console.log("attackNumber: ", attackNumber);

                switch (lastDirection) {
                    case 'up':
                        attackAnimationKey = `attack${attackNumber}-back`;
                        break;
                    case 'down':
                        attackAnimationKey = `attack${attackNumber}-front`;
                        break;
                    case 'left':
                    case 'right':
                        attackAnimationKey = `attack${attackNumber}`;
                        break;
                    default:
                        attackAnimationKey = `attack${attackNumber}`;
                        break;
                }
                cat.play(attackAnimationKey, true);
                cat.on('animationcomplete', (animation, frame) => {
                    if (isAttacking) {
                        cat.play('sit');
                        isAttacking = false; // Reset flag
                    }
                }, this);
                updateTargetMonsterKey.call(this);
            } else if (isAttacking && !PlayerState.isDead) {
                let attackAnimationKey;
                const attackNumber = this.registry.get('selectedAttackNumber') || 1;
                switch (lastDirection) {
                    case 'up':
                        attackAnimationKey = `attack${attackNumber}-back`;
                        break;
                    case 'down':
                        attackAnimationKey = `attack${attackNumber}-front`;
                        break;
                    case 'left':
                    case 'right':
                        attackAnimationKey = `attack${attackNumber}`;
                        break;
                    default:
                        attackAnimationKey = `attack${attackNumber}`;
                        break;
                }
                cat.play(attackAnimationKey, true);
                cat.on('animationcomplete', (animation, frame) => {
                    if (isAttacking) {
                        cat.play('sit');
                        isAttacking = false; // set flag to false to indicate attack animation is finished
                    }
                }, this);
            }

            Object.values(monsters).forEach(monster => {
                if (!monster || !monster.sprite || !monster.sprite.active) return;
                const deltaX = Math.abs(monster.sprite.body.positionPrev.x - monster.sprite.body.position.x);
                const deltaY = Math.abs(monster.sprite.body.positionPrev.y - monster.sprite.body.position.y);

                if (deltaX > POSITION_CHANGE_THRESHOLD || deltaY > POSITION_CHANGE_THRESHOLD) {
                    monster.isMoving = true;
                } else {
                    monster.isMoving = false;
                }

                if (cat.x < monster.sprite.x) {
                    // Player is to the left, flip monster to the left
                    monster.sprite.setFlipX(true);
                } else {
                    // Player is to the right, flip monster to the right
                    monster.sprite.setFlipX(false);
                }

                if (monster.currentHealth <= 0) {
                    monster.sprite.play(`${monster.event.monster}_die`, true);
                 } else if (monster.isHurt) {
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
                } else if (monster.isMoving) {
                    monster.sprite.play(`${monster.event.monster}_run`, true);
                } else {
                    // Default animation (idle)
                    monster.sprite.play(`${monster.event.monster}`, true);
                }
            });

            this.gameEvents.update(monsters);
            regenerateEnergy(this); // Assuming 'this' is the scene
            removeFarTiles(cat.x, cat.y, this); // <--- Passing gameEvents here

       
            Object.values(monsters).forEach(monsterObj => {
                // Check if monster object and its essential properties still exist
                if (!monsterObj || !monsterObj.sprite || !monsterObj.sprite.active || !monsterObj.healthBar || !monsterObj.sprite.body) return;

                // If the previousHealth property is not set, initialize it to the current health
                if (!monsterObj.hasOwnProperty('previousHealth')) {
                    monsterObj.previousHealth = monsterObj.currentHealth;
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
                    canAttack = true;
                    PlayerState.isDead = false;
                    this.isFainting = false;
                    PlayerState.energy = 100;
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