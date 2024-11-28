import { PlayerState } from './playerState';
import { attacks } from './attacks';
import { checkCollarAnims } from './playerMovement';
import Phaser from 'phaser';

export function setupPlayerCombat(scene) {
    scene.input.keyboard.on('keydown', (event) => {
        if (!scene.isFainting && scene.canAttack) {
            let attackName;

            if (!PlayerState.isMenuOpen) {
                switch (event.code) {
                    case 'KeyZ':
                        attackName = PlayerState.selectedAttacks[1] || 'scratch';
                        break;
                    case 'KeyX':
                        attackName = PlayerState.selectedAttacks[2] || 'scratch';
                        break;
                    case 'KeyC':
                        attackName = PlayerState.selectedAttacks[3] || 'scratch';
                        break;
                    case 'Space':
                        attackName = 'scratch';
                        scene.handleItemPickup(scene.cat);
                        break;
                    default:
                        return; // Exit the function if a non-attack key is pressed
                }
            }

            if (scene.canAttack && attackName !== undefined && !PlayerState.isEating) {
                updateTargetMonsterKey(scene, attackName);
                scene.gameEvents.playerAttack(scene.monsters, scene.targetMonsterKey, attackName, scene.allEntities);
                PlayerState.isAttacking = true;
                scene.canAttack = false;

                let attackNumber = attacks[attackName].attack;
                if (attackNumber === 6) {
                    let targetMonster = scene.monsters[scene.targetMonsterKey];
                    if (targetMonster) {
                        scene.launchProjectile(targetMonster);
                    }
                }

                switch (scene.lastDirection) {
                    case 'up':
                        scene.attackAnimationKey = `attack${attackNumber}-back`;
                        if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                        }
                        scene.lastDirection = 'up';
                        break;
                    case 'down':
                        scene.attackAnimationKey = `attack${attackNumber}-front`;
                        if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                        }
                        scene.lastDirection = 'down';
                        break;
                    case 'left':
                        scene.attackAnimationKey = `attack${attackNumber}`;
                        if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                        }
                        scene.lastDirection = 'left';
                        break;
                    case 'right':
                        scene.attackAnimationKey = `attack${attackNumber}`;
                        if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                        }
                        scene.lastDirection = 'right';
                        break;
                    case 'upLeft':
                        scene.attackAnimationKey = `attack${attackNumber}`;
                        if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                        }
                        scene.lastDirection = 'upLeft';
                        break;
                    case 'upRight':
                        scene.attackAnimationKey = `attack${attackNumber}`;
                        if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                        }
                        scene.lastDirection = 'upRight';
                        break;
                    case 'downLeft':
                        scene.attackAnimationKey = `attack${attackNumber}`;
                        if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                        }
                        scene.lastDirection = 'downLeft';
                        break;
                    case 'downRight':
                        scene.attackAnimationKey = `attack${attackNumber}`;
                        if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                        }
                        scene.lastDirection = 'downRight';
                        break;
                    default:
                        scene.attackAnimationKey = `attack${attackNumber}`;
                        if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                        }
                        break;
                }

                scene.cat.play(scene.attackAnimationKey, true);
                checkCollarAnims(scene, scene.attackAnimationKey, scene.collar, scene.lastDirection, scene.allEntities, scene.collarParams, scene.currentCollarName, scene.lights);
            }
        }
    });

    let lastPressTime = 0;
    let lastDashTime = 0;
    const doubleTapThreshold = 300;
    const dashThreshold = 800;

    scene.input.keyboard.on('keydown-SPACE', () => {
        let currentTime = new Date().getTime();
        if (currentTime - lastPressTime < doubleTapThreshold && (scene.cat.body.velocity.x !== 0 || scene.cat.body.velocity.y !== 0)) {
            if (currentTime - lastDashTime > dashThreshold) {
                scene.isDashing = true;
                lastDashTime = currentTime;

                let attackName = 'roll';
                updateTargetMonsterKey(scene, attackName);
                scene.gameEvents.playerAttack(scene.monsters, scene.targetMonsterKey, attackName);
                PlayerState.isAttacking = true;
                scene.canAttack = false;
            }
        }
        lastPressTime = currentTime;
    });

    scene.cat.on('animationcomplete', (animation) => {
        if (animation.key === scene.attackAnimationKey) {
            PlayerState.isAttacking = false;
            scene.canAttack = true;
        }
    });

    scene.input.on('pointerdown', (pointer) => {
        Object.values(scene.monsters).forEach(monster => {
            if (monster && monster.sprite && monster.sprite.active) {
                const monsterBody = monster.sprite.body;
                if (monsterBody && scene.Matter.Bounds.contains(monsterBody.bounds, { x: pointer.worldX, y: pointer.worldY })) {
                    if (scene.lastClickedMonsterKey && scene.monsters[scene.lastClickedMonsterKey]) {
                        scene.postFxPlugin.remove(scene.monsters[scene.lastClickedMonsterKey].sprite);
                    }
                    scene.lastClickedMonsterKey = monster.key;
                    if (monster.sprite.body) {
                        scene.postFxPlugin.add(monster.sprite, {
                            thickness: 3,
                            outlineColor: 0xc41c00
                        });
                    }
                }
            }
        });
    });
}

function updateTargetMonsterKey(scene, attackName) {
    Object.values(scene.monsters).forEach(monster => {
        if (monster && monster.sprite) {
            scene.postFxPlugin.remove(monster.sprite);
        }
    });

    if (scene.lastClickedMonsterKey) {
        const clickedMonster = scene.monsters[scene.lastClickedMonsterKey];
        if (clickedMonster && scene.isMonsterAttackable(clickedMonster, attackName)) {
            if (scene.lastClickedMonsterKey && scene.monsters[scene.lastClickedMonsterKey]) {
                scene.postFxPlugin.remove(scene.monsters[scene.lastClickedMonsterKey].sprite);
            }
            scene.lastClickedMonsterKey = clickedMonster.key;
            scene.postFxPlugin.add(clickedMonster.sprite, {
                thickness: 3,
                outlineColor: 0xc41c00
            });

            scene.targetMonsterKey = scene.lastClickedMonsterKey;
            return;
        }
    }

    if (scene.targetMonsterKey === null) {
        for (const [key, monster] of Object.entries(scene.monsters)) {
            if (scene.isMonsterAttackable(monster, attackName)) {
                if (scene.lastClickedMonsterKey && scene.monsters[scene.lastClickedMonsterKey]) {
                    scene.postFxPlugin.remove(scene.monsters[scene.lastClickedMonsterKey].sprite);
                }
                scene.lastClickedMonsterKey = key;
                scene.postFxPlugin.add(monster.sprite, {
                    thickness: 3,
                    outlineColor: 0xc41c00
                });

                scene.targetMonsterKey = key;
                break;
            }
        }
    }
}

export function updateHealthBar(scene, healthBar, currentHealth, maxHealth) {
    const hue = Phaser.Math.Clamp((currentHealth / maxHealth) * 120, 0, 120);
    const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.8, 0.5).color;
    const healthProgress = Math.max(0, currentHealth / maxHealth);
    const targetWidth = 80 * healthProgress;

    if (healthBar.fill) {
        healthBar.fill.setFillStyle(color);
        scene.tweens.add({
            targets: healthBar.fill,
            displayWidth: targetWidth,
            duration: 100,
            ease: 'Sine.easeInOut'
        });
    } else {
        console.error("The healthBar object does not have a fill property.");
    }
}