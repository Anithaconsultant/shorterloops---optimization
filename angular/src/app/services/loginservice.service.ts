import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from '../auth.service';
@Injectable({
  providedIn: 'root'
})
export class LoginserviceService {
  // username = "Admin";
  // password = "Admin@123";
  currentuser = {
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
  // baseurl = "https://dbl.iihs.in/api/";
  baseurl = "http://127.0.0.1:8000/api/";

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

  getAllUsers(): Observable<any> {
    return this.http.get(this.baseurl + 'users/',
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }
  createUser(user: any): Observable<any> {
    const body = { Username: user.Username, email: user.email, Password: user.Password, mobile: user.mobile, wallet: user.wallet, status: user.status, User_cityid: user.User_cityid, Role: user.Role, cartId: user.cartId, gender: user.gender, avatar: user.avatar };

    return this.http.post(this.baseurl + 'signup/', body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }
  createAsset(asset: any): Observable<any> {
    const body = { AssetId: asset.AssetId, Asset_CityId: asset.Asset_CityId, CategoryCode: asset.CategoryCode, Bottle_Code: asset.Bottle_Code, Content_Code: asset.Content_Code, Current_Content_Code: asset.Current_Content_Code, Quantity: asset.Quantity, remQuantity: asset.remQuantity, Units: asset.Units, Bottle_loc: asset.Bottle_loc, Bottle_Status: asset.Bottle_Status, DOM: asset.DOM, Max_Refill_Count: asset.Max_Refill_Count, Current_SelfRefill_Count: asset.Current_SelfRefill_Count, Current_PlantRefill_Count: asset.Current_PlantRefill_Count, Latest_Refill_Date: asset.Latest_Refill_Date, Retirement_Date: asset.Retirement_Date, Retire_Reason: asset.Retire_Reason, Content_Price: asset.Content_Price, Bottle_Price: asset.Bottle_Price, Redeem_Good: asset.Redeem_Good, Redeem_Damaged: asset.Redeem_Damaged, Discount_RefillB: asset.Discount_RefillB, Env_Tax_Customer: asset.Env_Tax_Customer, Discard_fine: asset.Discard_fine, Transaction_Id: asset.Transaction_Id, Transaction_Date: asset.Transaction_Date, Fromfacility: asset.Fromfacility, Tofacility: asset.Tofacility };
    return this.http.post(this.baseurl + 'asset/' + this.currentuser.CityId, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }
  createcity(city: any): Observable<any> {

    const body = { CityName: city.CityName, MayorId: city.MayorId, Clocktickrate: city.Clocktickrate, Status: city.Status, cityavatar: city.cityavatar };
    return this.http.post(this.baseurl + 'addcity/', body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );

  }

  createcityrule(cityrule: any): Observable<any> {
    //console.log(cityrule)
    return this.http.post(this.baseurl + 'addRule/', cityrule,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }

  getCityRules(): Observable<any> {
    //console.log(cityrule)
    return this.http.get(this.baseurl + 'addRule/',
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );

  }


  updatecurrenttime(): Observable<any> {

    return this.http.get(this.baseurl + 'updatetime/' + this.currentuser.CityId, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );

  }
  getAllCities(): Observable<any> {
    return this.http.get(this.baseurl + 'addcity/',
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }
  getAllAssets(): Observable<any> {
    return this.http.get(this.baseurl + 'asset/' + this.currentuser.CityId,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }
  getFilteredCityAssets(cityId: any): Observable<any> {
    return this.http.get(this.baseurl + 'asset/' + cityId,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }

  getthisAssets(currentitem: any): Observable<any> {
    return this.http.get(this.baseurl + 'assets/' + currentitem, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }


  lockthisAsset(currentitem: string): Observable<any> {
    return this.http.post(this.baseurl + 'lockasset/' + currentitem, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }
  unlockthisAsset(currentitem: string): Observable<any> {
    return this.http.post(this.baseurl + 'unlockasset/' + currentitem, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  startthread(): Observable<any> {
    return this.http.post(this.baseurl + 'update_city_threads/', { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }
  updatethisAssets(currentitem: any): Observable<any> {
    const body: { [key: string]: any } = {
      Bottle_loc: currentitem.Bottleloc, Bottle_Status: currentitem.bottlestatus,
      Transaction_Id: currentitem.transactionid, Transaction_Date: currentitem.transactiondate,
      Fromfacility: currentitem.fromfacility,
      Tofacility: currentitem.tofacility,
      Latest_Refill_Date: currentitem.Latest_Refill_Date

    };
    if (currentitem.contentCode !== '') {
      body['Current_Content_Code'] = currentitem.contentCode;
    }

    if (currentitem.purchased !== '') {
      body['purchased'] = currentitem.purchased;
    }
    if (currentitem.dragged !== '') {
      body['dragged'] = currentitem.dragged;
    }


    return this.http.put(this.baseurl + 'assets/' + currentitem.currentitem, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }
  updateConveyorAssets(currentitem: any): Observable<any> {
    const body = {
      Bottle_loc: currentitem.Bottleloc,
      Bottle_Status: currentitem.bottlestatus,
      Fromfacility: currentitem.fromfacility,
      Tofacility: currentitem.Bottleloc,
      Transaction_Id: currentitem.transactionid, Transaction_Date: currentitem.transactiondate,
    };

    return this.http.put(this.baseurl + 'assets/' + currentitem.currentitem, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }

  updatethisAssetQuantity(currentbottle: any): Observable<any> {
    const body: { [key: string]: any } = {
      remQuantity: String(currentbottle.currentQuantity),
      Bottle_Status: currentbottle.Bottle_Status,

    };
    if (currentbottle.Location !== '') {
      body['Bottle_loc'] = currentbottle.Location;
    }
    return this.http.put(this.baseurl + 'assets/' + currentbottle.currentbottle, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }

  updateNoticeonCityTable(body: any): Observable<any> {
    //console.log(body)
    return this.http.put(this.baseurl + 'addcity/' + this.currentuser.CityId, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }

  updateRefillData(bottleDataatRefill: any): Observable<any> {
    const body: { [key: string]: any } = {
      remQuantity: String(bottleDataatRefill.currentQuantity),
      Bottle_Status: bottleDataatRefill.Bottle_Status,
      Current_SelfRefill_Count: bottleDataatRefill.Current_SelfRefill_Count

    };

    return this.http.put(this.baseurl + 'assets/' + bottleDataatRefill.RefillingBottle, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }
  updatedragged(currentbottle: any): Observable<any> {
    const body = {
      Bottle_loc: currentbottle.Bottleloc,
      dragged: currentbottle.dragged,
      purchased: currentbottle.purchased

    };
    return this.http.put(this.baseurl + 'assets/' + currentbottle.currentbottle, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }
  updatelocation(currentbottle: any): Observable<any> {
    const body = {
      Bottle_loc: currentbottle.Bottleloc
    };
    return this.http.put(this.baseurl + 'assets/' + currentbottle.currentbottle, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }
  updateBtlLocationandMakeitRetired(currentbottle: any, bottleId: any): Observable<any> {
    return this.http.put(this.baseurl + 'assets/' + bottleId, currentbottle,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }
  bringBackBrandedBottles(currentbottle: any, assetId: any): Observable<any> {

    return this.http.put(this.baseurl + 'assets/' + assetId, currentbottle,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }
  updateUBContent(currentbottle: any): Observable<any> {
    const body = {
      Content_Code: '',
      Current_Content_Code: '',
      Transaction_Id: '',
      Transaction_Date: '',
      Fromfacility: '',
      Tofacility: '',
      dragged: false,
      purchased: false,
      Bottle_Status: 'Empty-Clean'
    };
    console.log("UB update", currentbottle, body);
    return this.http.put(this.baseurl + 'assets/' + currentbottle, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }
  updateBrandedContent(currentbottle: any): Observable<any> {
    const body = {
      Transaction_Id: '',
      Transaction_Date: '',
      Fromfacility: '',
      Tofacility: '',
      dragged: false,
      purchased: false,
      Bottle_Status: 'Empty-Clean'
    };
    console.log("Branded", currentbottle, body);
    return this.http.put(this.baseurl + 'assets/' + currentbottle, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }
  getcitynames(): Observable<any> {
    console.log(this.currentuser.CityId)
    return this.http.get(this.baseurl + 'getcityname/' + this.currentuser.CityId,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }
  getLastCityRule(): Observable<any> {
    console.log(this.currentuser.CityId)
    return this.http.get(this.baseurl + 'cityrule/' + this.currentuser.CityId,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }
  updateloggeduser(loguser: any): Observable<any> {
    let body;
    body = { login: loguser.login };
    return this.http.put(this.baseurl + 'updateusercity/' + this.currentuser.UserId, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }
  updateuseravatar(avatar: any): Observable<any> {
    let body;
    body = { avatar: avatar };
    return this.http.put(this.baseurl + 'updateusercity/' + this.currentuser.UserId, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }
  leavescity(): Observable<any> {
    let body;
    body = { User_cityid: '', Role: '', cartId: '', avatar: '' };
    return this.http.put(this.baseurl + 'updateusercity/' + this.currentuser.UserId, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }
  updateuser(edituser: any): Observable<any> {
    let body;
    if (edituser.cartId == undefined && edituser.Role == "Mayor") {
      this.currentuser.cartId = edituser.cityid + '_100';
      body = { User_cityid: edituser.cityid, Role: edituser.Role, cartId: edituser.cityid + '_100' };
    }
    else {
      body = { User_cityid: edituser.cityid, Role: edituser.Role, cartId: edituser.cartId };
    }
    console.log(body);
    return this.http.put(this.baseurl + 'updateusercity/' + this.currentuser.UserId, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
  }
  updatewallet(): Observable<any> {
    let body = { wallet: this.currentuser.wallet };

    return this.http.put(this.baseurl + 'updateusercity/' + this.currentuser.UserId, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }
  getallfacility(cityid: any): Observable<any> {
    return this.http.get(this.baseurl + 'getfacility/' + cityid,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }
  updatefacility(facilityobj: any): Observable<any> {
    const body = { Facilityname: facilityobj.facilityname, Owner_id: facilityobj.Ownerid, Facility_cityid: facilityobj.facilityCityId, Owner_status: facilityobj.Owner_status }
    return this.http.put(this.baseurl + 'updatefacility/', body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }
  leavefacility(): Observable<any> {
    const body = { Owner_id: '', Owner_status: 'Inactive' }
    return this.http.put(this.baseurl + 'leavefacility/' + this.currentuser.UserId, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }
  createfacility(firstfacility: any): Observable<any> {
    const body = { Facility_cityid: firstfacility.CityId };
    return this.http.post(this.baseurl + 'facility/' + this.currentuser.UserId, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }

  createtransaction(transaction: any): Observable<any> {
    return this.http.post(this.baseurl + 'cashflow/', transaction,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }

  createInventory(producerCode: string, bottleType: string, cityId: string, data: any) {
    const payload = {
      ...data,
      producer_code: producerCode,
      bottle_type: bottleType,
      Bottle_CityId: cityId,
      day: this.currentuser.currentday.toString()
    };
    console.log("Inventory Payload:", payload); // Debugging line
    return this.http.post(this.baseurl + 'inventory/', payload);
  }


  updateBottlesSoldToSupermarket(producerCode: string, bottleType: string, cityId: string, cycleNumber: number, bottles_to_sell_to_supermarket: number) {
    let params = {
      'producer_code': producerCode,
      'bottle_type': bottleType,
      'Bottle_CityId': cityId.toString(),
      'cycle_number': cycleNumber.toString(),
      'bottles_to_sell_to_supermarket': bottles_to_sell_to_supermarket.toString()
    }


    return this.http.put(this.baseurl + 'inventory/', params, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }


  // get_last_serial_number(producerCode: string, bottleType: string, cityId: string) {
  //   const params = new HttpParams()
  //     .set('producer_code', producerCode)
  //     .set('bottle_type', bottleType)
  //     .set('city_id', cityId.toString());
  //   return this.http.get(this.baseurl + 'get_last_serial/', { params });
  // }
  getInventory(producerCode: string, bottleType: string, cityId: number, cycleNumber?: number) {
    let params = new HttpParams()
      .set('producer_code', producerCode)
      .set('bottle_type', bottleType)
      .set('city_id', cityId.toString());
    if (cycleNumber !== undefined && cycleNumber !== null) {
      params = params.set('cycle_number', cycleNumber.toString());
    }

    return this.http.get<any>(this.baseurl + 'inventory/', { params });
  }



  gettransactions(): Observable<any> {
    return this.http.get(this.baseurl + 'cashflow/',
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }
  getParticularCitytransactions(city: any, user: any): Observable<any> {
    return this.http.get(this.baseurl + 'cashflow/' + city + '/' + user,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }

  getFacilitycashbox(facilityName: any): Observable<any> {
    return this.http.get(this.baseurl + 'getFacilityCashbox/' + facilityName + '/' + this.currentuser.CityId,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }
  updateFacilitycashbox(facilityName: any, cashbox: any): Observable<any> {
    const body = { Cashbox: cashbox };
    return this.http.put(this.baseurl + 'getFacilityCashbox/' + facilityName + '/' + this.currentuser.CityId, body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }
  toggleTimer(timerPaused: boolean): Observable<any> {

    return this.http.post(this.baseurl + 'toggle-timer/' + this.currentuser.CityId, { timer_paused: timerPaused },
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }

calculatePurchase(data: any) {
  return this.http.post<any>(
      this.baseurl + "calculatepurchase/",
      data
  );
}
  sendUserDetails(userDetails: any): Observable<any> {
    // const headers = new getAuthHeaders()()
    //   .set('Content-Type', 'application/json')
    //   .set('Authorization', this.authorizationData)
    //   .set('user-data', JSON.stringify(userDetails));

    const url = this.baseurl + 'receive_user_details/';
    return this.http.post(url, {}, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }
  getAuditLogs(assetId: any) {
    return this.http.get(this.baseurl + 'audit-log/' + assetId + '&' + this.currentuser.CityId,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }
  getAuditLogsuser(user: any) {
    return this.http.get(this.baseurl + 'audit-logs/' + user + '&' + this.currentuser.CityId,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }
  getBottlePrice() {
    return this.http.get(this.baseurl + 'bottleprice/',
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }
  getShampooPrice(): Observable<any> {
    return this.http.get(this.baseurl + 'shampooprice/', {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {

        return throwError(() => new Error('Failed to fetch shampoo price'));
      })
    );
  }

  updateShampooPrice(UnitPrice: any, Discount: any, BottleContent: any): Observable<any> {
    const body = { 'UnitPrice': UnitPrice, 'Discount': Discount, 'BottleContent': BottleContent }
    return this.http.put(this.baseurl + 'shampooprice/', body,
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;
  }

  getFilterOptions(): Observable<any> {
    return this.http.get(this.baseurl + 'filter-options/', {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }
  private handleError(error: any) {
    console.error('API Error:', error);
    return throwError(() => new Error(error.message || 'Server error'));
  }
  getFilteredLogs(filters: any): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params = params.append(key, filters[key]);
      }
    });
    return this.http.get(this.baseurl + 'filter-audit-logs/', { headers: this.getAuthHeaders(), params }).pipe(
      catchError(this.handleError)
    );;
  }

  pauseTimer() {
    return this.http.post(this.baseurl + 'manage-city-timer/' + this.currentuser.CityId, { action: 'pause' },
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;

  }

  resumeTimer() {
    return this.http.post(this.baseurl + 'manage-city-timer/' + this.currentuser.CityId, { action: 'resume' },
      { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );;

  }


  reserveBottle(bottleId: string, cart: string): Observable<any> {
    return this.http.post(this.baseurl + "reservebottle/" + bottleId + "/", { cart: cart }, { headers: this.getAuthHeaders() });
  }
  purchase(data: any): Observable<any> {

    return this.http.post(this.baseurl + 'purchase/',data,{headers: this.getAuthHeaders()}).pipe(catchError(this.handleError));

  }
  returnBottle(data: any): Observable<any> {

    return this.http.post(this.baseurl + 'returnbottle/',data,{headers: this.getAuthHeaders()}).pipe(catchError(this.handleError));

  }
}
