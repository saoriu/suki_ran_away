// PreloadScene.js
import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        for (let i = 1; i <= 31; i++) this.load.image(`tile${i}`, `/tiles/tile${i}.png`);
        if (!this.plugins.get('rexoutlinepipelineplugin')) {
            this.load.plugin('rexoutlinepipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexoutlinepipelineplugin.min.js', true);
        }
        this.load.atlas('fire', '/objects/fire.png', '/objects/fire.json');
        //import colalrs atlas
        this.load.atlas('collar', '/equip/collar.png', '/equip/collar.json');
        this.load.atlas('bluecollar', '/equip/bluecollar.png', '/equip/collar.json');
        this.load.atlas('blackcollar', '/equip/blackcollar.png', '/equip/collar.json');
        this.load.atlas('magentacollar', '/equip/magentacollar.png', '/equip/collar.json');
        //preload /Users/saoriuchida/CODE/suki-ran-away/suki_ran_away/public/tiles/RA_Ruins.png
        this.load.tilemapTiledJSON('maze', '/tiles/maze.json');
        this.load.image('RA_Ruins', '/tiles/RA_Ruins.png');
        this.load.image('title', '/ui/title.png');
        this.load.atlas('cat', '/characters/cat.png', '/characters/cat.json');
        this.load.atlas('nori', '/characters/nori.png', '/characters/nori.json');
        this.load.atlas('mochi', '/characters/mochi.png', '/characters/mochi.json');
        this.load.atlas('ume', '/characters/ume.png', '/characters/ume.json');
        this.load.atlas('yaku', '/characters/yaku.png', '/characters/yaku.json');
        this.load.atlas('monsters', '/characters/monsters.png', '/characters/monsters.json');
        this.load.atlas('treemonsters', '/characters/treemonsters.png', '/characters/treemonsters.json');
        this.load.atlas('tree', '/objects/tree.png', '/objects/tree.json');
        this.load.atlas('pond', '/objects/pond.png', '/objects/pond.json');
        this.load.atlas('redcollarbellsilver', '/equip/redcollarbellsilver.png', '/equip/redcollarbellsilver.json');
        this.load.atlas('redcollarbellgold', '/equip/redcollarbellgold.png', '/equip/redcollarbellgold.json');
        this.load.atlas('redcollarbellbrass', '/equip/redcollarbellbrass.png', '/equip/redcollarbellbrass.json');
        this.load.atlas('bush', '/objects/bush.png', '/objects/bush.json');
        this.load.atlas('blood', '/effects/blood.png', '/effects/blood.json');
        //import aggro png
        this.load.image('aggro', '/ui/aggro.png');
        this.load.atlas('ponds', '/objects/ponds.png', '/objects/ponds.json');
        this.load.image('strawberry cake', '/inventory/strawberry cake.png');
        this.load.image('tree-down', '/objects/tree-down.png');
        this.load.image('red collar bell silver', '/inventory/red collar bell silver.png');
        this.load.image('red collar bell gold', '/inventory/red collar bell gold.png');
        this.load.image('red collar bell brass', '/inventory/red collar bell brass.png');
        this.load.image('frame', '/ui/frame.png');
        this.load.image('apple', '/inventory/apple.png');
        this.load.image('cotton', '/inventory/cotton.png');
        this.load.image('diamond', '/inventory/diamond.png');
        this.load.image('emerald', '/inventory/emerald.png');
        //preload bone
        this.load.image('bone', '/inventory/bone.png');
        this.load.image('gold', '/inventory/gold.png');
        this.load.image('lemon', '/inventory/lemon.png');
        this.load.image('cape', '/inventory/cape.png');
        //preload craftSlot and craftSlotSelect png
        //import collar red
        //import necklace 
        //import check and cross:
        this.load.image('check', '/ui/check.png');
        this.load.image('cross', '/ui/cross.png');
        this.load.image('red collar', '/inventory/red collar.png');
        this.load.image('craftSlot', '/ui/craftSlot.png');
        this.load.image('craftSlotSelect', '/ui/craftSlotSelect.png');
        this.load.image('craftModal', '/ui/craftModal.png');
        this.load.image('craft', '/ui/crafting.png');
        //load lemonpie
        this.load.image('lemonpie', '/inventory/lemonpie.png');
        this.load.image('pebble', '/inventory/pebble.png');
        this.load.image('peach', '/inventory/peach.png');
        this.load.image('strawberry', '/inventory/strawberry.png');
        //load strawberry cake
        this.load.image('blueberry', '/inventory/blueberry.png');
        this.load.image('egg', '/inventory/egg.png');
        this.load.image('milk', '/inventory/milk.png');
        this.load.image('flour', '/inventory/flour.png');
        this.load.image('ruby', '/inventory/ruby.png');
        this.load.image('silk', '/inventory/silk.png');
        this.load.image('thread', '/inventory/thread.png');
        this.load.image('roll', '/ui/roll.png');
        this.load.image('tailwhip', '/ui/tailwhip.png');
        this.load.image('horsekick', '/ui/horsekick.png');
        this.load.image('bite', '/ui/bite.png');
        this.load.image('hairball', '/ui/hairball.png');
        //add equipment-empty and equipment-full
        this.load.image('equipment-empty', '/ui/equipment-empty.png');
        this.load.image('equipment-full', '/ui/equipment-full.png');
        this.load.image('attack-lock', '/ui/attack-lock.png');
        this.load.image('bag', '/ui/bag.png');
        this.load.image('attack-info', '/ui/attack-info.png');
        this.load.image('save', '/ui/save.png');
        this.load.image('login', '/ui/login.png');
        this.load.image('bg1', '/bg1.png');
        this.load.image('sky_fc', '/sky_fc.png');
        this.load.image('clouds_front_fc', '/clouds_front_fc.png');
        this.load.image('clouds_front_t_fc', '/clouds_front_t_fc.png');
        this.load.image('clouds_mid_fc', '/clouds_mid_fc.png');
        this.load.image('clouds_mid_t_fc', '/clouds_mid_t_fc.png');
        this.load.image('far_mountains_fc', '/far_mountains_fc.png');
        this.load.image('grassy_mountains_fc', '/grassy_mountains_fc.png');
        this.load.image('hill', '/hill.png');
        this.load.image('ruby', '/inventory/ruby.png');
        this.load.image('select', '/ui/select.png');
        this.load.spritesheet('heal', '/effects/heal.png', { frameWidth: 160, frameHeight: 160 });
        this.load.spritesheet('hairballs', '/ball.png', { frameWidth: 23, frameHeight: 23 });
        this.load.image('bonusenergy', '/ui/bonusenergy.png');
        this.load.image('bonusattack', '/ui/bonusattack.png');
        this.load.image('bonusdefence', '/ui/bonusdefence.png');
        this.load.image('bonusknockback', '/ui/bonusknockback.png');
        this.load.image('bonusfire', '/ui/bonusfire.png');
        this.load.image('bonusfood', '/ui/bonusfood.png');
        this.load.image('ashes', '/objects/ashes.png');
        this.load.image('modal', '/ui/modal.png');
        this.load.image('bush-down', '/objects/bush-down.png');
        this.load.image('tree2-down', 'objects//tree2-down.png');
        this.load.image('tree3-down', 'objects//tree3-down.png');
        this.load.image('attacks-menu', '/ui/attacks-menu.png');
        this.load.image('scratch', '/ui/scratch.png');
        this.load.image('menu', '/ui/menu.png');
        this.load.image('locked', '/ui/locked.png');
        this.load.image('close', '/ui/close.png');
        this.load.image('log', '/inventory/log.png');
        this.load.image('bonustrees', '/ui/bonustrees.png');
        this.load.atlas('pinkfly', '/characters/pinkfly.png', '/characters/pinkfly.json');
        this.load.atlas('trees', '/objects/trees.png', '/objects/trees.json');
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