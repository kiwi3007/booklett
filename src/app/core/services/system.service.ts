import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface SystemStatus {
  appName: string;
  instanceName: string;
  version: string;
  buildTime: string;
  isDebug: boolean;
  isProduction: boolean;
  isAdmin: boolean;
  isUserInteractive: boolean;
  startupPath: string;
  appData: string;
  osName: string;
  osVersion: string;
  isNetCore: boolean;
  isLinux: boolean;
  isOsx: boolean;
  isWindows: boolean;
  isDocker: boolean;
  mode: string;
  branch: string;
  databaseType: string;
  databaseVersion: string;
  authentication: string;
  migrationVersion: number;
  urlBase: string;
  runtimeVersion: string;
  runtimeName: string;
  startTime: string;
  packageUpdateMechanism: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  error?: string;
  systemInfo?: SystemStatus;
}

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  constructor(private http: HttpClient) {}

  /**
   * Check the system status to verify server connection
   */
  checkStatus(options?: { preferStatusText?: boolean }): Observable<ConnectionStatus> {
    return this.http.get<SystemStatus>('/api/v1/system/status').pipe(
      map(status => ({
        isConnected: true,
        systemInfo: status
      })),
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to connect to Chaptarr server:', error);
        
        let errorMessage: string;
        
        if (options?.preferStatusText) {
          // Use the HTTP status text for more specific error messages
          // Try multiple sources for the error message
          if (error?.statusText && error.statusText !== 'OK' && error.statusText !== 'Unknown Error') {
            errorMessage = error.statusText;
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          } else {
            // Fallback to status code descriptions
            switch (error.status) {
              case 401:
                errorMessage = 'Unauthorized - Invalid API Key';
                break;
              case 404:
                errorMessage = 'Not Found - Invalid Server URL';
                break;
              case 0:
                errorMessage = 'Server Unreachable';
                break;
              default:
                errorMessage = `HTTP Error ${error.status}`;
            }
          }
        } else {
          // Use the existing user-friendly messages
          errorMessage = 'Unable to connect to server';
          
          if (error.status === 401) {
            errorMessage = 'Invalid API key';
          } else if (error.status === 0) {
            errorMessage = 'Server is unreachable. Please check your server URL.';
          } else if (error.status === 404) {
            errorMessage = 'Invalid server URL or API endpoint not found';
          } else if (error.message) {
            errorMessage = error.message;
          }
        }
        
        return of({
          isConnected: false,
          error: errorMessage
        });
      })
    );
  }

  /**
   * Get queue status
   */
  getQueueStatus(): Observable<any> {
    return this.http.get('/api/v1/queue/status');
  }

  /**
   * Get health status
   */
  getHealth(): Observable<any[]> {
    return this.http.get<any[]>('/api/v1/health');
  }
}
