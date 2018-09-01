import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private http:HttpClient) { }

  getUsers(username:string) {
    return this.http.get('api/user', {
      params: {
        username: username
      }
    });
  }

  // updateEmail(username:string, email:string) {
  //   this.http.post(`api/email/${username}-${email}`, new HttpHeaders())
  //   .subscribe(
  //     (data) => {
  //       console.log('POST call successful. Sent ' + data);
  //     },
  //     (err) => {
  //       console.log('Error in POST call. Error: ' + err);
  //     },
  //     () => {
  //       console.log('POST call completed.');
  //     }
  //   );
  // }
  updateEmail(username:string, email:string) {
    let body = {
      'username': username,
      'email': email
    };
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };

    return this.http.post(`api/email`, JSON.stringify(body), httpOptions);
  }
}
