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
  }

}
