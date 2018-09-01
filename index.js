const express = require('express');
const app = express();
const http = require('http');
const server = http.Server(app);
const socketIO = require('socket.io');
const io = socketIO(server);
const fs = require('fs');

app.use(express.static(__dirname + '/web-chat/dist/web-chat'));

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

// read user database
let users;
fs.readFile('users.json', (error, data) => {
    if(error) throw error;
    users = JSON.parse(data);
    // console.log(users.Super.groups[0].newbies.channels);
    
    for(let i = 0; i < users.length; i++) {
        console.log(users[i].name);
    }
});
// let users = JSON.parse(data);
// console.log(users["Super"].groups[0]);



// let bob = {
//     "email": "bob123@gmail.com",
//     "superAdmin": false,
//     "groupAdmin": false,
//     "groups": [
//         {
//             "newbies": 
//             {
//                 "channels": ["general", "help"]
//             }
//         },
//         {
//             "programming": {
//                 "channels": ["javascript", "typescript"]
//             }
//         }
//     ]
// }