import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSearchbar, IonList, IonRefresher, IonRefresherContent, IonChip, IonLabel } from '@ionic/angular/standalone';
import { ActionSheetController, PopoverController } from '@ionic/angular/standalone';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { AuthorService } from '../../core/services/author.service';
import { Author, AuthorSort } from '../../core/models/author.model';
import { AuthorCardComponent } from '../../shared/author-card/author-card.component';
import { AuthorListItemComponent } from '../../shared/author-list-item/author-list-item.component';
import { addIcons } from 'ionicons';
import { swapVerticalOutline, listOutline, gridOutline, bookOutline, filterOutline, arrowUpOutline, arrowDownOutline, checkmark } from 'ionicons/icons';

@Component({
  selector: 'app-library',
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonList,
    IonRefresher,
    IonRefresherContent,
    IonChip,
    IonLabel,
    AuthorCardComponent,
    AuthorListItemComponent
  ],
})
export class LibraryPage {
  view$ = new BehaviorSubject<'grid' | 'list'>('grid');
  search$ = new BehaviorSubject<string>('');
  sort$ = new BehaviorSubject<AuthorSort>('firstName');
  order$ = new BehaviorSubject<'asc' | 'desc'>('asc');

  authors$ = combineLatest([this.search$, this.sort$, this.order$]).pipe(
    switchMap(([search, sort, order]) =>
      this.authorService.query({ search, sort, order })
    ),
    startWith([])
  );

  constructor(
    private authorService: AuthorService,
    private actionSheetCtrl: ActionSheetController,
    private popoverCtrl: PopoverController
  ) {
    addIcons({ swapVerticalOutline, listOutline, gridOutline, bookOutline, filterOutline, arrowUpOutline, arrowDownOutline, checkmark });
    const savedView = (localStorage.getItem('library:view') as 'grid'|'list') ?? 'grid';
    this.view$.next(savedView);
  }

  onSearch(ev: CustomEvent) {
    this.search$.next((ev.detail?.value ?? '') as string);
  }

  setView(v: 'grid' | 'list') { 
    this.view$.next(v); 
  }

  setSort(s: AuthorSort) { 
    this.sort$.next(s); 
  }

  async presentSortOptions() {
    const sortLabels: Record<AuthorSort, string> = {
      monitored: 'Monitored Status',
      firstName: 'First Name',
      lastName: 'Last Name',
      bookCount: 'Number of Books'
    };

    const buttons = Object.entries(sortLabels).map(([value, label]) => ({
      text: label,
      icon: this.sort$.value === value ? 'checkmark' : undefined,
      handler: () => {
        this.setSort(value as AuthorSort);
      }
    }));

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Sort By',
      buttons: [
        ...buttons,
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ],
      cssClass: 'sort-action-sheet'
    });

    await actionSheet.present();
  }

  getSortLabel(): string {
    const labels: Record<AuthorSort, string> = {
      monitored: 'Monitored',
      firstName: 'First Name',
      lastName: 'Last Name',
      bookCount: 'Books'
    };
    return labels[this.sort$.value] || 'Sort';
  }

  toggleOrder() { 
    this.order$.next(this.order$.value === 'asc' ? 'desc' : 'asc'); 
  }

  trackById(_: number, a: Author) { 
    return a.id; 
  }

  toggleMonitored(a: Author) { 
    this.authorService.toggleMonitored(a.id).subscribe(); 
  }

  handleRefresh(event: CustomEvent) {
    this.authorService.refresh().subscribe({
      next: () => {
        (event.target as any).complete();
      },
      error: () => {
        (event.target as any).complete();
      }
    });
  }
}
