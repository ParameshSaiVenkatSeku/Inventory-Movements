import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthserviceService } from '../../services/authservice.service';
import jwt_decode from 'jwt-decode';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  constructor(
    private authService: AuthserviceService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: (response) => {
          if (response && response.access_token) {
            this.authService.setToken(response.access_token);
            this.authService.setRefreshToken(response.refresh_token);
            const decodedToken: any = jwt_decode(response.access_token);
            this.toastr.success('Logged in successfully!', 'Success');
            this.loginForm.reset();
            this.router.navigate(['/dashboard']);
          } else {
            this.toastr.error('Unexpected response from server.', 'Error');
          }
        },
        error: () => {
          this.toastr.error('Login failed. Please try again.', 'Error');
        },
      });
    } else {
      this.toastr.warning('Please fill out the form correctly.', 'Warning');
    }
  }
}
