export function preloadFrames(gameInstance) {
    for (let i = 1; i <= 8; i++) this.load.image(`sit${i}`, `/sit${i}.png`);
    for (let i = 1; i <= 8; i++) this.load.image(`run${i}`, `/run${i}.png`);
    for (let i = 1; i <= 11; i++) this.load.image(`dead${i}`, `/dead${i}.png`);
    for (let i = 1; i <= 4; i++) this.load.image(`attack1-${i}`, `/attack1-${i}.png`);
    for (let i = 1; i <= 4; i++) this.load.image(`attack1-back-${i}`, `/attack1-back-${i}.png`);
    for (let i = 1; i <= 4; i++) this.load.image(`attack1-front-${i}`, `/attack1-front-${i}.png`);
    for (let i = 1; i <= 13; i++) this.load.image(`tile${i}`, `/tile${i}.png`);
    for (let i = 1; i <= 8; i++) this.load.image(`sit-forward${i}`, `/sit-forward${i}.png`);
    for (let i = 1; i <= 8; i++) this.load.image(`sit-back${i}`, `/sit-back${i}.png`);
    for (let i = 1; i <= 8; i++) {
        this.load.image(`up${i}`, `/up${i}.png`);
        this.load.image(`down${i}`, `/down${i}.png`);
    };
    for (let i = 1; i <= 8; i++) this.load.image(`run-diagonal-back${i}`, `/rundiagonal${i}.png`);
    for (let i = 1; i <= 8; i++) this.load.image(`run-diagonal-front${i}`, `/rundiagonalfront${i}.png`);
    for (let i = 1; i <= 8; i++) this.load.image(`raccoon_run-${i}`, `/raccoon_run-${i}.png`);
    for (let i = 1; i <= 8; i++) this.load.image(`raccoon-${i}`, `/raccoon_idle-${i}.png`);
    for (let i = 1; i <= 7; i++) this.load.image(`raccoon_attack-${i}`, `/raccoon_attack-${i}.png`);
    for (let i = 1; i <= 8; i++) this.load.image(`panda_run-${i}`, `/panda_run-${i}.png`);
    for (let i = 1; i <= 4; i++) this.load.image(`panda-${i}`, `/panda_idle-${i}.png`);
    for (let i = 1; i <= 5; i++) this.load.image(`panda_attack-${i}`, `/panda_attack-${i}.png`);
    for (let i = 1; i <= 6; i++) this.load.image(`dragonfly_run-${i}`, `/dragonfly_run-${i}.png`);
    for (let i = 1; i <= 6; i++) this.load.image(`dragonfly-${i}`, `/dragonfly_idle-${i}.png`);
    for (let i = 1; i <= 7; i++) this.load.image(`dragonfly_attack-${i}`, `/dragonfly_attack-${i}.png`);
    for (let i = 1; i <= 4; i++) this.load.image(`chicken_run-${i}`, `/chicken_run-${i}.png`);
    for (let i = 1; i <= 4; i++) this.load.image(`chicken-${i}`, `/chicken_idle-${i}.png`);
    for (let i = 1; i <= 6; i++) this.load.image(`chicken_attack-${i}`, `/chicken_attack-${i}.png`);
    for (let i = 1; i <= 6; i++) this.load.image(`bunny_run-${i}`, `/bunny_run-${i}.png`);
    for (let i = 1; i <= 4; i++) this.load.image(`bunny-${i}`, `/bunny_idle-${i}.png`);
    for (let i = 1; i <= 6; i++) this.load.image(`bunny_attack-${i}`, `/bunny_attack-${i}.png`);
    for (let i = 1; i <= 7; i++) this.load.image(`raccoon_hurt-${i}`, `/raccoon_hurt-${i}.png`);
    for (let i = 1; i <= 7; i++) this.load.image(`panda_hurt-${i}`, `/panda_hurt-${i}.png`);
    for (let i = 1; i <= 5; i++) this.load.image(`dragonfly_hurt-${i}`, `/dragonfly_hurt-${i}.png`);
    for (let i = 1; i <= 5; i++) this.load.image(`chicken_hurt-${i}`, `/chicken_hurt-${i}.png`);
    for (let i = 1; i <= 6; i++) this.load.image(`bunny_hurt-${i}`, `/bunny_hurt-${i}.png`);
    for (let i = 1; i <= 16; i++) this.load.image(`bunny_die-${i}`, `/bunny_die-${i}.png`);
    for (let i = 1; i <= 10; i++) this.load.image(`chicken_die-${i}`, `/chicken_die-${i}.png`);
    for (let i = 1; i <= 8; i++) this.load.image(`dragonfly_die-${i}`, `/dragonfly_die-${i}.png`);
    for (let i = 1; i <= 8; i++) this.load.image(`panda_die-${i}`, `/panda_die-${i}.png`);
    for (let i = 1; i <= 8; i++) this.load.image(`raccoon_die-${i}`, `/raccoon_die-${i}.png`);
    for (let i = 1; i <= 12; i++) this.load.image(`turtle_die-${i}`, `/turtle_die-${i}.png`);
    for (let i = 1; i <= 6; i++) this.load.image(`turtle_hurt-${i}`, `/turtle_hurt-${i}.png`);
    for (let i = 1; i <= 6; i++) this.load.image(`turtle_attack-${i}`, `/turtle_hide-${i}.png`);
    for (let i = 1; i <= 5; i++) this.load.image(`turtle_run-${i}`, `/turtle_walk-${i}.png`);
    for (let i = 1; i <= 6; i++) this.load.image(`turtle-${i}`, `/turtle_idle-${i}.png`);



    this.load.image('frame', '/frame-mini.png');
    this.load.image('grid', '/grid.png');
    this.load.image('grid-hover', '/grid-hover.png');
    this.load.image('grid-hovers', '/grid-hovers.png');
    this.load.image('grid-new', '/grid-new.png');
    this.load.image('apple', '/apple.png');
    this.load.image('cotton', '/cotton.png');
    this.load.image('diamond', '/diamond.png');
    this.load.image('emerald', '/emerald.png');
    this.load.image('gold', '/gold.png');
    this.load.image('lemon', '/lemon.png');
    this.load.image('pebble', '/pebble.png');
    this.load.image('peach', '/peach.png');
    this.load.image('strawberry', '/strawberry.png');
    this.load.image('blueberry', '/blueberry.png');
    this.load.image('egg', '/egg.png');
    this.load.image('milk', '/milk.png');
    this.load.image('flour', '/flour.png');
    this.load.image('ruby', '/ruby.png');
    this.load.image('silk', '/silk.png');
    this.load.image('thread', '/thread.png');
}