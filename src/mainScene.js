import Phaser from 'phaser';
import { spawnMonsters } from './spawnMonsters';
import { spawnMonsterTree } from './spawnMonsterTree';
import { PlayerState } from './playerState';
import { GAME_CONFIG } from './gameConstants.js';
import { GameEvents } from './GameEvents';
import { regenerateEnergy } from './Energy';
import * as Inventory from './Inventory';
import { preloadFrames } from './preloadFrames';
import { createAnims } from './createAnims';
import { attacks } from './attacks';
import { Item } from './Item';
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
        this.POSITION_CHANGE_THRESHOLD = 0.15;
        this.Matter = Phaser.Physics.Matter.Matter; // Ensure Matter is correctly imported/referenced
        this.lastUpdateTime = 0;
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

    }


    preload() {
        const boundPreloadFrames = preloadFrames.bind(this);
        boundPreloadFrames();
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
                        if (targetMonster && !targetMonster.isColliding) {
                            targetMonster.isColliding = true;
                        }

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
                        if (targetMonster && !targetMonster.isColliding) {
                            targetMonster.isColliding = true;
                        }

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
                        if (targetMonster && !targetMonster.isColliding) {
                            targetMonster.isColliding = true;
                        }

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


        this.game.events.emit('gameTime', PlayerState.gameTime);
        this.game.events.emit('daysPassed', PlayerState.days);

        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.collidingWithTree && this.canAttack) {
                this.chopTree(this.collidingTree);
            }
        });

        this.input.keyboard.on('keydown', (event) => {
            if (!this.isFainting && this.canAttack) {
                let attackName;

                switch (event.code) {
                    case 'Digit1':
                        attackName = PlayerState.selectedAttacks[1] || 'scratch';
                        break;
                    case 'Digit2':
                        attackName = PlayerState.selectedAttacks[2] || 'scratch';
                        break;
                    case 'Digit3':
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
                        //clear the target monster key
                        this.targetMonsterKey = null;
                        this.attemptToTargetMonster.bind(this)(monster.key);
                    }
                }
            });
        });
    }

    update(time, delta) {
        PlayerState.gameTime += delta / 12000;
        if (PlayerState.gameTime >= 24) {
            PlayerState.gameTime = 0;
            PlayerState.days++;
            this.game.events.emit('daysPassed', PlayerState.days);
        }

        if (time - this.lastUpdateTime > 1500) {
            this.game.events.emit('gameTime', PlayerState.gameTime);
            this.spawnMonstersOnly(this.cat.x, this.cat.y, this);
            this.lastUpdateTime = time;
        }

        this.updateTooltip.call(this);

        this.handlePlayerMovement();

        if (time - this.lastRegenerateEnergyTime > 1000) { // 1000 ms = 1 second
            regenerateEnergy(this);
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

        //Check if player is within monster attack range
        Object.values(this.monsters).forEach(monster => {
            const distance = this.calculateDistance(this.cat, monster);
            if (distance <= monster.attackRange) {
                monster.canReach = true;
            } else {
                monster.canReach = false;
            }
        });



        if (PlayerState.isAttacking && this.targetMonsterKey) {
            this.cat.flipX = (this.lastDirection === 'left' || this.lastDirection === 'upLeft' || this.lastDirection === 'downLeft');
        }

        else if (PlayerState.isAttacking && !PlayerState.isDead) {
            this.cat.flipX = (this.lastDirection === 'left' || this.lastDirection === 'upLeft' || this.lastDirection === 'downLeft');
        }

        //Monster animations
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
                this.allEntities = this.allEntities.filter(entity => entity !== monster.sprite);
            } else if (monster.isTweening) {
                monster.sprite.play(`${monster.event.monster}_fall`, true);
            } else if (monster.isHurt) {
                monster.sprite.play(`${monster.event.monster}_hurt`, true);
                monster.sprite.once('animationcomplete', () => {
                    if (monster.sprite && monster.sprite.active) {
                        monster.isHurt = false;
                        monster.sprite.play(`${monster.event.monster}`, true);
                    }
                }, this);
            } else if (monster.isAttacking && monster.canReach) {
                this.gameEvents.monsterAttack(this.monsters, monster.key);
                monster.sprite.play(`${monster.event.monster}_attack`, true);
                monster.sprite.once('animationcomplete', (animation) => {
                    if (animation.key === `${monster.event.monster}_attack`) {
                        monster.isAttacking = false;
                    }
                }, this);
            } else if (monster.isMoving && !monster.sprite.anims.isPlaying) {
                monster.sprite.play(`${monster.event.monster}_run`, true);
            } else if (!monster.sprite.anims.isPlaying) {
                monster.sprite.play(`${monster.event.monster}`, true);
            }
        });

        this.gameEvents.update(this.monsters);



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
                        } else {
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

        //delete monster if stuck inside an ibject like a tree, pond, or bush1



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

        // Check if the tree is in front of the player
        if (!this.isObjectInFront(this.cat, tree, this.lastDirection)) {
            return;
        }

        // Flicker tree sprite
        tree.setTint(0xffffff);

        // Decide to drop a log, deplete the tree, or spawn a monster
        let randomValue = Math.random();

        // Calculating the probability of dropping a log, including the treesBonus.
        const logDropProbability = 0.7 + PlayerState.treesBonus / 100;
        // Logic for dropping a log
        const randomX = tree.x + 100 + Math.random() * 25;
        const randomY = tree.y + 50 + Math.random() * 30;

        if (randomValue < logDropProbability) {
            this.dropLog(randomX, randomY);
        } else {
            // Calculate the remaining probability after considering the log drop.
            const remainingProbability = 1 - logDropProbability;
            // Split the remaining probability into 3 parts, 2 parts for depleting and 1 part for monster spawning.
            const depleteProbability = remainingProbability * (3 / 4);
            // Adjust the check for depleting to take into account the logDropProbability
            if (randomValue < logDropProbability + depleteProbability) {
                // Logic for tree depleting
                tree.isDepleted = true;
                tree.setTexture('tree-down');
                tree.anims.stop();

                setTimeout(() => {
                    if (tree.active) {
                        tree.setTexture('tree');
                        tree.isDepleted = false;
                        //play tree anim
                        tree.play('tree');
                    }
                }, 10000);
            } else {
                spawnMonsterTree(tree.x, tree.y, this, this.tileWidth, this.monsters, this.allEntities);
            }
        }

    }


    dropLog(x, y) {
        const log = new Item(this, x, y, 'log', {
            name: 'log',
            quantity: 1,
            effects: {} // Replace with actual effects if any
        });

        // Add the log to the scene
        this.add.existing(log);

        //set depth to 1
        log.sprite.setDepth(0);

        // Show the log and then start the tween
        log.show();

        // Create a tween that moves the log downwards
        this.tweens.add({
            targets: log.sprite, // Make sure to target the sprite
            y: y + 50, // Change this value to control how far the log drops
            duration: 1000, // Change this value to control how fast the log drops
            ease: 'Cubic.easeOut', // Change this to control the easing function
            onComplete: () => {
                // Push the log to the items array after the tween completes
                this.items.push(log);
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

        const fireProbability = 0.5 * (1 + PlayerState.exploreBonus / 100);
        const randomFireFloat = Phaser.Math.FloatBetween(0, 1);
        if (randomFireFloat < fireProbability) {

            this.spawnFire();

        }


        const treeProbability = 0.99;
        const randomTreeFloat = Phaser.Math.FloatBetween(0, 1);
        if (randomTreeFloat < treeProbability) {
            //call a random number of times, between 1 and 4
            const randomNumberOfTrees = Phaser.Math.Between(1, 6);
            for (let i = 0; i < randomNumberOfTrees; i++) {

                this.spawnTrees();
            }
        }


        const pondProbability = 0.60;
        const randomPondFloat = Phaser.Math.FloatBetween(0, 1);
        if (randomPondFloat < pondProbability) {
            const randomNumberOfPonds = Phaser.Math.Between(1, 2);

            for (let i = 0; i < randomNumberOfPonds; i++) {

                this.spawnPonds();
            }
        }

        const bush1Probability = 0.99;
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
            const attackSpeedReductionFactor = 0.25;
            velocityX *= attackSpeedReductionFactor;
            velocityY *= attackSpeedReductionFactor;
        }

        this.cat.setVelocity(velocityX, velocityY);
        this.handlePlayerAnimations(this.lastDirection, velocityX, velocityY);
    }

    updateTargetMonsterKey(attackName) {
        // If a monster has been clicked, check if it's attackable
        if (this.lastClickedMonsterKey) {
            const clickedMonster = this.monsters[this.lastClickedMonsterKey];
            if (clickedMonster && this.isMonsterAttackable(clickedMonster, attackName)) {
                this.targetMonsterKey = this.lastClickedMonsterKey;
                return;
            }
        }

        // If the clicked monster is not attackable or if no monster has been clicked,
        // find another attackable monster
        if (this.targetMonsterKey === null) {
            for (const [key, monster] of Object.entries(this.monsters)) {
                if (this.isMonsterAttackable(monster, attackName)) {
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

        fire.setOrigin(0.5, 0.5);
        fire.setPipeline('Light2D');
        fire.play('fire');

        this.matter.body.setStatic(fire.body, true);

        //this matter worls is sensor so the player can walk through it
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

        this.fires.forEach((fire, index) => {
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

                                // Check if the fire body exists before destroying it
                                if (fire.body) {
                                    fire.body.destroy();
                                }

                                // Check if the fire object exists before destroying it
                                if (fire) {
                                    fire.destroy();
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
                            }
                        } else {
                            if (fire && fire.active) {
                                const timeLeft = Math.round((fire.endTime - Date.now()) / 1000);
                                const proportion = Math.min(timeLeft / 15, 1); // Cap the proportion at 1

                                // Set the intensity proportional to the time left, capped at 1.8
                                const intensity = 1.7 * proportion;
                                fire.light.setIntensity(intensity);
                            }
                        }
                    },
                    loop: true
                });

            }
        });
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
            closestFire.endTime += 30000;
            const log = this.add.sprite(closestFire.x + 4, closestFire.y + 25, 'log').setOrigin(0.5, 1).setDepth(2).setPipeline('Light2D');
            //add label log
            log.label = 'log';

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

        const bufferStartI = visibleStartI - (this.tilesBuffer + 5); // extend outward by 1 tile
        const bufferEndI = visibleEndI + (this.tilesBuffer + 5);    // extend outward by 1 tile
        const bufferStartJ = visibleStartJ - (this.tilesBuffer + 5); // extend outward by 1 tile
        const bufferEndJ = visibleEndJ + (this.tilesBuffer + 5);   // extend outward by 1 tile

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

        if (this.trees.filter(tree => tree.active && !tree.isDepleted).length >= 8) {
            return;
        }

        // Create a custom shape using a polygon body
        const treeVertices = this.createTreeVertices(x, y);
        const treeBody = this.matter.add.fromVertices(x, y, treeVertices, {
            isStatic: true
        }, true);

        treeBody.label = 'tree';

        const tree = this.matter.add.sprite(x, y, 'tree', null, {
            label: 'tree'
        }).setExistingBody(treeBody); // Set the depth to be proportional to the y-coordinate

        tree.setOrigin(0.5, 0.85);
        tree.setPipeline('Light2D');
        if (!tree.isDepleted) {
            tree.play('tree');
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

        tree.chopCount = 0;
        tree.isDepleted = false;



        this.trees.push(tree);
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

        // If there are already 2 trees in the view, don't spawn a new one
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
        vertices.push({ x: x - 20, y: y - 50 }); // Top left (short base)
        vertices.push({ x: x + 20, y: y - 50 }); // Top right (short base)
        vertices.push({ x: x + 60, y: y }); // Middle right
        vertices.push({ x: x + 100, y: y + 10 }); // New vertex between middle right and bottom right
        vertices.push({ x: x + 100, y: y + 30 }); // Bottom right (long base)
        vertices.push({ x: x - 100, y: y + 30 }); // Bottom left (long base)
        vertices.push({ x: x - 100, y: y + 10 }); // New vertex between middle left and bottom left
        vertices.push({ x: x - 60, y: y }); // Middle left

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
        if (this.bush1s.filter(bush1 => bush1.active).length >= 2) {
            return;
        }

        const bush1 = this.matter.add.sprite(x, y, 'bush1', null);

        // Approximate an ellipse using a polygon body
        const ellipseVertices = this.createEllipseVertices(x, y, 50, 50, 16);
        const bush1Body = this.matter.add.fromVertices(x, y, ellipseVertices, {
            isStatic: true
        }, true);

        bush1Body.label = 'bush1';

        bush1.setExistingBody(bush1Body).setOrigin(0.5, 0.6);
        bush1.setPipeline('Light2D');
        bush1.play('bush1');

        this.bush1s.push(bush1);
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
                    break;
                case 'down':
                    this.cat.play('sit-forward', true);
                    break;
                default:
                    this.cat.play('sit', true);
                    break;
            }
        } else
            // Handle movement animations
            if (this.lastDirection === 'left') {
                this.cat.play('run', true);
                this.cat.flipX = true; // flip when moving left
            } else if (this.lastDirection === 'right') {
                this.cat.play('run', true);
                this.cat.flipX = false; // don't flip when moving right
            } else if (this.lastDirection === 'up') {
                this.cat.play('up', true);
            } else if (this.lastDirection === 'down') {
                this.cat.play('down', true);
            }
            else if (this.lastDirection === 'upLeft') {
                this.cat.play('run-diagonal-back', true);
                this.cat.flipX = true;
            }
            else if (this.lastDirection === 'upRight') {
                this.cat.play('run-diagonal-back', true);
                this.cat.flipX = false;
            }
            else if (this.lastDirection === 'downLeft') {
                this.cat.play('run-diagonal-front', true);
                this.cat.flipX = true;
            }
            else if (this.lastDirection === 'downRight') {
                this.cat.play('run-diagonal-front', true);
                this.cat.flipX = false;
            }
    }

    updateTimeCircle(gameTime) {
        // Define a color scale
        const colorScale = chroma.scale([
            '#404040', // Midnight (0)
            '#000080', // Early morning (3)
            '#87CEEB', // Morning (6)
            '#E0FFFF', // Midday (12)
            '#87CEEB', // Afternoon (18)
            '#000080', // Evening (21)
            '#404040' // Night (24)
        ]).mode('lch').domain([0, 3, 6, 12, 18, 21, 24]);

        // Get the color for the current game time
        let color = colorScale(gameTime).hex().substring(1);

        // Convert the color to a number
        color = parseInt(color, 16);

        // Set the ambient color
        this.lights.setAmbientColor(color);
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

            this.monsters = {};
        });

        // In mainScene.js
        let uiScene = this.scene.get('UIScene');
        uiScene.clearInventory();

        // Listen for the 'animationcomplete' event
        this.cat.on('animationcomplete', (animation) => {
            if (animation.key === 'dead') {
                PlayerState.isUnderAttack = false;
                this.canAttack = true;
                PlayerState.isDead = false;
                //emit event to update energy
                this.isFainting = false;
                PlayerState.energy = 100;
                this.game.events.emit('energyUpdate', PlayerState.energy);
            }
        }, this);
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


                Object.values(this.monsters).forEach(monster => {
                    if (monster.sprite && monster.sprite.active) {
                        const monsterTileI = Math.floor(monster.sprite.x / this.tileWidth);
                        const monsterTileJ = Math.floor(monster.sprite.y / this.tileWidth);
                        if (monsterTileI === i && monsterTileJ === j) {
                            scene.gameEvents.cleanUpMonster(monster, null, this.allEntities);
                            this.allEntities = this.allEntities.filter(entity => entity !== monster.sprite);
                        }
                    }
                });

                this.ashes.forEach((ashes, index) => {
                    if (ashes && ashes.active) {
                        const ashesTileI = Math.floor(ashes.x / this.tileWidth);
                        const ashesTileJ = Math.floor(ashes.y / this.tileWidth);
                        if (ashesTileI === i && ashesTileJ === j) {
                            ashes.destroy();
                            this.ashes.splice(index, 1);
                        }
                    }
                });


                this.trees.forEach((tree, index) => {
                    if (tree && tree.active) {
                        const treeTileI = Math.floor(tree.x / this.tileWidth);
                        const treeTileJ = Math.floor(tree.y / this.tileWidth);
                        const buffer = 5; // Add a buffer of 2 tiles
                        if (treeTileI < startI - buffer || treeTileI > endI + buffer || treeTileJ < startJ - buffer || treeTileJ > endJ + buffer) { // Check if the tree is out of view
                            this.trees.splice(index, 1);

                            this.matter.world.remove(tree.body);

                            // If the tree being destroyed is the same as collidingTree, set collidingTree to null
                            if (this.collidingTree === tree) {
                                this.collidingTree = null;
                            }

                            tree.body.destroy();
                            tree.destroy();

                            this.allEntities = this.allEntities.filter(entity => entity !== tree);

                        }
                    }
                });

                this.ponds.forEach((pond, index) => {
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
                });


                this.bush1s.forEach((bush1, index) => {
                    if (bush1 && bush1.active) {
                        const bush1TileI = Math.floor(bush1.x / this.tileWidth);
                        const bush1TileJ = Math.floor(bush1.y / this.tileWidth);
                        const buffer = 3; // Add a buffer of 2 tiles
                        if (bush1TileI < startI - buffer || bush1TileI > endI + buffer || bush1TileJ < startJ - buffer || bush1TileJ > endJ + buffer) { // Check if the tree is out of view
                            this.bush1s.splice(index, 1);
                            this.matter.world.remove(bush1.body);

                            bush1.body.destroy();
                            bush1.destroy();

                            this.allEntities = this.allEntities.filter(entity => entity !== bush1);

                        }
                    }
                });


                this.fires.forEach((fire, index) => {
                    if (fire && fire.active) {
                        const fireTileI = Math.floor(fire.x / this.tileWidth);
                        const fireTileJ = Math.floor(fire.y / this.tileWidth);
                        if (fireTileI === i && fireTileJ === j) {
                            this.tweens.killTweensOf(fire.light);
                            // Turn off the light associated with the fire
                            fire.light.setIntensity(0);

                            // Remove the light from the LightManager's list of lights
                            this.lights.removeLight(fire.light.x, fire.light.y);

                            // Destroy the fire body
                            this.matter.world.remove(fire.body);

                            // Remove the fire from the fires array before destroying it
                            this.fires.splice(index, 1);

                            //destroy the fire body
                            fire.body.destroy();

                            fire.timerEvent.remove();

                            // Destroy the fire
                            fire.destroy();
                        }
                    }
                });
            }
        });
    }
}

export default mainScene;

