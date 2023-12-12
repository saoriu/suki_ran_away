import Phaser from 'phaser';
import { PlayerState, addXpToSkill } from './playerState.js';
import { itemInfo } from './itemInfo.js';
import { Item } from './Item';
import { GAME_CONFIG } from './gameConstants.js';
import { unlockedAttacksForLevel } from './attacks'; // Import the new utility function


export class GameEvents {
    static currentInstance = null; // This static property holds the current instance

    constructor(scene, cat) {
        this.scene = scene;
        this.cat = cat;
        this.activeChangeTexts = 0;
        this.delayedEndCall = null;
        this.currentBattleMonsterKey = null; // Key of monster currently in battle with
        this.monsterHasAttacked = false; // flag to check if monster has retaliated
        this.player = this.scene.cat;
        this.tileWidth = GAME_CONFIG.TILE_WIDTH;
        this.maxDistance = 30 * this.tileWidth;
        this.runningDistance = 0.5 * this.tileWidth;


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

        const targetMonster = monsters[targetMonsterKey];
        if (!targetMonster || targetMonster.isDead || targetMonster.currentHealth <= 0) {
            console.log("Monster is dead or dying from PA");
            return; // Skip if monster is dead, dying, or doesn't exist
        }

        if (PlayerState.energy > 0) {
            // Retrieve the target monster using its key
            const targetMonster = monsters[targetMonsterKey];

            // Check if the target monster exists
            if (!targetMonster) {
                return;
            }

            if (!targetMonster || targetMonster.currentHealth <= 0) {
                // Skip the attack if the monster doesn't exist or is already defeated
                return;
            }

            // Set the current battle monster key
            this.currentBattleMonsterKey = {
                key: targetMonster.key,
                timestamp: Date.now()
            };

            targetMonster.healthBar.outer.setVisible(true);
            targetMonster.healthBar.fill.setVisible(true);
            targetMonster.healthText.setVisible(false);
            targetMonster.levelText.setVisible(false);

            // Update the last energy update time
            PlayerState.lastEnergyUpdate = Date.now();

            // Calculate the monster's health and level
            let monsterHealth = targetMonster.level * 1;
            let monsterLevel = targetMonster.level;

            // Emit player battle update event
            const availableAttacks = unlockedAttacksForLevel(PlayerState.level);
            const selectedAttack = availableAttacks[Phaser.Math.Between(0, availableAttacks.length - 1)];
            const playerRoll = Phaser.Math.Between(0, (selectedAttack.level * 50));
        
            // Store selected attack in the scene for animation
            console.log("Selected Attack:", selectedAttack.name, "Number:", selectedAttack.attack); // Add for debugging

            this.scene.selectedAttackNumber = selectedAttack.attack;
            this.scene.registry.set('selectedAttackNumber', selectedAttack.attack);
        
            console.log(`Player rolled ${playerRoll} for ${selectedAttack.name}!`);
        
            // Apply damage to the monster
            targetMonster.currentHealth -= playerRoll;
            if (playerRoll > 0) {
                targetMonster.isHurt = true;  // Assuming each monster object has an isHurt property
                const textX = targetMonster.sprite.x;
                const textY = targetMonster.sprite.y - 20 - (this.activeChangeTexts * 20); // Adjust y-position based on activeChangeTexts
                const changeText = this.scene.add.text(
                    textX,
                    textY,
                    `${Math.abs(playerRoll).toFixed(0)}`, // Use Math.abs to remove the negative sign
                    {
                        fontFamily: '"redonda-condensed", sans-serif',
                        fontSize: '25px',
                        fill: '#ff0000', // Only negative changes, so color is always red
                        fontWeight: '100',
                        stroke: '#ffffff',
                        strokeThickness: 6,
                        fontStyle: 'italic'
                    }
                ).setDepth(5);
                this.activeChangeTexts++; // Increment the counter when a new text is added

                this.scene.tweens.add({
                    targets: changeText,
                    y: changeText.y - 20,
                    alpha: 0,
                    duration: 1200,
                    onComplete: () => {
                        changeText.destroy();
                        this.activeChangeTexts--; // Decrement the counter when a text is removed
                    }
                });
            }

            // Check if the monster is defeated
            if (targetMonster.currentHealth <= 0) {
                targetMonster.currentHealth = 0;
                this._emitPlayerBattleUpdate(monsterLevel, monsterHealth, playerRoll);
                addXpToSkill('dancing', targetMonster.level * 500);
                this.handleItemDrop(targetMonster); // Call handleItemDrop for the defeated monster
                this.endBattleForMonster(targetMonster); // Call endBattleForMonster for the defeated monster
            } else if (!this.monsterHasAttacked) {
                // Monster retaliates if it hasn't already
                this.monsterHasAttacked = true;
                this.monsterAttack(monsters, targetMonster.key); // Call monsterAttack with the specific monster key
            }
        }
    }


