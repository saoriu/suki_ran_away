import Phaser from 'phaser';
import { PlayerState, addXpToSkill } from './playerState.js';
import { itemInfo } from './itemInfo.js';
import { Item } from './Item';
import { GAME_CONFIG } from './gameConstants.js';
import { attacks } from './attacks'; // Adjust the path as necessary



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
        this.runningDistance = 1;


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

    _emitMonsterBattleUpdate(monsterLevel, playerEnergy, ) {
        this.scene.game.events.emit('monsterBattleUpdate', {
            monsterLevel,
            petEnergy: playerEnergy,
            
        });
        this.scene.game.events.emit('energyChanged');
    }

    playerAttack(monsters, targetMonsterKey, attackName) {
        if (this.scene.isFainting) return; // Skip if player is dead

        const targetMonster = monsters[targetMonsterKey];
        if (!targetMonster || targetMonster.isDead || targetMonster.currentHealth <= 0) {
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
            //depths
            targetMonster.healthBar.outer.setDepth(targetMonster.sprite.depth + 2000);
            targetMonster.healthBar.fill.setDepth(targetMonster.sprite.depth + 2000);

            // Update the last energy update time
            PlayerState.lastEnergyUpdate = Date.now();

            // Calculate the monster's health and level
            let monsterHealth = targetMonster.level * 1;
            let monsterLevel = targetMonster.level;
            const timeToImpact = 150;


            const selectedAttack = attacks[attackName] || attacks['scratch'];
           const playerRoll = Phaser.Math.Between(1, Math.floor((PlayerState.skills.dancing.level * 0.1) + (selectedAttack.damage * (1 + PlayerState.attackBonus / 100))));
            // Apply damage to the monster
            targetMonster.currentHealth -= playerRoll;
            if (playerRoll > 0) {
                targetMonster.isHurt = true;
               
            
            setTimeout(() => {
                if (targetMonster.sprite && targetMonster.sprite.active) {
                    if (targetMonster.currentHealth > 0) {
                        if (selectedAttack.name === 'horsekick') {
                            targetMonster.isKnocked = true;
                        }                        
                        const knockbackMagnitude = selectedAttack.knockback * 0.01;
                        const directionX = this.player.x - targetMonster.sprite.x;
                        const directionY = this.player.y - targetMonster.sprite.y;

                        // Normalize the direction vector
                        const dir = new Phaser.Math.Vector2(directionX, directionY).normalize();

                        // Apply the force more gradually
                        this.scene.time.addEvent({
                            delay: 20,
                            callback: () => {
                                // Apply the force using Phaser's Matter physics method
                                this.scene.matter.body.applyForce(targetMonster.sprite.body, {
                                    x: targetMonster.sprite.x,
                                    y: targetMonster.sprite.y
                                }, {
                                    x: -dir.x * knockbackMagnitude,
                                    y: -dir.y * knockbackMagnitude
                                });
                            },
                            repeat: selectedAttack.knockback,

                        });
                        //if isknocked is true

                        if (targetMonster.isKnocked) {

                        setTimeout(() => {
                            targetMonster.isKnocked = false;
                        }, 500);
                    }
                    }
                }



                    if (targetMonster && targetMonster.sprite && targetMonster.sprite.active) {
                        const changeText = this.scene.add.text(
                            -40,
                            0,
                            `${Math.abs(playerRoll).toFixed(0)}`,
                            {
                                fontFamily: 'Ninja',
                                fontSize: '25px',
                                fill: '#ffffff',
                                stroke: '#ff0000',
                                strokeThickness: 6,
                            }
                        ).setDepth(targetMonster.sprite.depth + 2000).setOrigin(0.5, 0); // Set depth to monster's depth + 5    

                        // Add the blood animation behind the damage text
                        const blood = this.scene.add.sprite(0, 0, 'blood').setDepth(targetMonster.sprite.depth + 1999).setOrigin(0.5, 0.5);
                        blood.play('blood', true);
                    

                        // Attach damage text to the monster for tracking
                        targetMonster.damageText = changeText;
                        targetMonster.blood = blood;

                        // Tween for damage text fade out
                        if (changeText) {
                            this.scene.tweens.add({
                                targets: changeText,
                            alpha: 0,
                            duration: 1200,
                            onComplete: () => {
                                    changeText.destroy();
                                    blood.destroy();
                            }
                        });
                    }
                
                    }
                }, timeToImpact);
            }


            // Check if the monster is defeated
            if (targetMonster.currentHealth <= 0) {
                targetMonster.currentHealth = 0;
                this._emitPlayerBattleUpdate(monsterLevel, monsterHealth, playerRoll);
                addXpToSkill('dancing', targetMonster.level * 50);
                this.handleItemDrop(targetMonster); // Call handleItemDrop for the defeated monster
                this.endBattleForMonster(targetMonster, targetMonsterKey); // Call endBattleForMonster for the defeated monster
            } else if (targetMonster.currentHealth > 0) {
                targetMonster.isAggressive = true;
            }
        }
    }


    monsterAttack(monsters, targetMonsterKey) {
        if (this.scene.isFainting) return; // Skip if player is dead

        const targetMonster = monsters[targetMonsterKey];
        if (!targetMonster || targetMonster.isDead) {
            return; // Skip if monster is dead or doesn't exist
        }

        this.currentBattleMonsterKey = {
            key: targetMonster.key,
            timestamp: Date.now()
        };

        PlayerState.lastEnergyUpdate = Date.now();

        let monsterLevel = targetMonster.level;
        let monsterDamage = targetMonster.damage;
       const monsterRoll = Phaser.Math.Between(1, monsterDamage * (1 - PlayerState.defenceBonus / 100));     
        targetMonster.isAttacking = true;
        this.monsterHasAttacked = true;

        const timeToImpact = 300;

        setTimeout(() => {
            if (PlayerState.energy > 0) {
                PlayerState.isUnderAttack = true;
                PlayerState.energy -= monsterRoll;
                PlayerState.lastDamageTime = Date.now();

                this._emitMonsterBattleUpdate(monsterLevel, PlayerState.energy, monsterRoll);
                PlayerState.isUnderAttack = false;

                if (monsterRoll > 0) {
                    PlayerState.isHurt = true;
                }

                if (PlayerState.energy < 1) {
                    PlayerState.energy = 0;
                    this.endBattleForMonster(targetMonster);
                }
            }

            //reset attackComplete after 500ms
            setTimeout(() => {
                targetMonster.attackComplete = true;
            }, 1000);
        }, timeToImpact);
    }

    handleItemDrop(targetMonster) {
        if (!targetMonster) return;
        const uiScene = this.scene.scene.get('UIScene');

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

            //show the item
            newItem.show();
        });

        // Map item rarities to colors
        const itemColors = {
            common: 'white',
            uncommon: '#87CEEB',
            rare: 'gold',
            ultrarare: 'magenta'
        };

        const messageColor = itemColors[item.effects.rarity];

        // Helper function to determine whether to use "a", "an", or "some"
        const indefiniteArticle = (word) => {
            if (['cotton', 'flour', 'silk', 'milk'].includes(word.toLowerCase())) {
                return 'some';
            }
            return ['a', 'e', 'i', 'o', 'u'].includes(word[0].toLowerCase()) ? 'an' : 'a';
        };

        uiScene.addMessage(`The ${targetMonster.name.toLowerCase()} dropped ${indefiniteArticle(itemDropped)} ${itemDropped.toLowerCase()}!`, messageColor);
    }

    endBattleForMonster(targetMonster, targetMonsterKey) {
        if (!targetMonster || targetMonster.isDead) return;

        // Play the death animation first
        if (targetMonster.currentHealth <= 0) {
            targetMonster.isAggressive = false;
            targetMonster.isDead = true;

            // Listen for the animation completion
            targetMonster.sprite.once('animationcomplete', () => {
                // Proceed to clean up after the animation is complete
                this.cleanUpMonster(targetMonster, targetMonsterKey);
            }, this);
        } else {
            // If the monster is not dead, proceed to clean up directly
            this.cleanUpMonster(targetMonster, targetMonsterKey);
        }
    }

    handleMonsterEngagement(monsters, monster) {
        if (monster.canReach && monster.isAggressive) {
            monster.isAttacking = true;
            monster.isFollowing = false;
        } else {
            monster.isFollowing = true;
        }
    }


    cleanUpMonster(targetMonster, targetMonsterKey) {
        // Destroy the monster health bar (if it exists)
        if (targetMonster.sprite) {
            this.scene.tweens.killTweensOf(targetMonster.sprite);
        }

        if (targetMonster.damageText) {
            // Stop any tweens on damageText
            this.scene.tweens.killTweensOf(targetMonster.damageText);
    
            // Now safely destroy damageText
            targetMonster.damageText.destroy();
            targetMonster.damageText = null;
        }

        if (targetMonster.blood) {
            targetMonster.blood.destroy();
        }

        // If the aggro sprite exists, destroy it and remove it from allEntities
        if (targetMonster.aggroSprite) {
            targetMonster.aggroSprite.destroy();
            targetMonster.aggroSprite = null;
        }

        
        if (targetMonster.healthBar && targetMonster.healthBar.fill && targetMonster.healthBar.outer) {
            targetMonster.healthBar.fill.destroy();
            targetMonster.healthBar.outer.destroy();
        }

        if (targetMonster.monsterShadow) {
            targetMonster.monsterShadow.destroy();
        }

        // Reset battle flags
        targetMonsterKey = null;
        this.monsterHasAttacked = false;
        targetMonster.canReach = false;
        PlayerState.lastEnergyUpdate = Date.now();
        this.currentBattleMonsterKey = null;
        this.scene.game.events.emit('endBattle');

        // Finally, destroy the monster sprite
        targetMonster.sprite.destroy();
        }


    update(monsters, allEntities, delta) {
        Object.values(monsters).forEach(monster => {
            if (!monster || !monster.sprite || !monster.sprite.active) return; // Check if monster and its sprite are valid

            if (monster.damageText && monster && monster.sprite && monster.sprite.active && monster.blood) {
                monster.damageText.x = monster.sprite.x;
                monster.damageText.y = monster.sprite.y - 20;

                monster.blood.x = monster.sprite.x + 5;
                monster.blood.y = monster.sprite.y + 5;
            }


            const distance = this.calculateDistance(this.player, monster); // Calculate distance between player and monster

            if (monster.canReach) {
                this.handleMonsterEngagement(monsters, monster); // Handle close-range engagement
            }


            this.updateMonsterMovement(this.player, monster, distance, allEntities, delta); // Update monster movement based on current state
        });
        

    }

    calculateDistance(player, monster) {
        const playerPosition = player.body.position;
        const monsterPosition = monster.sprite.body.position;

        const distanceX = (playerPosition.x - monsterPosition.x) / this.tileWidth;
        const distanceY = (playerPosition.y - monsterPosition.y) / this.tileWidth;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        // Assuming circular bodies, subtract radii to get distance between edges
        const playerRadius = player.body.circleRadius / this.tileWidth;
        const monsterRadius = monster.sprite.body.circleRadius / this.tileWidth;
        monster.distance = Math.max(0, distance - (playerRadius + monsterRadius));
        return monster.distance;
    }

    updateMonsterMovement(player, monster, distance, allEntities, delta) {
        //if monster health is not 0
        if (monster.currentHealth > 0) {

            //return if calculaatedistance is greater than 5 and isKnocked is true
            if (monster.isKnocked) {
                return;
            }
            const speedScale = delta / 8; // Adjust the divisor as needed

            if (monster.isAggressive && !monster.canReach) {
                const { normalizedDirectionX, normalizedDirectionY } = this.getDirectionTowardsPlayer(player, monster);
                const velocity = {
                    x: normalizedDirectionX * monster.speed * speedScale,
                    y: normalizedDirectionY * monster.speed * speedScale
                };

                // Apply velocity to the monster
                monster.sprite.setVelocity(velocity.x, velocity.y);

                // Flip the monster sprite based on the direction of movement
                monster.sprite.setFlipX(velocity.x < 0);
                monster.monsterFacingRight = velocity.x >= 0;
            } else if (!monster.isAggressive) {
                const currentTime = Date.now();
                if (!monster.destination || currentTime - monster.destinationTime > 3000) {
                    const x = monster.spawnPoint.x + (Math.random() - 0.5) * monster.wanderArea;
                    const y = monster.spawnPoint.y + (Math.random() - 0.5) * monster.wanderArea;
                    monster.destination = { x, y };
                    monster.destinationTime = currentTime; // Set the timestamp
                }

                const { normalizedDirectionX, normalizedDirectionY } = this.getDirectionTowardsPoint(monster.destination, monster);
                const velocity = {
                    x: normalizedDirectionX * (monster.speed * 0.35) * speedScale,
                    y: normalizedDirectionY * (monster.speed * 0.35) * speedScale
                };

                // Apply velocity to the monster
                monster.sprite.setVelocity(velocity.x, velocity.y);

                // Flip the monster sprite based on the direction of movement
                monster.sprite.setFlipX(velocity.x < 0);
                monster.monsterFacingRight = velocity.x >= 0;

                // If the monster has reached the destination, clear the destination
                if (Math.abs(monster.sprite.x - monster.destination.x) < monster.speed && Math.abs(monster.sprite.y - monster.destination.y) < monster.speed) {
                    monster.destination = null;
                }
            }
        } else {
            monster.sprite.setVelocity(0, 0);
        }
    }

    getDirectionTowardsPoint(point, monster) {
        const dx = point.x - monster.sprite.x;
        const dy = point.y - monster.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return {
            normalizedDirectionX: dx / distance,
            normalizedDirectionY: dy / distance
        };
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