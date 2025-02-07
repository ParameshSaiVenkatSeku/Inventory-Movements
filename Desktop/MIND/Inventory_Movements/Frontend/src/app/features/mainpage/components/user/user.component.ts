import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { MainpageService } from '../../services/mainpage.service';

// User Interface
interface User {
  user_id: number;
  first_name: string;
  username: string;
  email: string;
  role: string;
  region: string;
}

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
})
export class UserComponent implements OnInit {
  users: User[] = [];
  selectedUser: User | null = null;
  userToDelete: User | null = null;
  updatedUser: User = {
    user_id: 0,
    first_name: '',
    username: '',
    email: '',
    role: '',
    region: '',
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.http
      .get<User[]>(`${environment.Url}/api/v1/user/getAllData`)
      .subscribe(
        (data: any) => {
          if (Array.isArray(data)) {
            this.users = data.map((user) => ({
              user_id: user.user_id,
              first_name: user.first_name || 'N/A',
              username: user.username,
              email: user.email || 'N/A',
              role: user.role_name || 'N/A',
              region: user.branch || 'N/A',
            }));
          } else {
            console.error('Unexpected response format:', data);
          }
        },
        (error) => {
          console.error('Error fetching users:', error);
        }
      );
  }

  // Open View User Modal
  viewUser(user: User): void {
    this.selectedUser = user;
  }

  // Open Delete User Modal
  confirmDelete(user: User): void {
    this.userToDelete = user;
  }

  deleteUser(): void {
    if (this.userToDelete) {
      const userId = this.userToDelete.user_id;
      this.http
        .delete(`${environment.Url}/api/v1/user/delete/${userId}`)
        .subscribe(
          () => {
            this.users = this.users.filter((u) => u.user_id !== userId);
            this.userToDelete = null;
          },
          (error) => {
            console.error('Error deleting user:', error);
          }
        );
    }
  }

  // Open Update User Modal
  updateUser(user: User): void {
    this.updatedUser = { ...user }; // Clone the selected user for editing
  }

  saveUpdatedUser(): void {
    if (!this.updatedUser.user_id) {
      console.error('User ID is missing for update.');
      return;
    }
    this.http
      .put(
        `${environment.Url}/api/v1/user/update/${this.updatedUser.user_id}`,
        this.updatedUser
      )
      .subscribe(
        () => {
          this.users = this.users.map((u) =>
            u.user_id === this.updatedUser.user_id ? { ...this.updatedUser } : u
          );
        },
        (error) => {
          console.error('Error updating user:', error);
        }
      );
  }
}