    monsterAttack(monsters, targetMonsterKey) {
        if (this.scene.isFainting) return; // Skip if player is dead
    
        const targetMonster = monsters[targetMonsterKey];
        if (!targetMonster || targetMonster.isDead) {
            console.log("Monster is dead");
            return; // Skip if monster is dead or doesn't exist
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

        let monsterLevel = targetMonster.level;
        let monsterDamage = targetMonster.damage;
        const monsterRoll = Phaser.Math.Between(0, monsterDamage * 1);
        targetMonster.isAttacking = true;
        this.monsterHasAttacked = true;

        // Time to impact (in milliseconds)
        const timeToImpact = 500; // Adjust based on your animation, e.g., 0.3 seconds = 300 ms

        // Delay damage application to synchronize with the attack animation's impact frame
        setTimeout(() => {
            if (PlayerState.energy > 0) {
                PlayerState.energy -= monsterRoll;
                PlayerState.lastDamageTime = Date.now(); // Update the last damage time in PlayerState
                this._emitMonsterBattleUpdate(monsterLevel, PlayerState.energy, monsterRoll);

                if (PlayerState.energy <= 0) {
                    PlayerState.energy = 0;
                    this.endBattleForMonster(targetMonster);
                }
            }
        }, timeToImpact);

        // Resetting the attacking flag should be handled after the animation completes
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
        if (!targetMonster || targetMonster.isDead) return;

        // Play the death animation first
        if (targetMonster.currentHealth <= 0) {
            targetMonster.isAggressive = false;
            targetMonster.isDead = true;    
            targetMonster.sprite.play(`${targetMonster.event.monster}_die`, true);
    
            // Listen for the animation completion
            targetMonster.sprite.once('animationcomplete', () => {
                // Proceed to clean up after the animation is complete
                this.cleanUpMonster(targetMonster);
            }, this);
        } else {
            // If the monster is not dead, proceed to clean up directly
            this.cleanUpMonster(targetMonster);
        }
    }
    
    cleanUpMonster(targetMonster) {    
        // Destroy the monster health bar (if it exists)
        if (targetMonster.healthBar && targetMonster.healthBar.fill && targetMonster.healthBar.outer) {
            targetMonster.healthBar.fill.destroy();
            targetMonster.healthBar.outer.destroy();
            targetMonster.levelText.destroy();
            targetMonster.healthText.destroy();
            console.log("Monster health bar destroyed");
        }
    
        // Remove the monster from the active monsters collection
        if (this.scene.collidingMonsters[targetMonster.key]) {
            delete this.scene.collidingMonsters[targetMonster.key];
            delete this.scene.monsters[targetMonster.key];
            console.log("Monster removed from active monsters");
        }
    
        // Reset battle flags
        this.monsterHasAttacked = false;
        targetMonster.isColliding = false;
        PlayerState.lastEnergyUpdate = Date.now();
        this.currentBattleMonsterKey = null;
        this.scene.game.events.emit('endBattle');
    
        // Finally, destroy the monster sprite
        targetMonster.sprite.destroy();
        console.log("Monster sprite destroyed");
    }
    

    update(monsters) {


        Object.values(monsters).forEach(monster => {
            if (!monster || !monster.sprite || !monster.sprite.active) return; // Check if monster and its sprite are valid

            const distance = this.calculateDistance(this.player, monster); // Calculate distance between player and monster

            if (distance > this.maxDistance) {
                this.cleanUpMonster(monster); // End battle if the monster is too far
                return; // Skip further processing for this monster
            }

            if (distance > this.runningDistance) {
                monster.isColliding = false; // Reset colliding status
                monster.isFollowing = true; // Monster starts following the player
            } else {
                this.handleMonsterEngagement(monsters, monster); // Handle close-range engagement
            }

            this.updateMonsterMovement(this.player, monster, distance); // Update monster movement based on current state
        });
    }

    calculateDistance(player, monster) {
        const playerPosition = player.body.position;
        const monsterPosition = monster.sprite.body.position;

        const distanceX = playerPosition.x - monsterPosition.x;
        const distanceY = playerPosition.y - monsterPosition.y;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        // Assuming circular bodies, subtract radii to get distance between edges
        const playerRadius = player.body.circleRadius;
        const monsterRadius = monster.sprite.body.circleRadius;
        return Math.max(0, distance - (playerRadius + monsterRadius));
    }


    handleMonsterEngagement(monsters, monster) {
        if (monster.isColliding) {
            this.monsterAttack(monsters, monster.key);
            monster.isFollowing = false;
        } else {
            monster.isFollowing = true;
        }
    }

    updateMonsterMovement(player, monster, distance) {
        if (monster.isFollowing && !monster.isColliding) {
            const { normalizedDirectionX, normalizedDirectionY } = this.getDirectionTowardsPlayer(player, monster);
            const velocity = {
                x: normalizedDirectionX * monster.speed,
                y: normalizedDirectionY * monster.speed
            };

            
            // Apply velocity to the monster
            monster.sprite.setVelocity(velocity.x, velocity.y);
        }
    }
    
    

    getDirectionTowardsPlayer(player, monster) {
        const directionX = player.x - monster.sprite.x;
        const directionY = player.y - monster.sprite.y;
        const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);

        if (magnitude > 0) {
            return {
                normalizedDirectionX: directionX / magnitude,
                normalizedDirectionY: directionY / magnitude
            };
        }
        return { normalizedDirectionX: 0, normalizedDirectionY: 0 };
    }


}