import { PlayerState } from './playerState.js';

export function handlePlayerMovement(scene, delta) {
    if (PlayerState.isDead) {
        scene.cat.setVelocity(0, 0);
        return;
    }

    let velocityX = 0, velocityY = 0;

    const speedScale = delta / 8; // Adjust the divisor as needed

    if (!PlayerState.isMenuOpen) {

        if (scene.cursors.left.isDown && scene.cursors.up.isDown) {
            // Handle up-left diagonal movement
            velocityX = -scene.diagonalVelocity * speedScale;
            velocityY = -scene.diagonalVelocity * speedScale;
            if (!scene.isDashing && !PlayerState.isEating) {
                scene.lastDirection = 'upLeft';
            }
        } else if (scene.cursors.right.isDown && scene.cursors.up.isDown) {
            // Handle up-right diagonal movement
            velocityX = scene.diagonalVelocity * speedScale;
            velocityY = -scene.diagonalVelocity * speedScale;
            if (!scene.isDashing && !PlayerState.isEating) {
                scene.lastDirection = 'upRight';
            }
        } else if (scene.cursors.left.isDown && scene.cursors.down.isDown) {
            // Handle down-left diagonal movement
            velocityX = -scene.diagonalVelocity * speedScale;
            velocityY = scene.diagonalVelocity * speedScale;
            if (!scene.isDashing && !PlayerState.isEating) {
                scene.lastDirection = 'downLeft';
            }
        } else if (scene.cursors.right.isDown && scene.cursors.down.isDown) {
            // Handle down-right diagonal movement
            velocityX = scene.diagonalVelocity * speedScale;
            velocityY = scene.diagonalVelocity * speedScale;
            if (!scene.isDashing && !PlayerState.isEating) {
                scene.lastDirection = 'downRight';
            }
        } else if (scene.cursors.left.isDown) {
            // Handle left movement
            velocityX = -PlayerState.speed * speedScale;
            if (!scene.isDashing && !PlayerState.isEating) {
                scene.lastDirection = 'left';
            }
        } else if (scene.cursors.right.isDown) {
            // Handle right movement
            velocityX = PlayerState.speed * speedScale;
            if (!scene.isDashing && !PlayerState.isEating) {
                scene.lastDirection = 'right';
            }
        } else if (scene.cursors.up.isDown) {
            // Handle up movement
            velocityY = -PlayerState.speed * speedScale;
            if (!scene.isDashing && !PlayerState.isEating) {
                scene.lastDirection = 'up';
            }
        } else if (scene.cursors.down.isDown) {
            // Handle down movement
            velocityY = PlayerState.speed * speedScale;
            if (!scene.isDashing && !PlayerState.isEating) {
                scene.lastDirection = 'down';
            }
        }
    }

    if (PlayerState.isAttacking && !scene.isDashing) {
        const attackSpeedReductionFactor = 0.3;
        velocityX *= attackSpeedReductionFactor;
        velocityY *= attackSpeedReductionFactor;
    }

    if (PlayerState.isEating) {
        const attackSpeedReductionFactor = 0.3;
        velocityX *= attackSpeedReductionFactor;
        velocityY *= attackSpeedReductionFactor;
    }

    if (scene.isDashing) {
        const dashSpeedIncreaseFactor = 1.5;
        velocityX *= dashSpeedIncreaseFactor;
        velocityY *= dashSpeedIncreaseFactor;
    }

    scene.cat.setVelocity(velocityX, velocityY);

    if (scene.collar) {
        if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
            scene.collar.x = scene.cat.x;
            scene.collar.y = scene.cat.y;
            if (PlayerState.equipment.collar.light) {
                scene.collar.light.x = scene.cat.x;
                scene.collar.light.y = scene.cat.y;
            }
        }
    }

    handlePlayerAnimations(scene, scene.lastDirection, velocityX, velocityY, scene.attackAnimationKey, scene.cat, scene.isDashing, scene.collar, scene.allEntities, scene.collarParams, scene.currentCollarName, scene.lights);
}

