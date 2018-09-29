import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { UsersService } from '../users.service';
import { SocketService } from '../socket.service';

@Component({
  selector: 'app-channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.css']
})
export class ChannelComponent implements OnInit {
  channelName:string = '';
  username:string = '';
  groupName:string = '';

  userData;
  isGroupAdmin = false;
  isSuperAdmin = false;

  allUsers;

  listOfUsers = [];

  newUsername:string = '';

  messages = ['Start of the conversation...', 'Some sample chat text'];
  message:string = '';

  constructor(private router:Router, private usersService:UsersService, private socketService:SocketService) { 
    this.channelName = localStorage.getItem('currentChannel');
    this.username = localStorage.getItem('username');
    this.groupName = localStorage.getItem('currentGroup');
    this.getUser();
  }

  ngOnInit() {
    this.socketService.getMessages().subscribe((message) => {
      this.messages.push(message.message);
    });
  }

  logOut() {
    this.router.navigateByUrl('/');
  }

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
      // if(this.allUsers.hasOwnProperty(user)) {
      //   for(let group of this.allUsers[user].groups) {
      //     if(group.name === this.groupName) {
      //       if(group.channels.includes(this.channelName)) {
      //         this.listOfUsers.push(user);
      //       }
      //     }
      //   }
      // }
    }
  }

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

  sendMessage() {
    console.log(`User typed: ${this.message}`);
    this.socketService.sendMessage(this.username, this.groupName, this.channelName, this.message);
    this.message = '';
  }
}
