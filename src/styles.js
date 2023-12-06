// styles.js
import { GAME_CONFIG } from './gameConstants';

export const gameStyles = {
  game: {
    width: 720  + 'px', 
    height: (GAME_CONFIG.CAMERA_HEIGHT + GAME_CONFIG.UI_HEIGHT) + 'px', // Include UI height in total
    position: 'relative',
    fontFamily: 'bitcount-mono-single-square',
  },
  frameContainer: {
position: 'relative',
  }
};


export const textStyles = {
    playerLevelText: { fontWeight:'800', fontSize: '18px', fill: '#000000', fontFamily: 'bitcount-mono-single-square' },
    monsterLevelText: { fontWeight:'500', fontSize: '20px', fill: '#ffffff', fontFamily: 'bitcount-mono-single-square' },
    energyText: { fontFamily: 'bitcount-mono-single-square', fontWeight: 'bolder', fill: '#ffffff' },
    quantity: { fontSize: '16px', fill: '#000', fontFamily: 'bitcount-mono-single-square' },
    battleUI: {
      fontSize: '15px',
      color: '#ffffff',
      fontWeight: 'bold',
      backgroundColor: '#000000',
    }
  };
  
