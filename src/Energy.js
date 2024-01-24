import { PlayerState } from './playerState';

export function regenerateEnergy(scene) {
    const now = Date.now();


    // Check if 3 seconds have passed since the last damage
    if (now - PlayerState.lastDamageTime < 5000 || PlayerState.isDead) 
    

 {   return; // Do not regenerate if damaged recently
    }

    const energyRegenRate = 1 / (60 * 60); // 1 energy unit per minute
    // Regenerate energy at a fixed rate of 1 energy unit per second, times the energy bonus
    PlayerState.energy = Math.min(PlayerState.energy + energyRegenRate, 100); // Cap energy at 100
    PlayerState.lastEnergyUpdate = now;
}





// Optionally, you can set up an interval to regenerate energy every second, 
// or call regenerateEnergy() method in your game loop.
