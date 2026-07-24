import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginserviceService } from './../services/loginservice.service';
import { BASE_ASSET } from '../constants/asset-base';
import { AlertModalComponent } from '../alert-modal/alert-modal.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-bottle-inventory-form',
  templateUrl: './bottle-inventory-form.component.html',
  styleUrls: ['./bottle-inventory-form.component.scss']
})
export class BottleInventoryFormComponent implements OnInit {
  inventoryForm!: FormGroup;
  currentUser: any;
  bottleTypes = [
    { value: 'BVB', label: 'BVB' },
    { value: 'BRCB', label: 'BRCB' },
    { value: 'BRFB', label: 'BRFB' },
    { value: 'UVB', label: 'UVB' },
    { value: 'URCB', label: 'URCB' },
    { value: 'URFB', label: 'URFB' }
  ];
  producerOptions = [
    { value: 'B1.Shiny', label: 'B1.Shiny' },
    { value: 'B2.Spiky', label: 'B2.Spiky' },
    { value: 'B3.Bouncy', label: 'B3.Bouncy' },
    { value: 'B4.Wavy', label: 'B4.Wavy' },
    { value: 'B5.Silky', label: 'B5.Silky' }
  ];
  constructor(
    private fb: FormBuilder,
    private loginService: LoginserviceService,
    private router: Router
  ) {

  }
  @ViewChild('alertModal') alertModal!: AlertModalComponent;
  citySummary: any = {};
  totalByProducer: any;
  allAssets: any = [];
  producerCode = '';
  selectedBottleType = '';
  cityId = '';
  currentRole = '';
  isSubmitting = false;
  ngOnInit(): void {

    this.createForm();
    this.currentUser = this.loginService.currentuser;
    this.cityId = this.loginService.currentuser.CityId;
    this.currentRole = this.loginService.currentuser.Role;
    if (this.currentRole.includes('B1')) {
      this.producerCode = "B1.Shiny";
    }
    else if (this.currentRole.includes('B2')) {
      this.producerCode = "B2.Spiky";
    }
    else if (this.currentRole.includes('B3')) {
      this.producerCode = "B3.Bouncy";
    }
    else if (this.currentRole.includes('B5')) {
      this.producerCode = "B5.Silky";
    }
    else if (this.currentRole.includes('B4')) {
      this.producerCode = "B4.Wavy";
    }

    this.inventoryForm.patchValue({
      producer: this.currentUser.username
    });
    if (this.loginService.currentuser.Username && this.loginService.currentuser.CityId) {
      this.loginService.getAllAssets().subscribe((data) => {
        this.allAssets = data;

      });
    }
    else {
      this.router.navigate(['/login']);
    }

    this.loginService.getShampooPrice().subscribe((data: any) => {
      this.shampooPrice = data;

      // 👇 subscribe ONLY AFTER price loaded
      this.inventoryForm.get('bottle_type')?.valueChanges.subscribe(() => {
        if (this.currentRole.includes('Supermarket')) {
          this.loadInventoryForSupermarket();
        }
        else {
          this.loadInventoryForProducer();
        }
      });

    });

    this.inventoryForm.get('producer_code')?.valueChanges.subscribe(() => {
      if (this.currentRole.includes('Supermarket')) {
        this.loadInventoryForSupermarket();
      }

    });


    if (!this.isSupermarketUser()) {
      this.inventoryForm.patchValue({
        producer_code: this.producerCode
      });

      this.inventoryForm.get('producer_code')?.disable();
    }

    this.loginService.getShampooPrice().subscribe((data: any) => {
      this.shampooPrice = data;
    });
  }
  shampooPrice: any[] = [];
  isSupermarketUser(): boolean {
    return this.currentRole.includes('Supermarket');
  }

