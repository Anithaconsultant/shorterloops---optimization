import { Router } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { LoginserviceService } from '../services/loginservice.service';
import { ExcelExportService } from '../services/excel-export.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ChartComponent } from './chart/chart.component'
@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
  options: string[] = [];
  users: string[] = [];
  selectedAsset = '';
  @ViewChild(ChartComponent, { static: false }) chartComponent: ChartComponent | undefined
  selectedUser = '';
  auditLogs: any[] = [];
  currentUserRole = '';
  loggedInUserCity='';
  constructor(private router: Router, private logser: LoginserviceService, private modalService: NgbModal, private ExcelExportService: ExcelExportService) {
    this.currentUserRole = this.logser.currentuser.Role;
    this.loggedInUserCity=this.logser.currentuser.CityId;

  }
  ngOnInit(): void {

    if (this.logser.currentuser.Username != '') {
      this.loadFilterOptions();

    }
    else {
      this.router.navigate(['/login']);
    }
  }
  userobj = {
    'login': '1'
  }
  gotocity() {
    if (this.logser.currentuser.Role == 'Governor') {
      this.userobj.login = '0';
      this.logser.updateloggeduser(this.userobj).subscribe(
        (data) => {
          this.userobj = data;
          this.router.navigate(["login"]);
        },
        (error) => {
          //console.log(error);
        }
      );
    }
    else {
      this.router.navigate(["maincity"]);
    }

  }


  showsample(report: any) {
    this.modalService.open(report, { windowClass: "reportclass" });
  }

  cityOptions: string[] = [];
  brandOptions: string[] = [];
  current_locationOptions: string[] = [];
  exit_locationOptions: string[] = [];
  entry_locationOptions: string[] = [];
  statusOptions: string[] = [];
  roleOptions: string[] = [];
  BottleTypeOptions: string[] = [];
  currentSelfRefillOptions: string[] = [];
  currentPlantRefillOptions: string[] = [];
  TransactionIdOptions: string[] = [];
  assetIdOptions: string[] = [];
  dayOptions: string[] = [];
  startDay: string | null = null;
  endDay: string | null = null;

  filteredValue: any;
  filters = {
    city: [],
    brand: [],
    current_location: [],
    exit_location: [],
    entry_location: [],
    status: [],
    role_user: [],
    bottle_type: [],
    current_selfrefill: [],
    current_plantrefill: [],
    TransactionId: [],
    assetID: [],
    day: [],
    startDay: '',
    endDay: ''

  };

  filteredData: any[] = [];


  loadFilterOptions() {
    this.logser.getFilterOptions().subscribe(data => {
      if(this.currentUserRole=='Governor'){
      this.cityOptions = data.cityOptions;
      }
      else{
        this.cityOptions = [this.loggedInUserCity];
      }
      this.brandOptions = data.brandOptions;
      this.current_locationOptions = data.current_locationOptions;
      this.exit_locationOptions = data.exit_locationOptions;
      this.entry_locationOptions = data.entry_locationOptions;
      this.statusOptions = data.statusOptions;
      this.roleOptions = data.roleOptions;
      this.BottleTypeOptions = data.BottleTypeOptions;
      this.currentSelfRefillOptions = data.currentSelfRefillOptions;
      this.currentPlantRefillOptions = data.currentPlantRefillOptions;
      this.TransactionIdOptions = data.TransactionIdOptions;
      this.assetIdOptions = data.assetIdOptions;
      this.dayOptions = data.dayOptions;
      this.startDay = data.dayOptions;
      this.endDay = data.dayOptions;
    });
  }

  applyFilters() {
    //alert("Calling")
    this.auditLogs = [];
    this.logser.getFilteredLogs(this.filters).subscribe(data => {
      this.auditLogs = data;  // Store filtered data in auditLogs for table display

    });
    if (this.chartComponent) { this.chartComponent.loadChartData(); }
  }
  exportToExcel(): void {
    this.ExcelExportService.exportAsExcelFile(this.auditLogs, 'AuditLogs');
  }

}