export function handlePlayerAnimations(scene, lastDirection, velocityX, velocityY, attackAnimationKey, cat, isDashing, collar, allEntities, collarParams, currentCollarName, lights) {
    if (PlayerState.isDead) {
        return;
    }

    if (scene.isDashing && !PlayerState.isEating) { 
        switch (scene.lastDirection) {
            case 'up':
                scene.attackAnimationKey = 'attack5-back';
                if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                }
                break;
            case 'down':
                scene.attackAnimationKey = 'attack5-front';
                if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                }
                break;
            case 'left':
            case 'right':
            case 'upLeft':
            case 'upRight':
            case 'downLeft':
            case 'downRight':
                scene.attackAnimationKey = 'attack5';
                if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                }
                break;
            default:
                scene.attackAnimationKey = 'attack5';
                if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                }
                break;
        }
        scene.cat.play(scene.attackAnimationKey, true);
        checkCollarAnims(scene, attackAnimationKey, collar, lastDirection, allEntities, collarParams, currentCollarName, lights);
        scene.cat.on('animationcomplete', () => {
            scene.isDashing = false;
        }, scene);
        return;
    }

    if (PlayerState.isHurt) {
        scene.cat.setTint(0xffffff);

        let flash = setInterval(() => {
            scene.cat.alpha = scene.cat.alpha === 1 ? 0.5 : 1;
        }, 100);

        setTimeout(() => {
            scene.cat.clearTint();
            PlayerState.isHurt = false;

            clearInterval(flash);
            scene.cat.alpha = 1;
        }, 200);
    }

    if (PlayerState.isAttacking && !PlayerState.isEating) {
        const shouldFlip = (scene.lastDirection === 'left' || scene.lastDirection === 'upLeft' || scene.lastDirection === 'downLeft');
        if (scene.cat.flipX !== shouldFlip) {
            scene.cat.flipX = shouldFlip;
            if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                scene.collar.flipX = shouldFlip;
            }
        }
        return;
    }

    if (PlayerState.isEating) {            
        let eatAnimationKey;

        switch (scene.lastDirection) {
            case 'up':
                eatAnimationKey = 'eat-back';
                if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                }
                scene.lastDirection = 'up';
                break;
            case 'down':
                eatAnimationKey = 'eat-front';
                if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                }
                scene.lastDirection = 'down';
                break;
            case 'left':
            case 'upLeft':
            case 'downLeft':
                eatAnimationKey = 'eat';
                if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                }
                scene.lastDirection = 'left';
                break;
            case 'upRight':
            case 'right':
            case 'downRight':
                eatAnimationKey = 'eat';
                if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                }
                scene.lastDirection = 'right';
                break;
            default:
                eatAnimationKey = 'eat';
                if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
                }
                break;
        }

        scene.cat.play(eatAnimationKey, true);
    
        checkCollarAnims(scene, eatAnimationKey, collar, lastDirection, allEntities, collarParams, currentCollarName, lights);

        scene.cat.once('animationcomplete-' + eatAnimationKey, () => {
            PlayerState.isEating = false;
        });

        return;
    }

    if (velocityX === 0 && velocityY === 0 && !PlayerState.isAttacking && !PlayerState.isEating) {
        let catAnimationKey;
        switch (scene.lastDirection) {
            case 'up':
                catAnimationKey = 'sit-back';
                break;
            case 'down':
                catAnimationKey = 'sit-forward';
                break;
            default:
                catAnimationKey = 'sit';
                break;
        }
    
        scene.cat.play(catAnimationKey, true);
        checkCollarAnims(scene, catAnimationKey, collar, lastDirection, allEntities, collarParams, currentCollarName, lights);
    } else {
        if (scene.lastDirection === 'left') {
            cat.play('run', true);
            cat.flipX = true;
            checkCollarAnims(scene, 'run', collar, lastDirection, allEntities, collarParams, currentCollarName, lights);
        } else if (scene.lastDirection === 'right') {
            cat.play('run', true);
            cat.flipX = false;
            checkCollarAnims(scene, 'run', collar, lastDirection, allEntities, collarParams, currentCollarName, lights);
        } else if (scene.lastDirection === 'up') {
            cat.play('up', true);
            checkCollarAnims(scene, 'up', collar, lastDirection, allEntities, collarParams, currentCollarName, lights);
        } else if (scene.lastDirection === 'down') {
            cat.play('down', true);
            checkCollarAnims(scene, 'down', collar, lastDirection, allEntities, collarParams, currentCollarName, lights);
        } else if (scene.lastDirection === 'upLeft') {
            cat.play('run-diagonal-back', true);
            cat.flipX = true;
            checkCollarAnims(scene, 'run-diagonal-back', collar, lastDirection, allEntities, collarParams, currentCollarName, lights);
        } else if (scene.lastDirection === 'upRight') {
            cat.play('run-diagonal-back', true);
            cat.flipX = false;
            checkCollarAnims(scene, 'run-diagonal-back', collar, lastDirection, allEntities, collarParams, currentCollarName, lights);
        } else if (scene.lastDirection === 'downLeft') {
            cat.play('run-diagonal-front', true);
            cat.flipX = true;
            checkCollarAnims(scene, 'run-diagonal-front', collar, lastDirection, allEntities, collarParams, currentCollarName, lights);
        } else if (scene.lastDirection === 'downRight') {
            cat.play('run-diagonal-front', true);
            cat.flipX = false;
            checkCollarAnims(scene, 'run-diagonal-front', collar, lastDirection, allEntities, collarParams, currentCollarName, lights);
        }
    }
}

