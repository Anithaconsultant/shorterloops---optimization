import { Component, OnInit } from '@angular/core';
import { LoginserviceService } from '../services/loginservice.service';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedServiceService } from '../services/shared-service.service';
import { Subscription } from 'rxjs';

interface MenuItem {
  label: string;
  action?: (...args: any[]) => void;  // action can take params like cashBox, ledgerBook
  disabled?: boolean;                 // optional
}
@Component({
  selector: 'app-hamburger-menu',
  templateUrl: './hamburger-menu.component.html',
  styleUrls: ['./hamburger-menu.component.scss']
})



export class HamburgerMenuComponent implements OnInit {
  menuOpen = false;
  currentUserCartId = '';
  currentUserId = 0;
  currentUserRole = '';
  currentusername = '';
  currentusergender = '';
  currentuseravatar = '';
  currentusercityId = '';
  switchYesOrNo!: number; // The variable is now a number
  private subscription!: Subscription;
  constructor(private logser: LoginserviceService, private router: Router, private modalService: NgbModal, private sharedService: SharedServiceService) {
    this.currentrole = this.logser.currentuser.Role;
    this.currentUserCartId = this.logser.currentuser.cartId;
    this.currentusername = this.logser.currentuser.Username;
    this.currentusergender = this.logser.currentuser.gender;
    this.currentuseravatar = this.logser.currentuser.avatar;
    this.currentusercityId = this.logser.currentuser.CityId;
    this.subscription = this.sharedService.switchYesOrNo$.subscribe(value => {
      this.switchYesOrNo = value;
    });
  }
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  currentwallet = 0.0;
  netrefund = 0.0;
  netfine = 0.0;
  currentusertransaction: any[] = [];
  currentrole = "";
  userobj = {
    'login': '1'
  }
  ngOnInit(): void {

  }


