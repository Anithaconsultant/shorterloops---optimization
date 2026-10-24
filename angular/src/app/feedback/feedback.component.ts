import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginserviceService } from '../services/loginservice.service';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent {
  message = '';
  isSubmitting = false;
  statusMessage = '';
  errorMessage = '';

  constructor(
    private loginService: LoginserviceService,
    private router: Router
  ) {}

  submitFeedback(): void {
    const feedback = this.message.trim();

    if (!feedback || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.statusMessage = '';
    this.errorMessage = '';

    this.loginService.submitFeedback(feedback).subscribe({
      next: (response: any) => {
        this.statusMessage =
          response.message || 'Your feedback has been submitted successfully.';
        this.message = '';
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message || 'Unable to send feedback. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  cancelFeedback(): void {
    this.router.navigate(['/']); // Change this to your desired destination.
  }
}