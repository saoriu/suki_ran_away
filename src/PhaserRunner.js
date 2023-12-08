// PhaserRunner.js
import React, { useRef } from 'react';
import { usePhaserGame } from './usePhaseGame.js';
import { gameStyles } from './styles.js';

export default function PhaserRunner() {
  console.log('PhaserRunner Rendering');
  const gameRef = useRef(null);

  usePhaserGame(gameRef);

  return (
    <div id="frame-container" style={gameStyles.frameContainer}>
    <div id="phaser-game" style={gameStyles.game}>
    <div class="title">
    <h1>SUKI RAN AWAY</h1>
    <h2 id="version">alpha version</h2>
    <p>A 2D web-based game developed in JavaScript, employing Phaser3 as the game development framework and React for UI integration.
      Game designed and developed by Saori Uchida.</p>
    </div>
    <p id="copyright">©️ 2023 s9o studio</p>
    </div>
  </div>
  );
}