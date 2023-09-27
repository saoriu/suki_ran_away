// PhaserRunner.js
import React, { useRef } from 'react';
import { usePhaserGame } from './usePhaseGame.js';
import { gameStyles } from './styles.js';

export default function PhaserRunner() {
  console.log('PhaserRunner Rendering');
  const gameRef = useRef(null);

  usePhaserGame(gameRef);

  return <div id="phaser-game" style={{ width: gameStyles.width, height: gameStyles.height }}></div>;
}
