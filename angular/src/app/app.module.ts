import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DatePipe } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from './login/login.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SignupComponent } from './signup/signup.component';
import { MaincityComponent } from './maincity/maincity.component';
import { HomeComponent } from './home/home.component';
import { AddcityComponent } from './addcity/addcity.component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './auth.service';
import { ReportComponent } from './report/report.component';
import { LongPressDragDirective } from './app-longpress.directive';
import { PreventDoubleClickDirective } from './prevent-double-click.directive';
import { HamburgerMenuComponent } from './hamburger-menu/hamburger-menu.component';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { NgChartsModule } from 'ng2-charts';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AlertModalComponent } from './alert-modal/alert-modal.component';
import { ChartComponent } from './report/chart/chart.component';
import { CityruleComponent } from './cityrule/cityrule.component';
import { JwtInterceptor } from './interceptors/jwt.interceptor';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';


import { BottleInventoryFormComponent } from './bottle-inventory-form/bottle-inventory-form.component';
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    MaincityComponent,
    HomeComponent,
    AddcityComponent,
    ReportComponent,
    LongPressDragDirective,
    PreventDoubleClickDirective,
    HamburgerMenuComponent,
    ClickOutsideDirective,
    AlertModalComponent,
    ChartComponent,
    CityruleComponent,
    BottleInventoryFormComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule,
    NgbDropdownModule,
    BrowserAnimationsModule,
    DragDropModule, MatTreeModule, MatButtonModule, MatIconModule, MatSelectModule,
    MatFormFieldModule, NgChartsModule, MatCardModule, MatInputModule
  ],
  providers: [AuthService, { provide: LocationStrategy, useClass: HashLocationStrategy }, { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
