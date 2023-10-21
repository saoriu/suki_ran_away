import Phaser from 'phaser';
import { PlayerState, addXpToSkill } from './playerState.js';
import { itemInfo } from './itemInfo.js';
import { Item } from './Item';
import { GAME_CONFIG } from './gameConstants';

export class GameEvents {
    static currentInstance = null; // This static property holds the current instance

    constructor(scene, cat) {
        this.scene = scene;
        this.isEventTriggered = false;
        this.delayedEndCall = null;
        this.currentBattleMonsterKey = null; // Key of monster currently in battle with

        GameEvents.currentInstance = this; // Assign the current instance to the static property
        
    }

    _emitPlayerBattleUpdate(monsterLevel, monsterHealth, playerRoll) {
        this.scene.game.events.emit('playerBattleUpdate', {
            monsterLevel,
            petEnergy: PlayerState.energy,
            monsterHealth,
            playerRoll
        });
        this.scene.game.events.emit('energyChanged');
    }

    _emitMonsterBattleUpdate(monsterLevel, playerEnergy, monsterRoll) {
        this.scene.game.events.emit('monsterBattleUpdate', {
            monsterLevel,
            petEnergy: playerEnergy,
            monsterRoll
        });
        this.scene.game.events.emit('energyChanged');
    }

    handleEvent(monsters) {

        if (this.isEventTriggered) return;

        const monstersInView = Object.entries(monsters)
            .filter(([_, monsterObj]) => {
                if (!monsterObj || !monsterObj.sprite) return false;  // Ensure monsterObj.sprite exists
                const dx = this.scene.cat.x - monsterObj.sprite.x;
                const dy = this.scene.cat.y - monsterObj.sprite.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const threeTilesAway = 3 * GAME_CONFIG.TILE_WIDTH * GAME_CONFIG.SCALE;
                return this.scene.cameras.main.worldView.contains(monsterObj.sprite.x, monsterObj.sprite.y) && distance <= threeTilesAway;
            })
            .map(([key, monsterObj]) => ({ key, ...monsterObj }));
            

        if (monstersInView.length === 0) {
            const playerRoll = Phaser.Math.Between(0, PlayerState.level * 1);
            console.log(`Player rolled ${playerRoll} but there are no monsters in view!`);
            return;
        }

        this.isEventTriggered = true;
        this.currentBattleMonsterKey = {
            key: monstersInView[0].key,
            timestamp: Date.now()
        };

        PlayerState.lastEnergyUpdate = Date.now();
        this.scene.game.events.emit('startBattle');

        let monsterHealth = monstersInView[0].level * 1;
        let monsterLevel = monstersInView[0].level;
        this._emitPlayerBattleUpdate(monsterLevel, monsterHealth);

        const monsterKey = monstersInView[0].key;

        const playerRoll = Phaser.Math.Between(0, PlayerState.level * 1);
        this._emitPlayerBattleUpdate(monsterLevel, monsterHealth, playerRoll);
        monsterHealth -= playerRoll;
        monsters[monsterKey].currentHealth -= playerRoll;

        if (monsters[monsterKey].currentHealth <= 0) {
            this._emitPlayerBattleUpdate(monsterLevel, monsterHealth, playerRoll);
            addXpToSkill('dancing', monstersInView[0].level * 50);
            const randomNum = Math.random();
            const itemTier = randomNum <= 0.05 ? 'ultrarare' : randomNum <= 0.25 ? 'rare' : 'common';
            const itemDropped = monstersInView[0].event.possibleOutcomes[itemTier][Math.floor(Math.random() * monstersInView[0].event.possibleOutcomes[itemTier].length)];
            const item = {
                name: itemDropped,
                quantity: 1,
                effects: itemInfo[itemDropped]
            };

            const x = monstersInView[0].sprite.x;
            const y = monstersInView[0].sprite.y;
            this.scene.time.delayedCall(300, () => {
                const newItem = new Item(this.scene, x, y, itemDropped.toLowerCase(), item);
                this.scene.items.push(newItem);
            });
            monstersInView[0].sprite.destroy();
            monstersInView[0].levelText.destroy();
            monstersInView[0].healthBar.fill.destroy();
            monstersInView[0].healthBar.outer.destroy();
            monstersInView[0].healthText.destroy();
            this.isEventTriggered = false;
            PlayerState.lastEnergyUpdate = Date.now();
            this.currentBattleMonsterKey = null;
            delete monsters[monstersInView[0].key];
            this.scene.game.events.emit('endBattle');
            return;
        }
        this.timeoutID = setTimeout(() => {
            this.scene.game.events.emit('startMonster');
            const monsterRoll = Phaser.Math.Between(0, monstersInView[0].level * 1);
            PlayerState.energy -= monsterRoll;
            if (PlayerState.energy <= 0) {
                PlayerState.energy = 0;
                this._emitMonsterBattleUpdate(monsterLevel, PlayerState.energy, monsterRoll);
                monstersInView[0].sprite.destroy();
                monstersInView[0].levelText.destroy();
                monstersInView[0].healthBar.fill.destroy();
                monstersInView[0].healthBar.outer.destroy();
                monstersInView[0].healthText.destroy();
                this.isEventTriggered = false;
                PlayerState.lastEnergyUpdate = Date.now();
                this.currentBattleMonsterKey = null;
                delete monsters[monstersInView[0].key];
                this.scene.game.events.emit('endBattle');
            } else {
                this._emitMonsterBattleUpdate(monsterLevel, PlayerState.energy, monsterRoll);
            }
            this.isEventTriggered = false;
        }, 1000);

        this.scene.game.events.on('runAway', () => {
            this.isEventTriggered = false;
        });
    }

    isMonsterInView(monsterObj) {
        if (!monsterObj || !monsterObj.sprite) return false;  // Ensure monsterObj.sprite exists
    
        const dx = this.scene.cat.x - monsterObj.sprite.x;
        const dy = this.scene.cat.y - monsterObj.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const threeTilesAway = 3 * GAME_CONFIG.TILE_WIDTH * GAME_CONFIG.SCALE;
    
        return this.scene.cameras.main.worldView.contains(monsterObj.sprite.x, monsterObj.sprite.y) && distance <= threeTilesAway;
    }
    

    update(monsters) {
        if (this.currentBattleMonsterKey && !this.isMonsterInView(monsters[this.currentBattleMonsterKey.key])) {
            clearTimeout(this.timeoutID); // Clear the timeout if the player runs away
            this.scene.game.events.emit('endBattle');
            this.isEventTriggered = false;
            console.log('Cat ran away!');
            this.currentBattleMonsterKey = null;
        }
    }
    
}