  currentCycleNumber: number = 0;
  createForm(): void {

    this.currentCycleNumber = Math.floor(this.loginService.currentuser.currentday / 90);

    this.inventoryForm = this.fb.group({
      producer_code: [''],
      bottle_type: ['', Validators.required],
      cycle_number: [this.currentCycleNumber + 1, [Validators.required, Validators.min(0)]],
      previous_cycle_number: [this.currentCycleNumber, [Validators.required, Validators.min(0)]],
      current_total_stock: [0, [Validators.required, Validators.min(0)]],
      bottles_sold_to_supermarket_prev_cycle: [0, [Validators.required, Validators.min(0)]],
      bottles_bought_by_consumers: [0, [Validators.required, Validators.min(0)]],
      bottles_returned_good: [0, [Validators.required, Validators.min(0)]],
      bottles_returned_damaged: [0, [Validators.required, Validators.min(0)]],
      manufacturing_day: [this.loginService.currentuser.currentday, Validators.min(0)],
      content_price_per_ml: [null, Validators.min(0)],
      bottle_price: [null, Validators.min(0)],
      total_mrp: [{ value: 0 }],
      max_refill_count: [5, [Validators.required, Validators.min(1)]],
      redeem_value_good: [null, Validators.min(0)],
      redeem_value_damaged: [null, Validators.min(0)],
      supermarket_commission_percent: [null, [Validators.min(0), Validators.max(100)]],
      consumer_discount_percent: [null, [Validators.min(0), Validators.max(100)]],
      bottles_to_produce: [0, [Validators.required, Validators.min(0)]],
      bottles_to_sell_to_supermarket: [0, [Validators.required, Validators.min(0)]],
      Bottle_CityId: [this.loginService.currentuser.CityId || '', Validators.required]

    });
    this.calculateMRP();
  }
  currentlySelectedBrandBottles: any = [];

