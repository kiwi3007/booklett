import { Component, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonSegment, IonSegmentButton, ModalController, ToastController, LoadingController } from '@ionic/angular/standalone';
import { ThemeService } from '../../core/services/theme.service';
import { ServerSettingsPage } from '../server-settings/server-settings.page';
import { SystemService } from '../../core/services/system.service';
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
  private system = inject(SystemService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

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
    
    const { data } = await modal.onWillDismiss();
    if (data?.saved) {
      // Test the connection after saving
      await this.testConnection();
    }
  }
  
  private async testConnection() {
    const loading = await this.loadingCtrl.create({
      message: 'Testing connection...',
      spinner: 'crescent'
    });
    
    await loading.present();
    
    this.system.checkStatus().subscribe(async (status) => {
      await loading.dismiss();
      
      const toast = await this.toastCtrl.create({
        message: status.isConnected 
          ? `Connected to ${status.systemInfo?.instanceName || 'Chaptarr'} v${status.systemInfo?.version || ''}`
          : status.error || 'Connection failed',
        duration: 3000,
        position: 'bottom',
        color: status.isConnected ? 'success' : 'danger'
      });
      await toast.present();
    });
  }
}
