export const eventOptions = [
  {
    event: 'monster1',
    description: 'A cute lil creature.',
    monster: 'bunny',
    attackRange: 0.25,
    level: 2,
    damage: 2,
    speed: 2.7,
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
    event: 'monster3',
    description: 'Cute but fierce.',
    monster: 'panda',
    attackRange: 0.25,
    level: 5,
    speed: 2.2,
    damage: 8,
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
    event: 'monster7',
    description: 'Cute but nasty.',
    monster: 'raccoon',
    attackRange: 0.25,
    level: 5,
    speed: 2.4,
    damage: 5,
    monsterMass: 2,
    possibleOutcomes: {
      common: ['Gold', 'Ruby'],
      rare: ['Diamond', 'Emerald'],
      ultrarare: ['Silk']
    },
    skill: 'dancing',
    monsterChance: 'common'
  },
  {
    event: 'monster4',
    description: 'A very interestinig creature, wonder what it drops.',
    monster: 'dragonfly',
    attackRange: 0.25,
    level: 10,
    damage: 15,
    monsterMass: 0.2,
    speed: 2.9,
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
    attackRange: 0.25,
    description: 'She may have something useful.',
    level: 2,
    monsterMass: 0.8,
    damage: 1,
    speed: 2.4,
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
    monster: 'turtle',
    attackRange: 0.25,
    description: 'Its a hard life.',
    damage: 0,
    level: 15,
    speed: 1.45,
    monsterMass: 2.5,
    possibleOutcomes: {
      common: ['Milk', 'Egg', 'Flour'],
      rare: ['Ruby', 'Gold'],
      ultrarare: ['Silk']
    },
    skill: 'dancing',
    monsterChance: 'common'
  },
  {
    event: 'monster8',
    monster: 'fox',
    attackRange: 0.25,
    description: 'A shiny coat and a sharp bite.',
    damage: 20,
    level: 20,
    speed: 2.7,
    monsterMass: 2.1,
    possibleOutcomes: {
      common: ['Milk', 'Egg', 'Flour'],
      rare: ['Ruby', 'Gold'],
      ultrarare: ['Silk']
    },
    skill: 'dancing',
    monsterChance: 'common'
  },
].map(option => {
  const variation = 2; // Define the maximum increase in level
  const maxLevel = option.level + variation;
  const randomLevel = Math.floor(Math.random() * (maxLevel - option.level + 1)) + option.level;
  return { ...option, level: randomLevel };
});