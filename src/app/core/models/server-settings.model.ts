export interface ServerSettings {
  url: string;    // e.g., http://127.0.0.1:8787 or https://mydomain.com
  apiKey: string; // required
}

export const DEFAULT_SERVER_SETTINGS: ServerSettings = {
  url: '',
  apiKey: ''
};

export const SERVER_SETTINGS_KEY = 'server-settings';
