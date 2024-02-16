export function createAnims(scene, cat) {

   

    function createAnimation(scene, key, startFrame, endFrame) {
        scene.anims.create({
            key: key,
            frames: Array(endFrame - startFrame + 1).fill().map((_, i) => ({ key: 'cat', frame: `${key}-${i + 1}` })),
            frameRate: determineFrameRate(key),
            repeat: 0
        });
    }
    

    scene.anims.create({
        key: 'fire',
        frames: Array(3).fill().map((_, i) => ({ key: 'fire', frame: `fire-${i + 1}` })),
        frameRate: 8,
        repeat: -1
    });

    scene.anims.create({
        key: 'pond_2',
        frames: ['pond_2-1', 'pond_2-2', 'pond_2-3'].map(filename => ({ key: 'ponds', frame: filename })),
        frameRate: 3,
        repeat: -1
    });

    scene.anims.create({
        key: 'pond_3',
        frames: ['pond_3-1', 'pond_3-2', 'pond_3-3'].map(filename => ({ key: 'ponds', frame: filename })),
        frameRate: 3,
        repeat: -1
    });

    scene.anims.create({
        key: 'bush_1',
        frames: ['bush_1-1', 'bush_1-2', 'bush_1-3'].map(filename => ({ key: 'bush', frame: filename })),
        frameRate: 3,
        repeat: -1
    });

    scene.anims.create({
        key: 'bush_2',
        frames: ['bush_2-1', 'bush_2-2', 'bush_2-3'].map(filename => ({ key: 'bush', frame: filename })),
        frameRate: 3,
        repeat: -1
    });

    scene.anims.create({
        key: 'bush_3',
        frames: ['bush_3-1', 'bush_3-2', 'bush_3-3'].map(filename => ({ key: 'bush', frame: filename })),
        frameRate: 3,
        repeat: -1
    });

    scene.anims.create({
        key: 'tree_1',
        frames: ['tree_1-1', 'tree_1-2', 'tree_1-3'].map(filename => ({ key: 'trees', frame: filename })),
        frameRate: 3,
        repeat: -1
    });

    scene.anims.create({
        key: 'tree_2',
        frames: ['tree_2-1', 'tree_2-2', 'tree_2-3'].map(filename => ({ key: 'trees', frame: filename })),
        frameRate: 3,
        repeat: -1
    });

    scene.anims.create({
        key: 'tree_3',
        frames: ['tree_3-1', 'tree_3-2', 'tree_3-3'].map(filename => ({ key: 'trees', frame: filename })),
        frameRate: 3,
        repeat: -1
    });
    scene.anims.create({
        key: 'pond',
        frames: Array(2).fill().map((_, i) => ({ key: 'pond', frame: `pond-${i + 1}` })),
        frameRate: 3,
        repeat: -1
    });

    function determineFrameRate(key) {
        switch (key) {
            case 'attack1':
            case 'attack1-back':
            case 'attack1-front':
            case 'attack2':
            case 'attack4':
            case 'attack4-back':
            case 'attack4-front':
                return 8;
            case 'attack3':
            case 'attack3-back':
            case 'attack3-front':
                return 12;
            case 'attack2-back':
            case 'attack2-front':
                return 10;
            case 'attack5':
            case 'attack5-back':
            case 'attack5-front':
                return 25;
            case 'attack6':
            case 'attack6-back':
            case 'attack6-front':
                return 12;
            case 'dead':
                return 9;
            case 'run':
            case 'run-diagonal-back':
            case 'run-diagonal-front':
                return 10;
            case 'sit-back':
            case 'sit-forward':
            case 'sit':
            case 'up':
            case 'down':
                return 7;
            default:
                return 10; // Default frame rate
        }
    }

createAnimation(scene, 'attack1', 0, 3);
createAnimation(scene, 'attack1-back', 4, 7);
createAnimation(scene, 'attack1-front', 8, 11);
createAnimation(scene, 'attack2', 12, 16);
createAnimation(scene, 'attack2-back', 17, 21);
createAnimation(scene, 'attack2-front', 22, 26);
createAnimation(scene, 'attack3', 27, 35);
createAnimation(scene, 'attack3-back', 36, 44);
createAnimation(scene, 'attack3-front', 45, 53);
createAnimation(scene, 'attack4', 54, 58);
createAnimation(scene, 'attack4-back', 59, 63);
createAnimation(scene, 'attack4-front', 64, 68);
createAnimation(scene, 'attack5', 69, 82);
createAnimation(scene, 'attack5-back', 83, 92);
createAnimation(scene, 'attack5-front', 93, 102);
createAnimation(scene, 'attack6', 103, 108); // Updated
createAnimation(scene, 'attack6-back', 109, 115); // Updated
createAnimation(scene, 'attack6-front', 116, 122); // Updated
createAnimation(scene, 'ball', 123, 125); // Updated
createAnimation(scene, 'dead', 126, 136); // Updated
createAnimation(scene, 'down', 138, 145); // Updated
createAnimation(scene, 'eat', 146, 158); // Updated
createAnimation(scene, 'run-diagonal-back', 159, 166); // Updated
createAnimation(scene, 'run-diagonal-front', 167, 174); // Updated
createAnimation(scene, 'run', 175, 182); // Updated
createAnimation(scene, 'sit-back', 183, 190); // Updated
createAnimation(scene, 'sit-forward', 191, 198); // Updated
createAnimation(scene, 'sit', 199, 206); // Updated
createAnimation(scene, 'up', 207, 214); // Updated


    scene.anims.create({
        key: 'panda_attack',
        frames: Array(8).fill().map((_, i) => ({ key: 'monsters', frame: `panda_attack-${i + 1}` })),
        frameRate: 16,
        repeat: 0
    });

    scene.anims.create({
        key: 'panda_die',
        frames: Array(8).fill().map((_, i) => ({ key: 'monsters', frame: `panda_die-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'panda_hurt',
        frames: Array(6).fill().map((_, i) => ({ key: 'monsters', frame: `panda_hurt-${i + 1}` })),
        frameRate: 14,
        repeat: 0
    });

    scene.anims.create({
        key: 'panda',
        frames: Array(4).fill().map((_, i) => ({ key: 'monsters', frame: `panda_idle-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'panda_run',
        frames: Array(8).fill().map((_, i) => ({ key: 'monsters', frame: `panda_run-${i + 1}` })),
        frameRate: 12,
        repeat: 0
    });

    // Dragonfly animations
    scene.anims.create({
        key: 'dragonfly',
        frames: Array(6).fill().map((_, i) => ({ key: 'monsters', frame: `dragonfly_idle-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'dragonfly_run',
        frames: Array(6).fill().map((_, i) => ({ key: 'monsters', frame: `dragonfly_run-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'dragonfly_attack',
        frames: Array(7).fill().map((_, i) => ({ key: 'monsters', frame: `dragonfly_attack-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'dragonfly_hurt',
        frames: Array(5).fill().map((_, i) => ({ key: 'monsters', frame: `dragonfly_hurt-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'dragonfly_die',
        frames: Array(8).fill().map((_, i) => ({ key: 'monsters', frame: `dragonfly_die-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    // Bunny animations
    scene.anims.create({
        key: 'bunny',
        frames: Array(4).fill().map((_, i) => ({ key: 'monsters', frame: `bunny_idle-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'bunny_run',
        frames: Array(6).fill().map((_, i) => ({ key: 'monsters', frame: `bunny_run-${i + 1}` })),
        frameRate: 12,
        repeat: 0
    });

    scene.anims.create({
        key: 'bunny_attack',
        frames: Array(6).fill().map((_, i) => ({ key: 'monsters', frame: `bunny_attack-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'bunny_hurt',
        frames: Array(6).fill().map((_, i) => ({ key: 'monsters', frame: `bunny_hurt-${i + 1}` })),
        frameRate: 12,
        repeat: 0
    });

    scene.anims.create({
        key: 'bunny_die',
        frames: Array(12).fill().map((_, i) => ({ key: 'monsters', frame: `bunny_die-${i + 1}` })),
        frameRate: 16,
        repeat: 0
    });

      // Raccoon Idle Animation
      scene.anims.create({
        key: 'raccoon',
        frames: Array(8).fill().map((_, i) => ({ key: 'monsters', frame: `raccoon_idle-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    // raccoon Run Animation
    scene.anims.create({
        key: 'raccoon_run',
        frames: Array(8).fill().map((_, i) => ({ key: 'monsters', frame: `raccoon_run-${i + 1}` })),
        frameRate: 12,
        repeat: 0
    });

    // raccoon Attack Animation
    scene.anims.create({
        key: 'raccoon_attack',
        frames: Array(7).fill().map((_, i) => ({ key: 'monsters', frame: `raccoon_attack-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    // raccoon Hurt Animation
    scene.anims.create({
        key: 'raccoon_hurt',
        frames: Array(7).fill().map((_, i) => ({ key: 'monsters', frame: `raccoon_hurt-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    // raccoon Die Animation
    scene.anims.create({
        key: 'raccoon_die',
        frames: Array(8).fill().map((_, i) => ({ key: 'monsters', frame: `raccoon_die-${i + 1}` })),
        frameRate: 20,
        repeat: 0
    });

    // Chicken Idle Animation
    scene.anims.create({
        key: 'chicken',
        frames: Array(4).fill().map((_, i) => ({ key: 'monsters', frame: `chicken_idle-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    // Chicken Run Animation
    scene.anims.create({
        key: 'chicken_run',
        frames: Array(4).fill().map((_, i) => ({ key: 'monsters', frame: `chicken_run-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    // Chicken Attack Animation
    scene.anims.create({
        key: 'chicken_attack',
        frames: Array(6).fill().map((_, i) => ({ key: 'monsters', frame: `chicken_attack-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    // Chicken Hurt Animation
    scene.anims.create({
        key: 'chicken_hurt',
        frames: Array(5).fill().map((_, i) => ({ key: 'monsters', frame: `chicken_hurt-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    // Chicken Die Animation
    scene.anims.create({
        key: 'chicken_die',
        frames: Array(10).fill().map((_, i) => ({ key: 'monsters', frame: `chicken_die-${i + 1}` })),
        frameRate: 20,
        repeat: 0
    });

    //turtle anims
    scene.anims.create({
        key: 'turtle',
        frames: Array(6).fill().map((_, i) => ({ key: 'monsters', frame: `turtle_idle-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    //turtle hurt anims
    scene.anims.create({
        key: 'turtle_hurt',
        frames: Array(6).fill().map((_, i) => ({ key: 'monsters', frame: `turtle_hurt-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'turtle_run',
        frames: Array(5).fill().map((_, i) => ({ key: 'monsters', frame: `turtle_walk-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'turtle_die',
        frames: Array(10).fill().map((_, i) => ({ key: 'monsters', frame: `turtle_die-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'turtle_attack',
        frames: Array(8).fill().map((_, i) => ({ key: 'monsters', frame: `turtle_hide-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    function createAnimsPink(scene, creature, action, start, end) {
        const frames = [];
        for(let i = start; i <= end; i++) {
            // The frame key includes the index
            const frameKey = action ? `${creature}_${action}-${i}` : `${creature}-${i}`;
            frames.push({ key: 'pinkfly', frame: frameKey });
        }
        // The animation key does not include the index
        const animKey = action ? `${creature}_${action}` : creature;
        scene.anims.create({
            key: animKey,
            frames: frames,
            frameRate: 10,
            repeat: 0
        });
    }

    createAnimsPink(scene, 'pinkfly', 'attack', 1, 7);
    createAnimsPink(scene, 'pinkfly', 'die', 1, 8);
    createAnimsPink(scene, 'pinkfly', 'hurt', 1, 5);
    createAnimsPink(scene, 'pinkfly', '', 1, 6); // This will create an animation with key 'pinkfly'
    createAnimsPink(scene, 'pinkfly', 'run', 1, 6);
    

    function createAnims(scene, creature, action, start, end) {
        const frames = [];
        for(let i = start; i <= end; i++) {
            // The frame key includes the index
            const frameKey = action ? `${creature}_${action}-${i}` : `${creature}-${i}`;
            frames.push({ key: 'treemonsters', frame: frameKey });
        }
        // The animation key does not include the index
        const animKey = action ? `${creature}_${action}` : creature;
        scene.anims.create({
            key: animKey,
            frames: frames,
            frameRate: 10,
            repeat: 0
        });
    }

    // Falcon animations
    createAnims(scene, 'falcon', 'attack', 1, 6);
    createAnims(scene, 'falcon', 'die', 1, 16);
    createAnims(scene, 'falcon', 'fall', 1, 2);
    createAnims(scene, 'falcon', 'hurt', 1, 5);
    createAnims(scene, 'falcon', 'land', 1, 3);
    createAnims(scene, 'falcon', '', 1, 6); // This will create an animation with key 'falcon'
    createAnims(scene, 'falcon', 'run', 1, 6);

    createAnims(scene, 'parrot', 'attack', 1, 6);
    createAnims(scene, 'parrot', 'die', 1, 16);
    createAnims(scene, 'parrot', 'fall', 1, 2);
    createAnims(scene, 'parrot', 'hurt', 1, 5);
    createAnims(scene, 'parrot', 'land', 1, 3);
    createAnims(scene, 'parrot', '', 1, 12); // This will create an animation with key 'parrot'
    createAnims(scene, 'parrot', 'run', 1, 6);

    scene.anims.create({
        key: 'fox',
        frames: Array(8).fill().map((_, i) => ({ key: 'monsters', frame: `fox_idle-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });
    
    scene.anims.create({
        key: 'fox_hurt',
        frames: Array(7).fill().map((_, i) => ({ key: 'monsters', frame: `fox_hurt-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'fox_run',
        frames: Array(8).fill().map((_, i) => ({ key: 'monsters', frame: `fox_run-${i + 1}` })),
        frameRate: 14,
        repeat: 0
    });

    scene.anims.create({
        key: 'fox_die',
        frames: Array(8).fill().map((_, i) => ({ key: 'monsters', frame: `fox_die-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'fox_attack',
        frames: Array(7).fill().map((_, i) => ({ key: 'monsters', frame: `fox_attack-${i + 1}` })),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'heal',
        frames: scene.anims.generateFrameNumbers('heal', { start: 0, end: 6 }),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'hairballs',
        frames: scene.anims.generateFrameNumbers('hairballs', { start: 0, end: 2 }),
        frameRate: 4,
        repeat: -1
    });

}