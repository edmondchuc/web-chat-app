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
function writeUsers(users, callback) {
    users = JSON.stringify(users);
    fs.writeFile('users.json', users, (err) => {
        if (err) throw err;
        if(callback !== undefined) callback();
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
            "name": "newbies",
            "channels": ["general", "help"]
        },
        {
            "name": "general",
            "channels": ["general", "chitchat", "topic of the day"]
        }
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

function getGroups(res) {
    retrieveUsers((users) => {
        let groups = [];
        for(let user in users) {
            if(users.hasOwnProperty(user)) {
                users[user].groups.forEach(group => {
                    if(!groups.includes(group.name)) {
                        groups.push(group.name);
                    }
                });
            }
        }
        console.log("\tFound groups:");
        console.log(groups);
        console.log('\tResponding with data on groups');
        res.send(groups);
    });
}

// return all groups for admin
app.get('/api/groups', (req, res) => {
    console.log('GET request at /api/groups');
    console.log('\tLoading data...');
    getGroups(res);
});

// Update email of client
app.post('/api/email', (req, res) => {
    console.log('POST request at /api/email');
    const username = req.body.username;
    const email = req.body.email;
    retrieveUsers((users) => {
        users[username].email = email;
        writeUsers(users);
    });
    res.send(req.body);
});

app.delete('/api/removeGroup/:groupName', (req, res) => {
    console.log('DELETE request at /api/removeGroup');
    const groupName = req.params.groupName;

    retrieveUsers( (users) => {
        for(let user in users) { // loop over the users object's properties
            if(users.hasOwnProperty(user)) {
                users[user].groups.forEach(group => {
                    if(group.name === groupName) {
                        // find the index of group name in the groups list and remove it
                        users[user].groups.splice(users[user].groups.indexOf(groupName), 1);
                        console.log(`\tRemoved group ${groupName}`);
                        
                    }
                });
            }
        }
        // write to file the new changes
        writeUsers(users, () => {
            getGroups(res);
        });
    });
});

app.post('/api/createGroup', (req, res) => {
    console.log('POST request at /api/createGroup');
    let username = req.body.username;
    let groupName = req.body.groupName;
    console.log(`\tCreating new group ${groupName} for user ${username}`);

    console.log('\tLoading data...');
    // update groups
    retrieveUsers((users) => {
        // create the new group
        users[username].groups.push(
            {
                "name": groupName,
                "channels": ["general"]
            }
        );
        writeUsers(users);

        let groups = [];
        for(let user in users) {
            if(users.hasOwnProperty(user)) {
                users[user].groups.forEach(group => {
                    if(!groups.includes(group.name)) {
                        groups.push(group.name);
                    }
                });
            }
        }
        console.log("\tFound groups:");
        console.log(groups);
        console.log('\tResponding with data on groups');
        res.send(groups);
    });
});