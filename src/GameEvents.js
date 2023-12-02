import Phaser from 'phaser';
import { PlayerState, addXpToSkill } from './playerState.js';
import { itemInfo } from './itemInfo.js';
import { Item } from './Item';
import { GAME_CONFIG } from './gameConstants.js';

export class GameEvents {
    static currentInstance = null; // This static property holds the current instance

    constructor(scene, cat) {
        this.scene = scene;
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

        // Set the current battle monster key
        this.currentBattleMonsterKey = {
            key: targetMonster.key,
            timestamp: Date.now()
        };

        targetMonster.healthBar.outer.setVisible(true);
        targetMonster.healthBar.fill.setVisible(true);
        targetMonster.healthText.setVisible(true);
        targetMonster.levelText.setVisible(true);

        // Update the last energy update time
        PlayerState.lastEnergyUpdate = Date.now();

        // Emit start battle event
        this.scene.game.events.emit('startBattle');

        // Calculate the monster's health and level
        let monsterHealth = targetMonster.level * 1;
        let monsterLevel = targetMonster.level;

        // Emit player battle update event
        const playerRoll = Phaser.Math.Between(0, PlayerState.level * 7);
        this._emitPlayerBattleUpdate(monsterLevel, monsterHealth, playerRoll);

        // Apply damage to the monster
        targetMonster.currentHealth -= playerRoll;
        if (playerRoll > 0) {
        targetMonster.isHurt = true;  // Assuming each monster object has an isHurt property
        }

        // Check if the monster is defeated
        if (targetMonster.currentHealth <= 0) {
            this._emitPlayerBattleUpdate(monsterLevel, monsterHealth, playerRoll);
            addXpToSkill('dancing', targetMonster.level * 50);
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
    let monsterDamage = targetMonster.damage;
    const monsterRoll = Phaser.Math.Between(0, monsterDamage * 1);
    targetMonster.isAttacking = true;
    this.monsterHasAttacked = true;

    // Time to impact (in milliseconds)
    const timeToImpact = 300; // Adjust based on your animation, e.g., 0.3 seconds = 300 ms

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
        if (!targetMonster) return;

            // Clean up monster assets
            targetMonster.isAggressive = false;

            // Destroy the monster health bar (if it exists)
            if (targetMonster.healthBar && targetMonster.healthBar.fill && targetMonster.healthBar.outer) {
                    targetMonster.healthBar.fill.destroy();
                    targetMonster.healthBar.outer.destroy();
                    targetMonster.levelText.destroy();
                    targetMonster.sprite.destroy();
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
            targetMonster.isDead = true
            targetMonster.isColliding = false;
            PlayerState.lastEnergyUpdate = Date.now();
            this.currentBattleMonsterKey = null;
            this.scene.game.events.emit('endBattle');

            if (Object.keys(this.scene.collidingMonsters).length > 0) {
                this.scene.collidingMonsterKey = Object.keys(this.scene.collidingMonsters)[0];
            }


    }


    update(monsters) {
        const player = this.scene.cat;
        const tileWidth = GAME_CONFIG.TILE_WIDTH;
        const maxDistance = 30 * tileWidth;
        const runningDistance = 0.7 * tileWidth;
    
        Object.values(monsters).forEach(monster => {
            if (!monster || !monster.sprite || !monster.sprite.active) return; // Check if monster and its sprite are valid

            const distance = this.calculateDistance(player, monster); // Calculate distance between player and monster
    
            if (distance > maxDistance) {
                this.endBattleForMonster(monster); // End battle if the monster is too far
                return; // Skip further processing for this monster
            }
    
            if (distance > runningDistance) {
                monster.isColliding = false; // Reset colliding status
                monster.isFollowing = true; // Monster starts following the player
                monster.isMoving = true;
            } else {
                this.handleMonsterEngagement(monsters, monster); // Handle close-range engagement
                monster.isMoving = false;
            }
    
            this.updateMonsterMovement(player, monster, distance); // Update monster movement based on current state
        });
    }
    
calculateDistance(player, monster) {
    const playerCenterX = player.x + player.body.offset.x;
    const playerCenterY = player.y + player.body.offset.y;
    const monsterCenterX = monster.sprite.x + monster.sprite.body.offset.x;
    const monsterCenterY = monster.sprite.y + monster.sprite.body.offset.y;

    const distanceX = playerCenterX - monsterCenterX;
    const distanceY = playerCenterY - monsterCenterY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    // Subtracting the radii to calculate distance between the edges of the bodies
    const playerRadius = player.body.width / 2;
    const monsterRadius = monster.sprite.body.width / 2;
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
            const monsterSpeed = monster.speed; // Adjust as needed
            monster.sprite.x += normalizedDirectionX * monsterSpeed;
            monster.sprite.y += normalizedDirectionY * monsterSpeed;
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