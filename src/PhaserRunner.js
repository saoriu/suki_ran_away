import React, { useState, useRef } from 'react';
import { usePhaserGame } from './usePhaseGame.js';
import { gameStyles } from './styles.js';

export default function PhaserRunner() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const gameRef = useRef(null);

  const handlePasswordInput = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'espe') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password, maybe wait until the game is finished?');
    }
  };

  usePhaserGame(gameRef, isAuthenticated);

  return (
    <div>
    {!isAuthenticated ? (
      <form onSubmit={handleSubmit}>
        <input type="password" value={password} onChange={handlePasswordInput} />
        <button type="submit">Submit</button>
      </form>
    ) : (
    <div id="frame-container" style={gameStyles.frameContainer}>
    <div id="phaser-game" style={gameStyles.game}>
    <div className="title">
    <h1>SUKI RAN AWAY</h1>
    <h2 id="version">alpha version</h2>
    <p>A 2D web-based game developed in JavaScript, employing Phaser3 as the game development framework and React for UI integration.
      Game designed and developed by Saori Uchida.</p>
      <p id="copyright">©️ 2023 saocute studio</p>
    </div>
    </div>
    </div>
    )}
  </div>
  );
}