import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { UsersService } from '../users.service';

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

  constructor(private router:Router, private usersService:UsersService) { 
    this.channelName = localStorage.getItem('currentChannel');
    this.username = localStorage.getItem('username');
    this.groupName = localStorage.getItem('currentGroup');
    this.getUser();
  }

  ngOnInit() {
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
    for(let user in this.allUsers) {
      if(this.allUsers.hasOwnProperty(user)) {
        for(let group of this.allUsers[user].groups) {
          if(group.name === this.groupName) {
            if(group.channels.includes(this.channelName)) {
              this.listOfUsers.push(user);
            }
          }
        }
      }
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
}
