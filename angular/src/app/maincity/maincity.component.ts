import { Component, HostListener, ViewChild, AfterViewInit, ElementRef, OnInit, QueryList, OnDestroy, Renderer2, ViewChildren, ChangeDetectorRef } from '@angular/core';
import panzoom from "panzoom";
import { forkJoin, from, of } from 'rxjs';
import { LoginserviceService } from '../services/loginservice.service';
import { SharedServiceService } from '../services/shared-service.service';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import $ from 'jquery';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag, CdkDragEnd, CdkDropList, CdkDragStart } from '@angular/cdk/drag-drop';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { AlertModalComponent } from '../alert-modal/alert-modal.component';

export interface Bottle {
  id: string;
  className: string; // shinyvpn, spikyrpn, etc
}
@Component({
  selector: 'app-maincity',
  templateUrl: './maincity.component.html',
  styleUrls: ['./maincity.component.scss']
})
export class MaincityComponent implements AfterViewInit, OnInit, OnDestroy {

  @ViewChild('alertModal') alertModal!: AlertModalComponent;
  @ViewChildren(CdkDropList) dropLists!: QueryList<CdkDropList>;

  noavatar = false;
  userobj = {
    'login': '1'
  }
  currentrole = "";
  @ViewChild('trucksound', { static: true }) public trucksound!: ElementRef;
  @ViewChild('cityrail', { static: true }) public cityrail!: ElementRef;
  @ViewChild('transactioncomplete', { static: true }) public transactioncomplete!: ElementRef;
  @ViewChild('thankyousuper', { static: true }) public thankyousuper!: ElementRef;
  @ViewChild('anouncement', { static: true }) public anouncement!: ElementRef;
  @ViewChild('doneshopping', { static: true }) public doneshopping!: ElementRef;
  @ViewChild('pleasecheck', { static: true }) public pleasecheck!: ElementRef;
  @ViewChild('paymentreceived', { static: true }) public paymentreceived!: ElementRef;
  @ViewChild('welcome', { static: true }) public welcome!: ElementRef;
  @ViewChild('welcomemarket', { static: true }) public welcomemarket!: ElementRef;
  @ViewChild('bottledroppeded', { static: true }) public bottledroppeded!: ElementRef;
  @ViewChild('placebottle', { static: true }) public placebottle!: ElementRef;
  @ViewChild('selectbrand', { static: true }) public selectbrand!: ElementRef;
  @ViewChild('bottledifferent', { static: true }) public bottledifferent!: ElementRef;
  @ViewChild('checkprice', { static: true }) public checkprice!: ElementRef;
  @ViewChild('useplusminus', { static: true }) public useplusminus!: ElementRef;
  @ViewChild('collectbottle', { static: true }) public collectbottle!: ElementRef;
  @ViewChild('thankyou', { static: true }) public thankyou!: ElementRef;
  @ViewChild('maincity', { static: false }) private scene!: ElementRef;
  @ViewChild('content', { static: false }) private content!: ElementRef;
  @ViewChild('bottlesticker', { static: false }) private bottlesticker!: ElementRef;
  @ViewChild('cartcontent', { static: false }) private cartcontent!: ElementRef;
  @ViewChild('Auditing_Plastic', { static: false }) private Auditing_Plastic!: ElementRef;
  @ViewChild('Auditing_BottleCleaning', { static: false }) private Auditing_BottleCleaning!: ElementRef;
  @ViewChild('Auditing_BottleMaking', { static: false }) private Auditing_BottleMaking!: ElementRef;
  @ViewChild('reloadBottle', { static: false }) private reloadBottle!: ElementRef;
  @ViewChild('supermarket', { static: false }) private supermarket!: ElementRef;
  @ViewChild('cartdisplay', { static: false }) private cartdisplay!: ElementRef;
  @ViewChild('StopEntry', { static: false }) private StopEntry!: ElementRef;
  @ViewChild('Supermarket_Return', { static: false }) private Supermarket_Return!: ElementRef;
  @ViewChild('Thanksreturning', { static: false }) private Thanksreturning!: ElementRef;
  @ViewChild('Fine', { static: false }) private Fine!: ElementRef;
  isMuted = false;

  @ViewChild('allAudio', { static: true }) allAudio!: ElementRef<HTMLAudioElement[]>;
  netamount = 0;
  boughtbottledata: any[] = [];
  getcurrentplacedbrand = '';
  refillbrandselected = '';
  selectquantity = 0;
  timeout: any;
  resetanimation = false;
  opensuperflag = 0;
  currentZoomLevel = 1;
  //bottles: string[] = [];
  bottledropped: string[] = [];
  reversedBottles: string[] = [];
  bottletaken: string[] = [];
  //bottletaken: { id: string; className: string }[] = [];
  commonobj: any[] = [];


  shinyvpn: Bottle[] = [];
  shinyvpr: Bottle[] = [];
  shinyrpn: Bottle[] = [];
  shinyrpr: Bottle[] = [];
  shinyuvpn: Bottle[] = [];
  shinyuvpr: Bottle[] = [];
  shinyurpn: Bottle[] = [];
  shinyurpr: Bottle[] = [];




  spikyvpn: Bottle[] = [];
  spikyvpr: Bottle[] = [];
  spikyrpn: Bottle[] = [];
  spikyrpr: Bottle[] = [];
  spikyuvpn: Bottle[] = [];
  spikyuvpr: Bottle[] = [];
  spikyurpn: Bottle[] = [];
  spikyurpr: Bottle[] = [];

  silkyvpn: Bottle[] = [];
  silkyvpr: Bottle[] = [];
  silkyrpn: Bottle[] = [];
  silkyrpr: Bottle[] = [];
  silkyuvpn: Bottle[] = [];
  silkyuvpr: Bottle[] = [];
  silkyurpn: Bottle[] = [];
  silkyurpr: Bottle[] = [];

  bouncyvpn: Bottle[] = [];
  bouncyvpr: Bottle[] = [];
  bouncyrpn: Bottle[] = [];
  bouncyrpr: Bottle[] = [];
  bouncyuvpn: Bottle[] = [];
  bouncyuvpr: Bottle[] = [];
  bouncyurpn: Bottle[] = [];
  bouncyurpr: Bottle[] = [];

  wavyvpn: Bottle[] = [];
  wavyvpr: Bottle[] = [];
  wavyrpn: Bottle[] = [];
  wavyrpr: Bottle[] = [];
  wavyuvpn: Bottle[] = [];
  wavyuvpr: Bottle[] = [];
  wavyurpn: Bottle[] = [];
  wavyurpr: Bottle[] = [];

