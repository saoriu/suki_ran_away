import Phaser from 'phaser';
import { PlayerState } from './playerState';

export class AuthScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AuthScene' });
    }

    create() {
        // Create login button
        this.loginButton = this.add.text(100, 100, 'Login', { fill: '#0f0' })
            .setInteractive()
            .on('pointerdown', () => {
                const userid = this.usernameInput.value;
                const password = this.passwordInput.value;
                this.login(userid, password);
            });

        // Create register button
        this.registerButton = this.add.text(100, 140, 'Register', { fill: '#0f0' })
            .setInteractive()
            .on('pointerdown', () => {
                const userid = this.usernameInput.value;
                const password = this.passwordInput.value;
                this.register(userid, password);
            });

        // ... rest of your code
    }

    async login(userid, password) {
        try {
            const response = await fetch('https://f4ekpjmpm7.execute-api.us-east-2.amazonaws.com/prod/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userid, password })
            });
            if (response.ok) {
                const { playerState } = await response.json();
                // Update local player state
                Object.assign(PlayerState, playerState);
                // Transition to the main game scene
                this.scene.start('mainScene'); // Make sure this is the correct key for your main scene
            } else {
                // Handle errors (e.g., display a message to the user)
            }
        } catch (error) {
            // Handle network or other unexpected errors
        }
    }

    async register(userid, password) {
        try {
            const response = await fetch('https://f4ekpjmpm7.execute-api.us-east-2.amazonaws.com/prod/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userid, password })
            });
            if (response.ok) {
                // Auto-login or inform the user to log in
                // Transition to the login scene or directly call this.login(userid, password)
            } else {
                // Handle errors (e.g., display a message to the user)
            }
        } catch (error) {
            // Handle network or other unexpected errors
        }
    }

    // Additional methods for handling inputs, transitions, etc.
}

export default AuthScene;
