import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, inject, isDevMode } from '@angular/core';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { apiInterceptor } from './app/core/interceptors/api.interceptor';
import { imageInterceptor } from './app/core/interceptors/image.interceptor';
import { ServerSettingsService } from './app/core/services/server-settings.service';
import { ThemeService } from './app/core/services/theme.service';
import { provideServiceWorker } from '@angular/service-worker';
import { suppressBrowserExtensionErrors } from './app/core/utils/error-suppressor';

export function initApp() {
  return async () => {
    const theme = inject(ThemeService);
    const server = inject(ServerSettingsService);
    
    // Suppress browser extension errors in production
    suppressBrowserExtensionErrors();
    
    await server.init();
    await theme.init();
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: APP_INITIALIZER, useFactory: initApp, multi: true },
    provideHttpClient(withInterceptors([imageInterceptor, apiInterceptor])),
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }),
  ],
});