  calculateMRP() {
    this.inventoryForm.get('content_price_per_ml')!.valueChanges.subscribe(() => {
      this.updateMRP();
    });

    this.inventoryForm.get('bottle_price')!.valueChanges.subscribe(() => {
      this.updateMRP();
    });
  }
  totalmrp = 0.0;
  updateMRP() {
    const contentPrice = Number(this.inventoryForm.get('content_price_per_ml')!.value) || 0;
    const bottlePrice = Number(this.inventoryForm.get('bottle_price')!.value) || 0;

    this.totalmrp = (contentPrice * 500) + bottlePrice;
    this.inventoryForm.get('total_mrp')!.setValue(
      Number(this.totalmrp.toFixed(2))
    );
  }
  fullInventoryRecord: any = null;
  loadInventoryForSupermarket(): void {
    const bottleType = this.inventoryForm.get('bottle_type')?.value;
    this.producerCode = this.inventoryForm.get('producer_code')?.value;
    const cycleNumber = Number(this.inventoryForm.get('cycle_number')?.value);

    if (!bottleType || !this.producerCode || !cycleNumber) return;

    // 🔹 STEP A: Try CURRENT cycle
    this.loginService.getInventory(
      this.producerCode,
      bottleType,
      Number(this.cityId),
      cycleNumber
    ).subscribe({

      next: (record) => {
        this.applyInventoryRecord(record);
      },

      error: (err) => {
        if (err.status !== 404) {
          console.error('Inventory fetch failed', err);
          return;
        }

        console.warn('Current cycle not found, trying previous cycle');

        // 🔹 STEP B: Try PREVIOUS cycle
        this.loginService.getInventory(
          this.producerCode,
          bottleType,
          Number(this.cityId),
          cycleNumber - 1
        ).subscribe({

          next: (prevRecord) => {

            // IMPORTANT: recalculate bottles for previous cycle
            this.getDataFromServer(bottleType);

            if (this.hasBottlesInPlant()) {
              this.applyInventoryRecord(prevRecord);
            } else {
              this.showNoBottleAlert();
            }
          },

          error: () => {
            this.showNoBottleAlert();
          }
        });
      }
    });
  }
  loadInventoryForProducer(): void {

    const bottleType = this.inventoryForm.get('bottle_type')?.value;
    const producerCode = this.producerCode;
    const previousCycle = Number(
      this.inventoryForm.get('previous_cycle_number')?.value
    );

    if (!bottleType || !producerCode || !this.shampooPrice?.length) {
      return;
    }

    // 🔹 Always get price first (this must always load)
    const priceData = this.shampooPrice.find(
      p => p.BottleContent === producerCode
    );

    const unitPrice = priceData ? priceData.UnitPrice : 0;

    this.loginService.getInventory(
      producerCode,
      bottleType,
      Number(this.cityId),
      previousCycle
    ).subscribe({

      next: (record) => {

        // ✅ Record exists → load everything
        this.fullInventoryRecord = record;
        let getBottleCode = this.getBottleCodeFromCategory(record.bottle_type)
        let filteredAssets = this.allAssets.filter((asset: any) =>
          asset.Content_Code.includes(this.producerCode) &&
          asset.Bottle_Code.includes(getBottleCode) &&
          asset.Bottle_loc.includes('_Plant')
        );
        this.inventoryForm.patchValue({
          content_price_per_ml: unitPrice,
          bottle_price: record?.bottle_price || null,
          supermarket_commission_percent: record?.supermarket_commission_percent || null,
          consumer_discount_percent: record?.consumer_discount_percent || null,
          redeem_value_good: record?.redeem_value_good || null,
          redeem_value_damaged: record?.redeem_value_damaged || null,
          max_refill_count: record?.max_refill_count || 5,
          current_total_stock: record?.current_total_stock || 0,
          bottles_sold_to_supermarket_prev_cycle:
            record?.bottles_sold_to_supermarket_prev_cycle || 0,
          bottles_bought_by_consumers:
            record?.bottles_bought_by_consumers || 0,
          bottles_returned_good:
            record?.bottles_returned_good || 0,
          bottles_returned_damaged:
            record?.bottles_returned_damaged || 0,
          bottles_to_produce: filteredAssets
        });

        this.updateMRP();
      },

      error: (err) => {

        if (err.status === 404) {

          // ✅ Record NOT found
          this.fullInventoryRecord = null;

          // 🔹 Clear only inventory-related fields
          this.inventoryForm.patchValue({
            content_price_per_ml: unitPrice,   // 👈 keep price
            bottle_price: null,
            supermarket_commission_percent: null,
            consumer_discount_percent: null,
            redeem_value_good: null,
            redeem_value_damaged: null,
            max_refill_count: 5,
            current_total_stock: 0,
            bottles_sold_to_supermarket_prev_cycle: 0,
            bottles_bought_by_consumers: 0,
            bottles_returned_good: 0,
            bottles_returned_damaged: 0
          });

          this.updateMRP();
        } else {
          console.error(err);
        }
      }
    });
  }
  private applyInventoryRecord(record: any): void {
    if (!record) return;

    this.fullInventoryRecord = record;
    let getBottleCode = this.getBottleCodeFromCategory(record.bottle_type)
    let filteredAssets = this.allAssets.filter((asset: any) =>

      asset.Content_Code.includes(this.producerCode) &&
      asset.Bottle_Code.includes(getBottleCode) &&
      asset.Content_Price.includes((record.content_price_per_ml * 500)) &&
      asset.Bottle_loc.includes('Supermarket shelf')


    );

    console.log(filteredAssets, record.bottles_to_produce)

    this.inventoryForm.patchValue({
      content_price_per_ml: record.content_price_per_ml,
      bottle_price: record.bottle_price,
      supermarket_commission_percent: record.supermarket_commission_percent,
      consumer_discount_percent: record.consumer_discount_percent,
      total_mrp: record.total_mrp,
      redeem_value_good: record.redeem_value_good,
      max_refill_count: record.max_refill_count,
      redeem_value_damaged: record.redeem_value_damaged,
      bottles_to_produce: parseInt(record.bottles_to_produce) - filteredAssets.length
    });

    this.updateMRP();
  }
  private hasBottlesInPlant(): boolean {
    const producerPlantLoc = this.producerCode.split('.')[1] + '_Plant';

    return this.currentlySelectedBrandBottles.some(
      (b: any) => b.Bottle_loc === producerPlantLoc
    );
  }
  private showNoBottleAlert(): void {
    this.fullInventoryRecord = null;
    this.alertModal.openModal(
      'No bottles found for this plant in current or previous cycle'
    );
  }
  getBottleCodeFromCategory(
    category: string,
  ): string | null {
    category = category.toLowerCase();
    let producer = this.producerCode.split(".")[0];

    if (category === "bvb") {
      return `${producer}.V`;
    } else if (category === "uvb") {
      return "UB.V";
    } else if (category === "brcb" || category === "brfb") {


      return `${producer}.R`;

    } else if (category === "urcb" || category === "urfb") {

      return "UB.R";

    } else {
      return null;
    }
  }
  customerpurchased: number = 0;
  returnedGood: number = 0;
  returnedDamaged: number = 0;
  currentlySoldBottles: number = 0;
  available_Bottles_In_City: number = 0;
  bottles_In_Plant: number = 0;
  getDataFromServer(value: string): void {

    this.currentlySelectedBrandBottles = [];
    this.currentlySoldBottles = 0;
    this.customerpurchased = 0;
    this.returnedGood = 0;
    this.returnedDamaged = 0;
    this.bottles_In_Plant = 0;


    for (let r = 0; r < this.allAssets.length; r++) {
      let getBottleCode = this.getBottleCodeFromCategory(value)

      const bottleType = this.inventoryForm.get('bottle_type')?.value;
      let requiredRefillCount = 0;

      if (bottleType === 'BRCB' || bottleType === 'URCB') {
        requiredRefillCount = 0;
      } else if (bottleType === 'BRFB' || bottleType === 'URFB') {
        requiredRefillCount = 1;
      }

      if (this.allAssets[r]['Bottle_Code'] === getBottleCode && getBottleCode !== null && this.allAssets[r]['Current_PlantRefill_Count'] == requiredRefillCount && this.allAssets[r]['Content_Code'] == this.producerCode) {
        this.currentlySelectedBrandBottles.push(this.allAssets[r]);
      }
      else if (getBottleCode === null) {
        break;
      }
    }
    console.log(this.currentlySelectedBrandBottles)
    this.available_Bottles_In_City = this.currentlySelectedBrandBottles.length;
    if (this.currentlySelectedBrandBottles.length > 0) {
      for (let y = 0; y < this.currentlySelectedBrandBottles.length; y++) {
        if (this.currentlySelectedBrandBottles[y]['purchased'] == 1 && Math.floor(this.currentlySelectedBrandBottles[y]['Transaction_Id'].split('_')[1] / 90) == this.currentCycleNumber) {
          this.customerpurchased++;

          if (this.currentlySelectedBrandBottles[y]['Bottle_Status'] == "Empty-Dirty" && this.currentlySelectedBrandBottles[y]['Bottle_loc'] == "Return Conveyor" || this.currentlySelectedBrandBottles[y]['Bottle_loc'] == "Reverse Vending Machine") {
            this.returnedGood++;
          }

          if (this.currentlySelectedBrandBottles[y]['Bottle_Status'] == "Damaged-Empty" && this.currentlySelectedBrandBottles[y]['Bottle_loc'] == "Return Conveyor" || this.currentlySelectedBrandBottles[y]['Bottle_loc'] == "Reverse Vending Machine") {
            this.returnedDamaged++;
          }
          if (this.currentlySelectedBrandBottles[y]['Bottle_loc'] == "Supermarket shelf") {
            this.currentlySoldBottles++;
          }
          if (this.currentlySelectedBrandBottles[y]['Bottle_loc'] == `${this.producerCode.split('.')[1]}_Plant`) {
            this.bottles_In_Plant++;
          }
        }

      }

    }
    console.log(this.currentlySoldBottles, this.returnedDamaged, this.returnedGood,)
    this.inventoryForm.patchValue({
      bottles_bought_by_consumers: this.customerpurchased,
      bottles_sold_to_supermarket_prev_cycle: this.currentlySoldBottles,
      bottles_returned_good: this.returnedGood,
      bottles_returned_damaged: this.returnedDamaged,
    });
  }
  private assetIdExists(assetId: string): boolean {
    return this.allAssets.some(
      (asset: any) => asset.AssetId === assetId
    );
  }
  onSubmit(): void {
    if (this.isSubmitting) return;

    if (this.inventoryForm.invalid) {
      this.inventoryForm.markAllAsTouched();
      this.showFormErrors();
      return;
    }

    this.isSubmitting = true;

    if (this.isSupermarketUser()) {
      this.onSupermarketSubmit();
    } else {
      this.onProducerSubmit();
    }
  }

