import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { MaincityComponent } from './maincity/maincity.component';
import { HomeComponent } from './home/home.component';
import { AddcityComponent } from './addcity/addcity.component'
import { ReportComponent } from './report/report.component';
import { CityruleComponent } from './cityrule/cityrule.component';
import { BottleInventoryFormComponent } from './bottle-inventory-form/bottle-inventory-form.component';
const routes: Routes = [
  { path: "", redirectTo: "login", pathMatch: "full" },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'addcity', component: AddcityComponent },
  { path: 'maincity', component: MaincityComponent, canActivate: [AuthGuard] },
  { path: 'home', component: HomeComponent },
  { path: 'report', component: ReportComponent },
  { path: 'cityrule', component: CityruleComponent },
  { path: 'bottleinventory', component: BottleInventoryFormComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
