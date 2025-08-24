import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'author/:id',
    loadComponent: () => import('./pages/author-detail/author-detail.page').then( m => m.AuthorDetailPage)
  },
];
