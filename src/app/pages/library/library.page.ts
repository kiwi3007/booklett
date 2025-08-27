import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSearchbar, IonList, IonRefresher, IonRefresherContent, IonChip, IonLabel, IonSelect, IonSelectOption, IonInfiniteScroll, IonInfiniteScrollContent, IonSpinner, IonSegment, IonSegmentButton } from '@ionic/angular/standalone';
import { ActionSheetController, PopoverController } from '@ionic/angular/standalone';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { map, startWith, switchMap, take, skip, distinctUntilChanged } from 'rxjs/operators';
import { AuthorService } from '../../core/services/author.service';
import { BookService } from '../../core/services/book.service';
import { Author, AuthorSort } from '../../core/models/author.model';
import { Book } from '../../core/models/book.model';
import { AuthorCardComponent } from '../../shared/author-card/author-card.component';
import { AuthorListItemComponent } from '../../shared/author-list-item/author-list-item.component';
import { BookCardComponent } from '../../shared/book-card/book-card.component';
import { BookLibraryListItemComponent } from '../../shared/book-library-list-item/book-library-list-item.component';
import { addIcons } from 'ionicons';
import { swapVerticalOutline, listOutline, gridOutline, bookOutline, filterOutline, arrowUpOutline, arrowDownOutline, checkmark, chevronDownOutline, peopleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-library',
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
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
    IonSelect,
    IonSelectOption,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSpinner,
    IonSegment,
    IonSegmentButton,
    AuthorCardComponent,
    AuthorListItemComponent,
    BookCardComponent,
    BookLibraryListItemComponent
  ],
})
export class LibraryPage implements OnDestroy {
  view$ = new BehaviorSubject<'grid' | 'list'>('grid');
  libraryType$ = new BehaviorSubject<'authors' | 'books'>('authors');
  bookMediaType$ = new BehaviorSubject<'audiobook' | 'ebook'>('audiobook');
  search$ = new BehaviorSubject<string>('');
  authorSort$ = new BehaviorSubject<AuthorSort>('firstName');
  bookSort$ = new BehaviorSubject<'title' | 'releaseDate' | 'added' | 'monitored'>('title');
  order$ = new BehaviorSubject<'asc' | 'desc'>('asc');

  // Data for infinite scrolling
  private allAuthors: Author[] = [];
  private allBooks: Book[] = [];
  displayedAuthors: Author[] = [];
  displayedBooks: Book[] = [];
  private readonly chunkSize = 30; // Optimized for better scrolling performance
  private authorsLoaded = false;
  private booksLoaded = false;
  private subscriptions = new Subscription();
  
  // Loading states
  isLoadingAuthors = false;
  isLoadingBooks = false;

  authors$ = combineLatest([this.search$, this.authorSort$, this.order$]).pipe(
    switchMap(([search, sort, order]) => {
      // Ensure authors are loaded before querying
      return this.authorService.loadAuthors().pipe(
        switchMap(() => this.authorService.query({ search, sort, order }))
      );
    })
  );

  books$: Observable<Book[]> = combineLatest([this.search$, this.bookSort$, this.order$, this.bookMediaType$]).pipe(
    switchMap(([search, sort, order, mediaType]) => {
      // First get all authors, then get all books and enrich them
      return combineLatest([
        this.authorService.loadAuthors(),
        this.bookService.getAllBooks(mediaType)
      ]).pipe(
        map(([authors, books]) => {
          // Create a map of authors by ID for quick lookup (convert string ID to number)
          const authorsMap = new Map<number, Author>();
          authors.forEach((author: Author) => {
            const numericId = parseInt(author.id, 10);
            if (!isNaN(numericId)) {
              authorsMap.set(numericId, author);
            }
          });
          
          // Enrich books with author data
          const enrichedBooks: Book[] = books.map((book: Book): Book => {
            if (book.authorId && authorsMap.has(book.authorId)) {
              // Get the matching author
              const matchedAuthor = authorsMap.get(book.authorId)!;
              // Construct the name from firstName and lastName
              const authorName = `${matchedAuthor.firstName} ${matchedAuthor.lastName}`.trim();
              
              // Check if book has an author property before trying to spread it
              if (book.author && book.author.value) {
                // Update the existing author structure
                return {
                  ...book,
                  author: {
                    ...book.author,
                    value: {
                      ...book.author.value,
                      name: authorName
                    },
                    isLoaded: true
                  }
                };
              } else {
                // Create a minimal author structure if it doesn't exist
                return {
                  ...book,
                  author: {
                    value: {
                      id: book.authorId,
                      name: authorName,
                      // Add minimal required properties based on the Author type in Book model
                      authorMetadataId: 0,
                      sortName: authorName,
                      sortNameLastFirst: `${matchedAuthor.lastName}, ${matchedAuthor.firstName}`,
                      monitored: matchedAuthor.monitored,
                      monitorNewItems: 'all',
                      lastInfoSync: new Date().toISOString(),
                      path: matchedAuthor.path || '',
                      rootFolderPath: '',
                      added: new Date().toISOString(),
                      qualityProfileId: 1,
                      metadataProfileId: 1,
                      tags: [],
                      addOptions: {
                        addType: 'automatic',
                        searchForNewBook: false
                      },
                      metadata: { isLoaded: false },
                      qualityProfile: { isLoaded: false },
                      metadataProfile: { isLoaded: false },
                      books: { isLoaded: false },
                      series: { isLoaded: false },
                      name_: authorName
                    },
                    isLoaded: true
                  }
                };
              }
            }
            return book;
          });
          
          // Filter books based on search
          let filteredBooks = enrichedBooks;
          if (search) {
            const searchLower = search.toLowerCase();
            filteredBooks = enrichedBooks.filter(book => 
              book.title?.toLowerCase().includes(searchLower) ||
              book.author?.value?.name?.toLowerCase().includes(searchLower)
            );
          }
          
          // Sort books
          return filteredBooks.sort((a, b) => {
            let compareValue = 0;
            switch(sort) {
              case 'title':
                compareValue = (a.title || '').localeCompare(b.title || '');
                break;
              case 'releaseDate':
                compareValue = new Date(a.releaseDate || 0).getTime() - new Date(b.releaseDate || 0).getTime();
                break;
              case 'added':
                compareValue = new Date(a.added || 0).getTime() - new Date(b.added || 0).getTime();
                break;
              case 'monitored':
                compareValue = (a.monitored ? 1 : 0) - (b.monitored ? 1 : 0);
                break;
            }
            return order === 'asc' ? compareValue : -compareValue;
          });
        })
      );
    })
  );

