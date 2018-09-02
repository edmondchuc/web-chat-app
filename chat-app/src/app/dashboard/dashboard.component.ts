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

  // groups retrieved if admin
  allGroups;

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

        this.getGroups(); // get the groups if this user is admin
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
    console.log(`Creating group ${this.createGroupName}`);

    this.usersService.createGroup(this.username, this.createGroupName)
    .subscribe(
      (data) => {
        data = JSON.stringify(data);
        console.log('POST call successful. Sent ' + data);
        this.allGroups = data;
        console.log(this.allGroups);
      },
      (err) => {
        console.log('Error in POST call. Error: ' + err);
      },
      () => {
        console.log('POST call completed.');
      }
    );
  }

  getGroups() {
    if(this.isSuperAdmin || this.isGroupAdmin) {
      console.log('Admin fetching new groups');
      this.usersService.getGroups().subscribe(
        data => {
          this.allGroups = data;
          console.log(this.allGroups);
        },
        err => {
          console.error
        },
        () => {
          console.log('Finished retrieving groups for admin user');
        }
      )
    }
  }

  removeGroup(group) {
    if(group.name === 'newbies' || group.name === 'general') {
      alert('Cannot remove these default groups from the system');
    }
    else {
      console.log(`Removing group ${group.name} from the system.`);
      this.usersService.removeGroup(group.name).subscribe(
        data => {
          console.log("Received data: " + data);
          this.allGroups = data;
        },
        err => {
          console.error
        },
        () => {
          console.log("Finished removing group " + group.name);
        }
      );
    }
  }

}
