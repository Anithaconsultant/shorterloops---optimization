import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginserviceService } from './../services/loginservice.service';
import { AlertModalComponent } from '../alert-modal/alert-modal.component';
import { SharedServiceService } from '../services/shared-service.service';
@Component({
  selector: 'app-cityrule',
  templateUrl: './cityrule.component.html',
  styleUrls: ['./cityrule.component.scss']
})
export class CityruleComponent implements OnInit {
  [x: string]: any;

  @ViewChild('alertModal') alertModal!: AlertModalComponent;


  cityRuleForm: FormGroup; notificationForm!: FormGroup;
  constructor(private fb: FormBuilder, private sharedser: SharedServiceService, private logser: LoginserviceService, private route: Router, private activateroute: ActivatedRoute) {
    this.notificationForm = this.fb.group({
      display_at_dustbin: [false],
      garbage_truck_announcement: [false]
    });
    this.cityRuleForm = this.fb.group({
      cityId: [this.logser.currentuser.CityId || '', Validators.required],
      rule_number: [null],
      day_number: [this.logser.currentuser.currentday || '', Validators.required],
      time_in_hours: [parseInt(this.logser.currentuser.CurrentTime)],

      // Raw Material Prices
      virgin_plastic_price: [null],
      recycled_plastic_price: [null],

      // Environmental Taxes (Existing Values - Readonly)
      last_envtx_p_bvb: [null],
      last_envtx_r_bvb: [null],
      last_envtx_c_bvb: [null],
      last_envtx_p_brcb: [null],
      last_envtx_r_brcb: [null],
      last_envtx_c_brcb: [null],
      last_envtx_p_brfb: [null],
      last_envtx_r_brfb: [null],
      last_envtx_c_brfb: [null],
      last_envtx_p_uvb: [null],
      last_envtx_r_uvb: [null],
      last_envtx_c_uvb: [null],
      last_envtx_p_urcb: [null],
      last_envtx_r_urcb: [null],
      last_envtx_c_urcb: [null],
      last_envtx_p_urfb: [null],
      last_envtx_r_urfb: [null],
      last_envtx_c_urfb: [null],

      // Environmental Taxes (Editable Fields)
      envtx_p_bvb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_r_bvb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_c_bvb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_p_brcb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_r_brcb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_c_brcb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_p_brfb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_r_brfb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_c_brfb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_p_uvb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_r_uvb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_c_uvb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_p_urcb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_r_urcb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_c_urcb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_p_urfb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_r_urfb: ['', [Validators.min(0), Validators.max(100)]],
      envtx_c_urfb: ['', [Validators.min(0), Validators.max(100)]],

      // Fine Section
      fine_for_throwing_bottle: ['', [Validators.min(0)]],
      dustbinning_fine: ['', [Validators.min(0)]],
    });
  }
  cityrules: any = [];
  currentOption: any = '';
  ngOnInit(): void {
    this.activateroute.queryParams.subscribe(params => {
      this.currentOption = params['option'];
      //   console.log('Received option:', this.currentOption);
    });
    if (this.logser.currentuser.Username == '') {
      this.route.navigate(['/login']);
    }
    else {
      if (this.currentOption == 'cityrule') { this.loadLastCityRule(); }
      else if (this.currentOption == 'notification') { this.loadLastCitynotification(); }
      else {
        this.logser.getCityRules().subscribe(data => {
          this.cityrules = data;
        });
      }

    }


  }
  loadLastCityRule() {
    const cityId = this.cityRuleForm.get('cityId')?.value; // Get cityId from the form

    if (cityId) {
      this.logser.getLastCityRule().subscribe(
        (data) => {
          if (data) {
            // Exclude 'Day' and 'Time' from the API response
            const { day, time, ...restData } = data;

            // Populate the 'last_' prefixed fields with the retrieved data
            this.cityRuleForm.patchValue({
              last_envtx_p_bvb: restData.envtx_p_bvb,
              last_envtx_r_bvb: restData.envtx_r_bvb,
              last_envtx_c_bvb: restData.envtx_c_bvb,
              last_envtx_p_brcb: restData.envtx_p_brcb,
              last_envtx_r_brcb: restData.envtx_r_brcb,
              last_envtx_c_brcb: restData.envtx_c_brcb,
              last_envtx_p_brfb: restData.envtx_p_brfb,
              last_envtx_r_brfb: restData.envtx_r_brfb,
              last_envtx_c_brfb: restData.envtx_c_brfb,
              last_envtx_p_uvb: restData.envtx_p_uvb,
              last_envtx_r_uvb: restData.envtx_r_uvb,
              last_envtx_c_uvb: restData.envtx_c_uvb,
              last_envtx_p_urcb: restData.envtx_p_urcb,
              last_envtx_r_urcb: restData.envtx_r_urcb,
              last_envtx_c_urcb: restData.envtx_c_urcb,
              last_envtx_p_urfb: restData.envtx_p_urfb,
              last_envtx_r_urfb: restData.envtx_r_urfb,
              last_envtx_c_urfb: restData.envtx_c_urfb,
              day_number: this.logser.currentuser.currentday,
              time_in_hours: parseInt(this.logser.currentuser.CurrentTime),
              rule_number: restData.rule_number,
              fine_for_throwing_bottle: restData.fine_for_throwing_bottle,
              dustbinning_fine: restData.dustbinning_fine,
              virgin_plastic_price: restData.virgin_plastic_price,
              recycled_plastic_price: restData.recycled_plastic_price,
            });

            // Set the current day and time

          }
        },
        (error) => {
          console.error("Error fetching last city rule", error);
        }
      );
    }
  }
  loadLastCitynotification() {
    const cityId = this.logser.currentuser.CityId; // Get cityId from the form

    if (cityId) {
      this.logser.getcitynames().subscribe(
        (data: any) => {
          if (data) {
            console.log("API Response:", data);

            // Ensure checkboxes receive boolean values
            const formattedData = {
              display_at_dustbin: data[0].display_at_dustbin,
              garbage_truck_announcement: data[0].garbage_truck_announcement
            };
            console.log(formattedData)
            this.notificationForm.patchValue(formattedData); // Populate form with API response
          }
        },
        (error) => {
          console.error("Error fetching cityname", error);
        }
      );
    }
  }
  showWarning: boolean = false;
  toggleWarning(event: any) {
    this.showWarning = event.target.checked; // Get checkbox value
    this.sharedser.setShowWarning(this.showWarning); // Update service state
  }
  playWarning: boolean = false;
  togglePlayWarning(event: any) {
    this.playWarning = event.target.checked; // Get checkbox value
    this.sharedser.setPlayWarning(this.playWarning); // Update service state
  }
  notificationSubmit(): void {
    if (this.notificationForm.valid) {
      const notificationData = this.notificationForm.value;
      let cityUpdateData = { ...notificationData };
      this.updateCityTable(cityUpdateData);
      this.notificationForm.reset();
      this.alertModal.openModal("Notification Updated", false, () => { this.gotocity(); })
    }
  }


