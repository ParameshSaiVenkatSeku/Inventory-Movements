import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../services/socket.service';
import { environment } from 'src/environments/environment';
import { MainpageService } from '../../services/mainpage.service';
interface User {
  user_id: number;
  username: string;
  profile_pic: string;
}

interface Message {
  sender_id: number;
  message: string;
  created_at?: Date;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  users: User[] = [];
  selectedUser: User | null = null;
  messages: Message[] = [];
  currentUserId: number = 0;
  unreadMessages: { [key: number]: number } = {};
  currentUser: any;

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private main: MainpageService
  ) {}

  ngOnInit() {
    this.fetchUsers();

    // Fetch user details from sessionStorage
    const token = sessionStorage.getItem('access_token');
    if (token) {
      const decodedToken = this.decodeToken(token);
      this.currentUserId = decodedToken.user_id;
      this.currentUser = decodedToken;
      console.log('Current User: ', this.currentUser);
    }

    // Listen for incoming messages
    this.socketService.receiveMessage().subscribe((data: Message) => {
      console.log('✅ Message received:', data);

      if (this.selectedUser && data.sender_id === this.selectedUser.user_id) {
        this.messages.push(data);
      } else {
        this.unreadMessages[data.sender_id] =
          (this.unreadMessages[data.sender_id] || 0) + 1;
      }
    });
  }

  decodeToken(token: string) {
    const decoded = JSON.parse(atob(token.split('.')[1])); // Assuming JWT token structure
    return decoded;
  }

  fetchUsers() {
    this.http
      .get<User[]>(`${environment.Url}/api/v1/user/getAllData`)
      .subscribe(
        (data) => {
          this.users = data.filter(
            (user) => user.user_id !== this.currentUserId
          );
        },
        (error) => console.error('Error fetching users:', error)
      );
  }

  openChat(user: User) {
    this.selectedUser = user;
    this.messages = [];
    this.unreadMessages[user.user_id] = 0;

    this.socketService.joinChat(this.currentUserId);

    console.log(`Joined chat with user ${user.username}`);

    this.http
      .get<Message[]>(
        `${environment.Url}/api/v1/user/chat-history/${this.currentUserId}/${user.user_id}`
      )
      .subscribe(
        (data) => (this.messages = data),
        (error) => console.error('Error fetching chat history:', error)
      );
  }

  sendMessage(message: string) {
    if (!this.selectedUser || !message.trim()) return;

    const newMessage: Message = {
      sender_id: this.currentUserId,
      message,
      created_at: new Date(),
    };

    this.messages.push(newMessage);

    this.socketService.sendMessage(
      this.currentUserId,
      this.selectedUser.user_id,
      message
    );

    console.log(`📨 Sent message: ${message} to ${this.selectedUser.username}`);
  }

  ngOnDestroy() {
    this.socketService.disconnect();
    console.log('Socket disconnected');
  }
}
