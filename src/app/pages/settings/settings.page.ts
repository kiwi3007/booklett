import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonSegment, IonSegmentButton, IonTitle, IonToolbar, IonButton, LoadingController, ModalController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';
import { SystemService } from '../../core/services/system.service';
import { ThemeService } from '../../core/services/theme.service';
import { ServerSettingsPage } from '../server-settings/server-settings.page';
import { PwaUpdateService } from '../../core/services/pwa-update.service';
import { APP_VERSION, BUILD_DATE } from '../../version';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonSegment, IonSegmentButton, IonButton, AsyncPipe, DatePipe],
})
export class SettingsPage {
  private modalCtrl = inject(ModalController);
  private system = inject(SystemService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private pwaUpdateService = inject(PwaUpdateService);

  themeMode$ = this.theme.mode$;
  appVersion = APP_VERSION;
  buildDate = BUILD_DATE;

  constructor(private theme: ThemeService) {
    addIcons({ chevronForwardOutline });
  }

  setTheme(mode: 'light' | 'dark' | 'system') {
    this.theme.setMode(mode);
  }

  setDefaultView(view: 'grid' | 'list') {
    localStorage.setItem('library:view', view);
  }

  setDefaultLibraryType(type: 'authors' | 'books') {
    localStorage.setItem('library:type', type);
  }

  getCurrentLibraryType(): 'authors' | 'books' {
    return (localStorage.getItem('library:type') as 'authors' | 'books') || 'authors';
  }

  getCurrentDefaultView(): 'grid' | 'list' {
    return (localStorage.getItem('library:view') as 'grid' | 'list') || 'grid';
  }

  async openServerSettings() {
    const modal = await this.modalCtrl.create({
      component: ServerSettingsPage,
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      canDismiss: true,
      handleBehavior: 'cycle',
      cssClass: 'server-settings-modal'
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
  
  async checkForUpdates() {
    const toast = await this.toastCtrl.create({
      message: 'Checking for updates...',
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
    
    await this.pwaUpdateService.checkForUpdates();
  }
}
