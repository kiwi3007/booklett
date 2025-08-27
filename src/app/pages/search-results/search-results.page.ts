import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton,
  IonSearchbar, IonList, IonItem, IonLabel, IonIcon, IonSegment,
  IonSegmentButton, IonSpinner, IonRefresher, IonRefresherContent,
  NavController, ModalController
} from '@ionic/angular/standalone';
import { BehaviorSubject, Subject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, switchMap, map } from 'rxjs/operators';
import { SearchService, SearchResult } from '../../core/services/search.service';
import { AuthorListItemComponent } from '../../shared/author-list-item/author-list-item.component';
import { BookLibraryListItemComponent } from '../../shared/book-library-list-item/book-library-list-item.component';
import { addIcons } from 'ionicons';
import { searchOutline, bookOutline, peopleOutline, albumsOutline } from 'ionicons/icons';
import { AuthorAddModalComponent } from '../../modals/author-add-modal/author-add-modal.component';
import { AuthorService } from '../../core/services/author.service';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.page.html',
  styleUrls: ['./search-results.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton,
    IonSearchbar, IonList, IonItem, IonLabel, IonIcon, IonSegment,
    IonSegmentButton, IonSpinner, IonRefresher, IonRefresherContent,
    AuthorListItemComponent, BookLibraryListItemComponent
  ]
})
export class SearchResultsPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // State management
  searchTerm$ = new BehaviorSubject<string>('');
  filterType$ = new BehaviorSubject<'all' | 'author' | 'book' | 'series'>('all');
  loading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);
  results$ = new BehaviorSubject<SearchResult[]>([]);
  
  // Filtered results based on selected type
  filteredResults$ = combineLatest([this.results$, this.filterType$]).pipe(
    map(([results, filterType]) => {
      if (filterType === 'all') {
        return results;
      }
      return results.filter(result => result.resultType === filterType);
    })
  );

  constructor(
    private route: ActivatedRoute,
    private searchService: SearchService,
    private navCtrl: NavController,
    private modalController: ModalController,
    private authorService: AuthorService
  ) {
    addIcons({ searchOutline, bookOutline, peopleOutline, albumsOutline });
  }

  ngOnInit() {
    // Get initial search term from route param
    const term = this.route.snapshot.paramMap.get('term');
    if (term) {
      this.searchTerm$.next(decodeURIComponent(term));
      this.performSearch(term);
    }

    // Setup search debouncing
    this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      if (term) {
        this.performSearch(term);
      } else {
        this.results$.next([]);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(event: any) {
    const value = event.detail.value || '';
    this.searchTerm$.next(value);
  }

  performSearch(term: string) {
    if (!term?.trim()) {
      this.results$.next([]);
      return;
    }

    this.loading$.next(true);
    this.error$.next(null);

    this.searchService.search(term).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results) => {
        this.results$.next(results);
        this.loading$.next(false);
      },
      error: (error) => {
        console.error('Search error:', error);
        this.error$.next('Failed to search. Please try again.');
        this.loading$.next(false);
      }
    });
  }

  handleRefresh(event: any) {
    const currentTerm = this.searchTerm$.value;
    if (currentTerm) {
      this.performSearch(currentTerm);
    }
    setTimeout(() => {
      event.target?.complete();
    }, 1000);
  }

  setFilterType(type: 'all' | 'author' | 'book' | 'series') {
    this.filterType$.next(type);
  }

  // Transform the raw author data to match the Author interface expected by AuthorListItemComponent
  transformToAuthor(result: SearchResult): any {
    const author = result.author;
    if (!author) return null;

    // Extract names from different possible formats
    let firstName = '';
    let lastName = '';
    
    if (author.authorName) {
      const parts = author.authorName.trim().split(/\s+/);
      if (parts.length > 1) {
        lastName = parts.pop() || '';
        firstName = parts.join(' ');
      } else {
        firstName = author.authorName.trim();
      }
    }

    return {
      id: author.id || author.localAuthorId || author.foreignAuthorId?.replace('hc:', ''),
      firstName,
      lastName,
      monitored: author.monitored || false,
      bookCount: author.statistics?.bookCount || 0,
      availableBookCount: author.statistics?.availableBookCount || 0,
      path: author.path || '',
      overview: author.overview || '',
      images: author.images || []
    };
  }

  // Transform the raw book data to match what BookLibraryListItemComponent expects
  transformToBook(result: SearchResult): any {
    const book = result.book;
    if (!book) return null;

    // Extract author info if available
    let authorName = '';
    if (book.author) {
      const author = book.author;
      if (author.authorName) {
        authorName = author.authorName;
      } else if (author.authorNameLastFirst) {
        // Convert "Last, First" to "First Last"
        const parts = author.authorNameLastFirst.split(',');
        if (parts.length === 2) {
          authorName = `${parts[1].trim()} ${parts[0].trim()}`;
        } else {
          authorName = author.authorNameLastFirst;
        }
      }
    }

    // For search results, the actual ID might be in the parent result object
    // Check for valid numeric ID first, avoiding "0" string which represents no real ID
    let bookId = null;
    if (result.id && result.id !== 0) {
      bookId = result.id;
    } else if (book.id && book.id !== 0) {
      bookId = book.id;
    } else if (book.localBookId && book.localBookId !== "0" && book.localBookId !== 0) {
      bookId = parseInt(book.localBookId, 10);
    }
    // Don't use foreignBookId as the primary ID as it's not a valid numeric ID for the API

    return {
      id: bookId,
      foreignBookId: book.foreignBookId || book.hardcoverBookId,
      title: book.title || book.titleSlug || '',
      releaseDate: book.releaseDate || '',
      monitored: book.monitored || false,
      ebookMonitored: book.ebookMonitored || false,
      audiobookMonitored: book.audiobookMonitored || false,
      overview: book.overview || '',
      images: book.images || [],
      remoteCover: book.remoteCover,
      author: book.author ? {
        value: {
          name: authorName,
          id: book.author.id || book.authorId
        },
        isLoaded: true
      } : undefined
    };
  }

  async onAuthorClick(result: SearchResult) {
    const author = result.author;
    if (author) {
      // Always open the add modal from search results
      // No navigation should happen from the search view
      await this.openAuthorAddModal(result);
    }
  }

  async openAuthorAddModal(result: SearchResult) {
    const modal = await this.modalController.create({
      component: AuthorAddModalComponent,
      componentProps: {
        author: result.author
      },
      breakpoints: [0, 0.5, 0.75, 0.9, 1],
      initialBreakpoint: 0.9,
      expandToScroll: false
    });

    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    if (data) {
      // If author was added successfully, we could refresh the search or navigate
      // For now, just log the success
      console.log('Author add modal closed with data:', data);
    }
  }


  onSeriesClick(result: SearchResult) {
    const series = result.series;
    if (series) {
      // For now, just navigate to the first book's author if available
      // In the future, this could navigate to a series detail page
      console.log('Series clicked:', series);
    }
  }

  trackById(index: number, item: SearchResult): any {
    return item.id || index;
  }
}
