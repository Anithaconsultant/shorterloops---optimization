
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { LoginserviceService } from '../services/loginservice.service';
import { SharedServiceService } from '../services/shared-service.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {

  message = '';
  errorMessage = '';
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private logser: LoginserviceService,
    private sharedService: SharedServiceService
  ) {}

  ngOnInit(): void {

    const token = this.route.snapshot.paramMap.get('token');

    if (!token) {
      this.isLoading = false;
      this.errorMessage = 'Invalid verification link.';
      return;
    }

    this.authService.verifyEmail(token).subscribe({

      next: (response: any) => {

        console.log('Email verification successful:', response);

        this.isLoading = false;
        this.message = response.message;

        // Store JWT tokens and user
        this.authService.storeAuthData(response);

        // Keep the existing application's current user state in sync
        this.setCurrentUser(response.user);

        // Use the existing application navigation rules
        this.navigateBasedOnRoleAndCity(response.user);
      },

      error: (err) => {

        console.error('Email verification failed:', err);

        this.isLoading = false;

        this.errorMessage =
          err.error?.error || 'Email verification failed.';
      }
    });
  }

  private setCurrentUser(user: any): void {

    this.logser.currentuser.Username = user.Username;
    this.logser.currentuser.UserId = user.UserId;
    this.logser.currentuser.CityId = user.User_cityid;
    this.logser.currentuser.Role = user.Role;

    if (user.Role !== 'Governor') {
      this.logser.currentuser.wallet = user.wallet;
      this.logser.currentuser.cartId = user.cartId;
      this.logser.currentuser.gender = user.gender;
      this.logser.currentuser.avatar = user.avatar;
      this.logser.currentuser.login = user.login;
    }
  }

  private navigateBasedOnRoleAndCity(user: any): void {

    if (user.User_cityid == 0 && user.Role == '') {

      this.router.navigate(['home']);

    } else {

      if (user.Role === 'Governor') {

        this.router.navigate(['report']);

      } else {

        this.sharedService.setSwitchYesOrNo(0);
        this.router.navigate(['maincity']);
      }
    }
  }
}

