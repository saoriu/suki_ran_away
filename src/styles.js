// styles.js
import { GAME_CONFIG } from './gameConstants';

export const gameStyles = {
  game: {
    width: GAME_CONFIG.CAMERA_WIDTH  + 'px', 
    height: (GAME_CONFIG.CAMERA_HEIGHT + GAME_CONFIG.UI_HEIGHT) + 'px', // Include UI height in total
    position: 'relative',
  },
  frameContainer: {
position: 'relative',
  }
};

export const textStyles = {
    attacks: { 
      fontFamily: 'redonda-condensed, sans-serif', 
      fontWeight: '400', 
      fontStyle: 'normal',
      fontSize: '16px', 
      fill: '#ffffff'
    },    
    playerLevelText: { fontWeight:'800', fontSize: '24px', fill: '#ffffff', fontFamily: 'puffin-arcade-regular', stroke: '#000000', strokeThickness: 5 }, 
    monsterLevelText: { fontWeight:'500', fontSize: '20px', fill: '#ffffff', fontFamily: 'bitcount-mono-single-square' },
    energyText: { fontFamily: 'puffin-arcade-regular'    , fontWeight: 'bolder', fill: '#ffffff', fontSize: '20px', stroke: '#000000', strokeThickness: 5 },
    daysPassed: { fontFamily: 'puffin-arcade-regular', fontWeight:'800', fill: '#ffffff', fontSize: '16px', stroke: '#000000', strokeThickness: 3 },
    quantity: { fontSize: '17px', fill: '#000', fontFamily: 'bitcount-mono-single-square', fontWeight: '700' },
    battleUI: {
      fontSize: '25px',
      color: '#ffffff',
      fontWeight: 'bold',
      backgroundColor: '#000000',
      fontFamily: 'puffin-arcade-regular'
    },
    tooltip: {
      fontFamily: 'redonda-condensed, sans-serif', 
      fontWeight: '400', 
      fontStyle: 'normal',
      fontSize: '20px', 
      backgroundColor: '#FFFFFF',
      fill: '#000000'
    },
  };
  
