import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
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
   * @param url The URL of the image to load
   * @returns Observable of the blob URL, or null if loading failed
   */
  loadImage(url: string): Observable<string | null> {
    // Only proceed if we have a base URL and API key
    const baseUrl = this.apiConfig.getBaseUrlSync();
    if (!baseUrl) {
      return of(null);
    }

    // If the URL starts with /mediacover, ensure it has the base URL
    if (url.startsWith('/mediacover')) {
      url = `${baseUrl}${url}`;
    }

    return this.http.get(url, {
      responseType: 'blob'
    }).pipe(
      map(blob => URL.createObjectURL(blob)),
      catchError(() => of(null))
    );
  }

  /**
   * Check if a URL needs authentication
   * @param url The URL to check
   * @returns true if the URL needs authentication
   */
  needsAuthentication(url: string): boolean {
    return url.includes('/mediacover');
  }
}
