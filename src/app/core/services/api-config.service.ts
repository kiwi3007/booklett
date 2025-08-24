import { Injectable, computed, inject } from '@angular/core';
import { ServerSettingsService } from './server-settings.service';

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  private settings = inject(ServerSettingsService);

  readonly baseUrl = computed(() => this.settings.getBaseUrl());
  readonly apiKey = computed(() => this.settings.getApiKey());

  // Synchronous getters for use in interceptors
  getBaseUrlSync(): string | null { 
    return this.settings.getBaseUrl(); 
  }
  
  getApiKeySync(): string | null { 
    return this.settings.getApiKey(); 
  }
}