  constructor(
    private authorService: AuthorService,
    private bookService: BookService,
    private actionSheetCtrl: ActionSheetController,
    private popoverCtrl: PopoverController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ swapVerticalOutline, listOutline, gridOutline, bookOutline, filterOutline, arrowUpOutline, arrowDownOutline, checkmark, chevronDownOutline, peopleOutline });
    const savedView = (localStorage.getItem('library:view') as 'grid'|'list') ?? 'grid';
    this.view$.next(savedView);
    const savedLibraryType = (localStorage.getItem('library:type') as 'authors'|'books') ?? 'authors';
    this.libraryType$.next(savedLibraryType);
    const savedBookMediaType = (localStorage.getItem('library:bookMediaType') as 'audiobook'|'ebook') ?? 'audiobook';
    this.bookMediaType$.next(savedBookMediaType);

    // Initialize data loading
    setTimeout(() => {
      this.initializeData();
    }, 100);

    // Subscribe to library type changes only
    const libraryTypeSub = this.libraryType$.pipe(
      skip(1), // Skip the first emission since we initialize above
      distinctUntilChanged()
    ).subscribe(() => {
      // Reset the infinite scroll when switching library types
      this.resetInfiniteScroll();
      this.initializeData();
    });
    this.subscriptions.add(libraryTypeSub);

    // Subscribe to filter/sort changes separately and skip initial values
    const filterSub = combineLatest([this.search$, this.authorSort$, this.bookSort$, this.order$, this.bookMediaType$]).pipe(
      skip(1) // Skip initial emission to avoid double initialization
    ).subscribe(() => {
      // Reset the infinite scroll and re-initialize when filters change
      this.resetInfiniteScroll();
      this.initializeData();
    });
    this.subscriptions.add(filterSub);
  }

  onSearch(ev: CustomEvent) {
    this.search$.next((ev.detail?.value ?? '') as string);
  }

  setView(v: 'grid' | 'list') { 
    this.view$.next(v); 
    localStorage.setItem('library:view', v);
  }

  setLibraryType(type: 'authors' | 'books') {
    this.libraryType$.next(type);
    localStorage.setItem('library:type', type);
  }

  setBookMediaType(type: 'audiobook' | 'ebook') {
    this.bookMediaType$.next(type);
    localStorage.setItem('library:bookMediaType', type);
  }

  setSort(s: AuthorSort | string) {
    if (this.libraryType$.value === 'authors') {
      this.authorSort$.next(s as AuthorSort);
    } else {
      this.bookSort$.next(s as 'title' | 'releaseDate' | 'added' | 'monitored');
    }
  }

  async presentSortOptions() {
    if (this.libraryType$.value === 'authors') {
      const sortLabels: Record<AuthorSort, string> = {
        monitored: 'Monitored Status',
        firstName: 'First Name',
        lastName: 'Last Name',
        bookCount: 'Number of Books'
      };

      const buttons = Object.entries(sortLabels).map(([value, label]) => ({
        text: label,
        icon: this.authorSort$.value === value ? 'checkmark' : undefined,
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
    } else {
      const sortLabels: Record<string, string> = {
        title: 'Title',
        releaseDate: 'Release Date',
        added: 'Date Added',
        monitored: 'Monitored Status'
      };

      const buttons = Object.entries(sortLabels).map(([value, label]) => ({
        text: label,
        icon: this.bookSort$.value === value ? 'checkmark' : undefined,
        handler: () => {
          this.setSort(value);
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
  }

  getSortLabel(): string {
    if (this.libraryType$.value === 'authors') {
      const labels: Record<AuthorSort, string> = {
        monitored: 'Monitored',
        firstName: 'First Name',
        lastName: 'Last Name',
        bookCount: 'Books'
      };
      return labels[this.authorSort$.value] || 'Sort';
    } else {
      const labels: Record<string, string> = {
        title: 'Title',
        releaseDate: 'Release',
        added: 'Added',
        monitored: 'Monitored'
      };
      return labels[this.bookSort$.value] || 'Sort';
    }
  }

  toggleOrder() { 
    this.order$.next(this.order$.value === 'asc' ? 'desc' : 'asc'); 
  }

  trackById(_: number, item: Author | Book) { 
    return item.id; 
  }

  toggleMonitored(a: Author) { 
    this.authorService.toggleMonitored(a.id).subscribe(); 
  }

  private initializeData() {
    if (this.libraryType$.value === 'authors') {
      this.loadAuthors();
    } else {
      this.loadBooks();
    }
  }

  private loadAuthors() {
    // Show loading indicator
    this.isLoadingAuthors = true;
    
    // Subscribe to authors and load initial chunk
    this.authors$.pipe(
      take(1)
    ).subscribe({
      next: (authors) => {
        this.allAuthors = authors;
        this.displayedAuthors = [];
        this.authorsLoaded = false;
        // Load initial chunk immediately
        if (authors.length > 0) {
          this.loadMoreAuthors();
        }
        this.isLoadingAuthors = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading authors:', error);
        this.isLoadingAuthors = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadBooks() {
    // Show loading indicator
    this.isLoadingBooks = true;
    
    // Subscribe to books and load initial chunk
    this.books$.pipe(
      take(1)
    ).subscribe({
      next: (books) => {
        this.allBooks = books;
        this.displayedBooks = [];
        this.booksLoaded = false;
        // Load initial chunk immediately
        if (books.length > 0) {
          this.loadMoreBooks();
        }
        this.isLoadingBooks = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading books:', error);
        this.isLoadingBooks = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadMoreAuthors() {
    const currentLength = this.displayedAuthors.length;
    const nextChunk = this.allAuthors.slice(currentLength, currentLength + this.chunkSize);
    this.displayedAuthors = [...this.displayedAuthors, ...nextChunk];
    this.authorsLoaded = this.displayedAuthors.length >= this.allAuthors.length;
    this.cdr.detectChanges(); // Force change detection
  }

  private loadMoreBooks() {
    const currentLength = this.displayedBooks.length;
    const nextChunk = this.allBooks.slice(currentLength, currentLength + this.chunkSize);
    this.displayedBooks = [...this.displayedBooks, ...nextChunk];
    this.booksLoaded = this.displayedBooks.length >= this.allBooks.length;
    this.cdr.detectChanges(); // Force change detection
  }

  loadData(event: any) {
    setTimeout(() => {
      if (this.libraryType$.value === 'authors') {
        this.loadMoreAuthors();
        event.target.complete();
        if (this.authorsLoaded) {
          event.target.disabled = true;
        }
      } else {
        this.loadMoreBooks();
        event.target.complete();
        if (this.booksLoaded) {
          event.target.disabled = true;
        }
      }
    }, 100);
  }

  handleRefresh(event: CustomEvent) {
    if (this.libraryType$.value === 'authors') {
      this.authorService.refresh().subscribe({
        next: () => {
          // Force reload the data after refresh
          this.initializeData();
          (event.target as any).complete();
        },
        error: () => {
          (event.target as any).complete();
        }
      });
    } else {
      this.bookService.refreshBooks(this.bookMediaType$.value).subscribe({
        next: () => {
          // Force reload the data after refresh
          this.initializeData();
          (event.target as any).complete();
        },
        error: () => {
          (event.target as any).complete();
        }
      });
    }
  }

  getTotalCount(): number {
    return this.libraryType$.value === 'authors' ? this.allAuthors.length : this.allBooks.length;
  }

  getDisplayedCount(): number {
    return this.libraryType$.value === 'authors' ? this.displayedAuthors.length : this.displayedBooks.length;
  }

  private resetInfiniteScroll() {
    // Find and reset the ion-infinite-scroll element
    const infiniteScroll = document.querySelector('ion-infinite-scroll') as any;
    if (infiniteScroll) {
      infiniteScroll.disabled = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
