import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.css'],
})
export class ForgotComponent {
  forgotForm: FormGroup;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.forgotForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      console.log('Invalid form:', this.forgotForm.errors);
      return;
    }

    console.log('Submitting:', this.forgotForm.value);

    this.http
      .get(
        `${environment.Url}/api/v1/auth/forgotEmail/${this.forgotForm.value.email}`
      )
      .subscribe({
        next: (response) => {
          // console.log('Success:', response);
          this.toastr.success(
            'Reset Email has been Sent Successfully',
            'success'
          );
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          // console.error('Error:', error);
          this.toastr.error('Email is not registered', 'error');
        },
      });
  }
}
