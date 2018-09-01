const express = require('express');
const app = express();
const http = require('http');
const server = http.Server(app);
const socketIO = require('socket.io');
const io = socketIO(server);
const fs = require('fs');

app.use(express.static(__dirname + '/chat-app/dist/chat-app'));

const port = process.env.PORT || 3000;

io.on('connection', (socket) => {
    console.log('Visitor connected');

    socket.on('new-message', (message) => {
        console.log(message);
        io.emit('message', { type: 'message', text:message });
    });
});

server.listen(port, () => {
    console.log(`Server started on port: ${port}`);
});

function retrieveUsers(callback) {
    let users;
    fs.readFile('users.json', (error, data) => {
        if(error) throw error;
        users = JSON.parse(data);
        callback(users);
    });
}

/**
 * Retrieves the user data of a user based on their username if it exists. 
 * @param {string} username The username of the user for data retrieval.
 * @returns  The user data object or undefined if it does not exist.
 */
function retrieveUserData(username, callback) {
    let userData;
    retrieveUsers( (users) => {
        users.forEach(user => {
            if(user.name === username) {
                userData = user;
            };
        });
        callback(userData);
    });
}

app.get('/api/user', (req, res) => {
    const username = req.query.username;
    console.log('GET request at /api/user');
    console.log(`\tFetching user data for: ${username}`);
    retrieveUserData(username, (userData => {
        if(userData) {
            console.log(`\tResponding with data on user: ${username}`);
            res.send(userData);
        }
        else {
            console.log(`\tUser ${username} was not found.`);
        }
    }));
});
