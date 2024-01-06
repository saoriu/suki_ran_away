export const skills = {
    dancing: { level: 10, xp: 0, totalXP: 0 },
    gathering: { level: 1, xp: 0, totalXP: 0 },
};

export const PlayerState = {
    level: skills.dancing.level,
    days: 0,
    energy: 100,
    speed: 3,
    skills: skills,
    lastDamageTime: Date.now(),
    isDead: false,
    isUnderAttack: false,
    attackRange: 1,
    energyBonus: 0, //energy regeneration boost
    danceBonus: 0, //rare dance moves boost
    createBonus: 0, //save an item from being destroyed during creation
    luckBonus: 0, //chance to get a rare item from a monster
    eventsBonus: 0, //chance to get an event
    weakenBonus: 0, //chance to lower monster level
    lastEnergyUpdate: Date.now(),
    selectedAttacks: ['scratch'],
};

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

    PlayerState.level = updatePlayerLevel(PlayerState.skills);
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
