import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class PrefsService {
  async get<T>(key: string, fallback?: T): Promise<T | undefined> {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) as T : fallback;
  }

  async set<T>(key: string, val: T): Promise<void> {
    await Preferences.set({ key, value: JSON.stringify(val) });
  }

  async getString(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value ?? null;
  }

  async setString(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }
}
