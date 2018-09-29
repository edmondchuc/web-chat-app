import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private url = 'http://localhost:3000';
  
  private socket;

  constructor() { 
    this.socket = io(this.url);
    this.socket.emit('new-message', localStorage.getItem('username') + ' has joined the chat.');
  }

  public sendMessage(message) {
    console.log("Sending: " + message);
    this.socket.emit('new-message', message);
  }

  public getMessages = () => {
    return Observable.create((observer) => {
      this.socket.on('message', (message) => {
        console.log('received message: ' + message);
        observer.next(message.text);
      });
    });
  }
}
