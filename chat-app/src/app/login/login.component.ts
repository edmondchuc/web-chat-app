import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username:string = "";

  constructor(private router:Router) { }

  ngOnInit() {
  }

  login() {
    localStorage.clear();
    localStorage.setItem("username", this.username);
    this.router.navigateByUrl('/dashboard');
  }

}
