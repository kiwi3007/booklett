import { Component, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonSegment, IonSegmentButton, ModalController } from '@ionic/angular/standalone';
import { ThemeService } from '../../core/services/theme.service';
import { ServerSettingsPage } from '../server-settings/server-settings.page';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonSegment, IonSegmentButton],
})
export class SettingsPage {
  private modalCtrl = inject(ModalController);

  constructor(private theme: ThemeService) {
    addIcons({ chevronForwardOutline });
  }

  setTheme(mode: 'light' | 'dark' | 'system') { 
    this.theme.setMode(mode); 
  }
  
  setDefaultView(view: 'grid' | 'list') { 
    localStorage.setItem('library:view', view); 
  }

  async openServerSettings() {
    const modal = await this.modalCtrl.create({ 
      component: ServerSettingsPage 
    });
    await modal.present();
  }
}
