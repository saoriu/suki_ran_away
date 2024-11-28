import Phaser from 'phaser';
import { eventOptions } from './eventOptions.js';

export function createShadows(scene) {
    // Loop through each event option
    eventOptions.forEach(option => {
        // Get the monster type and atlas
        let monsterType = option.monster;
        let atlasKey = option.atlas;

        // Get the frame data
        let frameName = atlasKey === 'monsters' ? `${monsterType}_idle-1` : `${monsterType}-1`;
        let frameData = scene.textures.getFrame(atlasKey, frameName);

        // Calculate the trimmed dimensions
        let trimmedWidth = frameData.cutWidth;
        let trimmedHeight = frameData.cutHeight;

        // Create a new canvas texture for the shadow
        let shadowTexture1 = scene.textures.createCanvas(`${monsterType}Shadow1`, trimmedWidth, trimmedHeight);
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

        let shadowTexture2 = scene.textures.createCanvas(`${monsterType}Shadow2`, trimmedWidth, trimmedHeight);
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
        scene.anims.create({
            key: `${monsterType}ShadowAnimation`,
            frames: [{ key: `${monsterType}Shadow1` }, { key: `${monsterType}Shadow2` }],
            frameRate: 3, // Adjust this value to your needs
            repeat: -1 // This will make the animation loop indefinitely
        });
    });

    // Create a new canvas texture for the small shadow
    let smallTexture = scene.textures.createCanvas('smallShadow', 32, 32);
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

    let mediumTexture = scene.textures.createCanvas('mediumShadow', 48, 48);
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
    let largeTexture = scene.textures.createCanvas('largeShadow', 64, 64);
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
    scene.anims.create({
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
    scene.catShadow = scene.add.sprite(0, 0, 'largeShadow');

    // Set the pipeline, depth, and blend mode as before
    scene.catShadow.setPipeline('Light2D');
    scene.catShadow.depth = 1;
    scene.catShadow.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // Create a new canvas texture for the small shadow
    let treeShadowTexture = scene.textures.createCanvas('treeShadow', 64 * 3.5, 64 * 2.8);
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
    let treeShadowTexture2 = scene.textures.createCanvas('treeShadow2', 64 * 3.6, 64 * 2.8);
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

    scene.anims.create({
        key: 'treeshadowAnimation',
        frames: [
            { key: 'treeShadow' },
            { key: 'treeShadow2' },
        ],
        frameRate: 2, // Adjust this value to your needs
        repeat: -1 // This will make the animation loop indefinitely
    });

    // Create a new canvas texture for the small shadow
    let treeShadowTexture3 = scene.textures.createCanvas('treeShadow3', 64 * 3, 64 * 2.2);
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
}