  extractedBottleCode: string = '';
  onProducerSubmit(): void {
    alert("i am starting")
    const formValue = this.inventoryForm.getRawValue();

    this.loginService.createInventory(
      this.producerCode,
      formValue.bottle_type,
      this.cityId,
      formValue
    ).subscribe({
      next: () => {
        // Extract bottle code safely
        this.extractedBottleCode =
          this.getBottleCodeFromCategory(formValue.bottle_type) || '';

        console.log(this.extractedBottleCode);
        // Success alert
        this.alertModal.openModal('New Bottles are created Successfully!');

        // ✅ Correctly pass VALUES, not FormControls
        this.loginService.updateShampooPrice(
          formValue.content_price_per_ml,
          formValue.consumer_discount_percent,
          this.producerCode
        ).subscribe({
          error: err => console.error('Price update failed', err)
        });

        // Generate bottles safely
        const bottlesCount = Number(formValue.bottles_to_produce) || 0;
        const plantName = `${this.producerCode.split('.')[1]}_Plant`;

        for (let i = 0; i < bottlesCount; i++) {
          this.generatebottles(plantName, i + 1);
        }

        // Reset form
        setTimeout(() => {
          this.resetFormToDefaults();
          this.isSubmitting = false;   // 👈 ADD THIS
        }, 1000);
      },
      error: (err) => {
        console.error(err);
        this.alertModal.openModal('Order already placed for this cycle!');
        this.isSubmitting = false;
      }
    });
  }
  producerCashbox = 0;
  supermarketCashbox = 0;
  assetdataset: any[] = [];
  transactioncount = '00000';
  transaction = {
    'TransactionId': '',
    'Amount': '',
    'DebitFacility': '',
    'CreditFacility': '',
    'Purpose': '',
    'Content_Amt': '',
    'Container_Amt': ''

  }
  onSupermarketSubmit(): void {

    if (!this.fullInventoryRecord) {
      alert('Inventory record not loaded');
      this.isSubmitting = false;
      return;
    }

    this.isSubmitting = true;

    const sellCount = Number(this.inventoryForm.value.bottles_to_sell_to_supermarket);
    const bottleType = this.inventoryForm.get('bottle_type')?.value;
    const producerCode = this.inventoryForm.get('producer_code')?.value;
    const cycleNumber = this.inventoryForm.get('cycle_number')?.value;
    const commissionPercent = Number(
      this.inventoryForm.get('supermarket_commission_percent')?.value
    );

    const producerName = producerCode.split(".")[0] + ' Shampoo Producer';
    const producerPlantLoc = producerCode.split(".")[1] + '_Plant';
    const numberOfBottlesOrdered = this.inventoryForm.get('bottles_to_sell_to_supermarket')?.value;

    /* ---------------- CHECK BOTTLE AVAILABILITY ---------------- */

    const bottlesToSell = this.currentlySelectedBrandBottles
      .filter((b: any) => b.Bottle_loc === producerPlantLoc)
      .slice(0, sellCount);
    console.log(bottlesToSell.length, sellCount)
    if (bottlesToSell.length < sellCount) {
      alert('Not enough bottles available');
      this.isSubmitting = false;
      return;
    }

    /* ---------------- STEP 1: Update inventory record ---------------- */

    this.loginService.updateBottlesSoldToSupermarket(
      producerCode,
      bottleType,
      this.loginService.currentuser.CityId,
      cycleNumber,
      sellCount
    ).subscribe({

      next: () => {

        /* ---------------- STEP 2: Update bottle locations ---------------- */

        forkJoin(
          bottlesToSell.map((bottle: any) =>
            this.loginService.updatelocation({
              Bottleloc: 'Supermarket shelf',
              currentbottle: bottle.AssetId
            })
          )
        ).subscribe({

          next: () => {

            /* ---------------- STEP 3: Cashbox calculation ---------------- */

            const commissionAmount = this.totalmrp * (commissionPercent / 100);
            const totalSaleAmount = (this.totalmrp - commissionAmount) * numberOfBottlesOrdered;

            /* ---------------- STEP 4: Update Producer Cashbox ---------------- */

            this.loginService.getFacilitycashbox(producerName).subscribe(pData => {

              const producerCashbox =
                parseInt(pData[0]?.Cashbox || '0') + totalSaleAmount;

              this.loginService.updateFacilitycashbox(
                producerName,
                producerCashbox.toFixed(2).toString()
              ).subscribe({

                next: () => {

                  /* ---------------- STEP 5: Update Supermarket Cashbox ---------------- */

                  this.loginService.getFacilitycashbox('Supermarket Owner')
                    .subscribe(sData => {

                      const supermarketCashbox =
                        parseInt(sData[0]?.Cashbox || '0') - totalSaleAmount;

                      this.loginService.updateFacilitycashbox(
                        'Supermarket Owner',
                        supermarketCashbox.toFixed(2).toString()
                      ).subscribe({

                        next: () => {

                          /* ---------------- STEP 6: CREATE TRANSACTION HERE ---------------- */

                          this.loginService.gettransactions().subscribe(data => {

                            const transactionCount = (data.length + 1)
                              .toString()
                              .padStart(4, '0');

                            this.transaction = {
                              'TransactionId': '',
                              'Amount': '',
                              'DebitFacility': '',
                              'CreditFacility': '',
                              'Purpose': '',
                              'Content_Amt': '',
                              'Container_Amt': ''

                            }

                            this.transaction['TransactionId'] =
                              this.loginService.currentuser.CityId + '_' +
                              this.loginService.currentuser.currentday + '_' +
                              this.loginService.currentuser.CurrentTime + '_' +
                              transactionCount + '_09';

                            this.transaction['Amount'] = (totalSaleAmount.toFixed(2)).toString();

                            this.transaction['Container_Amt'] = String(
                              (this.inventoryForm.get('bottle_price')?.value *
                                numberOfBottlesOrdered).toFixed(2)
                            );

                            this.transaction['Content_Amt'] = String(
                              (this.inventoryForm.get('content_price_per_ml')?.value * 500 *
                                numberOfBottlesOrdered).toFixed(2)
                            );

                            this.transaction['CreditFacility'] = producerName;
                            this.transaction['DebitFacility'] = 'Supermarket Owner';

                            this.transaction['Purpose'] = 'Ordering Shampoo from Producer';

                            this.loginService.createtransaction(this.transaction).subscribe({

                              next: () => {
                                this.alertModal.openModal(
                                  'Order Placed Successfully! Rs.' +
                                  totalSaleAmount +
                                  ' debited from your cashbox'
                                );
                                this.isSubmitting = false;
                              },

                              error: err => {
                                console.error(err);
                                this.isSubmitting = false;
                              }

                            });

                          });

                        },

                        error: err => {
                          console.error(err);
                          this.isSubmitting = false;
                        }

                      });

                    });

                },

                error: err => {
                  console.error(err);
                  this.isSubmitting = false;
                }

              });

            });

          },

          error: err => {
            console.error(err);
            this.isSubmitting = false;
            alert('Failed to update bottle locations');
          }

        });

      },

      error: err => {
        console.error(err);
        this.isSubmitting = false;
        alert('Failed to update inventory');
      }

    });

  }

