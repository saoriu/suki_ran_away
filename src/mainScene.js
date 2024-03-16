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
import { eventOptions } from './eventOptions.js';
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
        this.collarParams = {
            x: 0,
            y: 0,
            texture: null,
            scale: 1,
            depth: 5,
            pipeline: 'Light2D',
            label: 'collar',
            light: {
                color: 0xffffcc,
                x: null,
                y: null,
                intensity: 1.5,
                radius: 100,
                falloff: 1,
                angle: 0,
                penumbra: 0
            }
        };
        this.isDashing = false;
        this.mazeSpawned = false;
        this.ashes = [];
        this.tileWidth = GAME_CONFIG.TILE_WIDTH;
        this.cat = null; // Will be set in create()
        this.cursors = null; // Will be set in create()
        this.monsters = {};
        this.currentCollarName = null;
        this.tilesBuffer = GAME_CONFIG.TILES_BUFFER;
        this.diagonalVelocity = (PlayerState.speed / Math.sqrt(2));
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
        this.treePool = [];
        this.trees = [];
        this.treeShadowPool = [];
        this.fires = [];
        this.tilePool = [];
        this.ponds = [];
        this.pond = [];
        this.bushs = [];
        this.bush = [];
        this.lastRegenerateEnergyTime = 0;
        this.positionChangeThreshold = 0.025 * this.tileWidth;
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

        this.checkCollar();
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


        // Loop through each event option
        eventOptions.forEach(option => {
            // Get the monster type and atlas
            let monsterType = option.monster;
            let atlasKey = option.atlas;

            // Get the frame data
            let frameName = atlasKey === 'monsters' ? `${monsterType}_idle-1` : `${monsterType}-1`;
            let frameData = this.textures.getFrame(atlasKey, frameName);

            // Calculate the trimmed dimensions
            let trimmedWidth = frameData.cutWidth;
            let trimmedHeight = frameData.cutHeight;

            // Create a new canvas texture for the shadow
            let shadowTexture1 = this.textures.createCanvas(`${monsterType}Shadow1`, trimmedWidth, trimmedHeight);
            let ctx = shadowTexture1.getContext();

            // Define the square size and radii
            let squareSize = 3; // Size of the squares
            let radiusX = trimmedWidth / 2.8; // Radius along the x axis
            let radiusY = radiusX / 3; // Radius along the y axis

            // Draw the shadow using the square approach
            for (let y = 0; y < trimmedHeight; y += squareSize) {
                for (let x = 0; x < trimmedWidth; x += squareSize) {
                    let distX = Math.abs(x + squareSize / 2 - trimmedWidth / 2) / radiusX;
                    let distY = Math.abs(y + squareSize / 2 - trimmedHeight / 2) / radiusY;
                    let dist = Math.sqrt(distX * distX + distY * distY);

                    if (dist < 1) {
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(x, y, squareSize, squareSize);
                    }
                }
            }

            // Refresh the texture
            shadowTexture1.refresh();

            let shadowTexture2 = this.textures.createCanvas(`${monsterType}Shadow2`, trimmedWidth, trimmedHeight);
            ctx = shadowTexture2.getContext();

            // Define the square size and radii
            squareSize = 4; // Size of the squares
            radiusX = trimmedWidth / 2.5; // Radius along the x axis
            radiusY = radiusX / 3; // Radius along the y axis

            for (let y = 0; y < trimmedHeight; y += squareSize) {
                for (let x = 0; x < trimmedWidth; x += squareSize) {
                    let distX = Math.abs(x + squareSize / 2 - trimmedWidth / 2) / radiusX;
                    let distY = Math.abs(y + squareSize / 2 - trimmedHeight / 2) / radiusY;
                    let dist = Math.sqrt(distX * distX + distY * distY);

                    if (dist < 1) {
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(x, y, squareSize, squareSize);
                    }
                }
            }

            // Refresh the texture
            shadowTexture2.refresh();

            // Create an animation with the shadow texture
            this.anims.create({
                key: `${monsterType}ShadowAnimation`,
                frames: [{ key: `${monsterType}Shadow1` }, { key: `${monsterType}Shadow2` }],
                frameRate: 3, // Adjust this value to your needs
                repeat: -1 // This will make the animation loop indefinitely
            });
        });

        //Gametime manipulation

        this.input.keyboard.on('keydown-P', () => {
            PlayerState.gameTime = 10;
        });

        this.input.keyboard.on('keydown-O', () => {
            PlayerState.gameTime = 23;
        });


        // Create a new canvas texture for the small shadow
        let smallTexture = this.textures.createCanvas('smallShadow', 32, 32);
        let ctx = smallTexture.getContext();
        let squareSize = 2; // Size of the squares
        let radiusX = 23; // Radius along the x axis
        let radiusY = 8; // Radius along the y axis

        for (let y = 0; y < 32; y += squareSize) {
            for (let x = 0; x < 32; x += squareSize) {
                let distX = Math.abs(x + squareSize / 2 - 16) / radiusX;
                let distY = Math.abs(y + squareSize / 2 - 16) / radiusY;
                let dist = Math.sqrt(distX * distX + distY * distY);

                if (dist < 1) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x, y, squareSize, squareSize);
                }
            }
        }
        smallTexture.refresh();

        let mediumTexture = this.textures.createCanvas('mediumShadow', 48, 48);
        ctx = mediumTexture.getContext();
        squareSize = 3; // Size of the squares
        radiusX = 28; // Radius along the x axis
        radiusY = 10; // Radius along the y axis

        for (let y = 0; y < 48; y += squareSize) {
            for (let x = 0; x < 48; x += squareSize) {
                let distX = Math.abs(x + squareSize / 2 - 24) / radiusX;
                let distY = Math.abs(y + squareSize / 2 - 24) / radiusY;
                let dist = Math.sqrt(distX * distX + distY * distY);

                if (dist < 1) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x, y, squareSize, squareSize);
                }
            }
        }
        mediumTexture.refresh();

        // Create a new canvas texture for the large shadow
        let largeTexture = this.textures.createCanvas('largeShadow', 64, 64);
        ctx = largeTexture.getContext();
        squareSize = 4; // Size of the squares
        radiusX = 32; // Radius along the x axis
        radiusY = 13; // Radius along the y axis

        for (let y = 0; y < 64; y += squareSize) {
            for (let x = 0; x < 64; x += squareSize) {
                let distX = Math.abs(x + squareSize / 2 - 32) / radiusX;
                let distY = Math.abs(y + squareSize / 2 - 32) / radiusY;
                let dist = Math.sqrt(distX * distX + distY * distY);

                if (dist < 1) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x, y, squareSize, squareSize);
                }
            }
        }
        largeTexture.refresh();

        // Create an animation with the two textures
        this.anims.create({
            key: 'shadowAnimation',
            frames: [
                { key: 'smallShadow' },
                { key: 'mediumShadow' },
                { key: 'largeShadow' }
            ],
            frameRate: 6, // Adjust this value to your needs
            repeat: -1 // This will make the animation loop indefinitely
        });

        // Create the shadow sprite using the animation
        this.catShadow = this.add.sprite(0, 0, 'largeShadow');

        // Set the pipeline, depth, and blend mode as before
        this.catShadow.setPipeline('Light2D');
        this.catShadow.depth = 1;
        this.catShadow.setBlendMode(Phaser.BlendModes.MULTIPLY);




        // Create a new canvas texture for the small shadow
        let treeShadowTexture = this.textures.createCanvas('treeShadow', 64 * 3.5, 64 * 2.8);
        ctx = treeShadowTexture.getContext();
        squareSize = 4; // Size of the squares
        radiusX = 32 * 3.5; // Radius along the x axis
        radiusY = 13 * 2.8; // Radius along the y axis

        for (let y = 0; y < 64 * 2.8; y += squareSize) {
            for (let x = 0; x < 64 * 3.5; x += squareSize) {
                let distX = Math.abs(x + squareSize / 2 - 32 * 3.5) / radiusX;
                let distY = Math.abs(y + squareSize / 2 - 32 * 2.8) / radiusY;
                let dist = Math.sqrt(distX * distX + distY * distY);

                if (dist < 1) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x, y, squareSize, squareSize);
                }
            }
        }
        treeShadowTexture.refresh();

        // Create a new canvas texture for the small shadow
        let treeShadowTexture2 = this.textures.createCanvas('treeShadow2', 64 * 3.6, 64 * 2.8);
        ctx = treeShadowTexture2.getContext();
        squareSize = 5; // Size of the squares
        radiusX = 32 * 3.6; // Radius along the x axis
        radiusY = 13 * 2.8; // Radius along the y axis

        for (let y = 0; y < 64 * 2.8; y += squareSize) {
            for (let x = 0; x < 64 * 3.6; x += squareSize) {
                let distX = Math.abs(x + squareSize / 2 - 32 * 3.6) / radiusX;
                let distY = Math.abs(y + squareSize / 2 - 32 * 2.8) / radiusY;
                let dist = Math.sqrt(distX * distX + distY * distY);

                if (dist < 1) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x, y, squareSize, squareSize);
                }
            }
        }
        treeShadowTexture2.refresh();

        this.targetMonsterKey = null;


        this.anims.create({
            key: 'treeshadowAnimation',
            frames: [
                { key: 'treeShadow' },
                { key: 'treeShadow2' },
            ],
            frameRate: 2, // Adjust this value to your needs
            repeat: -1 // This will make the animation loop indefinitely
        });


        // Create a new canvas texture for the small shadow
        let treeShadowTexture3 = this.textures.createCanvas('treeShadow3', 64 * 3, 64 * 2.2);
        ctx = treeShadowTexture3.getContext();
        squareSize = 4; // Size of the squares
        radiusX = 32 * 3; // Radius along the x axis
        radiusY = 13 * 2.2; // Radius along the y axis

        for (let y = 0; y < 64 * 2.2; y += squareSize) {
            for (let x = 0; x < 64 * 3; x += squareSize) {
                let distX = Math.abs(x + squareSize / 2 - 32 * 3) / radiusX;
                let distY = Math.abs(y + squareSize / 2 - 32 * 2.2) / radiusY;
                let dist = Math.sqrt(distX * distX + distY * distY);

                if (dist < 1) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x, y, squareSize, squareSize);
                }
            }
        }
        treeShadowTexture3.refresh();

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

        this.updateTimeCircle();

    

        this.matter.world.on('collisionactive', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;

                const isPlayer = bodyA.label === 'player' || bodyB.label === 'player';
                const isTree = bodyA.parent.label === 'tree' || bodyB.parent.label === 'tree';
                const isPond = bodyA.parent.label === 'pond' || bodyB.parent.label === 'pond';
                const isBush = bodyA.parent.label === 'bush' || bodyB.parent.label === 'bush';

                if (isPlayer && (isTree || isPond || isBush)) {
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
                const isBush = bodyA.parent.label === 'bush' || bodyB.parent.label === 'bush';

                if (isPlayer && (isTree || isPond || isBush)) {
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
                const isBush = bodyA.parent.label === 'bush' || bodyB.parent.label === 'bush';

                if (isPlayer && isBush) {
                    let bushBody = bodyA.parent.label === 'bush' ? bodyA.parent : bodyB.parent;

                    if (bushBody) {
                        this.collidingWithBush = true;
                        this.collidingBush = bushBody.gameObject; // Store the tree GameObject
                    }
                }
            });
        });

        this.matter.world.on('collisionend', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;

                const isPlayer = bodyA.label === 'player' || bodyB.label === 'player';
                const isBush = bodyA.parent.label === 'bush' || bodyB.parent.label === 'bush';

                if (isPlayer && isBush) {
                    let bushBody = bodyA.parent.label === 'bush' ? bodyA.parent : bodyB.parent;

                    if (bushBody.gameObject === this.collidingBush) {
                        this.collidingWithBush = false;
                        this.collidingBush = null;
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
            if (this.collidingBush && this.canAttack) {
                this.searchBush(this.collidingBush);
            }
        });

        this.input.keyboard.on('keydown', (event) => {
            if (!this.isFainting && this.canAttack) {
                let attackName;

                if (!PlayerState.isMenuOpen) {


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
                            if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                            }
                            this.lastDirection = 'up';
                            break;
                        case 'down':
                            this.attackAnimationKey = `attack${attackNumber}-front`;
                            if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                            }
                            this.lastDirection = 'down';
                            break;
                        case 'left':
                            this.attackAnimationKey = `attack${attackNumber}`;
                            if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                            }
                            this.lastDirection = 'left';
                            break;
                        case 'right':
                            this.attackAnimationKey = `attack${attackNumber}`;
                            if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                            }
                            this.lastDirection = 'right';
                            break;
                        case 'upLeft':
                            this.attackAnimationKey = `attack${attackNumber}`;
                            if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                            }
                            this.lastDirection = 'upLeft';
                            break;
                        case 'upRight':
                            this.attackAnimationKey = `attack${attackNumber}`;
                            if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                            }
                            this.lastDirection = 'upRight';
                            break;
                        case 'downLeft':
                            this.attackAnimationKey = `attack${attackNumber}`;
                            if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                            }
                            this.lastDirection = 'downLeft';
                            break;
                        case 'downRight':
                            this.attackAnimationKey = `attack${attackNumber}`;
                            if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                            }
                            this.lastDirection = 'downRight';
                            break;
                        default:
                            this.attackAnimationKey = `attack${attackNumber}`;
                            if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                            }
                            break;
                    }
                    // Start the new animation
                    this.cat.play(this.attackAnimationKey, true);
                    this.checkCollarAnims(this.attackAnimationKey)
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
        this.allEntities.push(this.collar);
        

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
                                thickness: 3,
                                outlineColor: 0xc41c00
                            });
                        }
                    }
                }
            });
        });
    }

    update(time, delta) {

        PlayerState.gameTime += delta / 30000;
        if (PlayerState.gameTime >= 24) {
            PlayerState.gameTime = 0;
            PlayerState.days++;
        }

        if (time - this.lastSpawnTime2 > 30000) {
            this.spawnMonstersOnly(this.cat.x, this.cat.y, this);
            this.lastSpawnTime2 = time;
        }

        this.updateTimeCircle();

        this.updateTooltip.call(this);

        this.handlePlayerMovement(delta);

        if (time - this.lastRegenerateEnergyTime > 1000) { // 1000 ms = 1 second
            regenerateEnergy(this);
            this.game.events.emit('energyChanged');

            this.lastRegenerateEnergyTime = time; // Update last call time
        }

        if (PlayerState.energy <= 0 && !this.isFainting) {
            this.handlePlayerDeath.call(this);
        }


        if (this.cat.body.velocity.x !== 0 || this.cat.body.velocity.y !== 0 || PlayerState.isAttacking) {
            // If the cat is running, play the animation
            this.catShadow.play('shadowAnimation', true);
        } else {
            // If the cat is not running, stop the animation
            this.catShadow.anims.stop();
            //set shadow to large
            this.catShadow.setTexture('largeShadow');
        }

        //monster shadow ${monsterType}ShadowAnimation animation play when moving
        Object.values(this.monsters).forEach(monster => {
            if (!monster || !monster.sprite || !monster.sprite.active) return;

            const deltaX = Math.abs(monster.sprite.body.positionPrev.x - monster.sprite.body.position.x);
            const deltaY = Math.abs(monster.sprite.body.positionPrev.y - monster.sprite.body.position.y);

            if (deltaX > this.POSITION_CHANGE_THRESHOLD || deltaY > this.POSITION_CHANGE_THRESHOLD || monster.isAttacking) {
                monster.monsterShadow.play(`${monster.name}ShadowAnimation`, true);
            } else {
                monster.monsterShadow.anims.stop();
                monster.monsterShadow.setTexture(`${monster.name}Shadow2`);
            }
        });

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
            if (this.cat) {
                this.cat.flipX = (this.lastDirection === 'left' || this.lastDirection === 'upLeft' || this.lastDirection === 'downLeft');
            }
            if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null && this.collar) {
                this.collar.flipX = (this.lastDirection === 'left' || this.lastDirection === 'upLeft' || this.lastDirection === 'downLeft');
            }
        } else if (PlayerState.isAttacking && !PlayerState.isDead) {
            if (this.cat) {
                this.cat.flipX = (this.lastDirection === 'left' || this.lastDirection === 'upLeft' || this.lastDirection === 'downLeft');
            }
            if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null && this.collar) {
                this.collar.flipX = (this.lastDirection === 'left' || this.lastDirection === 'upLeft' || this.lastDirection === 'downLeft');
            }
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
                    } else {
                        tree.setAlpha(1);
                    }
                } else {
                    tree.setAlpha(1);
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


            if (monster.currentHealth < 1) {
                //on monster death move the monsterShadow y 25px down
                monster.monsterShadow.y -= 15;
                monster.sprite.play(`${monster.event.monster}_die`, true);
                this.allEntities = this.allEntities.filter(entity => entity !== monster.sprite);

                if (monster.aggroSprite) {
                    this.allEntities = this.allEntities.filter(entity => entity !== monster.aggroSprite);
                    monster.aggroSprite.destroy();
                }
                
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
            } else if (monster.isAttacking && monster.canReach && monster.attackComplete) {
                monster.attackComplete = false;
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

        this.gameEvents.update(this.monsters, this.allEntities, delta);


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


        // Step 1: Calculate all depths
        this.allEntities.forEach((entity) => {
            if (entity.label === 'log') {
                let treeDepth = entity.parentTree.depth;
                entity.setDepth(treeDepth);
            } else if (entity.label === 'fruit') {
                let bushDepth = entity.parentBush.depth;
                entity.setDepth(bushDepth);
            } else if (entity.label === 'treeShadow') {
                let treeDepth = entity.parentTree ? entity.parentTree.depth : (entity.y / 10);
                entity.setDepth(treeDepth - 5); // Slightly behind the tree regardless of 'y'

            } else if (entity.label === 'collar') {
                if (entity.depth === null) {
                    entity.setDepth(2);
                } else {
                    entity.setDepth(6 + (entity.y / 10));
                }
            }
            else if (entity.label === 'aggro') {
                if (entity.depth === null) {
                    entity.setDepth(1);
                } else {
                    entity.setDepth(15 + (entity.y / 10));
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
                            entity.setDepth(5 + (entity.y / 10));
                        }
                    } else if (entity.body.label === 'pond') {
                        entity.setDepth((entity.y - 250) / 10);
                    } else {
                        if (entity.depth === null) {
                            entity.setDepth(1);
                        } else { //trees and other entities
                            entity.setDepth(5 + (entity.y / 10));
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

        this.fires.forEach((fire) => {
            if (fire && fire.active) {
                const fireBody = fire.body;

                const fireCenterX = fireBody.position.x;
                const fireCenterY = fireBody.position.y;

                const dx = this.cat.x - fireCenterX;
                const dy = this.cat.y - fireCenterY;
                const distanceInTiles = Math.sqrt(dx * dx + dy * dy) / this.tileWidth;

                // Check if the player is near the fire
                if (distanceInTiles <= 2.5) {
                    PlayerState.isNearFire = true;
                } else {
                    PlayerState.isNearFire = false;
                }

                // Check if the player is being attacked by the fire
                if (distanceInTiles <= 1.1) {
                    this.fireAttack(fire);
                }
            }
        }); 

        Object.values(this.monsters).forEach(monster => {
            if (!monster.sprite || !monster.sprite.body) {
                return;
            }

            // If the monster is aggressive and the aggro sprite doesn't exist, create it
            if (monster.isAggressive && !monster.aggroSprite) {
                monster.aggroSprite = this.add.sprite(monster.sprite.x, monster.sprite.y, 'aggro');
                monster.aggroSprite.label = 'aggro';
                //add light to aggro sprite
                monster.aggroSprite.setPipeline('Light2D');
                this.allEntities.push(monster.aggroSprite);
            }

            // If the monster is not aggressive and the aggro sprite exists, destroy it
            if (!monster.isAggressive && monster.aggroSprite) {
                monster.aggroSprite.destroy();
                monster.aggroSprite = null;
            }

            // If the aggro sprite exists, position it at the same location as the monster
            if (monster.aggroSprite) {
                monster.aggroSprite.x = monster.sprite.x;
                monster.aggroSprite.y = monster.sprite.y - 100
            }
            let uiScene = this.scene.get('UIScene');

            if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                if (PlayerState.equipment.collar.light) {
                    const dxCollar = this.cat.x - monster.sprite.body.position.x;
                    const dyCollar = this.cat.y - monster.sprite.body.position.y;
                    const distanceCollar = Math.sqrt(dxCollar * dxCollar + dyCollar * dyCollar);

                    // Check if the monster is within the light radius
                    if (distanceCollar <= PlayerState.equipment.collar.lightRadius * 1.5) {
                        // If the repel chance hasn't been rolled for this monster yet
                        if (monster.repelRolled === undefined && monster.isAggressive) {
                            // Roll a random number between 0 and 1
                            let roll = Math.random();
                            // If the roll is less than the repel chance, set the monster to unaggressive
                            if (roll < PlayerState.equipment.collar.repelChance) {
                                monster.isAggressive = false;
                                uiScene.addMessage(`Your ${PlayerState.equipment.collar.friendlyName} repels the ${monster.name}!`, '#ff9a6e');
                            }

                            // Mark that the repel chance has been rolled for this monster
                            monster.repelRolled = false;
                        }
                    }
                }
            }


            this.fires.forEach(fire => {
                if (!fire || !fire.active) {
                    return;
                }
                if (monster.isAggressive) {

                    // Use the fire's body position to get the center of the sprite
                    const fireCenterX = fire.body.position.x;
                    const fireCenterY = fire.body.position.y;

                    const dx = monster.sprite.body.position.x - fireCenterX;
                    const dy = monster.sprite.body.position.y - fireCenterY;
                    const distance = Math.sqrt(dx * dx + dy * dy) / this.tileWidth;

                    
                    const dx2 = this.cat.x - fireCenterX;
                    const dy2 = this.cat.y - fireCenterY;
                    const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) / this.tileWidth;
    

                    if (distance >= 5 || distance2 >= 5) {
                        return;
                    }

                    if (monster.randomRoll === undefined) {
                        let fireBonus = PlayerState.equipment.collar && PlayerState.equipment.collar.fireBonus ? PlayerState.equipment.collar.fireBonus : 0;
                        monster.randomRoll = Math.floor(Math.random() * (fireBonus + 3));
                    }

                    if (monster.fireRepelled <= monster.randomRoll) {
                        // Increment fireRepelled or initialize it to 1 if it doesn't exist
                        let message;
                        let color;
                        if (monster.randomRoll - monster.fireRepelled >= 3) {
                            monster.isAggressive = false;
                        } else if (monster.randomRoll - monster.fireRepelled === 2) {
                            monster.isAggressive = false;
                        } else if (monster.randomRoll - monster.fireRepelled === 1) {
                            monster.isAggressive = false;
                        } else if (monster.randomRoll - monster.fireRepelled <= 0) {
                            message = `The ${monster.name} ignores the fire!`;
                            color = '#ff987d';
                        }

                        monster.fireRepelled = (monster.fireRepelled || 0) + 1;

                        
                        if (message) {
                            uiScene.addMessage(message, color);
                        }
                    }
                }
            });
        });
    }

    checkCollar() {
        if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {

            this.collar = this.add.sprite(this.cat.x, this.cat.y, null).setScale(1).setDepth(5);
            this.collar.setPipeline(this.collarParams.pipeline);
            this.collar.label = this.collarParams.label;
            this.currentCollarName = PlayerState.equipment.collar.itemName;
            if (PlayerState.equipment.collar.light) {
                this.collar.light = this.lights.addLight(this.cat.x, this.cat.y, PlayerState.equipment.collar.lightRadius).setColor(0xFF4500).setIntensity(PlayerState.equipment.collar.lightIntensity);
            }
        }
        else {
            this.collar = this.add.sprite(this.cat.x, this.cat.y, null).setScale(1).setDepth(5);
            this.collar.setPipeline(this.collarParams.pipeline);
            this.collar.label = this.collarParams.label;
            this.currentCollarName = null;
            this.collar.light = null
        }
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
                tree.shadow.setVisible(false);
                tree.alpha = 1;
                tree.clearTint();
                tree.anims.stop();
                tree.treechopShadow = this.add.sprite(tree.x, tree.y + 60, 'treeShadow3');

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

                //add treeChopShadow
                tree.treechopShadow.setOrigin(0.5, 0.5);
                tree.treechopShadow.alpha = this.getAlphaFromTime(PlayerState.gameTime)


                setTimeout(() => {
                    if (tree.active) {
                        //destroy treeChopShadow
                        tree.treechopShadow.destroy();
                        tree.setTexture(tree.originalType);
                        tree.shadow.setVisible(true);
                        tree.isDepleted = false;
                        tree.play(tree.originalType);
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

    searchBush(bush) {
        if (!bush || bush.isDepleted) {
            return;
        }

        // Check if the bush is in front of the player
        if (!this.isObjectInFront(this.cat, bush, this.lastDirection)) {
            return;
        }

        this.postFxPlugin.add(bush, {
            thickness: 2,
            outlineColor: 0xffff99
        });

        // Cascade 2nd outline
        this.postFxPlugin.add(bush, {
            thickness: 4,
            outlineColor: 0xeeeeee
        });
        setTimeout(() => {
            this.postFxPlugin.remove(bush);

        }, 200);

        // Decide to drop a berry, deplete the bush, or spawn a monster
        let randomValue = Math.random();

        // Calculating the probability of dropping a berry, including the treesBonus.
        const berryDropProbability = 0.75 + PlayerState.treesBonus / 100;
        // Logic for dropping a berry
        const randomX = bush.x + 100 + Math.random() * 25;
        const randomY = bush.y + 10 + Math.random() * 20;

        if (randomValue < berryDropProbability) {
            this.dropStrawberry(randomX, randomY, bush);
        } else {
            // Calculate the remaining probability after considering the berry drop.
            const remainingProbability = 1 - berryDropProbability;
            // Split the remaining probability into 3 parts, 2 parts for depleting and 1 part for monster spawning.
            const depleteProbability = remainingProbability * (3 / 4);
            // Adjust the check for depleting to take into account the berryDropProbability
            if (randomValue < berryDropProbability + depleteProbability) {
                // Logic for bush depleting
                bush.isDepleted = true;
                bush.clearTint();
                bush.setTexture('bush-down');
                bush.anims.stop();

                setTimeout(() => {
                    if (bush.active) {
                        bush.setTexture(bush.originalType);
                        bush.isDepleted = false;

                        bush.play(bush.originalType);
                    }
                }, 15000);
            } else {
                spawnMonsterBush(bush.x, bush.y, this, this.tileWidth, this.monsters, this.allEntities);
            }
        }
    }

    dropStrawberry(x, y, bush) {
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
        fruit.sprite.parentBush = bush; // Add this line

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
            tileType = Phaser.Math.Between(6, 16);
        } else if (roll <= 0.98) {
            tileType = Phaser.Math.Between(17, 22);
        } else {
            tileType = Phaser.Math.Between(23, 31);
        }        
        return tileType;
    }

    spawnMonstersFire(centerX, centerY, scene) {
        const spawnProbability = this.calculateSpawnProbability();

        const randomFloat = Phaser.Math.FloatBetween(0, 1);

        if (randomFloat < spawnProbability) {
           spawnMonsters(centerX, centerY, scene, this.tileWidth, this.tilesBuffer, this.monsters, this.allEntities);
        }

        const fireProbability = .5 * (1 + PlayerState.fireBonus / 100);
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


        const pondProbability = 0.60;
        const randomPondFloat = Phaser.Math.FloatBetween(0, 1);
        if (randomPondFloat < pondProbability) {
            const randomNumberOfPonds = Phaser.Math.Between(1, 2);

            for (let i = 0; i < randomNumberOfPonds; i++) {

              this.spawnPonds();
            }
        }

        const bushProbability = 0.80;
        const randombushFloat = Phaser.Math.FloatBetween(0, 1);
        if (randombushFloat < bushProbability) {
            const randomNumberOfbushs = Phaser.Math.Between(1, 3);

            for (let i = 0; i < randomNumberOfbushs; i++) {

               this.spawnbush();
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

    handlePlayerMovement(delta) {
        if (PlayerState.isDead) {
            this.cat.setVelocity(0, 0);
            return;
        }

        let velocityX = 0, velocityY = 0;

        const speedScale = delta / 8; // Adjust the divisor as needed

        if (!PlayerState.isMenuOpen) {

            if (this.cursors.left.isDown && this.cursors.up.isDown) {
                // Handle up-left diagonal movement
                velocityX = -this.diagonalVelocity * speedScale;
                velocityY = -this.diagonalVelocity * speedScale;
                if (!this.isDashing && !PlayerState.isEating) {
                    this.lastDirection = 'upLeft';
                }
            } else if (this.cursors.right.isDown && this.cursors.up.isDown) {
                // Handle up-right diagonal movement
                velocityX = this.diagonalVelocity * speedScale;
                velocityY = -this.diagonalVelocity * speedScale;
                if (!this.isDashing && !PlayerState.isEating) {
                    this.lastDirection = 'upRight';
                }
            } else if (this.cursors.left.isDown && this.cursors.down.isDown) {
                // Handle down-left diagonal movement
                velocityX = -this.diagonalVelocity * speedScale;
                velocityY = this.diagonalVelocity * speedScale;
                if (!this.isDashing && !PlayerState.isEating) {
                    this.lastDirection = 'downLeft';
                }
            } else if (this.cursors.right.isDown && this.cursors.down.isDown) {
                // Handle down-right diagonal movement
                velocityX = this.diagonalVelocity * speedScale;
                velocityY = this.diagonalVelocity * speedScale;
                if (!this.isDashing && !PlayerState.isEating) {
                    this.lastDirection = 'downRight';
                }
            } else if (this.cursors.left.isDown) {
                // Handle left movement
                velocityX = -PlayerState.speed * speedScale;
                if (!this.isDashing && !PlayerState.isEating) {
                    this.lastDirection = 'left';
                }
            } else if (this.cursors.right.isDown) {
                // Handle right movement
                velocityX = PlayerState.speed * speedScale;
                if (!this.isDashing && !PlayerState.isEating) {
                    this.lastDirection = 'right';
                }
            } else if (this.cursors.up.isDown) {
                // Handle up movement
                velocityY = -PlayerState.speed * speedScale;
                if (!this.isDashing && !PlayerState.isEating) {
                    this.lastDirection = 'up';
                }
            } else if (this.cursors.down.isDown) {
                // Handle down movement
                velocityY = PlayerState.speed * speedScale;
                if (!this.isDashing && !PlayerState.isEating) {
                    this.lastDirection = 'down';
                }
            }
        }
    
        if (PlayerState.isAttacking && !this.isDashing) {
            const attackSpeedReductionFactor = 0.3;
            velocityX *= attackSpeedReductionFactor;
            velocityY *= attackSpeedReductionFactor;
        }
    
        if (PlayerState.isEating) {
            const attackSpeedReductionFactor = 0.3;
            velocityX *= attackSpeedReductionFactor;
            velocityY *= attackSpeedReductionFactor;
        }
    
        if (this.isDashing) {
            const dashSpeedIncreaseFactor = 1.5;
            velocityX *= dashSpeedIncreaseFactor;
            velocityY *= dashSpeedIncreaseFactor;
        }

        this.cat.setVelocity(velocityX, velocityY);
    
        if (this.collar) {
        if(PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
            this.collar.x = this.cat.x;
            this.collar.y = this.cat.y;
            if (PlayerState.equipment.collar.light) {
            this.collar.light.x = this.cat.x;
            this.collar.light.y = this.cat.y;
        }
    }
    }
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
                    thickness: 3,
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
                        thickness: 3,
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

        const bufferStartI = visibleStartI - (this.tilesBuffer + 4); // extend outward by 1 tile
        const bufferEndI = visibleEndI + (this.tilesBuffer + 4);    // extend outward by 1 tile
        const bufferStartJ = visibleStartJ - (this.tilesBuffer + 4); // extend outward by 1 tile
        const bufferEndJ = visibleEndJ + (this.tilesBuffer + 4);    // extend outward by 1 tile

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
        if (isTooCloseToOtherObjects(this.fires, 80) ||
            isTooCloseToOtherObjects(this.ashes, 80) || // assuming a tree threshold
            isTooCloseToOtherObjects(this.trees, 4) || // assuming a tree threshold
            isTooCloseToOtherObjects(this.ponds, 10) || // assuming a pond threshold
            isTooCloseToOtherObjects(this.bushs, 3)) { // assuming a bush threshold
            return;
        }


        const fire = this.matter.add.sprite(x, y, 'fire', null, {
            label: 'fire'
        }).setCircle(70).setDepth(2);


        const fireShadow = this.add.sprite(fire.x, fire.y, 'fire');
        fireShadow.setTint(0x000000); // Set the tint to black
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


        fire.light = this.lights.addLight(x, y, 400).setColor(0xFF4500).setIntensity(1.6);

        this.tweens.add({
            targets: fire.light,
            radius: { from: 325, to: 400 },
            ease: 'Sine.easeInOut',
            duration: 1500,
            yoyo: true,
            repeat: -1
        });


        this.fires.push(fire);

        for (let index = this.fires.length - 1; index >= 0; index--) {
            let fire = this.fires[index];

            if (fire && fire.active) {
                fire.light.setIntensity(1.6);
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
                                }

                                // Check if the matter world exists before removing the fire body
                                if (this.matter && this.matter.world) {
                                    this.matter.world.remove(fire.body);
                                }

                                //if fire shadow exists, remove it
                                if (fire.shadow) {
                                    fire.shadow.destroy();
                                }

                                // Check if the fires array exists before removing the fire object by filtering it
                                if (this.fires) {
                                    this.fires = this.fires.filter(f => f !== fire);
                                }

                                // Check if the add method exists before creating the ashes sprite
                                if (this.add) {
                                    let ashesSprite = this.add.sprite(x, y, 'ashes').setDepth(1).setPipeline('Light2D');

                                    // Check if the ashes array exists before adding the ashes sprite
                                    if (this.ashes) {
                                        this.ashes.push(ashesSprite);
                                    }
                                }
                                // Check if the fire body exists before destroying it
                                if (fire.body) {
                                    fire.body.destroy();
                                }

                                if (fire.timerEvent) {
                                    fire.timerEvent.remove();
                                }

                                // Check if the fire object exists before destroying it
                                if (fire) {
                                    fire.destroy();
                                }
                            }
                        }
                        else {
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
        let uiScene = this.scene.get('UIScene');

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

            //uiscene
            let remainingTimeMs = closestFire.endTime - Date.now();
            let remainingTimeSec = Math.floor(remainingTimeMs / 1000);
            let remainingMinutes = Math.floor(remainingTimeSec / 60);
            let remainingSeconds = remainingTimeSec % 60;

            let remainingTimeString;
            if (remainingMinutes > 0) {
                remainingTimeString = `${remainingMinutes} ${remainingMinutes > 1 ? 'mins' : 'min'}`;
                if (remainingSeconds > 0) {
                    remainingTimeString += ` ${remainingSeconds} ${remainingSeconds > 1 ? 'secs' : 'sec'}`;
                }
            } else if (remainingSeconds > 0) {
                remainingTimeString = `${remainingSeconds} ${remainingSeconds > 1 ? 'secs' : 'sec'}`;
            } else {
                remainingTimeString = 'now';
            }

            uiScene.addMessage(`The fire burns for another ${remainingTimeString}.`, '#ffc284');
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

        const bufferStartI = visibleStartI - (this.tilesBuffer + 7); // extend outward by 1 tile
        const bufferEndI = visibleEndI + (this.tilesBuffer + 7);    // extend outward by 1 tile
        const bufferStartJ = visibleStartJ - (this.tilesBuffer + 7); // extend outward by 1 tile
        const bufferEndJ = visibleEndJ + (this.tilesBuffer + 7);   // extend outward by 1 tile

        let spawnTileI, spawnTileJ;

        //spawn a tree at a random location in the buffer area
        spawnTileI = Phaser.Math.Between(bufferStartI, bufferEndI);
        spawnTileJ = Phaser.Math.Between(bufferStartJ, bufferEndJ);

        // Check if the chosen tile is within the visible area
        if ((spawnTileI + 5 >= visibleStartI && spawnTileI - 5 <= visibleEndI) && (spawnTileJ + 5 >= visibleStartJ && spawnTileJ - 5 <= visibleEndJ)) {
            // If it is, return and don't spawn a fire
            return;
        }

        const x = spawnTileI * this.tileWidth;
        const y = spawnTileJ * this.tileWidth;

        const treeSize = 10;

            // Check if any of the tiles around the spawn location are part of the maze or objects layer
    for (let i = -treeSize; i <= treeSize; i++) {
        for (let j = -treeSize; j <= treeSize; j++) {
            const tileX = x + i * this.tileWidth;
            const tileY = y + j * this.tileWidth;

            if (this.mazeLayer && this.mazeLayer.hasTileAtWorldXY(tileX, tileY)) {
                // If there's a tile at this location in the maze layer, return and don't spawn the tree
                return;
            }
    
            if (this.objectsLayer && this.objectsLayer.hasTileAtWorldXY(tileX, tileY)) {
                // If there's a tile at this location in the objects layer, return and don't spawn the tree
                return;
            }
        }
    }

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
        isTooCloseToOtherObjects(this.ponds, 9) || // assuming a pond threshold
        isTooCloseToOtherObjects(this.bushs, 4) || // assuming a bush threshold
        isTooCloseToOtherObjects(monstersArray, 4) || // Pass the monsters array
        (this.mazeLayer && this.mazeLayer.hasTileAtWorldXY(x, y)) || // Check if there's a tile at the spawn location in the maze layer
        (this.objectsLayer && this.objectsLayer.hasTileAtWorldXY(x, y))) { // Check if there's a tile at the spawn location in the objects layer
        return;
    }

    let tree;
    let treeShadow;

        if (this.treePool.length > 0) {
            tree = this.treePool.pop();
            treeShadow = this.add.sprite(x, y, 'treeShadow');


            tree.body = tree.storedBody;
            this.matter.world.add(tree.body);

            tree.shadow = treeShadow;
            treeShadow.label = 'treeShadow';
            tree.setPosition(x, y);
            tree.setActive(true);
            tree.setVisible(true);
            treeShadow.setPosition(x, y);
            treeShadow.setActive(true);
            treeShadow.setVisible(true);
            tree.isDepleted = false;
            if (!tree.isDepleted) {
                tree.play(tree.originalType);
                if (this.anims.exists('treeshadowAnimation')) {
                    treeShadow.play('treeshadowAnimation', true);
                } else {
                    console.error('Animation treeshadowAnimation does not exist');
                }
            }
        } else {
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

            tree = this.matter.add.sprite(x, y, treeType, null, {
                label: 'tree'
            }).setExistingBody(treeBody); // Set the depth to be proportional to the y-coordinate

            tree.storedBody = treeBody; // Moved this line here

            this.setTreeProperties(tree, treeType);

            treeShadow = this.add.sprite(x, y, 'treeShadow');
            tree.shadow = treeShadow;
            treeShadow.label = 'treeShadow';


            if (!tree.isDepleted) {
                tree.play(tree.originalType);
                if (this.anims.exists('treeshadowAnimation')) {
                    treeShadow.play('treeshadowAnimation', true);
                } else {
                    console.error('Animation treeshadowAnimation does not exist');
                }
            }

            this.setBodyProperties(tree.body);
        }

        this.trees.push(tree);
        this.allEntities.push(tree.shadow);
        this.allEntities.push(tree);
    }

    setTreeProperties(tree, treeType) {
        if (treeType === 'tree_3') {
            tree.setOrigin(0.46, 0.80);
        } else {
            tree.setOrigin(0.5, 0.80);
        }
        tree.setPipeline('Light2D');
        tree.isDepleted = false;
        tree.originalType = treeType;
    }

    setBodyProperties(body) {
        body.friction = 0;
        body.frictionAir = 0;
        body.restitution = 0;
        for (let part of body.parts) {
            part.friction = 0;
            part.frictionAir = 0;
            part.restitution = 0;
        }
    }

    spawnMazeAndObjects() {
        // Create the map
        this.map = this.make.tilemap({ key: 'maze' });
    
        // Add the tileset image
        this.tileset = this.map.addTilesetImage('RA_Ruins');
    
        // Add the tileset to the map
        this.mazeLayer = this.map.createLayer('walls', this.tileset, 0, 0);
    
        // Add the 'objects' layer to the map
        this.objectsLayer = this.map.createLayer('object', this.tileset, 0, 0);
    
        // Set collision for the layers
        this.mazeLayer.setCollisionByExclusion([-1]);
        this.objectsLayer.setCollisionByExclusion([-1]);
    
        // Convert the tilemap layers to Matter.js bodies
        this.matter.world.convertTilemapLayer(this.mazeLayer);
        this.matter.world.convertTilemapLayer(this.objectsLayer);
    
        // Set the pipeline to 'Light2D'
        this.mazeLayer.setPipeline('Light2D');
        this.objectsLayer.setPipeline('Light2D');
    }

    spawnPonds() {
        const camera = this.cameras.main;
        const centerX = camera.midPoint.x;
        const centerY = camera.midPoint.y;
        const visibleStartI = Math.floor((centerX - camera.width / 2) / this.tileWidth);
        const visibleEndI = Math.ceil((centerX + camera.width / 2) / this.tileWidth);
        const visibleStartJ = Math.floor((centerY - camera.height / 2) / this.tileWidth);
        const visibleEndJ = Math.ceil((centerY + camera.height / 2) / this.tileWidth);

        const bufferStartI = visibleStartI - (this.tilesBuffer + 6); // extend outward by 1 tile
        const bufferEndI = visibleEndI + (this.tilesBuffer + 6);    // extend outward by 1 tile
        const bufferStartJ = visibleStartJ - (this.tilesBuffer + 6); // extend outward by 1 tile
        const bufferEndJ = visibleEndJ + (this.tilesBuffer + 6);   // extend outward by 1 tile

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

        const pondSize = 10;

        // Check if any of the tiles around the spawn location are part of the maze or objects layer
for (let i = -pondSize; i <= pondSize; i++) {
    for (let j = -pondSize; j <= pondSize; j++) {
        const tileX = x + i * this.tileWidth;
        const tileY = y + j * this.tileWidth;

        if (this.mazeLayer && this.mazeLayer.hasTileAtWorldXY(tileX, tileY)) {
            // If there's a tile at this location in the maze layer, return and don't spawn the tree
            return;
        }

        if (this.objectsLayer && this.objectsLayer.hasTileAtWorldXY(tileX, tileY)) {
            // If there's a tile at this location in the objects layer, return and don't spawn the tree
            return;
        }
    }
}

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
        if (isTooCloseToOtherObjects(this.fires, 9) ||
            isTooCloseToOtherObjects(this.trees, 10) || // assuming a tree threshold
            isTooCloseToOtherObjects(this.ponds, 14) || // assuming a pond threshold
            isTooCloseToOtherObjects(this.bushs, 9) ||
            isTooCloseToOtherObjects(monstersArray, 5)|| // Pass the monsters array
            (this.mazeLayer && this.mazeLayer.hasTileAtWorldXY(x, y)) || // Check if there's a tile at the spawn location in the maze layer
            (this.objectsLayer && this.objectsLayer.hasTileAtWorldXY(x, y))) { // Check if there's a tile at the spawn location in the objects layer
            return;
        }

        if (this.ponds.filter(pond => pond.active).length >= 3) {
            return;
        }

        const pondTypes = ['pond', 'pond_2', 'pond_3'];

        // Choose a random pond type
        const randomPondType = Phaser.Math.RND.pick(pondTypes);

        const pond = this.matter.add.sprite(x, y, randomPondType, null, {
            label: 'pond'
        });
        let pondVertices;
        let originX = 0.5;
        let originY = 0.5;
        switch (randomPondType) {
            case 'pond':
                pondVertices = this.createPondVertices(randomPondType, x, y);
                originX = 0.5;
                originY = 0.5;
                break;
            case 'pond_2':
                pondVertices = this.createPondVertices(randomPondType, x, y);
                originX = 0.58;
                originY = 0.5;
                break;
            case 'pond_3':
                pondVertices = this.createPondVertices(randomPondType, x, y);
                originX = 0.59;
                originY = 0.41;
                break;
            default:
                break;
        }
        const pondBody = this.matter.add.fromVertices(x, y, pondVertices, {
            isStatic: true
        }, true);
        pondBody.label = 'pond';
        pond.setExistingBody(pondBody).setOrigin(originX, originY);
        pond.setPipeline('Light2D');
        pond.setDepth(2);
        pond.play(randomPondType);

        this.ponds.push(pond);
        this.allEntities.push(pond);
    }

    createPondVertices(pondType, x, y) {
        let vertices;
        switch (pondType) {
            case 'pond':
                vertices = this.createEllipseVertices(x, y, 170, 120, 16);
                break;
            case 'pond_2':
                // Extract the points from the SVG data
                let svgPoints2 = "0 85.15 0 143.1 22.18 191.76 66.54 221.09 121.64 227.53 217.52 227.53 252.58 240.41 286.92 266.89 300.52 296.22 332.71 312.68 392.82 312.68 431.46 302.66 450.06 289.07 466.52 269.75 477.96 223.96 491.56 183.89 522.33 165.32 552.38 143.1 559.53 122.35 559.53 75.84 534.49 35.78 491.56 15.74 407.84 15.74 328.42 48.65 300.52 53.66 276.19 52.95 154.55 0 104.47 0 71.55 7.16 33.63 27.91 0 85.15";
                let points2 = svgPoints2.split(' ');

                // Convert the points into vertices
                vertices = [];
                for (let i = 0; i < points2.length; i += 2) {
                    let px = parseFloat(points2[i]) * 1.16;
                    let py = parseFloat(points2[i + 1]) * 1.16;
                    vertices.push({ x: px + x, y: py + y });
                }
                break;
            case 'pond_3':
                // Extract the points from the SVG data
                let svgPoints = "7.76 32.01 0 58.69 3.88 88.28 10.19 106.72 32.5 121.75 71.31 133.39 176.08 133.39 203.25 124.66 225.56 113.02 243.51 95.07 251.75 79.07 251.75 52.87 230.89 23.77 209.07 16.49 181.9 20.37 161.04 26.19 125.11 18.64 104.29 3.4 76.16 0 39.78 5.34 7.76 32.01";
                let points = svgPoints.split(' ');

                // Convert the points into vertices and scale by 3
                vertices = [];
                for (let i = 0; i < points.length; i += 2) {
                    let px = parseFloat(points[i]) * 2; // Scale x coordinate
                    let py = parseFloat(points[i + 1]) * 2; // Scale y coordinate
                    vertices.push({ x: px, y: py });
                }
                break;
            default:
                break;
        }
        return vertices;
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
        vertices.push({ x: x - 30, y: y - 30 }); // Top left (short base)
        vertices.push({ x: x + 30, y: y - 30 }); // Top right (short base)
        vertices.push({ x: x + 30, y: y }); // Middle right
        vertices.push({ x: x + 30, y: y + 10 }); // New vertex between middle right and bottom right
        vertices.push({ x: x + 30, y: y + 20 }); // Bottom right (long base)
        vertices.push({ x: x - 30, y: y + 20 }); // Bottom left (long base)
        vertices.push({ x: x - 30, y: y + 10 }); // New vertex between middle left and bottom left
        vertices.push({ x: x - 30, y: y }); // Middle left

        return vertices;
    }

    spawnbush() {
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

        const bushSize = 3;

        // Check if any of the tiles around the spawn location are part of the maze or objects layer
for (let i = -bushSize; i <= bushSize; i++) {
    for (let j = -bushSize; j <= bushSize; j++) {
        const tileX = x + i * this.tileWidth;
        const tileY = y + j * this.tileWidth;

        if (this.mazeLayer && this.mazeLayer.hasTileAtWorldXY(tileX, tileY)) {
            // If there's a tile at this location in the maze layer, return and don't spawn the tree
            return;
        }

        if (this.objectsLayer && this.objectsLayer.hasTileAtWorldXY(tileX, tileY)) {
            // If there's a tile at this location in the objects layer, return and don't spawn the tree
            return;
        }
    }
}

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
            isTooCloseToOtherObjects(this.ponds, 8) || // assuming a pond threshold
            isTooCloseToOtherObjects(monstersArray, 3) ||
            isTooCloseToOtherObjects(this.bushs, 3) || // Pass the monsters array
            (this.mazeLayer && this.mazeLayer.hasTileAtWorldXY(x, y)) || // Check if there's a tile at the spawn location in the maze layer
            (this.objectsLayer && this.objectsLayer.hasTileAtWorldXY(x, y))) { // Check if there's a tile at the spawn location in the objects layer
            return;
        }

        // If there are already 2 trees in the view, don't spawn a new one
        if (this.bushs.filter(bush => bush.active).length >= 4) {
            return;
        }

        const bushTypes = ['bush_1', 'bush_2', 'bush_3'];

        // Choose a random bush type
        const randomBushType = Phaser.Math.RND.pick(bushTypes);

        const bush = this.matter.add.sprite(x, y, randomBushType, null, {
            label: 'bush'
        });

        // Approximate an ellipse using a polygon body
        const ellipseVertices = this.createEllipseVertices(x, y, 50, 50, 16);
        const bushBody = this.matter.add.fromVertices(x, y, ellipseVertices, {
            isStatic: true
        }, true);

        bushBody.label = 'bush';


        bush.setExistingBody(bushBody).setOrigin(0.5, 0.6);
        bush.setPipeline('Light2D');
        bush.play(randomBushType);
        bush.originalType = randomBushType;

        bush.isDepleted = false;


        this.bushs.push(bush);
        this.allEntities.push(bush);

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


    checkCollarAnims(catAnimationKey) {
        if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
            // If the collar sprite doesn't exist or the equipped collar has changed, create a new collar sprite
            if (!this.collar || (this.collar && this.currentCollarName !== PlayerState.equipment.collar.itemName)) {
                // If a collar sprite already exists, destroy it
                if (this.collar) {
                    this.allEntities = this.allEntities.filter(entity => entity !== this.collar);
                    this.lights.removeLight(this.collar.light);
                    this.collar.destroy();
                }

                // Create a new collar sprite
                this.collar = this.add.sprite(this.cat.x, this.cat.y, PlayerState.equipment.collar.itemName)
                    .setScale(1)
                this.collar.setPipeline('Light2D');
                this.currentCollarName = PlayerState.equipment.collar.itemName; // Update the currentCollarName
                this.collar.label = this.collarParams.label;
                if (PlayerState.equipment.collar.light) {
                    this.collar.light = this.lights.addLight(this.cat.x, this.cat.y, PlayerState.equipment.collar.lightRadius).setColor(0xFF4500).setIntensity(PlayerState.equipment.collar.lightIntensity);
                }

                // Add the new collar to all entities
                this.allEntities.push(this.collar);
                this.cat.stop();
                this.cat.play(catAnimationKey, true);
            }

            let currentCatAnimation = this.cat.anims.currentAnim.key.replace(/-/g, '_');
            let collarAnimation = PlayerState.equipment.collar.equipmentName + '_' + currentCatAnimation;
            this.collar.play(collarAnimation, true, this.cat.anims.currentFrame.frameNumber);

            this.collar.flipX = (this.lastDirection === 'left' || this.lastDirection === 'upLeft' || this.lastDirection === 'downLeft');
            this.cat.flipX = (this.lastDirection === 'left' || this.lastDirection === 'upLeft' || this.lastDirection === 'downLeft');

        } else {
            // If the collar is not equipped, destroy the collar sprite
            if (this.collar) {
                this.allEntities = this.allEntities.filter(entity => entity !== this.collar);
                this.lights.removeLight(this.collar.light);
                this.collar.destroy();
                this.collar = null; // Set to null so we know it's destroyed
            }
            this.cat.flipX = (this.lastDirection === 'left' || this.lastDirection === 'upLeft' || this.lastDirection === 'downLeft');
        }
    }

    handlePlayerAnimations(lastDirection, velocityX, velocityY) {

        if (PlayerState.isDead) {
            return;
        }

        //speedscale
        //if this.isdashing is true, then the player is dashing increase speed and play attack5 animation
        if (this.isDashing && !PlayerState.isEating) { 
            switch (this.lastDirection) {
                case 'up':
                    this.attackAnimationKey = 'attack5-back';
                    if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                    }
                    break;
                case 'down':
                    this.attackAnimationKey = 'attack5-front';
                    if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                    }
                    break;
                case 'left':
                case 'right':
                case 'upLeft':
                case 'upRight':
                case 'downLeft':
                case 'downRight':
                    this.attackAnimationKey = 'attack5';
                    if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                    }
                    break;
                default:
                    this.attackAnimationKey = 'attack5';
                    if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                    }
                    break;
            }
            this.cat.play(this.attackAnimationKey, true);
            this.checkCollarAnims(this.attackAnimationKey);
            // After the animation is complete, set this.isDashing to false and reset the speed
            this.cat.on('animationcomplete', () => {
                this.isDashing = false;
            }, this);
            return;
        }


        //if player is underattack apply red tint for 1 second
        if (PlayerState.isHurt) {
            this.cat.setTint(0xffffff);

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
            const shouldFlip = (this.lastDirection === 'left' || this.lastDirection === 'upLeft' || this.lastDirection === 'downLeft');
            if (this.cat.flipX !== shouldFlip) {
                this.cat.flipX = shouldFlip;
                if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                    this.collar.flipX = shouldFlip;
                }
            }
            return;
        }

        if (PlayerState.isEating) {            
            let eatAnimationKey;


            switch (this.lastDirection) {
                case 'up':
                    eatAnimationKey = 'eat-back';
                    if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                    }
                    this.lastDirection = 'up';
                    break;
                case 'down':
                    eatAnimationKey = 'eat-front';
                    if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                    }
                    this.lastDirection = 'down';
                    break;
                case 'left':
                case 'upLeft':
                case 'downLeft':
                    eatAnimationKey = 'eat';
                    if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                    }
                    this.lastDirection = 'left';
                    break;
                case 'upRight':
                case 'right':
                case 'downRight':
                    eatAnimationKey = 'eat';
                    if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                    }
                    this.lastDirection = 'right';
                    break;
                default:
                    eatAnimationKey = 'eat';
                    if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                    }
                    break;
            }

            this.cat.play(eatAnimationKey, true);
        
            this.checkCollarAnims(eatAnimationKey);

            this.cat.once('animationcomplete-' + eatAnimationKey, () => {
                PlayerState.isEating = false; // Reset the isEating flag after the animation completes
            });
            


    
            return;
        }


        if (velocityX === 0 && velocityY === 0 && !PlayerState.isAttacking && !PlayerState.isEating) {
            // Handle idle animations based on last direction
            let catAnimationKey;
            switch (this.lastDirection) {
                case 'up':
                    catAnimationKey = 'sit-back';
                    break;
                case 'down':
                    catAnimationKey = 'sit-forward';
                    break;
                default:
                    catAnimationKey = 'sit';
                    break;
            }
        
            this.cat.play(catAnimationKey, true);
            this.checkCollarAnims(catAnimationKey);
        } else
            // Handle movement animations
            if (this.lastDirection === 'left') {
                this.cat.play('run', true);
                this.cat.flipX = true; // flip when moving left
                this.checkCollarAnims('run');
            } else if (this.lastDirection === 'right') {
                this.cat.play('run', true);
                this.cat.flipX = false; // don't flip when moving right
                this.checkCollarAnims('run');
            } else if (this.lastDirection === 'up') {
                this.cat.play('up', true);
                this.checkCollarAnims('up');
            } else if (this.lastDirection === 'down') {
                this.cat.play('down', true);
                this.checkCollarAnims('down');
            }
            else if (this.lastDirection === 'upLeft') {
                this.cat.play('run-diagonal-back', true);
                this.cat.flipX = true;
                this.checkCollarAnims('run-diagonal-back');
            }
            else if (this.lastDirection === 'upRight') {
                this.cat.play('run-diagonal-back', true);
                this.cat.flipX = false;
                this.checkCollarAnims('run-diagonal-back');
            }
            else if (this.lastDirection === 'downLeft') {
                this.cat.play('run-diagonal-front', true);
                this.cat.flipX = true;
                this.checkCollarAnims('run-diagonal-front');
            }
            else if (this.lastDirection === 'downRight') {
                this.cat.play('run-diagonal-front', true);
                this.cat.flipX = false;
                this.checkCollarAnims('run-diagonal-front');
            }
    }

    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }

    getAlphaFromTime(time) {
        if (time >= 0 && time < 3) {
            return this.lerp(0.2, 0.2, (time - 0) / (3 - 0));
        } else if (time >= 3 && time < 6) {
            return this.lerp(0.2, 0.3, (time - 3) / (6 - 3));
        } else if (time >= 6 && time < 12) {
            return this.lerp(0.3, 0.4, (time - 6) / (12 - 6));
        } else if (time >= 12 && time < 18) {
            return this.lerp(0.4, 0.3, (time - 12) / (18 - 12));
        } else if (time >= 18 && time < 21) {
            return this.lerp(0.3, 0.2, (time - 18) / (21 - 18));
        } else if (time >= 21 && time <= 24) {
            return this.lerp(0.2, 0.2, (time - 21) / (24 - 21));
        }
    }

    updateTimeCircle() {
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
        let color = colorScale(PlayerState.gameTime).hex().substring(1);

        //set ambient color to the color of the time of day
        this.lights.setAmbientColor(parseInt(color, 16));

        // Define color for sun:
        let sunColor = sunColorScale(PlayerState.gameTime).hex().substring(1);

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
        const angle = ((PlayerState.gameTime % 24) / 24) * 2 * Math.PI;

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
        let orbitRadius = 2; // Adjust this value to change the size of the orbit

        // Calculate shadow position based on the cat's position and the orbit
        let shadowPosX = -this.cat.x + orbitRadius * Math.cos(angleCat);
        let shadowPosY = -this.cat.y - 45 + orbitRadius * Math.sin(angleCat);

        // Set the position, rotation, and scale of the shadow sprite
        this.catShadow.x = -shadowPosX;
        this.catShadow.y = -shadowPosY;
        this.catShadow.scaleX = 1; // Adjust the scale if needed
        this.catShadow.scaleY = 1; // Adjust the scale if needed
        this.catShadow.alpha = this.getAlphaFromTime(PlayerState.gameTime); // Make the shadow sprite semi-transparent

        // For the monster shadows
        Object.values(this.monsters).forEach(monster => {
            if (monster.monsterShadow && monster.sprite && monster.sprite.active) {
                let angle = Math.atan2(this.sunLight.y - monster.sprite.y, this.sunLight.x - monster.sprite.x);
                let orbitRadius = 2;
                let shadowPosY = -monster.sprite.y + 5 - monster.trimmedHeight / 2 + orbitRadius * Math.sin(angle);
                let shadowPosX;

                if (monster.name !== 'turtle' && monster.name !== 'panda') {
                    //facing right
                    shadowPosX = -monster.sprite.x + 1 + orbitRadius * Math.cos(angle);
                    if (monster.sprite.flipX) {
                        //facing left
                        shadowPosX = -monster.sprite.x + 4 + orbitRadius * Math.cos(angle);
                    }
                } else {
                    //facing right
                    shadowPosX = -monster.sprite.x + 12 + orbitRadius * Math.cos(angle);
                    if (monster.sprite.flipX) {
                        //facing left
                        shadowPosX = -monster.sprite.x - 10 + orbitRadius * Math.cos(angle);
                    }
                }

                monster.monsterShadow.x = shadowPosX;

                monster.monsterShadow.alpha = this.getAlphaFromTime(PlayerState.gameTime);
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
                let orbitRadius = 2;
                let shadowPosX = -tree.x + orbitRadius * Math.cos(angle);
                let shadowPosY = -tree.y - 55 + orbitRadius * Math.sin(angle);

                tree.shadow.alpha = this.getAlphaFromTime(PlayerState.gameTime);
                tree.shadow.x = -shadowPosX;
                tree.shadow.y = -shadowPosY;
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
        if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
            this.allEntities = this.allEntities.filter(entity => entity !== this.collar);
            this.lights.removeLight(this.collar.light);
            this.collar.destroy();
            this.collar = null; // Set to null so we know it's destroyed
        }


        PlayerState.isDead = true;
        PlayerState.isUnderAttack = false;
        PlayerState.isHurt = false;
        PlayerState.isEating = false;
        delete PlayerState.equipment.collar;

        this.isFainting = true;
        PlayerState.isAttacking = false; // Ensure no attack is in progress

        //reset the colliding this.monsters and colliding monster key:
        this.targetMonsterKey = null;
        this.lastClickedMonsterKey = null;

        Object.values(this.monsters).forEach(monster => {
            this.gameEvents.endBattleForMonster(monster, null);
    
            // If the aggro sprite exists, destroy it and remove it from allEntities
            if (monster.aggroSprite) {
                this.allEntities = this.allEntities.filter(entity => entity !== monster.aggroSprite);
            }
    
            // Remove the current monster from allEntities
            this.allEntities = this.allEntities.filter(entity => entity !== monster.sprite);
        }); 


        // Reset the monsters object
        this.monsters = {};

        // In mainScene.js
        let uiScene = this.scene.get('UIScene');
        uiScene.addMessage('Oh no! You have fainted!', 'red');
        uiScene.clearInventory();
        uiScene.updateEquipmentDisplay();


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

                        if (tree.treechopShadow) {
                            tree.treechopShadow.destroy();
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


                for (let index = this.bushs.length - 1; index >= 0; index--) {
                    let bush = this.bushs[index];
                    if (bush && bush.active) {

                        this.bushs.splice(index, 1);
                        this.matter.world.remove(bush.body);

                        if (this.collidingBush === bush) {
                            this.collidingBush = null;
                        }

                        bush.body.destroy();
                        bush.destroy();

                        this.allEntities = this.allEntities.filter(entity => entity !== bush);
                    }
                }

                for (let index = this.fires.length - 1; index >= 0; index--) {
                    let fire = this.fires[index];
                    if (fire && fire.active) {

                        this.tweens.killTweensOf(fire.light);
                        // Turn off the light associated with the fire
                        fire.light.setIntensity(0);

                        // Destroy the fire body
                        this.matter.world.remove(fire.body);

                        // Remove the fire from the fires array before destroying it by filtering it out
                        this.fires = this.fires.filter(f => f !== fire);

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
        const buffer = {
            fire: 3,
            ashes: 3,
            items: 0,
            monsters: 2
        };

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
                        if (itemTileI < startI - buffer.items || itemTileI > endI + buffer.items || itemTileJ < startJ - buffer.items || itemTileJ > endJ + buffer.items) {
                            this.items = this.items.filter(i => i !== item);
                            item.sprite.destroy(); // Destroy the sprite, not the wrapper object
                            this.allEntities = this.allEntities.filter(entity => entity !== item.sprite);
                    }
                    }
                });


                for (let key in this.monsters) {
                    let monster = this.monsters[key];
                    if (monster.sprite && monster.sprite.active) {
                        const monsterTileI = Math.floor(monster.sprite.x / this.tileWidth);
                        const monsterTileJ = Math.floor(monster.sprite.y / this.tileWidth);
                        if (monsterTileI < startI - buffer.monsters || monsterTileI > endI + buffer.monsters || monsterTileJ < startJ - buffer.monsters || monsterTileJ > endJ + buffer.monsters) {
                            scene.gameEvents.cleanUpMonster(monster, null, this.allEntities);
                            this.allEntities = this.allEntities.filter(entity => entity !== monster.sprite);
                            delete this.monsters[key];

                            // If the monster is not aggressive and the aggro sprite exists, destroy it
                            if (monster.aggroSprite) {
                                this.allEntities = this.allEntities.filter(entity => entity !== monster.aggroSprite);
                                monster.aggroSprite.destroy();
                                monster.aggroSprite = null;
                            }
                        }
                    }
                }

                for (let index = this.ashes.length - 1; index >= 0; index--) {
                    let ashes = this.ashes[index];
                    if (ashes && ashes.active) {
                        const ashesTileI = Math.floor(ashes.x / this.tileWidth);
                        const ashesTileJ = Math.floor(ashes.y / this.tileWidth);
                        if (ashesTileI < startI - buffer.ashes || ashesTileI > endI + buffer.ashes || ashesTileJ < startJ - buffer.ashes || ashesTileJ > endJ + buffer.ashes) {
                            this.ashes.splice(index, 1);
                            ashes.destroy();
                        }
                    }
                }


                for (let index = this.trees.length - 1; index >= 0; index--) {
                    let tree = this.trees[index];
                    if (tree && tree.active) {
                        const treeTileI = Math.floor(tree.x / this.tileWidth);
                        const treeTileJ = Math.floor(tree.y / this.tileWidth);
                        const buffer = 7; 
                        if (treeTileI < startI - buffer || treeTileI > endI + buffer || treeTileJ < startJ - buffer || treeTileJ > endJ + buffer) { // Check if the tree is out of view
                            tree.isDepleted = false;

                            if (tree.treechopShadow) {
                                tree.treechopShadow.destroy();
                            }

                            this.trees = this.trees.filter(t => t !== tree);

                            if (this.collidingTree === tree) {
                                this.collidingTree = null;
                            }

                            // Store the tree's body in the tree object
                            tree.storedBody = tree.body;
                            this.matter.world.remove(tree.body);

                            tree.setActive(false);
                            tree.setVisible(false);
                            this.treePool.push(tree);
                            tree.shadow.setActive(false);
                            tree.shadow.setVisible(false);
                            this.treeShadowPool.push(tree.shadow);

                            this.allEntities = this.allEntities.filter(entity => entity !== tree);
                            this.allEntities = this.allEntities.filter(entity => entity !== tree.shadow);
                        }
                    }
                }

                for (let index = this.ponds.length - 1; index >= 0; index--) {
                    let pond = this.ponds[index];
                    if (pond && pond.active) {
                        const pondTileI = Math.floor(pond.x / this.tileWidth);
                        const pondTileJ = Math.floor(pond.y / this.tileWidth);
                        const buffer = 7; 
                        if (pondTileI < startI - buffer || pondTileI > endI + buffer || pondTileJ < startJ - buffer || pondTileJ > endJ + buffer) { // Check if the tree is out of view
                            this.ponds = this.ponds.filter(p => p !== pond);

                            this.matter.world.remove(pond.body);

                            pond.body.destroy();
                            pond.destroy();

                            this.allEntities = this.allEntities.filter(entity => entity !== pond);
                        }
                    }
                }


                for (let index = this.bushs.length - 1; index >= 0; index--) {
                    let bush = this.bushs[index];
                    if (bush && bush.active) {
                        const bushTileI = Math.floor(bush.x / this.tileWidth);
                        const bushTileJ = Math.floor(bush.y / this.tileWidth);
                        const buffer = 3; 
                        if (bushTileI < startI - buffer || bushTileI > endI + buffer || bushTileJ < startJ - buffer || bushTileJ > endJ + buffer) { // Check if the tree is out of view
                            this.bushs = this.bushs.filter(b => b !== bush);
                            this.matter.world.remove(bush.body);

                            if (this.collidingBush === bush) {
                                this.collidingBush = null;
                            }

                            bush.body.destroy();
                            bush.destroy();

                            this.allEntities = this.allEntities.filter(entity => entity !== bush);
                        }
                    }
                }

                for (let index = this.fires.length - 1; index >= 0; index--) {
                    let fire = this.fires[index];
                    if (fire && fire.active) {
                        const fireTileI = Math.floor(fire.x / this.tileWidth);
                        const fireTileJ = Math.floor(fire.y / this.tileWidth);
                        const buffer = 4;
                        if (fireTileI < startI - buffer || fireTileI > endI + buffer || fireTileJ < startJ - buffer || fireTileJ > endJ + buffer) {
                            fire.light.setIntensity(1.6);
                            this.fires = this.fires.filter(f => f !== fire);
                            // Then, proceed with the other cleanup operations
                            this.matter.world.remove(fire.body);
                            fire.shadow.destroy();
                            fire.body.destroy();
                            fire.timerEvent.remove();
                            fire.destroy();
                            this.tweens.killTweensOf(fire.light);
                            fire.light.setIntensity(0);
                        }
                    }
                }
            }
        });
    }
}

export default mainScene;