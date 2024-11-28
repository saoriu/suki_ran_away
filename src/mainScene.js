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
import { handlePlayerMovement } from './playerMovement.js';
import { Item } from './Item';
import { itemInfo } from './itemInfo.js';
import { eventOptions } from './eventOptions.js';
import chroma from 'chroma-js';
import { setupPlayerCombat, updateHealthBar } from './playerCombat.js';
import { spawnFire, spawnPonds, spawnTrees, spawnbush } from './spawnObjects';
import { removeFarTiles, destroyAll } from './removeDestroy.js';


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

    preload() {
        const skins = ['nori', 'cat', 'mochi', 'ume', 'yaku'];
        skins.forEach(skin => {
            this.load.atlas(skin, `/characters/${skin}.png`, `/characters/${skin}.json`);
        });
    }

    create() {
        if (!PlayerState.skin || PlayerState.skin === 'default') {
            this.scene.start('CharacterSelectionScene');
            return;
        }

        createAnims(this, PlayerState.skin);
        const camera = this.cameras.main;
        this.lights.enable();
        this.scene.launch('UIScene');
        this.monsters = {};
        camera.setSize(GAME_CONFIG.CAMERA_WIDTH, GAME_CONFIG.CAMERA_HEIGHT); // restrict camera size

        this.cat = this.matter.add.sprite(0, 0, 'sit', null, {
            isStatic: false,
            friction: 0,
        }).setScale(1).setCircle(50).setDepth(5)

        this.checkCollar();
        // Adjust the physics properties of the this.cat
        const catBody = this.cat.body;
        catBody.inertia = Infinity; // Prevent rotation
        catBody.inverseInertia = 0;
        catBody.mass = 1;

        this.cat.body.friction = 1;
        this.cat.body.restitution = 1;
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

        setupPlayerCombat(this);



        this.allEntities.push(this.cat);
        this.allEntities.push(this.collar);
        
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

        handlePlayerMovement(this, delta);

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
            removeFarTiles(this.cat.x, this.cat.y, this, this.tilesBuffer, this.tileWidth, this.tiles, this.tilePool, this.allEntities, this.trees, this.treePool, this.treeShadowPool, this.fires, this.ponds, this.pond, this.bushs, this.bush, this.items, this.monsters, this.ashes)
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

            updateHealthBar(this, monsterObj.healthBar, monsterObj.currentHealth, monsterObj.maxHealth);

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


        destroyAll(this.cat.x, this.cat.y, this, this.tileWidth, this.tilesBuffer, this.tiles, this.trees, this.bushes, this.fires, this.monsters, this.allEntities, this.ashes, this.ponds, this.fruits, this.logs, this.collar);

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

            spawnFire(centerX, centerY, scene, this.tileWidth, this.tilesBuffer, this.fires, this.ashes, this.ponds, this.bushs, this.trees, this.monsters, this.allEntities)
        }



        const treeProbability = 0.99;
        const randomTreeFloat = Phaser.Math.FloatBetween(0, 1);
        if (randomTreeFloat < treeProbability) {
            const randomNumberOfTrees = Phaser.Math.Between(1, 10);
            for (let i = 0; i < randomNumberOfTrees; i++) {
               spawnTrees(centerX, centerY, scene, this.tileWidth, this.tilesBuffer, this.trees, this.ponds, this.fires, this.bushs, this.monsters, this.treePool, this.allEntities);
            }
        }


        const pondProbability = 0.60;
        const randomPondFloat = Phaser.Math.FloatBetween(0, 1);
        if (randomPondFloat < pondProbability) {
            const randomNumberOfPonds = Phaser.Math.Between(1, 2);

            for (let i = 0; i < randomNumberOfPonds; i++) {

              spawnPonds(centerX, centerY, scene, this.tileWidth, this.tilesBuffer, this.ponds, this.trees, this.fires, this.bushs, this.monsters, this.allEntities);
            }
        }

        const bushProbability = 0.80;
        const randombushFloat = Phaser.Math.FloatBetween(0, 1);
        if (randombushFloat < bushProbability) {
            const randomNumberOfbushs = Phaser.Math.Between(1, 3);

            for (let i = 0; i < randomNumberOfbushs; i++) {

               spawnbush(centerX, centerY, scene, this.tileWidth, this.tilesBuffer, this.bushs, this.trees, this.fires, this.ponds, this.monsters, this.allEntities);
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
   
}

export default mainScene;