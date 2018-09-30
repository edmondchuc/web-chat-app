# Web Chat App
This repository contains a real-time web chat application implemented using Node.js, Express, Socket.IO, RxJS and Angular. It contains users and admins with groups and channels.

## Status
This application currently holds the following functionality:  
### Group Admin
* Create groups
* Create channels within groups
* Create/invite users to a channel
* Remove groups, channels and users from channels

### Super Admin
* Assign users with Group admin or Super admin roles
* Also has group admin privileges
* Can remove users from the chat application

### Users
* Identified by username
* One persistent user called __Super__ who is a Super admin
* Can assign an email address to itself

## Git Repository Layout
The root directory of the repository contains the `README.md` file and the files necessary for Node.js. All of the Node.js logic is contained in a single file called `index.js`. The root directory also contains a sub-directory called `chat-app` which contains all the files necessary for Angular.  
  
The `chat-app` directory contains all the auto-generated files. The project's files are contained inside the `src/app` sub-directory. In here, there are four directories, each containing its respective Angular Component. It also contains TypeScript files for Angular services.  
  
The approach of using Git in this project was to commit changes at any time a new functionality was added. An example would be a task to add functionality for a user. The task would be broken down into sub-tasks and when a sub-task has been implemented, a commit would be added to Git.  

Ensure that the root directory of the Git repository contains an `images` directory. This directory is where the uploaded images are saved and statically served back to the user. 
  
## Data Structures
The main data structures that were used in this project were JavaScrict `Array` objects and JavaScript `Object` objects.  
  
The JavaScript `Array` was mainly used to store things that required easy iterator behaviour. Some use cases:  
* List of users
* List of channels
* List of groups

### Users
The JavaScript `Object` was mainly used to store the user data in a JSON file. The basic template of a user `Object` looks like this:
```javascript
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
```

The user's username would be the key to the `Object` value and each user was stored in a `users.json` file which contained an `Object` of users as properties. 

JSON was also used to store the (data of the) body parameters of POST requests where the request or the response was encoded in JSON. 

### Messages
The data structure to store messages were also done by using a JSON `Object`. 
```javascript
let content = {
      "username": username,
      "groupName": groupName,
      "channelName": channelName,
      "message": message,
      "profileImage": profileImage,
      "isFile": isFile
    }
```
The username is used to show the user's name who sent the message. The group and channel name are unique IDs for the message. The message itself is a string of text. The `profileImage` is a path string to the statically served profile image on the server. The `isFile` is a boolean which denotes whether this message is a text message or an image file being sent.

## Separation of Responsibilities
The chat application is separated into two parts, the client and the server. The client is created using the Angular framework. The client manages the models and views (components in Angular), which involves the dashboard, groups, channels and login. These components make up the single-page application (SPA) of the web chat app. 

The server (back-end) is RESTful because it does not maintain any state. It has a number of routes which manages CRUD actions. The server connects to a MongoDB database which contains the data on the users and their messages, channels, groups and other information. 

## REST API
The REST API on the Node.js server was implemented using the Express library. 

### Routes
#### GET: '/api/user'
- __Description:__ 
  - Get user data as a JavaScript `Object` on a user.
- __Parameters:__ 
  - _username:string_ - The username of the user to retrieve the data on.
- __Return value:__ 
  - The user data `Object`

#### GET: '/api/groups'
- __Description:__ 
  - Get all the groups that exist in the system.
- __Parameters:__
  - None
- __Return value:__
  - An array of strings of group names

#### POST: '/api/email'
- __Description:__ 
  - Update the email of the user.
- __Parameters:__
  - _username:string_ The username of the user.
  - _email:string_ The email of the user to update
- __Return value:__
  - Returns the request body back to the user to confirm it was successful.

#### DELETE: 'api/removeGroup/:groupName'
- __Description:__ 
  - Remove the group from the system.
- __Parameters:__
  - _groupName:string_ The name of the group to remove.
- __Return value:__
  - The `Object` of users.

### POST: '/api/createGroup'
- __Description:__ 
  - Create a new group in the system.
- __Parameters:__
  - _username:string_ The user's username.
  - _groupName:string_ The group name to create
- __Return value:__
  - An array of all groups in the system.

### POST: '/api/channel/create'
- __Description:__
  - Create a new channel within a group.
- __Parameters:__
  - _groupName:string_ The group that the new channel belongs to.
  - _channelName:string_ The name of the new channel.
- __Return value:__
  - A new array of channels in the group.

### DELETE: '/api/channel/remove/:username.:groupName.:channelName'
- __Description:__
  - Remove a channel of a group.
- __Parameters:__
  - _groupName:string_ The group name.
  - _channelName:string_ The channel name.
- __Return value:__
  - Return a new array of the channels in the group.

### GET: '/api/:group/channels'
- __Description:__
  - Get all the channels in a group
- __Parameters:__
  - _groupName:string_ The channels of the group name.
