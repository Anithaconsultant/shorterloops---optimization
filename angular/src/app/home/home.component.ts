import { Component, OnInit, ViewChild } from "@angular/core";
import { LoginserviceService } from "./../services/loginservice.service";
import { Router } from "@angular/router";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertModalComponent } from '../alert-modal/alert-modal.component';
@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
  @ViewChild('alertModal') alertModal!: AlertModalComponent;
  currentuser: any;
  selectrole = false;
  setusername: any;
  city: any;
  dataList: any;
  facility: any;
  setpair = [];
  selectedCity: string = "";
  selectedfacility: string = "";
  facilityobj = {
    facilityname: "",
    facilityCityId: 0,
    Ownerid: "",
    Owner_status: ''
  };
  allUser: any;
  userobj = {
    'cityid': 0,
    'Role': '',
    'cartId': '',
    'avatar': '',
    'gender': ''
  }


  constructor(private logser: LoginserviceService, private router: Router, private modalService: NgbModal) {
    this.currentuser = { ...this.logser.currentuser };
    this.setusername = this.currentuser.Username;
    this.userobj.gender = this.currentuser.gender;
    this.logser.getAllCities().subscribe((data) => {
      this.city = data;
      this.getcityList();
    });
  }
  ngOnInit(): void {
    if (this.logser.currentuser.Username == '') {
      this.router.navigate(["login"])
    }
    this.logser.getAllUsers().subscribe((data) => {
      this.allUser = data;

    })
  }
  setList: any[] = [];
  selectedcityid = '';
  choosefacility() {
    this.selectedcityid = this.getCityId();
    for (var t = 0; t < this.allUser.length; t++) {
      if (this.allUser[t].Role !== '' && this.allUser[t].User_cityid == this.selectedcityid) {
        let that = this;
        $('#role').find('option').each(function () {
          if ($(this).attr('value') == that.allUser[t].Role) {
            $(this).attr('disabled', 'true');
          }
        });
      }
    }
  }
  getcityList() {
    if (this.city) {
      this.dataList = JSON.parse(JSON.stringify(this.city));
    }
    let newdata = {};
    for (let key in this.dataList) {
      newdata = [this.dataList[key].CityName, this.dataList[key].CityId];
      this.setList.push(newdata);
    }
  }
  getCityId() {
    for (var i = 0; i < this.setList.length; i++) {
      if (this.setList[i][0] == this.selectedCity) {
        return this.setList[i][1];
      }
    }
  }
  canUpdate = false;
  checkindata() {
    this.logser.getallfacility(this.selectedcityid).subscribe((data) => {
      this.facility = data;
      for (let key in this.facility) {
        if (
          this.facility[key].Facility_cityid == this.selectedcityid &&
          this.facility[key].Owner_id != "" &&
          this.facility[key].facilityName == this.selectedfacility
        ) {
          this.alertModal.openModal(
            "The current role is not available please select any other role"
          );
          this.canUpdate = true;
        } else {
          let currentcartId;

          if (this.facility[key].Facilityname == this.selectedfacility) {
            currentcartId = this.facility[key].cartId;

            this.facilityobj.facilityCityId = parseInt(this.selectedcityid);
            this.facilityobj.facilityname = this.selectedfacility;
            this.facilityobj.Ownerid = this.logser.currentuser.UserId;
            this.facilityobj.Owner_status = 'Active';
            this.userobj.cityid = parseInt(this.selectedcityid);
            this.userobj.Role = this.selectedfacility;
            this.userobj.cartId = currentcartId;
            this.logser.currentuser.Role = this.selectedfacility;
            this.logser.currentuser.cartId = currentcartId;
            this.logser.currentuser.CityId = this.selectedcityid.toString();



          }


        }
      }


    });
  } openwhyshorter(whyshorter: any) {

    this.modalService.open(whyshorter, { windowClass: 'frontpage' });
  }
  openaboutshorter(aboutshorter: any) {

    this.modalService.open(aboutshorter, { windowClass: 'frontpage' });
  }
  opennavshorter(navigation: any) {

    this.modalService.open(navigation, { windowClass: 'frontpage' });
  }

  dochanges() {
    if (this.canUpdate == false && this.selectrole == true) {
      console.log("this.facilityobj", this.facilityobj)
      this.logser.updatefacility(this.facilityobj).subscribe(
        (data) => {
          this.facilityobj = data;
          console.log(this.userobj)
          this.logser.updateuser(this.userobj).subscribe(
            (data) => {
              this.userobj = data;
              this.router.navigate(['maincity']);

            },
            (error) => {
              console.log(error);
            }
          );
        },
        (error) => {
          //console.log(error);
        }
      );
    }
  }

  assignGovernorRole() {
    this.selectedfacility = 'Governor';
    this.userobj.Role = this.selectedfacility;
    this.logser.currentuser.Role = this.selectedfacility;
    this.logser.updateuser(this.userobj).subscribe(
      (data) => {
        this.userobj = data;

        this.router.navigate(['/report']);

      },
      (error) => {
        console.log(error);
      }
    );
  }
}
