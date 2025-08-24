import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, inject } from '@angular/core';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { apiInterceptor } from './app/core/interceptors/api.interceptor';
import { ServerSettingsService } from './app/core/services/server-settings.service';
import { ThemeService } from './app/core/services/theme.service';

export function initApp() {
  return async () => {
    const theme = inject(ThemeService);
    const server = inject(ServerSettingsService);
    await server.init();
    await theme.init();
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: APP_INITIALIZER, useFactory: initApp, multi: true },
    provideHttpClient(withInterceptors([apiInterceptor])),
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
