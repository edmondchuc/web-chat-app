import { Component, OnInit } from '@angular/core';
import { UsersService } from '../users.service';
import { Router } from "@angular/router";
import { ChangeDetectorRef } from "@angular/core";
import { ImageService } from '../image.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

// This component handles all the functionality in the dashboard view
export class DashboardComponent implements OnInit {
  // The user's details
  username:string = localStorage.getItem('username');
  email:string = '';
  emailField:string = '';
  isGroupAdmin = false;
  isSuperAdmin = false;

  // list of groups and channels
  groups = [];
  channels = [];

  // booleans to show groups or not
  // showGroupsBool = true;
  // showChannelsBool = false;
  title:string = 'Dashboard';

  // all of the user's data
  userData;

  // retrieve data on other users
  allGroups;
  allUsers;
  listOfUsers = [];

  // bind for new user to be admin
  usernameMakeAdmin:string = '';

  // the selected file for image upload
  selectedFile = null;

  // create new user fields
  newUserUsername = "";
  newUserPassword = "";
  newUserEmail = "";

  constructor(private usersService:UsersService, private router:Router, private ref: ChangeDetectorRef, private imgService:ImageService) {
    
   }

  ngOnInit() {
    console.log("Logged in as " + this.username);
    console.log(this.username);
    if(this.username === null) {
      alert('You are not logged in');
      this.router.navigateByUrl('/');
    } else {
      this.getUser();
    }
  }

  // get the file to be uploaded
  uploadSelected(event) {
    console.log('Selected image!');
    this.selectedFile = event.target.files[0];
  }
  
  // update the user with new data
  updateUser() {
    this.usersService.updateUser(this.username, this.userData).subscribe(
      data => {
        
      },
      err => {
        console.error;
      },
      () => {
        
      }
    );
  }

  // upload the image
  upload() {
    console.log('Uploading image!');
    const fd = new FormData();
    console.log(this.selectedFile);
    if(this.selectedFile === null) {
      alert('No image selected');
      return;
    }
    fd.append('image', this.selectedFile, this.selectedFile.name);
    this.imgService.upload(fd).subscribe(
      data => {
        console.log('Image upload received data');
        this.userData.profileImage = data.path;
        this.updateUser();
      },
      err => {
        console.error;
      },
      () => {
        console.log('Completed image upload');
      }
    );
  }

  // get the user's data
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
        this.getDataAllUsers();
      }
    );
  }

  // update the user's email
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

  // log out
  logOut() {
    this.router.navigateByUrl('/');
  }

  /**
   * Route to the group page
   * @param group The group object
   */
  viewGroup(group) {
    if(this.isGroupAdmin || this.isSuperAdmin) {
      console.log(`Viewing group ${group}`);
      localStorage.setItem('currentGroup', group);
      this.router.navigateByUrl('/group');
    }
    else {
      console.log(`Viewing group ${group.name}`);
      localStorage.setItem('currentGroup', group.name);
      this.router.navigateByUrl('/group');
    }
    
  }

  // the bind for the new group name
  createGroupName:string = '';

  // create a new group
  createGroup() {
    if(this.allGroups.includes(this.createGroupName)) {
      alert(`Group ${this.createGroupName} already exists`);
      return;
    }
    console.log(`Creating group ${this.createGroupName}`);

    this.usersService.createGroup(this.username, this.createGroupName)
    .subscribe(
      (data) => {
        console.log(JSON.stringify(data)); //TODO: It is printing array of Objects and not the actual data.
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

  // get all groups and their data
  getGroups() {
    if(this.isSuperAdmin || this.isGroupAdmin) {
      console.log('Admin fetching all groups');
      this.usersService.getGroups().subscribe(
        data => {
          this.allGroups = data;
          console.log(data);
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
    if(group === 'newbies' || group === 'general') {
      alert('Cannot remove these default groups from the system');
    }
    else {
      console.log(`Removing group ${group} from the system.`);
      this.usersService.removeGroup(group).subscribe(
        data => {
          console.log("Received data: " + data);
          this.allGroups = data;
        },
        err => {
          console.error
        },
        () => {
          console.log("Finished removing group " + group);
        }
      );
    }
  }

  // update the user's list 
  updateAllUsersList() {
    this.listOfUsers = [];
    // for(let user in this.allUsers) {
    //   this.listOfUsers.push(user);
    // }
    for(let i = 0; i < this.allUsers.length; i++) {
      this.listOfUsers.push(this.allUsers[i].username);
    }
  }

  // get all the data of the users
  getDataAllUsers() {
    if(this.isSuperAdmin) {
      this.usersService.getDataAllUsers().subscribe(
        data => {
          console.log('Received all user data from server');
          console.log(data);
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

  // remove a user from system
  removeUserFromSystem(username:string) {
    if(username === 'Super') {
      alert('Cannot remove user Super');
      return;
    }
    console.log(`Removing user from system ${username}`);
    this.usersService.removeUserFromSystem(username).subscribe(
      data => {
        console.log('Received data from removing user from system');
        this.allUsers = data;
        this.updateAllUsersList();
      },
      err => {
        console.error;
      },
      () => {
        console.log('Completed removing user from system');
      }
    );
  }

  // make a user a group admin
  userMakeAdminGroup() {
    if(this.usernameMakeAdmin === '') {
      alert('Username cannot be blank');
      return;
    }
    if(!this.listOfUsers.includes(this.usernameMakeAdmin)) {
      alert(`User ${this.usernameMakeAdmin} does not exist`);
      return;
    }
    for(let user of this.allUsers) {
      if(user.username === this.usernameMakeAdmin) {
        if(user.groupAdmin) {
          alert('This user is already a group admin');
          return;
        }
      }
    }
    console.log(`Making user ${this.usernameMakeAdmin} group admin`);
    this.usersService.makeUserGroupAdmin(this.usernameMakeAdmin).subscribe(
      data => {
        console.log('Received new data for making user an admin');
      },
      err => {
        console.error;
      },
      () => {
        console.log('Completed making user request');
      }
    );
  }

  // make a user a super admin
  userMakeAdminSuper() {
    if(this.usernameMakeAdmin === '') {
      alert('Username cannot be blank');
      return;
    }
    if(!this.listOfUsers.includes(this.usernameMakeAdmin)) {
      alert(`User ${this.usernameMakeAdmin} does not exist`);
      return;
    }
    for(let user of this.allUsers) {
      if(user.username === this.usernameMakeAdmin) {
        if(user.superAdmin) {
          alert('This user is already a super admin');
          return;
        }
      }
    }
    console.log(`Making user ${this.usernameMakeAdmin} super admin`);
    this.usersService.makeUserSuperAdmin(this.usernameMakeAdmin).subscribe(
      data => {
        console.log('Received new data for making user an admin');
      },
      err => {
        console.error;
      },
      () => {
        console.log('Completed making user request');
      }
    );
  }

  // create a new user
  createUser() {
    if(this.newUserUsername === "") {
      alert('Username field cannot be blank');
      return;
    }
    if(this.newUserPassword === "") {
      alert('Password field cannot be blank');
      return;
    }
    for(let user of this.allUsers) {
      if(user.username === this.newUserUsername) {
        alert('This user already exists');
        return;
      }
    }
    console.log('Creating new user!');
    // console.log(this.newUserUsername, this.newUserPassword, this.newUserEmail);
    this.usersService.createUser(this.newUserUsername, this.newUserPassword, this.newUserEmail).subscribe(
      data => {
        console.log(data);
      },
      err => {
        console.error;
      },
      () => {
        console.log();
        this.getDataAllUsers();
      }
    );
  }

}