  rolesConfig: any = {
    Mayor: [
      { label: 'Switch Role as Customer', action: () => this.onMenuItemClick() },
      { label: 'Check the Office Cashbox Status', action: (cashBox: any) => { this.calculateSums(); this.openCashbox(cashBox); } },
      { label: 'Check Ledger book', action: (legderBook: any) => { this.calculateSums(); this.openCashboxLedger(legderBook); } },
      { label: 'Run the garbage truck daily', action: null, disabled: true },
      { label: 'Update Environment Taxes', action: () => this.showCityRuleComponent('cityrule') },
      { label: 'Update Notices and Announcements', action: () => this.showCityRuleComponent('notification') },
      { label: 'Show Asset Audit Trail', action: () => this.showNewComponent() },
      { label: 'Set the City Clock Tower Tickrate', action: null, disabled: true },
      { label: 'Audit the Universal Bottle Manufacturing Plant', action: () => this.openAuditBottleMakingVideoModal() },
      { label: 'Audit the Refilling Station', action: null, disabled: true },
      { label: 'Audit the Universal Bottle Cleaning Plant', action: () => this.openAuditBottleCleaningVideoModal() },
      { label: 'Audit the Plastic Recycling Plant', action: () => this.openAuditPlasticVideoModal() },
    ],

    'Supermarket Owner': [
      { label: 'Switch Role as Customer', action: () => this.onMenuItemClick() },
      { label: 'Check Cashbox Status', action: (cashBox: any) => { this.calculatesupermarketSums(); this.openCashbox(cashBox); } },
      { label: 'Check Ledger book', action: (legderBook: any) => { this.calculatesupermarketSums(); this.openCashboxLedger(legderBook); } },
      { label: 'Bring Back Refilled Bottles', action: () => this.loadPlantBottles() },
      { label: 'Order Shampoo', action: () => this.placeOrder() },
      { label: 'Run the Bottle Collection Truck', action: () => this.rungarbagetruck() },
    ],

    'Bottle Reverse Vending Machine Owner': [
      { label: 'Switch Role as Customer', action: () => this.onMenuItemClick() },
      { label: 'Check Cashbox Status', action: (cashBox: any) => { this.calculatereverseSums(); this.openCashbox(cashBox); } },
      { label: 'Check Ledger book', action: (legderBook: any) => { this.calculatereverseSums(); this.openCashboxLedger(legderBook); } },
    ],

    'Shampoo Refilling Station Owner': [
      { label: 'Switch Role as Customer', action: () => this.onMenuItemClick() },
      { label: 'Check Cashbox Status', action: (cashBox: any) => { this.calculaterefillSums(); this.openCashbox(cashBox); } },
      { label: 'Check Ledger book', action: (legderBook: any) => { this.calculaterefillSums(); this.openCashboxLedger(legderBook); } },
    ],

    'Universal Bottle Manufacturing Plant owner': [
      { label: 'Switch Role as Customer', action: () => this.onMenuItemClick() },
      { label: 'Check Cashbox Status', action: (cashBox: any) => { this.calculateUniversalManufacturingSums(); this.openCashbox(cashBox); } },
      { label: 'Check Ledger book', action: null, disabled: true },
    ],

    'Plastic Recycling Plant Owner': [
      { label: 'Switch Role as Customer', action: () => this.onMenuItemClick() },
      { label: 'Check Cashbox Status', action: (cashBox: any) => { this.calPlasticRecyclingSums(); this.openCashbox(cashBox); } },
      { label: 'Check Ledger book', action: null, disabled: true },
    ],

    'Universal Bottle Cleaning Plant Owner': [
      { label: 'Switch Role as Customer', action: () => this.onMenuItemClick() },
      { label: 'Check Cashbox Status', action: (cashBox: any) => { this.calUBCPSum(); this.openCashbox(cashBox); } },
      { label: 'Check Ledger book', action: null, disabled: true },
    ],

    'B1 Shampoo Producer': [
      { label: 'Switch Role as Customer', action: () => this.onMenuItemClick() },
      { label: 'Check Cashbox Status', action: (cashBox: any) => { this.calB1shampoo(); this.openCashbox(cashBox); } },
      { label: 'Produce Shampoo', action: () => this.placeOrder() },
      { label: 'Check Ledger book', action: null, disabled: true },
    ],

    'B2 Shampoo Producer': [
      { label: 'Switch Role as Customer', action: () => this.onMenuItemClick() },
      { label: 'Check Cashbox Status', action: (cashBox: any) => { this.calB2shampoo(); this.openCashbox(cashBox); } },
      { label: 'Produce Shampoo', action: () => this.placeOrder() },
      { label: 'Check Ledger book', action: null, disabled: true },
    ],

    'B3 Shampoo Producer': [
      { label: 'Switch Role as Customer', action: () => this.onMenuItemClick() },
      { label: 'Check Cashbox Status', action: (cashBox: any) => { this.calB3shampoo(); this.openCashbox(cashBox); } },
      { label: 'Produce Shampoo', action: () => this.placeOrder() },
      { label: 'Check Ledger book', action: null, disabled: true },
    ],

    'B4 Shampoo Producer': [
      { label: 'Switch Role as Customer', action: () => this.onMenuItemClick() },
      { label: 'Check Cashbox Status', action: (cashBox: any) => { this.calB4shampoo(); this.openCashbox(cashBox); } },
      { label: 'Produce Shampoo', action: () => this.placeOrder() },
      { label: 'Check Ledger book', action: null, disabled: true },
    ],

    'B5 Shampoo Producer': [
      { label: 'Switch Role as Customer', action: () => this.onMenuItemClick() },
      { label: 'Check Cashbox Status', action: (cashBox: any) => { this.calB5shampoo(); this.openCashbox(cashBox); } },
      { label: 'Produce Shampoo', action: () => this.placeOrder() },
      { label: 'Check Ledger book', action: null, disabled: true },
    ],
  };

  // extra global menu items
  extraMenu: MenuItem[] = [
    { label: 'View The Environment Tax Regimes', action: () => this.showCityRuleview('displayrule') },
  ];


  closeMenu() {
    this.menuOpen = false;
  }
  showNewComponent() {
    // Navigate to the new component route

    this.router.navigate(['/report']);
  }
  showCityRuleComponent(option: any) {
    this.logser.toggleTimer(true).subscribe(
      response => {
        console.log('Timer paused updated:', response);
        this.router.navigate(['/cityrule'], { queryParams: { option: option } });
      },
      error => {
        console.error('Error updating timer:', error);
      }
    );
    // });

  }
  showCityRuleview(option: any) {
    this.router.navigate(['/cityrule'], { queryParams: { option: option } });
  }

