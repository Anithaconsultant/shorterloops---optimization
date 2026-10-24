
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginserviceService } from './../services/loginservice.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  uid = '';
  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  message = '';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loginService: LoginserviceService
  ) {
    this.uid = this.route.snapshot.paramMap.get('uid') || '';
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  submitReset(): void {
    this.message = '';
    this.errorMessage = '';

    if (!this.uid || !this.token) {
      this.errorMessage = 'The password reset link is invalid.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'The passwords do not match.';
      return;
    }

    if (this.loading) {
      return;
    }

    this.loading = true;

    this.loginService.resetPassword(
      this.uid,
      this.token,
      this.newPassword
    ).subscribe({
      next: (response: any) => {
        this.message =
          response.message || 'Password reset successfully.';

        this.newPassword = '';
        this.confirmPassword = '';
        this.loading = false;
      },
      error: (error) => {
        const detail = error.error?.message;
        this.errorMessage = Array.isArray(detail)
          ? detail.join(' ')
          : detail || 'Unable to reset your password. The link may have expired.';

        this.loading = false;
      }
    });
  }
}
