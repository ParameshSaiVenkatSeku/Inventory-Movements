import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io(`${environment.Url}`);
  }

  joinChat(userId: number) {
    this.socket.emit('joinChat', userId);
  }

  sendMessage(senderId: number, receiverId: number, message: string) {
    this.socket.emit('sendMessage', {
      sender_id: senderId,
      receiver_id: receiverId,
      message,
    });
  }

  receiveMessage(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('receiveMessage', (message) => {
        observer.next(message);
      });
    });
  }

  joinTeam(teamId: string) {
    this.socket.emit('join_team', teamId);
  }

  sendGroupMessage(teamId: string, sender: string, message: string) {
    this.socket.emit('send_message', { teamId, sender, text: message });
  }

  receiveGroupMessages(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('receive_message', (msg) => {
        observer.next(msg);
      });
    });
  }
  disconnect() {
    this.socket.disconnect();
  }
}
