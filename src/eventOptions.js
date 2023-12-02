export const eventOptions = [
  {
    event: 'monster1',
    description: 'A cute lil creature.',
    monster: 'bunny',
    level: 1,
    speed: 2,
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
    monster: 'raccoon',
    level: 2,
    speed: 1,
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
    speed: 1,
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
    monster: 'dragonfly',
    level: 10,
    speed: 3,
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
    monster: 'chicken',
    description: 'She may have something useful.',
    level: 1,
    speed: 1,
    possibleOutcomes: {
      common: ['Milk', 'Egg', 'Flour'],
      rare: ['Ruby', 'Gold'],
      ultrarare: ['Silk']
    },
    skill: 'dancing',
    monsterChance: 'common'
  }
].map(option => {
  const variation = 2; // Define the maximum increase in level
  const maxLevel = option.level + variation;
  const randomLevel = Math.floor(Math.random() * (maxLevel - option.level + 1)) + option.level;
  return { ...option, level: randomLevel };
});