  resetFormToDefaults(): void {

    this.currentCycleNumber =
      Math.floor(this.loginService.currentuser.currentday / 90);

    this.inventoryForm.reset({
      producer_code: this.producerCode,
      bottle_type: null,
      cycle_number: this.currentCycleNumber + 1,
      previous_cycle_number: this.currentCycleNumber,
      current_total_stock: 0,
      bottles_sold_to_supermarket_prev_cycle: 0,
      bottles_bought_by_consumers: 0,
      bottles_returned_good: 0,
      bottles_returned_damaged: 0,
      manufacturing_day: this.loginService.currentuser.currentday,
      content_price_per_ml: null,
      bottle_price: null,
      total_mrp: 0,
      max_refill_count: 5,
      redeem_value_good: null,
      redeem_value_damaged: null,
      supermarket_commission_percent: null,
      consumer_discount_percent: null,
      bottles_to_produce: 0,
      bottles_to_sell_to_supermarket: 0,
      Bottle_CityId: this.loginService.currentuser.CityId
    });

    // 👇 VERY IMPORTANT
    this.inventoryForm.markAsPristine();
    this.inventoryForm.markAsUntouched();

    if (!this.isSupermarketUser()) {
      this.inventoryForm.get('producer_code')?.disable();
    }

    this.selectedBottleType = '';
    this.customerpurchased = 0;
    this.returnedGood = 0;
    this.returnedDamaged = 0;
    this.currentlySelectedBrandBottles = [];
    this.available_Bottles_In_City = 0;
  }

