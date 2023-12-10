import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConstants.js';
import { eventOptions } from './eventOptions.js';
import { PlayerState } from './playerState'; // Adjust the path as needed
import { textStyles } from './styles.js';

function calculateSpawnProbability(baseProbability, eventsBonus) {
  let probability = baseProbability;

  // Modify probability based on items the player has
  probability += eventsBonus;

  // Ensure probability is within [0, 1]
  probability = Phaser.Math.Clamp(probability, 0, 1);

  return probability;
}

export function spawnMonsters(centerX, centerY, scene, tileWidth, tilesBuffer, monsters, daysPassed) {
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
  const baseProbability = GAME_CONFIG.baseProbability; // Example: 10% base spawn chance
  const eventsBonus = PlayerState.eventsBonus;
  const weakenBonus = PlayerState.weakenBonus;
  const spawnProbability = calculateSpawnProbability(baseProbability, eventsBonus);

  if (Phaser.Math.FloatBetween(0, 1) < spawnProbability) {

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

    // ... after choosing the monster
    const levelVariation = Phaser.Math.Between(0, Math.ceil((daysPassed + 1) / 2) * (2.5 * (1 - weakenBonus)));
    let damage = chosenMonster.damage;
    const monsterMass = chosenMonster.monsterMass;

    if (chosenMonster.monster !== 'turtle') {
      damage = chosenMonster.damage + levelVariation;
    } else {
      damage = chosenMonster.damage;
    }

    const modifiedLevel = chosenMonster.level + levelVariation; // You can also subtract if you want a range of +/- 3

    // Use the 'damage' and 'modifiedLevel' variables in your code
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

    let monsterImage = scene.textures.get(monsterSpriteKey).getSourceImage();
    let monsterRadius = monsterImage.width * GAME_CONFIG.SCALE / 3;

    const monsterX = spawnTileI * tileWidth + (tileWidth - (GAME_CONFIG.SCALE * monsterImage.width)) / 2;
    const monsterY = spawnTileJ * tileWidth + (tileWidth - (GAME_CONFIG.SCALE * monsterImage.height)) / 2;

    let monster

    monster = scene.matter.add.sprite(monsterX, monsterY, monsterSpriteKey, null, {
      isStatic: false // Set to true if you want the monster to be immovable
    }).setScale(GAME_CONFIG.SCALE).setCircle(monsterRadius);

    const monsterBody = monster.body;
    monsterBody.inertia = Infinity; // Prevent rotation
    monsterBody.inverseInertia = 0;
    monsterBody.mass = monsterMass;

    const levelText = scene.add.text(
      monsterX + (tileWidth / 2),
      monsterY - 30,
      `${monsterSpriteKey.charAt(0).toUpperCase() + monsterSpriteKey.slice(1)}\nLvl ${modifiedLevel}`,
      textStyles.monsterLevelText // Corrected syntax
    ).setOrigin(0.5).setVisible(false);

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

    const healthText = scene.add.text(monsterX, monsterY + monster.height + 75, `HP: ${modifiedLevel * 10}`, textStyles.healthText).setOrigin(0.5).setVisible(false);

    monsters[monsterKey] = {
      sprite: monster,
      speed: chosenMonster.speed,
      damage: damage,
      key: monsterKey,
      level: modifiedLevel,
      isAggressive: true,
      isColliding: false,
      isFollowing: true,
      levelText: levelText,
      event: chosenMonster,
      healthBar: {
        outer: monsterHealthBar.outer,
        fill: monsterHealthBar.fill
      },
      healthText: healthText,
      maxHealth: modifiedLevel * 10,
      currentHealth: modifiedLevel * 10
    };

    scene.registry.set('currentMonsterLevel', modifiedLevel);
    monster.setDepth(3);
    levelText.setDepth(4); // Ensure the text renders above the monsters and other game objects
    monsterHealthBar.outer.setDepth(5); // Setting the depth higher to render above the monster sprite
    monsterHealthBar.fill.setDepth(5); // Setting the depth higher to render above the monster sprite
    healthText.setDepth(6); // Ensure the health text is rendered above everything else
    // Ensure the text renders above the monsters and other game objects
  }
}
