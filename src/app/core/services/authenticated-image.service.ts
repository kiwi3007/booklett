import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticatedImageService {
  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {}

  /**
   * Load an image with authentication and return it as a blob URL
   * Uses HttpClient so our interceptor attaches X-Api-Key
   */
  async loadImage(url: string): Promise<string | null> {
    const baseUrl = this.apiConfig.getBaseUrlSync();
    if (!baseUrl) return null;

    // Normalize to absolute URL using baseUrl as origin
    let absUrl: string;
    try {
      absUrl = new URL(url, baseUrl).toString();
    } catch {
      return null;
    }

    try {
      const blob = await firstValueFrom(
        this.http.get(absUrl, {
          responseType: 'blob',
          headers: {
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
          }
        })
      );
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('Authenticated image fetch failed', e);
      return null;
    }
  }

  /**
   * Check if a URL needs authentication (case-insensitive match for /mediacover on same origin)
   */
  needsAuthentication(url: string): boolean {
    const baseUrl = this.apiConfig.getBaseUrlSync();
    if (!baseUrl) return false;
    try {
      const u = new URL(url, baseUrl);
      const b = new URL(baseUrl);
      return u.host === b.host && u.pathname.toLowerCase().includes('/mediacover');
    } catch {
      return false;
    }
  }
}
