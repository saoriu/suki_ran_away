import Phaser from 'phaser';
import { spawnMonsters } from './spawnMonsters';
import { spawnMonsterTree } from './spawnMonsterTree';
import { spawnMonsterBush } from './spawnMonsterBush';
import { PlayerState } from './playerState';
import { GAME_CONFIG } from './gameConstants.js';
import { GameEvents } from './GameEvents';
import { regenerateEnergy } from './Energy';
import * as Inventory from './Inventory';
import { createAnims } from './createAnims';
import { attacks } from './attacks';
import { Item } from './Item';
import { itemInfo } from './itemInfo.js';
import chroma from 'chroma-js';


export class mainScene extends Phaser.Scene {

    _emitMonsterBattleUpdate(monsterLevel, playerEnergy,) {
        this.game.events.emit('monsterBattleUpdate', {
            monsterLevel,
            petEnergy: playerEnergy,

        });
        this.game.events.emit('energyChanged');
    }
    constructor() {
        super({ key: 'mainScene' });
        this.tiles = {};
        this.allEntities = [];
        this.isDashing = false;
        this.ashes = [];
        this.tileWidth = GAME_CONFIG.TILE_WIDTH;
        this.cat = null; // Will be set in create()
        this.cursors = null; // Will be set in create()
        this.monsters = {};
        this.tilesBuffer = GAME_CONFIG.TILES_BUFFER;
        this.moveSpeed = PlayerState.speed;
        this.diagonalVelocity = this.moveSpeed / Math.sqrt(2);
        this.canAttack = true;
        this.attackAnimationKey = null; // Will be set when needed
        this.POSITION_CHANGE_THRESHOLD = 0.05;
        this.Matter = Phaser.Physics.Matter.Matter; // Ensure Matter is correctly imported/referenced
        this.lastUpdateTime = 0;
        this.lastSpawnTime2 = 0;
        this.lastDirection = null;
        this.lastPlayerX = 0;
        this.lastPlayerY = 0;
        this.newlastPlayerX = 0;
        this.newlastPlayerY = 0;
        this.tree = [];
        this.trees = [];
        this.fire = [];
        this.fires = [];
        this.tilePool = [];
        this.ponds = [];
        this.pond = [];
        this.bush1s = [];
        this.bush1 = [];
        this.lastRegenerateEnergyTime = 0;
        this.positionChangeThreshold = 0.05 * this.tileWidth;
        this.newpositionChangeThreshold = 1 * this.tileWidth;
        this.intersections = [];
        this.slices = [];
        this.graphics = null;


    }

