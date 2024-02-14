export class mainScene extends Phaser.Scene {

    constructor() {
    super({ key: 'mainScene' });
    this.tiles = {};
    this.allEntities = [];
    this.ashes = [];
    this.fire = [];
    this.fires = [];
    this.newlastPlayerX = 0;
    this.newlastPlayerY = 0;
}   

update(time, delta) {


if (Math.abs(this.cat.x - this.newlastPlayerX) > this.newpositionChangeThreshold ||
    Math.abs(this.cat.y - this.newlastPlayerY) > this.newpositionChangeThreshold) {
    this.spawnMonstersFire(this.cat.x, this.cat.y, this);
    this.newlastPlayerX = this.cat.x;
    this.newlastPlayerY = this.cat.y;
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

spawnMonstersFire() {

    const fireProbability = 0.25 * (1 + PlayerState.fireBonus / 100);
    const randomFireFloat = Phaser.Math.FloatBetween(0, 1);
    if (randomFireFloat < fireProbability) {

        this.spawnFire();

    }

}

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