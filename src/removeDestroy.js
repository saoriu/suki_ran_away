import { GAME_CONFIG } from './gameConstants';

export function removeFarTiles(centerX, centerY, scene, tilesBuffer, tileWidth, tiles, tilePool, allEntities, trees, treePool, treeShadowPool, fires, ponds, pond, bushs, bush, items, monsters, ashes) {
    const camera = scene.cameras.main;
    const startI = Math.floor((centerX - GAME_CONFIG.CAMERA_WIDTH / 2) / tileWidth);
    const endI = Math.ceil((centerX + GAME_CONFIG.CAMERA_WIDTH / 2) / tileWidth);
    const startJ = Math.floor((centerY - camera.height / 2) / tileWidth);
    const endJ = Math.ceil((centerY + camera.height / 2) / tileWidth);
    const buffer = {
        fire: 4,
        ashes: 4,
        pond: 7,
        items: 0,
        tree: 7,
        bush: 3,
        monsters: 2
    };
    Object.keys(scene.tiles).forEach((key) => {
        const [i, j] = key.split(',').map(Number);
        if (i < startI || i > endI || j < startJ || j > endJ) {
            const tile = tiles[key];
            scene.tilePool.push(tile); // Add the tile to the pool
            delete tiles[key];

            scene.items.forEach((item, index) => {
                if (item && item.sprite.active) {
                    const itemTileI = Math.floor(item.sprite.x / tileWidth);
                    const itemTileJ = Math.floor(item.sprite.y / tileWidth);
                    if (itemTileI < startI - buffer.items || itemTileI > endI + buffer.items || itemTileJ < startJ - buffer.items || itemTileJ > endJ + buffer.items) {
                        scene.items = scene.items.filter(i => i !== item);
                        item.sprite.destroy(); // Destroy the sprite, not the wrapper object
                        scene.allEntities = scene.allEntities.filter(entity => entity !== item.sprite);
                    }
                }
            });

            for (let key in monsters) {
                let monster = monsters[key];
                if (monster.sprite && monster.sprite.active) {
                    const monsterTileI = Math.floor(monster.sprite.x / tileWidth);
                    const monsterTileJ = Math.floor(monster.sprite.y / tileWidth);
                    if (monsterTileI < startI - buffer.monsters || monsterTileI > endI + buffer.monsters || monsterTileJ < startJ - buffer.monsters || monsterTileJ > endJ + buffer.monsters) {
                        scene.gameEvents.cleanUpMonster(monster, null, scene.allEntities);
                        scene.allEntities = scene.allEntities.filter(entity => entity !== monster.sprite);
                        delete monsters[key];

                        // If the monster is not aggressive and the aggro sprite exists, destroy it
                        if (monster.aggroSprite) {
                            scene.allEntities = scene.allEntities.filter(entity => entity !== monster.aggroSprite);
                            monster.aggroSprite.destroy();
                            monster.aggroSprite = null;
                        }
                    }
                }
            }

            for (let index = ashes.length - 1; index >= 0; index--) {
                let ashes = scene.ashes[index];
                if (ashes && ashes.active) {
                    const ashesTileI = Math.floor(ashes.x / tileWidth);
                    const ashesTileJ = Math.floor(ashes.y / tileWidth);
                    if (ashesTileI < startI - buffer.ashes || ashesTileI > endI + buffer.ashes || ashesTileJ < startJ - buffer.ashes || ashesTileJ > endJ + buffer.ashes) {
                        scene.ashes.splice(index, 1);
                        ashes.destroy();
                    }
                }
            }

            for (let index = scene.trees.length - 1; index >= 0; index--) {
                let tree = scene.trees[index];
                if (tree && tree.active) {
                    const treeTileI = Math.floor(tree.x / tileWidth);
                    const treeTileJ = Math.floor(tree.y / tileWidth);
                    if (treeTileI < startI - buffer.tree || treeTileI > endI + buffer.tree || treeTileJ < startJ - buffer.tree || treeTileJ > endJ + buffer.tree) { // Check if the tree is out of view
                        tree.isDepleted = false;

                        if (tree.treechopShadow) {
                            tree.treechopShadow.destroy();
                        }

                        scene.trees = scene.trees.filter(t => t !== tree);

                        if (scene.collidingTree === tree) {
                            scene.collidingTree = null;
                        }

                        // Store the tree's body in the tree object
                        tree.storedBody = tree.body;
                        scene.matter.world.remove(tree.body);

                        tree.setActive(false);
                        tree.setVisible(false);
                        scene.treePool.push(tree);
                        tree.shadow.setActive(false);
                        tree.shadow.setVisible(false);
                        scene.treeShadowPool.push(tree.shadow);

                        scene.allEntities = scene.allEntities.filter(entity => entity !== tree);
                        scene.allEntities = scene.allEntities.filter(entity => entity !== tree.shadow);
                    }
                }
            }

            for (let index = scene.ponds.length - 1; index >= 0; index--) {
                let pond = scene.ponds[index];
                if (pond && pond.active) {
                    const pondTileI = Math.floor(pond.x / tileWidth);
                    const pondTileJ = Math.floor(pond.y / tileWidth);
                    if (pondTileI < startI - buffer.pond || pondTileI > endI + buffer.pond || pondTileJ < startJ - buffer.pond || pondTileJ > endJ + buffer.pond) { // Check if the tree is out of view
                        scene.ponds = scene.ponds.filter(p => p !== pond);

                        scene.matter.world.remove(pond.body);

                        pond.body.destroy();
                        pond.destroy();

                        scene.allEntities = scene.allEntities.filter(entity => entity !== pond);
                    }
                }
            }

            for (let index = scene.bushs.length - 1; index >= 0; index--) {
                let bush = scene.bushs[index];
                if (bush && bush.active) {
                    const bushTileI = Math.floor(bush.x / tileWidth);
                    const bushTileJ = Math.floor(bush.y / tileWidth);
                    if (bushTileI < startI - buffer.bush || bushTileI > endI + buffer.bush || bushTileJ < startJ - buffer.bush || bushTileJ > endJ + buffer.bush) { // Check if the tree is out of view
                        scene.bushs = scene.bushs.filter(b => b !== bush);
                        scene.matter.world.remove(bush.body);

                        if (scene.collidingBush === bush) {
                            scene.collidingBush = null;
                        }

                        bush.body.destroy();
                        bush.destroy();

                        scene.allEntities = scene.allEntities.filter(entity => entity !== bush);
                    }
                }
            }

            for (let index = scene.fires.length - 1; index >= 0; index--) {
                let fire = scene.fires[index];
                if (fire && fire.active) {
                    const fireTileI = Math.floor(fire.x / tileWidth);
                    const fireTileJ = Math.floor(fire.y / tileWidth);
                    if (fireTileI < startI - buffer.fire || fireTileI > endI + buffer.fire || fireTileJ < startJ - buffer.fire || fireTileJ > endJ + buffer.fire) {
                        fire.light.setIntensity(1.6);
                        scene.fires = scene.fires.filter(f => f !== fire);
                        // Then, proceed with the other cleanup operations
                        scene.matter.world.remove(fire.body);
                        fire.shadow.destroy();
                        fire.body.destroy();
                        fire.timerEvent.remove();
                        fire.destroy();
                        scene.tweens.killTweensOf(fire.light);
                        fire.light.setIntensity(0);
                    }
                }
            }
        }
    });
}

