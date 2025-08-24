import { Component, EnvironmentInjector, inject, OnInit } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bookOutline, calendarOutline, listOutline, settingsOutline } from 'ionicons/icons';
import { ServerSettingsService } from '../core/services/server-settings.service';
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

  constructor() {
    addIcons({ bookOutline, calendarOutline, listOutline, settingsOutline });
  }

  async ngOnInit() {
    // isConfigured is a computed signal, so we need to call it as a function
    if (!this.server.isConfigured()) {
      const modal = await this.modalCtrl.create({
        component: ServerSettingsPage,
        canDismiss: false,
        backdropDismiss: false,
      });
      await modal.present();
    }
  }
}
