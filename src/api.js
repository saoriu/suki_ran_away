// api.js
export const updatePlayerState = async (userid, playerState, token) => {
    const response = await fetch(`https://f4ekpjmpm7.execute-api.us-east-2.amazonaws.com/prod/playerstate/${userid}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(playerState)
    });

    if (!response.ok) {
        throw new Error('Failed to save player state');
    }

    return response.json();
};

