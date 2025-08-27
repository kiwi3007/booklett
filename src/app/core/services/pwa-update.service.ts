import { Injectable } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { ToastController } from '@ionic/angular/standalone';
import { filter } from 'rxjs/operators';
import { APP_VERSION } from '../../version';

@Injectable({
  providedIn: 'root'
})
export class PwaUpdateService {
  constructor(
    private swUpdate: SwUpdate,
    private toastController: ToastController
  ) {}

  /**
   * Initialize PWA update checking
   */
  init() {
    if (!this.swUpdate.isEnabled) {
      console.log('Service Worker is not enabled');
      return;
    }

    // Listen for version updates
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionEvent => evt.type === 'VERSION_READY'))
      .subscribe(async evt => {
        console.log('New version available:', evt);
        await this.promptUserToUpdate();
      });

    // Check for updates on app initialization
    this.checkForUpdates();
  }

  /**
   * Manually check for updates
   */
  async checkForUpdates() {
    if (!this.swUpdate.isEnabled) return;
    
    try {
      const updateAvailable = await this.swUpdate.checkForUpdate();
      console.log('Update check result:', updateAvailable);
      console.log('Current app version:', APP_VERSION);
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  /**
   * Prompt user to reload for update
   */
  private async promptUserToUpdate() {
    const toast = await this.toastController.create({
      message: 'A new version of Booklett is available!',
      position: 'bottom',
      cssClass: 'update-toast',
      buttons: [
        {
          text: 'Update',
          handler: () => {
            this.activateUpdate();
          }
        },
        {
          text: 'Later',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }

  /**
   * Activate the update and reload
   */
  private async activateUpdate() {
    try {
      await this.swUpdate.activateUpdate();
      // Force reload to get the new version
      document.location.reload();
    } catch (error) {
      console.error('Error activating update:', error);
    }
  }

  /**
   * Get current version info
   */
  getVersionInfo() {
    return {
      version: APP_VERSION,
      serviceWorkerEnabled: this.swUpdate.isEnabled
    };
  }
}