  openaboutshorter(aboutshorter: any) {
    this.modalService.open(aboutshorter, { windowClass: "frontpage" });
  }
  opennavshorter(navigation: any) {
    this.modalService.open(navigation, { windowClass: "frontpage" });
  }
  placeOrder() {
    this.router.navigate(['/bottleinventory']);
  }
  openCashbox(cashBox: any) {
    this.modalService.open(cashBox, { windowClass: "cartcontent" });
  }
  openCashboxLedger(legderBook: any) {
    this.modalService.open(legderBook, { windowClass: "cartcontent" });
  }

  fineTotal = 0.0;
  environmentTaxTotal = 0.0;
  cashflowdata: any[] = [];
  currentWalletMunis = 0.0
  earningFromSales = 0.0;
  DebitsInReturnConveyor = 0.0;
  DebitForReturningBottle = 0.0;
  calculateSums() {
    this.logser.getFacilitycashbox('Municipality Office').subscribe(data => {
      this.currentWalletMunis = data[0]['Cashbox'];
    });
    console.log(this.currentWalletMunis)
    this.logser.gettransactions().subscribe(data => {
      this.cashflowdata = [];
      console.log(data.length);

      if (this.cashflowdata.length == 0) {
        for (let t = 0; t < data.length; t++) {
          let getcityId = data[t]['TransactionId'].split("_")[0];
          console.log(t, getcityId, this.currentusercityId)
          if (getcityId == this.currentusercityId && (data[t]['CreditFacility'] == 'Municipality Office')) {
            this.cashflowdata.push(data[t]);
          }
        }
      }
      console.log(this.cashflowdata)
      if (this.cashflowdata) {
        const environmentTaxRecords = this.cashflowdata
          .filter(record => record.Purpose.includes("Environment tax"));


        this.environmentTaxTotal = environmentTaxRecords
          .reduce((sum, record) => sum + parseFloat(record.Amount), 0);

        // Calculate and display matched Fine records
        const fineRecords = this.cashflowdata
          .filter(record => record.Purpose.includes("Throwing Bottle"));


        this.fineTotal = fineRecords
          .reduce((sum, record) => sum + parseFloat(record.Amount), 0);
        console.log(this.fineTotal, this.environmentTaxTotal)

      }
    });


  }
  currentWalletsupermarket = 0.0;
  CreditFromRefillShampoo = 0.0;
  calculatesupermarketSums() {
    this.logser.getFacilitycashbox('Supermarket Owner').subscribe(data => {
      this.currentWalletsupermarket = data[0]['Cashbox'];
    });
    this.logser.gettransactions().subscribe(data => {
      this.cashflowdata = [];
      if (this.cashflowdata.length == 0) {
        for (let t = 0; t < data.length; t++) {
          let getcityId = data[t]['TransactionId'].split("_")[0];
          if (getcityId == this.currentusercityId && (data[t]['CreditFacility'] == this.logser.currentuser.Role || data[t]['DebitFacility'] == 'Return Conveyor')) {
            this.cashflowdata.push(data[t]);
          }
        }
      }
      console.log(this.cashflowdata)
      if (this.cashflowdata) {
        const purchaseRecords = this.cashflowdata
          .filter(record => record.Purpose.includes("Purchasing"));


        this.earningFromSales = purchaseRecords
          .reduce((sum, record) => sum + parseFloat(record.Amount), 0);

        // Calculate and display matched Fine records
        const debitRecords = this.cashflowdata
          .filter(record => record.Purpose.includes("returning"));


        this.DebitsInReturnConveyor = debitRecords
          .reduce((sum, record) => sum + parseFloat(record.Amount), 0);


      }
    });


  }
  currentWalletReverseVending = 0.0;
  DebitForreverse = 0.0;
  calculatereverseSums() {
    this.logser.getFacilitycashbox('Bottle Reverse Vending Machine Owner').subscribe(data => {
      this.currentWalletReverseVending = data[0]['Cashbox'];
    });
    this.logser.gettransactions().subscribe(data => {
      this.cashflowdata = [];
      if (this.cashflowdata.length == 0) {
        for (let t = 0; t < data.length; t++) {
          let getcityId = data[t]['TransactionId'].split("_")[0];
          if (getcityId == this.currentusercityId && (data[t]['DebitFacility'] == 'Bottle Reverse Vending Machine')) {
            this.cashflowdata.push(data[t]);
          }
        }
      }
      //console.log(this.cashflowdata)
      if (this.cashflowdata) {
        const purchaseRecords = this.cashflowdata
          .filter(record => record.Purpose.includes("Refund for returning Bottle"));


        this.DebitForReturningBottle = purchaseRecords
          .reduce((sum, record) => sum + parseFloat(record.Amount), 0);


        console.log(this.DebitForReturningBottle)
      }
    });


  }
  WalletUniversalManufacturing = 0.0;
  plasticRecyclicCashbox = 0.0;
  calculateUniversalManufacturingSums() {
    this.logser.getFacilitycashbox('Universal Bottle Manufacturing Plant owner').subscribe(data => {
      console.log(data)
      this.WalletUniversalManufacturing = data[0]['Cashbox'];
    });
  }
  calPlasticRecyclingSums() {
    this.logser.getFacilitycashbox('Plastic Recycling Plant Owner').subscribe(data => {
      console.log(data)
      this.plasticRecyclicCashbox = data[0]['Cashbox'];
    });
  }
  ubcpCashbox = 0.0;
  calUBCPSum() {
    this.logser.getFacilitycashbox('Universal Bottle Cleaning Plant Owner').subscribe(data => {
      console.log(data)
      this.ubcpCashbox = data[0]['Cashbox'];
    });
  }
  b4ShampooCashbox = 0.0;
  b1ShampooCashbox = 0.0;
  b2ShampooCashbox = 0.0;
  b3ShampooCashbox = 0.0;
  b5ShampooCashbox = 0.0;
  calB4shampoo() {
    this.logser.getFacilitycashbox('B4 Shampoo Producer').subscribe(data => {
      console.log(data)
      this.b4ShampooCashbox = data[0]['Cashbox'];
    });
  }
  calB1shampoo() {
    this.logser.getFacilitycashbox('B1 Shampoo Producer').subscribe(data => {
      console.log(data)
      this.b1ShampooCashbox = data[0]['Cashbox'];
    });
  }
  calB2shampoo() {
    this.logser.getFacilitycashbox('B2 Shampoo Producer').subscribe(data => {
      console.log(data)
      this.b2ShampooCashbox = data[0]['Cashbox'];
    });
  }
  calB3shampoo() {
    this.logser.getFacilitycashbox('B3 Shampoo Producer').subscribe(data => {
      console.log(data)
      this.b3ShampooCashbox = data[0]['Cashbox'];
    });
  }
  calB5shampoo() {
    this.logser.getFacilitycashbox('B5 Shampoo Producer').subscribe(data => {
      console.log(data)
      this.b5ShampooCashbox = data[0]['Cashbox'];
    });
  }
  currentWalletRefilling = 0.0;
  calculaterefillSums() {
    this.logser.getFacilitycashbox('Shampoo Refilling Station Owner').subscribe(data => {
      console.log(data)
      this.currentWalletRefilling = data[0]['Cashbox'];
    });
    this.logser.gettransactions().subscribe(data => {
      console.log(data)
      this.cashflowdata = [];
      if (this.cashflowdata.length == 0) {
        for (let t = 0; t < data.length; t++) {
          let getcityId = data[t]['TransactionId'].split("_")[0];
          console.log(getcityId, this.currentusercityId, t)
          if (getcityId == this.currentusercityId && (data[t]['CreditFacility'] == 'Refilling Station')) {
            this.cashflowdata.push(data[t]);
          }
        }
      }
      console.log(this.cashflowdata)
      if (this.cashflowdata) {
        const purchaseRecords = this.cashflowdata
          .filter(record => record.Purpose.includes("Refilling"));


        this.CreditFromRefillShampoo = purchaseRecords
          .reduce((sum, record) => sum + parseFloat(record.Amount), 0);

        console.log(this.CreditFromRefillShampoo)

      }
    });


  }

  onMenuItemClick() {

    if (this.switchYesOrNo === 2) {
      this.switchYesOrNo = 0;
    } else if (this.switchYesOrNo === 0) {
      this.switchYesOrNo = 2;
    }

    this.sharedService.setSwitchYesOrNo(this.switchYesOrNo);

  }

  openAuditPlasticVideoModal(): void {
    this.sharedService.open_Audit_plastic_Video();
  }
  openAuditBottleCleaningVideoModal(): void {
    this.sharedService.open_Audit_bottleCleaning_Video();
  }

  openAuditBottleMakingVideoModal(): void {
    this.sharedService.open_Audit_bottleMaking_Video();
  }

  rungarbagetruck(): void {
    this.sharedService.rungarbagetruck();
  }
  loadPlantBottles() {
    this.sharedService.loadPlantBottles();
  }
}


