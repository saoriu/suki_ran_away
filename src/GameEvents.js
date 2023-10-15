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

        GameEvents.currentInstance = this; // Assign the current instance to the static property

    }

    _emitBattleUpdate(monsterLevel, monsterHealth, playerRoll, monsterRoll) {
        this.scene.game.events.emit('updateBattleDisplay', {
            monsterLevel,
            petEnergy: PlayerState.energy,
            monsterHealth,
            playerRoll,
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

        if (monstersInView.length === 0) return;

        this.isEventTriggered = true;
        PlayerState.lastEnergyUpdate = Date.now();
        this.scene.game.events.emit('startBattle');

        let monsterHealth = monstersInView[0].level * 10;
        let monsterLevel = monstersInView[0].level;
        this._emitBattleUpdate(monsterLevel, monsterHealth, 0, 0);

        let currentStep = Math.random() < 0.5 ? 'playerRoll' : 'monsterRoll';
        const monsterKey = monstersInView[0].key;

        const eventInterval = setInterval(() => {
            const monstersInView = Object.entries(monsters)
                .filter(([_, monsterObj]) => {
                    return this.scene.cameras.main.worldView.contains(monsterObj.sprite.x, monsterObj.sprite.y);
                })
                .map(([key, monsterObj]) => ({ key, ...monsterObj }));

            if (monstersInView.length === 0) {
                this.scene.game.events.emit('runAway', true);
                clearInterval(eventInterval);
                this.isEventTriggered = false;
                PlayerState.lastEnergyUpdate = Date.now();
                return;
            }
            if (currentStep === 'playerRoll') {
                const playerRoll = Phaser.Math.Between(0, PlayerState.level * 10);
                this._emitBattleUpdate(monsterLevel, monsterHealth, playerRoll, 0);
                monsterHealth -= playerRoll;
                monsters[monsterKey].currentHealth -= playerRoll;

                if (monsterHealth <= 0) {
                    this._emitBattleUpdate(monsterLevel, monsterHealth, playerRoll, 0);
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
                        delete monsters[monstersInView[0].key];
                        clearInterval(eventInterval);
                } else {
                    this._emitBattleUpdate(monsterLevel, monsterHealth, playerRoll, 0);
                    currentStep = 'monsterRoll';
                }
            } else if (currentStep === 'monsterRoll') {
                const monsterRoll = Phaser.Math.Between(0, monstersInView[0].level * 10);
                PlayerState.energy -= monsterRoll;
                if (PlayerState.energy <= 0) {
                    PlayerState.energy = 0;
                    this._emitBattleUpdate(monsterLevel, monsterHealth, 0, monsterRoll);
                    monstersInView[0].sprite.destroy();
                    monstersInView[0].levelText.destroy();
                    monstersInView[0].healthBar.fill.destroy();
                    monstersInView[0].healthBar.outer.destroy();                    
                    monstersInView[0].healthText.destroy();
                    this.isEventTriggered = false;
                    PlayerState.lastEnergyUpdate = Date.now();
                    delete monsters[monstersInView[0].key];
                    clearInterval(eventInterval);
                } else {
                    this._emitBattleUpdate(monsterLevel, monsterHealth, 0, monsterRoll);
                    currentStep = 'playerRoll';
                }
            }
        }, 2000);
        this.scene.game.events.on('runAway', () => {
            clearInterval(eventInterval);
            this.isEventTriggered = false;
        });
    }

    update(monsters) {
        // This method can be left empty if there is no additional logic needed in the game loop.
    }
}
