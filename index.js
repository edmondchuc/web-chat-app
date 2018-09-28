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
const database = 'chat';
const collectionName = 'users';
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

/**
 * The user data default template
 */
const userDataTemplate = {
    "username": "",
    "email": "",
    "superAdmin": false,
    "groupAdmin": false,
    "groups": [
        {
            "name": "newbies",
            "channels": [
                "general", 
                "help"
            ]
        },
        {
            "name": "general",
            "channels": [
                "general", 
                "chitchat", 
                "topic of the day"
            ]
        }
    ]
}

// retrieve all the users in the database
function retrieveUsers(callback) {
    let users;

    const collection = db.collection(collectionName);
    collection.find().toArray( (err, result) => {
        assert.strictEqual(err, null);
        callback(result);
    });
}

// retrieve the user data for a specific user
function retrieveUserData(username, callback) {
    let userData;
    retrieveUsers( (users) => {
        for(let i = 0; i < users.length; i++) {
            if(users[i].username === username) {
                userData = users[i];
            }
        }
        callback(userData);
    });
}

// Add a new user to the system.
function addUser(userData) {
    const collection = db.collection(collectionName);
    collection.insertOne(userData, (err, result) => {
        assert.strictEqual(err, null);
    });
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
            userData.username = username;
            addUser(userData)
            console.log(`\tResponding with data on user: ${username}`);
            res.send(userData);
        }
    }));
});

// // return an array of group names as strings for admin users
app.get('/api/groups', (req, res) => {
    console.log('GET request at /api/groups');

    getGroups(res);
});

// // Update email of client
app.post('/api/email', (req, res) => {
    console.log('POST request at /api/email');
    const username = req.body.username;
    const email = req.body.email;
    
    // mongo updateOne user by username and update its email 
    const collection = db.collection(collectionName);
    collection.updateOne({"username": username}, {$set: {"email": email}}, (err, result) => {
        assert.strictEqual(err, null);
        res.send({"success": true});
    });
});

// // admin creates a group
app.post('/api/createGroup', (req, res) => {
    console.log('POST request at /api/createGroup');
    let username = req.body.username;
    let groupName = req.body.groupName;
    console.log(`\tCreating new group ${groupName} for user ${username}`);

    // retrieve the user's info
    const collection = db.collection(collectionName);
    collection.find({"username": username}).toArray( (err, result) => {
        assert.strictEqual(err, null);
        let groups = result[0].groups;

        // check if the group exists, if not, add it
        let exists = false;
        for(let i = 0; i < groups.length; i++) {
            if(groups[i].name === groupName) {
               exists = true; 
            }
        }
        if(!exists) {
            groups.push({
                "name": groupName,
                "channels": ["general"]
            })
        }

        // update the user's groups list
        collection.updateOne({"username": username}, {$set: {"groups": groups}}, (err, result) => {
            assert.strictEqual(err, null);
            
            // wait for a little time and then fetch the document
            setTimeout( () => {
                collection.find({"username": username}).toArray( (err, result) => {
                    assert.strictEqual(err, null);
                    getGroups(res);
                })
            }, 200);
        });
    });
});

// admin removes a group
app.delete('/api/removeGroup/:groupName', (req, res) => {
    console.log('DELETE request at /api/removeGroup');
    const groupName = req.params.groupName;

    retrieveUsers( (users) => {
        for(let i = 0; i < users.length; i++) {
            // console.log(users[i].username);
            users[i].groups.forEach( (group)=> {
                // console.log(group.name);
                if(group.name === groupName) {
                    users[i].groups.splice(users[i].groups.indexOf(groupName), 1);
                }
            })
        }
        // write to file the new changes
        writeUsers(users, () => {
            let groups = []
            for(let i = 0; i < users.length; i++) {
                users[i].groups.forEach( group => {
                    if(!groups.includes(group.name)) {
                        groups.push(group.name);
                    }
                });
            }
            res.send(groups);
        });
    });
});

// get all the groups for admins
function getGroups(res) {
    retrieveUsers( (users) => {
        let groups = [];
        for(let i = 0; i < users.length; i++) {
            let userGroup = users[i].groups;
            for(let j = 0; j < userGroup.length; j++) {
                if(!groups.includes(userGroup[j].name)) {
                    groups.push(userGroup[j].name);
                }
            }
        }
        res.send(groups);
    });
}

// get all channels in a group
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

