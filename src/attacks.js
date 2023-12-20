export const attacks = {
    scratch: {
      name: 'scratch',
      speed: 12, // animation speed or frames per second
      knockback: 1, // how many tiles the monster is knocked back
      damage: 3, // base damage of the attack
      level: 1, // level required to unlock
      bleed: 1, // passive damage over time
      spread: 1, // number of tiles of monsters it can hit
      rarity: 0.1, // base chance of the attack being rolled
    },
    bite: {
      name: 'bite',
      attack: 2,
      speed: 10,
      knockback: 1,
      damage: 5,
      level: 3,
      bleed: 2,
      spread: 1,
      rarity: 0.08,
    },
    horsekick: {
      name: 'horsekick',
      attack: 3,
      speed: 8,
      knockback: 5,
      damage: 3,
      level: 5,
      bleed: 0,
      spread: 2,
      rarity: 0.05,
    },
    tailwhip: {
      name: 'tailwhip',
      attack: 4,
      speed: 14,
      knockback: 4,
      damage: 4,
      level: 7,
      bleed: 3,
      spread: 1,
      rarity: 0.03,
    },
    roll: {
      name: 'roll',
      attack: 5,
      speed: 16,
      knockback: 3,
      damage: 5,
      level: 10,
      bleed: 4,
      spread: 3,
      rarity: 0.01,
    },
  };
  
  export function unlockedAttacksForLevel(playerLevel) {
    const unlocked = Object.values(attacks).filter(attack => playerLevel >= attack.level);
    if (!unlocked.some(attack => attack.name === 'scratch')) {
        unlocked.unshift(attacks['scratch']);
    }
    return unlocked;
}
