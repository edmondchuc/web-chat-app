const express = require('express');
const app = express();
const http = require('http');
const server = http.Server(app);
const socketIO = require('socket.io');
const io = socketIO(server);
const fs = require('fs');
const bodyParser = require('body-parser')
app.use(bodyParser.json())

// mongo requires
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// mongo settings
const url = 'mongodb://localhost:27017';
const database = 'myproject';
const collectionName = 'product';
let db;

// connect to the database
MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
    assert.strictEqual(null, err);
    console.log(`Connected successfully to '${database}' database at '${url}' server`);
    db = client.db(database);

    const port = 3000;

    // start the server
    app.use(express.static(__dirname + '/chat-app/dist/chat-app'));
    app.listen(port, () => console.log(`Server listening on port ${port}`));
});



// const port = process.env.PORT || 3000;

io.on('connection', (socket) => {
    console.log('Visitor connected');

    socket.on('new-message', (message) => {
        console.log(message);
        io.emit('message', { type: 'message', text:message });
    });
});

// server.listen(port, () => {
//     console.log(`Server started on port: ${port}`);
// });

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

// Return user data back to client - DONE
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

// get all the unique groups and send back the response
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

// return all groups for admin - DONE
app.get('/api/groups', (req, res) => {
    console.log('GET request at /api/groups');
    console.log('\tLoading data...');
    getGroups(res);
});

// Update email of client - DONE
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

// Remove a group - DONE
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

// create a new group - DONE
app.post('/api/createGroup', (req, res) => {
    console.log('POST request at /api/createGroup');
    let username = req.body.username;
    let groupName = req.body.groupName;
    console.log(`\tCreating new group ${groupName} for user ${username}`);

    console.log('\tLoading data...');
    // update groups
    retrieveUsers((users) => {
        for(user in users) {
            if(users.hasOwnProperty(user)) {
                // console.log(`\tPrinting users! ${user}`);
                if(users[user].groupAdmin) {
                    console.log(`\tUser ${user} getting added to new group and channel because of admin role`);
                    let groupExists = false;
                    for(group of users[user].groups) {
                        if(group.name === groupName) {
                            groupExists = true;
                        }
                    }
                    if(!groupExists) {
                        users[user].groups.push(
                            {
                                "name": groupName,
                                "channels": ["general"]
                            }
                        );
                    }
                }
            }
        }
        writeUsers(users, () => {
            retrieveUsers((users) => {
                let groups = [];
                for(let user in users) {
                    if(users.hasOwnProperty(user)) {
                        for(group of users[user].groups) {
                            if(!groups.includes(group.name)) {
                                groups.push(group.name);
                            }
                        }
                    }
                }
                console.log("\tFound groups:");
                console.log(groups);
                console.log('\tResponding with data on groups');
                res.send(groups);
            });
        });

        
        
    });
});

// create new channel in a group - DONE
app.post('/api/channel/create', (req, res) => {
    console.log(`POST request at /api/channel/create`);
    console.log(req.body);
    const username = req.body.username;
    const groupName = req.body.groupName;
    const channelName = req.body.channelName;
    let channels = [];

    console.log('\tLoading data...');
    retrieveUsers((users) => {
        console.log(`\tAdding channel ${channelName} to group ${groupName}`);
        for(user in users) {
            if(users.hasOwnProperty(user)) {
                if(users[user].groupAdmin) {
                    for(group of users[user].groups) {
                        // console.log(group.name);
                        if(group.name == groupName) {
                            if(!group.channels.includes(channelName)) {
                                group.channels.push(channelName);
                            }
                        }
                    }
                }
            }
        }
        writeUsers(users, () => { // write to disk
            retrieveUsers((users) => { // send back a list of all channels for the group
                for(let user in users) {
                    if(users.hasOwnProperty(user)) {
                        users[user].groups.forEach(group => {
                            if(group.name === groupName) {  // found the group
                                // if channel is not in channel list, add it
                                for(channel of group.channels) {
                                    if(!channels.includes(channel)) {
                                        channels.push(channel);
                                    }
                                }
                            }
                        });
                    }
                }
                console.log(`\tFinished collating channels for group ${groupName}`);
                console.log(channels);
                res.send(channels);
            });
        });
    });
});

// remove channel of a group - DONE
app.delete('/api/channel/remove/:username.:groupName.:channelName', (req, res) => {
    console.log('DELETE request at /api/channel/remove:groupName.:channelName');
    console.log(req.params);
    const username = req.params.username;
    const groupName = req.params.groupName;
    const channelName = req.params.channelName;
    let channels = [];

    retrieveUsers( (users) => {
        for(let user in users) { // loop over the users object's properties
            if(users.hasOwnProperty(user)) {
                for(group of users[user].groups) {
                    if(group.name === groupName) {
                        if(group.channels.includes(channelName)) { // remove channel
                            group.channels.splice(group.channels.indexOf(channelName), 1);
                        }
                    }
                }
            }
        }
        // write to file the new changes
        writeUsers(users)
        for(user in users) {
            if(users.hasOwnProperty(user)) {
                for(group of users[user].groups) {
                    if(group.name === groupName) {
                        for(channel of group.channels) {
                            if(!channels.includes(channel)) {
                                channels.push(channel);
                            }
                        }
                    }
                }
            }
        }
        console.log(`\tResponding with new list of channels ${channels}`);
        res.send(channels);
    });
});

