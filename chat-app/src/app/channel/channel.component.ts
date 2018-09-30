import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { UsersService } from '../users.service';
import { SocketService } from '../socket.service';
import { ImageService } from '../image.service';

@Component({
  selector: 'app-channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.css']
})

// This component handles all the functionalities of a channel
export class ChannelComponent implements OnInit {
  // user details stored in localStorage
  channelName:string = '';
  username:string = '';
  groupName:string = '';

  // other user details
  userData;
  isGroupAdmin = false;
  isSuperAdmin = false;

  // data on all users
  allUsers;

  // list of users as strings
  listOfUsers = [];

  // create new user bind
  newUsername:string = '';

  // the messages of the channel
  messages;
  message:string = '';

  // upload files
  isFile = false;
  selectedFile = null;

  constructor(private router:Router, private usersService:UsersService, private socketService:SocketService, private imgService:ImageService) { 
    this.channelName = localStorage.getItem('currentChannel');
    this.username = localStorage.getItem('username');
    this.groupName = localStorage.getItem('currentGroup');
    this.getUser();
  }

  ngOnInit() {
    this.usersService.getChannelMessages(this.groupName, this.channelName).subscribe(
      data => {
        console.log("Received data for getting messages");
        console.log(data);
        this.messages = data;
      },
      err => {
        console.error();
      },
      () => {
        console.log("Getting messages for channel");
      }
    );

    setTimeout(() => {
      this.socketService.joinChannel();
      this.socketService.getMessages().subscribe((message) => {
        this.messages.push(message);
      });
    }, 100);
    
  }

  // log the user out
  logOut() {
    this.router.navigateByUrl('/');
  }

  // get this user's data
  getUser() {
    this.usersService.getUser(this.username).subscribe(
      data => {
        this.userData = data;
        console.log('Setting user data');
        this.isGroupAdmin = this.userData.groupAdmin;
        this.isSuperAdmin = this.userData.superAdmin;
        console.log(`\tThis user is a group admin: ${this.isGroupAdmin}`);
        console.log(`\tThis user is a super admin: ${this.isSuperAdmin}`);
        this.getDataAllUsers();
      },
      err => {
        console.error
      },
      () => {
        console.log('\tUser retrieved')
      }
    );
  }

  // update the list of users in this channel
  updateAllUsersList() {
    this.listOfUsers = [];
    for(let user of this.allUsers) {
      for(let group of user.groups) {
        if(group.name === this.groupName) {
          if(group.channels.includes(this.channelName)) {
            this.listOfUsers.push(user.username);
          }
        }
      }
    }
  }

  // get the data on all users in this channel
  getDataAllUsers() {
    this.usersService.getDataAllUsers().subscribe(
      data => {
        console.log('Received all user data from server');
        // console.log(data);
        this.allUsers = data;
        this.updateAllUsersList();
      },
      err => {
        console.error;
      },
      () => {
        console.log('Completed getting all user data from server');
      }
    );
  }

  // add a new user to the channel
  addUserToChannel() {
    if(this.channelName === 'general') {
      alert('Cannot add users to default channel: general');
      return;
    }
    if(this.newUsername === '') {
      alert('New user\'s username cannot be empty');
      return;
    }
    if(this.groupName === 'newbies' || this.groupName === 'general') {
      alert('Cannot add users in the default channels: newbies and general')
      return;
    }
    if(this.listOfUsers.includes(this.newUsername)) {
      alert(`User ${this.newUsername} is already in the channel`);
      return;
    }
    console.log(`Adding ${this.newUsername} to channel ${this.channelName}`);
    this.usersService.addUserToChannel(this.newUsername, this.groupName, this.channelName).subscribe(
      data => {
        console.log('Received data from adding user to channel');
        this.allUsers = data;
        this.updateAllUsersList();
      },
      err => {
        console.error;
      },
      () => {
        console.log('Completed adding user to channel');
      }
    );
  }

  // remove the user from the channel
  removeUser(username:string) {
    if(this.groupName === 'newbies' || this.groupName === 'general') {
      alert('Cannot remove users in this default channel');
      return;
    }
    if(username === this.username) {
      alert('Cannot remove yourself');
      return;
    }
    // check if they are an admin, if not, then proceed
    for(let user of this.allUsers) {
      if(user.username === username) {
        if(user.groupAdmin) {
          alert(`Cannot remove admin user ${username}`);
          return;
        }
      }
    }
    if(this.channelName === 'general') {
      alert('Cannot remove users from the default channel: general');
      return;
    }
    console.log(`Removing user ${username}`);
    this.usersService.removeUserFromChannel(username, this.groupName, this.channelName).subscribe(
      data => {
        console.log('Received data from removing user from channel');
        this.allUsers = data;
        this.updateAllUsersList();
      },
      err => {
        console.error;
      },
      () => {
        console.log('Completed removing user from channel request');
      }
    );
  }

  // send a new message to the channel
  sendMessage() {
    console.log(`User typed: ${this.message}`);
    this.socketService.sendMessage(this.username, this.groupName, this.channelName, this.message, this.userData.profileImage, this.isFile);
    this.message = '';
    this.isFile = false;
  }

  // select the file to be uploaded
  uploadSelected(event) {
    console.log('Selected image!');
    this.selectedFile = event.target.files[0];
  }

  // upload the file
  upload() {
    console.log('Uploading image!');
    const fd = new FormData();
    fd.append('image', this.selectedFile, this.selectedFile.name);
    console.log(this.selectedFile.name);
    this.imgService.upload(fd).subscribe(
      data => {
        console.log('Image upload received data');
        // console.log("path of image file: " + data.path);
        // once data comes back, set this.mesage to the data path and set isFile to true
        // send a socket message
        this.message = data.path;
        this.isFile = true;
        this.sendMessage();
      },
      err => {
        console.error;
      },
      () => {
        console.log('Completed image upload');
      }
    );
  }


}
