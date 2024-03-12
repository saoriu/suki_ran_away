// styles.js
import { GAME_CONFIG } from './gameConstants';

export const gameStyles = {
  game: {
    width: GAME_CONFIG.CAMERA_WIDTH  + 'px', 
    height: GAME_CONFIG.CAMERA_HEIGHT  + 'px', // Include UI height in total
    position: 'relative',
  },
  frameContainer: {
position: 'relative',
  }
};

export const textStyles = {
    save: { fontFamily: 'Ninja', fontWeight: 'bolder', fill: 'GOLD', fontSize: '40px', stroke: 'BLACK', strokeThickness: 5 },
    levelUpText: { fontFamily: 'Ninja', fontWeight: 'bolder', fill: 'GOLD', fontSize: '35px'},
    saveblock: { fontFamily: 'Ninja', fontWeight: 'bolder', fill: 'red', fontSize: '40px', stroke: 'BLACK', strokeThickness: 5 },
    attacks: { 
      fontFamily: 'Ninja', 
      fontWeight: '400', 
      fontStyle: 'normal',
      fontSize: '16px', 
      fill: '#000000'
    },  
    mainTitle: { color: 'black', fontSize: '25px', fontFamily: 'Ninja', fontWeight: 'bolder' },
    messageText: { fontFamily: 'ManaSeedBody', align: 'right', fontSize: '20px', fill: 'white', stroke: 'black', strokeThickness: 4 },
    mainTitleTwo: { color: 'black', fontSize: '25px', fontFamily: 'Ninja', fontWeight: 'bolder' },
    title: { color: 'black', fontSize: '20px', fontFamily: 'Ninja', fontWeight: 'bolder' },
    titleIngredients: {  color: 'black', fontSize: '18px', fontFamily: 'ManaSeedBody'},
    description: { color: 'black', fontSize: '16px', fontFamily: 'Ninja', fontWeight: 'bolder' },
    other: { color: 'black', fontSize: '16px', fontFamily: 'Ninja', fontWeight: 'bolder' },
    indicator: { color: 'white', fontSize: '12px', fontFamily: 'Ninja', fontWeight: 'bolder', stroke: 'black', strokeThickness: 4 },
    keys: {
      fontFamily: 'Ninja',
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: '16px',
      fill: '#000000',
    },
    fire: {
      fontFamily: 'Ninja',
      fontSize: '20px',
      fill: '#ff4500', // Orange-red color to match the fire
      stroke: '#ff0000', // Red stroke for visibility against the fire
      strokeThickness: 2
    },
    close: {
      fontFamily: 'Ninja',
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: '22px',
      fill: '#000000',
      color: 'black',
      stroke: 'black',
      strokeThickness: 2,
    },
    userid: { fontFamily: 'ManaSeedBody', fontSize: '20px', fill: 'gold', stroke: 'black', strokeThickness: 4 },
    counts: { fontFamily: 'Ninja', fontWeight: '400', fontStyle: 'normal', fontSize: '18px', fill: '#ffffff', stroke: '#000000', strokeThickness: 4 },
    playerBonus: { fontFamily: 'Ninja', fontWeight: '400', fontStyle: 'normal', fontSize: '22px', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 4 },
    playerLevelText: { fontWeight:'800', fontSize: '22px', fill: '#ffffff', fontFamily: 'Ninja', }, 
    playerLevelText2: { fontWeight:'800', fontSize: '22px', fill: '#ffffff', fontFamily: 'Ninja', stroke: '#000000', strokeThickness: 2 }, 
    monsterLevelText: { fontWeight:'500', fontSize: '20px', fill: '#ffffff', fontFamily: 'bitcount-mono-single-square' },
    energyText: { fontFamily: 'Ninja', fontWeight: 'bolder', fill: '#281800', fontSize: '25px' },
    daysPassed: { fontFamily: 'ManaSeedTitleMono', fontWeight:'800', fill: 'gold', fontSize: '10px', stroke: '#00000', strokeThickness: 5 },
    quantity: { fontSize: '17px', fill: '#000', fontFamily: 'bitcount-mono-single-square', fontWeight: '700' },
    battleUI: {
      fontSize: '25px',
      color: '#ffffff',
      fontWeight: 'bold',
      backgroundColor: '#000000',
      fontFamily: 'Ninja'
    },
    tooltip: {
      fontFamily: 'Ninja', 
      fontWeight: '300', 
      fontStyle: 'normal',
      fontSize: '20px', 
      fill: '#000000'
    },
    tooltipdescription: {
      fontFamily: 'Ninja', 
      fontWeight: '300', 
      fontStyle: 'italic',
      fontSize: '20px', 
      fill: '#000000',
      //wordwrap 100:
      wordWrap: { width: 200, useAdvancedWrap: true }
    },
  };
  
