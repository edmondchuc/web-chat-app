import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  username:string = localStorage.getItem('username');
  users:[] = []

  constructor(private http: HttpClient) { }

  ngOnInit() {
    console.log("Logged in as " + this.username);
    this.users = this.http.get('/api/users');
  }

}
