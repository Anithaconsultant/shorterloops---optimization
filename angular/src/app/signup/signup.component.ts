import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { LoginserviceService } from './../services/loginservice.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as $ from 'jquery';
import { AlertModalComponent } from '../alert-modal/alert-modal.component';
import { AuthService } from '../auth.service';
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  @ViewChild('alertModal') alertModal!: AlertModalComponent;

  public signupForm!: FormGroup;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  newuser = {
    'Username': '',
    'email': '',
    'mobile': '',
    'password': '',
    'wallet': '2000',
    'status': 'active',
    'User_cityid': '',
    'Role': '',
    'cartId': '0',
    'avatar': '',
    'gender': ''

  }; user: any;
  userList: any;
  newmale: any[] = [];
  newfemale: any[] = [];
  maleset = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  femaleset = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  bgposition = ['-180px -72px', '-613px -78px', '-1111px -77px', '-1486px -75px', '-1923px -88px', '-2393px -75px', '-2749px -82px', '-3331px -72px', '-3840px -96px', '-4309px -62px', '-180px -570px', '-680px -577px', '-1111px -575px', '-1471px -553px', '-1929px -586px', '-2393px -573px', '-2849px -581px', '-3331px -570px', '-3840px -595px', '-4309px -634px', '-180px -1021px', '-673px -1027px', '-1111px -1026px', '-1486px -1021px', '-1929px -1037px', '-2393px -1024px', '-2842px -1031px', '-3331px -1021px', '-3840px -1046px', '-4309px -1013px', '-180px -1429px', '-680px -1444px', '-1111px -1433px', '-1526px -1468px', '-1929px -1444px', '-2393px -1431px', '-2954px -1439px', '-3331px -1429px', '-3840px -1453px', '-4309px -1457px']
  constructor(private formbuilder: FormBuilder,
    private authService: AuthService, private modalService: NgbModal, private http: HttpClientModule, private router: Router, private logser: LoginserviceService) {


  }

  ngOnInit(): void {
    this.signupForm = this.formbuilder.group({
      username: ['', Validators.required],
      email: ['', Validators.required],
      mobile: ['', Validators.required],
      password: ['', Validators.required],
      gender: ['', Validators.required]
    })
    //$("body").addClass('frontpage').removeClass('cartcontent');
  }
  openwhyshorter(whyshorter: any) {

    this.modalService.open(whyshorter);
  }
  openaboutshorter(aboutshorter: any) {

    this.modalService.open(aboutshorter);
  }
  opennavshorter(navigation: any) {

    this.modalService.open(navigation);
  }
  signup() {
    this.submitted = true;
    if (this.signupForm.invalid) {
      this.alertModal.openModal("Please fill all the Fields");
      return;
    }

    if (this.submitted) {
      console.log(this.newuser);
      this.authService.signup(this.newuser).subscribe({
        next: () => {
          this.successMessage = 'Registration successful! Please login.';
          this.errorMessage = '';
        }, error: (err) => {
          this.errorMessage = 'Registration failed. Please try again.';
          if (err.error) {
            // Handle specific errors from Django
            if (err.error.Username) {
              this.errorMessage = err.error.Username[0];
            } else if (err.error.email) {
              this.errorMessage = err.error.email[0];
            }
          }
        }
      });
    }

  }
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  showImage = false;

  // Called when the video ends
  onVideoEnded() {
    this.showImage = false;
  }
  playVideo() {

    this.showImage = true;
    const video = this.videoPlayer.nativeElement;
    video.play();
  }
  navigate() {
    this.router.navigate(["login"])
  }

}
