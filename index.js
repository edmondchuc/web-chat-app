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
    
    const collection = db.collection(collectionName);
    collection.findOne({"username": username}, (err, result) => {
        assert.strictEqual(null, err);
        // console.log(result.groups);
        // console.log(`email? ${result['email']}`);
        res.send(result);
    });
});

// return an array of group names as strings
app.get('/api/groups', (req, res) => {
    console.log('GET request at /api/groups');

    const collection = db.collection(collectionName);
    collection.find().toArray( (err, result) => {
        assert.strictEqual(null, err);
        
        let groups = [] // the array of groups to return

        // loop through each user and add the unique group name to the groups array
        result.forEach( user => {
            user.groups.forEach( group => {
                if(!groups.includes(group.name)) {
                    console.log(group.name);
                    groups.push(group.name);
                }
            });
        })

        res.send(groups);
    });
});

// Update email of client
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

// admin creates a group
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
                    res.send(result[0].groups);
                })
            }, 200);
        });
    });
});

// admin removes a group




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