export const skills = {
    dancing: { level: 1, xp: 0 },
    gathering: { level: 1, xp: 0 },
};

export const PlayerState = {
    level: skills.dancing.level + skills.gathering.level,
    energy: 100,
    skills: skills,
    energyBonus: 0,
    danceBonus: 0,
    gatherBonus: 0,
    luckBonus: 0,
    eventsBonus: 0,
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

    skill.xp += xpToAdd; // Add the XP to the specified skill
    
    while (skill.xp >= xpRequiredForLevel(skill.level)) {
        skill.xp -= xpRequiredForLevel(skill.level); // Subtract the XP required for level up
        skill.level++; // Level up the skill
    }
    
    PlayerState.level = updatePlayerLevel(PlayerState.skills); // Update the overall player level
}


export default PlayerState;
