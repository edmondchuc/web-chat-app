import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {Observable, of} from 'rxjs';
import { FormGroupName } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private http:HttpClient) { }

  genHeadersJSON() {
    return {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
  }

  getUser(username:string) {
    return this.http.get('api/user', {
      params: {
        username: username
      }
    });
  }

  updateEmail(username:string, email:string) {
    let body = {
      'username': username,
      'email': email
    };
    return this.http.post(`api/email`, JSON.stringify(body), this.genHeadersJSON());
  }

  getGroups() {
    return this.http.get('api/groups');
  }

  createGroup(username:string, groupName:string) {
    let body = {
      'username': username,
      'groupName': groupName
    };
    return this.http.post('api/createGroup', JSON.stringify(body), this.genHeadersJSON());
  }

  removeGroup(groupName:string) {
    return this.http.delete('api/removeGroup/' + groupName);
  }

  createChannel(username:string, groupName:string, channelName:string) {
    let body = {
      'username': username,
      'groupName': groupName,
      'channelName': channelName
    };
    return this.http.post('api/channel/create', JSON.stringify(body), this.genHeadersJSON());
  }

  removeChannel(username:string, groupName:string, channelName:string) {
    return this.http.delete('api/channel/remove/' + username + '.' + groupName + '.' + channelName);
  }

  getChannels(groupName:string) {
    return this.http.get('api/' + groupName + '/channels');
  }

  getGroupUsers(groupName:string) {
    return this.http.get('api/' + groupName + '/users');
  }

  getDataAllUsers() {
    return this.http.get('api/users/all');
  }

  removeUserInGroup(username:string, groupName:string) {
    return this.http.delete('api/remove/' + groupName + '.' + username);
  }

  addUserToGroup(username:string, groupName:string) {
    let body = {
      "username": username,
      "groupName": groupName
    }
    return this.http.post('api/groups/add', JSON.stringify(body), this.genHeadersJSON());
  }

  addUserToChannel(username:string, groupName:string, channelName:string) {
    let body = {
      "username": username,
      "groupName": groupName,
      "channelName": channelName
    };
    return this.http.post('api/group/channel/add', JSON.stringify(body), this.genHeadersJSON());
  } 

  removeUserFromChannel(username:string, groupName:string, channelName:string) {
    return this.http.delete('api/removeUserFromChannel/' + groupName + '.' + channelName + '.' + username);
  }

  removeUserFromSystem(username:string) {
    return this.http.delete('api/removeUserFromSystem/' + username);
  }

  makeUserGroupAdmin(username:string) {
    let body = {
      "username": username
    }
    return this.http.post('api/makeUserGroupAdmin', JSON.stringify(body), this.genHeadersJSON());
  }

  makeUserSuperAdmin(username:string) {
    let body = {
      "username": username
    }
    return this.http.post('api/makeUserSuperAdmin', JSON.stringify(body), this.genHeadersJSON());
  }

  getChannelMessages(groupName:string, channelName:string) {
    return this.http.get('api/channel/messages', {
      params: {
      "groupName": groupName,
      "channelName": channelName
      }
    });
  }
}
