import Phaser from 'phaser';
import { PlayerState, addXpToSkill, xpRequiredForLevel } from './playerState.js';
import { updateEnergyOnEvent, calculateEnergyLost } from './Energy'; // Adjust the import path as needed
import { itemInfo } from './itemInfo.js'; // Adjust the import path as needed
import { Item } from './Item'; // Ensure the path is correct


export class GameEvents {
    constructor(scene) {
        this.scene = scene;
        this.isEventRunning = false;
        this.isEventTriggered = false;
    }

    handleEvent(monsters) {

        if (this.isEventRunning || this.isEventTriggered) return;

        const monstersInView = Object.entries(monsters)
            .filter(([_, monsterObj]) =>
                this.scene.cameras.main.worldView.contains(monsterObj.sprite.x, monsterObj.sprite.y))
            .map(([key, monsterObj]) => ({ key, ...monsterObj }));

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

            const randomNum = Math.random();
            const currentMonster = monstersInView[0];
            let itemTier;
            if (randomNum <= 0.05) itemTier = 'ultrarare';
            else if (randomNum <= 0.25) itemTier = 'rare';
            else itemTier = 'common';

            const itemDropped = currentMonster.event.possibleOutcomes[itemTier][Math.floor(Math.random() * currentMonster.event.possibleOutcomes[itemTier].length)];
            const item = {
                name: itemDropped,
                quantity: 1,
                effects: itemInfo[itemDropped]
            };

            const x = monstersInView[0].sprite.x;
            const y = monstersInView[0].sprite.y;
            console.log(itemDropped); // Log out the name of the item
            this.scene.time.delayedCall(600, () => { // 600 milliseconds or 0.6 seconds
                const newItem = new Item(this.scene, x, y, itemDropped.toLowerCase(), item);
                this.scene.items.push(newItem);
            });
            console.log(`Item Dropped: ${item.name}, XP added: ${xpAdded}`);
            monstersInView[0].sprite.destroy();
            monstersInView[0].levelText.destroy();
            this.isEventRunning = false;
            delete monsters[monstersInView[0].key];


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
            this.isEventRunning = false;
            delete monsters[monstersInView[0].key];


        }
        monstersInView[0].sprite.destroy();
        monstersInView[0].levelText.destroy();
        this.isEventTriggered = false;

    }

    update(monsters) {
        // This method can be left empty if there is no additional logic needed in the game loop.
    }
}
