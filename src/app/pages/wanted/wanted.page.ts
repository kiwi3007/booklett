import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-wanted',
  templateUrl: './wanted.page.html',
  styleUrls: ['./wanted.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class WantedPage {
  constructor() {}
}