  hasError(controlName: string, errorCode: string): boolean {
    const control = this.inventoryForm.get(controlName);
    return control ? control.hasError(errorCode) && (control.dirty || control.touched) : false;
  }
  userobj = {
    'login': '1'
  }
  gotocity() {
    this.router.navigate(["maincity"]);
  }
  showFormErrors(): void {
    if (!this.inventoryForm) return;
    console.warn('⚠️ Form is invalid. Details:');
    Object.keys(this.inventoryForm.controls).forEach(key => {
      const control = this.inventoryForm.get(key);
      if (control && control.invalid) {
        console.warn(
          `❌ ${key} =>`,
          control.errors,
          `| Current value: ${control.value}`
        );
      }
    });
  }

  generatebottles(bottleloc: string, i: number): void {
    const newAsset = { ...BASE_ASSET };
    let newId = 0;
    newAsset.Bottle_Code = this.extractedBottleCode;
    newAsset.Content_Code = this.producerCode;
    newAsset.Current_Content_Code = this.producerCode;
    newAsset.Content_Price = this.inventoryForm.value.content_price_per_ml * 500;
    newAsset.Bottle_Price = this.inventoryForm.value.bottle_price;
    newAsset.Redeem_Good = this.inventoryForm.value.redeem_value_good;
    newAsset.Redeem_Damaged = this.inventoryForm.value.redeem_value_damaged;
    newAsset.Discount_RefillB = this.inventoryForm.value.consumer_discount_percent;
    newAsset.DOM = this.inventoryForm.value.manufacturing_day;
    newAsset.Env_Tax_Customer = 5;
    newAsset.Env_Tax_Producer = 3;
    newAsset.Env_Tax_Retailer = 2;
    newAsset.Discard_fine = 20;
    newAsset.Current_SelfRefill_Count = 0;
    newAsset.CategoryCode = 'SB';
    newAsset.Asset_CityId = this.cityId;

    newAsset.Bottle_loc = bottleloc;
    this.selectedBottleType = this.inventoryForm.value.bottle_type;
    if (this.selectedBottleType === 'BRFB' || this.selectedBottleType === 'URFB') {
      newAsset.Current_PlantRefill_Count = 1;
    } else {
      newAsset.Current_PlantRefill_Count = 0;
    }

    newAsset.Latest_Refill_Date = '';

    if (newAsset.Bottle_Code.split(".")[0] != 'UB') {
      newId = this.available_Bottles_In_City + i;
    }
    else if (newAsset.Bottle_Code.split(".")[0] == 'UB') {
      const checkingbottleType = `${newAsset.Bottle_Code.split(".")[0]}id${newAsset.Bottle_Code.split(".")[1]}`;
      const filteredAssets = this.allAssets.filter((asset: any) =>

        asset.AssetId.includes('_' + checkingbottleType + '_')
      );
      newId = filteredAssets.length + i;
    }

    console.log(this.available_Bottles_In_City, this.available_Bottles_In_City + i, i, newId);
    const newAssetId = `${this.cityId}_SB_${newAsset.Bottle_Code.split(".")[0]}id${newAsset.Bottle_Code.split(".")[1]}_${(newId).toString().padStart(5, '0')}`;
    newAsset.AssetId = newAssetId;


    const payload = { ...newAsset };
    // 🔐 FRONTEND DUPLICATE GUARD
    console.log(this.assetIdExists(newAssetId), newAssetId)
    if (this.assetIdExists(newAssetId)) {
      console.warn('⚠️ Duplicate AssetId detected, skipping:', newAssetId);
      return;
    }

    // ✅ Insert only if NOT exists
    console.log(payload)
    this.loginService.createAsset(payload).subscribe({
      next: () => {
        // push locally so next bottles don't clash
        this.allAssets.push({ AssetId: newAssetId });
      },
      error: (error) => {
        console.error('❌ Error creating asset:', error);
      }
    });
  }



}