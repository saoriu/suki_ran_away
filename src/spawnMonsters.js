import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConstants.js';
import { eventOptions } from './eventOptions.js';
import { PlayerState } from './playerState'; // Adjust the path as needed



function calculateSpawnProbability(baseProbability, eventsBonus) {
  let probability = baseProbability;

  // Modify probability based on items the player has
  probability += eventsBonus;
  
  // Ensure probability is within [0, 1]
  probability = Phaser.Math.Clamp(probability, 0, 1);
  
  return probability;
}

export function spawnMonsters(centerX, centerY, scene, tileWidth, tilesBuffer, monsters) {
  const camera = scene.cameras.main;
  const visibleStartI = Math.floor((centerX - camera.width / 2) / tileWidth);
  const visibleEndI = Math.ceil((centerX + camera.width / 2) / tileWidth);
  const visibleStartJ = Math.floor((centerY - camera.height / 2) / tileWidth);
  const visibleEndJ = Math.ceil((centerY + camera.height / 2) / tileWidth);
  const baseProbability = GAME_CONFIG.baseProbability; // Example: 10% base spawn chance
  const eventsBonus = PlayerState.eventsBonus;
  const spawnProbability = calculateSpawnProbability(baseProbability, eventsBonus);

  if (Phaser.Math.FloatBetween(0, 1) < spawnProbability) {

  const bufferStartI = visibleStartI - (tilesBuffer);
  const bufferEndI = visibleEndI + (tilesBuffer);
  const bufferStartJ = visibleStartJ - (tilesBuffer);
  const bufferEndJ = visibleEndJ + (tilesBuffer);

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
const levelVariation = Phaser.Math.Between(0, 3);
const modifiedLevel = chosenMonster.level + levelVariation; // You can also subtract if you want a range of +/- 3.

    

  // If no monster in the extended area, choose a random tile in the buffer area to potentially spawn a monster.
  let spawnTileI, spawnTileJ;

  // Deciding whether to spawn on the horizontal or vertical buffer area
  if (Phaser.Math.Between(0, 1) === 0) {
    // Horizontal buffer area (top or bottom)
    spawnTileI = Phaser.Math.Between(bufferStartI, bufferEndI);
    spawnTileJ = Phaser.Math.Between(0, 1) === 0 ? bufferStartJ : bufferEndJ; // top or bottom buffer row
  } else {
    // Vertical buffer area (left or right)
    spawnTileJ = Phaser.Math.Between(bufferStartJ, bufferEndJ);
    spawnTileI = Phaser.Math.Between(0, 1) === 0 ? bufferStartI : bufferEndI; // left or right buffer column
  }

    const monsterX = spawnTileI * tileWidth + (tileWidth - (GAME_CONFIG.SCALE * 25)) / 2;
    const monsterY = spawnTileJ * tileWidth + (tileWidth - (GAME_CONFIG.SCALE * 25)) / 2;
    const monsterSpriteKey = chosenMonster.monster;

    const monster = scene.add.sprite(monsterX, monsterY, monsterSpriteKey).setOrigin(0).setScale(GAME_CONFIG.SCALE);

    const levelText = scene.add.text(
      monsterX + (tileWidth / 2),
      monsterY - 30,
      `${monsterSpriteKey.charAt(0).toUpperCase() + monsterSpriteKey.slice(1)}\nLvl ${modifiedLevel}`, // Use modifiedLevel here
      {
          fontSize: '20px',
          fill: '#ffffff',
          align: 'center'
      }
  ).setOrigin(0.5);
  




    monsters[`${spawnTileI},${spawnTileJ}`] = {
      sprite: monster,
      level: modifiedLevel, // Changed to chosenmonsterChance.level
      levelText: levelText,
      event: chosenMonster // Store the entire event object here for future reference
    };

    monster.setDepth(3);
    levelText.setDepth(3); // Ensure the text renders above the monsters and other game objects
  }
}
