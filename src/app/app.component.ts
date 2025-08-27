import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './core/services/theme.service';
import { PwaUpdateService } from './core/services/pwa-update.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private themeService: ThemeService,
    private pwaUpdateService: PwaUpdateService
  ) {}
  
  async ngOnInit() {
    await this.themeService.init();
    
    // Initialize PWA update checking
    this.pwaUpdateService.init();
    
    // Log version for debugging
    const versionInfo = this.pwaUpdateService.getVersionInfo();
    console.log('App Version:', versionInfo.version);
    console.log('Service Worker Enabled:', versionInfo.serviceWorkerEnabled);
  }
}
