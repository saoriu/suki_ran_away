import { PlayerState } from './playerState';

export function regenerateEnergy(scene) {
    const now = Date.now();

    // Check if 3 seconds have passed since the last damage
    if (now - PlayerState.lastDamageTime < 1000 || PlayerState.isDead) return; // Do not regenerate if damaged recently

    const elapsedSeconds = (now - PlayerState.lastEnergyUpdate) / 1000;
    PlayerState.energy = Math.min(PlayerState.energy + elapsedSeconds, 100); // Cap energy at 100
    PlayerState.lastEnergyUpdate = now;

    if (scene && scene.game) {
        scene.game.events.emit('energyChanged');
    }
}





// Optionally, you can set up an interval to regenerate energy every second, 
// or call regenerateEnergy() method in your game loop.
