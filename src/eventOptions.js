export const eventOptions = [
  {
    event: 'monster1',
    description: 'A cute lil creature.',
    monster: 'panda',
    level: 1,
    damage: 1,
    speed: 2,
    monsterMass: 1,
    possibleOutcomes: {
      common: ['Cotton', 'Pebble'],
      rare: ['Apple', 'Gold'],
      ultrarare: ['Diamond']
    },
    skill: 'dancing',
    monsterChance: 'common'
  },
  {
    event: 'monster2',
    description: 'A little rascal.',
    monster: 'panda',
    level: 2,
    monsterMass: 1,
    damage: 2,
    speed: 1.8,
    possibleOutcomes: {
      common: ['Lemon', 'Pebble'],
      rare: ['Gold', 'Emerald'],
      ultrarare: ['Ruby']
    },
    skill: 'dancing',
    monsterChance: 'uncommon'
  },
  {
    event: 'monster3',
    description: 'Cute but fierce.',
    monster: 'panda',
    level: 5,
    speed: 1.7,
    damage: 5,
    monsterMass: 2,
    possibleOutcomes: {
      common: ['Gold', 'Ruby'],
      rare: ['Diamond', 'Emerald'],
      ultrarare: ['Silk']
    },
    skill: 'dancing',
    monsterChance: 'rare'
  },
  {
    event: 'monster4',
    description: 'A very interestinig creature, wonder what it drops.',
    monster: 'panda',
    level: 10,
    damage: 10,
    monsterMass: 0.2,
    speed: 2.1,
    possibleOutcomes: {
      common: ['Diamond', 'Thread'],
      rare: ['Gold', 'Silk'],
      ultrarare: ['Silk']
    },
    skill: 'dancing',
    monsterChance: 'ultrarare'
  },
  {
    event: 'monster5',
    monster: 'panda',
    description: 'She may have something useful.',
    level: 1,
    monsterMass: 0.8,
    damage: 1,
    speed: 1.9,
    possibleOutcomes: {
      common: ['Milk', 'Egg', 'Flour'],
      rare: ['Ruby', 'Gold'],
      ultrarare: ['Silk']
    },
    skill: 'dancing',
    monsterChance: 'common'
  },
  {
    event: 'monster6',
    monster: 'panda',
    description: 'Its a hard life.',
    damage: 0,
    level: 15,
    speed: 1,
    monsterMass: 2.5,
    possibleOutcomes: {
      common: ['Milk', 'Egg', 'Flour'],
      rare: ['Ruby', 'Gold'],
      ultrarare: ['Silk']
    },
    skill: 'dancing',
    monsterChance: 'rare'
  }
].map(option => {
  const variation = 2; // Define the maximum increase in level
  const maxLevel = option.level + variation;
  const randomLevel = Math.floor(Math.random() * (maxLevel - option.level + 1)) + option.level;
  return { ...option, level: randomLevel };
});