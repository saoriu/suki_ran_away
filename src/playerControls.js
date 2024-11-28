import { PlayerState } from './playerState';
import { handlePlayerAttack } from './playerAttacks';
import { checkCollarAnims } from './playerMovement';

export function setupPlayerControls(scene) {
    scene.input.keyboard.on('keydown-SPACE', () => {
        if (scene.collidingWithTree && scene.canAttack) {
            scene.chopTree(scene.collidingTree);
        }
        if (scene.collidingBush && scene.canAttack) {
            scene.searchBush(scene.collidingBush);
        }
    });

    scene.input.keyboard.on('keydown', (event) => {
        handlePlayerAttack(scene, event);
    });

    let lastPressTime = 0;
    let lastDashTime = 0;
    const doubleTapThreshold = 300;
    const dashThreshold = 800; // 300 ms

    scene.input.keyboard.on('keydown-SPACE', () => {
        console.log('SPACE key pressed');
        let currentTime = new Date().getTime();
        if (currentTime - lastPressTime < doubleTapThreshold && (scene.cat.body.velocity.x !== 0 || scene.cat.body.velocity.y !== 0)) {
            console.log('Double tap detected');
            if (currentTime - lastDashTime > dashThreshold) {
                scene.isDashing = true;
                console.log('Dashing from playerControls.js');
                lastDashTime = currentTime; // update last dash time

                let attackName = 'roll';

                scene.updateTargetMonsterKey(attackName);

                scene.gameEvents.playerAttack(scene.monsters, scene.targetMonsterKey, attackName);
                PlayerState.isAttacking = true;
                scene.canAttack = false;
            }
        }
        lastPressTime = currentTime;
    });

    scene.input.on('pointerdown', (pointer) => {
        Object.values(scene.monsters).forEach(monster => {
            if (monster && monster.sprite && monster.sprite.active) {
                const monsterBody = monster.sprite.body;
                if (monsterBody && scene.Matter.Bounds.contains(monsterBody.bounds, { x: pointer.worldX, y: pointer.worldY })) {
                    // Clear tint from previously clicked monster
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

    scene.cat.on('animationcomplete', (animation, frame) => {
        if (animation.key === scene.attackAnimationKey) {
            PlayerState.isAttacking = false;
            scene.canAttack = true;
        }
    }, scene);

    // Handle movement keys
    scene.input.keyboard.on('keydown', (event) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                scene.cat.setVelocityY(-PlayerState.speed);
                scene.lastDirection = 'up';
                break;
            case 'ArrowDown':
            case 'KeyS':
                scene.cat.setVelocityY(PlayerState.speed);
                scene.lastDirection = 'down';
                break;
            case 'ArrowLeft':
            case 'KeyA':
                scene.cat.setVelocityX(-PlayerState.speed);
                scene.lastDirection = 'left';
                break;
            case 'ArrowRight':
            case 'KeyD':
                scene.cat.setVelocityX(PlayerState.speed);
                scene.lastDirection = 'right';
                break;
        }
    });

    scene.input.keyboard.on('keyup', (event) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
            case 'ArrowDown':
            case 'KeyS':
                scene.cat.setVelocityY(0);
                break;
            case 'ArrowLeft':
            case 'KeyA':
            case 'ArrowRight':
            case 'KeyD':
                scene.cat.setVelocityX(0);
                break;
        }
    });
}