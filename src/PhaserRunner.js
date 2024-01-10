import React, { useEffect, useState, useRef } from 'react';
import { usePhaserGame } from './usePhaseGame.js';
import { PlayerState, setLevel, updatePlayerLevel } from './playerState.js';
import { gameStyles } from './styles.js';
import { PuffLoader } from 'react-spinners';


export default function PhaserRunner() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
});
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // To toggle between login and register
  const gameRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
        setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
        });
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
        window.removeEventListener('resize', handleResize);
    };
}, []);

  const handleUsernameInput = (e) => setUsername(e.target.value);
  const handlePasswordInput = (e) => setPassword(e.target.value);

  const login = async (userid, password) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://f4ekpjmpm7.execute-api.us-east-2.amazonaws.com/prod/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid, password })
      });

      if (response.ok) {
        const data = await response.json(); // Parse response JSON only once
        // Assuming the token and playerState are part of the response
        const { token, playerState } = data;

        // Save the JWT and userid to sessionStorage
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('userid', userid);

        // Update local PlayerState with the received data
        Object.assign(PlayerState, playerState);

// In PhaserRunner.js, inside login function
setLevel(updatePlayerLevel(PlayerState.skills));

        if (typeof window !== 'undefined' && window.game) {
            window.game.events.emit('playerStateUpdated');
        }


        setIsAuthenticated(true);
      } else {
        // Handle errors
        console.error('Login failed:', response.statusText);
      }
    } catch (error) {
      // Handle network or other unexpected errors
      console.error('Error during login:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const register = async (userid, password) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://f4ekpjmpm7.execute-api.us-east-2.amazonaws.com/prod/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid, password })
      });
      if (response.ok) {
        // Optionally, automatically log the user in after registration
        await login(userid, password);
      } else {
        // Handle errors
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegistering) {
      register(username, password);
    } else {
      login(username, password);
    }
  };

  // Toggle between login and registration
  const toggleAuthMode = () => setIsRegistering(!isRegistering);

  usePhaserGame(gameRef, isAuthenticated);

  return (
    <div>
      {!isAuthenticated ? (
        <div className='main' style={{ backgroundImage: `url(${process.env.PUBLIC_URL + '/bg1.png'})` }}>
        <div className='header'>
        <h1 className="main-text">SUKI  RAN  AWAY!</h1>
        <h3 className="secondary-text">alpha version</h3>
        </div>
        <div className="container" style={{ backgroundImage: `url(${process.env.PUBLIC_URL + '/login.png'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="login-container">
              <h2 className="text-center">{isRegistering ? 'REGISTER' : 'LOGIN'}</h2>
              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', marginTop: '35px' }}>
                  <PuffLoader color="#000000" />
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>USERNAME</label>
                    <input type="text" className="form-control" value={username} onChange={handleUsernameInput} />
                  </div>
                  <div className="form-group">
                    <label>PASSWORD</label>
                    <input type="password" className="form-control" value={password} onChange={handlePasswordInput} />
                  </div>
                  <div className="form-group">
                    <button type="submit" className="btn btn-primary btn-block">{isRegistering ? 'REGISTER' : 'LOGIN'}</button>
                  </div>
                  <div className="form-group secondary">
                    <p className="secondary" onClick={toggleAuthMode}>
                      {isRegistering ? 'Log in with an existing account' : 'Create an account?'}
                    </p>
                  </div>
                </form>
              )}
            </div>
        </div>
        <div className='footer'>
          <div className='footer-container'>
            <div className='footer-item'>
              <a href='https://www.saoriuchida.com/'>© 2023 Saori Uchida. All rights reserved</a>
            </div>
            </div>
       </div>
        </div>
      ) : (
        <div id="frame-container" style={gameStyles.frameContainer}>
          <div id="phaser-game"           
          style={{
                width: `${windowSize.width}px`,
                height: `${windowSize.height}px`,
                position: 'relative',
            }}></div>
        </div>
      )}
    </div>
  );
}