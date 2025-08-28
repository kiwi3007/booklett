import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticatedImageService {
  private blobCache = new Map<string, string>(); // url -> blobUrl
  private inFlight = new Map<string, Promise<string | null>>(); // url -> promise

  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {}

  /**
   * Load an image with authentication and return it as a blob URL (cached)
   */
  async loadImage(url: string): Promise<string | null> {
    const baseUrl = this.apiConfig.getBaseUrlSync();
    if (!baseUrl) return null;

    // Normalize to absolute URL using baseUrl as origin
    // Transform MediaCover URLs to use api/v1 and apikey param
    let absUrl: string;
    try {
      const mediaMatch = /^\/?(MediaCover\/.*)$/i.exec(url);
      if (mediaMatch) {
        // Get the MediaCover path part
        const mediaPath = mediaMatch[1];
        const apiKey = this.apiConfig.getApiKeySync();
        if (!apiKey) return null;

        // Create the transformed URL
        // If baseUrl ends with /, remove it for consistent joining
        const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const u = new URL(`${base}/api/v1/${mediaPath}`);
        u.searchParams.append('apikey', apiKey);
        absUrl = u.toString();
      } else {
        // Non-MediaCover URL, just resolve against base
        absUrl = new URL(url, baseUrl).toString();
      }
    } catch {
      return null;
    }

    // Serve from cache if available
    const cached = this.blobCache.get(absUrl);
    if (cached) return cached;

    // Coalesce parallel requests
    const existing = this.inFlight.get(absUrl);
    if (existing) return existing;

    const p = (async () => {
      try {
        const blob = await firstValueFrom(
          this.http.get(absUrl, { responseType: 'blob' })
        );
        const blobUrl = URL.createObjectURL(blob);
        this.blobCache.set(absUrl, blobUrl);
        return blobUrl;
      } catch (e) {
        console.error('Authenticated image fetch failed', e);
        return null;
      } finally {
        this.inFlight.delete(absUrl);
      }
    })();

    this.inFlight.set(absUrl, p);
    return p;
  }

  /**
   * Check if a URL needs authentication (case-insensitive match for /mediacover on same origin)
   */
  needsAuthentication(url: string): boolean {
    return /^\/?(MediaCover\/.*)$/i.test(url);
  }
}
