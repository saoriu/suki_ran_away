import PlayerState from './playerState';

export const attacks = {
    scratch: {
      name: 'scratch',
      range: 0.3,
      attack: 1,
      speed: 2, // animation speed or frames per second
      knockback: 1, // how many tiles the monster is knocked back
      damage: 2, // base damage of the attack
      level: 1, // level required to unlock
      bleed: 1, // passive damage over time
      spread: 1, // number of tiles of monsters it can hit
      rarity: 0.1, // base chance of the attack being rolled
      keyboard: 'spacebar'
    },
    roll: {
      name: 'roll',
      range: 0.4,
      attack: 5,
      speed: 2, 
      knockback: 0.5, 
      damage: 2,
      level: 1, 
      bleed: 1,
      spread: 1, 
      rarity: 0.1, 
      keyboard: 'spacebar x2'
    },
    bite: {
      name: 'bite',
      range: 0.3,
      description: 'A strong close-range attack that can leave a mark.',
      attack: 2,
      speed: 2,
      knockback: 0.5,
      damage: 5,
      level: 6,
      bleed: 2,
      spread: 1,
      rarity: 0.08,
      keyboard: '1'
    },
    horsekick: {
      name: 'horsekick',
      description: 'A powerful kick that can knock back your opponent.',
      range: 0.4,
      attack: 3,
      speed: 1.3,
      knockback: 3,
      damage: 3,
      level: 10,
      bleed: 0,
      spread: 2,
      rarity: 0.05,
      keyboard: '2'
    },
    hairball: {
      name: 'hairball',
      description: 'A hairball that can damage opponents at a distance. Effective, but kinda nasty.',
      attack: 6,
      range: 7,
      speed: 1.5,
      knockback: 0.5,
      damage: 2,
      level: 15,
      bleed: 4,
      spread: 3,
      rarity: 0.01,
      keyboard: '3'
    },
  };
  
export function unlockedAttacksForLevel() {
  const unlocked = Object.values(attacks).filter(attack => attack.name !== 'roll' && PlayerState.skills.dancing.level >= attack.level);
  return unlocked;
}

export function getAttacksForCurrentLevel(level) {
  const unlocked = Object.values(attacks).filter(attack => attack.name !== 'roll' && PlayerState.skills.dancing.level === attack.level);
  return unlocked;
}