  shelfMap: Record<string, Bottle[]> = {

    shinyvpn: this.shinyvpn,
    shinyvpr: this.shinyvpr,
    shinyrpn: this.shinyrpn,
    shinyrpr: this.shinyrpr,
    shinyuvpn: this.shinyuvpn,
    shinyuvpr: this.shinyuvpr,
    shinyurpn: this.shinyurpn,
    shinyurpr: this.shinyurpr,




    spikyvpn: this.spikyvpn,
    spikyvpr: this.spikyvpr,
    spikyrpn: this.spikyrpn,
    spikyrpr: this.spikyrpr,
    spikyuvpn: this.spikyuvpn,
    spikyuvpr: this.spikyuvpr,
    spikyurpn: this.spikyurpn,
    spikyurpr: this.spikyurpr,

    silkyvpn: this.silkyvpn,
    silkyvpr: this.silkyvpr,
    silkyrpn: this.silkyrpn,
    silkyrpr: this.silkyrpr,
    silkyuvpn: this.silkyuvpn,
    silkyuvpr: this.silkyuvpr,
    silkyurpn: this.silkyurpn,
    silkyurpr: this.silkyurpr,

    bouncyvpn: this.bouncyvpn,
    bouncyvpr: this.bouncyvpr,
    bouncyrpn: this.bouncyrpn,
    bouncyrpr: this.bouncyrpr,
    bouncyuvpn: this.bouncyuvpn,
    bouncyuvpr: this.bouncyuvpr,
    bouncyurpn: this.bouncyurpn,
    bouncyurpr: this.bouncyurpr,

    wavyvpn: this.wavyvpn,
    wavyvpr: this.wavyvpr,
    wavyrpn: this.wavyrpn,
    wavyrpr: this.wavyrpr,
    wavyuvpn: this.wavyuvpn,
    wavyuvpr: this.wavyuvpr,
    wavyurpn: this.wavyurpn,
    wavyurpr: this.wavyurpr,

  };
  BottleInHouseList: string[] = [];
  throwntoTruckList: string[] = [];
  refillbottles: string[] = [];
  dustbinbottles: string[] = [];
  refilledbottles: string[] = [];
  atRefillingMchn: string[] = [];
  spikyrefilling: string[] = [];
  silkyrefilling: string[] = [];
  bouncyrefilling: string[] = [];
  wavyrefilling: string[] = [];
  frontclass = '';
  status = '';
  leblfound = false;
  frontlabel = '';
  shapooprice = 0.0;
  totalamount = 0.0;
  droppedbottle = false;
  brandselected = false;
  quantityselected = false;
  confirmpressed = false;
  public instance: any;
  public instance1: any;
  currentUserRole: string = '';
  currentUserCartId = '';
  currentUserId = 0;
  currentusername = '';
  currentusergender = '';
  currentuseravatar = '';
  currentusercityId = '';
  objkey = Object.keys;
  positionObject = {
    'House6 Owner': [[-199, -3525], [694, 4010]],
    'House7 Owner': [[-443, -3538], [1031, 4010]],
    'House8 Owner': [[-744, -3475], [1369, 4010]],
    'House9 Owner': [[-1053, -3468], [1708, 4010]],
    'House10 Owner': [[-1282, -3537], [2044, 4010]],
    'House1 Owner': [[-277, -3247], [694, 3584]],
    'House2 Owner': [[-443, -3154], [1031, 3584]],
    'House3 Owner': [[-744, -3154], [1369, 3584]],
    'House4 Owner': [[-1053, -3154], [1708, 3584]],
    'House5 Owner': [[-1282, -3154], [2044, 3584]],
    'Plastic Recycling Plant Owner': [[-5641, -3623], [5931, 4010]],
    'Supermarket Owner': [[-5651, -3616], [6268, 4010]],
    'Universal Bottle Manufacturing Plant owner': [[-7116, -3154], [7590, 3584]],
    'Bottle Reverse Vending Machine Owner': [[-6635, -3154], [7279, 3584]],
    'B1 Shampoo Producer': [[-6135, -3562], [6604, 4010]],
    'B2 Shampoo Producer': [[-6435, -3183], [6943, 3584]],
    'B3 Shampoo Producer': [[-6472, -3562], [6943, 4010]],
    'B4 Shampoo Producer': [[-6793, -3562], [7280, 4010]],
    'B5 Shampoo Producer': [[-6956, -3562], [7590, 4010]],
    'Shampoo Refilling Station Owner': [[-6158, -3154], [6604, 3584]],
    'Universal Bottle Cleaning Plant Owner': [[-5762, -3154], [6268, 3584]],
    'Mayor': [[-5762, -3154], [5931, 3584]]
  }
  newmale: any[] = [];
  maleset = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39];
  user: any;
  assetdata: any;
  hasMayor = false;
  cityname: any;
  cityrate: any;
  canMoveTop = true;
  canMoveLeft = true;
  canMoveRight = true;
  canMoveBottom = true;
  topval = 0;
  cartlocrefill = '';
  setflag = 0;
  markettop = false;
  marketleft = false;
  marketright = false;
  marketbottom = false;
  refilltop = false;
  refillleft = false;
  refillright = false;
  refillbottom = false;
  cartlocmarket = '';
  deg = 90;
  whichRoad = '';
  cityCurrentTime = '';
  citycurrentday = 0;
  cityavatar = '';
  currentwallet = 0.0;
  showwallet = false;
  showratings = false;
  showbottles = false;
  showtransactions = false;
  altertab = 0;
  assetdataset: any[] = [];
  timeupdate = 0;
  citytiming = {
    'CurrentTime': {},
    'CurrentDay': 0
  }
  canupdatedb = false;
  sec = 0;
  transaction = {
    'TransactionId': '',
    'Amount': '',
    'DebitFacility': '',
    'CreditFacility': '',
    'Purpose': '',
    'Content_Amt': '',
    'Container_Amt': ''

  }
  municipalcashbox = 0;
  supermarketcashbox = 0;
  getrefillingstationcashbox = 0;
  transactioncount = '00000';
  billpaid = false;
  transactionsubcount = '00';
  updatebottleasset = {
    'currentitem': '',
    'Bottleloc': '',
    'bottlestatus': '',
    'transactionid': '',
    'fromfacility': '',
    'tofacility': '',
    'transactiondate': '',
    'purchased': '',
    'contentCode': '',
    'Latest_Refill_Date': ''
  }

  updatebottlereturn = {
    'currentitem': '',
    'Bottleloc': '',
    'bottlestatus': '',
    'fromfacility': '',
    'tofacility': '',
    'refunded': false,
    'transactionid': '',
    'transactiondate': ''
  }

  userDetails = {
    'currentuser': '',
    'currentCartId': '',
    'CityId': '',
    'CurrentDay': ''

  }
  currentUserPurhcased: any[] = [];
  showModal = false;
  modalSubscription!: Subscription;
  runGarbagetruck!: Subscription;
  loadPlantBottlesSubscription!: Subscription;
  //houseshelfList: string | CdkDropList<any> ='';
  constructor(private logser: LoginserviceService, private router: Router,
    private modalService: NgbModal, private sharedService: SharedServiceService, private renderer: Renderer2, private cdr: ChangeDetectorRef) {
    this.currentUserRole = this.logser.currentuser.Role;
    this.currentUserCartId = this.logser.currentuser.cartId;
    this.currentusername = this.logser.currentuser.Username;
    this.currentusergender = this.logser.currentuser.gender;
    this.currentuseravatar = this.logser.currentuser.avatar;
    this.currentusercityId = this.logser.currentuser.CityId;
  }
  private subscription!: Subscription;
  switchYesOrNo!: number; // The variable is now a number

  private hasCalledFunction = false;


  private cityInitialized = false;
  private timeInterval: any;
  private assetInterval: any;

  ngOnInit(): void {


    interval(1000)
      .pipe(takeWhile(() => !this.hasCalledFunction))
      .subscribe(seconds => {
        this.convertSeconds(seconds);
      });

    // Check if user has selected a city
    if (this.logser.currentuser.Username && this.logser.currentuser.CityId) {
      this.initializeCityData();
    } else {
      this.router.navigate(['/login']);
    }
  }


  shelfDropLists: CdkDropList[] = [];
  private initializeCityData(): void {
    // Prevent multiple initializations
    if (this.cityInitialized) return;
    this.cityInitialized = true;

    // Set user details
    this.userDetails = {
      currentuser: this.logser.currentuser.Username,
      CityId: this.logser.currentuser.CityId,
      currentCartId: this.logser.currentuser.cartId,
      CurrentDay: this.logser.currentuser.currentday.toString()
    };

    // Get all users
    this.logser.getAllUsers().subscribe((data) => {
      this.user = data;
      this.processUserData();

      // Get city names
      this.logser.getcitynames().subscribe((cityData) => {
        this.processCityData(cityData);

        // Set up intervals (only once)
        this.setupIntervals();
      });
    });

    // Get prices

    this.logser.getShampooPrice().subscribe((data: any) => {
      this.shampooPrice = data;
    });
  }

  private processUserData(): void {
    $(".houselite").hide();
    for (const user of this.user) {
      if (user.login == 1 && user.User_cityid == this.logser.currentuser.CityId) {
        $("." + user.Role.split(" ")[0]).show();
        this.currentUserId = user.UserId;
      }

      if (user.Username == this.currentusername) {
        this.currentwallet = parseFloat(user.wallet);
        this.logser.currentuser.wallet = user.wallet;

        if (!user.avatar) {
          this.noavatar = true;
          this.open(this.content);
        } else {
          this.logser.currentuser.avatar = user.avatar;
          this.currentuseravatar = user.avatar;
          $(".displaypic,.cartavatar").addClass('pic_' + user.avatar);
        }
      }

      if (user.Role && user.User_cityid == this.logser.currentuser.CityId) {

        const word = this.formatKey(user.Role);
        $(`.${word} .displaypanel`).html(user.Role);
        $(`.${word} .housedisplay`).html(user.Username).show();
        $(`.${word} .houselite`).show();
        if ([
          'Supermarket_Owner',
          'Plastic_Recycling_Plant_Owner',
          'Universal_Bottle_Cleaning_Plant_Owner',
          'Universal_Bottle_Manufacturing_Plant_owner',
          'Shampoo_Refilling_Station_Owner'
        ].includes(word)) {
          $(`.commoncls.${word}`).html('').addClass('openlight');
        }
      }

      if (user.User_cityid == this.logser.currentuser.CityId && user.avatar) {
        this.maleset = this.maleset.filter(m => m.toString() !== user.avatar);
      }
    }

    this.newmale = [...this.maleset];
  }

  private processCityData(cityData: any): void {
    setTimeout(() => {
      const city = cityData[0];
      if (city.MayorId != 0) {
        $(".mayorflag").show();
      }

      this.logser.currentuser.cityname = city.CityName;
      this.logser.currentuser.CurrentTime = this.convertSeconds(city.CurrentTime.toString());
      this.logser.currentuser.currentday = city.CurrentDay;
      this.logser.currentuser.cityrate = city.cityrate;
      this.logser.currentuser.cityavatar = city.cityavatar;

      this.cityrate = city.cityrate;
      this.cityavatar = city.cityavatar;
      this.cityname = city.CityName;
      this.cityCurrentTime = this.convertSeconds(city.CurrentTime);
      this.citycurrentday = city.CurrentDay;
      this.showwarning = city.display_at_dustbin;
      this.playwarning = city.garbage_truck_announcement;
      this.cityRuleReminderDay = city.garbage_truck_announcement;

      $(".maincity").addClass("city_" + this.cityavatar);
    }, 500);
  }

  private setupIntervals(): void {
    // Set up time interval (only if not already set)
    if (!this.timeInterval) {
      this.timeInterval = setInterval(() => this.loadtime(), 1000);
    }

    // Set up asset interval with error handling
    if (!this.assetInterval) {
      this.assetInterval = setInterval(async () => {
        try {
          await this.loadAvailableAsset();
        } catch (error) {
          console.error('Error loading assets:', error);
        }
      }, 9500);
    }
  }
  cityRuleReminderDay: number = 0;
  setTrue() {
    this.canMoveTop = true;
    this.canMoveBottom = true;
    this.canMoveRight = true;
    this.canMoveLeft = true;
  }
  shampooPrice: any[] = [];
  onDragStart(event: DragEvent) {

    event.preventDefault();
  }
  onDragStarted(event: CdkDragStart) {

  }
  onDragEnded(event: CdkDragEnd) {

  }

  currentlydraggingitem: string = '';
  convertSeconds(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    let string = hours + ':00';
    if (hours === 6 && !this.hasCalledFunction) {
      this.runtruck();
      this.hasCalledFunction = true; // Set the flag to true
    }
    return string
  }
  garBageTruckRuning = false;

  async runtruck() {
    if (this.garBageTruckRuning == false) {
      this.garBageTruckRuning = true;

      (this.playwarning == true) ? this.playAudioElement(this.anouncement.nativeElement, 0.8) : this.playAudioElement(this.trucksound.nativeElement, 0.8);

      $(".truck").animate({ left: '5210px' }, 1000, () => {
        $(".truck").css({ transform: 'rotate(-90deg)' }).addClass('top').removeClass('side');

        $(".truck").animate({ top: '3680px' }, 5500, () => {
          $(".truck").css({ transform: 'scaleX(-1)' }).addClass('side').removeClass('top');

          $(".truck").animate({ left: '7390px' }, 25000, () => {
            $(".truck").css({ transform: 'rotate(0deg)' });

            $(".truck").animate({ left: '5210px' }, 25000, () => {
              $(".truck").css({ transform: 'rotate(-90deg)' }).addClass('top').removeClass('side');

              $(".truck").animate({ top: '4070px' }, 2500, () => {
                $(".truck").css({ transform: 'scaleX(-1)' }).addClass('side').removeClass('top');

                $(".truck").animate({ left: '7390px' }, 25000, () => {
                  $(".truck").css({ transform: 'rotate(0deg)' });

                  $(".truck").animate({ left: '5210px' }, 25000, () => {
                    $(".truck").css({ transform: 'rotate(90deg)' }).addClass('top').removeClass('side');

                    $(".truck").animate({ top: '3060px' }, 5500, () => {
                      $(".truck").css({ transform: 'rotate(0deg)' }).addClass('side').removeClass('top');

                      $(".truck").animate({ left: '2730px' }, 5500, () => {
                        $(".truck").css({ transform: 'rotate(-90deg)' }).addClass('top').removeClass('side');

                        $(".truck").animate({ top: '3680px' }, 2500, () => {
                          $(".truck").css({ transform: 'rotate(0deg)' }).addClass('side').removeClass('top');

                          $(".truck").animate({ left: '300px' }, 25000, () => {
                            $(".truck").css({ transform: 'scaleX(-1)' });

                            $(".truck").animate({ left: '2730px' }, 25000, () => {
                              $(".truck").css({ transform: 'rotate(-90deg)' }).addClass('top').removeClass('side');

                              $(".truck").animate({ top: '4070px' }, 2500, () => {
                                $(".truck").css({ transform: 'rotate(0deg)' }).addClass('side').removeClass('top');

                                $(".truck").animate({ left: '300px' }, 25000, () => {
                                  $(".truck").css({ transform: 'scaleX(-1)' });

                                  $(".truck").animate({ left: '2730px' }, 25000, () => {
                                    $(".truck").css({ transform: 'rotate(90deg)' }).addClass('top').removeClass('side');

                                    $(".truck").animate({ top: '3060px' }, 5500, () => {
                                      $(".truck").css({ transform: 'scaleX(-1)' }).addClass('side').removeClass('top');

                                      $(".truck").animate({ left: '5210px' }, 5500, () => {
                                        $(".truck").css({ transform: 'rotate(90deg)' }).addClass('top').removeClass('side');

                                        $(".truck").animate({ top: '1025px' }, 5500, () => {
                                          $(".truck").css({ transform: 'scaleX(-1)' }).addClass('side').removeClass('top');

                                          $(".truck").animate({ left: '5933px' }, 5500, () => {
                                            $(".truck").removeClass("side").addClass("cleargarbage");
                                            $(".truck").css({ transform: 'rotate(0deg)' });

                                            $(".truck").animate({ left: '5933px' }, 5500, () => {
                                              $(".truck").addClass("side").removeClass("cleargarbage");
                                              this.garBageTruckRuning = false;
                                            });
                                          });
                                        });
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    }
  }
  array_BottleFromConveyor: any[] = [];
  bouncyclean: any[] = [];
  spikeclean: any[] = [];
  shinyclean: any[] = [];
  silkyclean: any[] = [];
  damagedclean: any[] = [];
  universalclean: any[] = [];
  loadReverseVendingBottles() {
    for (let i = 0; i < this.assetdataset.length; i++) {
      if (this.assetdataset[i]['Bottle_loc'] == 'Bottle Reverse Vending Machine') {
        this.array_BottleFromConveyor.push(this.assetdataset[i]);
        this.updateonlyloc['currentbottle'] = this.assetdataset[i]['AssetId'];
        this.updateonlyloc['Bottleloc'] = 'PlantReturnTruck';
        this.logser.updatelocation(this.updateonlyloc).subscribe(() => {
          console.log(`Bottle location updated to ${location}`);
        });
      }
    }

  }

  formatKey(key: string): string {
    return key.replace(/\s+/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2');
  }

  collectbottlefromreturnconveyor() {
    for (let i = 0; i < this.assetdataset.length; i++) {
      if (this.assetdataset[i]['Bottle_loc'] == 'Return Conveyor') {
        this.array_BottleFromConveyor.push(this.assetdataset[i]);
        this.updateonlyloc['currentbottle'] = this.assetdataset[i]['AssetId'];
        this.updateonlyloc['Bottleloc'] = 'PlantReturnTruck';
        this.logser.updatelocation(this.updateonlyloc).subscribe(() => {
          //console.log(`Bottle location updated to PlantReturnTruck`);
        });
      }
    }

  }
  clearDamagedBottles() {
    // Create a temporary array to hold damaged bottles
    const damagedBottles: any[] = [];

    // Collect all damaged bottles from the original array
    for (let i = 0; i < this.array_BottleFromConveyor.length; i++) {
      const bottle = this.array_BottleFromConveyor[i];

      if (bottle['Bottle_Status'].includes('Damaged')) {
        // Add the damaged bottle to the temporary array
        damagedBottles.push(bottle);
      }
    }

    // Now process all the collected damaged bottles
    const updateRequests: any[] = [];

    // Iterate over the collected damaged bottles
    damagedBottles.forEach(bottle => {
      // Add the cleaned bottle to the damaged clean array
      this.damagedclean.push(bottle);

      // Update the bottle's location to 'Recycling_Plant' and add it to the updateRequests array
      updateRequests.push(
        // Return the observable from 'updateBottleLocation' directly
        this.updateBottleLocation(bottle['AssetId'], 'Plastic_Recycling')
      );

      const updateContent = bottle['AssetId'].includes('UB')
        ? this.logser.updateUBContent(bottle['AssetId'])
        : this.logser.updateBrandedContent(bottle['AssetId']);

      // Add the content update observable to the list
      updateRequests.push(updateContent);
    });

    Promise.all(updateRequests)
      .then(() => {
        // Remove the processed damaged bottles from the original array
        this.array_BottleFromConveyor = this.array_BottleFromConveyor.filter(bottle =>
          !damagedBottles.includes(bottle)
        );
        this.loadGarbageBottles();
      })
      .catch(error => {
        console.error('Error updating damaged bottles:', error);
      });
  }


  clearBounceBottles() {
    this.clearSpecificBottleType('B3', 'Dirty', 'Bounce_Plant', this.bouncyclean);
  }

  clearSpikeBottles() {
    this.clearSpecificBottleType('B2', 'Dirty', 'Spike_Plant', this.spikeclean);
  }

  clearShinyBottles() {
    this.clearSpecificBottleType('B1', 'Dirty', 'Shiny_Plant', this.shinyclean);
  }

  clearSilkyBottles() {
    this.clearSpecificBottleType('B5', 'Dirty', 'Silky_Plant', this.silkyclean);
  }

  clearUniversalBottles() {
    this.clearSpecificBottleType('U', 'Dirty', 'Universal_Plant', this.universalclean);
  }

  clearSpecificBottleType(code: string, status: string, location: string, cleanArray: any[]) {
    // Create a temporary array to hold the bottles that need to be cleaned
    const bottlesToClean: any[] = [];

    // Collect all bottles that match the criteria
    this.array_BottleFromConveyor.forEach(bottle => {
      if (bottle['Bottle_Code'].includes(code) && bottle['Bottle_Status'].includes(status)) {
        // Add the bottle to the clean array
        cleanArray.push(bottle);
        // Add the bottle to the temporary array to process later
        bottlesToClean.push(bottle);
      }
    });

    // Prepare an array of promises to handle all the updates asynchronously
    const updateRequests: any[] = [];

    // Iterate over the collected bottles and add the update operations
    bottlesToClean.forEach(bottle => {
      // Choose the correct update method based on the code
      const updateContent = code !== 'U'
        ? this.logser.updateBrandedContent(bottle['AssetId'])
        : this.logser.updateUBContent(bottle['AssetId']);

      // Add the update request to the array
      updateRequests.push(
        updateContent.subscribe(() => {
          // After the database update, update the bottle location
          this.updateBottleLocation(bottle['AssetId'], location);
        })
      );
    });

    // Execute all the update requests in parallel and refresh the bottles list after all updates
    Promise.all(updateRequests)
      .then(() => {
        // Remove the cleaned bottles from the original array after all updates
        this.array_BottleFromConveyor = this.array_BottleFromConveyor.filter(bottle =>
          !bottlesToClean.includes(bottle)
        );

        // Once all updates are done, refresh the garbage bottles
        this.loadGarbageBottles();
      })
      .catch(error => {
        //console.error('Error updating bottles:', error);
        // Handle error (e.g., show a message to the user)
      });
  }




  updateBottleLocation(assetId: string, location: string) {
    this.updateonlyloc['currentbottle'] = assetId;
    this.updateonlyloc['Bottleloc'] = location;
    this.logser.updatelocation(this.updateonlyloc).subscribe(() => {
      console.log(`Bottle location updated to ${location}`);
    });
  }

  updateRetired = {
    'Bottle_loc': '',
    'Retirement_Date': '',
    'Retire_Reason': ''
  }

  updateBtlLocationandMakeitRetired(assetId: string, location?: string, reason?: string) {

    this.updateonlyloc['Bottle_loc'] = location;
    this.updateonlyloc['Retirement_Date'] = this.citycurrentday;
    this.updateonlyloc['Retire_Reason'] = reason;
    this.logser.updateBtlLocationandMakeitRetired(this.updateonlyloc, assetId).subscribe(() => {
      //console.log(`Bottle location updated to ${location}`);
    });
  }

  // Load garbage bottles method


  loadGarbageBottles() {
    this.bottletoClean = [];
    for (let y = 0; y < this.array_BottleFromConveyor.length; y++) {

      const data = this.array_BottleFromConveyor;
      const bottleContent = data[y]['Content_Code'].split('.')[0];
      const assetId = data[y]['AssetId'];

      if (data[y]['Bottle_Code'] === "UB.V" && data[y]['Content_Code'] === "B1.Shiny") {
        this.bottletoClean.push(`${assetId}atU${bottleContent}`);
      } else if (data[y]['Bottle_Code'] === "UB.R" && data[y]['Content_Code'] === "B3.Bouncy") {
        this.bottletoClean.push(`${assetId}atU${bottleContent}`);
      } else if (data[y]['Bottle_Code'] === "UB.R" && data[y]['Content_Code'] === "B4.Wavy") {
        this.bottletoClean.push(`${assetId}atU1${bottleContent}`);
      } else {
        this.bottletoClean.push(`${assetId}at${bottleContent}`);
      }
    }
  }
  bottletoClean: any[] = [];


  animateElement(element: any, properties: any, duration: any, options = {}) {
    return new Promise<void>((resolve) => {
      $(element).animate(properties, {
        ...options,
        duration,
        complete: function () {
          resolve(); // Call the Promise resolve when the animation completes
        },
      });
    });
  }

  applyTransform(element: any, transform: any) {
    $(element).css({ transform });
  }





  currentlystarted = 0;

  async rungarbagetruck() {
    if (this.currentlystarted == 0) {
      this.currentlystarted = 1;
      this.playAudioElement(this.trucksound.nativeElement, 0.8);
      this.collectbottlefromreturnconveyor();
      this.loadGarbageBottles();

      const animateElement = (element: any, properties: any, duration: number, callback: () => void) => {
        $(element).animate(properties, duration, callback);
      };

      const rotateElement = (element: any, angle: any, duration: number, callback: () => void) => {
        $(element).animate(
          { deg: angle },
          {
            duration: duration,
            step: function (now: number) {
              $(this).css({ transform: `rotate(${-now}deg)` });
            },
            complete: callback,
          }
        );
      };

      animateElement(".bottletruck", { left: "1490px" }, 800, () => {
        $(".bottletruck").addClass("garbagetop").removeClass("garbageside");
        rotateElement(".bottletruck", 90, 800, () => {
          animateElement(".bottletruck", { top: "3052px" }, 1800, () => {
            $(".bottletruck").css({ transform: "rotate(0deg) scaleX(-1)" }).addClass("garbageside").removeClass("garbagetop");
            animateElement(".bottletruck", { left: "5223px" }, 4000, () => {
              $(".bottletruck").css({ transform: "rotate(90deg)" }).addClass("garbagetop").removeClass("garbageside");
              animateElement(".bottletruck", { top: "2282px" }, 2200, () => {
                this.delay(2000).then(() => {
                  this.loadReverseVendingBottles();
                  this.loadGarbageBottles();
                  animateElement(".bottletruck", { top: "1879px" }, 2200, () => {
                    $(".bottletruck").css({ transform: "rotate(0deg) scaleX(1)" }).addClass("garbageside").removeClass("garbagetop");
                    animateElement(".bottletruck", { left: "2699px" }, 4800, () => {
                      $(".bottletruck").css({ transform: "rotate(90deg)" }).addClass("garbagetop").removeClass("garbageside");
                      animateElement(".bottletruck", { top: "950px" }, 1300, () => {
                        $(".bottletruck").css({ transform: "rotate(0deg) scaleX(1)" }).addClass("garbageside").removeClass("garbagetop");
                        animateElement(".bottletruck", { left: "1857px" }, 3300, () => {
                          this.delay(100).then(() => {
                            this.clearDamagedBottles();

                            this.delay(100).then(() => {
                              $(".bottletruck").css({ transform: "rotate(0deg) scaleX(1)" }).addClass("garbageside").removeClass("garbagetop");
                              animateElement(".bottletruck", { left: "2657px" }, 3300, () => {
                                $(".bottletruck").css({ transform: "rotate(90deg)" }).addClass("garbagetop").removeClass("garbageside");
                                animateElement(".bottletruck", { top: "482px" }, 1300, () => {
                                  $(".bottletruck").css({ transform: "rotate(0deg) scaleX(1)" }).addClass("garbageside").removeClass("garbagetop");
                                  animateElement(".bottletruck", { left: "1897px" }, 2800, () => {
                                    this.delay(300).then(() => {
                                      this.clearBounceBottles();
                                      this.delay(300).then(() => {
                                        animateElement(".bottletruck", { left: "1390px" }, 2800, () => {
                                          this.delay(300).then(() => {
                                            this.clearSpikeBottles();
                                            this.delay(300).then(() => {
                                              animateElement(".bottletruck", { left: "411px" }, 2800, () => {
                                                this.delay(300).then(() => {
                                                  this.clearShinyBottles();
                                                  this.delay(300).then(() => {
                                                    animateElement(".bottletruck", { left: "350px" }, 1300, () => {
                                                      this.delay(100).then(() => {
                                                        $(".bottletruck").css({ transform: "scaleX(-1)" });
                                                        animateElement(".bottletruck", { left: "2657px" }, 3700, () => {
                                                          $(".bottletruck").css({ transform: "rotate(-90deg)" }).addClass("garbagetop").removeClass("garbageside");
                                                          animateElement(".bottletruck", { top: "959px" }, 2800, () => {
                                                            $(".bottletruck").css({ transform: "scaleX(-1)" }).addClass("garbageside").removeClass("garbagetop");
                                                            animateElement(".bottletruck", { left: "5150px" }, 3300, () => {
                                                              $(".bottletruck").css({ transform: "rotate(90deg)" }).addClass("garbagetop").removeClass("garbageside");
                                                              animateElement(".bottletruck", { top: "501px" }, 2800, () => {
                                                                $(".bottletruck").css({ transform: "rotate(0deg) scaleX(-1)" }).addClass("garbageside").removeClass("garbagetop");
                                                                animateElement(".bottletruck", { left: "6367px" }, 2800, () => {
                                                                  animateElement(".bottletruck", { left: "7292px" }, 2800, () => {
                                                                    this.delay(200).then(() => {
                                                                      this.clearSilkyBottles();
                                                                      this.delay(200).then(() => {
                                                                        $(".bottletruck").css({ transform: "scaleX(1)" });
                                                                        animateElement(".bottletruck", { left: "5150px" }, 2800, () => {

                                                                          const hasUBBottles = this.bottletoClean.some(bottle => bottle.includes("atU"));

                                                                          if (hasUBBottles) {
                                                                            $(".bottletruck").css({ transform: "rotate(-90deg)" }).addClass("garbagetop").removeClass("garbageside");
                                                                            animateElement(".bottletruck", { top: "1556px" }, 2800, () => {
                                                                              $(".bottletruck").css({ transform: "rotate(0deg) scaleX(1)" }).addClass("garbageside").removeClass("garbagetop");
                                                                              animateElement(".bottletruck", { left: "4020px" }, 2200, () => {
                                                                                this.delay(300).then(() => {
                                                                                  this.loadGarbageBottles();

                                                                                  animateElement(".bottleWrapper", { width: "100%" }, 1300, () => {
                                                                                    this.delay(100).then(() => {
                                                                                      animateElement(".bottleWrapper", { left: "-5px", top: "-202px" }, 6000, () => {
                                                                                        animateElement(".bottleWrapper", { left: "-135px", 'opacity': '0' }, 2800, () => {

                                                                                          for (let bottle of this.bottletoClean) {
                                                                                            if (bottle.includes('U')) {
                                                                                              $(`#${bottle}`).removeClass().addClass("universalbottleimg bottle");
                                                                                              this.logser.updateUBContent(bottle.split('at')[0]).subscribe();
                                                                                            }
                                                                                          }

                                                                                          animateElement(".bottleWrapper", { left: "-498px", 'opacity': '1' }, 2800, () => {
                                                                                            animateElement(".bottleWrapper", { left: "80px", top: "-23px" }, 2800, () => {
                                                                                              animateElement(".bottleWrapper", { width: "65%" }, 1300, () => {
                                                                                                this.delay(100).then(() => {

                                                                                                  this.applyTransform(".bottletruck", "scaleX(-1)");
                                                                                                  animateElement(".bottletruck", { left: "5150px" }, 3300, () => {

                                                                                                    this.applyTransform(".bottletruck", "rotate(90deg)");
                                                                                                    $(".bottletruck").addClass("garbagetop").removeClass("garbageside");
                                                                                                    animateElement(".bottletruck", { top: "501px" }, 4000, () => {

                                                                                                      this.applyTransform(".bottletruck", "rotate(0deg) scaleX(-1)");
                                                                                                      $(".bottletruck").addClass("garbageside").removeClass("garbagetop");
                                                                                                      animateElement(".bottletruck", { left: "5683px" }, 1000, () => {

                                                                                                        this.clearUniversalBottles();
                                                                                                        this.delay(200).then(() => {
                                                                                                          this.applyTransform(".bottletruck", "scaleX(1)");
                                                                                                          animateElement(".bottletruck", { left: "5152px" }, 3300, () => {

                                                                                                            this.applyTransform(".bottletruck", "rotate(-90deg)");
                                                                                                            $(".bottletruck").addClass("garbagetop").removeClass("garbageside");
                                                                                                            animateElement(".bottletruck", { top: "935px" }, 1300, () => {

                                                                                                              this.applyTransform(".bottletruck", "rotate(0deg)");
                                                                                                              $(".bottletruck").addClass("garbageside").removeClass("garbagetop");
                                                                                                              animateElement(".bottletruck", { left: "2635px" }, 3000, () => {

                                                                                                                this.applyTransform(".bottletruck", "rotate(-90deg)");
                                                                                                                $(".bottletruck").addClass("garbagetop").removeClass("garbageside");
                                                                                                                animateElement(".bottletruck", { top: "3031px" }, 3000, () => {

                                                                                                                  this.applyTransform(".bottletruck", "rotate(0deg)");
                                                                                                                  $(".bottletruck").addClass("garbageside").removeClass("garbagetop");
                                                                                                                  animateElement(".bottletruck", { left: "1462px" }, 6000, () => {

                                                                                                                    this.applyTransform(".bottletruck", "rotate(90deg)");
                                                                                                                    $(".bottletruck").addClass("garbagetop").removeClass("garbageside");
                                                                                                                    animateElement(".bottletruck", { top: "2768px" }, 2000, () => {

                                                                                                                      this.applyTransform(".bottletruck", "rotate(0deg)");
                                                                                                                      $(".bottletruck").addClass("garbageside").removeClass("garbagetop");
                                                                                                                      animateElement(".bottletruck", { left: "1934px" }, 2000, () => {
                                                                                                                        this.currentlystarted = 0;
                                                                                                                      });
                                                                                                                    });
                                                                                                                  });
                                                                                                                });
                                                                                                              });
                                                                                                            });
                                                                                                          });
                                                                                                        });
                                                                                                      });
                                                                                                    });
                                                                                                  });
                                                                                                });
                                                                                              });
                                                                                            });
                                                                                          });
                                                                                        });
                                                                                      });
                                                                                    });
                                                                                  });
                                                                                });
                                                                              });
                                                                            });
                                                                          }
                                                                          else {

                                                                            this.applyTransform(".bottletruck", "rotate(-90deg)");
                                                                            $(".bottletruck").addClass("garbagetop").removeClass("garbageside");
                                                                            animateElement(".bottletruck", { top: "935px" }, 1300, () => {

                                                                              this.applyTransform(".bottletruck", "rotate(0deg)");
                                                                              $(".bottletruck").addClass("garbageside").removeClass("garbagetop");
                                                                              animateElement(".bottletruck", { left: "2635px" }, 3000, () => {

                                                                                this.applyTransform(".bottletruck", "rotate(-90deg)");
                                                                                $(".bottletruck").addClass("garbagetop").removeClass("garbageside");
                                                                                animateElement(".bottletruck", { top: "3031px" }, 3000, () => {

                                                                                  this.applyTransform(".bottletruck", "rotate(0deg)");
                                                                                  $(".bottletruck").addClass("garbageside").removeClass("garbagetop");
                                                                                  animateElement(".bottletruck", { left: "1462px" }, 6000, () => {

                                                                                    this.applyTransform(".bottletruck", "rotate(90deg)");
                                                                                    $(".bottletruck").addClass("garbagetop").removeClass("garbageside");
                                                                                    animateElement(".bottletruck", { top: "2768px" }, 2000, () => {

                                                                                      this.applyTransform(".bottletruck", "rotate(0deg)");
                                                                                      $(".bottletruck").addClass("garbageside").removeClass("garbagetop");
                                                                                      animateElement(".bottletruck", { left: "1934px" }, 2000, () => {
                                                                                        this.currentlystarted = 0;
                                                                                      });
                                                                                    });
                                                                                  });
                                                                                });
                                                                              });
                                                                            });

                                                                          }
                                                                        });
                                                                      });
                                                                    });
                                                                  });
                                                                });
                                                              });
                                                            });
                                                          });
                                                        });
                                                      });
                                                    });
                                                  });
                                                });
                                              });
                                            });
                                          });
                                        });
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    } else {
      this.alertModal.openModal("Truck is already Running. You can Start it only Truck returned !!!")
    }
    console.log("  this.currentlystarted " + this.currentlystarted)
  }
  totalReturnedBottles: any[] = [];
  maxRefill: string = '';
  shelfConfig = [
    // SHINY
    { key: 'shinyvpn', class: 'shinyvpn' },
    { key: 'shinyvpr', class: 'shinyvpr' },
    { key: 'shinyrpn', class: 'shinyrpn' },
    { key: 'shinyrpr', class: 'shinyrpr' },
    { key: 'shinyuvpn', class: 'shinyuvpn' },
    { key: 'shinyuvpr', class: 'shinyuvpr' },
    { key: 'shinyurpn', class: 'shinyurpn' },
    { key: 'shinyurpr', class: 'shinyurpr' },

    // SPIKY
    { key: 'spikyvpn', class: 'spikyvpn' },
    { key: 'spikyvpr', class: 'spikyvpr' },
    { key: 'spikyrpn', class: 'spikyrpn' },
    { key: 'spikyrpr', class: 'spikyrpr' },
    { key: 'spikyuvpn', class: 'spikyuvpn' },
    { key: 'spikyuvpr', class: 'spikyuvpr' },
    { key: 'spikyurpn', class: 'spikyurpn' },
    { key: 'spikyurpr', class: 'spikyurpr' },

    // SILKY
    { key: 'silkyvpn', class: 'silkyvpn' },
    { key: 'silkyvpr', class: 'silkyvpr' },
    { key: 'silkyrpn', class: 'silkyrpn' },
    { key: 'silkyrpr', class: 'silkyrpr' },
    { key: 'silkyuvpn', class: 'silkyuvpn' },
    { key: 'silkyuvpr', class: 'silkyuvpr' },
    { key: 'silkyurpn', class: 'silkyurpn' },
    { key: 'silkyurpr', class: 'silkyurpr' },

    // BOUNCY
    { key: 'bouncyvpn', class: 'bouncyvpn' },
    { key: 'bouncyvpr', class: 'bouncyvpr' },
    { key: 'bouncyrpn', class: 'bouncyrpn' },
    { key: 'bouncyrpr', class: 'bouncyrpr' },
    { key: 'bouncyuvpn', class: 'bouncyuvpn' },
    { key: 'bouncyuvpr', class: 'bouncyuvpr' },
    { key: 'bouncyurpn', class: 'bouncyurpn' },
    { key: 'bouncyurpr', class: 'bouncyurpr' },

    // WAVY
    { key: 'wavyvpn', class: 'wavyvpn' },
    { key: 'wavyvpr', class: 'wavyvpr' },
    { key: 'wavyrpn', class: 'wavyrpn' },
    { key: 'wavyrpr', class: 'wavyrpr' },
    { key: 'wavyuvpn', class: 'wavyuvpn' },
    { key: 'wavyuvpr', class: 'wavyuvpr' },
    { key: 'wavyurpn', class: 'wavyurpn' },
    { key: 'wavyurpr', class: 'wavyurpr' },
  ];
  getShelfArray(key: string): string[] {
    const shelf = this.shelfConfig.find(s => s.key === key);
    if (!shelf) {
      return [];
    }
    return this[key as keyof this] as string[];
  }
  modifiedKeyMap: { [key: string]: string } = {};

  private pushToContentArray(
    contentCode: string,
    bottleCode: string,
    refillCount: number,
    key: string,
    isDragged: boolean,
    bottleloc: string
  ) {

    // 🔐 SAFETY
    if (!contentCode || !contentCode.includes('.')) {
      console.warn('Invalid Content_Code', contentCode, key);
      return;
    }

    const content = contentCode.split('.')[1].toLowerCase();

    const isUB = bottleCode?.startsWith('UB');
    const isV = bottleCode?.endsWith('V');
    const isRefill = refillCount > 0;

    let suffix = '';
    if (isUB) suffix += 'u';
    suffix += isV ? 'v' : 'r';
    suffix += isRefill ? 'pr' : 'pn';

    const arrayName = `${content}${suffix}`;
    const modifiedKey = `${key}at${arrayName}`;

    // ✅ ALWAYS STORE
    this.modifiedKeyMap[key] = modifiedKey;

    // 🚦 Only control pushing into arrays
    if (isDragged || bottleloc !== 'Supermarket shelf') return;

    if ((this as any)[arrayName]) {
      (this as any)[arrayName].push(modifiedKey);
    }

  }



  async loadAvailableAsset() {
    if (this.logser.currentuser.Username != '' && this.currentusercityId != '') {
      $(".loadinglogo").hide();
      console.log("Polling...");
      this.logser.getAllAssets().subscribe((data) => {
        this.assetdataset = [];
        this.throwntoTruckList = [];
        this.dustbinbottles = [];
        this.refillbottles = [];
        this.BottleInHouseList = [];
        this.currentUserPurhcased = [];
        this.totalReturnedBottles = [];
        this.shinyvpn = [];
        this.shinyvpr = [];
        this.shinyrpn = [];
        this.shinyrpr = [];
        this.shinyuvpn = [];
        this.shinyuvpr = [];
        this.shinyurpn = [];
        this.shinyurpr = [];
        this.spikyvpn = [];
        this.spikyvpr = [];
        this.spikyrpn = [];
        this.spikyrpr = [];
        this.spikyuvpn = [];
        this.spikyuvpr = [];
        this.spikyurpn = [];
        this.spikyurpr = [];
        this.silkyvpn = [];
        this.silkyvpr = [];
        this.silkyrpn = [];
        this.silkyrpr = [];
        this.silkyuvpn = [];
        this.silkyuvpr = [];
        this.silkyurpn = [];
        this.silkyurpr = [];
        this.bouncyvpn = [];
        this.bouncyvpr = [];
        this.bouncyrpn = [];
        this.bouncyrpr = [];
        this.bouncyuvpn = [];
        this.bouncyuvpr = [];
        this.bouncyurpn = [];
        this.bouncyurpr = [];
        this.wavyvpn = [];
        this.wavyvpr = [];
        this.wavyrpn = [];
        this.wavyrpr = [];
        this.wavyuvpn = [];
        this.wavyuvpr = [];
        this.wavyurpn = [];
        this.wavyurpr = [];
        for (let y = 0; y < data.length; y++) {
          this.assetdataset.push(data[y]);

          let isDragged = data[y]['dragged'];
          let bottleloc = data[y]['Bottle_loc'];
          let isPurchased = data[y]['purchased'];
          let bottle_status = data[y]['Bottle_Status'];
          let bottle_remquantity = data[y]['remQuantity'];


          const contentCode = data[y]['Content_Code'];
          const bottleCode = data[y]['Bottle_Code'];
          const refillCount = data[y]['Current_PlantRefill_Count'];

          const key =
            "City" +
            data[y]['AssetId'];

          // Push into correct array (Shiny / Spiky / Silky / Bouncy / Wavy)
          this.pushToContentArray(
            contentCode,
            bottleCode,
            refillCount,
            key,
            isDragged,
            bottleloc
          );
          // Always update objects (same behavior as before)
          const finalKey = this.modifiedKeyMap[key];
          this.updateobjects(
            finalKey,
            isDragged,
            isPurchased,
            bottleloc,
            bottle_status,
            bottle_remquantity
          );


        }
      });



    }

  }



  alertnotified: boolean = false;
  loadtime() {

    if (this.logser.currentuser.Username != '' && this.logser.currentuser.CityId != '') {
      this.logser.updatecurrenttime().subscribe(
        data => {

          this.citytiming['CurrentTime'] = this.convertSeconds(data[0]['CurrentTime']);
          this.citytiming['CurrentDay'] = data[0].CurrentDay;

          if (this.citytiming['CurrentDay'] % 100 === 0 && this.currentUserRole == "Mayor" && this.citytiming['CurrentDay'] != this.cityRuleReminderDay && this.alertnotified == false) {
            this.alertModal.openModal("Remainder !!! <br/><div class='cssalignment'>You may edit the City Rules If you Wish. Please Click on the Below link to Proceed</div", true,
              () => {
                this.alertnotified = true;
                this.logser.updateNoticeonCityTable({ 'cityrul_notification': this.citytiming['CurrentDay'] }).subscribe(() => { });
                this.router.navigate(['/cityrule'], { queryParams: { option: 'cityrule' } }); // Example: Navigate to another route
              });

          }
        },
        error => {
          console.log(error);
        }
      );
    }
  }

  updateobjects(cat: any, isDragged: any, isPurchased: any, bottleloc: any, bottle_status: any, bottle_remquantity: any) {
    let existingItem = this.commonobj.findIndex(item => item.id === cat);
    if (existingItem == -1) {
      this.commonobj.push({ 'id': cat, 'status': 'available', 'Bottle_loc': 'Supermarket shelf' });
    }
    else {
      let currentItem = this.commonobj.findIndex(item => item.id === cat);
      if (isDragged == true && isPurchased == false && bottleloc !== 'Supermarket shelf') {
        this.commonobj[currentItem]['status'] = 'blocked';
        this.commonobj[currentItem]['Bottle_loc'] = bottleloc;
      }
      if (isDragged == true && isPurchased == true && bottleloc !== 'Supermarket shelf') {
        this.commonobj[currentItem]['status'] = 'purchased';
        this.commonobj[currentItem]['Bottle_loc'] = bottleloc;
      }

    }
    if (bottleloc == this.currentUserCartId && bottle_remquantity == 0) {
      this.refillbottles.push(cat);
    }

    else if (bottleloc == this.currentUserCartId && bottle_remquantity > 0) {
      this.currentUserPurhcased.push(cat);
    }
    if (bottleloc == "City Dustbin") {
      this.dustbinbottles.push(cat);
    }
    if (bottleloc == "Landfill") {
      this.throwntoTruckList.push(cat);
    }
    if (bottleloc == 'House@' + this.currentUserCartId) {
      this.BottleInHouseList.push(cat);
    }

    if (bottleloc == 'House@' + this.currentUserCartId) {
      if (bottle_status == 'Empty-Dirty' && bottle_remquantity == 0) {
        $(".Inhouseshelf_bottles #" + cat).addClass('zero-empty');
      }
      if (bottle_status == 'Damaged-Empty' && bottle_remquantity == 0) {
        $(".Inhouseshelf_bottles #" + cat).addClass('Damaged-Empty');
      }
      if (bottle_status == 'Damaged-InUse' && bottle_remquantity > 0) {
        $(".Inhouseshelf_bottles #" + cat).addClass('Damaged-InUse');
      }
      this.workonflags();

    }



  }
  checkCartPosition() {
    const topValue = parseInt($(".cart").css('top').split("px")[0]);
    const leftValue = parseInt($(".cart").css('left').split("px")[0]);
    const isWithinRange = (value: number, min: number, max: number) => value > min && value < max;

    if (isWithinRange(topValue, 2800, 2850) && isWithinRange(leftValue, 5290, 5891)) {
      this.whichRoad = "refillingstation";
      this.setTrue();
      if (this.currentUserPurhcased.length > 0) {
        this.playAudioElement(this.StopEntry.nativeElement, 0.8);
        this.alertModal.openModal("Sorry!  You are allowed to take only empty shampoo bottles inside this facility.     Please leave your non-empty bottles on the shelf at your house and come. You may also empty the bottle or throw the bottle if you wish, before entering.  Mind you! You may have to pay a fine if you throw the bottle.", false);
        this.canMoveRight = false;
      }
      else {
        this.opensuperflag = 2;
        this.refilledbottles.length = 0;
        this.openrefillingstation();
      }
    }
    else if (isWithinRange(topValue, 2200, 2300) && isWithinRange(leftValue, 5290, 6891)) {
      this.whichRoad = "reverseVendingMachine";
      this.setTrue();
      if (this.currentUserPurhcased.length > 0) {
        this.playAudioElement(this.StopEntry.nativeElement, 0.8);
        this.alertModal.openModal("Sorry!  You are allowed to take only empty shampoo bottles inside this facility.     Please leave your non-empty bottles on the shelf at your house and come. You may also empty the bottle or throw the bottle if you wish, before entering.  Mind you! You may have to pay a fine if you throw the bottle.", false);
        this.canMoveRight = false;
      }
      else {
        this.dopanzoom(-5250, -1862, '1');
      }


    } else if (isWithinRange(topValue, 3524, 3640) && isWithinRange(leftValue, 300, 7390)) {
      this.whichRoad = "mayorhouseroad";
      this.setTrue();
    } else if (isWithinRange(topValue, 2640, 3000) && isWithinRange(leftValue, 1500, 1700)) {
      this.whichRoad = "Supermarketroad";
      this.setTrue();
      if (topValue < 2720) {
        if (this.currentUserPurhcased.length > 0) {
          this.playAudioElement(this.StopEntry.nativeElement, 0.8);
          this.alertModal.openModal("Sorry!  You are allowed to take only empty shampoo bottles inside this facility.     Please leave your non-empty bottles on the shelf at your house and come. You may also empty the bottle or throw the bottle if you wish, before entering.  Mind you! You may have to pay a fine if you throw the bottle.", false);

        }
        else {
          this.playAudioElement(this.Supermarket_Return.nativeElement, 0.8);
          this.opensuperflag = 1;

          this.opensupermarket();
        }

      }
    } else if (isWithinRange(topValue, 4000, 4065) && isWithinRange(leftValue, 5300, 7390)) {
      this.whichRoad = "lowercolonyrightroad";
      this.setTrue();
    } else if (isWithinRange(topValue, 0, 4395) && isWithinRange(leftValue, 2700, 2800)) {
      this.whichRoad = "lefthorizontalroad";
      this.setTrue();
    } else if (isWithinRange(topValue, 0, 4395) && isWithinRange(leftValue, 5190, 5300)) {

      if (isWithinRange(topValue, 2800, 2850) && isWithinRange(leftValue, 5300, 5891)) {
        if (this.opensuperflag != 2) {
          this.opensuperflag = 2;
          this.openrefillingstation();
        }
        this.setTrue(); this.whichRoad = "refillingstation";
      }
      else if (isWithinRange(topValue, 2200, 2300) && isWithinRange(leftValue, 5300, 5891)) {
        this.dopanzoom(-5250, -1862, '1');
        this.setTrue(); this.whichRoad = "reverseVendingMachine";
      }
      else {
        this.whichRoad = "rightroad";
        this.setTrue();
      }
    } else if (isWithinRange(topValue, 4000, 4065) && isWithinRange(leftValue, 300, 2800)) {
      this.whichRoad = "leftcolonybottom";
      this.setTrue();
    } else if (isWithinRange(topValue, 2950, 3050) && isWithinRange(leftValue, 0, 5400)) {
      this.whichRoad = "municipalityroad";
      this.setTrue();
    } else {
      this.canMoveLeft = false;
      this.canMoveTop = false;
      this.canMoveBottom = false;
      this.canMoveRight = false;

      if (this.whichRoad == 'rightroad') {

        if (leftValue <= 5190) {
          this.canMoveBottom = true;
          this.canMoveTop = true;
          this.canMoveLeft = false;
          this.canMoveRight = true;
        }
        if (leftValue >= 5300) {
          this.canMoveTop = true;
          this.canMoveBottom = true;
          this.canMoveLeft = true;
          this.canMoveRight = false;
        }
        if (topValue <= 0) {
          this.canMoveRight = true;
          this.canMoveLeft = true;
          this.canMoveTop = false;
          this.canMoveBottom = true;

        }
        if (topValue >= 4395) {
          this.canMoveRight = true;
          this.canMoveLeft = true;
          this.canMoveTop = true;
          this.canMoveBottom = false;
        }
      }
      else if (this.whichRoad == 'refillingstation') {
        if (leftValue <= 5700) {
          this.canMoveBottom = true;
          this.canMoveTop = true;
          this.canMoveLeft = false;
          this.canMoveRight = true;
        }
        if (leftValue >= 5790) {
          this.canMoveTop = true;
          this.canMoveBottom = true;
          this.canMoveLeft = true;
          this.canMoveRight = false;
        }
        if (topValue <= 2789) {
          this.canMoveRight = true;
          this.canMoveLeft = true;
          this.canMoveTop = false;
          this.canMoveBottom = true;
        }
        if (topValue >= 2723) {
          this.canMoveRight = true;
          this.canMoveLeft = true;
          this.canMoveTop = true;
          this.canMoveBottom = false;
        }
      }

      else if (this.whichRoad == 'reverseVendingMachine') {
        if (leftValue <= 5290) {
          this.canMoveBottom = true;
          this.canMoveTop = true;
          this.canMoveLeft = false;
          this.canMoveRight = true;
        }
        if (leftValue >= 6891) {
          this.canMoveTop = true;
          this.canMoveBottom = true;
          this.canMoveLeft = true;
          this.canMoveRight = false;
        }
        if (topValue <= 2300) {
          this.canMoveRight = true;
          this.canMoveLeft = true;
          this.canMoveTop = false;
          this.canMoveBottom = true;
        }
        if (topValue >= 2200) {
          this.canMoveRight = true;
          this.canMoveLeft = true;
          this.canMoveTop = true;
          this.canMoveBottom = false;
        }
      }
      else if (this.whichRoad == 'mayorhouseroad') {

        if (topValue <= 3524) {

          this.canMoveBottom = true;
          this.canMoveTop = false;
          this.canMoveLeft = true;
          this.canMoveRight = true;
        }
        if (topValue >= 3640) {
          this.canMoveTop = true;
          this.canMoveBottom = false;
          this.canMoveLeft = true;
          this.canMoveRight = true;
        }
        if (leftValue <= 300) {
          this.canMoveRight = true;
          this.canMoveLeft = false;
          this.canMoveTop = true;
          this.canMoveBottom = true;
        }
        if (leftValue >= 7390) {
          this.canMoveRight = false;
          this.canMoveLeft = true;
          this.canMoveTop = true;
          this.canMoveBottom = true;
        }
      }
      else if (this.whichRoad == "Supermarketroad") {
        if (topValue <= 2640) {
          this.canMoveBottom = true;
          this.canMoveTop = false;
          this.canMoveLeft = true;
          this.canMoveRight = true;
        }
        if (topValue >= 3000) {
          this.canMoveTop = true;
          this.canMoveBottom = false;
          this.canMoveLeft = true;
          this.canMoveRight = true;
        }
        if (leftValue <= 1500) {
          this.canMoveRight = true;
          this.canMoveLeft = false;
          this.canMoveTop = true;
          this.canMoveBottom = true;
        }
        if (leftValue >= 1700) {
          this.canMoveRight = false;
          this.canMoveLeft = true;
          this.canMoveTop = true;
          this.canMoveBottom = true;
        }
      }
      else if (this.whichRoad == "lowercolonyrightroad") {
        if (topValue <= 4010) {
          this.canMoveBottom = true;
          this.canMoveTop = false;
          this.canMoveLeft = true;
          this.canMoveRight = true;
        }
        if (topValue >= 4065) {
          this.canMoveTop = true;
          this.canMoveBottom = false;
          this.canMoveLeft = true;
          this.canMoveRight = true;
        }
        if (leftValue <= 5300) {
          this.canMoveRight = true;
          this.canMoveLeft = false;
          this.canMoveTop = true;
          this.canMoveBottom = true;
        }
        if (leftValue >= 7390) {
          this.canMoveRight = false;
          this.canMoveLeft = true;
          this.canMoveTop = true;
          this.canMoveBottom = true;
        }
      }
      else if (this.whichRoad == "lefthorizontalroad") {
        if (topValue <= 4010) {
          this.canMoveBottom = true;
          this.canMoveTop = false;
          this.canMoveLeft = true;
          this.canMoveRight = true;
        }
        if (topValue >= 4065) {
          this.canMoveTop = true;
          this.canMoveBottom = false;
          this.canMoveLeft = true;
          this.canMoveRight = true;
        }
        if (leftValue <= 2700) {
          this.canMoveRight = true;
          this.canMoveLeft = false;
          this.canMoveTop = true;
          this.canMoveBottom = true;
        }
        if (leftValue >= 2800) {
          this.canMoveRight = false;
          this.canMoveLeft = true;
          this.canMoveTop = true;
          this.canMoveBottom = true;
        }
      }

      else if (this.whichRoad == "leftcolonybottom") {
        if (topValue <= 4010) {
          this.canMoveBottom = true;
          this.canMoveTop = false;
          this.canMoveLeft = true;
          this.canMoveRight = true;
        }
        if (topValue >= 4065) {
          this.canMoveTop = true;
          this.canMoveBottom = false;
          this.canMoveLeft = true;
          this.canMoveRight = true;
        }
        if (leftValue <= 300) {
          this.canMoveRight = true;
          this.canMoveLeft = false;
          this.canMoveTop = true;
          this.canMoveBottom = true;
        }
        if (leftValue >= 2800) {
          this.canMoveRight = false;
          this.canMoveLeft = true;
          this.canMoveTop = true;
          this.canMoveBottom = true;
        }
      }
      else if (this.whichRoad == "municipalityroad") {
        if (leftValue <= 0) {
          this.canMoveBottom = true;
          this.canMoveTop = true;
          this.canMoveLeft = false;
          this.canMoveRight = true;
        }
        if (leftValue >= 5400) {
          this.canMoveTop = true;
          this.canMoveBottom = true;
          this.canMoveLeft = true;
          this.canMoveRight = false;
        }
        if (topValue <= 2950) {
          this.canMoveRight = true;
          this.canMoveLeft = true;
          this.canMoveTop = false;
          this.canMoveBottom = true;
        }
        if (topValue >= 3050) {
          this.canMoveRight = true;
          this.canMoveLeft = true;
          this.canMoveTop = true;
          this.canMoveBottom = false;
        }
      }

    }
  }


  @HostListener('document:keydown.arrowdown', ['$event'])
  movedown($event: any) {
    $event.stopPropagation();
    if (this.opensuperflag == 0) {

      this.checkCartPosition();
      if (this.canMoveBottom) {
        let leftval = $(".cart").css('top');
        leftval = parseInt(leftval) + 10 + "px";
        $(".cart").css({ 'top': leftval })
      }
    }
    else if (this.opensuperflag == 1) {
      this.supercartposition();
      if (this.marketbottom == true) {
        let leftval = $(".supermarketcart").css('top');
        leftval = parseInt(leftval) + 50 + "px";
        $(".supermarketcart").css({ 'top': leftval })
      }
    }
    else if (this.opensuperflag == 2) {
      this.refillcartposition();
      if (this.refillbottom == true) {
        let leftval = $("#refillcart").css('top');
        leftval = parseInt(leftval) + 10 + "px";
        $("#refillcart").css({ 'top': leftval })
      }
    }
  }
  @HostListener('document:keydown.arrowup', ['$event'])
  moveup($event: any) {
    $event.stopPropagation();
    if (this.opensuperflag == 0) {
      this.checkCartPosition();
      if (this.canMoveTop) {
        let leftval = $(".cart").css('top');
        leftval = parseInt(leftval) - 10 + "px";
        $(".cart").css({ 'top': leftval })
      }
    }
    else if (this.opensuperflag == 1) {
      this.supercartposition();
      if (this.markettop == true) {
        let leftval = $(".supermarketcart").css('top');
        leftval = parseInt(leftval) - 50 + "px";
        $(".supermarketcart").css({ 'top': leftval })
      }
    }
    else if (this.opensuperflag == 2) {
      this.refillcartposition();
      if (this.refilltop == true) {
        let leftval = $("#refillcart").css('top');
        leftval = parseInt(leftval) - 10 + "px";
        $("#refillcart").css({ 'top': leftval })
      }
    }
  }
  @HostListener('document:keydown.arrowleft', ['$event'])
  moveleft($event: any) {
    $event.stopPropagation();
    if (this.opensuperflag == 0) {
      this.checkCartPosition();
      if (this.canMoveLeft == true) {
        let leftval = $(".cart").css('left');
        leftval = parseInt(leftval) - 10 + "px";
        $(".cart").css({ 'left': leftval })
      }
    }
    else if (this.opensuperflag == 1) {
      this.supercartposition();
      if (this.marketleft == true) {
        let leftval = $(".supermarketcart").css('left');
        leftval = parseInt(leftval) - 50 + "px";
        $(".supermarketcart").css({ 'left': leftval })
      }
    }
    else if (this.opensuperflag == 2) {
      this.refillcartposition();
      if (this.refillleft == true) {
        let leftval = $("#refillcart").css('left');
        leftval = parseInt(leftval) - 10 + "px";
        $("#refillcart").css({ 'left': leftval })
      }
    }
  }
  @HostListener('document:keydown.arrowright', ['$event'])
  moveright($event: any) {

    $event.stopPropagation();

    if (this.opensuperflag == 0) {
      this.checkCartPosition();
      if (this.canMoveRight == true) {
        let leftval = $(".cart").css('left');
        leftval = parseInt(leftval) + 10 + "px";
        $(".cart").css({ 'left': leftval })
      }
    }
    else if (this.opensuperflag == 1) {
      this.supercartposition();
      if (this.marketright == true) {
        let leftval = $(".supermarketcart").css('left');
        leftval = parseInt(leftval) + 50 + "px";
        $(".supermarketcart").css({ 'left': leftval })
      }
    }
    else if (this.opensuperflag == 2) {
      this.refillcartposition();
      if (this.refillright == true) {
        let leftval = $("#refillcart").css('left');
        leftval = parseInt(leftval) + 10 + "px";
        $("#refillcart").css({ 'left': leftval })
      }
    }
  }
  setrefilltrue() {
    this.refilltop = true;
    this.refillleft = true;
    this.refillright = true;
    this.refillbottom = true;
  }
  recente = 0;
  recenter() {

    if (this.opensuperflag == 0) {
      // Target zoom level
      const zoomLevel = 1;

      // Get the `.cart` element position
      const left = parseInt($(".cart").css('left').split('px')[0]);
      const top = parseInt($(".cart").css('top').split('px')[0]);

      // Calculate the offsets, adjusting for the center position
      const adjustedLeft = (left - 650) * -1 / zoomLevel;
      const adjustedTop = (top - 300) * -1 / zoomLevel;

      // Apply zoom and pan
      this.instance.zoomTo(adjustedLeft, adjustedTop, zoomLevel);
      this.instance.smoothMoveTo(adjustedLeft, adjustedTop);

      // Set the scale (if needed, though Panzoom should handle this automatically)
      this.instance.getTransform().scale = zoomLevel;

    }
    else if (this.opensuperflag == 1) {
      const zoomLevel = 0.4;

      // Get the target element position
      const left = parseInt($(".supermarketcart").css('left').split('px')[0]);
      const top = parseInt($(".supermarketcart").css('top').split('px')[0]);


      // Adjust pan position based on zoom level
      const adjustedLeft = (left * -1 * zoomLevel) + 550;
      const adjustedTop = (top * -1 * zoomLevel) + 300;

      // Apply the zoom and pan
      this.instance1.zoomTo(adjustedLeft, adjustedTop, zoomLevel);
      this.instance1.smoothMoveTo(adjustedLeft, adjustedTop);

      // Update the transform manually if needed
      this.instance1.getTransform().scale = zoomLevel;
    }
    if (this.recente == 0) {
      this.recente = 1;
      this.recenter();
    }

  }

  zoomIn(event: any) {

    event.preventDefault();
    event.stopPropagation();
    if (this.opensuperflag == 0) {
      let c = this.instance.getTransform();
      let r = c.scale;
      if (r < 2.5 && r > 0.25) {

        let s = r + 0.1;
        this.instance.zoomTo(0, 0, s);
        this.instance.getTransform().scale = s;
      }
    }
    else if (this.opensuperflag == 1) {
      let c = this.instance1.getTransform();
      let r = c.scale;
      if (r < 2.5 && r > 0.25) {

        let s = r + 0.1;
        this.instance1.zoomTo(0, 0, s);
        this.instance1.getTransform().scale = s;
      }
    }
  }
  zoomOut(event: any) {
    event.preventDefault();
    event.stopPropagation();
    if (this.opensuperflag == 0) {
      let c = this.instance.getTransform();
      let r = c.scale;
      if (r > 0.4 && r < 2.5) {

        let z = r - 0.1;
        this.instance.zoomTo(0, 0, z);
        this.instance.getTransform().scale = z;
      }
    }
    else if (this.opensuperflag == 1) {
      let c = this.instance1.getTransform();
      let r = c.scale;
      if (r > 0.4 && r < 2.5) {

        let z = r - 0.1;
        this.instance1.zoomTo(0, 0, z);
        this.instance1.getTransform().scale = z;
      }
    }
  }

  refillcartposition() {
    let topValue = parseInt($("#refillcart").css('top').split("px")[0]);
    let leftValue = parseInt($("#refillcart").css('left').split("px")[0]);

    if (leftValue <= 40 && leftValue >= 15 && topValue > 242 && topValue < 292) {
      this.movetomaincity();
    }
    if (topValue < 350 && topValue > 310 && leftValue > 10 && leftValue < 1060) {
      this.cartlocrefill = "enterpoint";
      this.resetrefilling();
      this.setrefilltrue();
    }
    else if (topValue > 242 && topValue < 292 && leftValue > 30 && leftValue < 1060) {
      this.cartlocrefill = "exitpoint";
      this.setrefilltrue();
      if (leftValue <= 40 && leftValue >= 15) {
        this.movetomaincity();
      }
    }

    else {
      this.refilltop = false;
      this.refillleft = false;
      this.refillright = false;
      this.refillbottom = false;

      if (this.cartlocrefill == 'enterpoint') {
        if (topValue >= 310) {
          this.refillbottom = true;
          this.refilltop = false;
          this.refillleft = true;
          this.refillright = true;
        }
        else if (topValue <= 350) {
          this.refilltop = true;
          this.refillbottom = false;
          this.refillleft = true;
          this.refillright = true;
        }
        else if (leftValue >= 10) {
          this.refillright = true;
          this.refillbottom = true;
          this.refilltop = true;
          this.refillleft = false;
        }
        else if (leftValue <= 1060) {
          this.refillleft = true;
          this.refillbottom = true;
          this.refilltop = true;
          this.refillright = false;
        }

      }

      else if (this.cartlocrefill == 'exitpoint') {
        if (topValue <= 242) {
          this.refillbottom = true;
          this.refilltop = false;
          this.refillleft = true;
          this.refillright = true;
        }
        else if (topValue >= 292) {
          this.refilltop = true;
          this.refillbottom = false;
          this.refillleft = true;
          this.refillright = true;
        }
        else if (leftValue >= 10) {
          this.refillright = true;
          this.refillbottom = true;
          this.refilltop = true;
          this.refillleft = false;
        }
        else if (leftValue <= 1060) {
          this.refillleft = true;
          this.refillbottom = true;
          this.refilltop = true;
          this.refillright = false;
        }
      }
    }
  }

  setmarkettrue() {
    this.markettop = true;
    this.marketleft = true;
    this.marketright = true;
    this.marketbottom = true;
  }
  previousBottleTakenIds: string[] = [];
  private previousBottleTaken: string[] = [];
  private arraysAreEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((item, index) => item === arr2[index]);
  }
  supercartposition() {
    let topValue = parseInt($(".supermarketcart").css('top').split("px")[0]);
    let leftValue = parseInt($(".supermarketcart").css('left').split("px")[0]);
    if (this.setflag == 0 || this.setflag == 1) {
      if (topValue < 3533 && topValue > 3090 && leftValue > 920 && leftValue < 4900) {
        this.cartlocmarket = "nearconveyor";
        this.setmarkettrue();
      }
      else if ((topValue < 3089 && topValue > 1040 && leftValue > 930 && leftValue < 1130)) {
        this.cartlocmarket = "exiting";
        this.setmarkettrue();
        if (leftValue < 1120 && topValue < 1100) {
          this.closesupermarket()

        }
      }

      else {
        this.markettop = false;
        this.marketleft = false;
        this.marketright = false;
        this.marketbottom = false;
        if (this.cartlocmarket == "nearconveyor") {
          if (topValue > 3533) {
            this.markettop = true;
            this.marketleft = true;
            this.marketright = true;
            this.marketbottom = false;
          }
          if (topValue < 3090) {
            this.markettop = false;
            this.marketleft = true;
            this.marketright = true;
            this.marketbottom = true;
          }
          if (leftValue < 920) {
            this.markettop = true;
            this.marketleft = false;
            this.marketright = true;
            this.marketbottom = true;
          }
          if (leftValue > 4900) {
            this.markettop = true;
            this.marketleft = true;
            this.marketright = false;
            this.marketbottom = true;
          }
        }
        if (this.cartlocmarket == "exiting") {
          if (topValue > 3089) {
            this.markettop = true;
            this.marketleft = true;
            this.marketright = true;
            this.marketbottom = false;
          }
          if (topValue < 1040) {
            this.markettop = false;
            this.marketleft = true;
            this.marketright = true;
            this.marketbottom = true;
          }
          if (leftValue < 930) {
            this.markettop = true;
            this.marketleft = false;
            this.marketright = true;
            this.marketbottom = true;
          }
          if (leftValue > 1130) {
            this.markettop = true;
            this.marketleft = true;
            this.marketright = false;
            this.marketbottom = true;
          }
        }
      }



      if (topValue < 3533 && topValue > 3090 && leftValue > 4900 && leftValue < 5000) {
        this.cartlocmarket = "nearconveyor";
        this.setmarkettrue();
        // if ($(".cart_bottle_list").children('div').length > 0 || $(".newbottle_list").children('div').length > 0) {
        if ($(".cart_bottle_list").children('div').length > 0) {
          this.marketright = false;
          $("#checklight2").removeClass('green')
          $("#checklight1").addClass('red');
          $("#innerdoor1").css('background-color', '#bc0000');

          if (this.setflag == 0) {
            this.alertModal.openModal("Please place all items you intend to return at the mouth of the conveyor", false);
            this.setflag = 1;
          }
        }
        else {
          this.setflag = 2
        }
      }
    }
    if (this.setflag == 2) {
      if (leftValue > 4980 && leftValue < 5050 && topValue < 3533 && topValue > 3090) {
        $("#checklight1").removeClass('red')
        $("#checklight2").addClass('green');
        this.cartlocmarket = "supermatketentry";
        $("#innerdoor1").css('background-color', '#00ba00');
        this.setmarkettrue();
        this.playAudioElement(this.cityrail.nativeElement, 0.3);

        $('#innerdoor1').animate({ 'height': '100px' }, 300);
        this.setflag = 3;
      }


    }
    if (this.setflag == 3 || this.setflag == 4) {

      if (topValue > 3090 && topValue < 3533 && leftValue > 5000 && leftValue < 11400) {
        if (this.setflag == 3) {
          if (leftValue > 5700 && leftValue < 5800) {
            this.playAudioElement(this.welcomemarket.nativeElement, 0.8);
            $("#checklight2").removeClass('green');
            this.setflag = 4;
            $('#innerdoor1').animate({ 'height': '1076px' }, 300);
          }
        }
        this.cartlocmarket = "maincorider";
        this.setmarkettrue();

      }
      else if (topValue > 1005 && topValue < 3240 && leftValue > 11250 && leftValue < 11450) {
        this.cartlocmarket = "turningcorider";
        this.setmarkettrue();
      }
      else if (topValue > 1005 && topValue < 1270 && leftValue > 6050 && leftValue < 11450) {
        this.cartlocmarket = "othercorider";
        this.setmarkettrue();
        if (leftValue > 6600 && leftValue < 7000 && !this.billpaid && (!this.arraysAreEqual(this.previousBottleTaken, this.bottletaken) || this.takenItemsfromSupermarket != this.bottletaken.length) && this.bottletaken.length > 0) {
          this.takenItemsfromSupermarket = this.bottletaken.length; // Prevent re-entry
          this.previousBottleTaken = [...this.bottletaken]; // Store a copy for comparison
          console.log(this.previousBottleTaken)
          this.startbilling();
          this.playAudioElement(this.cityrail.nativeElement, 0.3);
        }

      }
      else if (topValue > 1005 && topValue < 1270 && leftValue > 5600 && leftValue < 6050) {
        if (this.billpaid == true && this.bottletaken.length > 0) {
          this.playAudioElement(this.thankyousuper.nativeElement, 0.8);
          $(".displaymoniter").html("Thank you! Visit Again!");
          this.cartlocmarket = "cameout";
          $(".cartid_highlight").removeClass('highlight');
          $("#innerdoor2").animate({ 'height': '100px' }, 200);
        }
        else if (this.billpaid == false && this.bottletaken.length == 0) {
          this.playAudioElement(this.thankyousuper.nativeElement, 0.8);
          $(".displaymoniter").html("Thank you! Visit Again!");
          this.cartlocmarket = "cameout";
          $(".cartid_highlight").removeClass('highlight');
          $("#innerdoor2").animate({ 'height': '100px' }, 200);
        }
        else if (this.billpaid == false && this.bottletaken.length > 0) {
          this.alertModal.openModal("Please pay the amount for your Purchase", false);
          this.marketleft = false;
        }
      }
      else if (topValue > 1005 && topValue < 1270 && leftValue <= 5700 && leftValue > 1000) {
        this.cartlocmarket = "cameout";
        if (leftValue < 5200) {
          $("#innerdoor2").animate({ 'height': '1030px' }, 200);
          this.marketright = false;
        }
        if (leftValue <= 1070) {
          this.closesupermarket()

        }
      }

      else if (topValue > 1005 && topValue < 1270 && leftValue < 1000) {
        this.cartlocmarket = "stopped";
        this.markettop = false;
        this.marketleft = false;
        this.marketright = false;
        this.marketbottom = false;
      }

      else {
        this.markettop = false;
        this.marketleft = false;
        this.marketright = false;
        this.marketbottom = false;
        if (this.cartlocmarket == 'maincorider') {
          if (topValue < 3090) {
            this.marketbottom = true;
            this.markettop = false;
            this.marketleft = true;
            this.marketright = true;
          }
          else if (topValue > 3400) {
            this.markettop = true;
            this.marketbottom = false;
            this.marketleft = true;
            this.marketright = true;
          }
          else if (leftValue < 5000) {
            this.marketright = true;
            this.marketbottom = true;
            this.markettop = true;
            this.marketleft = false;
          }
          else if (leftValue > 11400) {
            this.marketleft = true;
            this.marketbottom = true;
            this.markettop = true;
            this.marketright = false;

          }
        }
        else if (this.cartlocmarket == 'turningcorider') {
          if (topValue < 1005) {
            this.marketbottom = true;
            this.markettop = false;
            this.marketleft = true;
            this.marketright = true;
          }
          else if (topValue > 3240) {
            this.markettop = true;
            this.marketbottom = false;
            this.marketleft = true;
            this.marketright = true;
          }
          else if (leftValue < 11250) {
            this.marketright = true;
            this.markettop = true;
            this.marketbottom = true;
            this.marketleft = false;
          }
          else if (leftValue > 11450) {
            this.marketleft = true;
            this.marketright = false;
            this.markettop = true;
            this.marketbottom = true;
          }
        }
        else if (this.cartlocmarket == 'othercorider') {


          if (topValue < 1020) {
            this.marketbottom = true;
            this.markettop = false;
            this.marketleft = true;
            this.marketright = true;
          }
          else if (topValue > 1270) {
            this.markettop = true;
            this.marketbottom = false;
            this.marketleft = true;
            this.marketright = true;
          }
          else if (leftValue < 6050) {
            this.marketright = true;
            this.markettop = true;
            this.marketbottom = true;
            this.marketleft = false;
          }
          else if (leftValue > 11450) {
            this.marketleft = true;
            this.marketright = false;
            this.markettop = true;
            this.marketbottom = true;
          }
        }
        else if (this.cartlocmarket == 'cameout') {
          if (topValue < 1020) {
            this.marketbottom = true;
            this.markettop = false;
            this.marketleft = true;
            this.marketright = true;
          }
          else if (topValue > 1270) {
            this.markettop = true;
            this.marketbottom = false;
            this.marketleft = true;
            this.marketright = true;
          }
          else if (leftValue < 5700 && leftValue > 1000) {
            this.marketright = false;
            this.markettop = true;
            this.marketbottom = true;
            this.marketleft = true;
          }
          else if (leftValue < 900) {
            this.marketright = false;
            this.markettop = false;
            this.marketbottom = false;
            this.marketleft = false;
          }

        }
      }
    }
    ////console.log(this.cartlocmarket)
  }


  movetomaincity() {
    this.opensuperflag = 0;
    let where = this;
    setTimeout(function () {
      where.dopanzoom(-4853, -2622, '1');
      where.resetrefilling();
      where.setrefilltrue();
    }, 100);
    $(".cart").css({ 'left': '5310px', 'top': '2760px' })
  }

  updateDragged: any = {
    'dragged': false,
    'purchased': false,
    'Bottle_loc': '',
    'currentbottle': ''
  };
  payamount() {
    if (this.billpaid == false && this.opensuperflag == 1) {


      if (this.currentwallet > this.netamount) {
        const purchaseData = {

          userid: this.logser.currentuser.UserId,

          cityid: this.currentusercityId,

          bottles: this.bottletaken

        };

        this.logser.purchase(purchaseData).subscribe(res => {

          console.log(res);

        });
        this.currentwallet = this.currentwallet - this.netamount;
        this.logser.currentuser.wallet = this.currentwallet;


        this.logser.updatewallet().subscribe(
          data => {
            data = this.currentwallet;
            this.playAudioElement(this.paymentreceived.nativeElement, 0.8);
            $(".displaymoniter").html("Payment Received");
            $(".tick").show();
            this.logser.gettransactions().subscribe(data => {
              this.transactioncount = '0000' + (data.length + 1);


              this.transaction['TransactionId'] = this.currentusercityId + '_' + this.citytiming['CurrentDay'] + '_' + this.citytiming['CurrentTime'] + '_' + this.transactioncount + '_01';
              this.transaction['Amount'] = String(this.totalsupermarketbill - this.totalenv);
              this.transaction['Container_Amt'] = String(this.currentPurchaseContainer)
              this.transaction['Content_Amt'] = String(this.currentPurchaseContent)
              this.transaction['CreditFacility'] = 'Supermarket Owner';
              this.transaction['DebitFacility'] = this.currentUserRole;
              this.transaction['Purpose'] = 'Purchasing Shampoo from Supermarket';
              this.logser.createtransaction(this.transaction).subscribe(
                data => {
                  this.transaction['TransactionId'] = this.currentusercityId + '_' + this.citytiming['CurrentDay'] + '_' + this.citytiming['CurrentTime'] + '_' + this.transactioncount + '_02';
                  this.transaction['Amount'] = String(this.totalenv);
                  this.transaction['CreditFacility'] = 'Municipality Office';
                  this.transaction['DebitFacility'] = this.currentUserRole;
                  this.transaction['Purpose'] = 'Environment tax for Shampoo purchase';
                  this.transaction['Container_Amt'] = '0';
                  this.transaction['Content_Amt'] = '0';
                  this.logser.createtransaction(this.transaction).subscribe(
                    data => {
                      data = this.transaction;

                      this.updatebottleasset['bottlestatus'] = 'InUse';
                      this.updatebottleasset['transactionid'] = this.currentusercityId + '_' + this.citytiming['CurrentDay'] + '_' + this.citytiming['CurrentTime'] + '_' + this.transactioncount + '_01';;
                      this.updatebottleasset['fromfacility'] = 'Supermarket Owner'
                      this.updatebottleasset['tofacility'] = this.currentUserRole;
                      this.updatebottleasset['transactiondate'] = String(this.citytiming['CurrentDay']);
                      this.updatebottleasset['purchased'] = 'true';
                      this.updatebottleasset['Bottleloc'] = this.currentUserCartId;
                      for (let i = 0; i < this.bottletaken.length; i++) {
                        this.updatebottleasset['currentitem'] = this.bottletaken[i].split("at")[0].split('City')[1];
                        console.log(this.updatebottleasset)
                        this.logser.updatethisAssets(this.updatebottleasset).subscribe((data) => {
                          // $(".pay").hide();
                          $(".close").show();
                          console.log("Purchased data")
                          console.log(data);
                          this.playAudioElement(this.transactioncomplete.nativeElement, 0.8);
                          this.billpaid = true;
                          this.logser.getFacilitycashbox('Municipality Office').subscribe(data => {
                            (data[0]['Cashbox'] == '') ? this.municipalcashbox = 0 : this.municipalcashbox = parseInt(data[0]['Cashbox']);
                            this.municipalcashbox += this.totalenv;
                            this.logser.updateFacilitycashbox('Municipality Office', String(this.municipalcashbox)).subscribe(data => { });
                          });
                          this.logser.getFacilitycashbox('Supermarket Owner').subscribe(data => {
                            (data[0]['Cashbox'] == '') ? this.supermarketcashbox = 0 : this.supermarketcashbox = parseInt(data[0]['Cashbox']);
                            this.supermarketcashbox += this.totalsupermarketbill - this.totalenv;
                            this.logser.updateFacilitycashbox('Supermarket Owner', String(this.supermarketcashbox)).subscribe(data => { });
                          });
                        });
                      }

                    },
                    error => {
                      //console.log(error);
                    });
                },
                error => {
                  //console.log(error);
                });

            });





          },
          error => {
            //console.log(error);
          }
        );
      }
      else {
        this.alertModal.openModal("Your Balance is : Rs." + this.currentwallet.toFixed(2) + "You have insufficient balance.Return some bottles as per your Balance", false);

      }
    }

  }

  billingstarted: boolean = false;

  async startbilling() {
    this.playAudioElement(this.doneshopping.nativeElement, 0.8);

    $(".cartid_highlight").addClass('highlight');
    $(".beam").show();
    $(".displaymoniter").html("Scanning");

    // Await the animations using a helper function
    await this.animateingElement($(".scanneranimation"), { 'left': '6918px' }, 2000);
    await this.animateingElement($(".scanneranimation"), { 'left': '6656px' }, 2000);

    $(".beam").hide();

    if (!this.billpaid) {
      //await this.delay(500); // Replaces setTimeout
      this.docalculation(); // Ensure docalculation supports async if necessary
    }

    this.playAudioElement(this.cartdisplay.nativeElement, 0.8);
    $(".displaymoniter").html("Check and pay by clicking the cart display panel");
    $(".displaycallout").show();
  }

  // Helper function to convert jQuery animate to Promise
  animateingElement(element: any, properties: object, duration: number): Promise<void> {
    return new Promise((resolve) => {
      element.animate(properties, duration, () => resolve());
    });
  }

  // Helper function to replace setTimeout with a Promise-based delay
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  ngAfterViewInit(): void {

    Promise.resolve().then(() => {
      this.shelfDropLists = this.dropLists
        .filter(dl => dl.id !== 'cartDropList');

      this.cdr.detectChanges();
    });
    if (this.logser.currentuser.Username !== '') {
      this.initializePanzoom();
      this.subscribeToSharedServices();
      this.loadinginitialState();
    }
  }

  private initializePanzoom(): void {
    this.instance = panzoom(this.scene.nativeElement, {
      maxZoom: 3,
      minZoom: 0.3,
      bounds: true,
      boundsPadding: 1,
      smoothScroll: true,
      filterKey: () => true,
      beforeWheel: (e) => !e.shiftKey,
      beforeMouseDown: (e) => !e.shiftKey,
      onDoubleClick: () => false
    });
  }

  private subscribeToSharedServices(): void {
    this.sharedService.showWarning$.subscribe(value => this.showwarning = value);
    this.sharedService.playWarning$.subscribe(value => this.playwarning = value);

    this.subscription = this.sharedService.switchYesOrNo$.subscribe(value => {
      this.handleSwitchYesOrNo(value);
    });

    this.modalSubscription = this.sharedService.auditPlasticVideoModal$.subscribe(() => this.openAuditPlasticVideoModal());
    this.modalSubscription = this.sharedService.auditBottleCleaningVideoModal$.subscribe(() => this.openAuditBottleCleaningVideoModal());
    this.modalSubscription = this.sharedService.auditBottleMakingVideoModal$.subscribe(() => this.openAuditBottleMakingVideoModal());

    this.runGarbagetruck = this.sharedService.rungarbagetruck$.subscribe(() => this.rungarbagetruck());
    this.loadPlantBottlesSubscription = this.sharedService.loadPlantBottles$.subscribe(() => this.loadPlantBottles());
  }

  private handleSwitchYesOrNo(value: number): void {
    this.switchYesOrNo = value;
    if (this.switchYesOrNo === 2) {
      $(".cart").show();
      this.loadinginitialState();
    } else if (this.switchYesOrNo === 0) {
      $(".cart").hide();
      this.handleUserRoleNavigation();
    }
  }

  private handleUserRoleNavigation(): void {
    const roleCoordinates: { [key: string]: [number, number, string] } = {
      'Mayor': [-3341, -2150, '1'],
      'Supermarket Owner': [-1079.58, -2257.31, '1'],
      'Universal Bottle Manufacturing Plant owner': [-3301.17, -418, '1'],
      'Plastic Recycling Plant Owner': [-884.463, -574.902, '1'],
      'Bottle Reverse Vending Machine Owner': [-5365.48, -1862.22, '1'],
      'Shampoo Refilling Station Owner': [-5557.47, -2345.08, '1'],
      'Universal Bottle Cleaning Plant Owner': [-3114.48, -1073.29, '1'],
      'B1 Shampoo Producer': [0, 0, '1'],
      'B2 Shampoo Producer': [-641.86, 0, '1'],
      'B3 Shampoo Producer': [-1380.06, -2, '1'],
      'B4 Shampoo Producer': [-5960.32, -2, '1'],
      'B5 Shampoo Producer': [-6787.32, -2, '1']
    };

    if (this.currentUserRole in roleCoordinates) {
      this.dopanzoom(...roleCoordinates[this.currentUserRole]);
    } else if (this.currentUserRole.includes('House')) {
      $(".cart").show();
      this.loadinginitialState();
    }
  }

  closeothermodels() {
    if (this.modalService.hasOpenModals()) {
      this.modalService.dismissAll(); // Close all open modals
    }
  }
  openAuditPlasticVideoModal(): void {
    console.log("nan varen how many times");
    this.closeothermodels();
    this.modalService.open(this.Auditing_Plastic, { windowClass: 'cartcontent' });
  }
  openAuditBottleCleaningVideoModal(): void {
    this.closeothermodels();
    this.modalService.open(this.Auditing_BottleCleaning, { windowClass: 'cartcontent' });
  }
  openAuditBottleMakingVideoModal(): void {
    this.closeothermodels();
    this.modalService.open(this.Auditing_BottleMaking, { windowClass: 'cartcontent' });
  }
  openReloadBottletoSupermarketModal(): void {
    this.closeothermodels();
    this.modalService.open(this.reloadBottle, { windowClass: 'cartcontent' });
  }
  bringBackBottles: any = [];
  reloadBottles: { [key: string]: number } = {};


  loadPlantBottles(): void {
    let universalcleanedBottleCount = 0;
    let shinyCleaned = 0;
    let spikyCleaned = 0;
    let bouncyCleaned = 0;
    let silkyCleaned = 0;
    this.reloadBottles = {};
    this.bringBackBottles = []; // Reset the array before pushing new items

    for (const asset of this.assetdataset) {
      if (!asset['Bottle_loc'].includes('_Plant') || asset['Current_PlantRefill_Count'] >= asset['Max_Refill_Count']) {
        continue;
      }

      // Push asset into bringBackBottles array
      this.bringBackBottles.push(asset);

      // Update reloadBottles count
      switch (asset['Content_Code']) {
        case '':
          this.reloadBottles['universal'] = ++universalcleanedBottleCount;
          break;
        case 'B1.Shiny':
          this.reloadBottles['shiny'] = ++shinyCleaned;
          break;
        case 'B2.Spiky':
          this.reloadBottles['spiky'] = ++spikyCleaned;
          break;
        case 'B3.Bouncy':
          this.reloadBottles['bouncy'] = ++bouncyCleaned;
          break;
        case 'B5.Silky':
          this.reloadBottles['silky'] = ++silkyCleaned;
          break;
      }
    }

    this.openReloadBottletoSupermarketModal();
    console.log(this.reloadBottles);  // Log updated bottle counts
    console.log(this.bringBackBottles); // Log assets being brought back
    if (this.bringBackBottles.length == 0) {
      this.alertModal.openModal("There is no Bottle Available at the Plants now!!!")
    }
  }

  reloadBottlesToSuperMarket() {
    let updatedBottles: any[] = [];  // Initialize an array to store updated bottles
    for (const asset of this.bringBackBottles) {
      //console.log(asset)
      if (asset['Content_Code'] != '') {
        let updatedBottle = {
          'Bottle_Status': 'Full',
          'Bottle_loc': 'Supermarket shelf',
          'remQuantity': '500',
          'Tofacility': '',
          'Fromfacility': '',
          'Transaction_Id': '',
          'Transaction_Date': '',
          'purchased': false,
          'dragged': false,
          'Latest_Refill_Date': this.citycurrentday,
          'Current_PlantRefill_Count': parseInt(asset['Current_PlantRefill_Count']) + 1
        };

        // You could either push it to an array or use it for API call
        updatedBottles.push(updatedBottle);

        // Now make the API call to update the database with the new object
        this.logser.bringBackBrandedBottles(updatedBottle, asset['AssetId'])
          .subscribe(
            (data) => {
              console.log(data);
            },
            (error) => {
              console.error('Error updating database:', error);
            }
          );
      }
    }
  }
  showCityRuleComponent() {
    // Navigate to the new component route

    // this.logser.pauseTimer().subscribe(response => {
    //console.log('Timer paused:', response);
    this.router.navigate(['/cityrule']);
    //  });


  }
  loadinginitialState() {
    let a = this.currentUserRole;
    let x = this.positionObject[a as keyof typeof this.positionObject][0][0];
    let y = this.positionObject[a as keyof typeof this.positionObject][0][1];
    let x1 = this.positionObject[a as keyof typeof this.positionObject][1][0];
    let y1 = this.positionObject[a as keyof typeof this.positionObject][1][1];
    if (this.currentUserRole.includes('House') || this.switchYesOrNo == 2) {
      this.dopanzoom(x, y, '1');
    }
    //this.dopanzoom(-1057.16, -2306.8, '1');
    $("." + this.formatKey(a) + ".bottleStore").css({ 'left': (x1 - 31) + 'px', 'top': (y1 - 87) + 'px' });
    $(".cart").css({ 'left': x1 + 'px', 'top': y1 + 'px' });

    $(".cartid").html(this.currentUserCartId);
  }



  dopanzoom(x: number, y: number, zoomlevel: string) {
    this.instance.smoothMoveTo(x, y);
    this.instance.zoomTo(x, y, parseFloat(zoomlevel));
  }

  checkrefillcondition(item: CdkDrag<string>) {
    if (item.element.nativeElement.classList.contains('refilled')) { return false; }
    else { return true; }

  }
  checkrefilledcondition(item: CdkDrag<string>) {
    if (item.element.nativeElement.classList.contains('refilled')) { return true; }
    else { return false; }

  }
  checkrefilledbottle(item: CdkDrag<string>) {
    if (item.element.nativeElement.classList.contains('refilldone')) { return false; }

    else { return true; }
  }

  checkamountdetect(item: CdkDrag<string>) {
    if (!item.element.nativeElement.classList.contains('Amountcredited')) { return true; }
    else { return false; }
  }
  checkconditionrefill(item: CdkDrag<string>) {
    if (item.element.nativeElement.classList.contains('_SB_UB1') || item.element.nativeElement.classList.contains('_SB_B1')) { return true; }
    else { return false; }
  }

  trackByBottleId(index: number, item: string) {
    return item;
  }
  genericShelfPredicate =
    (shelfKey: string) =>
      (item: CdkDrag<Bottle>) =>
        item.data.className === shelfKey;

  bottleclass = '';
  exit() {
    this.router.navigate(["login"]);
  }
  leavecity() {
    this.logser.leavefacility().subscribe(
      (data) => {
        this.logser.leavescity().subscribe(
          (data) => {
            this.router.navigate(["home"]);
          },
          (error) => {
            //console.log(error);
          }
        );
      },
      (error) => {
        //console.log(error);
      }
    );

  }
  logout() {
    this.userobj.login = '0';

    this.logser.updateloggeduser(this.userobj).subscribe(
      (data) => {
        this.userobj = data;
        this.logser.currentuser = {
          'Username': '',
          'UserId': '',
          'CityId': '',
          'Role': '',
          'wallet': 0.0,
          'cartId': '',
          'gender': '',
          'avatar': '',
          'login': '',
          'cityname': '',
          'CurrentTime': '',
          'currentday': 0,
          'cityrate': '',
          'cityavatar': ''
        };
        this.router.navigate(["login"]);
      },
      (error) => {
        //console.log(error);
      }
    );
  }
  junctionposition = {
    'supermarket': [1632, 2752],
    'dustbin': [3529, 3690],
    'junction_1': [2755, 4117],
    'junction_2': [2755, 3690],
    'junction_3': [2755, 3101],
    'junction_4': [5268, 4117],
    'junction_5': [5268, 3598],
    'junction_6': [5268, 3101],
    'junction_7': [1632, 3101],
    'junction_8': [],

  }


  showwarning: boolean = false;
  playwarning: boolean = false;
  dopanzoomsupermarket(x: number, y: number, zoomlevel: string) {
    this.instance1.zoomTo(x, y, zoomlevel);
    this.instance1.smoothMoveTo(x, y);
  }
  open(content: any) {
    this.closeothermodels();
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' });

  }
  totalenv = 0.0;
  stepheight = 0.0;
  totalheight = 0.0;
  totalsupermarketbill = 0;
  opencart(cartcontent: any, event: any) {
    this.altertab = 0;
    $(".displaycallout").hide();
    $('.btncont,.shampoolevel').show();
    if (this.opensuperflag == 1) {
      this.altertab = 1;
    }

    this.calculatenetfine();
    this.loadledgerdata();
    this.checkthebottlestatusfordisplay();
    this.closeothermodels();
    this.modalService.open(cartcontent, { windowClass: 'cartcontent' });

  }
  cashflowdata: any = [];
  showcashflow() {


    this.logser.gettransactions().subscribe(data => {
      this.cashflowdata = [];
      if (this.cashflowdata.length == 0) {
        for (let t = 0; t < data.length; t++) {
          let getcityId = data[t]['TransactionId'].split("_")[0];

          if (getcityId == this.currentusercityId && (data[t]['DebitFacility'] == this.currentUserRole || data[t]['CreditFacility'] == this.currentUserRole)) {
            this.cashflowdata.push(data[t]);
          }


        }
      }
    });
  }
  presentitem: any[] = []


  takenItemsfromSupermarket = 0;
  docalculation() {
    this.boughtbottledata = [];
    this.netamount = 0.0;
    this.totalenv = 0.0;
    this.currentPurchaseContainer = 0.0;
    this.currentPurchaseContent = 0.0;
    this.totalsupermarketbill = 0;
    if (this.bottletaken.length > 0) {
      this.billpaid = false;
      const assetObservables = [];
      const invalidItems = [];

      for (let i = 0; i < this.bottletaken.length; i++) {
        console.log(this)
        let existingItem = this.commonobj.findIndex(item => item.id === this.bottletaken[i]);
        console.log('item :', this.commonobj[existingItem], existingItem)
        console.log('item location', this.commonobj[existingItem]['Bottle_loc']);
        if (this.commonobj[existingItem]['Bottle_loc'] === 'In' + this.currentUserCartId) {
          let getcurrent = this.bottletaken[i].split("at")[0].split('City')[1];
          assetObservables.push(this.logser.getthisAssets(getcurrent));
        } else {
          this.alertModal.openModal(this.bottletaken[i] + ' This Item has been picked by someone else.', false);
          invalidItems.push(this.bottletaken[i]);
        }
      }

      // Wait for all asset observables to complete
      forkJoin(assetObservables).subscribe((results) => {
        results.forEach((data, index) => {
          let calc = parseInt(data[0]['Content_Price']) + parseInt(data[0]['Bottle_Price']);
          let discount = calc * (parseInt(data[0]['Discount_RefillB']) / 100);
          let env = calc * (parseInt(data[0]['Env_Tax_Customer']) / 100);
          this.currentPurchaseContainer += parseInt(data[0]['Bottle_Price']);
          this.currentPurchaseContent += parseInt(data[0]['Content_Price']);
          this.totalenv += env;
          console.log(discount, env, this.totalenv);
          let totalvalue = (calc + env) - discount;
          data[0]['Totalvalue'] = totalvalue;
          data[0]['Env_Tax_Customer'] = env;
          this.totalsupermarketbill += totalvalue;
          this.netamount += totalvalue;
          this.boughtbottledata.push(data[0]);
        });

        //console.log(this.netamount); // This will now log the final calculated net amount
      });

      // Remove invalid items from bottletaken
      invalidItems.forEach((item) => {
        let existingItem = this.bottletaken.findIndex(bottle => bottle === item);
        if (existingItem > -1) {
          this.bottletaken.splice(existingItem, 1);
        }
      });
    } else {
      this.billpaid = true;
    }

  }
  currentPurchaseContainer = 0.0;
  currentPurchaseContent = 0.0;
  objectKeys(obj: any) {
    return Object.keys(obj)[0];
  }
  opensticker(bottlesticker: any, event: any) {
    let element = event.target || event.srcElement || event.currentTarget;
    let elementId = element.id.split("at")[0].split("City")[1];
    let elementClass = element.className;
    this.logser.getthisAssets(elementId).subscribe((data) => {
      this.assetdata = data;
      this.frontclass = element.id.split("at")[1] + "_big";
      let checkuniversal = this.assetdata[0]['Bottle_Code'].split(".")[0];
      this.shapooprice = (parseFloat(this.assetdata[0]['Content_Price']) - parseFloat(this.assetdata[0]['Bottle_Price'])) / parseFloat(this.assetdata[0]['Quantity']);
      this.totalamount = parseFloat(this.assetdata[0]['Bottle_Price']) + parseFloat(this.assetdata[0]['Content_Price']) + parseFloat(this.assetdata[0]['Env_Tax_Customer'])
      if (checkuniversal == 'UB') {
        this.leblfound = true;
        this.bottleclass = "universal";
        this.frontlabel = this.assetdata[0]['Content_Code'].split(".")[1].toString().toLowerCase() + "_label";
      }
      else {
        this.leblfound = false;
        this.bottleclass = this.assetdata[0]['Content_Code'].split(".")[1];
      }
      this.closeothermodels();
      this.modalService.open(bottlesticker);
    });




  }
  selectphoto(ind: any) {
    $(".pics").css('border', '4px solid #fff');
    $(".pic_" + ind).css('border', '4px solid #333');
    this.currentuseravatar = String(ind);
    this.logser.currentuser.avatar = String(ind);


  }
  saveavatar() {
    if (this.currentuseravatar == '') {
      this.alertModal.openModal("kindly select your Avatar", false)
    }
    else {
      this.logser.updateuseravatar(this.currentuseravatar).subscribe(
        (data) => {
          this.userobj = data;
          $(".displaypic,.cartavatar").addClass('pic_' + this.logser.currentuser.avatar);
        },
        (error) => {
          ////console.log(error);
        }
      );
    }
  }

  openrefillingstation() {
    this.playAudioElement(this.cityrail.nativeElement, 0.8);
    this.resetanimation = true;
    $("#refillcart").css({ 'left': '50px', 'top': '332px' });
    setTimeout(function () {
      that.playAudioElement(that.welcome.nativeElement, 0.8);

    }, 2000)
    let that = this;
    setTimeout(function () {
      that.playAudioElement(that.placebottle.nativeElement, 0.8);
    }, 5000)
  }

  initiateanimation(placedBottle: string) {
    if (this.droppedbottle == true) {
      this.playAudioElement(this.selectbrand.nativeElement, 0.8);
      this.refillbrandselected = '';
      $(".displaylight").removeClass('off').addClass('on');
      this.getbrandfunction(placedBottle);
      $(".displayboard").html("Your bottle's brand =" + this.getcurrentplacedbrand + "<br/>Select shampoo brand for refill.")
      this.brandselected = true;

    }
  }
  getdetailbrandfunction(placedBottle: string) {

    let getbrand = placedBottle.split("at")[1];
    console.log(getbrand, 'coming from getdetail')
    if (getbrand.includes('shiny')) {
      this.getcurrentplacedbrand = 'B1.Shiny';
    }
    else if (getbrand.includes('spiky')) {
      this.getcurrentplacedbrand = 'B2.Spiky';
    }
    else if (getbrand.includes('bouncy')) {
      this.getcurrentplacedbrand = 'B3.Bouncy';
    }
    else if (getbrand.includes('wavy')) {
      this.getcurrentplacedbrand = 'B4.Wavy';
    }
    else if (getbrand.includes('silky')) {
      this.getcurrentplacedbrand = 'B5.Silky';
    }
    else if (getbrand.includes('uvpn') || getbrand.includes('uvpr') || getbrand.includes('urpn') || getbrand.includes('urpr')) {
      this.getcurrentplacedbrand = 'Universal';
    }

  }
  getbrandfunction(placedBottle: string) {
    let getbrand = placedBottle.split("at")[1];
    if (getbrand == 'UB1' || getbrand == 'B1') {
      this.getcurrentplacedbrand = 'B1.Shiny';
    }
    else if (getbrand == 'UB2' || getbrand == 'B2') {
      this.getcurrentplacedbrand = 'B2.Spiky';
    }
    else if (getbrand == 'UB3' || getbrand == 'B3') {
      this.getcurrentplacedbrand = 'B3.Bouncy';
    }
    else if (getbrand == 'UB4' || getbrand == 'B4') {
      this.getcurrentplacedbrand = 'B4.Wavy';
    }
    else if (getbrand == 'UB5' || getbrand == 'B5') {
      this.getcurrentplacedbrand = 'B5.Silky';
    }

  }
  increament() {
    if (this.refillbrandselected != '') {
      if (this.selectquantity < 500) {
        this.selectquantity += 100;
      }
      $(".displayboard").html("Selected Quantity :" + this.selectquantity);
      let that = this;
      this.calculaterefillAmount();
      clearTimeout(this.timeout);
      this.timeout = setTimeout(function () {

        $(".displaylight").removeClass('off').addClass('on'); that.playAudioElement(that.checkprice.nativeElement, 0.8); that.quantityselected = true; $(".displayboard").html("Brand =" + that.refillbrandselected + "<br/>Quantity = " + that.selectquantity + "ml<br/>Price/ml = ₹" + that.unitprice + "<br/>Discount = " + that.currentDiscount + "%<br/>Net Amount = ₹ " + that.refill_amount_topay + "<br/> Please confirm the order.");
      }, 6000);
    }
    else {
      this.alertModal.openModal("please select the brand")
    }
  }
  calculaterefillAmount() {

    for (let r = 0; r < this.shampooPrice.length; r++) {
      if (this.shampooPrice[r]['BottleContent'] == this.refillbrandselected) {
        this.refill_amount_topay = (this.selectquantity * this.shampooPrice[r]['UnitPrice']) - (this.selectquantity * this.shampooPrice[r]['UnitPrice'] * (this.shampooPrice[r]['Discount'] / 100));
        this.unitprice = this.shampooPrice[r]['UnitPrice'];
        this.currentDiscount = this.shampooPrice[r]['Discount'];
      }

    }
  }
  decrement() {
    if (this.refillbrandselected != '') {
      if (this.selectquantity > 100) {
        this.selectquantity -= 100;
      }
      $(".displayboard").html("Selected Quantity :" + this.selectquantity);
      let that = this;
      this.calculaterefillAmount();
      clearTimeout(this.timeout);
      this.timeout = setTimeout(function () {
        $(".displaylight").removeClass('off').addClass('on');
        that.playAudioElement(that.checkprice.nativeElement, 0.8); that.quantityselected = true; $(".displayboard").html("Brand =" + that.refillbrandselected + "<br/>Quantity = " + that.selectquantity + "ml<br/>Price/ml = ₹" + that.unitprice + "<br/>Discount = " + that.currentDiscount + "%<br/>Net Amount = ₹" + that.refill_amount_topay + "<br/> Please confirm the order.");
      }, 6000);
    }
    else {
      this.alertModal.openModal("please select the brand")
    }
  }
  unitprice = 0;
  currentDiscount = 0;
  checkrefillselect(currentbrand: any) {


    if (this.droppedbottle == true && this.resetanimation == true) {
      this.refillbrandselected = currentbrand;
      console.log(this.getcurrentplacedbrand)
      if (this.refillbrandselected == this.getcurrentplacedbrand) {
        this.playAudioElement(this.useplusminus.nativeElement, 0.8);
        $(".displaylight").removeClass('off').addClass('on');
        $(".displayboard").html("Bottle's brand = " + this.getcurrentplacedbrand + " <br/> Shampoo brand = " + this.refillbrandselected + "<br/>Use +/- keys to specify quantity.")
      }
      else {
        this.playAudioElement(this.bottledifferent.nativeElement, 0.8);
        $(".displaylight").removeClass('off').addClass('on');
        $(".displayboard").html("Bottle's brand = " + this.getcurrentplacedbrand + " <br/> Shampoo brand = " + this.refillbrandselected + "<br/> Bottle and shampoo are of different brands. If OK,  specify quantity using  +/- keys. Else,  re-select sampoo brand.")
      }
    }
  }
  refill_amount_topay = 0;
  startrefillinganimation() {
    $(".displaylight").removeClass('on').addClass('off');
    if (this.currentwallet > this.refill_amount_topay) {
      this.currentwallet = this.currentwallet - this.refill_amount_topay;
      this.logser.currentuser.wallet = this.currentwallet;

      this.logser.updatewallet().subscribe(
        data => {
          data = this.currentwallet;
          this.playAudioElement(this.paymentreceived.nativeElement, 0.8);
          let transactioncount = '';
          this.logser.gettransactions().subscribe(data => {
            transactioncount = '0000' + (data.length + 1);

            this.transaction['TransactionId'] = this.currentusercityId + '_' + this.citytiming['CurrentDay'] + '_' + this.citytiming['CurrentTime'] + '_' + this.transactioncount + '_03';
            this.transaction['Amount'] = String(this.refill_amount_topay);
            this.transaction['CreditFacility'] = 'Refilling Station';
            this.transaction['DebitFacility'] = this.currentUserRole;
            this.transaction['Purpose'] = 'Refilling shampoo from the Refilling Station';
            this.transaction['Container_Amt'] = '0';
            this.transaction['Content_Amt'] = '0';
            this.logser.createtransaction(this.transaction).subscribe(
              data => {
                data = this.transaction;

                this.updatebottleasset['bottlestatus'] = 'InUse';
                this.updatebottleasset['transactionid'] = this.currentusercityId + '_' + this.citytiming['CurrentDay'] + '_' + this.citytiming['CurrentTime'] + '_' + this.transactioncount + '_03';
                this.updatebottleasset['fromfacility'] = 'Shampoo Refilling Station '
                this.updatebottleasset['tofacility'] = this.currentUserRole;
                this.updatebottleasset['transactiondate'] = String(this.citytiming['CurrentDay']);
                this.updatebottleasset['Latest_Refill_Date'] = String(this.citytiming['CurrentDay']);
                this.updatebottleasset['Bottleloc'] = this.currentUserCartId;
                this.updatebottleasset['contentCode'] = this.refillbrandselected;
                this.updatebottleasset['currentitem'] = this.currentlyrefillingBottle.split("at")[0].split('City')[1];
                this.logser.updatethisAssets(this.updatebottleasset).subscribe((data) => {
                  this.playAudioElement(this.transactioncomplete.nativeElement, 0.8);
                });
                this.logser.getFacilitycashbox('Shampoo Refilling Station Owner').subscribe(data => {
                  (data[0]['Cashbox'] == '') ? this.getrefillingstationcashbox = 0 : this.getrefillingstationcashbox = parseInt(data[0]['Cashbox']);
                  this.getrefillingstationcashbox -= this.refill_amount_topay;
                  this.logser.updateFacilitycashbox('Shampoo Refilling Station Owner', String(this.getrefillingstationcashbox)).subscribe(data => { });
                });


              },
              error => {
                //console.log(error);
              });
          });


        },
        error => {
          //console.log(error);
        });








      $(".displayboard").html("Brand =" + this.refillbrandselected + "<br/>Quantity = " + this.selectquantity + "ml<br/>Price/ml = ₹" + this.unitprice + "<br/>Discount = " + this.currentDiscount + "%<br/>Net Amount = ₹" + this.refill_amount_topay + "<br/> Order Confirmed. Please wait till we refill your bottle.");
      $("#pressor").animate({ 'top': '1px' }, 2000, () => {
        $("#pressor").animate({ 'top': '-10px' });
        $(".gear").addClass('icon');
        let getbrand = $(".refilllist").children('div')[0].classList[1];
        $("." + getbrand).addClass('removedcap');
        if (this.refillbrandselected == 'B1.Shiny') {
          $(".refilldropper").animate({ 'left': '44px' }, 2000, () => {
            $(".shinyfiller").show();
            $(".gear").removeClass('icon');
            let that = this; setTimeout(function () {
              $(".gear").addClass('icon');
              $(".shinyfiller").hide(); that.closecap();
            }, 2000);
          });
        }
        if (this.refillbrandselected == 'B2.Spiky') {
          $(".refilldropper").animate({ 'left': '94px' }, 2000, () => {
            $(".spikyfiller").show(); $(".gear").removeClass('icon');
            let that = this;
            setTimeout(function () {
              $(".gear").addClass('icon');
              $(".spikyfiller").hide();
              that.closecap();
            }, 2000);
          });
        }
        if (this.refillbrandselected == 'B4.Wavy') {
          $(".refilldropper").animate({ 'left': '196px' }, 2000, () => {
            $(".wavyfiller").show();
            $(".gear").removeClass('icon');
            let that = this;
            setTimeout(function () {
              $(".gear").addClass('icon');
              $(".wavyfiller").hide();
              that.closecap();
            }, 2000);
          });
        }
        if (this.refillbrandselected == 'B5.Silky') {
          $(".refilldropper").animate({ 'left': '247px' }, 2000, () => {
            $(".silkyfiller").show();
            $(".gear").removeClass('icon');
            let that = this;
            setTimeout(function () {
              $(".gear").addClass('icon');
              $(".silkyfiller").hide();
              that.closecap();
            }, 2000);
          });
        }
        if (this.refillbrandselected == 'B3.Bouncy') {
          $(".refilldropper").animate({ 'left': '145px' }, 2000, () => {
            $(".bouncyfiller").show();
            $(".gear").removeClass('icon');
            let that = this;
            setTimeout(function () {
              $(".gear").addClass('icon');
              $(".bouncyfiller").hide();
              that.closecap();
            }, 2000);
          });
        }

      })
    }
    else {
      this.alertModal.openModal("You have Insuccifient Balance");
    }
  }
  resetrefilling() {
    this.resetanimation = true;
    this.droppedbottle = false;
    this.brandselected = false;
    this.quantityselected = false;
    this.getcurrentplacedbrand = '';
    this.confirmpressed = false;
    this.selectquantity = 0;

    this.refillbrandselected = '';
    this.playAudioElement(this.placebottle.nativeElement, 0.8);
    $(".refilldropper").css({ 'left': '8px' }).show();
    $(".displaylight").removeClass('off').addClass('on');
    $(".displayboard").html(' Please place your empty bottle on the conveyor.');
  }

  closecap() {
    let that = this;
    setTimeout(function () {
      $(".refilldropper").animate({ 'left': '333px' }, 3000, () => {
        $(".gear").removeClass('icon');
        $("#cappressor ").animate({ 'top': '1px' }, 2000, () => {
          $("#cappressor ").animate({ 'top': '-10px' }, 1000, () => {
            $(".displaylight").removeClass('off').addClass('on');
            $(".displayboard").html('Please collect your bottle.');
            that.playAudioElement(that.collectbottle.nativeElement, 0.8);

          });

          let getbrand = $(".refilllist").children('div')[0].classList[1];
          $("." + getbrand).removeClass('removedcap');
          $(".refilldropper .refillbtl").addClass('refilled');

        });
      });
    }, 1000);

  }
  updateonlyloc: any = {
    'currentbottle': '',
    'Bottleloc': ''
  }

  Inhouseshelf_bottles: string[] = [];
  newbottle_list: string[] = [];
  cart_bottle_list: string[] = [];
  dustbin_bottles: string[] = [];
  truckContList: string[] = [];

  boughtdrop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

      const currentlyDropped = event.item.data; // ✅ FIXED
      console.log(currentlyDropped);
      const currentDropzone = event.container.element.nativeElement.classList;
      const bottleId = currentlyDropped.split('City')[1].split("at")[0];

      if (currentDropzone.contains('Inhouseshelf_bottles')) {
        this.updateBottleLocationandFine(`House@${this.currentUserCartId}`, 0, '', '', bottleId);
        this.Inhouseshelf_bottles = [...event.container.data];
      } else if (currentDropzone.contains('newbottle_list') || currentDropzone.contains('cart_bottle_list')) {
        this.updateBottleLocationandFine(this.currentUserCartId, 0, '', '', bottleId);
        (this as any)[event.container.element.nativeElement.classList[0]] = [...event.container.data];
      } else if (currentDropzone.contains('dustbin_bottles')) {
        this.handleFineAndLocation(bottleId, currentlyDropped, 'City Dustbin', '04', 'Fine for Throwing Bottle to City Dustbin');
        this.dustbin_bottles = [...event.container.data];
      } else if (currentDropzone.contains('truckContList')) {
        this.handleFineAndLocation(bottleId, currentlyDropped, 'Garbage Truck', '05', 'Fine for Throwing Bottle to Garbage Truck');
        this.truckContList = [...event.container.data];
      }
    }
  }

  private calculateFine(bottleType: string): number {
    const bottle = this.assetdataset.find(b => b['Bottle_Code'] === bottleType);
    return bottle ? parseFloat(bottle['Bottle_Price']) * 0.5 : 0;
  }

  // Helper function to update bottle location
  private updateBottleLocationandFine(location: string, fine: number, purpose: string, transactionType: string, bottleId?: string) {
    if (bottleId) {
      this.updateonlyloc['currentbottle'] = bottleId;
      this.updateonlyloc['Bottleloc'] = location;
      this.logser.updatelocation(this.updateonlyloc).subscribe(() => { });
    } else {
      this.updatebottlereturn['currentitem'] = this.selectedBottleatStage.split("at")[0].split("City")[1];
      this.updatebottlereturn['Bottleloc'] = location;
      this.updatebottlereturn['bottlestatus'] = this.bottleStatus_Display['Bottle_Status'];
      this.updatebottlereturn['fromfacility'] = this.currentUserRole;
      this.updatebottlereturn['tofacility'] = 'Municipality Office';

      if (this.currentwallet > fine) {
        this.alertModal.openModal(`A fine of ₹${fine} has been charged for this offense`);
        this.currentwallet -= fine;
        this.logser.currentuser.wallet = this.currentwallet;

        this.logser.updatewallet().subscribe(() => {
          this.handleTransaction(fine, purpose, transactionType);
        });
      }
    }
  }

  // Helper function to handle transactions
  private handleTransaction(amount: number, purpose: string, transactionType: string) {
    this.logser.gettransactions().subscribe(transactions => {
      const transactionCount = '0000' + (transactions.length + 1);
      this.transaction['TransactionId'] = `${this.currentusercityId}_${this.citytiming['CurrentDay']}_${this.citytiming['CurrentTime']}_${transactionCount}_${transactionType}`;
      this.transaction['Amount'] = String(amount);
      this.transaction['CreditFacility'] = 'Municipality Office';
      this.transaction['DebitFacility'] = this.currentUserRole;
      this.transaction['Purpose'] = purpose;
      this.transaction['Container_Amt'] = '0';
      this.transaction['Content_Amt'] = '0';

      this.logser.createtransaction(this.transaction).subscribe(() => {
        this.updatebottlereturn['transactionid'] = this.transaction['TransactionId'];
        this.updatebottlereturn['transactiondate'] = String(this.citytiming['CurrentDay']);

        this.logser.updateConveyorAssets(this.updatebottlereturn).subscribe(() => {
          this.playAudioElement(this.Fine.nativeElement, 0.8);
          this.updateMunicipalCashbox(amount);
        });
      });
    });
  }

  // Helper function to update municipal cashbox
  private updateMunicipalCashbox(amount: number) {
    this.logser.getFacilitycashbox('Municipality Office').subscribe(data => {
      this.municipalcashbox = data[0]['Cashbox'] ? parseInt(data[0]['Cashbox']) : 0;
      this.municipalcashbox += amount;
      this.logser.updateFacilitycashbox('Municipality Office', String(this.municipalcashbox)).subscribe(() => { });
    });
  }

  // Helper function to handle fine and location updates
  private handleFineAndLocation(bottleId: string, currentlyDropped: string, location: string, transactionType: string, purpose: string) {
    this.logser.getthisAssets(bottleId).subscribe(data => {
      const bottleType = currentlyDropped.split('id')[0].split('_')[2] + '.' + currentlyDropped.split('id')[1].split('_')[0];
      const fine = this.calculateFine(bottleType);

      this.updateBottleLocationandFine(location, fine, purpose, transactionType, bottleId);
    });
  }

  netfine = 0.0;
  netpurchase = 0.0;
  taxpaid = 0.0;
  netrefund = 0.0;
  calculatenetfine() {
    this.logser.gettransactions().subscribe(data => {
      this.netfine = 0.0;
      this.netpurchase = 0.0;
      this.taxpaid = 0.0;
      this.netrefund = 0.0;
      for (let t = 0; t < data.length; t++) {
        let getcityId = data[t]['TransactionId'].split("_")[0];
        if (data[t]['DebitFacility'] == this.currentUserRole && getcityId == this.currentusercityId && data[t]['Purpose'].includes("Fine")) {
          this.netfine += parseFloat(data[t]['Amount']);
        }
        if (data[t]['DebitFacility'] == this.currentUserRole && getcityId == this.currentusercityId && (data[t]['Purpose'].includes("Purchasing") || data[t]['Purpose'].includes("Refilling"))) {
          this.netpurchase += parseFloat(data[t]['Amount']);
        }
        if (data[t]['DebitFacility'] == this.currentUserRole && data[t]['CreditFacility'] == 'Municipality Office' && getcityId == this.currentusercityId && data[t]['Purpose'].includes("tax")) {
          this.taxpaid += parseFloat(data[t]['Amount']);
        }

        if (data[t]['CreditFacility'] == this.currentUserRole && getcityId == this.currentusercityId && data[t]['Purpose'].includes("Refund")) {
          this.netrefund += parseFloat(data[t]['Amount']);
        }
      }
    });

  }
  currentItem: string = '';  // To keep track of the currently dragged item

  // This method is called when the dragging starts
  dragStarted(item: string) {
    this.currentItem = item;
  }
  trackByFn(index: number, item: any): any {
    return item.id; // or another unique identifier
  }
  trackByItem(index: number, item: any) {
    return item; // assuming item is unique (your id string)
  }
  getBottleStatus = '';
  getBottleCode = '';

  returndrop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      // Reordering items within the same list
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Transferring items between different lists
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    let currentlyDroped = event.item.element.nativeElement.id;
    let currentDropzone = event.container.element.nativeElement.classList;
    let amount_refund = 0.0;
    console.log('Currently Dropped:', currentlyDroped);
    console.log('Current Dropzone:', currentDropzone);
    // Explicitly update the bottledropped list with the latest data
    if (event.container.element.nativeElement.classList.contains('bottle_list')) {
      this.bottledropped.length = 0;
      this.bottledropped.push(currentlyDroped);
      //console.log('Updated Bottle Dropped List:', this.bottledropped);
    }



    if (currentDropzone.contains('bottle_list')) {
      // Perform refund and other logic related to bottle_list
      this.updatebottlereturn['currentitem'] = currentlyDroped.split('City')[1].split("at")[0];
      this.updatebottlereturn['fromfacility'] = this.currentUserRole;
      this.updatebottlereturn['tofacility'] = "Return Conveyor";
      this.updatebottlereturn['Bottleloc'] = "Return Conveyor";
      console.log("Starting refund")
      // Logic to update bottle status, wallet, and perform refund
      this.logser.getthisAssets(this.updatebottlereturn['currentitem']).subscribe(data => {
        this.updatebottlereturn['bottlestatus'] = data[0]['Bottle_Status'];
        this.getBottleCode = data[0]['Bottle_Code'].split('.')[1];
        let getMaxRefillCount, getCurrentRefillCount;
        getMaxRefillCount = data[0]['Max_Refill_Count'];
        getCurrentRefillCount = data[0]['Current_PlantRefill_Count'];
        console.log(getMaxRefillCount, getCurrentRefillCount)
        if (getMaxRefillCount == 0) {
          amount_refund = 0.0;
          this.alertModal.openModal("Thanks for returning the bottle.Unfortunately, producer of this shampoo brand is NOT entertaining empty bottle returns. We will be sending this bottle to the recycling plant. An amount of ₹00.00 has been credited to your wallet. Remember to check the \"Max refill count\" on the bottle lable  next time you buy or return.However, you may refill such bottle at the refilling station if you wish.(next time) ", false, () => {
            this.bottleStatus_Display['Bottle_Status'] = 'Damaged-Empty';
            this.bottleStatus_Display['currentQuantity'] = 0;
            this.bottleStatus_Display['Bottle_loc'] = 'Return Conveyor';
            this.bottleStatus_Display['currentbottle'] = this.updatebottlereturn['currentitem'];
            this.getBottleStatus = 'Damaged-Empty'
            this.logser.updatethisAssetQuantity(this.bottleStatus_Display).subscribe((data) => {
              this.startreturnanimation(currentlyDroped);
              this.updateBtlLocationandMakeitRetired(this.bottleStatus_Display['currentbottle'], 'Return Conveyor', 'EndOfLife')
            });
          });

        }
        else if (getCurrentRefillCount >= getMaxRefillCount) {

          amount_refund = this.calculateReturnCreditAmount(currentlyDroped, amount_refund);
          console.log('amont', amount_refund)
          this.alertModal.openModal("Thanks for returning the bottle. This bottle has reached the Max-Refill count limit. We will be sending this bottle to the recycling plant. An amount of ₹ " + amount_refund.toFixed(2) + " has been credited to your wallet.", false, () => {
            this.bottleStatus_Display['Bottle_Status'] = 'Damaged-Empty';
            this.getBottleStatus = 'Damaged-Empty';
            this.bottleStatus_Display['currentQuantity'] = 0;
            this.bottleStatus_Display['currentbottle'] = this.updatebottlereturn['currentitem'];
            this.logser.updatethisAssetQuantity(this.bottleStatus_Display).subscribe((data) => {
              this.returnCashTransactions(amount_refund, currentlyDroped, true, '06', 'Return Conveyor');
              this.updateBtlLocationandMakeitRetired(this.bottleStatus_Display['currentbottle'], 'Return Conveyor', 'EndOfLife')
            });

          });


        }
        else {
          this.getBottleStatus = data[0]['Bottle_Status'];
          console.log(amount_refund)
          amount_refund = this.calculateReturnCreditAmount(currentlyDroped, amount_refund)
          console.log(this.getBottleStatus, amount_refund)
          this.returnCashTransactions(amount_refund, currentlyDroped, true, '06', 'Return Conveyor');
        }




      });


    } else if (currentDropzone.contains('cart_bottle_list')) {
      // Logic for cart_bottle_list
      this.updateonlyloc['currentbottle'] = currentlyDroped.split('City')[1].split("at")[0];
      this.updateonlyloc['Bottleloc'] = this.currentUserCartId;
      this.logser.updatelocation(this.updateonlyloc).subscribe((data) => {
        //console.log("Bottle location updated back to cart");
      });
    }
  }
  returnCashTransactions(amount_refund: any, currentlyDroped: any, fromreturncon: any, transactionnum: any, debitFacilty: any) {
    if (amount_refund > 0.0) {
      this.currentwallet += amount_refund;
      this.logser.currentuser.wallet = this.currentwallet;
      this.logser.updatewallet().subscribe(
        data => {
          data = this.currentwallet;
          this.logser.gettransactions().subscribe(data => {
            let transactioncount = '0000' + (data.length + 1);


            this.transaction['TransactionId'] = this.currentusercityId + '_' + this.citytiming['CurrentDay'] + '_' + this.citytiming['CurrentTime'] + '_' + transactioncount + '_' + transactionnum;
            this.transaction['Amount'] = String(amount_refund);
            this.transaction['CreditFacility'] = this.currentUserRole;
            this.transaction['DebitFacility'] = debitFacilty;
            this.transaction['Purpose'] = 'Refund for returning Bottle';
            this.transaction['Container_Amt'] = '0';
            this.transaction['Content_Amt'] = '0';
            this.logser.createtransaction(this.transaction).subscribe(
              (data) => {
                data = this.transaction;
                this.updatebottlereturn['transactionid'] = this.currentusercityId + '_' + this.citytiming['CurrentDay'] + '_' + this.citytiming['CurrentTime'] + '_' + transactioncount + '_06';
                this.updatebottlereturn['transactiondate'] = String(this.citytiming['CurrentDay']);
                this.logser.updateConveyorAssets(this.updatebottlereturn).subscribe((data) => {
                  this.playAudioElement(this.Thanksreturning.nativeElement, 0.8);
                  if (fromreturncon == true) {

                    $(".displayconveyor").html("Credited ₹ " + amount_refund.toFixed(2));
                    // alert("Thanks for returning the bottle. ₹ " + amount_refund + " has been credited to your wallet");
                    $("#" + currentlyDroped).addClass('Amountcredited');

                    this.startreturnanimation(currentlyDroped);
                  }
                  else {

                    this.playAudioElement(this.Thanksreturning.nativeElement, 0.8);
                    $(".reverseBoard").html("Credited ₹ " + amount_refund.toFixed(2));
                    let that = this;
                    setTimeout(function () {
                      that.reversedBottles.length = 0;
                      $(".reverseBoard").html("Place your Bottle on the Placeholder");
                    }, 4000)
                  }



                });
              });



          },
            error => {
              //console.log(error);
            });
        });
      if (fromreturncon == true) {
        this.logser.getFacilitycashbox('Supermarket Owner').subscribe(data => {
          (data[0]['Cashbox'] == '') ? this.supermarketcashbox = 0 : this.supermarketcashbox = parseInt(data[0]['Cashbox']);
          this.supermarketcashbox -= amount_refund;
          this.logser.updateFacilitycashbox('Supermarket Owner', String(this.supermarketcashbox)).subscribe(data => { });

        });
      }
      else {
        //alert("returning")
        this.logser.getFacilitycashbox('Bottle Reverse Vending Machine Owner').subscribe(data => {
          (data[0]['Cashbox'] == '') ? this.getReverseVendingCashbox = 0 : this.getReverseVendingCashbox = parseInt(data[0]['Cashbox']);
          this.getReverseVendingCashbox -= amount_refund;
          this.logser.updateFacilitycashbox('Bottle Reverse Vending Machine Owner', String(this.getReverseVendingCashbox)).subscribe(data => { });
        });
      }
    }
    else {
      if (fromreturncon == false) {

        this.playAudioElement(this.Thanksreturning.nativeElement, 0.8);
        $(".reverseBoard").html("Credited ₹ " + amount_refund.toFixed(2));
        let that = this;
        setTimeout(function () {
          that.reversedBottles.length = 0;
          $(".reverseBoard").html("Place your Bottle on the Placeholder");
        }, 4000)
      }
    }
  }
  getReverseVendingCashbox = 0;
  calculateReturnCreditAmount(currentlyDroped: any, amount_refund: any) {



    for (let i = 0; i < this.assetdataset.length; i++) {
      console.log(this.assetdataset[i]['AssetId'], currentlyDroped.split('City')[1].split("at")[0])
      console.log(this.assetdataset[i]['AssetId'] === currentlyDroped.split('City')[1].split("at")[0])
      if (this.assetdataset[i]['AssetId'] === currentlyDroped.split('City')[1].split("at")[0] && this.assetdataset[i]['Bottle_Status'] == 'Empty-Dirty') {
        amount_refund = parseFloat(this.assetdataset[i]['Bottle_Price']) * (this.assetdataset[i]['Redeem_Good'] / 100);
        console.log(amount_refund)
        return amount_refund;

      }
      else if (this.assetdataset[i]['AssetId'] === currentlyDroped.split('City')[1].split("at")[0] && this.assetdataset[i]['Bottle_Status'] == 'Damaged-Empty') {
        amount_refund = parseFloat(this.assetdataset[i]['Bottle_Price']) * (this.assetdataset[i]['Redeem_Damaged'] / 100);
        console.log(amount_refund)
        return amount_refund;
      }
    }
  }
  returnreverse(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      // Reordering items within the same list
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Transferring items between different lists
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    let currentlyDroped = event.item.element.nativeElement.id;
    let currentDropzone = event.container.element.nativeElement.classList;
    let amount_refund = 0.0;

    // Explicitly update the bottledropped list with the latest data
    if (event.container.element.nativeElement.classList.contains('vending_list')) {
      this.reversedBottles.length = 0;
      this.reversedBottles.push(currentlyDroped);
    }



    if (currentDropzone.contains('vending_list')) {
      // Perform refund and other logic related to bottle_list
      this.updatebottlereturn['currentitem'] = currentlyDroped.split('City')[1].split("at")[0];
      this.updatebottlereturn['fromfacility'] = this.currentUserRole;
      this.updatebottlereturn['Bottleloc'] = "Bottle Reverse Vending Machine";
      this.updatebottlereturn['tofacility'] = "Bottle Reverse Vending Machine";


      this.logser.getthisAssets(this.updatebottlereturn['currentitem']).subscribe((data) => {

        this.updatebottlereturn['bottlestatus'] = data[0]['Bottle_Status'];
        this.getBottleCode = data[0]['Bottle_Code'].split('.')[1];
        let getMaxRefillCount, getCurrentRefillCount;
        getMaxRefillCount = data[0]['Max_Refill_Count'];
        getCurrentRefillCount = data[0]['Current_PlantRefill_Count'];
        if (getMaxRefillCount == 0) {

          amount_refund = 0.0;

          this.alertModal.openModal("Thanks for returning the bottle.Unfortunately, producer of this shampoo brand is NOT entertaining empty bottle returns. We will be sending this bottle to the recycling plant. An amount of ₹00.00 has been credited to your wallet. Remember to check the \"Max refill count\" on the bottle lable  next time you buy or return.However, you may refill such bottle at the refilling station if you wish.(next time) ", false, () => {
            this.bottleStatus_Display['Bottle_Status'] = 'Damaged-Empty';
            this.bottleStatus_Display['currentQuantity'] = 0;
            this.bottleStatus_Display['Bottle_loc'] = 'Bottle Reverse Vending Machine';
            this.bottleStatus_Display['currentbottle'] = this.updatebottlereturn['currentitem'];
            this.getBottleStatus = 'Damaged-Empty'
            this.logser.updatethisAssetQuantity(this.bottleStatus_Display).subscribe((data) => {
              this.updateBtlLocationandMakeitRetired(this.bottleStatus_Display['currentbottle'], 'Bottle Reverse Vending Machine', 'EndOfLife')
              this.returnCashTransactions(amount_refund, currentlyDroped, false, '07', 'Bottle Reverse Vending Machine');
            });
          });

        }
        else if (getCurrentRefillCount >= getMaxRefillCount) {

          amount_refund = this.calculateReturnCreditAmount(currentlyDroped, amount_refund);

          this.alertModal.openModal("Thanks for returning the bottle. This bottle has reached the Max-Refill count limit. We will be sending this bottle to the recycling plant. An amount of ₹ " + amount_refund.toFixed(2) + " has been credited to your wallet.", false, () => {
            this.bottleStatus_Display['Bottle_Status'] = 'Damaged-Empty';
            this.getBottleStatus = 'Damaged-Empty';
            this.bottleStatus_Display['currentQuantity'] = 0;
            this.bottleStatus_Display['currentbottle'] = this.updatebottlereturn['currentitem'];
            this.logser.updatethisAssetQuantity(this.bottleStatus_Display).subscribe((data) => {
              this.updateBtlLocationandMakeitRetired(this.bottleStatus_Display['currentbottle'], 'Bottle Reverse Vending Machine', 'EndOfLife')
              this.returnCashTransactions(amount_refund, currentlyDroped, false, '07', 'Bottle Reverse Vending Machine');
            });

          });


        }
        else {
          this.getBottleStatus = data[0]['Bottle_Status'];
          amount_refund = this.calculateReturnCreditAmount(currentlyDroped, amount_refund)
          this.returnCashTransactions(amount_refund, currentlyDroped, false, '07', 'Bottle Reverse Vending Machine');
        }




      });


    }
  }


  startreturnanimation(currentlyDropped: string) {

    console.log('Starting return animation for:', currentlyDropped);
    this.getdetailbrandfunction(currentlyDropped);
    const positions: { [key: string]: { left: string; topR: string; topOther: string; speed: number } } = {
      'B1.Shiny': { left: '1913px', topR: '2960px', topOther: '2260px', speed: 500 },
      'B2.Spiky': { left: '2313px', topR: '2960px', topOther: '2260px', speed: 1000 },
      'B4.Wavy': { left: '3091px', topR: '2960px', topOther: '2260px', speed: 1500 },
      'B5.Silky': { left: '3482px', topR: '2960px', topOther: '2260px', speed: 2500 },
      'B3.Bouncy': { left: '2704px', topR: '2960px', topOther: '2260px', speed: 2000 },
      'Universal': { left: '3873px', topR: '2960px', topOther: '2260px', speed: 3000 },
      'Damaged': { left: '4220px', topR: '2960px', topOther: '2260px', speed: 3000 }
    };
    let dummyvar;
    const defaultPosition = { left: '1694px', top: '2579px' };
    (this.getBottleStatus == 'Damaged-Empty') ? dummyvar = "Damaged" : dummyvar = this.getcurrentplacedbrand;
    const position = positions[dummyvar];
    if (position) {
      $(".conveyorbottledropper").animate({ 'left': position.left }, position.speed, () => {
        const topPosition = this.getBottleCode == 'R' ? position.topR : position.topOther;
        $(".conveyorbottledropper").animate({ 'top': topPosition }, 2000, () => {
          $(".conveyorbottledropper").css(defaultPosition);
          this.bottledropped.length = 0;
          $(".displayconveyor").html("Return used bottles here");
        });
      });
    }

  }

  currentlyrefillingBottle = '';
  refilldrop(event: CdkDragDrop<string[]>, dropZone: any) {
    const targetDropZone = dropZone.element.nativeElement.classList;

    // Check if the drop target is 'refilllist' and ensure only one item
    if (targetDropZone.contains('refilllist')) {
      // Only allow the drop if the drop zone is empty
      if (dropZone.data.length > 0) {
        this.alertModal.openModal('Cannot drop more than one item in this zone.')
        return;
      }
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data, event.previousIndex, event.currentIndex,);

    } else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
      this.currentlyrefillingBottle = event.item.element.nativeElement.id;
      let currentlyDroped = event.item.element.nativeElement.id;
      let currentDropzone = event.container.element.nativeElement.classList;
      if (currentDropzone.contains('refilllist')) {

        this.atRefillingMchn.length = 0;
        this.atRefillingMchn.push(currentlyDroped);

        this.updateonlyloc['currentbottle'] = currentlyDroped.split('City')[1].split("at")[0];
        this.updateonlyloc['Bottleloc'] = "At Refilling Stage";
        this.logser.updatelocation(this.updateonlyloc).subscribe((data) => {
          //console.log("bottle location update to Refilling Machine");
        });
        let getMaxRefillCount, getCurrentPlantRefillCount;
        this.logser.getthisAssets(this.updateonlyloc['currentbottle']).subscribe((data) => {
          getMaxRefillCount = data[0]['Max_Refill_Count'];
          getCurrentPlantRefillCount = data[0]['Current_PlantRefill_Count'];
          if (getMaxRefillCount == 0 || getCurrentPlantRefillCount >= getMaxRefillCount) {
            this.alertModal.openModal("This bottle has reached/exceeded the recommended Max refill limit. However, you may continue to refill if you wish")
            // this.droppedbottle = true;
            // if (this.resetanimation == true) {
            //   this.initiateanimation(currentlyDroped);
            //   this.playAudioElement(this.bottledroppeded.nativeElement, 0.8);
            // }
          }

          this.droppedbottle = true;
          this.getdetailbrandfunction(currentlyDroped);
          if (this.resetanimation == true) {
            this.initiateanimation(currentlyDroped);
            this.playAudioElement(this.bottledroppeded.nativeElement, 0.8);
          }


        });
      }

      if (currentDropzone.contains('refill_list') || currentDropzone.contains('refilled_list')) {

        if (currentDropzone.contains('refill_list')) {
          this.updateonlyloc['currentbottle'] = currentlyDroped.split('City')[1].split("at")[0];
          this.updateonlyloc['Bottleloc'] = this.currentUserCartId;
          this.logser.updatelocation(this.updateonlyloc).subscribe((data) => {
            //console.log("bottle location update to Cart Again!", data);
          });
        }

        if (currentDropzone.contains('refilled_list')) {
          this.updateonlyloc['currentbottle'] = currentlyDroped.split('City')[1].split("at")[0];
          this.updateonlyloc['Bottleloc'] = this.currentUserCartId;
          this.logser.updatelocation(this.updateonlyloc).subscribe((data) => {
            for (let i = 0; i < this.assetdataset.length; i++) {

              if (this.assetdataset[i]['AssetId'] == this.updateonlyloc['currentbottle']) {
                this.bottleDataatRefill['Current_SelfRefill_Count'] = this.assetdataset[i]['Current_SelfRefill_Count'];
                break;
              }
            }

            this.currentUserPurhcased.push(currentlyDroped);
            let index = this.refillbottles.findIndex(item => item === currentlyDroped)
            this.refillbottles.splice(index, 1);
            this.bottleDataatRefill['Current_SelfRefill_Count'] = this.bottleDataatRefill['Current_SelfRefill_Count'] + 1;
            this.bottleDataatRefill['currentQuantity'] = this.selectquantity;
            this.bottleDataatRefill['Bottle_Status'] = 'InUse';
            this.bottleDataatRefill['RefillingBottle'] = currentlyDroped.split('City')[1].split("at")[0];
            this.logser.updateRefillData(this.bottleDataatRefill).subscribe((data) => {
              $(".displayboard").html('Thank you. Visit again. Please press Continue button to refill another bottle');
              this.playAudioElement(this.thankyou.nativeElement, 0.8);
              this.refillbrandselected = '';
              $(".refilldropper").css({ 'left': '8px' }).hide();
              this.resetanimation = false;
              $(".continue").show();
            }
            );
          });

        }
      }

    }
  }

  droppedItemClassName = '';
  drop(event: CdkDragDrop<string[]>) {

    console.count("DROP CALLED");

    if (event.previousContainer === event.container) {
      return;
    }

    const bottleId: string =
      event.item.data?.id ?? event.item.element.nativeElement.id;

    const className = event.item.data?.className ??
      Array.from(event.item.element.nativeElement.classList)
        .find(c => c !== 'cdk-drag' && c !== 'cdk-drag-preview');

    const itemid = bottleId.split('at')[0].split('City')[1];
    console.log("dropped :" + itemid)
    const currentDropzone =
      event.container.element.nativeElement.classList;

    /*=========================================================
        SHELF  --->  CART
    =========================================================*/
    if (currentDropzone.contains('newbottle_list')) {

      // Move immediately in UI
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      console.log("Bottle dragged :", bottleId);
      console.log("Previous array :", event.previousContainer.data);
      console.log("Bottle at previousIndex :", event.previousContainer.data[event.previousIndex]);
      // Ask server to reserve
      this.logser.reserveBottle(
        itemid,
        this.currentUserCartId
      ).subscribe({

        next: (response: any) => {

          if (!response.success) {

            // Move bottle back
            transferArrayItem(
              event.container.data,
              event.previousContainer.data,
              event.currentIndex,
              event.previousIndex
            );

            this.alertModal.openModal(
              response.message,
              false
            );

            return;
          }

          this.updateStatus(
            bottleId,
            "blocked",
            this.currentUserCartId
          );
        },

        error: () => {

          // Move bottle back
          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            event.previousIndex
          );

          this.alertModal.openModal(
            "Unable to reserve bottle.",
            false
          );

        }

      });

      return;
    }

    /*=========================================================
        CART  --->  SHELF
    =========================================================*/
    if (
      event.previousContainer.element.nativeElement.classList
        .contains('newbottle_list')
    ) {

      // Move immediately
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      this.updateDragged['currentbottle'] = itemid;
      this.updateDragged['Bottleloc'] = 'Supermarket shelf';
      this.updateDragged['dragged'] = false;

      this.logser.updatedragged(this.updateDragged)
        .subscribe({

          next: () => {

            this.updateStatus(
              bottleId,
              'available',
              'Supermarket shelf'
            );

          },

          error: () => {

            // Restore previous state
            transferArrayItem(
              event.container.data,
              event.previousContainer.data,
              event.currentIndex,
              event.previousIndex
            );

            this.alertModal.openModal(
              "Unable to return bottle to shelf.",
              false
            );

          }

        });

      return;
    }

  }

  updateStatus(itemid: any, status: any, loc: any) {

    console.log("updateStatus called with:", itemid);

    const existingIdIndex = this.commonobj.findIndex(item => item.id === itemid);

    console.log("Found index:", existingIdIndex);

    if (existingIdIndex >= 0) {

      console.log("Found object:", this.commonobj[existingIdIndex]);

      this.commonobj[existingIdIndex].status = status;
      this.commonobj[existingIdIndex].Bottle_loc = loc;
    }
  }
  opensupermarket() {
    this.instance1 = panzoom(this.supermarket.nativeElement, {
      maxZoom: 2,
      minZoom: 0.4,
      bounds: true,
      boundsPadding: 1,
      smoothScroll: false,
      autocenter: true,
      filterKey: function () {
        return true;
      },
      beforeMouseDown: function (e) {
        // allow mouse-down panning only if altKey is down. Otherwise - ignore
        var shouldIgnore = !e.shiftKey;
        return shouldIgnore;
      },
      beforeWheel: function (e) {
        var shouldIgnore = !e.shiftKey;
        return shouldIgnore;
      },
      onDoubleClick: function (e) {
        return true; // tells the library to not preventDefault, and not stop propagation
      },
      onTouch: function (e) {
        return false; // tells the library to not preventDefault.
      }
    });
    $(".displayconveyor").html("Return used bottles here");
    let that = this;
    setTimeout(function () {
      $(".supermarketcart").css({ 'left': '927px', 'top': '3209px' });
      that.dopanzoomsupermarket(-317, -835, '0.4');
      that.setflag = 0;
      that.billpaid = false;
    }, 300);
    $(".displaymoniter").html("");


  }
  closesupermarket() {
    $('#innerdoor3').animate({ 'height': '100px' }, 300);
    let that = this;
    setTimeout(function () {
      $(".supermarketcart").animate({ 'left': '400px' }, 1000, () => {
        that.opensuperflag = 0;
        that.bottletaken.length = 0;
        let w = that;
        $('#innerdoor3').animate({ 'height': '1030px' }, 300);
        setTimeout(function () {
          w.dopanzoom(-885, -2343, '1');
          $(".maincity .cart").css({ 'top': '3019px', 'left': '1557px' });

        }, 1000);

      });

    }, 300);


  }
  currentusertransaction: any[] = [];
  loadledgerdata() {
    this.currentusertransaction = [];
    for (let i = 0; i < this.assetdataset.length; i++) {

      if (this.assetdataset[i]['Bottle_loc'] == this.currentUserCartId || this.assetdataset[i]['Bottle_loc'] == 'House@' + this.currentUserCartId && this.assetdataset[i]['purchased'] == true) {
        this.currentusertransaction.push(this.assetdataset[i]);
      }

    }
  }
  showbutton = false;
  selectedbottle = '';
  cartPredicate = (drag: any, drop: any): boolean => {
    return drop.element.nativeElement.classList.contains('newbottle_list');
  };
  openwhyshorter(whyshorter: any) {
    this.closeothermodels();
    this.modalService.open(whyshorter, { windowClass: "frontpage" });
  }

  private intervalId: any;
  private isMoving = false;

  ngOnDestroy(): void {
    this.clearMovement();
    // Clear all intervals when component is destroyed
    if (this.timeInterval) clearInterval(this.timeInterval);
    if (this.assetInterval) clearInterval(this.assetInterval);
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }


  onMouseUp(event: MouseEvent): void {
    this.clearMovement();
  }

  @HostListener('window:mouseup', ['$event'])
  onWindowMouseUp(event: MouseEvent): void {
    this.clearMovement();
  }

  moveUpbtn(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.clearMovement();
    if (this.opensuperflag == 0) {
      this.checkCartPosition();
      if (this.canMoveTop) {
        let leftval = $(".cart").css('top');
        this.isMoving = true;
        this.intervalId = setInterval(() => {
          this.checkCartPosition();
          if (this.isMoving && this.canMoveTop) {
            leftval = parseInt(leftval) - 20 + "px";
            $(".cart").css({ 'top': leftval })
          }
        }, 50);

      }
    }
    else if (this.opensuperflag == 1) {
      this.supercartposition();
      if (this.markettop == true) {
        let leftval = $(".supermarketcart").css('top');
        this.isMoving = true;
        this.intervalId = setInterval(() => {
          this.supercartposition();
          if (this.isMoving && this.markettop) {
            leftval = parseInt(leftval) - 20 + "px";
            $(".supermarketcart").css({ 'top': leftval })
          }
        }, 50);
      }
    }
    else if (this.opensuperflag == 2) {
      this.refillcartposition();
      if (this.refilltop == true) {
        this.isMoving = true;
        let leftval = $("#refillcart").css('top');
        this.intervalId = setInterval(() => {
          this.refillcartposition();
          if (this.isMoving && this.refilltop) {
            leftval = parseInt(leftval) - 20 + "px";
            $("#refillcart").css({ 'top': leftval })
          }
        }, 50);
      }
    }

  }


  moveDownbtn(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.clearMovement();
    if (this.opensuperflag == 0) {
      this.checkCartPosition();
      if (this.canMoveBottom) {
        let leftval = $(".cart").css('top');
        this.isMoving = true;
        this.intervalId = setInterval(() => {
          this.checkCartPosition();
          if (this.isMoving && this.canMoveBottom) {
            leftval = parseInt(leftval) + 20 + "px";
            $(".cart").css({ 'top': leftval })
          }
        }, 50);

      }
    }
    else if (this.opensuperflag == 1) {
      this.supercartposition();
      if (this.marketbottom == true) {
        let leftval = $(".supermarketcart").css('top');
        this.isMoving = true;
        this.intervalId = setInterval(() => {
          this.supercartposition();
          if (this.isMoving && this.marketbottom) {
            leftval = parseInt(leftval) + 20 + "px";
            $(".supermarketcart").css({ 'top': leftval })
          }
        }, 50);
      }
    }
    else if (this.opensuperflag == 2) {
      this.refillcartposition();
      if (this.refillbottom == true) {
        this.isMoving = true;
        let leftval = $("#refillcart").css('top');
        this.intervalId = setInterval(() => {
          this.refillcartposition();
          if (this.isMoving && this.refillbottom) {
            leftval = parseInt(leftval) + 20 + "px";
            $("#refillcart").css({ 'top': leftval })
          }
        }, 50);
      }
    }

  }
  moveLeftbtn(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.clearMovement();
    if (this.opensuperflag == 0) {
      this.checkCartPosition();
      if (this.canMoveLeft) {
        let leftval = $(".cart").css('left');
        this.isMoving = true;
        this.intervalId = setInterval(() => {
          this.checkCartPosition();
          if (this.isMoving && this.canMoveLeft) {
            leftval = parseInt(leftval) - 20 + "px";
            $(".cart").css({ 'left': leftval })
          }
        }, 50);

      }
    }
    else if (this.opensuperflag == 1) {
      this.supercartposition();
      if (this.marketleft == true) {
        let leftval = $(".supermarketcart").css('left');
        this.isMoving = true;
        this.intervalId = setInterval(() => {
          this.supercartposition();
          if (this.isMoving && this.marketleft) {
            leftval = parseInt(leftval) - 20 + "px";
            $(".supermarketcart").css({ 'left': leftval })
          }
        }, 50);
      }
    }
    else if (this.opensuperflag == 2) {
      this.refillcartposition();
      if (this.refillleft == true) {
        this.isMoving = true;
        let leftval = $("#refillcart").css('left');
        this.intervalId = setInterval(() => {
          this.refillcartposition();
          if (this.isMoving && this.refillleft) {
            leftval = parseInt(leftval) - 20 + "px";
            $("#refillcart").css({ 'left': leftval })
          }
        }, 50);
      }
    }

  }
  moveRightbtn(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.clearMovement();
    if (this.opensuperflag == 0) {
      this.checkCartPosition();
      if (this.canMoveRight) {
        let leftval = $(".cart").css('left');
        this.isMoving = true;
        this.intervalId = setInterval(() => {
          this.checkCartPosition();
          if (this.isMoving && this.canMoveRight) {
            leftval = parseInt(leftval) + 20 + "px";
            $(".cart").css({ 'left': leftval })
          }
        }, 50);

      }
    }
    else if (this.opensuperflag == 1) {
      this.supercartposition();
      if (this.marketright == true) {
        let leftval = $(".supermarketcart").css('left');
        this.isMoving = true;
        this.intervalId = setInterval(() => {
          this.supercartposition();
          if (this.isMoving && this.marketright) {
            leftval = parseInt(leftval) + 20 + "px";
            $(".supermarketcart").css({ 'left': leftval })
          }
        }, 50);
      }
    }
    else if (this.opensuperflag == 2) {
      this.refillcartposition();
      if (this.refillright == true) {
        this.isMoving = true;
        let leftval = $("#refillcart").css('left');
        this.intervalId = setInterval(() => {
          this.refillcartposition();
          if (this.isMoving && this.refillright) {
            leftval = parseInt(leftval) + 20 + "px";
            $("#refillcart").css({ 'left': leftval })
          }
        }, 50);
      }
    }

  }




  clearMovement(): void {
    this.isMoving = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  makeitEmpty() {
    this.isDisabled = true;
    this.bottleStatus_Display['currentQuantity'] = 0;
    $("." + this.bottleStatus_Display['contentCode'] + ".shampoolevel").css('height', '0px');
    if (this.bottleStatus_Display['Bottle_Status'] == 'InUse') {
      $(".Inhouseshelf_bottles #" + this.selectedBottleatStage).addClass('Empty-Dirty');
      this.bottleStatus_Display['Bottle_Status'] = "Empty-Dirty";
    }
    else if (this.bottleStatus_Display['Bottle_Status'] == 'Damaged-InUse') {
      this.bottleStatus_Display['Bottle_Status'] = "Damaged-Empty";
      $(".Inhouseshelf_bottles #" + this.selectedBottleatStage).addClass('Damaged-Empty');
    }
    this.logser.updatethisAssetQuantity(this.bottleStatus_Display).subscribe((data) => {
      if (this.bottleStatus_Display['Bottle_Status'] == 'InUse') {
        let index = this.currentUserPurhcased.findIndex(item => item === this.bottleStatus_Display['currentbottle'])
        this.currentUserPurhcased.splice(index, 1);
        this.refillbottles.push(this.bottleStatus_Display['currentbottle']);
      }
    });
  }
  isDamaged: boolean = false;
  makeitDamaged() {
    this.isDamaged = true;
    if (this.bottleStatus_Display['currentQuantity'] > 0) {
      this.bottleStatus_Display['Bottle_Status'] = "Damaged-InUse"
      $(".Inhouseshelf_bottles #" + this.selectedBottleatStage).addClass('Damaged-InUse');
    }
    else {
      this.bottleStatus_Display['Bottle_Status'] = "Damaged-Empty";
      $(".Inhouseshelf_bottles #" + this.selectedBottleatStage).addClass('Damaged-Empty');
      this.updateBtlLocationandMakeitRetired(this.bottleStatus_Display['currentbottle'], this.currentUserCartId, 'Damaged')
    }
    this.logser.updatethisAssetQuantity(this.bottleStatus_Display).subscribe((data) => { });
  }
  isThrown: boolean = false;

  makeitThrown() {
    $('.btncont,.shampoolevel').hide();
    this.isThrown = true;

    const bottleType = this.selectedBottleatStage.split('id')[0].split('_')[2] + '.' + this.selectedBottleatStage.split('id')[1].split('_')[0];
    const thrownFine = this.calculateFine(bottleType);

    this.updateBottleLocationandFine('Street', thrownFine, 'Fine for Throwing Bottle', '08');
  }
  reduceCapacity() {
    if (this.bottleStatus_Display['currentQuantity'] >= 20) {
      this.bottleStatus_Display['currentQuantity'] -= 20;
      let getheight = $("." + this.bottleStatus_Display['contentCode'] + ".shampoolevel").css('height').split("px")[0];
      let reducedheight = parseFloat(getheight) - this.stepheight;
      $("." + this.bottleStatus_Display['contentCode'] + ".shampoolevel").css('height', reducedheight + 'px');

      this.logser.updatethisAssetQuantity(this.bottleStatus_Display).subscribe((data) => { });
      if (this.bottleStatus_Display['currentQuantity'] == 0) {
        (this.bottleStatus_Display['Bottle_Status'] == 'InUse') ? this.bottleStatus_Display['Bottle_Status'] = "Empty-Dirty" : this.bottleStatus_Display['Bottle_Status'] = "Damaged-Empty";
        this.logser.updatethisAssetQuantity(this.bottleStatus_Display).subscribe((data) => {
          let index = this.currentUserPurhcased.findIndex(item => item === this.bottleStatus_Display['currentbottle'])
          this.currentUserPurhcased.splice(index, 1);
          this.refillbottles.push(this.bottleStatus_Display['currentbottle']);
        });
      }

    }

  }
  bottleDataatRefill = {
    'Current_SelfRefill_Count': 0,
    'currentQuantity': 0,
    'RefillingBottle': '',
    'Bottle_Status': "InUse",
  }
  bottleStatus_Display = {
    'currentbottle': '',
    'currentQuantity': 0,
    'Bottle_Status': "InUse",
    'Bottle_loc': '',
    'contentCode': ''
  }
  selectedBottleatStage: string = '';
  sldBottleData: any;
  openbottelstages(cartcontent: any, event: any) {
    let element = event.target || event.srcElement || event.currentTarget;
    this.selectedBottleatStage = element.id;
    console.log(this.selectedBottleatStage)
    this.bottleStatus_Display['currentbottle'] = element.id.split("at")[0].split("City")[1];
    this.calculatenetfine();
    if (this.opensuperflag == 0) {
      this.billpaid = true;
      this.altertab = 2;

    }
    else {
      this.billpaid = false;
    }

    this.closeothermodels();
    this.modalService.open(cartcontent, { windowClass: "cartcontent" });
    this.checkthebottlestatusfordisplay();




  }

  isDisabled: boolean = false;
  checkthebottlestatusfordisplay() {
    if (this.bottleStatus_Display['currentbottle'] != '') {
      console.log(this.bottleStatus_Display['currentbottle'])
      this.logser.getthisAssets(this.bottleStatus_Display['currentbottle']).subscribe((data) => {
        this.sldBottleData = data;
        console.log(data);
        $(".loading").hide();
        if (data[0]['remQuantity'] == '') {
          data[0]['remQuantity'] = 500;
        }
        this.bottleStatus_Display['contentCode'] = data[0]['Current_Content_Code'].split(".")[0];
        this.bottleStatus_Display['currentQuantity'] = data[0]['remQuantity'];
        this.bottleStatus_Display['Bottle_Status'] = data[0]['Bottle_Status'];
        this.bottleStatus_Display['Bottle_loc'] = data[0]['Bottle_loc'];
        let content = this.sldBottleData[0]['Current_Content_Code'].split(".")[0];
        if (this.bottleStatus_Display['Bottle_loc'] !== "Street") {
          $(".shampoolevel").addClass(content);
          let getheight = parseFloat($("." + content + ".shampoolevel").css('height').split("px")[0]);
          this.stepheight = getheight / 25;
          let unitreduction = 500 - (this.bottleStatus_Display['currentQuantity']);
          let reductionpropo = unitreduction / 500;
          let heightred = getheight * reductionpropo;
          let reducedheight = getheight - heightred;
          let unitprice = 0;
          $("." + content + ".shampoolevel").css('height', reducedheight + 'px');

          for (let r = 0; r < this.shampooPrice.length; r++) {
            if (this.shampooPrice[r]['BottleContent'] == this.sldBottleData[0]['Current_Content_Code']) {
              unitprice = this.shampooPrice[r]['UnitPrice'];
            }

          }


          let checkuniversal = this.sldBottleData[0]['Bottle_Code'].split(".")[0];
          this.shapooprice = unitprice;
          this.totalamount = parseFloat(this.sldBottleData[0]['Bottle_Price']) + parseFloat(this.sldBottleData[0]['Content_Price']) + parseFloat(this.sldBottleData[0]['Env_Tax_Customer'])
          if (checkuniversal == 'UB') {
            this.leblfound = true;
            this.bottleclass = "universal";
            this.frontlabel = this.sldBottleData[0]['Current_Content_Code'].split(".")[1].toString().toLowerCase() + "_label";
          }
          else {
            this.leblfound = false;
            this.bottleclass = this.sldBottleData[0]['Current_Content_Code'].split(".")[1];
          }


        }
        else {
          this.isThrown = true;
          $(".btncont,.shampoolevel").hide();
          $("#" + this.selectedBottleatStage.split("at")[0].split("City")[1]).addClass('Street');
        }
        $(".currentbottleshow").fadeIn(2000);
        this.workonflags();


      });
    }
    else {

    }


  }
  workonflags() {
    this.isThrown = false;
    if (this.bottleStatus_Display['Bottle_Status'] == 'Damaged-Empty') {
      this.isDamaged = true;
      this.isDisabled = true;

    }
    else if (this.bottleStatus_Display['Bottle_Status'] == 'Damaged-InUse') {
      this.isDamaged = true;
      this.isDisabled = false;
    }
    else if (this.bottleStatus_Display['Bottle_Status'] == 'Empty-Dirty') {
      this.isDisabled = true;
      this.isDamaged = false;
    }
    else {
      this.isDamaged = false;
      this.isDisabled = false;
    }

  }
  checksBottleStatus(item: CdkDrag<string>) {
    if (!item.element.nativeElement.classList.contains('Empty-Dirty') && !item.element.nativeElement.classList.contains('Damaged-Empty') && !item.element.nativeElement.classList.contains('Street')) { return true; }
    else { return false; }
  }

  checksBottleempty(item: CdkDrag<string>) {
    if (item.element.nativeElement.classList.contains('Empty-Dirty') || item.element.nativeElement.classList.contains('Damaged-Empty') && !item.element.nativeElement.classList.contains('Street')) { return true; }
    else { return false; }
  }

  playAudioElement(audioElement: HTMLAudioElement, volume: number) {
    audioElement.volume = volume;
    audioElement.muted = this.isMuted;
    audioElement.play().then(() => {
    }).catch(error => {
      console.error(`Error playing ${audioElement.src}:`, error);
    });
  }

  toggleAudio() {
    const audioElements = document.querySelectorAll('audio');

    audioElements.forEach((audio: HTMLAudioElement) => {
      audio.muted = !this.isMuted;
    });

    this.isMuted = !this.isMuted;
  }
}
