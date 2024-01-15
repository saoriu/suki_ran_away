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
    keys: {
      fontFamily: 'Ninja',
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: '16px',
      fill: '#000000',
    },
    playerBonus: { fontFamily: 'Ninja', fontWeight: '400', fontStyle: 'normal', fontSize: '22px', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 4 },
    playerLevelText: { fontWeight:'800', fontSize: '22px', fill: '#ffffff', fontFamily: 'Ninja', }, 
    playerLevelText2: { fontWeight:'800', fontSize: '22px', fill: '#ffffff', fontFamily: 'Ninja', stroke: '#000000', strokeThickness: 2 }, 
    monsterLevelText: { fontWeight:'500', fontSize: '20px', fill: '#ffffff', fontFamily: 'bitcount-mono-single-square' },
    energyText: { fontFamily: 'Ninja'    , fontWeight: 'bolder', fill: '#281800', fontSize: '21px' },
    daysPassed: { fontFamily: 'Ninja', fontWeight:'800', fill: 'gold', fontSize: '25px', stroke: '#00000', strokeThickness: 5 },
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
  
