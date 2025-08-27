import { Component, EnvironmentInjector, inject, OnInit } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs, LoadingController, ModalController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bookOutline, calendarOutline, listOutline, settingsOutline } from 'ionicons/icons';
import { ServerSettingsService } from '../core/services/server-settings.service';
import { SystemService } from '../core/services/system.service';
import { ServerSettingsPage } from '../pages/server-settings/server-settings.page';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage implements OnInit {
  public environmentInjector = inject(EnvironmentInjector);
  private modalCtrl = inject(ModalController);
  private server = inject(ServerSettingsService);
  private system = inject(SystemService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  constructor() {
    addIcons({ bookOutline, calendarOutline, listOutline, settingsOutline });
  }

  async ngOnInit() {
    // isConfigured is a computed signal, so we need to call it as a function
    if (!this.server.isConfigured()) {
      await this.showServerSettingsModal();
    } else {
      // Check server connection
      await this.checkServerConnection();
    }
  }

  private async showServerSettingsModal(errorMessage?: string) {
    // Use a reference object to track if the modal can be dismissed
    const allowCloseRef = { value: false };

    const modal = await this.modalCtrl.create({
      component: ServerSettingsPage,
      componentProps: {
        errorMessage,
        // Callback to unlock the modal for dismissal
        onAllowClose: () => { allowCloseRef.value = true; }
      },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      // Use a function that checks the reference value and returns a Promise
      canDismiss: async () => allowCloseRef.value,
      backdropDismiss: false,
      cssClass: 'server-settings-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.saved) {
      // After saving settings, check the connection
      await this.checkServerConnection();
    }
  }

  private async checkServerConnection() {
    const loading = await this.loadingCtrl.create({
      message: 'Connecting to Chaptarr server...',
      spinner: 'crescent'
    });

    await loading.present();

    this.system.checkStatus().subscribe(async (status) => {
      await loading.dismiss();

      if (status.isConnected) {
        // Connection successful
        const toast = await this.toastCtrl.create({
          message: `Connected to ${status.systemInfo?.instanceName || 'Chaptarr'} v${status.systemInfo?.version || ''}`,
          duration: 3000,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();
      } else {
        // Connection failed, show error and open settings
        const toast = await this.toastCtrl.create({
          message: status.error || 'Failed to connect to server',
          duration: 4000,
          position: 'bottom',
          color: 'danger',
          buttons: [
            {
              text: 'Settings',
              handler: () => {
                this.showServerSettingsModal(status.error);
              }
            }
          ]
        });
        await toast.present();

        // Also show the settings modal automatically
        setTimeout(() => {
          this.showServerSettingsModal(status.error);
        }, 1000);
      }
    });
  }
}
