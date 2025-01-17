//
//  app.js
//  mernIDS4
//
//  Created by Javier Fernandez on 11/01/25.
//

document.getElementById('fetchMessage').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/hello');
        const data = await response.json();
        document.getElementById('message').textContent = data.message;
    } catch (error) {
        console.error('Error fetching message:', error);
        document.getElementById('message').textContent = 'Error fetching message!';
    }
});