// get all the users in a group
app.get('/api/:groupName/users', (req, res) => {
    console.log('GET request at /api/:groupName/users');
    const groupName = req.params.groupName;
    console.log(`\tReceived groupName: ${groupName}`);
    getAllUsersInGroup(groupName, res);
});

// get all the users in the group
function getAllUsersInGroup(groupName, res) {
    let allUsers = [];
    retrieveUsers((users) => {
        for(let i = 0; i < users.length; i++) {
            users[i].groups.forEach( (group) => {
                if(group.name === groupName) {
                    if(!allUsers.includes(users[i].username)) {
                        allUsers.push(users[i].username);
                    }
                }
            })
        }
        console.log(`\tResponding back with all users ${allUsers}`);
        res.send(allUsers);
    });
}

// write to the database updating all the users
function writeUsers(users, callback) {
    const collection = db.collection(collectionName);
    
    for(let i = 0; i < users.length; i++) {
        collection.updateOne({"username": users[i].username}, {$set: users[i]}, (err, result) => {
            assert.strictEqual(err, null);
        });
    }
    callback();
}

// create new channel in a group
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

// remove channel of a group
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
        writeUsers(users, () => {});
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

// get all users and their data
app.get('/api/users/all', (req, res) => {
    console.log('GET request at /api/users/all');
    retrieveUsers((users) => {
        console.log(users);
        res.send(users);
    });
});

// remove user from a group
app.delete('/api/remove/:groupName.:username', (req, res) => {
    console.log('DELETE request at /api/:groupName/:username/remove');
    let username = req.params.username;
    let groupName = req.params.groupName;
    console.log(username, groupName);
    retrieveUsers((users) => {
        // for(group of users[username].groups) {
        //     if(group.name === groupName) {
        //         users[username].groups.splice(users[username].groups.indexOf(group), 1);
        //         // console.log(users[username].groups.indexOf(group));
        //     }
        // }
        for(let i = 0; i < users.length; i++) {
            for(let j = 0; j < users[i].groups.length; j++) {
                if(users[i].username === username) {
                    if(users[i].groups[j].name === groupName) {
                        users[i].groups.splice(users[i].groups.indexOf(users[i].groups[j]), 1);
                    }
                }
            }
        }
        writeUsers(users, () => { // get the new list of names in the group
            getAllUsersInGroup(groupName, res);
        })
    });
});

// add user to a group
app.post('/api/groups/add', (req, res) => {
    console.log('POST request at /api/groups/add');
    const username = req.body.username;
    const groupName = req.body.groupName;
    retrieveUsers((users) => {
        // check if the user exists
        let exists = false;
        for(let i = 0; i < users.length; i++) {
            if(users[i].username === username) {
                users[i].groups.forEach(group => {
                    if(group.name === groupName) {
                        exists = true;
                    }
                });
                if(!exists) {
                    users[i].groups.push(
                        { "name": groupName, "channels": ["general"] }
                    );
                    exists = true;
                }
            }
        }
        if(!exists) {
            let user = userDataTemplate;
            user.username = username;
            user.groups.push(
                { "name": groupName, "channels": ["general"] }
            );
            addUser(user);
        }

        // if(users[username] === undefined) {
        //     let user = userDataTemplate;
        //     user.groups.push(
        //         {
        //             "name": groupName,
        //             "channels": ["general"]
        //         }
        //     );
        //     // addUser(username, user);
        //     users[username] = user;
        //     console.log('Adding new user');
        // }
        // else {
        //     users[username].groups.push(
        //         {
        //             "name": groupName,
        //             "channels": ["general"]
        //         }
        //     );
        //     console.log('Adding existing user to group');
        // }
        writeUsers(users, () => {
            console.log(users);
            // getAllUsersInGroup(groupName, res);
            retrieveUsers((users) => {
                res.send(users);
            })
        });
    });
});


// create the super user
// not actively used, purpose is for use on fresh MongoDB installation
function createSuperUser() {
    const collection = db.collection(collectionName);
    collection.insertOne(
        {
            "username": "Super",
            "email": "super@admin.com",
            "superAdmin": true,
            "groupAdmin": true,
            "groups": [
                {
                    "name": "newbies",
                    "channels": [
                        "general",
                        "help"
                    ]
                },
                {
                    "name": "general",
                    "channels": [
                        "general",
                        "chitchat",
                        "topic of the day"
                    ]
                }
            ]
        }, (err, result) => {
            assert.strictEqual(null, err);
        }
    );
}