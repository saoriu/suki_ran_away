export function createAnims(scene, cat) {

   

    function createAnimation(scene, key, startFrame, endFrame) {
        scene.anims.create({
            key: key,
            frames: Array(endFrame - startFrame + 1).fill().map((_, i) => ({ key: 'cat', frame: `${key}-${i + 1}` })),
            frameRate: determineFrameRate(key),
            repeat: 0
        });
    }

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
                return 21;
            case 'dead':
                return 9;
            case 'run':
            case 'rundiagonal':
            case 'rundiagonalfront':
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
    createAnimation(scene, 'dead', 103, 113);
    createAnimation(scene, 'down', 114, 121);
    createAnimation(scene, 'eat', 122, 135);
    createAnimation(scene, 'run', 136, 143);
    createAnimation(scene, 'run-diagonal-back', 144, 151);
    createAnimation(scene, 'run-diagonal-front', 152, 159);
    createAnimation(scene, 'sit-back', 160, 167);
    createAnimation(scene, 'sit-forward', 168, 175);
    createAnimation(scene, 'sit', 176, 183);
    createAnimation(scene, 'up', 184, 191);
    

    // Panda animations
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

    //fox anims
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
}