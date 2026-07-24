import { Injectable } from '@angular/core';
import { LoginserviceService } from './loginservice.service';
import { BehaviorSubject, Subject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class SharedServiceService {
  private auditPlasticVideoModalSubject = new Subject<void>();
  auditPlasticVideoModal$ = this.auditPlasticVideoModalSubject.asObservable();
  private auditBottleCleaningVideoModalSubject = new Subject<void>();
  auditBottleCleaningVideoModal$ = this.auditBottleCleaningVideoModalSubject.asObservable();
  private auditBottleMakingVideoModalSubject = new Subject<void>();
  auditBottleMakingVideoModal$ = this.auditBottleMakingVideoModalSubject.asObservable();
  private rungarbagetruckSubject = new Subject<void>();
  rungarbagetruck$ = this.rungarbagetruckSubject.asObservable();
  private loadPlantBottlesSubject = new Subject<void>();
  loadPlantBottles$ = this.loadPlantBottlesSubject.asObservable();
  private openModalSource = new Subject<void>();
  openModal$ = this.openModalSource.asObservable();
  private switchYesOrNoSource = new BehaviorSubject<number>(0);
  switchYesOrNo$ = this.switchYesOrNoSource.asObservable();

  private showWarningSubject = new BehaviorSubject<boolean>(false);
  showWarning$ = this.showWarningSubject.asObservable();

 
  private playWarningSubject = new BehaviorSubject<boolean>(false);
  playWarning$ = this.playWarningSubject.asObservable();

 
  currentrole = "";
  constructor(private logser: LoginserviceService) {
    this.currentrole = this.logser.currentuser.Role;
  }

  setSwitchYesOrNo(value: number) {
    this.switchYesOrNoSource.next(value);
  }

  open_Audit_bottleCleaning_Video() {
    this.auditBottleCleaningVideoModalSubject.next();
  }
  open_Audit_bottleMaking_Video() {
    this.auditBottleMakingVideoModalSubject.next();
  }

  open_Audit_plastic_Video(): void {
    this.auditPlasticVideoModalSubject.next();
  }
  rungarbagetruck(): void {
    this.rungarbagetruckSubject.next();
  }
  loadPlantBottles(): void {
    this.loadPlantBottlesSubject.next();
  }
  setShowWarning(value: boolean) {
    this.showWarningSubject.next(value);
  }
  setPlayWarning(value: boolean) {
    this.playWarningSubject.next(value);
  }
}


