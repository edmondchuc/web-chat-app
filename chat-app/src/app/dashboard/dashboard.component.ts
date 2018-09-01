import { Component, OnInit } from '@angular/core';
import { UsersService } from '../users.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  username:string = localStorage.getItem('username');
  email:string = '';

  userData;

  constructor(private usersService:UsersService) {
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
        this.userData.email;
      }
    );
  }

  updateEmail() {
    this.usersService.updateEmail(this.username, this.email);
  }

}
