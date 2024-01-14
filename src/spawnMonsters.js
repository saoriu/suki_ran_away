import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConstants.js';
import { eventOptions } from './eventOptions.js';

export function spawnMonsters(centerX, centerY, scene, tileWidth, tilesBuffer, monsters, daysPassed) {
      // At the start of the spawnMonsters function

    for (const key in monsters) {
    if (!monsters[key].sprite || !monsters[key].sprite.active) {
      delete monsters[key];
    }
  }

  const camera = scene.cameras.main;
  const visibleStartI = Math.floor((centerX - camera.width / 2) / tileWidth);
  const visibleEndI = Math.ceil((centerX + camera.width / 2) / tileWidth);
  const visibleStartJ = Math.floor((centerY - camera.height / 2) / tileWidth);
  const visibleEndJ = Math.ceil((centerY + camera.height / 2) / tileWidth);

    const bufferStartI = visibleStartI - (tilesBuffer + 1); // extend outward by 1 tile
    const bufferEndI = visibleEndI + (tilesBuffer + 1);    // extend outward by 1 tile
    const bufferStartJ = visibleStartJ - (tilesBuffer + 1); // extend outward by 1 tile
    const bufferEndJ = visibleEndJ + (tilesBuffer + 1);    // extend outward by 1 tile


    // Check if any monster already exists in the extended area including the buffer, if yes, then return
    for (let i = bufferStartI; i <= bufferEndI; i++) {
      for (let j = bufferStartJ; j <= bufferEndJ; j++) {
        if (monsters[`${i},${j}`]) return;
      }
    }

    function chooseMonsterRarity() {
      const rarities = ['common', 'uncommon', 'rare', 'ultrarare'];
      const cumulativeProbabilities = [0.55, 0.80, 0.95, 1.00]; // Cumulative probabilities for the rarities
      const roll = Phaser.Math.FloatBetween(0, 1);

      for (let i = 0; i < cumulativeProbabilities.length; i++) {
        if (roll <= cumulativeProbabilities[i]) return rarities[i];
      }
    }

    function chooseMonster(eventOptions, chosenRarity) {
      const filteredOptions = eventOptions.filter(option => option.monsterChance === chosenRarity);

      if (filteredOptions.length === 0) return null; // Return null if no monsters match the chosen rarity

      const index = Phaser.Math.Between(0, filteredOptions.length - 1);
      return filteredOptions[index];
    }

    const chosenRarity = chooseMonsterRarity();
    const chosenMonster = chooseMonster(eventOptions, chosenRarity);
    

    if (!chosenMonster) return;

    const levelVariation = Phaser.Math.Between(0, Math.ceil(daysPassed * 0.15) + chosenMonster.level);   
    let damage = chosenMonster.damage;
    const monsterMass = chosenMonster.monsterMass;

    if (chosenMonster.monster !== 'turtle') {
      damage = chosenMonster.damage + Math.ceil(daysPassed * 0.05);
    } else {
      damage = chosenMonster.damage;
    }

    const modifiedLevel = chosenMonster.level + levelVariation;


    // If no monster in the extended area, choose a random tile in the buffer area to potentially spawn a monster.
    let spawnTileI, spawnTileJ;

    // Deciding whether to spawn on the horizontal or vertical buffer area
    if (Phaser.Math.Between(0, 1) === 0) {
      // Horizontal buffer area (top or bottom)
      spawnTileI = Phaser.Math.Between(bufferStartI + 1, bufferEndI - 1);
      spawnTileJ = Phaser.Math.Between(0, 1) === 0 ? bufferStartJ + 1 : bufferEndJ - 1;
    } else {
      // Vertical buffer area (left or right)
      spawnTileJ = Phaser.Math.Between(bufferStartJ + 1, bufferEndJ - 1);
      spawnTileI = Phaser.Math.Between(0, 1) === 0 ? bufferStartI + 1 : bufferEndI - 1;
    }
    const monsterSpriteKey = chosenMonster.monster; // e.g., 'raccoon'

    // Get the frame data
    let atlasKey = 'monsters';
    let frameName = `${monsterSpriteKey}_idle-1`; // Adjust this to match your actual frame names
    let frameData = scene.textures.getFrame(atlasKey, frameName);
    // Calculate the trimmed dimensions
    let trimmedWidth = frameData.cutWidth;
    let trimmedHeight = frameData.cutHeight;

    const monsterX = spawnTileI * tileWidth + (tileWidth - (GAME_CONFIG.TILE_SCALE * trimmedWidth)) / 2;
    const monsterY = spawnTileJ * tileWidth + (tileWidth - (GAME_CONFIG.TILE_SCALE * trimmedHeight)) / 2;

    
    //define monsterradius based on monster frame data
    let monsterRadius = trimmedWidth / 2;

    // Create the monster sprite
    let monster = scene.matter.add.sprite(monsterX, monsterY, monsterSpriteKey, null, {
      isStatic: false
    }).setScale(1).setCircle(monsterRadius)

    // Continue with your existing code...
    monster.setInteractive();

    const monsterBody = monster.body;
    monsterBody.inertia = Infinity; // Prevent rotation
    monsterBody.inverseInertia = 0;
    monsterBody.mass = monsterMass;
    monsterBody.friction = 1;
    monsterBody.frictionAir = 0.1;

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
      speed: chosenMonster.speed,
      description: chosenMonster.description,
      damage: damage,
      key: monsterKey,
      attackRange: chosenMonster.attackRange,
      level: modifiedLevel,
      isAggressive:  chosenMonster.isAggressive,
      inReach: false,
      event: chosenMonster,
      healthBar: {
        outer: monsterHealthBar.outer,
        fill: monsterHealthBar.fill
      },
      spawnPoint: { x: monsterX, y: monsterY },
      maxHealth: modifiedLevel,
      //set a wander area of 5 tiles
      wanderArea: 8 * tileWidth,
      currentHealth: modifiedLevel,
    };

    scene.registry.set('currentMonsterLevel', modifiedLevel);
    monster.setDepth(3);
    monsterHealthBar.outer.setDepth(5); // Setting the depth higher to render above the monster sprite
    monsterHealthBar.fill.setDepth(5); // Setting the depth higher to render above the monster sprite
  }
