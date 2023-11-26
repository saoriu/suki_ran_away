import Phaser from 'phaser';
import { PlayerState, addXpToSkill } from './playerState.js';
import { itemInfo } from './itemInfo.js';
import { Item } from './Item';
import { GAME_CONFIG } from './gameConstants.js';

export class GameEvents {
    static currentInstance = null; // This static property holds the current instance

    constructor(scene, cat) {
        this.scene = scene;
        this.isEventTriggered = false;
        this.delayedEndCall = null;
        this.currentBattleMonsterKey = null; // Key of monster currently in battle with
        this.monsterHasAttacked = false; // flag to check if monster has retaliated


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

    playerAttack(monsters, targetMonsterKey) {
        if (this.scene.isFainting) return; // Skip if player is dead

        if (PlayerState.energy > 0) {
            // Retrieve the target monster using its key
        const targetMonster = monsters[targetMonsterKey];

        // Check if the target monster exists
        if (!targetMonster) {
            console.log(`No target monster found with key: ${targetMonsterKey}`);
            return;
        }

        if (!targetMonster || targetMonster.currentHealth <= 0) {
            // Skip the attack if the monster doesn't exist or is already defeated
            return;
        }

        // Set event triggered flag
        this.isEventTriggered = true;

        // Set the current battle monster key
        this.currentBattleMonsterKey = {
            key: targetMonster.key,
            timestamp: Date.now()
        };

        // Update the last energy update time
        PlayerState.lastEnergyUpdate = Date.now();

        // Emit start battle event
        this.scene.game.events.emit('startBattle');

        // Calculate the monster's health and level
        let monsterHealth = targetMonster.level * 1;
        let monsterLevel = targetMonster.level;

        // Emit player battle update event
        const playerRoll = Phaser.Math.Between(0, PlayerState.level * 10);
        this._emitPlayerBattleUpdate(monsterLevel, monsterHealth, playerRoll);

        // Apply damage to the monster
        targetMonster.currentHealth -= playerRoll;

        // Check if the monster is defeated
        if (targetMonster.currentHealth <= 0) {
            this._emitPlayerBattleUpdate(monsterLevel, monsterHealth, playerRoll);
            addXpToSkill('dancing', targetMonster.level * 50);
            this.handleItemDrop(targetMonster); // Call handleItemDrop for the defeated monster
            this.endBattleForMonster(targetMonster); // Call endBattleForMonster for the defeated monster
            this.isEventTriggered = false; // Reset the flag after the player has attacked
        } else if (!this.monsterHasAttacked) {
            // Monster retaliates if it hasn't already
            this.monsterHasAttacked = true;
            this.monsterAttack(monsters, targetMonster.key); // Call monsterAttack with the specific monster key
        }
    }
}

    monsterAttack(monsters, targetMonsterKey) {
        if (this.scene.isFainting) return; // Skip if player is dead

        if (PlayerState.energy > 0) {
        this.isEventTriggered = true; // Set the flag when a monster attacks the player
        const targetMonster = monsters[targetMonsterKey];
        if (!targetMonster) {
            console.log(`No target monster found with key: ${targetMonsterKey}`);
            return;
        }

        const attackCooldown = 1000; // 1 second in milliseconds
        const currentTime = Date.now();
        if (currentTime - targetMonster.lastAttackTime < attackCooldown) {
            return; // Skip the attack if the cooldown has not elapsed
        }
        targetMonster.lastAttackTime = currentTime;

        this.currentBattleMonsterKey = {
            key: targetMonster.key,
            timestamp: Date.now()
        };

        PlayerState.lastEnergyUpdate = Date.now();
        this.scene.game.events.emit('startBattle');

        let monsterLevel = targetMonster.level;
        const monsterRoll = Phaser.Math.Between(0, monsterLevel * 1);
        PlayerState.energy -= monsterRoll;
        this.monsterHasAttacked = true;
        this._emitMonsterBattleUpdate(monsterLevel, PlayerState.energy, monsterRoll);

        if (PlayerState.energy <= 0) {
            PlayerState.energy = 0;
            this.isEventTriggered = true; // Set the flag when a monster attacks the player
            this._emitMonsterBattleUpdate(monsterLevel, PlayerState.energy, monsterRoll);
            this.endBattleForMonster(targetMonster);
        }
    }
}


    handleItemDrop(targetMonster) {
        if (!targetMonster) return;

        const randomNum = Math.random();
        const itemTier = randomNum <= 0.05 ? 'ultrarare' : randomNum <= 0.25 ? 'rare' : 'common';
        const itemDropped = targetMonster.event.possibleOutcomes[itemTier][Math.floor(Math.random() * targetMonster.event.possibleOutcomes[itemTier].length)];

        const item = {
            name: itemDropped,
            quantity: 1,
            effects: itemInfo[itemDropped]
        };

        const x = targetMonster.sprite.x;
        const y = targetMonster.sprite.y;

        this.scene.time.delayedCall(300, () => {
            const newItem = new Item(this.scene, x, y, itemDropped.toLowerCase(), item);
            this.scene.items.push(newItem);
        });
    }


    endBattleForMonster(targetMonster) {
        if (!targetMonster) return;

            // Clean up monster assets
            targetMonster.isAggressive = false;

            // Destroy the monster sprite
            if (targetMonster.sprite) {
                targetMonster.sprite.destroy();
            }

            // Destroy the monster level text
            if (targetMonster.levelText) {
                targetMonster.levelText.destroy();
            }

            // Destroy the monster health bar (if it exists)
            if (targetMonster.healthBar) {
                if (targetMonster.healthBar.fill) {
                    targetMonster.healthBar.fill.destroy();
                }
                if (targetMonster.healthBar.outer) {
                    targetMonster.healthBar.outer.destroy();
                }
            }

            // Destroy the health text associated with the monster
            if (targetMonster.healthText) {
                targetMonster.healthText.destroy();
            }

            // Remove the monster from the active monsters collection
            if (this.scene.collidingMonsters[targetMonster.key]) {
                delete this.scene.collidingMonsters[targetMonster.key];
                delete this.scene.monsters[targetMonster.key];
                console.log(this.scene.monsters)
                console.log(this.scene.collidingMonsters)
            }

            // Reset battle flags
            this.monsterHasAttacked = false;
            targetMonster.isColliding = false;
            this.isEventTriggered = false;
            PlayerState.lastEnergyUpdate = Date.now();
            this.currentBattleMonsterKey = null;
            this.scene.game.events.emit('endBattle');

            if (Object.keys(this.scene.collidingMonsters).length > 0) {
                this.scene.collidingMonsterKey = Object.keys(this.scene.collidingMonsters)[0];
            }


    }




    update(monsters) {
        const player = this.scene.cat; // Assuming this is your player sprite
        const tileWidth = GAME_CONFIG.TILE_WIDTH;
        const maxDistance = 30 * tileWidth
        const runningDistance = 5 * tileWidth




        Object.values(monsters).forEach(monster => {

            if (monster) {
                const distanceX = player.x - monster.sprite.x;
                const distanceY = player.y - monster.sprite.y;
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                if (distance > maxDistance) {
                    this.endBattleForMonster(monster); // Destroy the monster
                }

                if (distance > runningDistance) {
                    this.isEventTriggered = false;
                    monster.isColliding = false;
                }


                if (monster.isColliding) {
                    //monster attack player:
                    this.monsterAttack(monsters, monster.key);
                    monster.isFollowing = false; // Stop following when in collision
                } else {
                    monster.isFollowing = true; // Resume following if not colliding
                }
                // Move the monster towards the player if it's following and not colliding
                if (monster.isFollowing && !monster.isColliding) {
                    const directionX = player.x - monster.sprite.x;
                    const directionY = player.y - monster.sprite.y;
                    const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);

                    if (magnitude > 0) { // Avoid division by zero
                        const normalizedDirectionX = directionX / magnitude;
                        const normalizedDirectionY = directionY / magnitude;
                        const monsterSpeed = 1; // Adjust this value as needed

                        monster.sprite.x += normalizedDirectionX * monsterSpeed;
                        monster.sprite.y += normalizedDirectionY * monsterSpeed;
                    }
                }
            }
        });
    }

}