  onSubmit() {
    if (this.cityRuleForm.valid) {
      const formData = this.cityRuleForm.value;

      // Extract only the editable fields for submission
      const updatedData = {
        cityId: formData.cityId,
        day_number: formData.day_number,
        time_in_hours: formData.time_in_hours,
        virgin_plastic_price: formData.virgin_plastic_price,
        recycled_plastic_price: formData.recycled_plastic_price,
        envtx_p_bvb: formData.envtx_p_bvb,
        envtx_r_bvb: formData.envtx_r_bvb,
        envtx_c_bvb: formData.envtx_c_bvb,
        envtx_p_brcb: formData.envtx_p_brcb,
        envtx_r_brcb: formData.envtx_r_brcb,
        envtx_c_brcb: formData.envtx_c_brcb,
        envtx_p_brfb: formData.envtx_p_brfb,
        envtx_r_brfb: formData.envtx_r_brfb,
        envtx_c_brfb: formData.envtx_c_brfb,
        envtx_p_uvb: formData.envtx_p_uvb,
        envtx_r_uvb: formData.envtx_r_uvb,
        envtx_c_uvb: formData.envtx_c_uvb,
        envtx_p_urcb: formData.envtx_p_urcb,
        envtx_r_urcb: formData.envtx_r_urcb,
        envtx_c_urcb: formData.envtx_c_urcb,
        envtx_p_urfb: formData.envtx_p_urfb,
        envtx_r_urfb: formData.envtx_r_urfb,
        envtx_c_urfb: formData.envtx_c_urfb,
        fine_for_throwing_bottle: formData.fine_for_throwing_bottle,
        dustbinning_fine: formData.dustbinning_fine,
      };
      console.log("submited")
      // Send updatedData to the backend
      this.logser.createcityrule(updatedData).subscribe(
        (response) => {
          console.log("City rule updated successfully", response);
          this.cityRuleForm.reset();
          this.alertModal.openModal("New Rule is Created", false, () => { this.gotocity(); })
        },
        (error) => {
          console.error("Error updating city rule", error);
        }
      );
    } else {
      console.error("Form is invalid");
    }
  }
  activeInfo: string | null = null;
  toggleInfo(field: string) {
    this.activeInfo = this.activeInfo === field ? null : field;
  }
  updateCityTable(data: any) {
    this.logser.updateNoticeonCityTable(data).subscribe(

      (response) => {
        console.log('City Table Updated:', response);
      },
      (error) => {
        console.error('Error updating City Table:', error);
      }
    );
  }

  gotocity() {

    this.logser.toggleTimer(false).subscribe(
      response => {
        console.log('Timer resumed:', response);
        this.route.navigate(["/maincity"]);
      },
      error => {
        console.error('Error updating timer:', error);
      }
    );
    //  this.logser.resumeTimer().subscribe(response => {
    //console.log('Timer resumed:', response);

    //   });
  }
}
