import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";

@Component({
  selector: 'app-channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.css']
})
export class ChannelComponent implements OnInit {
  channelName:string = '';
  username:string = '';

  constructor(private router:Router) { 
    this.channelName = localStorage.getItem('currentChannel');
    this.username = localStorage.getItem('username');
  }

  ngOnInit() {
  }

  logOut() {
    this.router.navigateByUrl('/');
  }

}
