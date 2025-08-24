import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StatusBar, Style } from '@capacitor/status-bar';
import { PrefsService } from './prefs.service';

type Mode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'theme';
  readonly mode$ = new BehaviorSubject<Mode>('system');

  constructor(private prefs: PrefsService) {}

  async init() {
    const saved = (await this.prefs.getString(this.storageKey)) as Mode | null;
    await this.setMode(saved ?? 'system');
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      if (this.mode$.value === 'system') this.applySystem();
    });
  }

  async setMode(mode: Mode) {
    this.mode$.next(mode);
    if (mode === 'system') {
      this.applySystem();
    } else {
      this.apply(mode);
    }
    await this.prefs.setString(this.storageKey, mode);
  }

  toggleDark() {
    const isDark = document.documentElement.classList.contains('dark');
    this.setMode(isDark ? 'light' : 'dark');
  }

  private applySystem() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.apply(isDark ? 'dark' : 'light');
  }

  private async apply(mode: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    try {
      await StatusBar.setStyle({ style: mode === 'dark' ? Style.Dark : Style.Light });
    } catch {}
  }
}
