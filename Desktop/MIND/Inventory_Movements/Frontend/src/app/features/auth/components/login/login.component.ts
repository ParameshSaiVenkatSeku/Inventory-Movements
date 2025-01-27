import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthserviceService } from '../../services/authservice.service';
import { EncryptionService } from '../../../../core/services/encryption.service'; // Import EncryptionService
import jwt_decode from 'jwt-decode';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  constructor(
    private authService: AuthserviceService,
    private router: Router,
    private toastr: ToastrService,
    private encryptionService: EncryptionService // Inject EncryptionService
  ) {}

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(4),
      ]),
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: (response) => {
          console.log('API Response:', response);
          if (response && response.access_token) {
            this.authService.setToken(response.access_token);
            this.authService.setRefreshToken(response.refresh_token);
            const decodedToken: any = jwt_decode(response.access_token);
            const user = {
              id: decodedToken.user_id,
              username: decodedToken.username,
              email: decodedToken.email,
            };
            localStorage.setItem('user', JSON.stringify(user));
            this.toastr.success('Logged in successfully!', 'Success');
            this.loginForm.reset();
            this.router.navigate(['/dashboard']);
          } else {
            console.error('Invalid response structure:', response);
            this.toastr.error('Unexpected response from server.', 'Error');
          }
        },
        error: (error) => {
          console.error('Login failed', error);
          this.toastr.error('Login failed. Please try again.', 'Error');
        },
      });
    } else {
      console.log('Form Invalid');
    }
  }
}
