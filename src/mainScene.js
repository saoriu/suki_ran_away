import Phaser from 'phaser';
import { spawnMonsters } from './spawnMonsters';
import { PlayerState } from './playerState';
import { GAME_CONFIG } from './gameConstants.js';
import { GameEvents } from './GameEvents';
import { regenerateEnergy } from './Energy';
import * as Inventory from './Inventory';
import { preloadFrames } from './preloadFrames';
import { createAnims } from './createAnims';
import { attacks } from './attacks';

export class mainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'mainScene' });
        this.tiles = {};
        this.tileWidth = GAME_CONFIG.TILE_WIDTH * GAME_CONFIG.TILE_SCALE;
        this.cat = null; // Will be set in create()
        this.cursors = null; // Will be set in create()
        this.monsters = {};
        this.tilesBuffer = GAME_CONFIG.TILES_BUFFER;
        this.moveSpeed = PlayerState.speed;
        this.diagonalVelocity = this.moveSpeed / Math.sqrt(2);
        PlayerState.isAttacking = false;
        this.canAttack = true;
        this.attackAnimationKey = null; // Will be set when needed
        this.POSITION_CHANGE_THRESHOLD = 0.1;
        this.Matter = Phaser.Physics.Matter.Matter; // Ensure Matter is correctly imported/referenced
        this.daysPassed = PlayerState.days;
        this.lastUpdateTime = 0;
        this.lastDirection = null;
        this.lastPlayerX = 0;
        this.lastPlayerY = 0;
        this.lastRegenerateEnergyTime = 0;
        this.positionChangeThreshold = 20;
        this.currentAttackName = null;
    }


    preload() {
        const boundPreloadFrames = preloadFrames.bind(this);
        boundPreloadFrames();
    }

    create() {
        const camera = this.cameras.main;
        this.scene.launch('UIScene');
        this.monsters = {};
        camera.setSize(GAME_CONFIG.CAMERA_WIDTH, GAME_CONFIG.CAMERA_HEIGHT); // restrict camera size

        this.cat = this.matter.add.sprite(0, 0, 'sit', null, {
            isStatic: false,
            friction: 0,
        }).setScale(1).setCircle((1) * 45).setDepth(5);

        // Adjust the physics properties of the this.cat
        const catBody = this.cat.body;
        catBody.inertia = Infinity; // Prevent rotation
        catBody.inverseInertia = 0;
        catBody.mass = 1;
        this.cat.body.friction = 0;
        this.cat.body.frictionAir = 0;
        this.cat.setDepth(5)


        this.targetMonsterKey = null;

        this.game.events.on('monsterCleanedUp', (targetMonsterKey) => {
            this.targetMonsterKey = null;
        });

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

        this.input.keyboard.on('keydown', (event) => {
            if (!this.isFainting && this.canAttack) {
                let attackName;

                switch (event.code) {
                    case 'Digit1':
                        attackName = 'scratch';
                        this.handleItemPickup(this.cat);
                        break;
                    case 'Space':
                        attackName = 'scratch';
                        this.handleItemPickup(this.cat);
                        break;
                    case 'Digit2':
                        attackName = PlayerState.selectedAttacks[1] || 'scratch';
                        break;
                    case 'Digit3':
                        attackName = PlayerState.selectedAttacks[2] || 'scratch';
                        break;
                    default:
                        return; // Exit the function if a non-attack key is pressed
                }
                this.currentAttackName = attackName;
        
                if (this.canAttack && attackName !== undefined && !PlayerState.isEating) {
                    this.gameEvents.playerAttack(this.monsters, this.targetMonsterKey, attackName);
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
                        this.attemptToTargetMonster.bind(this)(monster.key);
                    }
                }
            });
        });


    }

    update(time, delta) {
        PlayerState.gameTime += delta / 2000;
        if (PlayerState.gameTime >= 24) {
            PlayerState.gameTime = 0;
            PlayerState.days++;
        }

        if (time - this.lastUpdateTime > 1000) {
            this.game.events.emit('gameTime', PlayerState.gameTime);
            this.game.events.emit('daysPassed', PlayerState.days);
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
            } else if (monster.isHurt) {
                monster.sprite.play(`${monster.event.monster}_hurt`, true);
                monster.sprite.once('animationcomplete', () => {
                    if (monster.sprite && monster.sprite.active) {
                        monster.isHurt = false;
                        monster.sprite.play(`${monster.event.monster}`, true);
                    }
                }, this);
            } else if (monster.isAttacking) {
                //return if the monster ishurt
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

        this.gameEvents.update(this.monsters);


        Object.values(this.monsters).forEach(monsterObj => {
            if (!monsterObj || !monsterObj.sprite || !monsterObj.sprite.active || !monsterObj.healthBar || !monsterObj.sprite.body) return;

            if (!monsterObj.hasOwnProperty('previousHealth')) {
                monsterObj.previousHealth = monsterObj.currentHealth;
            }

            this.updateHealthBar(this, monsterObj.healthBar, monsterObj.currentHealth, monsterObj.maxHealth);

            monsterObj.previousHealth = monsterObj.currentHealth;  // Update previousHealth for the next iteration

            if (monsterObj.sprite) {
                monsterObj.healthBar.outer.x = monsterObj.sprite.x - 30;
                monsterObj.healthBar.outer.y = monsterObj.sprite.y + monsterObj.sprite.height + 55;

                monsterObj.healthBar.fill.x = monsterObj.sprite.x - 28;
                monsterObj.healthBar.fill.y = monsterObj.sprite.y + monsterObj.sprite.height + 55;
            }
        });

        if (this.targetMonsterKey) {
            const monster = this.monsters[this.targetMonsterKey];
            if (monster && !this.isMonsterAttackable(monster, this.currentAttackName)) {
                this.targetMonsterKey = null;
            }
        }

        if (this.lastClickedMonsterKey) {
            const monster = this.monsters[this.lastClickedMonsterKey];
            if (monster && this.isMonsterAttackable(monster, this.currentAttackName)) {
                this.targetMonsterKey = this.lastClickedMonsterKey;
            }
        }

        this.updateTargetMonsterKey.call(this);

    }

    createTilesAround(centerX, centerY, scene) {
        const camera = scene.cameras.main;
        const startI = Math.floor((centerX - GAME_CONFIG.CAMERA_WIDTH / 2 - this.tilesBuffer * this.tileWidth) / this.tileWidth);
        const endI = Math.ceil((centerX + GAME_CONFIG.CAMERA_WIDTH / 2 + this.tilesBuffer * this.tileWidth) / this.tileWidth);
        const startJ = Math.floor((centerY - camera.height / 2 - this.tilesBuffer * this.tileWidth) / this.tileWidth);
        const endJ = Math.ceil((centerY + camera.height / 2 + this.tilesBuffer * this.tileWidth) / this.tileWidth);
        for (let i = startI; i <= endI; i++) {
            for (let j = startJ; j <= endJ; j++) {
                if (!this.tiles[`${i},${j}`]) {
                    const roll = Phaser.Math.FloatBetween(0, 1);
                    let tileType;

                    if (roll <= 0.70) { // 50% chance for tile 1
                        tileType = 1;
                    } else if (roll <= 0.95) { // Additional 35% chance for this.tiles 2-6
                        tileType = Phaser.Math.Between(2, 5);
                    } else if (roll <= 0.97) { // Additional 10% chance for this.tiles 7-8
                        tileType = Phaser.Math.Between(6, 9);
                    } else { // Remaining 5% chance for this.tiles 9-12
                        tileType = Phaser.Math.Between(10, 13);
                    }

                    const tileKey = `tile${tileType}`;
                    const tile = scene.add.image(i * this.tileWidth, j * this.tileWidth, tileKey).setOrigin(0).setScale(GAME_CONFIG.TILE_SCALE);
                    this.tiles[`${i},${j}`] = tile;
                }
            }


        }
        this.cat.setDepth(3);

        spawnMonsters(centerX, centerY, scene, this.tileWidth, this.tilesBuffer, this.monsters, this.daysPassed);
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
            this.lastDirection = 'upLeft';
        } else if (this.cursors.right.isDown && this.cursors.up.isDown) {
            // Handle up-right diagonal movement
            velocityX = this.diagonalVelocity;
            velocityY = -this.diagonalVelocity;
            this.lastDirection = 'upRight';
        } else if (this.cursors.left.isDown && this.cursors.down.isDown) {
            // Handle down-left diagonal movement
            velocityX = -this.diagonalVelocity;
            velocityY = this.diagonalVelocity;
            this.lastDirection = 'downLeft';
        } else if (this.cursors.right.isDown && this.cursors.down.isDown) {
            // Handle down-right diagonal movement
            velocityX = this.diagonalVelocity;
            velocityY = this.diagonalVelocity;
            this.lastDirection = 'downRight';
        } else if (this.cursors.left.isDown) {
            // Handle left movement
            velocityX = -this.moveSpeed;
            this.lastDirection = 'left';
        } else if (this.cursors.right.isDown) {
            // Handle right movement
            velocityX = this.moveSpeed;
            this.lastDirection = 'right';
        } else if (this.cursors.up.isDown) {
            // Handle up movement
            velocityY = -this.moveSpeed;
            this.lastDirection = 'up';
        } else if (this.cursors.down.isDown) {
            // Handle down movement
            velocityY = this.moveSpeed;
            this.lastDirection = 'down';
        }

        if (PlayerState.isAttacking) {
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

    isMonsterAttackable(monster) {
        const attack = attacks[this.currentAttackName]; // Get the attack object from the attacks dictionary
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
            if (this.isMonsterAttackable(monster)) {
                this.targetMonsterKey = key;
            } else {

            }
        } else {

        }
    }

    launchProjectile(targetMonster) {
        if (!targetMonster || !targetMonster.sprite) return;
    
        let projectile = this.add.sprite(this.cat.x, this.cat.y, 'hairballs'); 
        projectile.setDepth(5); 
        projectile.play('hairballs');
    
        let targetX = targetMonster.sprite.x;
        let targetY = targetMonster.sprite.y;
    
        // Animate projectile to target - adjust duration as needed
        this.tweens.add({
            targets: projectile,
            x: targetX,
            y: targetY,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                projectile.destroy();
            }
        });
    }
    


    handlePlayerAnimations(lastDirection, velocityX, velocityY) {

        if (PlayerState.isDead) {
            this.cat.play('dead', true);
            return;
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

    updateTargetMonsterKey() {
        if (this.targetMonsterKey === null) {
            for (const [key, monster] of Object.entries(this.monsters)) {
                if (this.isMonsterAttackable(monster)) {
                    this.targetMonsterKey = key;
                    break;
                }
            }
        }
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

        PlayerState.isDead = true;

        this.isFainting = true;
        PlayerState.isAttacking = false; // Ensure no attack is in progress
        this.cat.anims.stop(); // Stop current animations
        this.cat.play('dead'); // Play death animation

        //reset the colliding this.monsters and colliding monster key:
        this.targetMonsterKey = null;
        this.lastClickedMonsterKey = null;

        // Clear this.monsters and inventory
        Object.values(this.monsters).forEach(monster => this.gameEvents.endBattleForMonster(monster));
        this.monsters = {};
        // In mainScene.js
        let uiScene = this.scene.get('UIScene');
        uiScene.clearInventory();

        // Listen for the 'animationcomplete' event
        this.cat.on('animationcomplete', (animation) => {
            // Check if the completed animation is 'dead'
            if (animation.key === 'dead') {
                this.canAttack = true;
                PlayerState.isDead = false;
                this.isFainting = false;
                PlayerState.energy = 100;
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

        const startI = Math.floor((centerX - GAME_CONFIG.CAMERA_WIDTH / 2 - this.tilesBuffer * this.tileWidth) / this.tileWidth);
        const endI = Math.ceil((centerX + GAME_CONFIG.CAMERA_WIDTH / 2 + this.tilesBuffer * this.tileWidth) / this.tileWidth);
        const startJ = Math.floor((centerY - camera.height / 2 - this.tilesBuffer * this.tileWidth) / this.tileWidth);
        const endJ = Math.ceil((centerY + camera.height / 2 + this.tilesBuffer * this.tileWidth) / this.tileWidth);

        Object.keys(this.tiles).forEach((key) => {
            const [i, j] = key.split(',').map(Number);
            if (i < startI || i > endI || j < startJ || j > endJ) {
                this.tiles[key].destroy();
                delete this.tiles[key];

                // Check for this.monsters in these this.tiles and clean them up
                Object.values(this.monsters).forEach(monster => {
                    if (monster.sprite && monster.sprite.active) {
                        const monsterTileI = Math.floor(monster.sprite.x / this.tileWidth);
                        const monsterTileJ = Math.floor(monster.sprite.y / this.tileWidth);
                        if (monsterTileI === i && monsterTileJ === j) {
                            scene.gameEvents.cleanUpMonster(monster);
                        }
                    }
                });
            }
        });
    }
}

export default mainScene;