export function checkCollarAnims(scene, catAnimationKey, collar, lastDirection, allEntities, collarParams, currentCollarName, lights) {
    if (PlayerState.equipment.collar && PlayerState.equipment.collar.equipmentName !== null) {
        if (!collar || (collar && currentCollarName !== PlayerState.equipment.collar.itemName)) {
            if (collar) {
                allEntities = allEntities.filter(entity => entity !== collar);
                lights.removeLight(collar.light);
                collar.destroy();
            }

            collar = scene.add.sprite(scene.cat.x, scene.cat.y, PlayerState.equipment.collar.itemName)
                .setScale(1)
            collar.setPipeline('Light2D');
            currentCollarName = PlayerState.equipment.collar.itemName;
            collar.label = collarParams.label;
            if (PlayerState.equipment.collar.light) {
                collar.light = lights.addLight(scene.cat.x, scene.cat.y, PlayerState.equipment.collar.lightRadius).setColor(0xFF4500).setIntensity(PlayerState.equipment.collar.lightIntensity);
            }

            allEntities.push(collar);
            scene.cat.stop();
            scene.cat.play(catAnimationKey, true);
        }

        if (scene.cat.anims.currentAnim) {
            let currentCatAnimation = scene.cat.anims.currentAnim.key.replace(/-/g, '_');
            let collarAnimation = PlayerState.equipment.collar.equipmentName + '_' + currentCatAnimation;
            collar.play(collarAnimation, true, scene.cat.anims.currentFrame.frameNumber);

            collar.flipX = (lastDirection === 'left' || lastDirection === 'upLeft' || lastDirection === 'downLeft');
            scene.cat.flipX = (lastDirection === 'left' || lastDirection === 'upLeft' || lastDirection === 'downLeft');
        }

    } else {
        if (collar) {
            allEntities = allEntities.filter(entity => entity !== collar);
            lights.removeLight(collar.light);
            collar.destroy();
            collar = null;
        }
        scene.cat.flipX = (lastDirection === 'left' || lastDirection === 'upLeft' || lastDirection === 'downLeft');
    }
}