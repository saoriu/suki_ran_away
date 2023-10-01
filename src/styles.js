// styles.js
import { GAME_CONFIG } from './gameConstants';

export const gameStyles = {
  game: {
    width: GAME_CONFIG.CAMERA_WIDTH + 'px', // 500px
    height: GAME_CONFIG.CAMERA_HEIGHT + 'px', // 500px
  },
  frameContainer: {
    width: '556px',
    height: '560px',
    padding: '2px 0 0 0', // Top Right Bottom Left
    backgroundImage: 'url("/frame-mini3.png")', // Correct path
    backgroundSize: '556px 560px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  }
  
};

// styles.js
export const textStyles = {
    playerLevelText: { fontSize: '20px', fill: '#ffffff' },
    // other text styles go here
  };
  
