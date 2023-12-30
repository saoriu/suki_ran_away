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


export function usePhaserGame(gameRef, isAuthenticated) {
    useEffect(() => {
        if (isAuthenticated) {


            const mainScene = {
                preload,
                create,
                update,
            };

            const config = {
                type: Phaser.AUTO,
                parent: 'phaser-game',
                width: GAME_CONFIG.CAMERA_WIDTH,
                height: GAME_CONFIG.CAMERA_HEIGHT + GAME_CONFIG.UI_HEIGHT,
                fps: {
                    target: 10,
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
            window.game = gameRef.current;

            // Initialize Phaser Game
            let tiles = {};
            const tileWidth = GAME_CONFIG.TILE_WIDTH * GAME_CONFIG.TILE_SCALE;
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
            const POSITION_CHANGE_THRESHOLD = 0.1;

            function create() {
                const camera = this.cameras.main;
                this.scene.launch('UIScene');
                this.inReachofPlayer = {};
                this.monsters = {};
                camera.setSize(GAME_CONFIG.CAMERA_WIDTH, GAME_CONFIG.CAMERA_HEIGHT); // restrict camera size

                cat = this.matter.add.sprite(0, 0, 'sit', null, {
                    isStatic: false,
                    friction: 0,
                }).setScale(GAME_CONFIG.SCALE / 5.7).setCircle((GAME_CONFIG.SCALE / 5.7) * 60).setDepth(5);

                this.cat = cat; // Attach the cat sprite to the scene

                // Adjust the physics properties of the cat
                const catBody = this.cat.body;
                catBody.inertia = Infinity; // Prevent rotation
                catBody.inverseInertia = 0;
                catBody.mass = 1;
                cat.body.friction = 0;
                cat.body.frictionAir = 0;
                cat.setDepth(5)


                this.targetMonsterKey = null;

                createAnims(this);

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
                            if (canAttack) {
                                this.gameEvents.playerAttack(monsters, this.targetMonsterKey);
                                isAttacking = true;
                                canAttack = false;
                                cat.on('animationcomplete', (animation, frame) => {
                                    if (animation.key.startsWith('attack')) {
                                        isAttacking = false;
                                        canAttack = true;
                                    }
                                }, this);
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
            const Matter = Phaser.Physics.Matter.Matter;

            let daysPassed = PlayerState.days; // In-game days
            //emit gametime and days passed

            function createTilesAround(centerX, centerY, scene) {
                const camera = scene.cameras.main;
                const startI = Math.floor((centerX - GAME_CONFIG.CAMERA_WIDTH / 2 - tilesBuffer * tileWidth) / tileWidth);
                const endI = Math.ceil((centerX + GAME_CONFIG.CAMERA_WIDTH / 2 + tilesBuffer * tileWidth) / tileWidth);
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
                            const tile = scene.add.image(i * tileWidth, j * tileWidth, tileKey).setOrigin(0).setScale(GAME_CONFIG.TILE_SCALE);
                            tiles[`${i},${j}`] = tile;
                        }
                    }


                }
                cat.setDepth(3);

                spawnMonsters(centerX, centerY, scene, tileWidth, tilesBuffer, monsters, daysPassed);
            }

            let lastUpdateTime = 0;
            let lastDirection = null; // Variable to store the last direction the cat moved
            let lastPlayerX = 0;
            let lastPlayerY = 0;
            let lastRegenerateEnergyTime = 0; // New variable to track last regenerateEnergy call

            const positionChangeThreshold = 20; // Adjust this value as needed
            let gameTime = 0; // In-game hours

            function handlePlayerMovement() {
                //if player is attacking or fainting velocity is 0
                if (PlayerState.isDead) {
                    cat.setVelocity(0, 0);
                    return;
                }

                let velocityX = 0, velocityY = 0;

                // Only update direction if player is not attacking

                if (cursors.left.isDown && cursors.up.isDown) {
                    // Handle up-left diagonal movement
                    velocityX = -diagonalVelocity;
                    velocityY = -diagonalVelocity;
                    if (!isAttacking) lastDirection = 'upLeft';
                } else if (cursors.right.isDown && cursors.up.isDown) {
                    // Handle up-right diagonal movement
                    velocityX = diagonalVelocity;
                    velocityY = -diagonalVelocity;
                    if (!isAttacking) lastDirection = 'upRight';
                } else if (cursors.left.isDown && cursors.down.isDown) {
                    // Handle down-left diagonal movement
                    velocityX = -diagonalVelocity;
                    velocityY = diagonalVelocity;
                    if (!isAttacking) lastDirection = 'downLeft';
                } else if (cursors.right.isDown && cursors.down.isDown) {
                    // Handle down-right diagonal movement
                    velocityX = diagonalVelocity;
                    velocityY = diagonalVelocity;
                    if (!isAttacking) lastDirection = 'downRight';
                } else if (cursors.left.isDown) {
                    // Handle left movement
                    velocityX = -moveSpeed;
                    if (!isAttacking) lastDirection = 'left';
                } else if (cursors.right.isDown) {
                    // Handle right movement
                    velocityX = moveSpeed;
                    if (!isAttacking) lastDirection = 'right';
                } else if (cursors.up.isDown) {
                    // Handle up movement
                    velocityY = -moveSpeed;
                    if (!isAttacking) lastDirection = 'up';
                } else if (cursors.down.isDown) {
                    // Handle down movement
                    velocityY = moveSpeed;
                    if (!isAttacking) lastDirection = 'down';
                }

                if (isAttacking) {
                    const attackSpeedReductionFactor = 0.3; // Example: reduce speed by 50%
                    velocityX *= attackSpeedReductionFactor;
                    velocityY *= attackSpeedReductionFactor;
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

                if (velocityX === 0 && velocityY === 0 && !isAttacking) {
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
                gameTime += delta / 2000;
                if (gameTime >= 24) {
                    gameTime = 0;
                    PlayerState.days++;
                }

                if (time - lastUpdateTime > 1000) {
                    this.game.events.emit('gameTime', gameTime);
                    this.game.events.emit('daysPassed', PlayerState.days);
                    lastUpdateTime = time;
                }

                updateTooltip.call(this);

                handlePlayerMovement();

                if (time - lastRegenerateEnergyTime > 1000) { // 1000 ms = 1 second
                    regenerateEnergy(this);
                    lastRegenerateEnergyTime = time; // Update last call time
                }

                if (PlayerState.energy <= 0 && !this.isFainting) {
                    handlePlayerDeath.call(this);
                }

                if (Math.abs(cat.x - lastPlayerX) > positionChangeThreshold ||
                    Math.abs(cat.y - lastPlayerY) > positionChangeThreshold) {

                    createTilesAround(cat.x, cat.y, this);
                    lastPlayerX = cat.x;
                    lastPlayerY = cat.y;
                    removeFarTiles(cat.x, cat.y, this);
                }

                // Check if monster is within PlayerState.attackRange
                Object.values(monsters).forEach(monster => {
                    const distance = calculateDistance(cat, monster);
                    if (distance <= PlayerState.attackRange) {
                        monster.inReach = true;
                        this.inReachofPlayer[monster.key] = monster;
                    } else {
                        monster.inReach = false;
                    }
                });

                //Check if player is within monster attack range
                Object.values(monsters).forEach(monster => {
                    const distance = calculateDistance(cat, monster);
                    if (distance <= monster.attackRange) {
                        monster.canReach = true;
                    } else {
                        monster.canReach = false;
                    }
                });

                updateTargetMonsterKey.call(this);

                Object.keys(this.inReachofPlayer).forEach(key => {
                    if (!this.inReachofPlayer[key].inReach) {
                        delete this.inReachofPlayer[key];
                    }
                });

                if (isAttacking && this.targetMonsterKey) {
                    let attackAnimationKey;
                    const attackNumber = this.registry.get('selectedAttackNumber') || 1;

                    switch (lastDirection) {
                        case 'up':
                            attackAnimationKey = `attack${attackNumber}-back`;
                            lastDirection = 'up';
                            break;
                        case 'down':
                            attackAnimationKey = `attack${attackNumber}-front`;
                            lastDirection = 'down';
                            break;
                        case 'left':
                            attackAnimationKey = `attack${attackNumber}`;
                            lastDirection = 'left';
                            break;
                        case 'right':
                            attackAnimationKey = `attack${attackNumber}`;
                            lastDirection = 'right';
                            break;
                        default:
                            attackAnimationKey = `attack${attackNumber}`;
                            break;
                    }
                    cat.play(attackAnimationKey, true);
                } else if (isAttacking && !PlayerState.isDead) {
                    let attackAnimationKey;
                    const attackNumber = this.registry.get('selectedAttackNumber') || 1;
                    switch (lastDirection) {
                        case 'up':
                            attackAnimationKey = `attack${attackNumber}-back`;
                            lastDirection = 'up';
                            break;
                        case 'down':
                            attackAnimationKey = `attack${attackNumber}-front`;
                            lastDirection = 'down';
                            break;
                        case 'left':
                            attackAnimationKey = `attack${attackNumber}`;
                            lastDirection = 'left';
                            break;
                        case 'right':
                            attackAnimationKey = `attack${attackNumber}`;
                            lastDirection = 'right';
                            break;
                        default:
                            attackAnimationKey = `attack${attackNumber}`;
                            break;
                    }
                    cat.play(attackAnimationKey, true);
                }

                //Monster animations
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
                        monster.sprite.setFlipX(true);
                    } else {
                        monster.sprite.setFlipX(false);
                    }

                    if (monster.currentHealth <= 0) {
                        monster.sprite.play(`${monster.event.monster}_die`, true);
                    } else if (monster.isHurt) {
                        monster.sprite.play(`${monster.event.monster}_hurt`, true);
                        monster.sprite.once('animationcomplete', () => {
                            if (monster.sprite && monster.sprite.active) {
                                monster.isHurt = false;
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
                        monster.sprite.play(`${monster.event.monster}`, true);
                    }
                });

                this.gameEvents.update(monsters);


                Object.values(monsters).forEach(monsterObj => {
                    if (!monsterObj || !monsterObj.sprite || !monsterObj.sprite.active || !monsterObj.healthBar || !monsterObj.sprite.body) return;

                    if (!monsterObj.hasOwnProperty('previousHealth')) {
                        monsterObj.previousHealth = monsterObj.currentHealth;
                    }

                    updateHealthBar(this, monsterObj.healthBar, monsterObj.currentHealth, monsterObj.maxHealth);

                    monsterObj.previousHealth = monsterObj.currentHealth;  // Update previousHealth for the next iteration

                    if (monsterObj.sprite) {
                        monsterObj.healthBar.outer.x = monsterObj.sprite.x - 30;
                        monsterObj.healthBar.outer.y = monsterObj.sprite.y + monsterObj.sprite.height + 55;

                        monsterObj.healthBar.fill.x = monsterObj.sprite.x - 28;
                        monsterObj.healthBar.fill.y = monsterObj.sprite.y + monsterObj.sprite.height + 55;
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
                this.inReachofPlayer = {};
                this.targetMonsterKey = null;

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

            function calculateDistance(player, monster) {
                if (!player || !monster || !player.body || !monster.sprite || !monster.sprite.body) {
                    return;
                }

                const playerPosition = player.body.position;
                const monsterPosition = monster.sprite.body.position;

                const distanceX = (playerPosition.x - monsterPosition.x) / tileWidth;
                const distanceY = (playerPosition.y - monsterPosition.y) / tileWidth;
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                const playerRadius = player.body.circleRadius / tileWidth;
                const monsterRadius = monster.sprite.body.circleRadius / tileWidth;
                const calculatedDistance = Math.max(0, distance - (playerRadius + monsterRadius));

                return calculatedDistance;
            }

            function updateTargetMonsterKey() {
                this.targetMonsterKey = null;

                for (const [key, monster] of Object.entries(this.inReachofPlayer)) {
                    if (calculateDistance(cat, monster) <= PlayerState.attackRange && isMonsterInFront(cat, monster, lastDirection)) {
                        this.targetMonsterKey = key;
                        break;
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
            function updateTooltip() {
                const pointer = this.input.activePointer;
                const pointerX = pointer.x; // Use screen coordinates
                const pointerY = pointer.y; // Use screen coordinates
                let isOverMonster = false;
            
                Object.values(monsters).forEach(monster => {
                    if (!monster || !monster.sprite || !monster.sprite.active) return;
            
                    const monsterBody = monster.sprite.body;
            
                    if (monsterBody && Matter.Bounds.contains(monsterBody.bounds, { x: pointer.worldX, y: pointer.worldY })) {
                        if (Matter.Vertices.contains(monsterBody.vertices, { x: pointer.worldX, y: pointer.worldY })) {
                            isOverMonster = true;
            
                            function capitalizeFirstLetter(string) {
                                return string.charAt(0).toUpperCase() + string.slice(1);
                            }

                            let monsterInfo = `${capitalizeFirstLetter(monster.name)}\nLevel ${monster.level}\n${monster.description}`;
                            this.game.events.emit('showTooltip', { text: monsterInfo, x: pointerX, y: pointerY });
                        }
                    }
                });
            
                if (!isOverMonster) {
                    this.game.events.emit('hideTooltip');
                }
            }

            function removeFarTiles(centerX, centerY, scene) {
                const camera = scene.cameras.main;

                const startI = Math.floor((centerX - GAME_CONFIG.CAMERA_WIDTH / 2 - tilesBuffer * tileWidth) / tileWidth);
                const endI = Math.ceil((centerX + GAME_CONFIG.CAMERA_WIDTH / 2 + tilesBuffer * tileWidth) / tileWidth);
                const startJ = Math.floor((centerY - camera.height / 2 - tilesBuffer * tileWidth) / tileWidth);
                const endJ = Math.ceil((centerY + camera.height / 2 + tilesBuffer * tileWidth) / tileWidth);

                Object.keys(tiles).forEach((key) => {
                    const [i, j] = key.split(',').map(Number);
                    if (i < startI || i > endI || j < startJ || j > endJ) {
                        tiles[key].destroy();
                        delete tiles[key];

                        // Check for monsters in these tiles and clean them up
                        Object.values(monsters).forEach(monster => {
                            if (monster.sprite && monster.sprite.active) {
                                const monsterTileI = Math.floor(monster.sprite.x / tileWidth);
                                const monsterTileJ = Math.floor(monster.sprite.y / tileWidth);
                                if (monsterTileI === i && monsterTileJ === j) {
                                    scene.gameEvents.cleanUpMonster(monster);
                                }
                            }
                        });
                    }
                });
            }

            return () => {
                // Clean up Phaser Game Instance
                gameRef.current?.destroy(true);
                gameRef.current = null;
            };
        }
    }, [gameRef, isAuthenticated]);
    return gameRef.current;
}