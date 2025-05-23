export const eventOptions = [
  {
    event: 'monster1',
    description: 'A cute lil creature.',
    specialEvent: false,
    monster: 'bunny',
    atlas: 'monsters',
    isAggressive: false,
    attackSpeed: 600,
    attackRange: 0.455,
    level: 2,
    damage: 2,
    speed: 3.2,
    monsterMass: 15,
    possibleOutcomes: {
      common: ['Cotton', 'Pebble'],
      rare: ['Apple', 'Lemon'],
      ultrarare: ['Cotton']},
    skill: 'attacking',
    monsterChance: 'common'
  },
  {
    event: 'monster3',
    description: 'Cute but fierce.',
    specialEvent: false,
    monster: 'panda',
    atlas: 'monsters',
    attackRange: 0.38,
    isAggressive: false,
    level: 5,
    speed: 2.7,
    damage: 5,
    attackSpeed: 500,
    monsterMass: 25,
    possibleOutcomes: {
      common: ['Cotton', 'Silk'],
      rare: ['Gold', 'Emerald'],
      ultrarare: ['Ruby']
    },
    skill: 'attacking',
    monsterChance: 'rare'
  },
  {
    event: 'monster7',
    specialEvent: false,
    description: 'Cute but nasty.',
    monster: 'raccoon',
    atlas: 'monsters',
    attackRange: 0.32,
    attackSpeed: 700,
    isAggressive: true,
    level: 5,
    speed: 2.9,
    damage: 4,
    monsterMass: 16,
    possibleOutcomes: {
      common: ['Pebble', 'Flour', 'Lemon'],
      rare: ['Gold', 'Silk'],
      ultrarare: ['Emerald']
    },
    skill: 'attacking',
    monsterChance: 'rare'
  },
  {
    event: 'monster4',
    description: 'A very interestinig creature, wonder what it drops.',
    monster: 'dragonfly',
    attackRange: 0.30,
    atlas: 'monsters',
    specialEvent: false,
    isAggressive: true,
    attackSpeed: 700,
    level: 10,
    damage: 7,
    monsterMass: 13,
    specialEventBush: true,
    speed: 3.4,
    possibleOutcomes: {
      common: ['Silk', 'Emerald'],
      rare: ['Diamond'],
      ultrarare: ['Thread']
    },
    skill: 'attacking',
    monsterChance: 'common'
  },
  {
    event: 'monster4',
    description: 'An exceptional creature, wonder what it drops.',
    monster: 'pinkfly',
    atlas: 'pinkfly',
    attackRange: 0.30,
    attackSpeed: 700,
    specialEvent: false,
    isAggressive: true,
    level: 17,
    damage: 12,
    monsterMass: 13,
    specialEventBush: true,
    speed: 3.45,
    possibleOutcomes: {
      common: ['Emerald', 'Ruby'],
      rare: ['Diamond'],
      ultrarare: ['Thread']
    },
    skill: 'attacking',
    monsterChance: 'ultrarare'
  },
  {
    event: 'monster5',
    specialEvent: false,
    monster: 'chicken',
    atlas: 'monsters',
    attackRange: 0.35,
    description: 'She may have something useful.',
    level: 2,
    isAggressive: false,
    monsterMass: 15,
    damage: 1,
    attackSpeed: 600,
    speed: 2.9,
    possibleOutcomes: {
      common: ['Egg', 'Flour'],
      rare: ['Pebble'],
      ultrarare: ['Pebble']
    },
    skill: 'attacking',
    monsterChance: 'common'
  },
  {
    event: 'monster6',
    monster: 'turtle',
    atlas: 'monsters',
    specialEvent: false,
    attackRange: 0.30,
    description: 'Its a hard life.',
    damage: 0,
    level: 15,
    speed: 1.95,
    attackSpeed: 800,
    isAggressive: false,
    monsterMass: 35,
    possibleOutcomes: {
      common: ['Milk', 'Pebble'],
      rare: ['Lemon'],
      ultrarare: ['Emerald']
    },
    skill: 'attacking',
    monsterChance: 'rare'
  },
  {
    event: 'monster8',
    monster: 'fox',
    atlas: 'monsters',
    attackRange: 0.325,
    specialEvent: false,
    isAggressive: true,
    attackSpeed: 700,
    description: 'A shiny coat and a sharp bite.',
    damage: 8,
    level: 20,
    speed: 3.2,
    monsterMass: 22,
    possibleOutcomes: {
      common: ['Bone', 'Lemon'],
      rare: ['Ruby', 'Gold'],
      ultrarare: ['Thread']
    },
    skill: 'attacking',
    monsterChance: 'ultrarare'
  },
  {
    event: 'monster9',
    monster: 'falcon',
    atlas: 'treemonsters',
    attackRange: 0.35,
    attackSpeed: 600,
    isAggressive: true,
    description: 'Sharp talons and a sharp bite.',
    damage: 6,
    level: 15,
    speed: 3.5,
    monsterMass: 17,
    possibleOutcomes: {
      common: ['Bone', 'Egg'],
      rare: ['Gold'],
      ultrarare: ['Gold']
    },
    skill: 'attacking',
    specialEvent: true,
    monsterChance: 'common'
  },
  {
    event: 'monster10',
    monster: 'parrot',
    attackRange: 0.35,
    atlas: 'treemonsters',
    attackSpeed: 600,
    isAggressive: true,
    description: 'Beautiful and deadly.',
    damage: 10,
    level: 40,
    speed: 3.45,
    monsterMass: 17,
    possibleOutcomes: {
      common: ['Egg'],
      rare: ['Ruby', 'Gold', 'Emerald'],
      ultrarare: ['Thread']
    },
    skill: 'attacking',
    specialEvent: true,
    monsterChance: 'ultrarare'
  },
].map(option => {
  const variation = 2; // Define the maximum increase in level
  const maxLevel = option.level + variation;
  const randomLevel = Math.floor(Math.random() * (maxLevel - option.level + 1)) + option.level;
  return { ...option, level: randomLevel };
});