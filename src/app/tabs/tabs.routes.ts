import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'library',
        loadComponent: () =>
          import('../pages/library/library.page').then((m) => m.LibraryPage),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('../pages/calendar/calendar.page').then((m) => m.CalendarPage),
      },
      {
        path: 'wanted',
        loadComponent: () =>
          import('../pages/wanted/wanted.page').then((m) => m.WantedPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../pages/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: '',
        redirectTo: '/tabs/library',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/library',
    pathMatch: 'full',
  },
];
