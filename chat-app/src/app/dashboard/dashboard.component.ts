import { Component, OnInit } from '@angular/core';
import { UsersService } from '../users.service';
import { Router } from "@angular/router";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  username:string = localStorage.getItem('username');
  email:string = '';
  emailField:string = '';
  groups = [];
  channels = [];
  showGroupsBool = true;
  showChannelsBool = false;
  title:string = 'Dashboard';

  userData;

  constructor(private usersService:UsersService, private router:Router) {
    this.getUser();
   }

  ngOnInit() {
    console.log("Logged in as " + this.username);
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

        // update data (email, groups, channels, admin privileges)
        this.email = this.userData.email;
        this.groups = this.userData.groups
        // this.showGroups();
      }
    );
  }

  updateEmail() {
    this.usersService.updateEmail(this.username, this.emailField)
    .subscribe(
      (data) => {
        data = JSON.stringify(data);
        console.log('POST call successful. Sent ' + data);
        this.email = this.emailField;
        this.emailField = '';
      },
      (err) => {
        console.log('Error in POST call. Error: ' + err);
      },
      () => {
        console.log('POST call completed.');
      }
    );
  }

  logOut() {
    this.router.navigateByUrl('/');
  }

  /**
   * Route to the group page
   * @param group The group object
   */
  viewGroup(group) {
    localStorage.setItem('currentGroup', group.name);
    this.router.navigateByUrl('/group');
  }

  // viewChannel(group) {
  //   this.channels = group.channels;
  //   console.log(this.channels);
  //   this.showChannels(group);
  // }

  // private showChannels(group) {
  //   this.title = `Group: ${group.name}`;
  //   this.showGroupsBool = false;
  //   this.showChannelsBool = true;
  // }

  // private showGroups() {
  //   this.title = 'Dashboard'
  //   this.showGroupsBool = true;
  //   this.showChannelsBool = false;
  }


}
