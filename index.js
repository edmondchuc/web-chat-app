const express = require('express');
const app = express();
const http = require('http');
const server = http.Server(app);
const socketIO = require('socket.io');
const io = socketIO(server);
const fs = require('fs');
const bodyParser = require('body-parser')
app.use(bodyParser.json())
const formidable = require('formidable');

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

    // start the server
    app.use(express.static(__dirname + '/chat-app/dist/chat-app'));
    app.use("/images", express.static(__dirname + '/images'));
    // const port = 3000;
    // app.listen(port, () => console.log(`Server listening on port ${port}`));
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`Server started on port: ${port}`);
    });
});

io.on('connection', (socket) => {
    // console.log('Visitor connected');

    // join room
    socket.on('join', (content) => {
        console.log('someone joined');
        console.log(content);
        const collection = db.collection("messages");
        collection.insertOne(content);
        let room = content.groupName + content.channelName;
        socket.join(room);
        // socket.broadcast.in(room).emit(content);
        io.sockets.in(room).emit('message', content);
    });

    socket.on('leave', (content) => {
        console.log('Someone left');
        console.log(content);
        const collection = db.collection("messages");
        collection.insertOne(content);
        let room = content.groupName + content.channelName;
        socket.leave(room);
        // socket.broadcast.in(room).emit(content);
        io.sockets.in(room).emit('message', content);
    });

    socket.on('new-message', (content) => {
        console.log('NEW MESSAGE:');
        console.log(content);
        const collection = db.collection("messages");
        collection.insertOne(content);
        let room = content.groupName + content.channelName;
        // io.emit('message', content);
        io.sockets.in(room).emit('message', content);
    });

});

// get messages for particular channel in a group
app.get('/api/channel/messages', (req, res) => {
    console.log('GET request at /api/channel/messages');
    const collection = db.collection("messages");
    const groupName = req.query.groupName;
    const channelName = req.query.channelName;
    collection.find({"groupName": groupName, "channelName": channelName}).toArray( (err, result) => {
        assert.strictEqual(err, null);
        res.send(result);
    });
});

// upload image
app.post('/api/image/upload', (req, res) => {
    console.log('POST request at /api/image/upload');
    let form = new formidable.IncomingForm({ uploadDir: './images' });
    form.keepExtensions = true;

    form.on('error', (err) => {
        // throw err;
        console.log('error uploading fiel');
        res.send({
            result: "failed",
            data: {},
            numberOfImages: 0,
            message: "Cannot upload images. Error: " + err
        });
    });

    form.on('fileBegin', (name, file) => {
        file.path = form.uploadDir + "/" + file.name;
        console.log('File path: ' + file.path);
    });

    form.on('file', (field, file) => {
        console.log('woo, uploaded file');
        res.send({
            result: 'OK',
            data: {'filename': file.name, 'size': file.size},
            numberOfImages: 1,
            message: 'upload successful',
            path: file.path
        })
    });

    form.parse(req);
});

/**
 * The user data default template
 */
class UserDataTemplate {
    constructor() {
        this.username = "";
        this.password = "password";
        this.email = "";
        this.superAdmin = false;
        this.groupAdmin = false;
        this.profileImage = "images/default/profile.gif";
        this.groups = [
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
};

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
    console.log(userData);
    const collection = db.collection(collectionName);
    collection.find().toArray( (err, result) => {
        assert.strictEqual(err, null);
        let exists = false;
        for(user of result) {
            if(user.username === userData.username) exists = true;
        }
        if(!exists) {
            collection.insertOne(userData, (err, result) => {
                assert.strictEqual(err, null);
            });
        }
    });
}

// update user profile image
app.post('/api/user/update', (req, res) => {
    console.log('POST request at /api/user/update');
    const collection = db.collection(collectionName);
    
    let imagePath = req.body.profileImage;
    imagePath = imagePath.slice(2);
    console.log(imagePath);
    collection.updateOne({"username": req.body.username}, {$set: {"profileImage": imagePath}});
    res.send({"success": true});
});

// Return user data back to client
app.get('/api/user', (req, res) => {
    // createSuperUser();
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
            userData = new UserDataTemplate();
            userData.username = username;
            addUser(userData)
            console.log(`\tResponding with data on user: ${username}`);
            setTimeout(() => {
                res.send(userData);
            }, 100);
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
            setTimeout( () => {
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
            }, 100);
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
        // console.log(users);
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
            let user = new UserDataTemplate();
            user.username = username;
            user.groups.push(
                { "name": groupName, "channels": ["general"] }
            );
            addUser(user);
        }
        writeUsers(users, () => {
            console.log(users);
            // getAllUsersInGroup(groupName, res);
            setTimeout(() => {
                retrieveUsers((users) => {
                    res.send(users);
                })
            }, 100);
            
        });
    });
});

