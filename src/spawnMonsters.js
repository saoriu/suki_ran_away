import Phaser from 'phaser';
import { eventOptions } from './eventOptions.js';
import { PlayerState } from './playerState.js';

export function spawnMonsters(centerX, centerY, scene, tileWidth, tilesBuffer, monsters, allEntities) {
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

  let spawnTileI, spawnTileJ;

  // Deciding whether to spawn on the horizontal or vertical buffer area
  if (Phaser.Math.Between(0, 1) === 0) {
    // Horizontal buffer area (top or bottom)
    spawnTileI = Phaser.Math.Between(bufferStartI, bufferEndI);
    spawnTileJ = Phaser.Math.Between(0, 1) === 0 ? bufferStartJ : bufferEndJ;
  } else {
    // Vertical buffer area (left or right)
    spawnTileJ = Phaser.Math.Between(bufferStartJ, bufferEndJ);
    spawnTileI = Phaser.Math.Between(0, 1) === 0 ? bufferStartI : bufferEndI;
  }

  // Check if the chosen tile is within the visible area
  if ((spawnTileI >= visibleStartI && spawnTileI <= visibleEndI) && (spawnTileJ >= visibleStartJ && spawnTileJ <= visibleEndJ)) {
    // If it is, return and don't spawn a monster
    return;
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
    let filteredOptions = eventOptions
      .filter(option => option.monsterChance === chosenRarity)
      .filter(option => !option.specialEvent && !option.specialEventBush);
    
    if (PlayerState.gameTime >= 21 || PlayerState.gameTime <= 3) {
      const aggressiveOptions = filteredOptions.filter(option => option.isAggressive);
      if (aggressiveOptions.length > 0) {
        filteredOptions = aggressiveOptions;
      }
    } else {
      filteredOptions = filteredOptions.filter(option => !option.isAggressive);
    }

    if (filteredOptions.length === 0) return null; // Return null if no monsters match the chosen rarity

    const index = Phaser.Math.Between(0, filteredOptions.length - 1);
    return filteredOptions[index];
  }

  const chosenRarity = chooseMonsterRarity();
  const chosenMonster = chooseMonster(eventOptions, chosenRarity);


  if (!chosenMonster) return;

  const levelVariation = Phaser.Math.Between(0, Math.ceil(PlayerState.days * 0.15) + chosenMonster.level);
  let damage = chosenMonster.damage;
  const monsterMass = chosenMonster.monsterMass;

  if (chosenMonster.monster !== 'turtle') {
    damage = chosenMonster.damage + Math.ceil(PlayerState.days * 0.05);
  } else {
    damage = chosenMonster.damage;
  }

  const modifiedLevel = chosenMonster.level + levelVariation;

  const monsterSpriteKey = chosenMonster.monster; // e.g., 'raccoon'

  // Get the frame data
  let atlasKey = 'monsters';
  let frameName = `${monsterSpriteKey}_idle-1`; // Adjust this to match your actual frame names
  let frameData = scene.textures.getFrame(atlasKey, frameName);
  // Calculate the trimmed dimensions
  let trimmedWidth = frameData.cutWidth;
  let trimmedHeight = frameData.cutHeight;

  const monsterX = spawnTileI * tileWidth + (tileWidth - (trimmedWidth)) / 2;
  const monsterY = spawnTileJ * tileWidth + (tileWidth - (trimmedHeight)) / 2;

  let isOverlapping = false;
  allEntities.forEach(entity => {
    if (!entity || !entity.body) {
      return;
    }
    const entityWidth = entity.body.bounds.max.x - entity.body.position.x;
    const entityHeight = entity.body.bounds.max.y - entity.body.position.y;
    const entityLeft = entity.body.position.x - entityWidth;
    const entityRight = entity.body.position.x + entityWidth;
    const entityTop = entity.body.position.y - entityHeight;
    const entityBottom = entity.body.position.y + entityHeight;

    // Check if spawn position is within entity boundaries
    if (monsterX >= entityLeft && monsterX <= entityRight && monsterY >= entityTop && monsterY <= entityBottom) {
      isOverlapping = true;
    }
  });

  // If the spawn tile is overlapping with another entity, don't spawn the monster
  if (isOverlapping) {
    return;
  }

  //define monsterradius based on monster frame data
  let monsterRadius = trimmedWidth / 2;

  // Create the monster sprite
  let monster = scene.matter.add.sprite(monsterX, monsterY, monsterSpriteKey, null, {
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
  monsterBody.friction = 5;
  monsterBody.frictionAir = 0.1;
  monsterBody.label = 'monster';


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
    trimmedHeight: trimmedHeight,
    trimmedWidth: trimmedWidth,
    sprite: monster,
    speed: chosenMonster.speed,
    monsterShadow: monsterShadow,
    description: chosenMonster.description,
    damage: damage,
    key: monsterKey,
    attackRange: chosenMonster.attackRange,
    level: modifiedLevel,
    isAggressive: chosenMonster.isAggressive,
    inReach: false,
    attackSpeed: chosenMonster.attackSpeed,
    attackComplete: true,
    event: chosenMonster,
    healthBar: {
      outer: monsterHealthBar.outer,
      fill: monsterHealthBar.fill
    },
    spawnPoint: { x: monsterX, y: monsterY },
    maxHealth: modifiedLevel,
    wanderArea: 12 * tileWidth,
    currentHealth: modifiedLevel,
  };

  allEntities.push(monsters[monsterKey].sprite);
  scene.registry.set('currentMonsterLevel', modifiedLevel);
  monster.setDepth(3);
  monsterHealthBar.outer.setDepth(5); // Setting the depth higher to render above the monster sprite
  monsterHealthBar.fill.setDepth(5); // Setting the depth higher to render above the monster sprite
}
