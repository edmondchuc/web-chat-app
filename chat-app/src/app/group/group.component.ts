import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { UsersService } from '../users.service';

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css']
})
export class GroupComponent implements OnInit {
  groupName:string = '';
  username:string = '';
  channels = [];

  isGroupAdmin = false;
  isSuperAdmin = false;

  createChannelName:string = '';

  userData;

  constructor(private router:Router, private usersService:UsersService) { 
    this.groupName = localStorage.getItem('currentGroup');
    this.username = localStorage.getItem('username');
    this.getUser();
  }

  getUser() {
    this.usersService.getUser(this.username).subscribe(
      data => {
        this.userData = data;
        this.isGroupAdmin = this.userData.groupAdmin;
        this.isSuperAdmin = this.userData.superAdmin;
      },
      err => {
        console.error
      },
      () => {
        console.log('\tUser retrieved')
        console.log(this.userData);

        // update channels list
        this.userData.groups.forEach(group => {
          if(group.name === this.groupName) {
            this.channels = group.channels;
          }
        });
      }
    );
  }

  ngOnInit() {
  
  }

  logOut() {
    this.router.navigateByUrl('/');
  }

  viewChannel(channel) {
    console.log(`Viewing channel ${channel}`);
    localStorage.setItem('currentChannel', channel);
    this.router.navigateByUrl('/channel');
  }

  createChannel() {
    if(this.createChannelName === '') {
      alert('New channel name cannot be empty');
      return;
    }
    console.log(`Creating new channel ${this.createChannelName}`);
    this.usersService.createChannel(this.username, this.groupName, this.createChannelName).subscribe(
      data => {
        console.log('New list of channels received');
        console.log(data);
        this.channels = data;
      },
      err => {
        console.error;
      },
      () => {
        console.log('Creating new channel completed');
      }
    );
  }

}
