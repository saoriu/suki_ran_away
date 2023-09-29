import { PlayerState } from './playerState';

// Function to calculate energy cost
function calculateEnergyCost(monsterLevel) {
  const danceLevel = PlayerState.skills.dancing.level;
  const eventEnergyCost = monsterLevel * (2 - (danceLevel / 200));
  return eventEnergyCost;
}

//function to calculate energy lost
export function calculateEnergyLost(monsterLevel) {
  const danceLevel = PlayerState.skills.dancing.level;
  const lostEnergy = monsterLevel * (3 - (danceLevel / 150));
  return lostEnergy;
}

// Update energy based on event outcomes
export function updateEnergyOnEvent(monsterLevel) {
  const energyCost = calculateEnergyCost(monsterLevel);
  const energyLoss = calculateEnergyLost(monsterLevel);
    console.log(`Energy before dance: ${PlayerState.energy}`);
    console.log(`Energy cost: ${energyCost}`);

  
  if (PlayerState.energy < energyCost + energyLoss) {
    console.log(`You need ${energyCost + energyLoss} Energy to do this!`);
    return false; // You can return false here if there isn't enough energy
  }
  
  const newEnergy = PlayerState.energy - energyCost;
  PlayerState.energy = Math.max(newEnergy, 0);
  console.log(`Energy after dance: ${PlayerState.energy}`);
  return true; // You can return true here if energy is successfully deducted
}
export function regenerateEnergy() {
    const now = Date.now();
    const elapsedSeconds = (now - PlayerState.lastEnergyUpdate) / 1000;
    

    PlayerState.energy = Math.min(PlayerState.energy + elapsedSeconds, 100); // Cap energy at 100
    
    PlayerState.lastEnergyUpdate = now;
}



// Optionally, you can set up an interval to regenerate energy every second, 
// or call regenerateEnergy() method in your game loop.
