export function createAnims(scene, cat) {

    scene.anims.create({
    key: 'turtle',
    frames: Array.from({ length: 6 }, (_, i) => ({ key: `turtle-${i + 1}` })),
    frameRate: 12,
    repeat: 0
});

scene.anims.create({
    key: 'turtle_run',
    frames: Array.from({ length: 5 }, (_, i) => ({ key: `turtle_run-${i + 1}` })),
    frameRate: 12,
    repeat: 0
});

scene.anims.create({
    key: 'turtle_hurt',
    frames: Array.from({ length: 6 }, (_, i) => ({ key: `turtle_hurt-${i + 1}` })),
    frameRate: 12,
    repeat: 0
});

scene.anims.create({
    key: 'turtle_die',
    frames: Array.from({ length: 12 }, (_, i) => ({ key: `turtle_die-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'turtle_attack',
    frames: Array.from({ length: 6 }, (_, i) => ({ key: `turtle_attack-${i + 1}` })),
    frameRate: 12,
    repeat: 0
});

scene.anims.create({
    key: 'bunny',
    frames: Array.from({ length: 4 }, (_, i) => ({ key: `bunny-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'bunny_run',
    frames: Array.from({ length: 6 }, (_, i) => ({ key: `bunny_run-${i + 1}` })),
    frameRate: 12,
    repeat: 0
});

scene.anims.create({
    key: 'bunny_attack',
    frames: Array.from({ length: 6 }, (_, i) => ({ key: `bunny_attack-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'bunny_hurt',
    frames: Array.from({ length: 6 }, (_, i) => ({ key: `bunny_hurt-${i + 1}` })),
    frameRate: 12,
    repeat: 0
});

scene.anims.create({
    key: 'bunny_die',
    frames: Array.from({ length: 16 }, (_, i) => ({ key: `bunny_die-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'chicken',
    frames: Array.from({ length: 4 }, (_, i) => ({ key: `chicken-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'chicken_run',
    frames: Array.from({ length: 4 }, (_, i) => ({ key: `chicken_run-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'chicken_attack',
    frames: Array.from({ length: 6 }, (_, i) => ({ key: `chicken_attack-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'chicken_hurt',
    frames: Array.from({ length: 5 }, (_, i) => ({ key: `chicken_hurt-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'chicken_die',
    frames: Array.from({ length: 10 }, (_, i) => ({ key: `chicken_die-${i + 1}` })),
    frameRate: 20,
    repeat: 0
});

scene.anims.create({
    key: 'dragonfly',
    frames: Array.from({ length: 6 }, (_, i) => ({ key: `dragonfly-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'dragonfly_run',
    frames: Array.from({ length: 6 }, (_, i) => ({ key: `dragonfly_run-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'dragonfly_attack',
    frames: Array.from({ length: 7 }, (_, i) => ({ key: `dragonfly_attack-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'dragonfly_hurt',
    frames: Array.from({ length: 5 }, (_, i) => ({ key: `dragonfly_hurt-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'dragonfly_die',
    frames: Array.from({ length: 8 }, (_, i) => ({ key: `dragonfly_die-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

// Panda Animations
scene.anims.create({
    key: 'panda',
    frames: Array.from({ length: 4 }, (_, i) => ({ key: `panda-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'panda_run',
    frames: Array.from({ length: 8 }, (_, i) => ({ key: `panda_run-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'panda_attack',
    frames: Array.from({ length: 5 }, (_, i) => ({ key: `panda_attack-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'panda_hurt',
    frames: Array.from({ length: 7 }, (_, i) => ({ key: `panda_hurt-${i + 1}` })),
    frameRate: 14,
    repeat: 0
});

scene.anims.create({
    key: 'panda_die',
    frames: Array.from({ length: 8 }, (_, i) => ({ key: `panda_die-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

// Raccoon Animations
scene.anims.create({
    key: 'raccoon',
    frames: Array.from({ length: 8 }, (_, i) => ({ key: `raccoon-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'raccoon_run',
    frames: Array.from({ length: 8 }, (_, i) => ({ key: `raccoon_run-${i + 1}` })),
    frameRate: 14,
    repeat: 0
});

scene.anims.create({
    key: 'raccoon_attack',
    frames: Array.from({ length: 7 }, (_, i) => ({ key: `raccoon_attack-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'raccoon_hurt',
    frames: Array.from({ length: 7 }, (_, i) => ({ key: `raccoon_hurt-${i + 1}` })),
    frameRate: 14,
    repeat: 0
});

scene.anims.create({
    key: 'raccoon_die',
    frames: Array.from({ length: 8 }, (_, i) => ({ key: `raccoon_die-${i + 1}` })),
    frameRate: 10,
    repeat: 0
});

scene.anims.create({
    key: 'sit',
    frames: Array.from({ length: 8 }, (_, i) => ({ key: `sit${i + 1}` })),
    frameRate: 7,
    repeat: 0 // to loop the animation indefinitely
});
scene.anims.create({
    key: 'run-diagonal-back',
    frames: Array.from({ length: 8 }, (_, i) => ({ key: `run-diagonal-back${i + 1}` })),
    frameRate: 17,
    repeat: 0 // to loop the animation indefinitely
});
scene.anims.create({
    key: 'run-diagonal-front',
    frames: Array.from({ length: 8 }, (_, i) => ({ key: `run-diagonal-front${i + 1}` })),
    frameRate: 17,
    repeat: 0 // to loop the animation indefinitely
});
scene.anims.create({
    key: 'sit-forward',
    frames: Array.from({ length: 8 }, (_, i) => ({ key: `sit-forward${i + 1}` })),
    frameRate: 7,
    repeat: 0 // to loop the animation indefinitely
});
scene.anims.create({
    key: 'attack1-back',
    frames: Array.from({ length: 4 }, (_, i) => ({ key: `attack1-back-${i + 1}` })),
    frameRate: 8,
    repeat: 0 // to loop the animation indefinitely
})
scene.anims.create({
    key: 'attack1-front',
    frames: Array.from({ length: 4 }, (_, i) => ({ key: `attack1-front-${i + 1}` })),
    frameRate: 8,
    repeat: 0 // to loop the animation indefinitely
})
scene.anims.create({
    key: 'attack2',
    frames: Array.from({ length: 4 }, (_, i) => ({ key: `attack2-${i + 1}` })),
    frameRate: 8,
    repeat: 0 // to loop the animation indefinitely
})
scene.anims.create({
    key: 'attack3',
    frames: Array.from({ length: 9 }, (_, i) => ({ key: `attack3-${i + 1}` })),
    frameRate: 18,
    repeat: 0 // to loop the animation indefinitely
})
scene.anims.create({
    key: 'attack4',
    frames: Array.from({ length: 5 }, (_, i) => ({ key: `attack4-${i + 1}` })),
    frameRate: 10,
    repeat: 0 // to loop the animation indefinitely
})
scene.anims.create({
    key: 'attack5',
    frames: Array.from({ length: 14 }, (_, i) => ({ key: `attack5-${i + 1}` })),
    frameRate: 28,
    repeat: 0 // to loop the animation indefinitely
})
scene.anims.create({
    key: 'attack2-back',
    frames: Array.from({ length: 5 }, (_, i) => ({ key: `attack2-back-${i + 1}` })),
    frameRate: 10,
    repeat: 0 // to loop the animation indefinitely
})
scene.anims.create({
    key: 'attack2-front',
    frames: Array.from({ length: 5 }, (_, i) => ({ key: `attack2-front-${i + 1}` })),
    frameRate: 10,
    repeat: 0 // to loop the animation indefinitely
})
scene.anims.create({
    key: 'attack3-back',
    frames: Array.from({ length: 9 }, (_, i) => ({ key: `attack3-back-${i + 1}` })),
    frameRate: 18,
    repeat: 0 // to loop the animation indefinitely
})
scene.anims.create({
    key: 'attack3-front',
    frames: Array.from({ length: 9 }, (_, i) => ({ key: `attack3-front-${i + 1}` })),
    frameRate: 18,
    repeat: 0 // to loop the animation indefinitely
})
scene.anims.create({
    key: 'attack4-back',
    frames: Array.from({ length: 9 }, (_, i) => ({ key: `attack4-back-${i + 1}` })),
    frameRate: 18,
    repeat: 0 // to loop the animation indefinitely
})
scene.anims.create({
    key: 'attack4-front',
    frames: Array.from({ length: 5 }, (_, i) => ({ key: `attack4-front-${i + 1}` })),
    frameRate: 10,
    repeat: 0 // to loop the animation indefinitely
})
scene.anims.create({
    key: 'attack5-back',
    frames: Array.from({ length: 10 }, (_, i) => ({ key: `attack5-back-${i + 1}` })),
    frameRate: 20,
    repeat: 0 // to loop the animation indefinitely
})
scene.anims.create({
    key: 'attack5-front',
    frames: Array.from({ length: 10 }, (_, i) => ({ key: `attack5-front-${i + 1}` })),
    frameRate: 20,
    repeat: 0 // to loop the animation indefinitely
})

scene.anims.create({
    key: 'sit-back',
    frames: [
        { key: 'sit-back1' },
        { key: 'sit-back2' },
        { key: 'sit-back3' },
        { key: 'sit-back4' },
        { key: 'sit-back5' },
        { key: 'sit-back6' },
        { key: 'sit-back7' },
        { key: 'sit-back8' }
    ],
    frameRate: 7,
    repeat: 0 // to loop the animation indefinitely
});

scene.anims.create({
    key: 'attack1',
    frames: [
        { key: 'attack1-1' },
        { key: 'attack1-2' },
        { key: 'attack1-3' },
        { key: 'attack1-4' }
    ],
    frameRate: 8,
    repeat: 0 // to loop the animation indefinitely
});

scene.anims.create({
    key: 'dead',
    frames: [
        { key: 'dead1' },
        { key: 'dead2' },
        { key: 'dead3' },
        { key: 'dead4' },
        { key: 'dead5' },
        { key: 'dead6' },
        { key: 'dead7' },
        { key: 'dead8' },
        { key: 'dead9' },
        { key: 'dead10' },
        { key: 'dead11' }
    ],
    frameRate: 9,
    override: true,  // Ensure that it can override other animations
    repeat: 0
});

scene.anims.create({
    key: 'run',
    frames: [
        { key: 'run1' },
        { key: 'run2' },
        { key: 'run3' },
        { key: 'run4' },
        { key: 'run5' },
        { key: 'run6' },
        { key: 'run7' },
        { key: 'run8' }
    ],
    frameRate: 10,
    repeat: 0 // to loop the animation indefinitely
});

scene.anims.create({
    key: 'up',
    frames: [
        { key: 'up1' }, { key: 'up2' },
        { key: 'up3' }, { key: 'up4' },
        { key: 'up5' }, { key: 'up6' },
        { key: 'up7' }, { key: 'up8' }
    ],
    frameRate: 7,
    repeat: 0
});

scene.anims.create({
    key: 'down',
    frames: [
        { key: 'down1' }, { key: 'down2' },
        { key: 'down3' }, { key: 'down4' },
        { key: 'down5' }, { key: 'down6' },
        { key: 'down7' }, { key: 'down8' }
    ],
    frameRate: 7,
    repeat: 0
});
}