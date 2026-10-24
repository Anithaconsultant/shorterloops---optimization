
import { Component } from '@angular/core';
import { LoginserviceService } from '../services/loginservice.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  message = '';
  errorMessage = '';

  constructor(private loginService: LoginserviceService) {}

  submitRequest(): void {
    const email = this.email.trim();

    if (!email || this.loading) {
      return;
    }

    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    this.loginService.forgotPassword(email).subscribe({
      next: (response: any) => {
        this.message =
          response.message ||
          'If an account exists for that email, a reset link will be sent.';
        this.loading = false;
      },
      error: () => {
        this.errorMessage =
          'Unable to process your request. Please try again.';
        this.loading = false;
      }
    });
  }
}