// add new user to a channel in a group TODO: duplicate key issue when creating new user
app.post('/api/group/channel/add', (req, res) => {
    console.log('POST request at /api/group/channel/add');
    // console.log(req.body);
    const username = req.body.username;
    const groupName = req.body.groupName;
    const channelName = req.body.channelName;
    retrieveUsers((users) => {
        let exists = false;
        for(let user of users) {
            if(user.username === username) {
                exists = true;
                break;
            }
        }
        if(!exists) {
            console.log('Creating user');
            let user = new UserDataTemplate();
            user.username = username;
            user.groups.push(
                {
                    "name": groupName,
                    "channels": ["general", channelName]
                }
            );
            console.log(user);
            users.push(user);
            addUser(user);
        }
        else { // if they do exist
            exists = false; // now use it to check if group exists
            for(let user of users) {
                if(user.username === username) {
                    for(let group of user.groups) {
                        if(group.name === groupName) {
                            exists = true;
                            group.channels.push(channelName);
                            break;
                        }
                    }
                }
            }
            if(!exists) {
                for(let user of users) {
                    if(user.username === username) {
                        user.groups.push(
                            {
                                "name": groupName,
                                "channels": ["general", channelName]
                            }
                        );
                    }
                }
            }
            console.log('WERITING USERS TSO SLETSI');
            writeUsers(users, () => {
                // console.log(users);
                // retrieveUsers((users) => {
                //     res.send(users);
                // })
            });
        }
        setTimeout(()=> {
            res.send(users)
        },100);
    });
});

// remove user from the system
app.delete('/api/removeUserFromSystem/:username', (req, res) => {
    console.log('DELETE request at /api/removeUserFromSystem/:username');
    const username = req.params.username;
    retrieveUsers((users) => {
        const collection = db.collection(collectionName);
        collection.deleteOne({"username": username}, (err, result) => {
            assert.strictEqual(err, null);
            retrieveUsers( (data) => {
                res.send(data);
            });
        });
        // users[username] = undefined;
        
    });
});

// remove user from channel
app.delete('/api/removeUserFromChannel/:groupName.:channelName.:username', (req, res) => {
    console.log('DELETE request at /api/remove/:groupName.:channelName.:username');
    const username = req.params.username;
    const groupName = req.params.groupName;
    const channelName = req.params.channelName;
    retrieveUsers((users) => {
        for(user of users) {
            if(user.username === username) {
                for(group of user.groups) {
                    if(group.name === groupName) {
                        group.channels.splice(group.channels.indexOf(channelName), 1);
                    }
                }
            }
        }
        // for(group of users[username].groups) {
        //     if(group.name === groupName) {
        //         console.log(group.channels);
        //         console.log(group.channels.indexOf(channelName));
        //         group.channels.splice(group.channels.indexOf(channelName), 1);
        //     }
        // }
        writeUsers(users, () => {
            setTimeout(() => {
                res.send(users);
            }, 100);
        });
    });
});

// make a user a group admin // TODO: check if this works
app.post('/api/makeUserGroupAdmin', (req, res) => {
    console.log('POST request at /api/makeUserGroupAdmin');
    const username = req.body.username;
    console.log(username);
    retrieveUsers((users) => {
        for(let user of users) {
            if(user.username === username) {
                user.groupAdmin = true;
            }
        }
        writeUsers(users, () => {
            setTimeout(() => {
                res.send(users);
            }, 100);
        });
    });
});

// make a user a super admin
app.post('/api/makeUserSuperAdmin', (req, res) => {
    console.log('POST request at /api/makeUserSuperAdmin');
    const username = req.body.username;
    console.log(username);
    retrieveUsers((users) => {
        // users[username].superAdmin = true;
        // users[username].groupAdmin = true;

        for(let user of users) {
            if(user.username === username) {
                user.groupAdmin = true;
                user.superAdmin = true;
            }
        }
        writeUsers(users, () => {
            setTimeout(() => {
                res.send(users);
            }, 100);
        });
    });
});

app.post('/api/user/validate', (req, res) => {
    console.log("POST request at /api/user/validate");
    let username = req.body.username;
    let password = req.body.password;

    console.log(username, password);
    const collection = db.collection(collectionName);
    collection.find({"username": username}).toArray( (err, result) => {
        // assert.strictEqual(err, null);
        console.log(result);

        // no user found
        if(result.length === 0) {
            res.send({"success": false});
        } else {
            // user found, check for password
            let storedPassword = result[0].password;
            if(password === storedPassword) {
                res.send({"success": true});
            } else {
                res.send({"success": false});
            }
        }
    });
});

app.post('/api/user/create', (req, res) => {
    console.log('/api/user/create');
    let user = req.body;
    // console.log(user);
    createUser(user.username, user.password, user.email);
    res.send({"success": true});
});

function createUser(username, password, email) {
    const collection = db.collection(collectionName);
    collection.insertOne(
        {
            "username": username,
            "password": password,
            "email": email,
            "superAdmin": false,
            "groupAdmin": false,
            "profileImage": "images/default/profile.gif",
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

app.post('/api/super/user/create', (req,res) => {
    createSuperUser();
});

// create the super user
// not actively used, purpose is for use on fresh MongoDB installation
function createSuperUser() {
    const collection = db.collection(collectionName);
    collection.insertOne(
        {
            "username": "Super",
            "password": "password",
            "email": "super@admin.com",
            "superAdmin": true,
            "groupAdmin": true,
            "profileImage": "images/default/profile.gif",
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