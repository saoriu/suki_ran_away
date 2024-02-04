import { useEffect, useState } from 'react';
import Phaser from 'phaser';
import { PreloadScene } from './PreloadScene'; // Import PreloadScene
import { mainScene } from './mainScene';
import { GAME_CONFIG } from './gameConstants.js';
import { UIScene } from './UIScene';

export function usePhaserGame(gameRef, isAuthenticated) {
    const [dimensions, setDimensions] = useState({
        width: GAME_CONFIG.CAMERA_WIDTH,
        height: GAME_CONFIG.CAMERA_HEIGHT,
    });

    useEffect(() => {
        if (isAuthenticated) {

                const config = {
                type: Phaser.WEBGL,
                parent: 'phaser-game',
                width: dimensions.width,
                height: dimensions.height,
                fps: {
                    target: 10,
                },
                physics: {
                    default: 'matter',
                    matter: {
                        gravity: { y: 0 },
                        debug: false // Set to false in production
                    }
                },
                autoRound: false,
                antialias: true,
                plugins: {
                    scene: [
                        { key: 'lightsPlugin', plugin: Phaser.GameObjects.LightsPlugin, mapping: 'lights' }
                    ]
                },
                scene: [PreloadScene, mainScene, UIScene], // Start only with AuthScene
            };

            gameRef.current = new Phaser.Game(config);
            window.game = gameRef.current;

            const handleResize = () => {
                setDimensions({
                    width: window.innerWidth,
                    height: window.innerHeight,
                });

                gameRef.current.scale.resize(window.innerWidth, window.innerHeight);
            };

            window.addEventListener('resize', handleResize);

            return () => {
                // Clean up Phaser Game Instance
                gameRef.current?.destroy(true);
                gameRef.current = null;
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [gameRef, isAuthenticated, dimensions]);
    
    useEffect(() => {
        GAME_CONFIG.CAMERA_WIDTH = dimensions.width;
        GAME_CONFIG.CAMERA_HEIGHT = dimensions.height;
    }, [dimensions]);

    return gameRef.current;
}