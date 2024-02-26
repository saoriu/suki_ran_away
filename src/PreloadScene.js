// PreloadScene.js
import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        for (let i = 1; i <= 13; i++) this.load.image(`tile${i}`, `/tile${i}.png`);
        if (!this.plugins.get('rexoutlinepipelineplugin')) {
            this.load.plugin('rexoutlinepipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexoutlinepipelineplugin.min.js', true);
        }
        this.load.atlas('fire', '/fire.png', '/fire.json');
        this.load.image('title', '/title.png');
        this.load.atlas('cat', '/cat.png', '/cat.json');
        this.load.atlas('monsters', '/monsters.png', '/monsters.json');
        this.load.atlas('treemonsters', '/treemonsters.png', '/treemonsters.json');
        this.load.atlas('tree', '/tree.png', '/tree.json');
        this.load.atlas('pond', '/pond.png', '/pond.json');
        this.load.atlas('bush', '/bush.png', '/bush.json');
        this.load.atlas('ponds', '/ponds.png', '/ponds.json');
        this.load.image('strawberry cake', '/strawberry cake.png');
        this.load.image('tree-down', '/tree-down.png');
        this.load.image('collar red silverbell', '/collar red silverbell.png');
        this.load.image('collar red gold', '/collar red gold.png');
        this.load.image('frame', '/frame.png');
        this.load.image('apple', '/apple.png');
        this.load.image('cotton', '/cotton.png');
        this.load.image('diamond', '/diamond.png');
        this.load.image('emerald', '/emerald.png');
        //preload bone
        this.load.image('bone', '/bone.png');
        this.load.image('gold', '/gold.png');
        this.load.image('lemon', '/lemon.png');
        this.load.image('cape', '/cape.png');
        //preload craftSlot and craftSlotSelect png
        //import collar red
        //import necklace 
        //import check and cross:
        this.load.image('check', '/check.png');
        this.load.image('cross', '/cross.png');
        this.load.image('collar red', '/collar red.png');
        this.load.image('craftSlot', '/craftSlot.png');
        this.load.image('craftSlotSelect', '/craftSlotSelect.png');
        this.load.image('craftModal', '/craftModal.png');
        this.load.image('craft', '/crafting.png');
        //load lemonpie
        this.load.image('lemonpie', '/lemonpie.png');
        this.load.image('pebble', '/pebble.png');
        this.load.image('peach', '/peach.png');
        this.load.image('strawberry', '/strawberry.png');
        //load strawberry cake
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
        this.load.image('bonusfire', '/bonusfire.png');
        this.load.image('bonusfood', '/bonusfood.png');
        this.load.image('stats', '/stats.png');
        this.load.image('ashes', '/ashes.png');
        this.load.image('modal', '/modal.png');
        this.load.image('bush-down', '/bush-down.png');
        this.load.image('tree2-down', '/tree2-down.png');
        this.load.image('tree3-down', '/tree3-down.png');
        this.load.image('attacks-menu', '/attacks-menu.png');
        this.load.image('scratch', '/scratch.png');
        this.load.image('menu', '/menu.png');
        this.load.image('locked', '/locked.png');
        this.load.image('close', '/close.png');
        this.load.image('log', '/log.png');
        this.load.image('bonustrees', '/bonustrees.png');
        this.load.atlas('pinkfly', '/pinkfly.png', '/pinkfly.json');
        this.load.atlas('trees', '/trees.png', '/trees.json');
        var progressBar = this.add.graphics();
        var progressBox = this.add.graphics();
        var width = this.cameras.main.width;
        var height = this.cameras.main.height;
        var boxWidth = 320;
        var boxHeight = 50;
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - boxWidth / 2, height / 2 - boxHeight / 2, boxWidth, boxHeight);

        var loadingText = this.make.text({
            x: width / 2,
            y: height / 2 + boxHeight / 2 + 20, // Adjust y coordinate to position below progress bar
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        // Add a color change animation to the loading text
        this.tweens.add({
            targets: loadingText,
            ease: 'Sine.easeInOut',
            duration: 500,
            repeat: -1,
            yoyo: true,
            alpha: {
                getStart: () => 1,
                getEnd: () => 0.5
            }
        });

        this.load.on('progress', function (value) {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - boxWidth / 2 + 10, height / 2 - boxHeight / 2 + 10, (boxWidth - 20) * value, boxHeight - 20);
            loadingText.setText('Loading... ' + parseInt(value * 100) + '%');
        });

        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });
    }

    create() {
        // Once all assets are loaded, start the main game scene
        this.scene.start('mainScene');
    }
}