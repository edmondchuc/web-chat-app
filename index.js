const express = require('express');
const app = express();
const http = require('http');
const server = http.Server(app);
const socketIO = require('socket.io');
const io = socketIO(server);
const fs = require('fs');
const bodyParser = require('body-parser')
app.use(bodyParser.json())

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

/**
 * Retrieve users from a relative file named users.json
 * @param {(users:any) => void} callback The callback function that should take one parameter.
 */
function retrieveUsers(callback) {
    let users;
    fs.readFile('users.json', (error, data) => {
        if(error) throw error;
        users = JSON.parse(data);
        callback(users);
    });
}

/**
 * Writes the object containing user data to a file named users.json
 * @param {users:Object} users The object containing user data
 */
function writeUsers(users) {
    users = JSON.stringify(users);
    fs.writeFile('users.json', users, (err) => {
        if (err) throw err;
    });
}
/**
 * Add a new user to the system.
 * @param {string} username The username of the user. This is used as the key to the user data object
 * @param {object} userData The user data object
 */
function addUser(username, userData) {
    retrieveUsers( (users) => {
        users[username] = userData;
        writeUsers(users);
    })
}

/**
 * Retrieve the data of the user
 * @param {string} username The username of the user for data retrieval
 * @param {(userData:object) => void} callback The callback function
 */
function retrieveUserData(username, callback) {
    let userData;
    retrieveUsers( (users) => {
        userData = users[username];
        callback(userData);
    });
}

/**
 * The user data default template
 */
const userDataTemplate = {
    "email": "",
    "superAdmin": false,
    "groupAdmin": false,
    "groups": [
        {
            "newbies": 
            {
                "channels": ["general", "help"]
            }
        },
    ]
}

// Return user data back to client
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
            console.log(`\tCreating user ${username} and saving to file`);
            userData = userDataTemplate;
            addUser(username, userData)
            console.log(`\tResponding with data on user: ${username}`);
            res.send(userData);
        }
    }));
});

// Update email of client
// app.post('/api/email/:username-:email', (req, res) => {
//     console.log(req.params.username);
//     console.log(req.params.email);
// });
app.post('/api/email', (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    retrieveUsers((users) => {
        users[username].email = email;
        writeUsers(users);
    });
    res.send(req.body);
});