import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConstants.js';


export function spawnMonsters(centerX, centerY, scene, tileWidth, tilesBuffer, monsters) {
        const camera = scene.cameras.main;
        const visibleStartI = Math.floor((centerX - camera.width / 2) / tileWidth);
        const visibleEndI = Math.ceil((centerX + camera.width / 2) / tileWidth);
        const visibleStartJ = Math.floor((centerY - camera.height / 2) / tileWidth);
        const visibleEndJ = Math.ceil((centerY + camera.height / 2) / tileWidth);
      
        const bufferStartI = visibleStartI - tilesBuffer;
        const bufferEndI = visibleEndI + tilesBuffer;
        const bufferStartJ = visibleStartJ - tilesBuffer;
        const bufferEndJ = visibleEndJ + tilesBuffer;
      
        // Check if any monster already exists in the extended area including the buffer, if yes, then return
        for (let i = bufferStartI; i <= bufferEndI; i++) {
          for (let j = bufferStartJ; j <= bufferEndJ; j++) {
            if (monsters[`${i},${j}`]) return;
          }
        }
      
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
      
        // 50% chance to spawn a monster in the chosen buffer tile
        if (Phaser.Math.Between(1, 2) === 1) {
          const monsterX = spawnTileI * tileWidth + (tileWidth - (GAME_CONFIG.SCALE * 17)) / 2;
          const monsterY = spawnTileJ * tileWidth + (tileWidth - (GAME_CONFIG.SCALE * 19)) / 2;
          const monster = scene.add.sprite(monsterX, monsterY, 'monster').setOrigin(0).setScale(GAME_CONFIG.SCALE);
          const monsterLevel = Phaser.Math.Between(1, 5); // Assign a random level between 1 and 5 to the monster
          
          // Add a Text object to the scene at the monster's position, and adjust the y-coordinate to position it above the monster
          const levelText = scene.add.text(monsterX + (tileWidth / 2), monsterY - 10, `Lvl ${monsterLevel}`, {
              fontSize: '10px',
              fill: '#ffffff',
              align: 'center'
          }).setOrigin(0.5); // setOrigin(0.5) is used to center the text above the monster.
          
          monsters[`${spawnTileI},${spawnTileJ}`] = { sprite: monster, level: monsterLevel, levelText: levelText }; // Store the monster sprite, level and levelText in the monsters object
          monster.setDepth(1);
          levelText.setDepth(1); // Ensure the text renders above the monsters and other game objects
      }
    }      
    