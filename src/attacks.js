export function unlockedAttacksForLevel(level) {
    const attacks = [
        { name: 'scratch', level: 1, attack: 1 },
        { name: 'bite', level: 3, attack: 2 }, 
        { name: 'horsekick', level: 5, attack: 3 },
        { name: 'tailwhip', level: 7, attack: 4 },
        { name: 'roll', level: 10, attack: 5 }
    ];
 
    return attacks.filter(attack => level >= attack.level);
}
