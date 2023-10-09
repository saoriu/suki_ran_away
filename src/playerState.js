export const skills = {
    dancing: { level: 1, xp: 0, totalXP: 0 },
    creation: { level: 1, xp: 0, totalXP: 0 },
};

export const PlayerState = {
    level: skills.dancing.level + skills.gathering.level,
    energy: 100,
    skills: skills,
    energyBonus: 0, //energy regeneration boost
    danceBonus: 0, //rare dance moves boost
    createBonus: 0, //save an item from being destroyed during creation
    luckBonus: 0, //chance to get a rare item from a monster
    eventsBonus: 0, //chance to get an event
    speedBonus: 0, //chance to perform dance move first
    lastEnergyUpdate: Date.now(),
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

    console.log(`Adding ${xpToAdd} XP to ${skillName}`);

    skill.xp += xpToAdd; 
    skill.totalXP += xpToAdd; 

    while (skill.xp >= xpRequiredForLevel(skill.level)) {
        console.log(`Leveling up ${skillName} to level ${skill.level + 1}`);
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
