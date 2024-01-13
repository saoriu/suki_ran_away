export const attacks = {
    scratch: {
      name: 'scratch',
      range: 1,
      attack: 1,
      speed: 2, // animation speed or frames per second
      knockback: 1, // how many tiles the monster is knocked back
      damage: 3, // base damage of the attack
      level: 1, // level required to unlock
      bleed: 1, // passive damage over time
      spread: 1, // number of tiles of monsters it can hit
      rarity: 0.1, // base chance of the attack being rolled
    },
    bite: {
      name: 'bite',
      range: 1,
      attack: 2,
      speed: 2,
      knockback: 0.5,
      damage: 5,
      level: 3,
      bleed: 2,
      spread: 1,
      rarity: 0.08,
    },
    horsekick: {
      name: 'horsekick',
      range: 2,
      attack: 3,
      speed: 1.3,
      knockback: 8,
      damage: 3,
      level: 5,
      bleed: 0,
      spread: 2,
      rarity: 0.05,
    },
    tailwhip: {
      name: 'tailwhip',
      range: 2.5,
      attack: 4,
      speed: 1.6,
      knockback: 5,
      damage: 4,
      level: 7,
      bleed: 3,
      spread: 1,
      rarity: 0.03,
    },
    roll: {
      name: 'roll',
      range: 1,
      attack: 5,
      speed: 1.5,
      knockback: 2,
      damage: 7,
      level: 10,
      bleed: 4,
      spread: 3,
      rarity: 0.01,
    },
    hairball: {
      name: 'hairball',
      attack: 6,
      range: 11,
      speed: 1.5,
      knockback: 1,
      damage: 2,
      level: 12,
      bleed: 4,
      spread: 3,
      rarity: 0.01,
    },
  };
  
  export function unlockedAttacksForLevel(playerLevel) {
    const unlocked = Object.values(attacks).filter(attack => playerLevel > attack.level);
    if (!unlocked.some(attack => attack.name === 'scratch')) {
      unlocked.unshift(attacks['scratch']);
    }
    return unlocked;
  }