// styles.js
import { GAME_CONFIG } from './gameConstants';

export const gameStyles = {
  game: {
    width: 720  + 'px', 
    height: GAME_CONFIG.CAMERA_HEIGHT + 'px',
    position: 'relative',
    left: '40px',
    fontFamily: 'bitcount-mono-single-square',
  },
  frameContainer: {
    width: '800px',
    height: '560px',
    padding: '2px 0 0 0px', // Top Right Bottom Left
    backgroundImage: 'url("/frame-mini3.png")', // Correct path
    backgroundSize: '800px 560px',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'left',
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
  
