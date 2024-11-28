import Phaser from "phaser";

export function spawnFire(centerX, centerY, scene, tileWidth, tilesBuffer, fires, ashes, trees, ponds, bushs) {
    const camera = scene.cameras.main;
    const visibleStartI = Math.floor((centerX - camera.width / 2) / tileWidth);
    const visibleEndI = Math.ceil((centerX + camera.width / 2) / tileWidth);
    const visibleStartJ = Math.floor((centerY - camera.height / 2) / tileWidth);
    const visibleEndJ = Math.ceil((centerY + camera.height / 2) / tileWidth);

    const bufferStartI = visibleStartI - (tilesBuffer + 4); // extend outward by 1 tile
    const bufferEndI = visibleEndI + (tilesBuffer + 4);    // extend outward by 1 tile
    const bufferStartJ = visibleStartJ - (tilesBuffer + 4); // extend outward by 1 tile
    const bufferEndJ = visibleEndJ + (tilesBuffer + 4);    // extend outward by 1 tile

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

    const x = spawnTileI * tileWidth;
    const y = spawnTileJ * tileWidth;

    const isTooCloseToOtherObjects = (objectArray, distanceThreshold) => {
        return objectArray.some(obj => {
            if (obj && obj.active) {
                const dx = obj.x - x;
                const dy = obj.y - y;
                const distanceInTiles = Math.sqrt(dx * dx + dy * dy) / tileWidth;
                return distanceInTiles <= distanceThreshold;
            }
            return false;
        });
    };

    // Check if the new location is too close to existing fires, trees, ponds, or bushes
    if (isTooCloseToOtherObjects(fires, 120) ||
        isTooCloseToOtherObjects(ashes, 120) || // assuming a tree threshold
        isTooCloseToOtherObjects(trees, 4) || // assuming a tree threshold
        isTooCloseToOtherObjects(ponds, 10) || // assuming a pond threshold
        isTooCloseToOtherObjects(bushs, 3)) { // assuming a bush threshold
        return;
    }

    const fire = scene.matter.add.sprite(x, y, 'fire', null, {
        label: 'fire'
    }).setCircle(70).setDepth(2);

    const fireShadow = scene.add.sprite(fire.x, fire.y, 'fire');
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

    scene.matter.body.setStatic(fire.body, true);

    fire.body.isSensor = true;

    fire.light = scene.lights.addLight(x, y, 400).setColor(0xFF4500).setIntensity(1.6);

    scene.tweens.add({
        targets: fire.light,
        radius: { from: 325, to: 400 },
        ease: 'Sine.easeInOut',
        duration: 1500,
        yoyo: true,
        repeat: -1
    });

    scene.fires.push(fire);

    const checkFireStatus = (fire) => {
        if (Date.now() >= fire.endTime) {
            if (fire && fire.active) {
                const x = fire.x;
                const y = fire.y;

                // Check if the fire object has a light property
                if (fire.light) {
                    fire.light.setIntensity(0);
                }

                // Check if the scene.matter world exists before removing the fire body
                if (scene.matter && scene.matter.world) {
                    scene.matter.world.remove(fire.body);
                }

                //if fire shadow exists, remove it
                if (fire.shadow) {
                    fire.shadow.destroy();
                }

                // Check if the fires array exists before removing the fire object by filtering it
                if (fires) {
                    fires = fires.filter(f => f !== fire);
                }

                // Check if the add method exists before creating the ashes sprite
                if (scene.add) {
                    let ashesSprite = scene.add.sprite(x, y, 'ashes').setDepth(1).setPipeline('Light2D');

                    // Check if the ashes array exists before adding the ashes sprite
                    if (ashes) {
                        ashes.push(ashesSprite);
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
        } else {
            if (fire && fire.active) {
                const timeLeft = Math.round((fire.endTime - Date.now()) / 1000);
                const proportion = Math.min(timeLeft / 15, 1); // Cap the proportion at 1

                // Set the intensity proportional to the time left, capped at 1.7
                const intensity = 1.7 * proportion;

                fire.light.setIntensity(intensity);
            }
        }
    };

    for (let index = fires.length - 1; index >= 0; index--) {
        let fire = fires[index];

        if (fire && fire.active) {
            fire.light.setIntensity(1.6);
            fire.endTime = Date.now() + 15000;

            // Create a recurring timer event that checks if the fire should be extinguished
            fire.timerEvent = scene.time.addEvent({
                delay: 1000, // Check every second
                callback: () => checkFireStatus(fire),
                loop: true
            });
        }
    }
}

export function spawnTrees(centerX, centerY, scene, tileWidth, tilesBuffer, trees, ponds, bushs, fires, monsters, treePool, allEntities) {
    const camera = scene.cameras.main;
    const visibleStartI = Math.floor((centerX - camera.width / 2) / tileWidth);
    const visibleEndI = Math.ceil((centerX + camera.width / 2) / tileWidth);
    const visibleStartJ = Math.floor((centerY - camera.height / 2) / tileWidth);
    const visibleEndJ = Math.ceil((centerY + camera.height / 2) / tileWidth);

    const bufferStartI = visibleStartI - (tilesBuffer + 7); // extend outward by 1 tile
    const bufferEndI = visibleEndI + (tilesBuffer + 7);    // extend outward by 1 tile
    const bufferStartJ = visibleStartJ - (tilesBuffer + 7); // extend outward by 1 tile
    const bufferEndJ = visibleEndJ + (tilesBuffer + 7);   // extend outward by 1 tile

    let spawnTileI, spawnTileJ;

    //spawn a tree at a random location in the buffer area
    spawnTileI = Phaser.Math.Between(bufferStartI, bufferEndI);
    spawnTileJ = Phaser.Math.Between(bufferStartJ, bufferEndJ);

    // Check if the chosen tile is within the visible area
    if ((spawnTileI + 5 >= visibleStartI && spawnTileI - 5 <= visibleEndI) && (spawnTileJ + 5 >= visibleStartJ && spawnTileJ - 5 <= visibleEndJ)) {
        // If it is, return and don't spawn a fire
        return;
    }

    const x = spawnTileI * tileWidth;
    const y = spawnTileJ * tileWidth;

    const isTooCloseToOtherObjects = (objectArray, distanceThreshold) => {
        return objectArray.some(obj => {
            if (obj && obj.active) {
                const dx = obj.x - x;
                const dy = obj.y - y;
                const distanceInTiles = Math.sqrt(dx * dx + dy * dy) / tileWidth;
                return distanceInTiles <= distanceThreshold;
            }
            return false;
        });
    };

    const monstersArray = Object.values(monsters);

    // Check if the new location is too close to existing fires, trees, ponds, bushes, or monsters
    if (isTooCloseToOtherObjects(fires, 4) ||
        isTooCloseToOtherObjects(trees, 3) || // assuming a tree threshold
        isTooCloseToOtherObjects(ponds, 9) || // assuming a pond threshold
        isTooCloseToOtherObjects(bushs, 4) || // assuming a bush threshold
        isTooCloseToOtherObjects(monstersArray, 4)) { // Check if there's a tile at the spawn location in the objects layer
        return;
    }

    let tree;
    let treeShadow;

    if (treePool.length > 0) {
        tree = treePool.pop();
        treeShadow = scene.add.sprite(x, y, 'treeShadow');


        tree.body = tree.storedBody;
        scene.matter.world.add(tree.body);

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
            if (scene.anims.exists('treeshadowAnimation')) {
                treeShadow.play('treeshadowAnimation', true);
            } else {
                console.error('Animation treeshadowAnimation does not exist');
            }
        }
    } else {
        const treeVertices = createTreeVertices(x, y);
        const treeBody = scene.matter.add.fromVertices(x, y, treeVertices, {
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

        tree = scene.matter.add.sprite(x, y, treeType, null, {
            label: 'tree'
        }).setExistingBody(treeBody); // Set the depth to be proportional to the y-coordinate

        tree.storedBody = treeBody; // Moved this line here

        setTreeProperties(tree, treeType);

        treeShadow = scene.add.sprite(x, y, 'treeShadow');
        tree.shadow = treeShadow;
        treeShadow.label = 'treeShadow';


        if (!tree.isDepleted) {
            tree.play(tree.originalType);
            if (scene.anims.exists('treeshadowAnimation')) {
                treeShadow.play('treeshadowAnimation', true);
            } else {
                console.error('Animation treeshadowAnimation does not exist');
            }
        }

        setBodyProperties(tree.body);
    }

    scene.trees.push(tree);
    scene.allEntities.push(tree.shadow);
    scene.allEntities.push(tree);
}

export function setTreeProperties(tree, treeType) {
    if (treeType === 'tree_3') {
        tree.setOrigin(0.46, 0.80);
    } else {
        tree.setOrigin(0.5, 0.80);
    }
    tree.setPipeline('Light2D');
    tree.isDepleted = false;
    tree.originalType = treeType;
}

export function setBodyProperties(body) {
    body.friction = 0;
    body.frictionAir = 0;
    body.restitution = 0;
    for (let part of body.parts) {
        part.friction = 0;
        part.frictionAir = 0;
        part.restitution = 0;
    }
}

export function spawnPonds(centerX, centerY, scene, tileWidth, tilesBuffer, ponds, trees, bushs, fires, monsters, allEntities) {
    const camera = scene.cameras.main;


    const visibleStartI = Math.floor((centerX - camera.width / 2) / tileWidth);
    const visibleEndI = Math.ceil((centerX + camera.width / 2) / tileWidth);
    const visibleStartJ = Math.floor((centerY - camera.height / 2) / tileWidth);
    const visibleEndJ = Math.ceil((centerY + camera.height / 2) / tileWidth);

    const bufferStartI = visibleStartI - (tilesBuffer + 6); // extend outward by 1 tile
    const bufferEndI = visibleEndI + (tilesBuffer + 6);    // extend outward by 1 tile
    const bufferStartJ = visibleStartJ - (tilesBuffer + 6); // extend outward by 1 tile
    const bufferEndJ = visibleEndJ + (tilesBuffer + 6);   // extend outward by 1 tile

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

    const x = spawnTileI * tileWidth;
    const y = spawnTileJ * tileWidth;

    const isTooCloseToOtherObjects = (objectArray, distanceThreshold) => {
        return objectArray.some(obj => {
            if (obj && obj.active) {
                const dx = obj.x - x;
                const dy = obj.y - y;
                const distanceInTiles = Math.sqrt(dx * dx + dy * dy) / tileWidth;
                return distanceInTiles <= distanceThreshold;
            }
            return false;
        });
    };

    const monstersArray = Object.values(monsters);


    // Check if the new location is too close to existing fires, trees, ponds, or bushes
    if (isTooCloseToOtherObjects(fires, 9) ||
        isTooCloseToOtherObjects(trees, 10) || // assuming a tree threshold
        isTooCloseToOtherObjects(ponds, 14) || // assuming a pond threshold
        isTooCloseToOtherObjects(bushs, 10) ||
        isTooCloseToOtherObjects(monstersArray, 5)) {
        return;
    }

    if (ponds.filter(pond => pond.active).length >= 3) {
        return;
    }

    const pondTypes = ['pond', 'pond_2', 'pond_3'];

    // Choose a random pond type
    const randomPondType = Phaser.Math.RND.pick(pondTypes);

    const pond = scene.matter.add.sprite(x, y, randomPondType, null, {
        label: 'pond'
    });
    let pondVertices;
    let originX = 0.5;
    let originY = 0.5;
    switch (randomPondType) {
        case 'pond':
            pondVertices = createPondVertices(randomPondType, x, y);
            originX = 0.5;
            originY = 0.5;
            break;
        case 'pond_2':
            pondVertices = createPondVertices(randomPondType, x, y);
            originX = 0.58;
            originY = 0.5;
            break;
        case 'pond_3':
            pondVertices = createPondVertices(randomPondType, x, y);
            originX = 0.59;
            originY = 0.41;
            break;
        default:
            break;
    }
    const pondBody = scene.matter.add.fromVertices(x, y, pondVertices, {
        isStatic: true
    }, true);
    pondBody.label = 'pond';
    pond.setExistingBody(pondBody).setOrigin(originX, originY);
    pond.setPipeline('Light2D');
    pond.setDepth(2);
    pond.play(randomPondType);

    scene.ponds.push(pond);
    scene.allEntities.push(pond);
}

export function createPondVertices(pondType, x, y) {
    let vertices;
    switch (pondType) {
        case 'pond':
            vertices = createEllipseVertices(x, y, 170, 120, 16);
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



export function createEllipseVertices(x, y, width, height, numVertices) {
    const vertices = [];
    for (let i = 0; i < numVertices; i++) {
        const angle = Phaser.Math.DegToRad((360 / numVertices) * i);
        const xv = x + width * Math.cos(angle);
        const yv = y + height * Math.sin(angle);
        vertices.push({ x: xv, y: yv });
    }
    return vertices;
}

export function createTreeVertices(x, y) {
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

export function spawnbush(centerX, centerY, scene, tileWidth, tilesBuffer, bushs, fires, trees, ponds, allEntities, monsters) {
    const camera = scene.cameras.main;


    const visibleStartI = Math.floor((centerX - camera.width / 2) / tileWidth);
    const visibleEndI = Math.ceil((centerX + camera.width / 2) / tileWidth);
    const visibleStartJ = Math.floor((centerY - camera.height / 2) / tileWidth);
    const visibleEndJ = Math.ceil((centerY + camera.height / 2) / tileWidth);

    const bufferStartI = visibleStartI - (tilesBuffer + 3); // extend outward by 1 tile
    const bufferEndI = visibleEndI + (tilesBuffer + 3);    // extend outward by 1 tile
    const bufferStartJ = visibleStartJ - (tilesBuffer + 3); // extend outward by 1 tile
    const bufferEndJ = visibleEndJ + (tilesBuffer + 3);   // extend outward by 1 tile

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

    const x = spawnTileI * tileWidth;
    const y = spawnTileJ * tileWidth;

    const isTooCloseToOtherObjects = (objectArray, distanceThreshold) => {
        return objectArray.some(obj => {
            if (obj && obj.active) {
                const dx = obj.x - x;
                const dy = obj.y - y;
                const distanceInTiles = Math.sqrt(dx * dx + dy * dy) / tileWidth;
                return distanceInTiles <= distanceThreshold;
            }
            return false;
        });
    };

    const monstersArray = Object.values(monsters);


    // Check if the new location is too close to existing fires, trees, ponds, or bushes
    if (isTooCloseToOtherObjects(fires, 3) ||
        isTooCloseToOtherObjects(trees, 3) || // assuming a tree threshold
        isTooCloseToOtherObjects(ponds, 9) || // assuming a pond threshold
        isTooCloseToOtherObjects(monstersArray, 3) ||
        isTooCloseToOtherObjects(bushs, 3)) { // Check if there's a tile at the spawn location in the objects layer
        return;
    }

    // If there are already 2 trees in the view, don't spawn a new one
    if (bushs.filter(bush => bush.active).length >= 4) {
        return;
    }

    const bushTypes = ['bush_1', 'bush_2', 'bush_3'];

    // Choose a random bush type
    const randomBushType = Phaser.Math.RND.pick(bushTypes);

    const bush = scene.matter.add.sprite(x, y, randomBushType, null, {
        label: 'bush'
    });

    // Approximate an ellipse using a polygon body
    const ellipseVertices = createEllipseVertices(x, y, 50, 50, 16);
    const bushBody = scene.matter.add.fromVertices(x, y, ellipseVertices, {
        isStatic: true
    }, true);

    bushBody.label = 'bush';


    bush.setExistingBody(bushBody).setOrigin(0.5, 0.6);
    bush.setPipeline('Light2D');
    bush.play(randomBushType);
    bush.originalType = randomBushType;

    bush.isDepleted = false;


    scene.bushs.push(bush);
    scene.allEntities.push(bush);

}    