// get all channels in a group - DONE
app.get('/api/:group/channels', (req, res) => {
    console.log('GET request at /api/:group/channels');
    const groupName = req.params.group;
    console.log(`\tCollating all channels for group ${groupName}`);
    let channels = [];
    retrieveUsers((users) => {
        for(let user in users) {
            if(users.hasOwnProperty(user)) {
                users[user].groups.forEach(group => {
                    if(group.name === groupName) {  // found the group
                        // if channel is not in channel list, add it
                        for(channel of group.channels) {
                            if(!channels.includes(channel)) {
                                channels.push(channel);
                            }
                        }
                    }
                });
            }
        }
        console.log(`\tFinished collating channels for group ${groupName}`);
        console.log(channels);
        res.send(channels);
    });
});

// get all the users in the group - DONE
function getAllUsersInGroup(groupName, res) {
    let allUsers = [];
    retrieveUsers((users) => {
        for(user in users) {
            if(users.hasOwnProperty(user)) {
                for(group of users[user].groups) {
                    if(group.name == groupName) {
                        if(!allUsers.includes(user)) {
                            allUsers.push(user);
                        }
                    }
                }
            }
        }
        console.log(`\tResponding back with all users ${allUsers}`);
        res.send(allUsers);
    });
}

// get all the users in a group - DONE
app.get('/api/:groupName/users', (req, res) => {
    console.log('GET request at /api/:groupName/users');
    const groupName = req.params.groupName;
    console.log(`\tReceived groupName: ${groupName}`);
    getAllUsersInGroup(groupName, res);
});

// get all users and their data - DONE
app.get('/api/users/all', (req, res) => {
    console.log('GET request at /api/users/all');
    retrieveUsers((users) => {
        res.send(users);
    });
});

// remove user from a group - DONE
app.delete('/api/remove/:groupName.:username', (req, res) => {
    console.log('DELETE request at /api/:groupName/:username/remove');
    let username = req.params.username;
    let groupName = req.params.groupName;
    console.log(username, groupName);
    retrieveUsers((users) => {
        for(group of users[username].groups) {
            if(group.name === groupName) {
                users[username].groups.splice(users[username].groups.indexOf(group), 1);
                // console.log(users[username].groups.indexOf(group));
            }
        }
        writeUsers(users, () => { // get the new list of names in the group
            getAllUsersInGroup(groupName, res);
        })
    });
});

// add user to a group - DONE
app.post('/api/groups/add', (req, res) => {
    console.log('POST request at /api/groups/add');
    const username = req.body.username;
    const groupName = req.body.groupName;
    retrieveUsers((users) => {
        if(users[username] === undefined) {
            let user = userDataTemplate;
            user.groups.push(
                {
                    "name": groupName,
                    "channels": ["general"]
                }
            );
            // addUser(username, user);
            users[username] = user;
            console.log('Adding new user');
        }
        else {
            users[username].groups.push(
                {
                    "name": groupName,
                    "channels": ["general"]
                }
            );
            console.log('Adding existing user to group');
        }
        writeUsers(users, () => {
            console.log(users);
            // getAllUsersInGroup(groupName, res);
            retrieveUsers((users) => {
                res.send(users);
            })
        });
    });
});

// add new user to a channel in a group - DONE
app.post('/api/group/channel/add', (req, res) => {
    console.log('POST request at /api/group/channel/add');
    console.log(req.body);
    const username = req.body.username;
    const groupName = req.body.groupName;
    const channelName = req.body.channelName;
    retrieveUsers((users) => {
        if(users[username] === undefined) {
            let user = userDataTemplate;
            user.groups.push(
                {
                    "name": groupName,
                    "channels": ["general", channelName]
                }
            );
            // addUser(username, user);
            users[username] = user;
            console.log('Adding new user');
        }
        else {
            let exists = false;
            for(let group of users[username].groups) {
                if(group.name === groupName) {
                    exists = true;
                    group.channels.push(channelName);
                    break;
                }
            }

            if(!exists) {
                users[username].groups.push(
                    {
                        "name": groupName,
                        "channels": ["general", channelName]
                    }
                );
                console.log('Adding existing user to group');
            }
        }
        writeUsers(users, () => {
            // console.log(users);
            retrieveUsers((users) => {
                res.send(users);
            })
        });
    });
});

// remove user from channel - DONE
app.delete('/api/removeUserFromChannel/:groupName.:channelName.:username', (req, res) => {
    console.log('DELETE request at /api/remove/:groupName.:channelName.:username');
    const username = req.params.username;
    const groupName = req.params.groupName;
    const channelName = req.params.channelName;
    retrieveUsers((users) => {
        for(group of users[username].groups) {
            if(group.name === groupName) {
                console.log(group.channels);
                console.log(group.channels.indexOf(channelName));
                group.channels.splice(group.channels.indexOf(channelName), 1);
            }
        }
        writeUsers(users, () => {
            res.send(users);
        });
    });
});

// remove user from the system - DONE
app.delete('/api/removeUserFromSystem/:username', (req, res) => {
    console.log('DELETE request at /api/removeUserFromSystem/:username');
    const username = req.params.username;
    retrieveUsers((users) => {
        users[username] = undefined;
        writeUsers(users, () => {
            res.send(users);
        });
    });
});

// make a user a group admin
app.post('/api/makeUserGroupAdmin', (req, res) => {
    console.log('POST request at /api/makeUserGroupAdmin');
    const username = req.body.username;
    console.log(username);
    retrieveUsers((users) => {
        users[username].groupAdmin = true;
        writeUsers(users, () => {
            res.send(users);
        });
    });
});

// make a user a super admin
app.post('/api/makeUserSuperAdmin', (req, res) => {
    console.log('POST request at /api/makeUserSuperAdmin');
    const username = req.body.username;
    console.log(username);
    retrieveUsers((users) => {
        users[username].superAdmin = true;
        users[username].groupAdmin = true;
        writeUsers(users, () => {
            res.send(users);
        });
    });
});