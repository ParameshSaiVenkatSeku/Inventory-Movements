import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthserviceService } from '../../services/authservice.service';

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;

  constructor(
    private authService: AuthserviceService,
    private router: Router,
    private toastr: ToastrService
  ) {}
  ngOnInit(): void {
    this.signupForm = new FormGroup({
      firstName: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.min(4)]),
    });
  }
  onSubmit() {
    if (this.signupForm.valid) {
      const { firstName, lastName, email, password } = this.signupForm.value;
      this.authService.signup(firstName, lastName, email, password).subscribe({
        next: (response) => {
          console.log('Signup successful', response);
          this.toastr.success('Sign up successful. Proceed with login.');
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          console.error('Error in signUp', error);
          this.toastr.error('Signup failed. Please try again.');
        },
      });
    } else {
      console.log('Form Invalid');
    }
  }
}
