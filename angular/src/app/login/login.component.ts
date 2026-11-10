import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { LoginserviceService } from "./../services/loginservice.service";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AlertModalComponent } from "../alert-modal/alert-modal.component";
import { SharedServiceService } from "../services/shared-service.service";
import { AuthService } from "../auth.service"; // New auth service

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  @ViewChild("alertModal") alertModal!: AlertModalComponent;
  public loginForm!: FormGroup;
  submitted = false;
  isLoading = false;

  constructor(
    private modalService: NgbModal,
    private sharedService: SharedServiceService,
    private formbuilder: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private logser: LoginserviceService,
    private authService: AuthService // Inject new auth service
  ) {}

  userobj = {
    login: "0",
  };

  @ViewChild("videoPlayer") videoPlayer!: ElementRef<HTMLVideoElement>;
  showImage = false;
  switchYesOrNo!: number;

  ngOnInit(): void {
    this.loginForm = this.formbuilder.group({
      usernameOrEmail: ["", Validators.required],
      password: ["", Validators.required],
    });
  }

  // Video control methods
  onVideoEnded() {
    this.showImage = false;
  }

  onSkip() {
    $("video").hide();
    this.showImage = true;
  }

  playVideo() {
    this.showImage = true;
    const video = this.videoPlayer.nativeElement;
    video.play();
  }

  // Modal methods
  openwhyshorter(whyshorter: any) {
    this.modalService.open(whyshorter, { windowClass: "frontpage" });
  }

  openaboutshorter(aboutshorter: any) {
    this.modalService.open(aboutshorter, { windowClass: "frontpage" });
  }

  opennavshorter(navigation: any) {
    this.modalService.open(navigation, { windowClass: "frontpage" });
  }

  // Updated login method using JWT

  login() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      this.alertModal.openModal(
        "Please enter Username/Email and Password",
        false
      );
      return;
    }

    this.isLoading = true;

    const credentials = {
      Username: this.loginForm.value.usernameOrEmail.trim(),
      Password: this.loginForm.value.password,
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.handleSuccessfulLogin(response.user);
      },
      error: (err) => {
        this.isLoading = false;
        this.handleLoginError(err);
      },
    });
  }

  private handleSuccessfulLogin(user: any): void {
    this.setCurrentUser(user);
    this.loginForm.reset();
    this.userobj.login = "1";

    // Update login status in backend if needed
    this.logser.updateloggeduser(this.userobj).subscribe({
      next: (data) => {
        this.userobj = data;
        this.navigateBasedOnRoleAndCity(user);
      },
      error: (error) => {
        console.error("Error updating login status:", error);
        this.navigateBasedOnRoleAndCity(user); // Still navigate even if update fails
      },
    });
  }

  private handleLoginError(err: any): void {
    const backendError =
      typeof err.error?.error === "string"
        ? err.error.error
        : typeof err.error?.message === "string"
        ? err.error.message
        : typeof err.error?.detail === "string"
        ? err.error.detail
        : null;

    let errorMessage: string;

    switch (err.status) {
      case 400:
        errorMessage =
          backendError || "Please check your login details and try again.";
        break;

      case 401:
        errorMessage = backendError || "Invalid username/email or password.";
        break;

      case 403:
        errorMessage =
          backendError ||
          "Access was denied. Please check your login permissions or contact support.";
        break;

      case 0:
        errorMessage =
          "Unable to connect to the server. Check your internet connection and try again.";
        break;

      default:
        if (err.status >= 500) {
          errorMessage =
            "The server encountered an error while logging you in. Please try again later.";
        } else {
          errorMessage =
            backendError ||
            `Login failed (HTTP ${err.status}). Please try again.`;
        }
    }

    console.error("Login failed:", {
      status: err.status,
      response: err.error,
    });

    this.alertModal.openModal(errorMessage, false);
  }

  private setCurrentUser(user: any): void {
    this.logser.currentuser.Username = user.Username;
    this.logser.currentuser.UserId = user.UserId;
    this.logser.currentuser.CityId = user.User_cityid;
    this.logser.currentuser.Role = user.Role;
    this.logser.currentuser.email=user.email;

    if (user.Role !== "Governor") {
      this.logser.currentuser.wallet = user.wallet;
      this.logser.currentuser.cartId = user.cartId;
      this.logser.currentuser.gender = user.gender;
      this.logser.currentuser.avatar = user.avatar;
      this.logser.currentuser.login = user.login;
    }
  }

  private navigateBasedOnRoleAndCity(user: any): void {
    if (user.User_cityid == 0 && user.Role == "") {
      this.router.navigate(["home"]);
    } else {
      if (user.Role === "Governor") {
        this.router.navigate(["report"]);
      } else {
        this.switchYesOrNo = 0;
        this.sharedService.setSwitchYesOrNo(this.switchYesOrNo);
        this.router.navigate(["maincity"]);
      }
    }
  }
}
