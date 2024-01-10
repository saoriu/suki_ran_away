# Suki Ran Away by Saori Uchida

## Summary

The game revolves around three fundamental skills for the player's pet: Gathering, Attack, and Creating. To introduce randomness to the game, there is a system called the Random Event System that triggers battle events, gathering events, or no event based on each game tick. Procedural map generation is used, with each tile generated at random, destroying everything outside of the game window.

The Gathering events include peaceful pond, friendly farm, and wild bush. These events can give different food ingredients. The Battle events include monster, demi-boss, and boss. These events can give different types of wearable components. As the days pass, monsters become stronger.

The success of battle and gathering events is contingent upon the pet's respective skill levels. On successful completion, the pet gains experience points and potential outputs.

The outputs from events can be used to create two types of craftable items - consumables and wearables. The creation skill is leveraged to process outputs from events. Using different combinations of food outputs from gathering events can create consumables. Combining wearable component outputs from battling events can create wearables.

As the pet levels up in skill, they unlock new events and outputs. Higher levels in the creation skill allow the pet to craft superior consumables and wearables.

An inventory system is implemented where event outputs are stored in the pet's bag. Wearable items are stored in specific slots. Wearables offer a range of benefits, such as increased chance of specific events or higher quality outputs. Consumables offer temporary boosts to skills or experience gain, influencing the success rate of events.

The game is strategically balanced between the use of consumables and wearables. While wearables modify the chance of events and output quality, consumables can directly impact event success rates. The system allows players to customize their gameplay focus depending on their strategy, whether that's gathering, battling, or collecting specific outputs.

The game's content is continually expanded by introducing new events, consumables, wearables, and skills. The game has a story/lore that revolves around a cat named Suki. She was lost and is journeying through different biomes as she tries to find her way back home. Throughout her journey, she battles different animals and monsters, completes quests, trains her skill, and collects resources.

## Technical Specifications

This is a web-based game that is also available on Steam. It has been developed using Phaser 3 as the game engine and JavaScript as the coding language. React has been used for certain interface and state and effect management. The game's backend uses AWS to store user account details and save data.

### Skills

Implement and refine three fundamental skills for the player's pet:

- Attack
- Gathering (coming soon)
- Creating  (coming soon)

### Events

Introduce a random event system that triggers battle events, gathering events, or no event based on each game tick. It uses procedural map generation, with each tile generated at random, destroying everything outside of the game window.

Gathering events: Peaceful pond (can give any of salmon, tuna, or trout), friendly farm (can give milk, egg, or grains), and wild bush (can give any of three types of berries).

Battle events: Monster (can give any of three types of wearable components of low quality), demi-boss (can give any of three types of wearable components of medium quality), and boss (can give any of three types of high-quality wearable components). The player unlocks new attacks as they progress attack levels, able to choose from the unlocked attacks during gameplay. As days pass, monsters become stronger. Each player can create a new account.

### Skill-Based Outcomes

Ensure the success of battle and gathering events is contingent upon the pet's respective skill levels and the player's strategic use of consumables, wearables, attacks, and terrains. On success, the pet gains experience points and potential outputs (food ingredients or gear components).

### Creating

Leverage the 'creation' skill to process outputs from events into two types of craftable items - consumables and wearables.

Creating consumables: Using different combinations of the food outputs from gathering events can create consumables.

Creating wearables: Combining wearable component outputs from battling events can be used to create wearables.

## Game Progression

### Skill Progression

As the pet levels up in skill, they unlock new events and outputs, adding rewarding progression, depth, and complexity to the gameplay.

### Crafting Progression

Higher levels in the creation skill allow the pet to craft superior consumables and wearables, which in turn can influence the gameplay and player's strategy.

## Inventory Management

### Inventory System

Implement an inventory system where event outputs are stored in the pet's bag. Include specific slots for wearable items.

### Wearables

Design wearables to offer a range of benefits, such as an increased chance of specific events or higher quality outputs. This adds strategic depth to the gameplay.

Luck of the drop: Increase the chance of rare and ultra-rare drops.

Tireless run: Energy restores faster.

Strength: Increased chance of rolling a higher level move.

More to do: Increased chance of any event occurring.

I’m so crafty: Increased chance of not consuming an item when crafting.

### Consumables

Design consumables that offer temporary boosts to skills or experience gain, influencing the success rate of events and adding an additional layer of strategic gameplay.

## Balancing and Optimization

### Strategic Balance

Ensure a strategic balance between the use of consumables and wearables. While wearables modify the chance of events and output quality, consumables can directly impact event success rates.

### Gameplay Focus

Create a system that allows players to customize their gameplay focus depending on their strategy, whether that's gathering, battling, or collecting specific outputs.

## Story/Lore

Suki was a cute, friendly cat that belonged to a cute, friendly girl. One night, Suki fell out the window after seeing something mysterious and was lost. The game is about her going through different biomes as she tries to find her way back home. Throughout her journey, she battles with many different animals and monsters, completes quests, trains her skill, and collects resources.