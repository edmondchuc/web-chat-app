import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";
import { UsersService } from "../users.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

// This component handles all the functionality of the login page
export class LoginComponent implements OnInit {
  username:string = "";
  password:string = "";

  constructor(private router:Router, private userService:UsersService) { }

  ngOnInit() {
    localStorage.clear();
  }

  // log the user in
  login() {
    if(this.username === "") {
      alert("Username field cannot be empty");
      return;
    }
    if(this.password === "") {
      alert("Passworld field cannot be empty");
      return;
    }
    
    // check password via POST request
    this.userService.validateUser(this.username, this.password).subscribe(
      data => {
        console.log('Received data from validation');
        console.log(data);
        if(data['success'] === true) {
          localStorage.setItem("username", this.username);
          this.router.navigateByUrl('/dashboard');
        } else {
          alert('Invalid username or password');
        }
      },
      err => {
        console.error;
      },
      () => {
        console.log('completed validation');
      }
    );
  }

}
