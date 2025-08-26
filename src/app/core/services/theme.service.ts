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
    const mode = saved ?? 'system';
    this.mode$.next(mode);
    
    // Apply the theme immediately
    if (mode === 'system') {
      this.applySystem();
    } else {
      await this.apply(mode);
    }
    
    // Listen for system theme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', (e) => {
      if (this.mode$.value === 'system') {
        this.apply(e.matches ? 'dark' : 'light');
      }
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
    const isDark = document.body.classList.contains('dark');
    this.setMode(isDark ? 'light' : 'dark');
  }

  private applySystem() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.apply(isDark ? 'dark' : 'light');
  }

  private async apply(mode: 'light' | 'dark') {
    // Remove and add classes to ensure proper application
    if (mode === 'dark') {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }
    
    try {
      await StatusBar.setStyle({ style: mode === 'dark' ? Style.Dark : Style.Light });
    } catch {
      // StatusBar not available in web browser
    }
  }
}