- __Return value:__
  - An array of channel names.

### GET: '/api/:groupName/users'
- __Description:__
  - Get all the users in a group
- __Parameters:__
  - _groupName:string_ The group name to get users.
- __Return value:__
  - All the users in the group.

### GET '/api/users/all'
- __Description:__
  - Get all the user data in the system.
- __Parameters:__
  - _None_
- __Return value:__
  - Returns all the user data object.

### DELETE: '/api/remove/:groupName.:username'
- __Description:__
  - Remove a user from a group
- __Parameters:__
  - _username:string_ The username of the user to remove.
  - _groupName:string_ The group where the user will be removed.
- __Return value:__
  - Return the updated list of users in the group.

### POST: '/api/groups/add'
- __Description:__
  - Add a user to a group.
- __Parameters:__
  - _username:string_ The username of the user to add.
  - _groupName:string_ The group to add the user.
- __Return value:__
  - Return the user data of all the users in the system.

### POST: '/api/group/channel/add'
- __Description:__
  - Add a new user to an existing channel in a group.
- __Parameters:__
  - _username:string_ The username of the user to add
  - _groupName:string_ The group the user will be added to.
  - _channelName_ The channel the new user will be added to.
- __Return value:__
  - Return the object of all the user data.

### DELETE: '/api/removeUserFromChannel/:groupName.:channelName.:username'
- __Description:__
  - Remove a user from a channel in a group.
- __Parameters:__
  - _username:string_ The username of the user to remove.
  - _groupName:string: The name of the group the channel and the user belongs to.
  - _channelName:string_ The channel that the user belongs to.
- __Return value:__
  - Return the object of all the user data.

### DELETE: '/api/removeUserFromSystem/:username'
- __Description:__
  - Remove a user from the system.
- __Parameters:__
  - _username:string_ The username of the user to remove.
- __Return value:__
  - Return the object of all the user data.

### POST: '/api/makeUserGroupAdmin'
- __Description:__
  - Add group admin role to a user.
- __Parameters:__
  - _username:string_ The username of a user to add admin role to.
- __Return value:__
  - Return the object of all the user data.

### POST: '/api/makeUserSuperAdmin'
- __Description:__
  - Add super admin role to a user.
- __Parameters:__
  - _username:string_ The username of a user to add admin role to.
- __Return value:__
  - Return the object of all the user data.

## Angular Architecture
The Angular application contains _components_, _services_ and _routes_.

### Components
There were four components that were used in this application. 
- channel
- dashboard
- group
- login

#### Channel
The Channel component contains all the user-interface features of a chat channel. It contains a list of users, the current channel name, the chat box and the textfield and button to send messages. 

#### Dashboard
The Dashboard component contains all the groups available to the user, their username, their current email, an input field to update their email and a log out button. 

For Group admins, there's a form to create new groups and buttons to remove groups. Note that default groups _newbies_ and _general_ cannot be removed. 

For a Super admin, they can see the entire list of users in the system. Super admins can remove users from the system (except the persistent _Super_ user) and assign Group or Super admin roles to existing users. 

#### Group
The Group component contains all the information for groups. This includes the group name, the logged in user, the available channels to the user and a log out button. 

Group admins will have an input form to add new channels and buttons to remove channels. Note, default channel _general_ cannot be removed (however an admin can remove a group in the Dashboard component).

Group admins can also add users to the group and remove users from the group. Adding a non-existent user simply creates the user and adds them to the group. Adding a user to the group automatically adds them to the default channel _general_. 

#### Login
The Login component allows a user to log in. Any user can type any username and log in. User data will persist after they log out. If a username does not exist in the system, the server will seamlessly create the user in the background. 

### Services
#### Image
The image service handles the upload of images to the server. It contains a function that performs a POST request to the server. 

#### Socket
The socket service handles the web socket communications in real-time. The sockets contain three rooms:
* join
* leave
* new-message

Join notifies the server that the user has joined the channel. Leave notifies the server that the user has left the channel. New-message is used for new messages, which may be text or images. 

The server responds in the message room, broadcasting only to the room which it originally received from. 

#### Users
The users service contains the requests for all dashboard, groups and channel data manipulation to and from the server. 

## MongoDB
### Collections
* users - Each document is the data of the users. This includes their username, their admins status, their groups and channels.
* messages - Each document is a message that was sent in a channel.

## Miscellaneous 
### Modules Used
* `npm init`
* `npm install express`
* `npm install socket.io`
* `npm install body-parser`
* `npm install @types/socket.io-client` - SocketIO for client
* `npm install formidable`

### Socket.IO Bug
* In `polyfill.ts`, add:
```javascript
(window as any).global = window;
```

### JSON Body-Parser
```javascript
const bodyParser = require('body-parser')
app.use(bodyParser.json())
```

## Contact
Author: Edmond Chuc  
Website: www.edmondchuc.com  
Repository: https://github.com/edmondchuc/web-chat-app


