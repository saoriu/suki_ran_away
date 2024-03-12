export const PlayerState = {
    userid: '',
    skin: 'default',
    days: 0,
    energy: 100,
    speed: 3,
    skills: {
        dancing: { level: 5, xp: 0, totalXP: 0 },
        gathering: { level: 1, xp: 0, totalXP: 0 },
    },
    lastDamageTime: Date.now(),
    equipment: {
        collar: {
            equipmentName: null,
        }
    },
    isDead: false,
    isUnderAttack: false,
    isEating: false,
    isHurt: false,
    JustAte: false,
    justEquipped: false,
    isNearFire: false,
    isMenuOpen: false,
    isAttacking: false,
    collidingWithTree: false,
    isBeingKnockedBack: false,
    attackBonus: 0, //rare attack moves boost
    luckBonus: 0, //chance to get a rare item from a monster
    defenceBonus: 0, //chance to lower monster damage
    treesBonus: 0, //chance to get more wood
    fishBonus: 0, //chance to get more fish
    bushBonus: 0, //chance to get more berries
    foodBonus: 0, //food extra heal rate
    tree: [],
    trees: [],
    fire: [],
    fires: [],
    ponds: [],
    pond: [],
    bush1s: [],
    bush1: [],
    lastEnergyUpdate: Date.now(),
    selectedAttacks: ['scratch'],
    inventory: [],
    gameTime: 9,
};
// In playerState.js
export function setLevel(newLevel) {
    level = newLevel;
}


export let level = PlayerState.skills.dancing.level;

export function xpRequiredForLevel(level) {
    return Math.floor(level + 300 * Math.pow(2, level / 7));
}

export function updatePlayerLevel(skills) {
    return Object.values(skills).reduce((sum, skill) => sum + skill.level, 0);
}

export function addXpToSkill(skillName, xpToAdd) {
    const skill = PlayerState.skills[skillName];
    if (!skill) return;


    skill.xp += xpToAdd; 
    skill.totalXP += xpToAdd; 

    while (skill.xp >= xpRequiredForLevel(skill.level)) {
        skill.xp -= xpRequiredForLevel(skill.level); 
        skill.level++; 
    
        if (typeof window !== 'undefined' && window.game) {
            window.game.events.emit('levelUp', skillName);
        }
    }    

    if (typeof window !== 'undefined' && window.game) {
        window.game.events.emit('updateSkillsDisplay');
    }

    level = updatePlayerLevel(PlayerState.skills);
}


export function getSkillXP(skillName) {
    const skill = PlayerState.skills[skillName];
    return skill ? skill.xp : 0;
}

export function getSkillLevel(skillName) {
    const skill = PlayerState.skills[skillName];
    return skill ? skill.level : 1;
}

export function getTotalSkillXP(skillName) {
    const skill = PlayerState.skills[skillName];
    return skill ? skill.totalXP : 0;
}

export default PlayerState;
