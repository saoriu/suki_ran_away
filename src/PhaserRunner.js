import React, { useEffect, useState, useRef } from 'react';
import { usePhaserGame } from './usePhaseGame.js';
import { PlayerState, setLevel, updatePlayerLevel } from './playerState.js';
import { gameStyles } from './styles.js';
import { PuffLoader } from 'react-spinners';
import { Analytics } from '@vercel/analytics/react';
import { debounce } from 'lodash';


const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};


const MyComponent = () => (
  <div className='parallax'>
    <div className='layer sky' style={{ backgroundImage: `url(${process.env.PUBLIC_URL + '/sky_fc.png'})` }} />
    <div className='layer far-mountains' style={{ backgroundImage: `url(${process.env.PUBLIC_URL + '/far_mountains_fc.png'})` }} />
    <div className='layer grassy-mountains' style={{ backgroundImage: `url(${process.env.PUBLIC_URL + '/grassy_mountains_fc.png'})` }} />
    <div className='layer clouds-mid' style={{ backgroundImage: `url(${process.env.PUBLIC_URL + '/clouds_mid_fc.png'})` }} />
    <div className='layer clouds-mid-tc' style={{ backgroundImage: `url(${process.env.PUBLIC_URL + '/clouds_mid_t_fc.png'})` }} />
    <div className='layer hill' style={{ backgroundImage: `url(${process.env.PUBLIC_URL + '/hill.png'})` }} />
    <div className='layer clouds-front-tc' style={{ backgroundImage: `url(${process.env.PUBLIC_URL + '/clouds_front_t_fc.png'})` }} />
    <div className='layer clouds-front' style={{ backgroundImage: `url(${process.env.PUBLIC_URL + '/clouds_front_fc.png'})` }} />
  </div>
);


export default function PhaserRunner() {
  useEffect(() => {
  });
  
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
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    const debouncedHandleResize = debounce(handleResize, 100);

    window.addEventListener('resize', debouncedHandleResize);

    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, []);

  useEffect(() => {
    const blockContextMenu = (evt) => {
      evt.preventDefault();
    };

    window.addEventListener('contextmenu', blockContextMenu);

    return () => {
      window.removeEventListener('contextmenu', blockContextMenu);
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
        // The token and playerState are part of the response
        const { token, playerState } = data;

        // Save the JWT and userid to sessionStorage
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('userid', userid);

        // Update local PlayerState with the received data
        Object.assign(PlayerState, playerState);

        PlayerState.userid = userid;

        // In PhaserRunner.js, inside login function
        setLevel(updatePlayerLevel(PlayerState.skills));

        if (typeof window !== 'undefined' && window.game) {
          window.game.events.emit('playerStateUpdated');
        }


        setIsAuthenticated(true);
      } else {
        const errorData = await response.json(); // Parse error response JSON
        setErrorMessage(errorData.error); // Set error message  
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
        const errorData = await response.json(); // Parse error response JSON
        setErrorMessage(errorData.error); // Set error message
      }
    } catch (error) {
      // Handle network or other unexpected errors
      console.error('Error during registration:', error);
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
    <div style={{ userSelect: "none", /* Standard syntax */
    WebkitUserSelect: "none", /* Safari 3.1+ */
    MozUserSelect: "none", /* Firefox 2+ */
    MsUserSelect: "none"}}>
      <Analytics />
      {!isAuthenticated ? (
        <div className='main'>
          <MyComponent />
          {isMobileDevice() ? (
            alert("This game is not supported on mobile devices! Mobile gaming is for babies and you are not a baby.")
          ) : null}
          <div className='header'>
            <img className="main-image" src="/ui/title.png" alt="Suki Ran Away" />            
          </div>
          <div className="container">
            <div className="login-container">
              <h2 className="text-center">{isRegistering ? 'REGISTER' : 'LOGIN'}</h2>
              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', marginTop: '35px' }}>
                  <PuffLoader color="#000000" />
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {errorMessage && <p className='error'>{errorMessage}</p>}
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
                <a href='https://www.sukiranway.com/'>© Suki Ran Away All rights reserved. Created by Saori Uchida.</a>
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