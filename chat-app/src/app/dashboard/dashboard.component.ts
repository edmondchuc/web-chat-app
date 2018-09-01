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

  userData;

  constructor(private usersService:UsersService, private router:Router) {
    this.getUsers();
   }

  ngOnInit() {
    console.log("Logged in as " + this.username);
  }

  getUsers() {
    this.usersService.getUsers(this.username).subscribe(
      data => {
        this.userData = data;
      },
      err => {
        console.error
      },
      () => {
        console.log('\tUsers retrieved')
        console.log(this.userData);

        // update data (email, groups, channels, admin privileges)
        this.email = this.userData.email;
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
}