export function destroyAll(centerX, centerY, scene, tilesBuffer, tileWidth, tiles, tilePool, allEntities, trees, treePool, treeShadowPool, fires, ponds, pond, bushs, bush, items, ashes) {
    const camera = scene.cameras.main;

    const startI = Math.floor((centerX - GAME_CONFIG.CAMERA_WIDTH / 2) / tileWidth);
    const endI = Math.ceil((centerX + GAME_CONFIG.CAMERA_WIDTH / 2) / tileWidth);
    const startJ = Math.floor((centerY - camera.height / 2) / tileWidth);
    const endJ = Math.ceil((centerY + camera.height / 2) / tileWidth);


    Object.keys(scene.tiles).forEach((key) => {
        const [i, j] = key.split(',').map(Number);
        if (i >= startI && i <= endI && j >= startJ && j <= endJ) {

            for (let index = ashes.length - 1; index >= 0; index--) {
                let ash = ashes[index]; // Renamed variable to 'ash'
                if (ash && ash.active) {
                    ash.destroy();
                    scene.ashes.splice(index, 1);

                }
            }

            for (let index = items.length - 1; index >= 0; index--) {
                let item = items[index];
                if (item && item.sprite.active) {

                    item.sprite.destroy(); // Destroy the sprite, not the wrapper object
                    scene.items.splice(index, 1);
                    allEntities = allEntities.filter(entity => entity !== item.sprite);
                }
            }

            for (let index = trees.length - 1; index >= 0; index--) {
                let tree = trees[index];
                if (tree && tree.active) {
                    scene.trees.splice(index, 1);
                    scene.matter.world.remove(tree.body);

                    if (scene.collidingTree === tree) {
                        scene.collidingTree = null;
                    }

                    if (tree.treechopShadow) {
                        tree.treechopShadow.destroy();
                    }
                    tree.shadow.destroy();
                    tree.body.destroy();
                    tree.destroy();

                    allEntities = allEntities.filter(entity => entity !== tree);
                    allEntities = allEntities.filter(entity => entity !== tree.shadow);

                }
            }

            for (let index = ponds.length - 1; index >= 0; index--) {
                let pond = ponds[index];
                if (pond && pond.active) {

                    scene.ponds.splice(index, 1);
                    scene.matter.world.remove(pond.body);

                    pond.body.destroy();
                    pond.destroy();
                    allEntities = allEntities.filter(entity => entity !== pond);

                }
            }


            for (let index = bushs.length - 1; index >= 0; index--) {
                let bush = bushs[index];
                if (bush && bush.active) {

                    bushs.splice(index, 1);
                    scene.matter.world.remove(bush.body);

                    if (scene.collidingBush === bush) {
                        scene.collidingBush = null;
                    }

                    bush.body.destroy();
                    bush.destroy();

                    allEntities = allEntities.filter(entity => entity !== bush);
                }
            }

            for (let index = fires.length - 1; index >= 0; index--) {
                let fire = fires[index];
                if (fire && fire.active) {

                    scene.tweens.killTweensOf(fire.light);
                    // Turn off the light associated with the fire
                    fire.light.setIntensity(0);

                    // Destroy the fire body
                    scene.matter.world.remove(fire.body);

                    // Remove the fire from the fires array before destroying it by filtering it out
                    fires = fires.filter(f => f !== fire);

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