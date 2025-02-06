import { Component, OnInit } from '@angular/core';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-group-chat',
  templateUrl: './group-chat.component.html',
  styleUrls: ['./group-chat.component.css'],
})
export class GroupChatComponent implements OnInit {
  showChat = false;
  teamId = '';
  message = '';
  messages: { sender: string; text: string }[] = [];
  username: any;
  modal: any;

  constructor(private socketService: SocketService) {}

  ngOnInit() {
    // Fetch user details from sessionStorage
    const token = sessionStorage.getItem('access_token');
    if (token) {
      const decodedToken = this.decodeToken(token);
      this.username = decodedToken.username;
      console.log('Current User: ', this.username);
    }

    // Listen for incoming group messages
    this.socketService.receiveGroupMessages().subscribe((msg) => {
      console.log(msg);
      this.messages.push(msg);
    });
  }

  decodeToken(token: string) {
    const decoded = JSON.parse(atob(token.split('.')[1])); // Assuming JWT token structure
    console.log(decoded);
    return decoded;
  }

  createTeam() {
    this.teamId = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.showChat = true;
    this.socketService.joinTeam(this.teamId);
  }

  joinTeam() {
    if (this.teamId.trim()) {
      this.showChat = true;
      this.socketService.joinTeam(this.teamId);
    }
  }

  sendGroupMessage() {
    if (this.message.trim()) {
      this.socketService.sendGroupMessage(
        this.teamId,
        this.username,
        this.message
      );
      this.message = '';
    }
  }

  toggleModal() {
    this.modal = !this.modal;
  }
}
