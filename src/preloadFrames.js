export function preloadFrames(gameInstance) {
    for (let i = 1; i <= 13; i++) this.load.image(`tile${i}`, `/tile${i}.png`);
    this.load.atlas('cat', '/cat.png', '/cat.json');
    this.load.atlas('monsters', '/monsters.png', '/monsters.json');
    this.load.image('frame', '/frame.png');
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
    this.load.image('roll', '/roll.png');
    this.load.image('tailwhip', '/tailwhip.png');
    this.load.image('horsekick', '/horsekick.png');
    this.load.image('bite', '/bite.png');
    this.load.image('hairball', '/hairball.png');
    this.load.image('attack-on', '/attack-on.png');
    this.load.image('attack-off', '/attack-off.png');
    this.load.image('attack-lock', '/attack-lock.png');
    this.load.image('bag', '/bag.png');
    this.load.image('health-bar', '/health-bar.png');
    this.load.image('attack-info', '/attack-info.png');
    this.load.image('save', '/save.png');
    this.load.image('login', '/login.png');
    this.load.image('bg1', '/bg1.png');
    this.load.image('sky_fc', '/sky_fc.png');
    this.load.image('clouds_front_fc', '/clouds_front_fc.png');
    this.load.image('clouds_front_t_fc', '/clouds_front_t_fc.png');
    this.load.image('clouds_mid_fc', '/clouds_mid_fc.png');
    this.load.image('clouds_mid_t_fc', '/clouds_mid_t_fc.png');
    this.load.image('far_mountains_fc', '/far_mountains_fc.png');
    this.load.image('grassy_mountains_fc', '/grassy_mountains_fc.png');
    this.load.image('hill', '/hill.png');
    this.load.image('ruby', '/ruby.png');
    this.load.image('select', '/select.png');
    this.load.spritesheet('heal', '/heal.png', { frameWidth: 160, frameHeight: 160 });
    this.load.spritesheet('hairballs', '/ball.png', { frameWidth: 23, frameHeight: 23 });
    this.load.image('bonusenergy', '/bonusenergy.png');
    this.load.image('bonusattack', '/bonusattack.png');
    this.load.image('bonusluck', '/bonusluck.png');
    this.load.image('bonusdefence', '/bonusdefence.png');
    this.load.image('bonusknockback', '/bonusknockback.png');
    this.load.image('bonusexplore', '/bonusexplore.png');
    this.load.image('bonusfood', '/bonusfood.png');
    this.load.image('stats', '/stats.png');
//load necklace1:
    this.load.image('necklace1', '/necklace1.png');
    this.load.image('necklace2', '/necklace2.png');
    //load fire sprite atlas
    this.load.atlas('fire', '/fire.png', '/fire.json');
//load necklace2

}