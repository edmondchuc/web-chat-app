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

  isGroupAdmin = false;
  isSuperAdmin = false;

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
        this.isGroupAdmin = this.userData.groupAdmin;
        this.isSuperAdmin = this.userData.superAdmin;
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
    console.log(`Viewing group ${group.name}`);
    localStorage.setItem('currentGroup', group.name);
    this.router.navigateByUrl('/group');
  }

  createGroupName:string = '';

  createGroup() {
    console.log(`creating group ${this.createGroupName}`);
  }

}
