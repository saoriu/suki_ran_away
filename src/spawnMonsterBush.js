import Phaser from 'phaser';
import { eventOptions } from './eventOptions.js';
import { PlayerState } from './playerState.js';


export function spawnMonsterBush(bushX, bushY, scene, tileWidth, monsters, allEntities) {
    // At the start of the spawnMonsterBush function

    for (const key in monsters) {
        if (!monsters[key].sprite || !monsters[key].sprite.active) {
            delete monsters[key];
        }
    }
    
    function chooseMonsterRarity() {
        const rarities = ['common', 'ultrarare'];
        const cumulativeProbabilities = [0.97, 1.00]; // Cumulative probabilities for the rarities
        const roll = Phaser.Math.FloatBetween(0, 1);

        for (let i = 0; i < cumulativeProbabilities.length; i++) {
            if (roll <= cumulativeProbabilities[i]) return rarities[i];
        }
    }

    function chooseMonster(eventOptions, chosenRarity) {
        let filteredOptions = eventOptions
            .filter(option => option.monsterChance === chosenRarity)
            .filter(option => option.specialEventBush); // Include only monsters with specialEvent set to true

        if (PlayerState.gameTime >= 21 || PlayerState.gameTime <= 3) {
            const aggressiveOptions = filteredOptions.filter(option => option.isAggressive);
            if (aggressiveOptions.length > 0) {
                filteredOptions = aggressiveOptions;
            }
        }

        if (filteredOptions.length === 0) return null; // Return null if no monsters match the chosen rarity

        const index = Phaser.Math.Between(0, filteredOptions.length - 1);
        return filteredOptions[index];
    }

    const chosenRarity = chooseMonsterRarity();
    const chosenMonster = chooseMonster(eventOptions, chosenRarity);

    if (!chosenMonster) return;

    const levelVariation = Phaser.Math.Between(0, Math.ceil(PlayerState.days * 0.15) + chosenMonster.level);
    const monsterMass = chosenMonster.monsterMass;

    let damage = chosenMonster.damage + Math.ceil(PlayerState.days * 0.05);

    const modifiedLevel = chosenMonster.level + levelVariation;

    const monsterSpriteKey = chosenMonster.monster; // e.g., 'raccoon'

    // Get the frame data
    let atlasKey = monsterSpriteKey === 'pinkfly' ? 'pinkfly' : 'monsters';
    let frameName;
    if (monsterSpriteKey === 'pinkfly') {
        frameName = 'pinkfly';
    } else {
        frameName = `${monsterSpriteKey}_idle-1`; // Adjust this to match your actual frame names
    }   
    let frameData = scene.textures.getFrame(atlasKey, frameName);
    // Calculate the trimmed dimensions
    let trimmedWidth = frameData.cutWidth;
    let trimmedHeight = frameData.cutHeight;


    //make offset a random number between 100 and 200
    const monsterX = bushX + trimmedWidth / 2 ;    
    const monsterY = bushY + trimmedHeight / 2;

    //define monsterradius based on monster frame data
    let monsterRadius = trimmedWidth / 2;

    // Create the monster sprite
    let monster = scene.matter.add.sprite(monsterX - 50, monsterY - 150, monsterSpriteKey, null, {
        isStatic: false
    }).setScale(1).setCircle(monsterRadius).setPipeline('Light2D')

    monster.setInteractive();


    let monsterShadow = scene.add.sprite(monsterX, monsterY, `${monsterSpriteKey}Shadow1`);
    monsterShadow.alpha = 0.3; // Make the shadow sprite semi-transparent
    monsterShadow.setPipeline('Light2D');
    monsterShadow.blendMode = Phaser.BlendModes.MULTIPLY;
    monsterShadow.depth = 1; // Position the shadow sprite behind the original sprite
  

    const monsterBody = monster.body;
    monsterBody.inertia = Infinity; // Prevent rotation
    monsterBody.inverseInertia = 0;
    monsterBody.mass = monsterMass;
    monsterBody.friction = 1;
    monsterBody.frictionAir = 0.1;
    monsterBody.label = 'monster';
    
    // Add the tween
    scene.tweens.add({
        targets: monster,
        y: monsterY - 220, // Final position
        duration: 1000, // Duration of the tween in milliseconds
        ease: 'Linear', // Easing function of the tween
        onStart: function () {
            if (monsterX > bushX) {
            monster.flipX = true;
            }
        },
        onComplete: function () {
        }
    });


    const monsterKey = `monster-${Date.now()}-${Phaser.Math.Between(1, 1000)}`; // Example unique key
    function createHealthBar(scene, x, y) {
        const progressBarWidth = 80;
        const progressBarHeight = 6;
        const borderOffset = 2;

        const outerRect = scene.add.rectangle(x, y, progressBarWidth + 2 * borderOffset, progressBarHeight + 2 * borderOffset, 0x000000);
        outerRect.setOrigin(0, 0.5).setVisible(false);

        const progressFill = scene.add.rectangle(x + borderOffset, y, progressBarWidth, progressBarHeight, 0xff0000);
        progressFill.setOrigin(0, 0.5);
        progressFill.displayWidth = progressBarWidth;

        return { outer: outerRect, fill: progressFill };
    }
    const monsterHealthBar = createHealthBar(scene, monsterX, monsterY + monster.height + 55, modifiedLevel * 10);
    monsterHealthBar.outer.setVisible(false); // Initially invisible
    monsterHealthBar.fill.setVisible(false);  // Initially invisible

    monsters[monsterKey] = {
        name: chosenMonster.monster,
        sprite: monster,
        monsterShadow: monsterShadow,
        speed: chosenMonster.speed,
        description: chosenMonster.description,
        damage: damage,
        immuneToFire: true,
        attackSpeed: chosenMonster.attackSpeed,
        key: monsterKey,
        attackRange: chosenMonster.attackRange,
        level: modifiedLevel,
        isAggressive: true,
        inReach: false,
        event: chosenMonster,
        attackComplete: true,
        isColliding: false,
        healthBar: {
            outer: monsterHealthBar.outer,
            fill: monsterHealthBar.fill
        },
        spawnPoint: { x: monsterX, y: monsterY },
        maxHealth: modifiedLevel,
        wanderArea: 12 * tileWidth,
        currentHealth: modifiedLevel,
    };

    scene.registry.set('currentMonsterLevel', modifiedLevel);
    allEntities.push(monsters[monsterKey].sprite);
    monsterHealthBar.outer.setDepth(5000); // Setting the depth higher to render above the monster sprite
    monsterHealthBar.fill.setDepth(5000); // Setting the depth higher to render above the monster sprite
}

