import { Component } from '@angular/core';

import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'angular';

  constructor(private http: HttpClient) { }

  // ngOnInit() {
  //   this.http.get('http://127.0.0.1:8000/api/get-csrf/', {
  //     withCredentials: true
  //   }).subscribe();
  // }
}
