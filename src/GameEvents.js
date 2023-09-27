import Phaser from 'phaser';
import { PlayerState, addXpToSkill, xpRequiredForLevel } from './playerState.js';
import { updateEnergyOnEvent, calculateEnergyLost } from './Energy'; // Adjust the import path as needed


export class GameEvents {
    constructor(scene) {
        this.scene = scene;
        this.isEventRunning = false;
        this.isEventTriggered = false;
    }

    handleEvent(monsters) {
        if(this.isEventRunning || this.isEventTriggered) return;
    
        const monstersInView = Object.values(monsters).filter(monsterObj =>
            this.scene.cameras.main.worldView.contains(monsterObj.sprite.x, monsterObj.sprite.y));
    
        if (monstersInView.length === 0) return;
    
        this.isEventTriggered = true;
        
        if (!updateEnergyOnEvent(monstersInView[0].level)) {
            console.log('Not enough energy!');
            this.isEventTriggered = false; // Reset the flag as event didn't proceed due to lack of energy
            return;
        }
    
        const monsterRoll = Phaser.Math.Between(0, monstersInView[0].level * 100);
        const playerRoll = Phaser.Math.Between(0, PlayerState.level * 100);
    
        if (playerRoll >= monsterRoll) {
            const xpAdded = monstersInView[0].level * 50;
            addXpToSkill('dancing', xpAdded);
            monstersInView[0].sprite.destroy();
            monstersInView[0].levelText.destroy();
            this.isEventRunning = false;
            
            const currentLevel = PlayerState.skills.dancing.level; // Assuming this is how you get the current level of dancing skill
            const currentXp = PlayerState.skills.dancing.xp; // Current XP after adding
            const xpToNextLevel = xpRequiredForLevel(currentLevel) - currentXp; // XP required to reach the next level
            
            console.log(`XP added: ${xpAdded}, XP to next level: ${xpToNextLevel}`);
        } else {
            const lostEnergy = calculateEnergyLost(monstersInView[0].level); // calculate lostEnergy here
            console.log(`Lost energy: ${lostEnergy}`);
            PlayerState.energy -= lostEnergy;
            this.isEventRunning = false;
            monstersInView[0].sprite.destroy();
            monstersInView[0].levelText.destroy();
        }
        
        this.isEventTriggered = false;
    }

    update(monsters) {
        // This method can be left empty if there is no additional logic needed in the game loop.
    }
}
