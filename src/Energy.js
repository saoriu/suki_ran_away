import { PlayerState } from './playerState';
import { GameEvents } from './GameEvents'; // Make sure the path is correct


// Function to calculate energy cost
export function calculateEnergyCost(monsterLevel) {
  const danceLevel = PlayerState.skills.dancing.level;
  const eventEnergyCost = monsterLevel * (1 - (danceLevel / 300)); 
  return Math.max(eventEnergyCost, 0); 
}

export function regenerateEnergy(scene) {
  if (GameEvents.currentInstance && GameEvents.currentInstance.isEventTriggered) return;
  const now = Date.now();
  const elapsedSeconds = (now - PlayerState.lastEnergyUpdate) / 1000;

  PlayerState.energy = Math.min(PlayerState.energy + elapsedSeconds, 100); // Cap energy at 100

  PlayerState.lastEnergyUpdate = now;

  if (scene && scene.game) {
      scene.game.events.emit('energyChanged');
  }
}




// Optionally, you can set up an interval to regenerate energy every second, 
// or call regenerateEnergy() method in your game loop.