    create() {
        const camera = this.cameras.main;
        this.lights.enable();
        this.scene.launch('UIScene');
        this.monsters = {};
        camera.setSize(GAME_CONFIG.CAMERA_WIDTH, GAME_CONFIG.CAMERA_HEIGHT); // restrict camera size

        this.cat = this.matter.add.sprite(0, 0, 'sit', null, {
            isStatic: false,
            friction: 0,
        }).setScale(1).setCircle((1) * 42).setDepth(5)

        // Adjust the physics properties of the this.cat
        const catBody = this.cat.body;
        catBody.inertia = Infinity; // Prevent rotation
        catBody.inverseInertia = 0;
        catBody.mass = 1;
        this.cat.body.friction = 0;
        this.cat.body.frictionAir = 0;
        this.cat.setPipeline('Light2D');
        catBody.label = 'player';
        this.postFxPlugin = this.plugins.get('rexoutlinepipelineplugin');

        this.catShadow = this.add.sprite(0, 0, 'sit');
        this.catShadow.setTint(0x000000); // Color the shadow sprite black
        this.catShadow.alpha = 0.2; // Make the shadow sprite semi-transparent
        this.catShadow.setPipeline('Light2D');
        this.catShadow.depth = 1; // Position the shadow sprite behind the original sprite
        //set to multiply blend mode
        this.catShadow.setBlendMode(Phaser.BlendModes.MULTIPLY);

        this.targetMonsterKey = null;

        createAnims(this);


        this.input.on('pointermove', () => {
            this.game.events.emit('hideTooltip');
        });


        this.maxInventorySize = 11; // Or whatever your max inventory size is
        this.items = []; // Initialize the items array

        camera.startFollow(this.cat);
        this.gameEvents = new GameEvents(this, this.cat);
        this.createTilesAround(0, 0, this);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.handleItemPickup = Inventory.handleItemPickup.bind(this);
        this.addToInventory = Inventory.addToInventory.bind(this);

        this.game.events.on('gameTime', (gameTime) => {
            this.updateTimeCircle(gameTime);
        });

        this.matter.world.on('collisionactive', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;

                const isMonster = bodyA.label === 'monster' || bodyB.label === 'monster';
                const isTree = bodyA.parent.label === 'tree' || bodyB.parent.label === 'tree';
                const isPond = bodyA.parent.label === 'pond' || bodyB.parent.label === 'pond';
                const isBush1 = bodyA.parent.label === 'bush1' || bodyB.parent.label === 'bush1';

                //if monster colliding with tree
                if (isMonster && isTree) {
                    let monsterBody = bodyA.label === 'monster' ? bodyA : bodyB;
                    let treeBody = bodyA.parent.label === 'tree' ? bodyA.parent : bodyB.parent;

                    if (monsterBody && treeBody) {
                        let targetMonster = Object.values(this.monsters).find(m => m.sprite && m.sprite.body && m.sprite.body.id === monsterBody.id);

                        if (targetMonster && targetMonster.tween) {
                            targetMonster.tween.stop();
                        }
                    }
                }

                //if monster colliding with pond
                if (isMonster && isPond) {
                    let monsterBody = bodyA.label === 'monster' ? bodyA : bodyB;
                    let pondBody = bodyA.parent.label === 'pond' ? bodyA.parent : bodyB.parent;

                    if (monsterBody && pondBody) {
                        let targetMonster = Object.values(this.monsters).find(m => m.sprite && m.sprite.body && m.sprite.body.id === monsterBody.id);

                        if (targetMonster && targetMonster.tween) {
                            targetMonster.tween.stop();
                        }
                    }
                }

                //if monster colliding with bush1
                if (isMonster && isBush1) {
                    let monsterBody = bodyA.label === 'monster' ? bodyA : bodyB;
                    let bush1Body = bodyA.parent.label === 'bush1' ? bodyA.parent : bodyB.parent;

                    if (monsterBody && bush1Body) {
                        let targetMonster = Object.values(this.monsters).find(m => m.sprite && m.sprite.body && m.sprite.body.id === monsterBody.id);

                        if (targetMonster && targetMonster.tween) {
                            targetMonster.tween.stop();
                        }
                    }
                }
            });
        });

        this.matter.world.on('collisionactive', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;

                const isPlayer = bodyA.label === 'player' || bodyB.label === 'player';
                const isTree = bodyA.parent.label === 'tree' || bodyB.parent.label === 'tree';
                const isPond = bodyA.parent.label === 'pond' || bodyB.parent.label === 'pond';
                const isBush1 = bodyA.parent.label === 'bush1' || bodyB.parent.label === 'bush1';

                if (isPlayer && (isTree || isPond || isBush1)) {
                    let playerBody = bodyA.label === 'player' ? bodyA : bodyB;

                    if (playerBody) {
                        PlayerState.isBeingKnockedBack = true;
                        if (this.player && this.player.tween) {
                            this.player.tween.stop();
                        }
                    }
                }
            });
        });

        this.matter.world.on('collisionend', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;

                const isPlayer = bodyA.label === 'player' || bodyB.label === 'player';
                const isTree = bodyA.parent.label === 'tree' || bodyB.parent.label === 'tree';
                const isPond = bodyA.parent.label === 'pond' || bodyB.parent.label === 'pond';
                const isBush1 = bodyA.parent.label === 'bush1' || bodyB.parent.label === 'bush1';

                if (isPlayer && (isTree || isPond || isBush1)) {
                    let playerBody = bodyA.label === 'player' ? bodyA : bodyB;

                    if (playerBody) {
                        PlayerState.isBeingKnockedBack = false;
                    }
                }
            });
        });


        this.matter.world.on('collisionactive', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;

                const isPlayer = bodyA.label === 'player' || bodyB.label === 'player';
                const isTree = bodyA.parent.label === 'tree' || bodyB.parent.label === 'tree';

                if (isPlayer && isTree) {
                    let treeBody = bodyA.parent.label === 'tree' ? bodyA.parent : bodyB.parent;

                    if (treeBody) {
                        this.collidingWithTree = true;
                        this.collidingTree = treeBody.gameObject; // Store the tree GameObject
                    }
                }
            });
        });

        this.matter.world.on('collisionend', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;

                const isPlayer = bodyA.label === 'player' || bodyB.label === 'player';
                const isTree = bodyA.parent.label === 'tree' || bodyB.parent.label === 'tree';

                if (isPlayer && isTree) {
                    let treeBody = bodyA.parent.label === 'tree' ? bodyA.parent : bodyB.parent;

                    if (treeBody.gameObject === this.collidingTree) {
                        this.collidingWithTree = false;
                        this.collidingTree = null;
                    }
                }
            });
        });

        this.matter.world.on('collisionactive', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;

                const isPlayer = bodyA.label === 'player' || bodyB.label === 'player';
                const isBush1 = bodyA.parent.label === 'bush1' || bodyB.parent.label === 'bush1';

                if (isPlayer && isBush1) {
                    let bush1Body = bodyA.parent.label === 'bush1' ? bodyA.parent : bodyB.parent;

                    if (bush1Body) {
                        this.collidingWithBush1 = true;
                        this.collidingBush1 = bush1Body.gameObject; // Store the tree GameObject
                    }
                }
            });
        });

        this.matter.world.on('collisionend', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;

                const isPlayer = bodyA.label === 'player' || bodyB.label === 'player';
                const isBush1 = bodyA.parent.label === 'bush1' || bodyB.parent.label === 'bush1';

                if (isPlayer && isBush1) {
                    let bush1Body = bodyA.parent.label === 'bush1' ? bodyA.parent : bodyB.parent;

                    if (bush1Body.gameObject === this.collidingBush1) {
                        this.collidingWithBush1 = false;
                        this.collidingBush1 = null;
                    }
                }
            });
        });


        this.game.events.emit('gameTime', PlayerState.gameTime);
        this.game.events.emit('daysPassed', PlayerState.days);

        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.collidingWithTree && this.canAttack) {
                this.chopTree(this.collidingTree);
            }
            if (this.collidingBush1 && this.canAttack) {
                this.searchBush1(this.collidingBush1);
            }
        });

        this.input.keyboard.on('keydown', (event) => {
            if (!this.isFainting && this.canAttack) {
                let attackName;

                switch (event.code) {
                    case 'KeyZ':
                        attackName = PlayerState.selectedAttacks[1] || 'scratch';
                        break;
                    case 'KeyX':
                        attackName = PlayerState.selectedAttacks[2] || 'scratch';
                        break;
                    case 'KeyC':
                        attackName = PlayerState.selectedAttacks[3] || 'scratch';
                        break;
                    case 'Space':
                        attackName = 'scratch';
                        this.handleItemPickup(this.cat);
                        break;
                    default:
                        return; // Exit the function if a non-attack key is pressed
                }

                if (this.canAttack && attackName !== undefined && !PlayerState.isEating) {

                    this.updateTargetMonsterKey(attackName);

                    this.gameEvents.playerAttack(this.monsters, this.targetMonsterKey, attackName, this.allEntities);
                    PlayerState.isAttacking = true;
                    this.canAttack = false;
                    // Determine the attack animation based on direction
                    let attackNumber = attacks[attackName].attack;
                    if (attackNumber === 6) { // Replace with your specific attack name for the projectile
                        let targetMonster = this.monsters[this.targetMonsterKey];
                        if (targetMonster) {
                            this.launchProjectile(targetMonster);
                        }
                    }

                    switch (this.lastDirection) {
                        case 'up':
                            this.attackAnimationKey = `attack${attackNumber}-back`;
                            this.lastDirection = 'up';
                            break;
                        case 'down':
                            this.attackAnimationKey = `attack${attackNumber}-front`;
                            this.lastDirection = 'down';
                            break;
                        case 'left':
                            this.attackAnimationKey = `attack${attackNumber}`;
                            this.lastDirection = 'left';
                            break;
                        case 'right':
                            this.attackAnimationKey = `attack${attackNumber}`;
                            this.lastDirection = 'right';
                            break;
                        case 'upLeft':
                            this.attackAnimationKey = `attack${attackNumber}`;
                            this.lastDirection = 'upLeft';
                            break;
                        case 'upRight':
                            this.attackAnimationKey = `attack${attackNumber}`;
                            this.lastDirection = 'upRight';
                            break;
                        case 'downLeft':
                            this.attackAnimationKey = `attack${attackNumber}`;
                            this.lastDirection = 'downLeft';
                            break;
                        case 'downRight':
                            this.attackAnimationKey = `attack${attackNumber}`;
                            this.lastDirection = 'downRight';
                            break;
                        default:
                            this.attackAnimationKey = `attack${attackNumber}`;
                            break;
                    }

                    // Start the new animation
                    this.cat.play(this.attackAnimationKey, true);
                    this.catShadow.play(this.attackAnimationKey, true);
                }
            }
        });

        let lastPressTime = 0;
        let lastDashTime = 0;
        const doubleTapThreshold = 300;
        const dashThreshold = 800; // 300 ms

        this.input.keyboard.on('keydown-SPACE', () => {
            let currentTime = new Date().getTime();
            if (currentTime - lastPressTime < doubleTapThreshold && (catBody.velocity.x !== 0 || catBody.velocity.y !== 0)) {
                if (currentTime - lastDashTime > dashThreshold) {
                    this.isDashing = true;
                    lastDashTime = currentTime; // update last dash time

                    let attackName = 'roll';

                    this.updateTargetMonsterKey(attackName);

                    this.gameEvents.playerAttack(this.monsters, this.targetMonsterKey, attackName);
                    PlayerState.isAttacking = true;
                    this.canAttack = false;
                }
            }
            lastPressTime = currentTime;
        });

        this.allEntities.push(this.cat);

        this.cat.on('animationcomplete', (animation, frame) => {
            if (animation.key === this.attackAnimationKey) {
                PlayerState.isAttacking = false;
                this.canAttack = true;
            }
        }, this);

        this.input.on('pointerdown', (pointer) => {
            Object.values(this.monsters).forEach(monster => {
                if (monster && monster.sprite && monster.sprite.active) {
                    const monsterBody = monster.sprite.body;
                    if (monsterBody && this.Matter.Bounds.contains(monsterBody.bounds, { x: pointer.worldX, y: pointer.worldY })) {
                        // Clear tint from previously clicked monster
                        if (this.lastClickedMonsterKey && this.monsters[this.lastClickedMonsterKey]) {
                            this.postFxPlugin.remove(this.monsters[this.lastClickedMonsterKey].sprite);
                        }
                        this.lastClickedMonsterKey = monster.key;
                        if (monster.sprite.body) {
                            this.postFxPlugin.add(monster.sprite, {
                                thickness: 1,
                                outlineColor: 0xff8a50
                            });

                            // Cascade 2nd outline
                            this.postFxPlugin.add(monster.sprite, {
                                thickness: 2,
                                outlineColor: 0xc41c00
                            });
                        }
                    }
                }
            });
        });
    }

    update(time, delta) {
        PlayerState.gameTime += delta / 20000;
        if (PlayerState.gameTime >= 24) {
            PlayerState.gameTime = 0;
            PlayerState.days++;
            this.game.events.emit('daysPassed', PlayerState.days);
        }

        this.game.events.emit('gameTime', PlayerState.gameTime);

        if (time - this.lastSpawnTime2 > 30000) {
            this.spawnMonstersOnly(this.cat.x, this.cat.y, this);
            this.lastSpawnTime2 = time;
        }

        this.updateTooltip.call(this);

        this.handlePlayerMovement();

        if (time - this.lastRegenerateEnergyTime > 1000) { // 1000 ms = 1 second
            regenerateEnergy(this);
            this.game.events.emit('energyChanged');

            this.lastRegenerateEnergyTime = time; // Update last call time
        }

        if (PlayerState.energy <= 0 && !this.isFainting) {
            this.handlePlayerDeath.call(this);
        }


        if (Math.abs(this.cat.x - this.lastPlayerX) > this.positionChangeThreshold ||
            Math.abs(this.cat.y - this.lastPlayerY) > this.positionChangeThreshold) {
            this.createTilesAround(this.cat.x, this.cat.y, this);
            this.lastPlayerX = this.cat.x;
            this.lastPlayerY = this.cat.y;
            this.removeFarTiles(this.cat.x, this.cat.y, this);
        }

        if (Math.abs(this.cat.x - this.newlastPlayerX) > this.newpositionChangeThreshold ||
            Math.abs(this.cat.y - this.newlastPlayerY) > this.newpositionChangeThreshold) {
            this.spawnMonstersFire(this.cat.x, this.cat.y, this);
            this.newlastPlayerX = this.cat.x;
            this.newlastPlayerY = this.cat.y;
        }

        Object.values(this.monsters).forEach(monster => {
            if (!monster || !monster.sprite || !monster.sprite.active) return;

            const distance = this.calculateDistance(this.cat, monster);
            const playerOnRight = this.cat.x > monster.sprite.x;
            const playerOnLeft = this.cat.x < monster.sprite.x;


            if (distance <= monster.attackRange && ((monster.monsterFacingRight && playerOnRight) || (!monster.monsterFacingRight && playerOnLeft))) {
                monster.canReach = true;
            } else {
                monster.canReach = false;
            }
        });
        if (PlayerState.isAttacking && this.targetMonsterKey) {
            this.cat.flipX = (this.lastDirection === 'left' || this.lastDirection === 'upLeft' || this.lastDirection === 'downLeft');
            this.catShadow.flipX = (this.lastDirection === 'left' || this.lastDirection === 'upLeft' || this.lastDirection === 'downLeft');

        }

        else if (PlayerState.isAttacking && !PlayerState.isDead) {
            this.cat.flipX = (this.lastDirection === 'left' || this.lastDirection === 'upLeft' || this.lastDirection === 'downLeft');
            this.catShadow.flipX = (this.lastDirection === 'left' || this.lastDirection === 'upLeft' || this.lastDirection === 'downLeft');
        }

        let treesCopy = [...this.trees];
        treesCopy.forEach((tree) => {
            if (tree && tree.active && !tree.isDepleted) {
                let catBounds = this.cat.getBounds();
                let treeBounds = tree.getBounds();

                // Check if the cat's x-coordinate is within the tree's x-coordinates
                let isXOverlapping = this.cat.x - 30 >= treeBounds.left && this.cat.x + 30 <= treeBounds.right;
                let isYOverlapping = this.cat.y >= treeBounds.top && this.cat.y <= treeBounds.bottom;

                if (Phaser.Geom.Intersects.RectangleToRectangle(catBounds, treeBounds) && isXOverlapping && isYOverlapping) {
                    if (this.cat.y + 90 < tree.y) {

                        tree.setAlpha(0.4);
                        tree.shadow.setAlpha(0);
                    } else {
                        tree.setAlpha(1);
                        tree.shadow.setAlpha(this.getAlphaFromTime(PlayerState.gameTime));
                    }
                } else {
                    tree.setAlpha(1);
                    tree.shadow.setAlpha(this.getAlphaFromTime(PlayerState.gameTime));
                }
            }
        });

        //Monster animations here
        Object.values(this.monsters).forEach(monster => {
            if (!monster || !monster.sprite || !monster.sprite.active) return;
            const deltaX = Math.abs(monster.sprite.body.positionPrev.x - monster.sprite.body.position.x);
            const deltaY = Math.abs(monster.sprite.body.positionPrev.y - monster.sprite.body.position.y);


            if (deltaX > this.POSITION_CHANGE_THRESHOLD || deltaY > this.POSITION_CHANGE_THRESHOLD) {
                monster.isMoving = true;
            } else {
                monster.isMoving = false;
            }


            if (monster.currentHealth <= 0) {
                monster.sprite.play(`${monster.event.monster}_die`, true);
                monster.monsterShadow.play(`${monster.event.monster}_die`, true);
                this.allEntities = this.allEntities.filter(entity => entity !== monster.sprite);
            } else if (monster.isTweening) {
                monster.sprite.play(`${monster.event.monster}_fall`, true);
                monster.monsterShadow.play(`${monster.event.monster}_fall`, true);
            } else if (monster.isHurt) {
                monster.sprite.play(`${monster.event.monster}_hurt`, true);
                monster.monsterShadow.play(`${monster.event.monster}_hurt`, true);
                monster.sprite.once('animationcomplete', () => {
                    if (monster.sprite && monster.sprite.active) {
                        monster.isHurt = false;
                        monster.sprite.play(`${monster.event.monster}`, true);
                        monster.monsterShadow.play(`${monster.event.monster}`, true);
                    }
                }, this);
            } else if (monster.isAttacking && monster.canReach && monster.attackComplete) {
                monster.attackComplete = false;
                this.gameEvents.monsterAttack(this.monsters, monster.key);
                monster.sprite.play(`${monster.event.monster}_attack`, true);
                monster.monsterShadow.play(`${monster.event.monster}_attack`, true);

                monster.sprite.once('animationcomplete', (animation) => {
                    if (animation.key === `${monster.event.monster}_attack`) {
                        monster.isAttacking = false;
                    }
                }, this);
            } else if (monster.isMoving && !monster.sprite.anims.isPlaying) {
                monster.sprite.play(`${monster.event.monster}_run`, true);
                monster.monsterShadow.play(`${monster.event.monster}_run`, true);
            } else if (!monster.sprite.anims.isPlaying) {
                monster.sprite.play(`${monster.event.monster}`, true);
                monster.monsterShadow.play(`${monster.event.monster}`, true);
            }
        });

        this.gameEvents.update(this.monsters, this.allEntities);


        Object.values(this.monsters).forEach(monsterObj => {
            if (!monsterObj || !monsterObj.sprite || !monsterObj.sprite.active || !monsterObj.healthBar) return;

            if (!monsterObj.hasOwnProperty('previousHealth')) {
                monsterObj.previousHealth = monsterObj.currentHealth;
            }

            this.updateHealthBar(this, monsterObj.healthBar, monsterObj.currentHealth, monsterObj.maxHealth);

            monsterObj.previousHealth = monsterObj.currentHealth;  // Update previousHealth for the next iteration

            if (monsterObj.sprite) {
                const healthBarWidth = monsterObj.healthBar.outer.width;

                monsterObj.healthBar.outer.x = monsterObj.sprite.x - healthBarWidth / 2;
                monsterObj.healthBar.outer.y = monsterObj.sprite.y + monsterObj.sprite.height / 2 + 30;

                monsterObj.healthBar.fill.x = monsterObj.sprite.x - healthBarWidth / 2;
                monsterObj.healthBar.fill.y = monsterObj.sprite.y + monsterObj.sprite.height / 2 + 30;
            }
        });
        if (this.targetMonsterKey) {
            const monster = this.monsters[this.targetMonsterKey];
            if (monster && !this.isMonsterAttackable(monster)) {
                this.targetMonsterKey = null;
            }
        }



        if (this.lastClickedMonsterKey) {
            const monster = this.monsters[this.lastClickedMonsterKey];
            if (monster && this.isMonsterAttackable(monster)) {
                this.targetMonsterKey = this.lastClickedMonsterKey;
            }
        }

        this.fires.forEach((fire) => {
            if (fire && fire.active) {
                const fireBody = fire.body;

                const fireCenterX = fireBody.position.x;
                const fireCenterY = fireBody.position.y;

                const dx = this.cat.x - fireCenterX;
                const dy = this.cat.y - fireCenterY;
                const distanceInTiles = Math.sqrt(dx * dx + dy * dy) / this.tileWidth;

                if (distanceInTiles <= 1.1) {
                    this.fireAttack(fire);
                }

                this.isNearFire(fire);
            }
        });
        // Step 1: Calculate all depths
        this.allEntities.forEach((entity) => {
            if (entity.label === 'log') {
                let treeDepth = entity.parentTree.depth;
                entity.setDepth(treeDepth);
            } else if (entity.label === 'fruit') {
                let bushDepth = entity.parentBush.depth;
                entity.setDepth(bushDepth);
            } else if (entity.label === 'treeShadow') {
                if (entity.depth === null) {
                    entity.setDepth(1);
                } else {
                    entity.setDepth((entity.y - 20) / 10);
                }
            }
            else if (entity.label === 'bush1Shadow') {
                //bush1 shadow depth should be less than the bush1 depth
                if (entity.depth === null) {
                    entity.setDepth(1);
                } else {
                    entity.setDepth((entity.y - 20) / 10);
                }
            }
            if (entity.body) {
                if (entity.y === null) {
                    entity.setDepth(2);
                } else {
                    if (entity.body.label === 'player' || entity.body.label === 'monster') {
                        if (entity.depth === null) {
                            entity.setDepth(1);
                        } else {
                            entity.setDepth((entity.y + 40) / 10);
                        }
                    } else if (entity.body.label === 'pond') {
                        entity.setDepth((entity.y - 250) / 10);
                    } else {
                        if (entity.depth === null) {
                            entity.setDepth(1);
                        } else { //trees and other entities
                            entity.setDepth(entity.y / 10);
                        }
                    }
                }
            }
        });


        // Step 2: Find the minimum depth
        let minDepth = Math.min(...this.allEntities.map(entity => entity.depth));

        // Step 3: If the minimum depth is less than 0, add its absolute value to all depths
        if (minDepth < 0) {
            this.allEntities.forEach((entity) => {
                entity.setDepth(entity.depth + Math.abs(minDepth));
            });
        }

        // Step 4: If the depth is 0, set it to 1
        this.allEntities.forEach((entity) => {
            if (entity.depth === 0) {
                entity.setDepth(1);
            }
        });

        Object.values(this.monsters).forEach(monster => {
            if (!monster.sprite || !monster.sprite.body) {
                return;
            }

            this.fires.forEach(fire => {
                if (!fire || !fire.active) {
                    return;
                }

                // Use the fire's body position to get the center of the sprite
                const fireCenterX = fire.body.position.x;
                const fireCenterY = fire.body.position.y;

                const dx = monster.sprite.body.position.x - fireCenterX;
                const dy = monster.sprite.body.position.y - fireCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy) / this.tileWidth;

                // Only set monster to unaggressive if it's not immune to fire
                if (distance <= 5 && !monster.immuneToFire) {
                    monster.isAggressive = false;
                }
            });
        });
    }



    fireAttack(fire) {
        if (this.scene.isFainting) return; // Skip if player is dead

        const attackCooldown = 300; // .3 second in milliseconds
        const currentTime = Date.now();

        if (currentTime - fire.lastAttackTime < attackCooldown) {
            return; // Skip the attack if the cooldown has not elapsed
        }

        fire.lastAttackTime = currentTime;

        PlayerState.lastEnergyUpdate = Date.now();

        const fireDamage = Phaser.Math.Between(1, 10); // Fire damage is a random number between 1 and 5
        const fireRoll = Phaser.Math.Between(1, fireDamage); // Ensure fireRoll is at least 1
        fire.isAttacking = true;
        let monsterRoll = fireRoll;
        let monsterLevel = 1;

        if (PlayerState.energy > 0) {
            PlayerState.isUnderAttack = true;
            PlayerState.energy -= fireRoll;
            this._emitMonsterBattleUpdate(monsterLevel, PlayerState.energy, monsterRoll);
            PlayerState.lastDamageTime = Date.now();

            if (fireRoll > 0) {
                PlayerState.isHurt = true;
            }


            if (PlayerState.energy <= 0) {
                PlayerState.energy = 0;
            }
        }

        PlayerState.isUnderAttack = false;

    }

    // Set a flag in PlayerState when player is near fire
    isNearFire() {
        PlayerState.isNearFire = false; // Reset the flag

        this.fires.forEach((fire, index) => {
            if (fire && fire.active) {
                // Use the fire's body position to get the center of the sprite
                const fireCenterX = fire.body.position.x;
                const fireCenterY = fire.body.position.y;

                const dx = this.cat.x - fireCenterX;
                const dy = this.cat.y - fireCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy) / this.tileWidth;


                if (distance <= 2) {
                    PlayerState.isNearFire = true;
                    return; // Exit the loop as soon as we find a fire the player is near
                }
            }
        });
    }

    spawnMonstersOnly(centerX, centerY, scene) {

        const spawnProbability = this.calculateSpawnProbability();

        const randomFloat = Phaser.Math.FloatBetween(0, 1);

        if (randomFloat < spawnProbability) {
            spawnMonsters(centerX, centerY, scene, this.tileWidth, this.tilesBuffer, this.monsters, this.allEntities);
        }
    }

    chopTree(tree) {
        if (!tree || tree.isDepleted) {
            return;
        }

        if (!this.isObjectInFront(this.cat, tree, this.lastDirection)) {
            return;
        }

        if (this.cat.y + 90 > tree.y) {

        this.postFxPlugin.add(tree, {
            thickness: 2,
            outlineColor: 0xffff99
        });

        // Cascade 2nd outline
        this.postFxPlugin.add(tree, {
            thickness: 4,
            outlineColor: 0xeeeeee
        });

        

        // Remove the tint after 1 second
        setTimeout(() => {
            this.postFxPlugin.remove(tree);

        }, 200);
    }
        // Decide to drop a log, deplete the tree, or spawn a monster
        let randomValue = Math.random();

        // Calculating the probability of dropping a log, including the treesBonus.
        const logDropProbability = 0.75 + PlayerState.treesBonus / 100;
        // Logic for dropping a log
        const randomX = tree.x + 25 + Math.random() * -75;
        const randomY = tree.y - 50 + Math.random() * 20;

        if (randomValue < logDropProbability) {
            this.dropLog(randomX, randomY, tree); // Add 'tree' as an argument
        } else {
            // Calculate the remaining probability after considering the log drop.
            const remainingProbability = 1 - logDropProbability;
            // Split the remaining probability into 3 parts, 2 parts for depleting and 1 part for monster spawning.
            const depleteProbability = remainingProbability * (3 / 4);
            // Adjust the check for depleting to take into account the logDropProbability
            if (randomValue < logDropProbability + depleteProbability) {
                // Logic for tree depleting
                tree.isDepleted = true;
                tree.alpha = 1;
                tree.shadow.destroy();
                tree.clearTint();
                tree.anims.stop();

                switch (tree.originalType) {
                    case 'tree_1':
                        tree.setTexture('tree-down');
                        break;
                    case 'tree_2':
                        tree.setTexture('tree2-down');
                        break;
                    case 'tree_3':
                        tree.setTexture('tree3-down');
                        break;
                    default:
                        console.error('Unknown tree type: ' + tree.originalType);
                        break;
                }

                setTimeout(() => {
                    if (tree.active) {
                        tree.setTexture(tree.originalType);
                        tree.isDepleted = false;
                        const treeShadow = this.add.sprite(tree.x, tree.y - 10, tree.originalType);

                        treeShadow.setOrigin(0.5, 0.85);
                        treeShadow.setTint(0x000000); // Color the shadow sprite black
                        treeShadow.setPipeline('Light2D');
                        treeShadow.label = 'treeShadow';
                        treeShadow.parentTree = tree;
                        treeShadow.setBlendMode(Phaser.BlendModes.MULTIPLY); // Set the blend mode to 'multiply'

                        tree.shadow = treeShadow; // Store the shadow sprite as a property of the tree
                        tree.play(tree.originalType);
                        treeShadow.play(tree.originalType);
                    }
                }, 10000);
            } else {
                spawnMonsterTree(tree.x, tree.y, this, this.tileWidth, this.monsters, this.allEntities);
            }
        }

    }


    dropLog(x, y, tree) {
        const log = new Item(this, x, y, 'log', {
            name: 'log',
            quantity: 1,
            effects: {} // Replace with actual effects if any
        });

        log.sprite.label = 'log';
        log.sprite.parentTree = tree; // Add this line

        this.add.existing(log);

        // Show the log and then start the tween
        log.show();

        // Add the log to allEntities as it is dropping
        this.allEntities.push(log.sprite);

        // Create a tween that moves the log downwards
        this.tweens.add({
            targets: log.sprite, // Make sure to target the sprite
            y: y + 150, // Change this value to control how far the log drops
            duration: 1000, // Change this value to control how fast the log drops
            ease: 'Phaser.Math.Easing.Quadratic.In', // Add this line            
            onComplete: () => {
                // Push the log to the items array after the tween completes
                this.items.push(log);

                // Remove the log from allEntities once it drops
                this.allEntities = this.allEntities.filter(entity => entity !== log.sprite);

                log.sprite.setDepth(0);
            }
        });
    }

    searchBush1(bush1) {
        if (!bush1 || bush1.isDepleted) {
            return;
        }

        // Check if the bush1 is in front of the player
        if (!this.isObjectInFront(this.cat, bush1, this.lastDirection)) {
            return;
        }

        this.postFxPlugin.add(bush1, {
            thickness: 2,
            outlineColor: 0xffff99
        });

        // Cascade 2nd outline
        this.postFxPlugin.add(bush1, {
            thickness: 4,
            outlineColor: 0xeeeeee
        });
        setTimeout(() => {
            this.postFxPlugin.remove(bush1);

        }, 200);

        // Decide to drop a berry, deplete the bush1, or spawn a monster
        let randomValue = Math.random();

        // Calculating the probability of dropping a berry, including the treesBonus.
        const berryDropProbability = 0.75 + PlayerState.treesBonus / 100;
        // Logic for dropping a berry
        const randomX = bush1.x + 100 + Math.random() * 25;
        const randomY = bush1.y + 10 + Math.random() * 20;

        if (randomValue < berryDropProbability) {
            this.dropStrawberry(randomX, randomY, bush1);
        } else {
            // Calculate the remaining probability after considering the berry drop.
            const remainingProbability = 1 - berryDropProbability;
            // Split the remaining probability into 3 parts, 2 parts for depleting and 1 part for monster spawning.
            const depleteProbability = remainingProbability * (3 / 4);
            // Adjust the check for depleting to take into account the berryDropProbability
            if (randomValue < berryDropProbability + depleteProbability) {
                // Logic for bush1 depleting
                bush1.isDepleted = true;
                bush1.clearTint();
                bush1.shadow.destroy();
                bush1.setTexture('bush1-down');
                bush1.anims.stop();

                setTimeout(() => {
                    if (bush1.active) {
                        bush1.setTexture('bush1');
                        bush1.isDepleted = false;

                        const bush1Shadow = this.add.sprite(bush1.x, bush1.y, 'bush1');

                        bush1Shadow.setOrigin(0.5, 0.6);
                        bush1Shadow.setTint(0x000000); // Color the shadow sprite black
                        bush1Shadow.setPipeline('Light2D');
                        bush1Shadow.label = 'bush1Shadow';
                        bush1Shadow.parentBush1 = bush1;
                        bush1Shadow.setBlendMode(Phaser.BlendModes.MULTIPLY); // Set the blend mode to 'multiply'

                        bush1.shadow = bush1Shadow; // Store the shadow sprite as a property of the tree

                        bush1Shadow.play('bush1');
                        bush1.play('bush1');
                    }
                }, 15000);
            } else {
                spawnMonsterBush(bush1.x, bush1.y, this, this.tileWidth, this.monsters, this.allEntities);
            }
        }
    }

    dropStrawberry(x, y, bush1) {
        const randomNumber = Math.random();
        let fruitName, fruitKey;

        if (randomNumber <= 0.7) {
            fruitName = 'Strawberry';
            fruitKey = 'strawberry';
        } else {
            fruitName = 'Blueberry';
            fruitKey = 'blueberry';
        }

        const fruitInfo = itemInfo[fruitName];
        const item = {
            name: fruitName,
            quantity: 1,
            effects: fruitInfo
        };

        const fruit = new Item(this, x - 100, y, fruitKey, item);

        fruit.sprite.label = 'fruit';
        fruit.sprite.parentBush = bush1; // Add this line

        this.allEntities.push(fruit.sprite);

        // Add the fruit to the scene
        this.add.existing(fruit);

        // Show the fruit and then start the tween
        fruit.show();

        // Create a tween that moves the fruit downwards
        this.tweens.add({
            targets: fruit.sprite, // Make sure to target the sprite
            y: y + 70, // Change this value to control how far the fruit drops
            duration: 1000, // Change this value to control how fast the fruit drops
            ease: 'Cubic.easeOut', // Change this to control the easing function
            onComplete: () => {
                // Push the fruit to the items array after the tween completes
                this.items.push(fruit);
                this.allEntities = this.allEntities.filter(entity => entity !== fruit.sprite);
                fruit.sprite.setDepth(0);
            }
        });
    }

    calculateTileType() {
        const roll = Phaser.Math.FloatBetween(0, 1);
        let tileType;

        if (roll <= 0.70) {
            tileType = 1;
        } else if (roll <= 0.95) {
            tileType = Phaser.Math.Between(2, 5);
        } else if (roll <= 0.97) {
            tileType = Phaser.Math.Between(6, 9);
        } else {
            tileType = Phaser.Math.Between(10, 13);
        }
        return tileType;
    }

    spawnMonstersFire(centerX, centerY, scene) {
        const spawnProbability = this.calculateSpawnProbability();

        const randomFloat = Phaser.Math.FloatBetween(0, 1);

        if (randomFloat < spawnProbability) {
            spawnMonsters(centerX, centerY, scene, this.tileWidth, this.tilesBuffer, this.monsters, this.allEntities);
        }

        const fireProbability = 0.25 * (1 + PlayerState.fireBonus / 100);
        const randomFireFloat = Phaser.Math.FloatBetween(0, 1);
        if (randomFireFloat < fireProbability) {

            this.spawnFire();

        }


        const treeProbability = 0.99;
        const randomTreeFloat = Phaser.Math.FloatBetween(0, 1);
        if (randomTreeFloat < treeProbability) {
            const randomNumberOfTrees = Phaser.Math.Between(1, 10);
            for (let i = 0; i < randomNumberOfTrees; i++) {
                    this.spawnTrees();
            }
        }


        const pondProbability = 0.80;
        const randomPondFloat = Phaser.Math.FloatBetween(0, 1);
        if (randomPondFloat < pondProbability) {
            const randomNumberOfPonds = Phaser.Math.Between(1, 2);

            for (let i = 0; i < randomNumberOfPonds; i++) {

                this.spawnPonds();
            }
        }

        const bush1Probability = 0.80;
        const randomBush1Float = Phaser.Math.FloatBetween(0, 1);
        if (randomBush1Float < bush1Probability) {
            const randomNumberOfBush1s = Phaser.Math.Between(1, 3);

            for (let i = 0; i < randomNumberOfBush1s; i++) {

                this.spawnBush1();
            }
        }
    }

    createTilesAround(centerX, centerY, scene) {
        const camera = scene.cameras.main;
        const startI = Math.floor((centerX - GAME_CONFIG.CAMERA_WIDTH / 2) / this.tileWidth);
        const endI = Math.ceil((centerX + GAME_CONFIG.CAMERA_WIDTH / 2) / this.tileWidth);
        const startJ = Math.floor((centerY - camera.height / 2) / this.tileWidth);
        const endJ = Math.ceil((centerY + camera.height / 2) / this.tileWidth);
        for (let i = startI; i <= endI; i++) {
            for (let j = startJ; j <= endJ; j++) {
                if (!this.tiles[`${i},${j}`]) {
                    let tile;
                    if (this.tilePool.length > 0) {
                        tile = this.tilePool.pop();
                        tile.setPosition(i * this.tileWidth, j * this.tileWidth);
                    } else {
                        const tileKey = `tile${this.calculateTileType()}`;
                        tile = scene.add.image(i * this.tileWidth, j * this.tileWidth, tileKey).setOrigin(0).setPipeline('Light2D');
                    }
                    this.tiles[`${i},${j}`] = tile;
                }
            }
        }
    }

    calculateSpawnProbability() {
        let probability = GAME_CONFIG.baseProbability;

        // Ensure probability is within [0, 1]
        probability = Phaser.Math.Clamp(probability, 0, 1);
        return probability;
    }

    handlePlayerMovement() {
        if (PlayerState.isDead) {
            this.cat.setVelocity(0, 0);
            return;
        }

        let velocityX = 0, velocityY = 0;

        if (this.cursors.left.isDown && this.cursors.up.isDown) {
            // Handle up-left diagonal movement
            velocityX = -this.diagonalVelocity;
            velocityY = -this.diagonalVelocity;
            if (!this.isDashing) {
                this.lastDirection = 'upLeft';
            }
        } else if (this.cursors.right.isDown && this.cursors.up.isDown) {
            // Handle up-right diagonal movement
            velocityX = this.diagonalVelocity;
            velocityY = -this.diagonalVelocity;
            if (!this.isDashing) {
                this.lastDirection = 'upRight';
            }
        } else if (this.cursors.left.isDown && this.cursors.down.isDown) {
            // Handle down-left diagonal movement
            velocityX = -this.diagonalVelocity;
            velocityY = this.diagonalVelocity;
            if (!this.isDashing) {
                this.lastDirection = 'downLeft';
            }
        } else if (this.cursors.right.isDown && this.cursors.down.isDown) {
            // Handle down-right diagonal movement
            velocityX = this.diagonalVelocity;
            velocityY = this.diagonalVelocity;
            if (!this.isDashing) {
                this.lastDirection = 'downRight';
            }
        } else if (this.cursors.left.isDown) {
            // Handle left movement
            velocityX = -this.moveSpeed;
            if (!this.isDashing) {
                this.lastDirection = 'left';
            }
        } else if (this.cursors.right.isDown) {
            // Handle right movement
            velocityX = this.moveSpeed;
            if (!this.isDashing) {
                this.lastDirection = 'right';
            }
        } else if (this.cursors.up.isDown) {
            // Handle up movement
            velocityY = -this.moveSpeed;
            if (!this.isDashing) {
                this.lastDirection = 'up';
            }
        } else if (this.cursors.down.isDown) {
            // Handle down movement
            velocityY = this.moveSpeed;
            if (!this.isDashing) {
                this.lastDirection = 'down';
            }
        }

        if (PlayerState.isAttacking && !this.isDashing) {
            const attackSpeedReductionFactor = 0.5;
            velocityX *= attackSpeedReductionFactor;
            velocityY *= attackSpeedReductionFactor;
        }

        if (PlayerState.isEating) {
            const attackSpeedReductionFactor = 0.3;
            velocityX *= attackSpeedReductionFactor;
            velocityY *= attackSpeedReductionFactor;
        }

        this.cat.setVelocity(velocityX, velocityY);
        this.handlePlayerAnimations(this.lastDirection, velocityX, velocityY);
    }

    updateTargetMonsterKey(attackName) {
        Object.values(this.monsters).forEach(monster => {
            if (monster && monster.sprite) {
                this.postFxPlugin.remove(monster.sprite);
            }
        });

        // If a monster has been clicked, check if it's attackable
        if (this.lastClickedMonsterKey) {
            const clickedMonster = this.monsters[this.lastClickedMonsterKey];
            if (clickedMonster && this.isMonsterAttackable(clickedMonster, attackName)) {
                // Clear tint from previously clicked monster
                if (this.lastClickedMonsterKey && this.monsters[this.lastClickedMonsterKey]) {
                    this.postFxPlugin.remove(this.monsters[this.lastClickedMonsterKey].sprite);
                }
                this.lastClickedMonsterKey = clickedMonster.key;
                this.postFxPlugin.add(clickedMonster.sprite, {
                    thickness: 2,
                    outlineColor: 0xff8a50
                });

                // Cascade 2nd outline
                this.postFxPlugin.add(clickedMonster.sprite, {
                    thickness: 4,
                    outlineColor: 0xc41c00
                });

                // Set the new target and apply tint
                this.targetMonsterKey = this.lastClickedMonsterKey;
                return;
            }
        }

        // If the clicked monster is not attackable or if no monster has been clicked,
        // find another attackable monster
        if (this.targetMonsterKey === null) {
            for (const [key, monster] of Object.entries(this.monsters)) {
                if (this.isMonsterAttackable(monster, attackName)) {
                    // Clear tint from previously clicked monster
                    if (this.lastClickedMonsterKey && this.monsters[this.lastClickedMonsterKey]) {
                        this.postFxPlugin.remove(this.monsters[this.lastClickedMonsterKey].sprite);
                    }
                    this.lastClickedMonsterKey = key;
                    this.postFxPlugin.add(monster.sprite, {
                        thickness: 2,
                        outlineColor: 0xff8a50
                    });

                    // Cascade 2nd outline
                    this.postFxPlugin.add(monster.sprite, {
                        thickness: 4,
                        outlineColor: 0xc41c00
                    });


                    // Set the new target and apply tint
                    this.targetMonsterKey = key;
                    break;
                }
            }
        }
    }

    //function to randomly spawn a fire on the map using the fire animation
    spawnFire() {
        const camera = this.cameras.main;
        const centerX = camera.midPoint.x;
        const centerY = camera.midPoint.y;
        const visibleStartI = Math.floor((centerX - camera.width / 2) / this.tileWidth);
        const visibleEndI = Math.ceil((centerX + camera.width / 2) / this.tileWidth);
        const visibleStartJ = Math.floor((centerY - camera.height / 2) / this.tileWidth);
        const visibleEndJ = Math.ceil((centerY + camera.height / 2) / this.tileWidth);

        const bufferStartI = visibleStartI - (this.tilesBuffer + 1); // extend outward by 1 tile
        const bufferEndI = visibleEndI + (this.tilesBuffer + 1);    // extend outward by 1 tile
        const bufferStartJ = visibleStartJ - (this.tilesBuffer + 1); // extend outward by 1 tile
        const bufferEndJ = visibleEndJ + (this.tilesBuffer + 1);    // extend outward by 1 tile

        let spawnTileI, spawnTileJ;

        // Deciding whether to spawn on the horizontal or vertical buffer area
        if (Phaser.Math.Between(0, 1) === 0) {
            // Horizontal buffer area (top or bottom)
            spawnTileI = Phaser.Math.Between(bufferStartI, bufferEndI);
            spawnTileJ = Phaser.Math.Between(0, 1) === 0 ? bufferStartJ : bufferEndJ;
        } else {
            // Vertical buffer area (left or right)
            spawnTileJ = Phaser.Math.Between(bufferStartJ, bufferEndJ);
            spawnTileI = Phaser.Math.Between(0, 1) === 0 ? bufferStartI : bufferEndI;
        }

        // Check if the chosen tile is within the visible area
        if ((spawnTileI >= visibleStartI && spawnTileI <= visibleEndI) && (spawnTileJ >= visibleStartJ && spawnTileJ <= visibleEndJ)) {
            // If it is, return and don't spawn a fire
            return;
        }

        const x = spawnTileI * this.tileWidth;
        const y = spawnTileJ * this.tileWidth;

        const isTooCloseToOtherObjects = (objectArray, distanceThreshold) => {
            return objectArray.some(obj => {
                if (obj && obj.active) {
                    const dx = obj.x - x;
                    const dy = obj.y - y;
                    const distanceInTiles = Math.sqrt(dx * dx + dy * dy) / this.tileWidth;
                    return distanceInTiles <= distanceThreshold;
                }
                return false;
            });
        };

        // Check if the new location is too close to existing fires, trees, ponds, or bushes
        if (isTooCloseToOtherObjects(this.fires, 30) ||
            isTooCloseToOtherObjects(this.trees, 4) || // assuming a tree threshold
            isTooCloseToOtherObjects(this.ponds, 3) || // assuming a pond threshold
            isTooCloseToOtherObjects(this.bush1s, 3)) { // assuming a bush threshold
            return;
        }


        const fire = this.matter.add.sprite(x, y, 'fire', null, {
            label: 'fire'
        }).setCircle(70).setDepth(2);


        const fireShadow = this.add.sprite(fire.x, fire.y, 'fire');
        fireShadow.setTint(0x000000); // Set the tint to orange
        fireShadow.setOrigin(0.5, 0.5);            
        fireShadow.setPipeline('Light2D');
        fireShadow.setDepth(1);
        fireShadow.label = 'fireShadow';
        fireShadow.setBlendMode(Phaser.BlendModes.MULTIPLY); // Set the blend mode to 'multiply'

        fire.shadow = fireShadow; // Store the shadow sprite as a property of the tree

        fire.setOrigin(0.5, 0.5);
        fire.setPipeline('Light2D');
        fire.play('fire');
        fireShadow.play('fire');

        this.matter.body.setStatic(fire.body, true);

        fire.body.isSensor = true;

        this.fires.push(fire);


        fire.light = this.lights.addLight(x, y, 400).setColor(0xFF4500).setIntensity(1.6);

        this.tweens.add({
            targets: fire.light,
            radius: { from: 325, to: 400 },
            ease: 'Sine.easeInOut',
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        for (let index = this.fires.length - 1; index >= 0; index--) {
            let fire = this.fires[index];
            if (fire && fire.active) {
                fire.endTime = Date.now() + 15000;

                // Create a recurring timer event that checks if the fire should be extinguished
                fire.timerEvent = this.time.addEvent({
                    delay: 1000, // Check every second
                    callback: () => {
                        if (Date.now() >= fire.endTime) {
                            if (fire && fire.active) {
                                const x = fire.x;
                                const y = fire.y;

                                // Check if the fire object has a light property
                                if (fire.light) {
                                    fire.light.setIntensity(0);

                                    // Check if the lights manager exists before removing the light
                                    if (this.lights) {
                                        this.lights.removeLight(fire.light.x, fire.light.y);
                                    }
                                }

                                // Check if the matter world exists before removing the fire body
                                if (this.matter && this.matter.world) {
                                    this.matter.world.remove(fire.body);
                                }

                                //if fire shadow exists, remove it
                                if (fire.shadow) {
                                    fire.shadow.destroy();
                                }

                                // Check if the fires array exists before removing the fire object
                                if (this.fires) {
                                    this.fires.splice(index, 1);
                                }

                                // Check if the add method exists before creating the ashes sprite
                                if (this.add) {
                                    let ashesSprite = this.add.sprite(x, y, 'ashes').setDepth(2).setPipeline('Light2D');

                                    // Check if the ashes array exists before adding the ashes sprite
                                    if (this.ashes) {
                                        this.ashes.push(ashesSprite);
                                    }
                                }
                                // Check if the fire body exists before destroying it
                                if (fire.body) {
                                    fire.body.destroy();
                                }

                                // Check if the fire object exists before destroying it
                                if (fire) {
                                    fire.destroy();
                                }
                            }
                        } else {
                            if (fire && fire.active) {
                                const timeLeft = Math.round((fire.endTime - Date.now()) / 1000);
                                const proportion = Math.min(timeLeft / 15, 1); // Cap the proportion at 1

                                // Set the intensity proportional to the time left, capped at 1.7
                                const intensity = 1.7 * proportion;
                                fire.light.setIntensity(intensity);
                            }
                        }
                    },
                    loop: true
                });
            }
        }
    }

    useLogOnFire(player) {
        // Find the fire closest to the player
        let closestFire = null;
        let closestDistance = Infinity;
        this.fires.forEach((fire) => {
            if (fire && fire.active) {
                const fireBody = fire.body;

                const fireCenterX = fireBody.position.x;
                const fireCenterY = fireBody.position.y;

                const dx = this.cat.x - fireCenterX;
                const dy = this.cat.y - fireCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < closestDistance) {
                    closestFire = fire;
                    closestDistance = distance;

                }
            }
        });

        // Extend the timer for the closest fire
        if (closestFire && closestFire.timerEvent) {
            closestFire.timerEvent.remove();

            closestFire.endTime += 30000;

            closestFire.timerEvent = this.time.addEvent({
                delay: 1000, // Check every second
                callback: () => {
                    if (Date.now() >= closestFire.endTime) {
                        if (closestFire && closestFire.active) {
                            const x = closestFire.x;
                            const y = closestFire.y;

                            // Check if the fire object has a light property
                            if (closestFire.light) {
                                closestFire.light.setIntensity(0);

                                // Check if the lights manager exists before removing the light
                                if (this.lights) {
                                    this.lights.removeLight(closestFire.light.x, closestFire.light.y);
                                }
                            }

                            // Check if the matter world exists before removing the fire body
                            if (this.matter && this.matter.world) {
                                this.matter.world.remove(closestFire.body);
                            }

                            //if fire shadow exists, remove it
                            if (closestFire.shadow) {
                                closestFire.shadow.destroy();
                            }

                            // Check if the fire body exists before destroying it
                            if (closestFire.body) {
                                closestFire.body.destroy();
                            }

                            // Check if the fire object exists before destroying it
                            if (closestFire) {
                                closestFire.destroy();
                            }

                            // Check if the fires array exists before removing the fire object
                            if (this.fires) {
                                this.fires = this.fires.filter(fire => fire !== closestFire);
                            }

                            // Check if the add method exists before creating the ashes sprite
                            if (this.add) {
                                let ashesSprite = this.add.sprite(x, y, 'ashes').setDepth(2).setPipeline('Light2D');

                                // Check if the ashes array exists before adding the ashes sprite
                                if (this.ashes) {
                                    this.ashes.push(ashesSprite);
                                }
                            }
                        }
                    } else {
                        if (closestFire && closestFire.active) {
                            const timeLeft = Math.round((closestFire.endTime - Date.now()) / 1000);
                            const proportion = Math.min(timeLeft / 15, 1); // Cap the proportion at 1

                            // Set the intensity proportional to the time left, capped at 1.7
                            const intensity = 1.7 * proportion;
                            closestFire.light.setIntensity(intensity);
                        }
                    }
                },
                loop: true
            });

            const log = this.add.sprite(closestFire.x + 4, closestFire.y + 25, 'log').setOrigin(0.5, 1).setDepth(2).setPipeline('Light2D');

            this.tweens.add({
                targets: log,
                scaleX: 0,
                scaleY: 0,
                duration: 2000, // Adjust as needed
                onComplete: () => {
                    log.destroy();
                }
            });
        } else {
        }
    }

    spawnTrees() {
        const camera = this.cameras.main;
        const centerX = camera.midPoint.x;
        const centerY = camera.midPoint.y;
        const visibleStartI = Math.floor((centerX - camera.width / 2) / this.tileWidth);
        const visibleEndI = Math.ceil((centerX + camera.width / 2) / this.tileWidth);
        const visibleStartJ = Math.floor((centerY - camera.height / 2) / this.tileWidth);
        const visibleEndJ = Math.ceil((centerY + camera.height / 2) / this.tileWidth);

        const bufferStartI = visibleStartI - (this.tilesBuffer + 8); // extend outward by 1 tile
        const bufferEndI = visibleEndI + (this.tilesBuffer + 8);    // extend outward by 1 tile
        const bufferStartJ = visibleStartJ - (this.tilesBuffer + 8); // extend outward by 1 tile
        const bufferEndJ = visibleEndJ + (this.tilesBuffer + 8);   // extend outward by 1 tile

        let spawnTileI, spawnTileJ;

        // Deciding whether to spawn on the horizontal or vertical buffer area
        if (Phaser.Math.Between(0, 1) === 0) {
            // Horizontal buffer area (top or bottom)
            spawnTileI = Phaser.Math.Between(bufferStartI, bufferEndI);
            spawnTileJ = Phaser.Math.Between(0, 1) === 0 ? bufferStartJ : bufferEndJ;
        } else {
            // Vertical buffer area (left or right)
            spawnTileJ = Phaser.Math.Between(bufferStartJ, bufferEndJ);
            spawnTileI = Phaser.Math.Between(0, 1) === 0 ? bufferStartI : bufferEndI;
        }

        // Check if the chosen tile is within the visible area
        if ((spawnTileI >= visibleStartI && spawnTileI <= visibleEndI) && (spawnTileJ >= visibleStartJ && spawnTileJ <= visibleEndJ)) {
            // If it is, return and don't spawn a fire
            return;
        }

        const x = spawnTileI * this.tileWidth;
        const y = spawnTileJ * this.tileWidth;

        const isTooCloseToOtherObjects = (objectArray, distanceThreshold) => {
            return objectArray.some(obj => {
                if (obj && obj.active) {
                    const dx = obj.x - x;
                    const dy = obj.y - y;
                    const distanceInTiles = Math.sqrt(dx * dx + dy * dy) / this.tileWidth;
                    return distanceInTiles <= distanceThreshold;
                }
                return false;
            });
        };

        const monstersArray = Object.values(this.monsters);

        // Check if the new location is too close to existing fires, trees, ponds, bushes, or monsters
        if (isTooCloseToOtherObjects(this.fires, 4) ||
            isTooCloseToOtherObjects(this.trees, 3) || // assuming a tree threshold
            isTooCloseToOtherObjects(this.ponds, 6) || // assuming a pond threshold
            isTooCloseToOtherObjects(this.bush1s, 4) || // assuming a bush threshold
            isTooCloseToOtherObjects(monstersArray, 4)) { // Pass the monsters array
            return;
        }

        // Create a custom shape using a polygon body
        const treeVertices = this.createTreeVertices(x, y);
        const treeBody = this.matter.add.fromVertices(x, y, treeVertices, {
            isStatic: true
        }, true);

        treeBody.label = 'tree';

        let treeType;
        const randomNumber = Phaser.Math.Between(1, 100);

        if (randomNumber <= 75) {
            treeType = 'tree_1';
        } else if (randomNumber <= 90) {
            treeType = 'tree_2';
        } else {
            treeType = 'tree_3';
        }

        const tree = this.matter.add.sprite(x, y, treeType, null, {
            label: 'tree'
        }).setExistingBody(treeBody); // Set the depth to be proportional to the y-coordinate

        if (treeType === 'tree_3') {
            tree.setOrigin(0.48, 0.85);
        } else {
            tree.setOrigin(0.5, 0.85);
        }

        tree.setPipeline('Light2D');

        tree.isDepleted = false;

        tree.originalType = treeType;

        const treeShadow = this.add.sprite(tree.x, tree.y, treeType);

        treeShadow.setOrigin(0.5, 0.85);
        treeShadow.setTint(0x000000); // Color the shadow sprite black
        treeShadow.setPipeline('Light2D');
        treeShadow.label = 'treeShadow';
        treeShadow.parentTree = tree;
        treeShadow.setBlendMode(Phaser.BlendModes.MULTIPLY); // Set the blend mode to 'multiply'

        tree.shadow = treeShadow; // Store the shadow sprite as a property of the tree


        if (!tree.isDepleted) {
            tree.play(treeType);
            treeShadow.play(treeType);
        }
        // Set friction and frictionAir to 0 on the tree body and all its parts
        tree.body.friction = 0;
        tree.body.frictionAir = 0;
        for (let part of tree.body.parts) {
            part.friction = 0;
            part.frictionAir = 0;
        }

        // Set restitution to 0 on the tree body and all its parts
        tree.body.restitution = 0;
        for (let part of tree.body.parts) {
            part.restitution = 0;
        }
      
        this.trees.push(tree);
        this.allEntities.push(treeShadow);
        this.allEntities.push(tree);
    }

    spawnPonds() {
        const camera = this.cameras.main;
        const centerX = camera.midPoint.x;
        const centerY = camera.midPoint.y;
        const visibleStartI = Math.floor((centerX - camera.width / 2) / this.tileWidth);
        const visibleEndI = Math.ceil((centerX + camera.width / 2) / this.tileWidth);
        const visibleStartJ = Math.floor((centerY - camera.height / 2) / this.tileWidth);
        const visibleEndJ = Math.ceil((centerY + camera.height / 2) / this.tileWidth);

        const bufferStartI = visibleStartI - (this.tilesBuffer + 3); // extend outward by 1 tile
        const bufferEndI = visibleEndI + (this.tilesBuffer + 3);    // extend outward by 1 tile
        const bufferStartJ = visibleStartJ - (this.tilesBuffer + 3); // extend outward by 1 tile
        const bufferEndJ = visibleEndJ + (this.tilesBuffer + 3);   // extend outward by 1 tile

        let spawnTileI, spawnTileJ;

        // Deciding whether to spawn on the horizontal or vertical buffer area
        if (Phaser.Math.Between(0, 1) === 0) {
            // Horizontal buffer area (top or bottom)
            spawnTileI = Phaser.Math.Between(bufferStartI, bufferEndI);
            spawnTileJ = Phaser.Math.Between(0, 1) === 0 ? bufferStartJ : bufferEndJ;
        } else {
            // Vertical buffer area (left or right)
            spawnTileJ = Phaser.Math.Between(bufferStartJ, bufferEndJ);
            spawnTileI = Phaser.Math.Between(0, 1) === 0 ? bufferStartI : bufferEndI;
        }

        // Check if the chosen tile is within the visible area
        if ((spawnTileI >= visibleStartI && spawnTileI <= visibleEndI) && (spawnTileJ >= visibleStartJ && spawnTileJ <= visibleEndJ)) {
            // If it is, return and don't spawn a fire
            return;
        }

        const x = spawnTileI * this.tileWidth;
        const y = spawnTileJ * this.tileWidth;

        const isTooCloseToOtherObjects = (objectArray, distanceThreshold) => {
            return objectArray.some(obj => {
                if (obj && obj.active) {
                    const dx = obj.x - x;
                    const dy = obj.y - y;
                    const distanceInTiles = Math.sqrt(dx * dx + dy * dy) / this.tileWidth;
                    return distanceInTiles <= distanceThreshold;
                }
                return false;
            });
        };

        const monstersArray = Object.values(this.monsters);


        // Check if the new location is too close to existing fires, trees, ponds, or bushes
        if (isTooCloseToOtherObjects(this.fires, 4) ||
            isTooCloseToOtherObjects(this.trees, 6) || // assuming a tree threshold
            isTooCloseToOtherObjects(this.ponds, 4) || // assuming a pond threshold
            isTooCloseToOtherObjects(this.bush1s, 4) ||
            isTooCloseToOtherObjects(monstersArray, 4)) { // Pass the monsters array

            return;
        }


        const pondTooClose = this.ponds.some(pond => {
            if (pond && pond.active) {
                const dx = pond.x - x;
                const dy = pond.y - y;
                const distanceInTiles = Math.sqrt(dx * dx + dy * dy) / this.tileWidth;
                return distanceInTiles <= 6;
            }
            return false; // Return false if the tree object does not exist or is not active
        });

        // If there's already a tree too close to the new tree's location, don't spawn a new one
        if (pondTooClose) {
            return;
        }

        if (this.ponds.filter(pond => pond.active).length >= 5) {
            return;
        }

        const pond = this.matter.add.sprite(x, y, 'pond', null, {
            label: 'pond'
        });

        // Approximate an ellipse using a polygon body
        const ellipseVertices = this.createEllipseVertices(x, y, 170, 120, 16);
        const pondBody = this.matter.add.fromVertices(x, y, ellipseVertices, {
            isStatic: true
        }, true);

        pondBody.label = 'pond';

        pond.setExistingBody(pondBody).setOrigin(0.51, 0.47);
        pond.setPipeline('Light2D');
        pond.play('pond');

        this.ponds.push(pond);
        this.allEntities.push(pond);
    }



    createEllipseVertices(x, y, width, height, numVertices) {
        const vertices = [];
        for (let i = 0; i < numVertices; i++) {
            const angle = Phaser.Math.DegToRad((360 / numVertices) * i);
            const xv = x + width * Math.cos(angle);
            const yv = y + height * Math.sin(angle);
            vertices.push({ x: xv, y: yv });
        }
        return vertices;
    }

    createTreeVertices(x, y) {
        const vertices = [];

        // Define the points for the trapezoid shape
        vertices.push({ x: x - 30, y: y - 50 }); // Top left (short base)
        vertices.push({ x: x + 30, y: y - 50 }); // Top right (short base)
        vertices.push({ x: x + 30, y: y }); // Middle right
        vertices.push({ x: x + 30, y: y + 10 }); // New vertex between middle right and bottom right
        vertices.push({ x: x + 50, y: y + 30 }); // Bottom right (long base)
        vertices.push({ x: x - 50, y: y + 30 }); // Bottom left (long base)
        vertices.push({ x: x - 30, y: y + 10 }); // New vertex between middle left and bottom left
        vertices.push({ x: x - 30, y: y }); // Middle left

        return vertices;
    }

    spawnBush1() {
        const camera = this.cameras.main;
        const centerX = camera.midPoint.x;
        const centerY = camera.midPoint.y;
        const visibleStartI = Math.floor((centerX - camera.width / 2) / this.tileWidth);
        const visibleEndI = Math.ceil((centerX + camera.width / 2) / this.tileWidth);
        const visibleStartJ = Math.floor((centerY - camera.height / 2) / this.tileWidth);
        const visibleEndJ = Math.ceil((centerY + camera.height / 2) / this.tileWidth);

        const bufferStartI = visibleStartI - (this.tilesBuffer + 3); // extend outward by 1 tile
        const bufferEndI = visibleEndI + (this.tilesBuffer + 3);    // extend outward by 1 tile
        const bufferStartJ = visibleStartJ - (this.tilesBuffer + 3); // extend outward by 1 tile
        const bufferEndJ = visibleEndJ + (this.tilesBuffer + 3);   // extend outward by 1 tile

        let spawnTileI, spawnTileJ;

        // Deciding whether to spawn on the horizontal or vertical buffer area
        if (Phaser.Math.Between(0, 1) === 0) {
            // Horizontal buffer area (top or bottom)
            spawnTileI = Phaser.Math.Between(bufferStartI, bufferEndI);
            spawnTileJ = Phaser.Math.Between(0, 1) === 0 ? bufferStartJ : bufferEndJ;
        } else {
            // Vertical buffer area (left or right)
            spawnTileJ = Phaser.Math.Between(bufferStartJ, bufferEndJ);
            spawnTileI = Phaser.Math.Between(0, 1) === 0 ? bufferStartI : bufferEndI;
        }

        // Check if the chosen tile is within the visible area
        if ((spawnTileI >= visibleStartI && spawnTileI <= visibleEndI) && (spawnTileJ >= visibleStartJ && spawnTileJ <= visibleEndJ)) {
            // If it is, return and don't spawn a fire
            return;
        }

        const x = spawnTileI * this.tileWidth;
        const y = spawnTileJ * this.tileWidth;

        const isTooCloseToOtherObjects = (objectArray, distanceThreshold) => {
            return objectArray.some(obj => {
                if (obj && obj.active) {
                    const dx = obj.x - x;
                    const dy = obj.y - y;
                    const distanceInTiles = Math.sqrt(dx * dx + dy * dy) / this.tileWidth;
                    return distanceInTiles <= distanceThreshold;
                }
                return false;
            });
        };

        const monstersArray = Object.values(this.monsters);


        // Check if the new location is too close to existing fires, trees, ponds, or bushes
        if (isTooCloseToOtherObjects(this.fires, 3) ||
            isTooCloseToOtherObjects(this.trees, 3) || // assuming a tree threshold
            isTooCloseToOtherObjects(this.ponds, 4) || // assuming a pond threshold
            isTooCloseToOtherObjects(monstersArray, 3) ||
            isTooCloseToOtherObjects(this.bush1s, 3)) { // assuming a bush threshold
            return;
        }

        // If there are already 2 trees in the view, don't spawn a new one
        if (this.bush1s.filter(bush1 => bush1.active).length >= 4) {
            return;
        }

        const bush1 = this.matter.add.sprite(x, y, 'bush1', null, {
            label: 'bush1'
        });

        // Approximate an ellipse using a polygon body
        const ellipseVertices = this.createEllipseVertices(x, y, 50, 50, 16);
        const bush1Body = this.matter.add.fromVertices(x, y, ellipseVertices, {
            isStatic: true
        }, true);

        bush1Body.label = 'bush1';

        const bush1Shadow = this.add.sprite(bush1.x, bush1.y, 'bush1');

        bush1Shadow.setOrigin(0.5, 0.6);
        bush1Shadow.setTint(0x000000); // Color the shadow sprite black
        bush1Shadow.setPipeline('Light2D');
        bush1Shadow.label = 'bush1Shadow';
        bush1Shadow.parentBush1 = bush1;
        bush1Shadow.setBlendMode(Phaser.BlendModes.MULTIPLY); // Set the blend mode to 'multiply'

        bush1.shadow = bush1Shadow; // Store the shadow sprite as a property of the tree

        bush1.setExistingBody(bush1Body).setOrigin(0.5, 0.6);
        bush1.setPipeline('Light2D');
        bush1.play('bush1');
        bush1Shadow.play('bush1');

        bush1.isDepleted = false;


        this.bush1s.push(bush1);
        this.allEntities.push(bush1Shadow);
        this.allEntities.push(bush1);

    }

    isMonsterAttackable(monster, attackName) {
        const attack = attacks[attackName];
        if (!attack) {
            return false;
        }

        const attackRange = attack.range;
        return this.calculateDistance(this.cat, monster) <= attackRange && this.isMonsterInFront(this.cat, monster, this.lastDirection);
    }

    attemptToTargetMonster(key) {
        const monster = this.monsters[key];
        if (monster) {
            this.lastClickedMonsterKey = key;
            this.targetMonsterKey = key;
        } else {

        }
    }

    launchProjectile(targetMonster) {
        if (!targetMonster || !targetMonster.sprite) return;

        let projectile = this.add.sprite(this.cat.x, this.cat.y, 'hairballs');
        this.allEntities.push(projectile);
        projectile.setPipeline('Light2D');
        projectile.play('hairballs');


        let targetX = targetMonster.sprite.x;
        let targetY = targetMonster.sprite.y;

        const ballDuration = 600; // Set a constant duration

        // Animate projectile to target
        this.tweens.add({
            targets: projectile,
            x: targetX,
            y: targetY,
            duration: ballDuration,
            ease: 'Power2',
            onComplete: () => {
                projectile.destroy();
                this.allEntities.splice(this.allEntities.indexOf(projectile), 1);
            }
        });
    }

    handlePlayerAnimations(lastDirection, velocityX, velocityY) {

        if (PlayerState.isDead) {
            return;
        }

        //if this.isdashing is true, then the player is dashing increase speed and play attack5 animation
        if (this.isDashing) {
            this.moveSpeed *= 1.0145
            //increase diagonal velocity
            this.diagonalVelocity = this.moveSpeed / Math.sqrt(2);

            // Determine the animation key based on the last direction
            switch (this.lastDirection) {
                case 'up':
                    this.attackAnimationKey = 'attack5-back';
                    break;
                case 'down':
                    this.attackAnimationKey = 'attack5-front';
                    break;
                case 'left':
                case 'right':
                case 'upLeft':
                case 'upRight':
                case 'downLeft':
                case 'downRight':
                    this.attackAnimationKey = 'attack5';
                    break;
                default:
                    this.attackAnimationKey = 'attack5';
                    break;
            }

            this.cat.play(this.attackAnimationKey, true);
            this.catShadow.play(this.attackAnimationKey, true);

            // After the animation is complete, set this.isDashing to false and reset the speed
            this.cat.on('animationcomplete', () => {
                this.isDashing = false;
                this.moveSpeed = PlayerState.speed;
                this.diagonalVelocity = this.moveSpeed / Math.sqrt(2);
            }, this);
            return;
        }


        //if player is underattack apply red tint for 1 second
        if (PlayerState.isHurt) {
            this.cat.setTint(0xff0000);

            // Start flashing
            let flash = setInterval(() => {
                this.cat.alpha = this.cat.alpha === 1 ? 0.5 : 1;
            }, 100);

            setTimeout(() => {
                this.cat.clearTint();
                PlayerState.isHurt = false;

                // Stop flashing
                clearInterval(flash);
                this.cat.alpha = 1;
            }, 200);
        }


        if (PlayerState.isAttacking && !PlayerState.isEating) {
            // Adjust the flip of the character without interrupting the animation
            const shouldFlip = (this.lastDirection === 'left' || this.lastDirection === 'upLeft' || this.lastDirection === 'downLeft');
            if (this.cat.flipX !== shouldFlip) {
                this.cat.flipX = shouldFlip;
            }
            return;
        }

        if (PlayerState.isEating) {
            this.cat.play('eat', true);
            this.catShadow.play('eat', true);
            this.cat.on('animationcomplete', () => {
                PlayerState.isEating = false;
            }, this);
            return;
        }


        if (velocityX === 0 && velocityY === 0 && !PlayerState.isAttacking) {
            // Handle idle animations based on last direction
            switch (this.lastDirection) {
                case 'up':
                    this.cat.play('sit-back', true);
                    this.catShadow.play('sit-back', true);
                    break;
                case 'down':
                    this.cat.play('sit-forward', true);
                    this.catShadow.play('sit-forward', true);
                    break;
                default:
                    this.cat.play('sit', true);
                    this.catShadow.play('sit', true);
                    break;
            }
        } else
            // Handle movement animations
            if (this.lastDirection === 'left') {
                this.cat.play('run', true);
                this.catShadow.play('run', true);
                this.cat.flipX = true; // flip when moving left
                this.catShadow.flipX = true;
            } else if (this.lastDirection === 'right') {
                this.cat.play('run', true);
                this.catShadow.play('run', true);
                this.cat.flipX = false; // don't flip when moving right
                this.catShadow.flipX = false;
            } else if (this.lastDirection === 'up') {
                this.cat.play('up', true);
                this.catShadow.play('up', true);
            } else if (this.lastDirection === 'down') {
                this.cat.play('down', true);
                this.catShadow.play('down', true);
            }
            else if (this.lastDirection === 'upLeft') {
                this.cat.play('run-diagonal-back', true);
                this.catShadow.play('run-diagonal-back', true);
                this.cat.flipX = true;
                this.catShadow.flipX = true;
            }
            else if (this.lastDirection === 'upRight') {
                this.cat.play('run-diagonal-back', true);
                this.catShadow.play('run-diagonal-back', true);
                this.cat.flipX = false;
                this.catShadow.flipX = false;
            }
            else if (this.lastDirection === 'downLeft') {
                this.cat.play('run-diagonal-front', true);
                this.catShadow.play('run-diagonal-front', true);
                this.cat.flipX = true;
                this.catShadow.flipX = true;
            }
            else if (this.lastDirection === 'downRight') {
                this.cat.play('run-diagonal-front', true);
                this.catShadow.play('run-diagonal-front', true);
                this.cat.flipX = false;
                this.catShadow.flipX = false;
            }
    }

    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }

    getAlphaFromTime(time) {
        if (time >= 0 && time < 3) {
            return this.lerp(0.1, 0.1, (time - 0) / (3 - 0));
        } else if (time >= 3 && time < 6) {
            return this.lerp(0.1, 0.2, (time - 3) / (6 - 3));
        } else if (time >= 6 && time < 12) {
            return this.lerp(0.2, 0.3, (time - 6) / (12 - 6));
        } else if (time >= 12 && time < 18) {
            return this.lerp(0.3, 0.2, (time - 12) / (18 - 12));
        } else if (time >= 18 && time < 21) {
            return this.lerp(0.2, 0.1, (time - 18) / (21 - 18));
        } else if (time >= 21 && time <= 24) {
            return this.lerp(0.1, 0.1, (time - 21) / (24 - 21));
        }
    }

    


    updateTimeCircle(gameTime) {
        const colorScale = chroma.scale([
            '#404040', // Midnight (0)
            '#000080', // Early morning (3)
            '#87CEEB', // Morning (6)
            '#E0FFFF', // Midday (12)
            '#87CEEB', // Afternoon (18)
            '#000080', // Evening (21)
            '#404040' // Night (24)
        ]).mode('lch').domain([0, 3, 6, 12, 18, 21, 24]);

        //create a color scale for the sun, based on the time of day so like sunrise to sunset:
        const sunColorScale = chroma.scale([
            '#FF4500', // Sunrise (6)
            '#FF6347', // Morning (9)
            '#FFA07A', // Midday (12)
            '#FF6347', // Afternoon (15)
            '#FF4500' // Sunset (18)
        ]).mode('lch').domain([6, 9, 12, 15, 18]);

        // Get the color for the current game time
        let color = colorScale(gameTime).hex().substring(1);

        //set ambient color to the color of the time of day
        this.lights.setAmbientColor(parseInt(color, 16));

        // Define color for sun:
        let sunColor = sunColorScale(gameTime).hex().substring(1);

        // Convert the color to a number
        color = parseInt(color, 16);

        //convert the sun color to a number for the sun light so with 0x in front
        sunColor = '0x' + sunColor;

        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const cameraCenterX = this.cameras.main.scrollX + screenWidth / 2;
        const cameraScrollY = this.cameras.main.scrollY;
        const sunLightValue = 0.72
        const sunLightIntensity = 6;


        // Calculate the current angle in radians
        const angle = ((gameTime % 24) / 24) * 2 * Math.PI;

        const x = cameraCenterX + Math.cos(angle) * (screenWidth / 2) * 2.4; // Amplitude for x
        const y = cameraScrollY + screenHeight / 2 + Math.sin(angle) * (screenHeight / 2) * 1.8; // Amplitude for y
        if (!this.sunLight) {
            // Create a new light source with a very large radius and slightly higher intensity
            this.sunLight = this.lights.addLight(x, y, screenWidth * sunLightValue, sunColor, sunLightIntensity); // x, y, radius, color, intensity
            // Set the falloff property to make the light intensity constant
            this.sunLight.falloff = [0, 0, 0];
            //set radius to 100
            this.sunLight.radius = screenWidth * sunLightValue;
            // Set the ambient light level to the same value as the light intensity
            this.lights.setAmbientColor(color);
            this.sunLight.intensity = sunLightIntensity;
        } else {
            // Update the position and intensity of the existing light source
            this.sunLight.x = x;
            this.sunLight.y = y;
            this.sunLight.radius = screenWidth * sunLightValue;
            this.sunLight.falloff = [0, 0, 0];
            // Set the ambient light level to the same value as the light intensity
            this.lights.setAmbientColor(color);
            this.sunLight.intensity = sunLightIntensity;
        }

        // Calculate angle from cat to ray.origin
        let angleCat = Math.atan2(this.sunLight.y - this.cat.y, this.sunLight.x - this.cat.x);

        // Define the radius of the orbit
        let orbitRadius = 7; // Adjust this value to change the size of the orbit

        // Calculate shadow position based on the cat's position and the orbit
        let shadowPosX = -this.cat.x + orbitRadius * Math.cos(angleCat);
        let shadowPosY = -this.cat.y + 4 + orbitRadius * Math.sin(angleCat);

        // Set the position, rotation, and scale of the shadow sprite
        this.catShadow.x = -shadowPosX;
        this.catShadow.y = -shadowPosY;
        this.catShadow.scaleX = 1; // Adjust the scale if needed
        this.catShadow.scaleY = 1; // Adjust the scale if needed
        this.catShadow.alpha = this.getAlphaFromTime(gameTime);; // Make the shadow sprite semi-transparent


        // For the monster shadows
        Object.values(this.monsters).forEach(monster => {
            if (monster.monsterShadow && monster.sprite && monster.sprite.active) {
                let angle = Math.atan2(this.sunLight.y - monster.sprite.y, this.sunLight.x - monster.sprite.x);
                let orbitRadius = 7;
                let shadowPosX = -monster.sprite.x + orbitRadius * Math.cos(angle);
                let shadowPosY = -monster.sprite.y + 4 + orbitRadius * Math.sin(angle);

                monster.monsterShadow.alpha = this.getAlphaFromTime(gameTime);
                monster.monsterShadow.x = -shadowPosX;
                monster.monsterShadow.y = -shadowPosY;
                monster.monsterShadow.scaleX = 1;
                monster.monsterShadow.scaleY = 1;
            }
        });

        // For the tree shadows
        this.trees.forEach(tree => {
            if (tree.shadow && tree.active) {
                let angle = Math.atan2(this.sunLight.y - tree.y, this.sunLight.x - tree.x);
                let orbitRadius = 7;
                let shadowPosX = -tree.x   + orbitRadius * Math.cos(angle);
                let shadowPosY = -tree.y  + orbitRadius * Math.sin(angle);

                tree.shadow.alpha = this.getAlphaFromTime(gameTime);
                tree.shadow.x = -shadowPosX;
                tree.shadow.y = -shadowPosY;
                tree.shadow.scaleX = 1.01;
                tree.shadow.scaleY = 1.035;
            }
        });

        // For the tree shadows
        this.fires.forEach(fire => {
            if (fire.shadow && fire.active) {
                let angle = Math.atan2(this.sunLight.y - fire.y, this.sunLight.x - fire.x);
                let orbitRadius = 7;
                let shadowPosX = -fire.x + orbitRadius * Math.cos(angle);
                let shadowPosY = -fire.y + orbitRadius * Math.sin(angle);

                fire.shadow.alpha = 0.1;
                fire.shadow.x = -shadowPosX;
                fire.shadow.y = -shadowPosY;
                fire.shadow.scaleX = 1.01;
                fire.shadow.scaleY = 1.035;
            }
        });

        // For the bush1 shadows
        this.bush1s.forEach(bush1 => {
            if (bush1.shadow && bush1.active) {
                let angle = Math.atan2(this.sunLight.y - bush1.y, this.sunLight.x - bush1.x);
                let orbitRadius = 7;
                let shadowPosX = -bush1.x  + orbitRadius * Math.cos(angle);
                let shadowPosY = -bush1.y  + orbitRadius * Math.sin(angle);

                bush1.shadow.alpha = this.getAlphaFromTime(gameTime);
                bush1.shadow.x = -shadowPosX;
                bush1.shadow.y = -shadowPosY;
                bush1.shadow.scaleX = 1.0;
                bush1.shadow.scaleY = 1.0;
            }
        });

    }

    updateHealthBar(scene, healthBar, currentHealth, maxHealth) {
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

    handlePlayerDeath() {
        if (this.isFainting) return; // Prevent multiple calls if already processing death
        this.cat.anims.stop(); // Stop current animations
        this.cat.play('dead', true);
        this.catShadow.play('dead', true);

        PlayerState.isDead = true;
        PlayerState.isUnderAttack = false;
        PlayerState.isHurt = false;
        PlayerState.isEating = false;

        this.isFainting = true;
        PlayerState.isAttacking = false; // Ensure no attack is in progress

        //reset the colliding this.monsters and colliding monster key:
        this.targetMonsterKey = null;
        this.lastClickedMonsterKey = null;

        Object.values(this.monsters).forEach(monster => {
            this.gameEvents.endBattleForMonster(monster, null);

            // Remove the current monster from allEntities
            this.allEntities = this.allEntities.filter(entity => entity !== monster.sprite);
        });



        // Reset the monsters object
        this.monsters = {};

        // In mainScene.js
        let uiScene = this.scene.get('UIScene');
        uiScene.clearInventory();

        this.destroyAll(this.cat.x, this.cat.y, this);

        // Listen for the 'animationcomplete' event
        this.cat.on('animationcomplete', (animation) => {
            if (animation.key === 'dead') {
                this.canAttack = true;
                PlayerState.isDead = false;
                //emit event to update energy
                this.isFainting = false;
                PlayerState.energy = 100;
                this.game.events.emit('energyUpdate', PlayerState.energy);
            }
        }, this);
    }

    destroyAll(centerX, centerY, scene) {
        const camera = scene.cameras.main;

        const startI = Math.floor((centerX - GAME_CONFIG.CAMERA_WIDTH / 2) / this.tileWidth);
        const endI = Math.ceil((centerX + GAME_CONFIG.CAMERA_WIDTH / 2) / this.tileWidth);
        const startJ = Math.floor((centerY - camera.height / 2) / this.tileWidth);
        const endJ = Math.ceil((centerY + camera.height / 2) / this.tileWidth);


        Object.keys(this.tiles).forEach((key) => {
            const [i, j] = key.split(',').map(Number);
            if (i >= startI && i <= endI && j >= startJ && j <= endJ) {

                for (let index = this.ashes.length - 1; index >= 0; index--) {
                    let ashes = this.ashes[index];
                    if (ashes && ashes.active) {

                        ashes.destroy();
                        this.ashes.splice(index, 1);

                    }
                }

                for (let index = this.items.length - 1; index >= 0; index--) {
                    let item = this.items[index];
                    if (item && item.sprite.active) {

                        item.sprite.destroy(); // Destroy the sprite, not the wrapper object
                        this.items.splice(index, 1);
                        this.allEntities = this.allEntities.filter(entity => entity !== item.sprite);
                    }
                }


                for (let index = this.trees.length - 1; index >= 0; index--) {
                    let tree = this.trees[index];
                    if (tree && tree.active) {
                        this.trees.splice(index, 1);
                        this.matter.world.remove(tree.body);

                        if (this.collidingTree === tree) {
                            this.collidingTree = null;
                        }
                        tree.shadow.destroy();
                        tree.body.destroy();
                        tree.destroy();

                        this.allEntities = this.allEntities.filter(entity => entity !== tree);
                        this.allEntities = this.allEntities.filter(entity => entity !== tree.shadow);
                    }
                }

                for (let index = this.ponds.length - 1; index >= 0; index--) {
                    let pond = this.ponds[index];
                    if (pond && pond.active) {

                        this.ponds.splice(index, 1);
                        this.matter.world.remove(pond.body);

                        pond.body.destroy();
                        pond.destroy();

                        this.allEntities = this.allEntities.filter(entity => entity !== pond);
                    }
                }


                for (let index = this.bush1s.length - 1; index >= 0; index--) {
                    let bush1 = this.bush1s[index];
                    if (bush1 && bush1.active) {

                        this.bush1s.splice(index, 1);
                        this.matter.world.remove(bush1.body);

                        if (this.collidingBush1 === bush1) {
                            this.collidingBush1 = null;
                        }

                        bush1.shadow.destroy();
                        bush1.body.destroy();
                        bush1.destroy();

                        this.allEntities = this.allEntities.filter(entity => entity !== bush1);
                        this.allEntities = this.allEntities.filter(entity => entity !== bush1.shadow);
                    }
                }

                for (let index = this.fires.length - 1; index >= 0; index--) {
                    let fire = this.fires[index];
                    if (fire && fire.active) {

                        this.tweens.killTweensOf(fire.light);
                        // Turn off the light associated with the fire
                        fire.light.setIntensity(0);

                        // Remove the light from the LightManager's list of lights
                        this.lights.removeLight(fire.light.x, fire.light.y);

                        // Destroy the fire body
                        this.matter.world.remove(fire.body);

                        // Remove the fire from the fires array before destroying it
                        this.fires.splice(index, 1);

                        fire.shadow.destroy();

                        //destroy the fire body
                        fire.body.destroy();

                        fire.timerEvent.remove();

                        // Destroy the fire
                        fire.destroy();
                    }
                }
            }
        });

    }

    calculateDistance(player, monster) {
        if (!player || !monster || !player.body || !monster.sprite || !monster.sprite.body) {
            return;
        }

        const playerPosition = player.body.position;
        const monsterPosition = monster.sprite.body.position;

        const distanceX = (playerPosition.x - monsterPosition.x) / this.tileWidth;
        const distanceY = (playerPosition.y - monsterPosition.y) / this.tileWidth;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        const playerRadius = player.body.circleRadius / this.tileWidth;
        const monsterRadius = monster.sprite.body.circleRadius / this.tileWidth;
        const calculatedDistance = Math.max(0, distance - (playerRadius + monsterRadius));

        return calculatedDistance;
    }


    isMonsterInFront(player, monster, lastDirection) {
        switch (lastDirection) {
            case 'left':
                return monster.sprite.x < player.x;
            case 'right':
                return monster.sprite.x > player.x;
            case 'up':
                return monster.sprite.y < player.y;
            case 'down':
                return monster.sprite.y > player.y;
            case 'upLeft':
                return monster.sprite.x < player.x && monster.sprite.y < player.y;
            case 'upRight':
                return monster.sprite.x > player.x && monster.sprite.y < player.y;
            case 'downLeft':
                return monster.sprite.x < player.x && monster.sprite.y > player.y;
            case 'downRight':
                return monster.sprite.x > player.x && monster.sprite.y > player.y;
            default:
                return false;
        }
    }

    isObjectInFront(player, object, lastDirection) {
        switch (lastDirection) {
            case 'left':
                return object.x < player.x;
            case 'right':
                return object.x > player.x;
            case 'up':
                return object.y < player.y;
            case 'down':
                return object.y > player.y;
            case 'upLeft':
                return object.x < player.x && object.y < player.y;
            case 'upRight':
                return object.x > player.x && object.y < player.y;
            case 'downLeft':
                return object.x < player.x && object.y > player.y;
            case 'downRight':
                return object.x > player.x && object.y > player.y;
            default:
                return false;
        }
    }

    updateTooltip() {
        const pointer = this.input.activePointer;

        // Check if the right mouse button was clicked
        if (pointer.isDown && pointer.button === 2) {
            const pointerX = pointer.x; // Use screen coordinates
            const pointerY = pointer.y; // Use screen coordinates
            let isOverMonster = false;

            Object.values(this.monsters).forEach(monster => {
                if (!monster || !monster.sprite || !monster.sprite.active) return;

                const monsterBody = monster.sprite.body;

                if (monsterBody && this.Matter.Bounds.contains(monsterBody.bounds, { x: pointer.worldX, y: pointer.worldY })) {
                    if (this.Matter.Vertices.contains(monsterBody.vertices, { x: pointer.worldX, y: pointer.worldY })) {
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
    }


    removeFarTiles(centerX, centerY, scene) {
        const camera = scene.cameras.main;

        const startI = Math.floor((centerX - GAME_CONFIG.CAMERA_WIDTH / 2) / this.tileWidth);
        const endI = Math.ceil((centerX + GAME_CONFIG.CAMERA_WIDTH / 2) / this.tileWidth);
        const startJ = Math.floor((centerY - camera.height / 2) / this.tileWidth);
        const endJ = Math.ceil((centerY + camera.height / 2) / this.tileWidth);

        Object.keys(this.tiles).forEach((key) => {
            const [i, j] = key.split(',').map(Number);
            if (i < startI || i > endI || j < startJ || j > endJ) {
                const tile = this.tiles[key];
                this.tilePool.push(tile); // Add the tile to the pool
                delete this.tiles[key];

                this.items.forEach((item, index) => {
                    if (item && item.sprite.active) {
                        const itemTileI = Math.floor(item.sprite.x / this.tileWidth);
                        const itemTileJ = Math.floor(item.sprite.y / this.tileWidth);
                        if (itemTileI === i && itemTileJ === j) {
                            item.sprite.destroy(); // Destroy the sprite, not the wrapper object
                            this.items.splice(index, 1);
                            this.allEntities = this.allEntities.filter(entity => entity !== item.sprite);
                        }
                    }
                });


                for (let key in this.monsters) {
                    let monster = this.monsters[key];
                    if (monster.sprite && monster.sprite.active) {
                        const monsterTileI = Math.floor(monster.sprite.x / this.tileWidth);
                        const monsterTileJ = Math.floor(monster.sprite.y / this.tileWidth);
                        if (monsterTileI === i && monsterTileJ === j) {
                            scene.gameEvents.cleanUpMonster(monster, null, this.allEntities);
                            this.allEntities = this.allEntities.filter(entity => entity !== monster.sprite);
                            delete this.monsters[key];
                            monster.monsterShadow.destroy();

                        }
                    }
                }

                for (let index = this.ashes.length - 1; index >= 0; index--) {
                    let ashes = this.ashes[index];
                    if (ashes && ashes.active) {
                        const ashesTileI = Math.floor(ashes.x / this.tileWidth);
                        const ashesTileJ = Math.floor(ashes.y / this.tileWidth);
                        if (ashesTileI === i && ashesTileJ === j) {
                            ashes.destroy();
                            this.ashes.splice(index, 1);
                        }
                    }
                }


                for (let index = this.trees.length - 1; index >= 0; index--) {
                    let tree = this.trees[index];
                    if (tree && tree.active) {
                        const treeTileI = Math.floor(tree.x / this.tileWidth);
                        const treeTileJ = Math.floor(tree.y / this.tileWidth);
                        const buffer = 8; // Add a buffer of 2 tiles
                        if (treeTileI < startI - buffer || treeTileI > endI + buffer || treeTileJ < startJ - buffer || treeTileJ > endJ + buffer) { // Check if the tree is out of view
                            this.trees.splice(index, 1);
                            this.matter.world.remove(tree.body);

                            if (this.collidingTree === tree) {
                                this.collidingTree = null;
                            }

                            tree.body.destroy();
                            tree.destroy();
                            tree.shadow.destroy();

                            this.allEntities = this.allEntities.filter(entity => entity !== tree);
                        }
                    }
                }

                for (let index = this.ponds.length - 1; index >= 0; index--) {
                    let pond = this.ponds[index];
                    if (pond && pond.active) {
                        const pondTileI = Math.floor(pond.x / this.tileWidth);
                        const pondTileJ = Math.floor(pond.y / this.tileWidth);
                        const buffer = 3; // Add a buffer of 2 tiles
                        if (pondTileI < startI - buffer || pondTileI > endI + buffer || pondTileJ < startJ - buffer || pondTileJ > endJ + buffer) { // Check if the tree is out of view
                            this.ponds.splice(index, 1);
                            this.matter.world.remove(pond.body);

                            pond.body.destroy();
                            pond.destroy();

                            this.allEntities = this.allEntities.filter(entity => entity !== pond);
                        }
                    }
                }


                for (let index = this.bush1s.length - 1; index >= 0; index--) {
                    let bush1 = this.bush1s[index];
                    if (bush1 && bush1.active) {
                        const bush1TileI = Math.floor(bush1.x / this.tileWidth);
                        const bush1TileJ = Math.floor(bush1.y / this.tileWidth);
                        const buffer = 3; // Add a buffer of 2 tiles
                        if (bush1TileI < startI - buffer || bush1TileI > endI + buffer || bush1TileJ < startJ - buffer || bush1TileJ > endJ + buffer) { // Check if the tree is out of view
                            this.bush1s.splice(index, 1);
                            this.matter.world.remove(bush1.body);

                            if (this.collidingBush1 === bush1) {
                                this.collidingBush1 = null;
                            }

                            bush1.body.destroy();
                            bush1.destroy();
                            bush1.shadow.destroy();

                            this.allEntities = this.allEntities.filter(entity => entity !== bush1);
                        }
                    }
                }

                for (let index = this.fires.length - 1; index >= 0; index--) {
                    let fire = this.fires[index];
                    if (fire && fire.active) {
                        const fireTileI = Math.floor(fire.x / this.tileWidth);
                        const fireTileJ = Math.floor(fire.y / this.tileWidth);
                        if (fireTileI === i && fireTileJ === j) {
                            this.tweens.killTweensOf(fire.light);
                            fire.light.setIntensity(0);
                            this.lights.removeLight(fire.light.x, fire.light.y);
                            this.matter.world.remove(fire.body);
                            this.fires.splice(index, 1);
                            fire.shadow.destroy();
                            fire.body.destroy();
                            fire.timerEvent.remove();
                            fire.destroy();
                        }
                    }
                }
            }
        });
    }
}

export default mainScene;