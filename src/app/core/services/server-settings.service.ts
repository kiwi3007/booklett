import { Injectable, computed, signal } from '@angular/core';
import { PrefsService } from './prefs.service';
import { DEFAULT_SERVER_SETTINGS, SERVER_SETTINGS_KEY, ServerSettings } from '../models/server-settings.model';

@Injectable({ providedIn: 'root' })
export class ServerSettingsService {
  private settingsSig = signal<ServerSettings | null>(null);
  readonly settings = computed(() => this.settingsSig());
  readonly isConfigured = computed(() => {
    const s = this.settingsSig();
    return !!(s && s.url && s.apiKey);
  });

  constructor(private prefs: PrefsService) {}

  async init(): Promise<void> {
    const loaded = await this.prefs.get<ServerSettings>(SERVER_SETTINGS_KEY);
    this.settingsSig.set(loaded ?? null);
  }

  validate(s: Partial<ServerSettings>): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const url = (s.url ?? '').trim();
    const apiKey = (s.apiKey ?? '').trim();

    if (!url) {
      issues.push('server URL required');
    } else {
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          issues.push('URL must use http or https protocol');
        }
      } catch {
        issues.push('invalid URL format');
      }
    }

    if (!apiKey) issues.push('api key required');

    return { valid: issues.length === 0, issues };
  }

  async save(settings: ServerSettings): Promise<void> {
    const { valid, issues } = this.validate(settings);
    if (!valid) throw new Error(issues.join(', '));
    await this.prefs.set<ServerSettings>(SERVER_SETTINGS_KEY, settings);
    this.settingsSig.set(settings);
  }

  getBaseUrl(): string | null {
    const s = this.settingsSig();
    if (!s || !s.url) return null;
    // Remove trailing slash if present
    return s.url.replace(/\/$/, '');
  }

  getApiKey(): string | null {
    return this.settingsSig()?.apiKey ?? null;
  }

  reset(): Promise<void> {
    this.settingsSig.set(null);
    return this.prefs.remove(SERVER_SETTINGS_KEY);
  }

  ensureDefaults(): ServerSettings {
    return { ...DEFAULT_SERVER_SETTINGS, ...(this.settingsSig() ?? {}) };
  }
}
