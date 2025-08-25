import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  ActionSheetController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowDownOutline, arrowUpOutline, eyeOffOutline, eyeOutline, filterOutline } from 'ionicons/icons';
import { BehaviorSubject, combineLatest, firstValueFrom, map, Observable, switchMap, tap } from 'rxjs';
import { Author } from '../../core/models/author.model';
import { Book } from '../../core/models/book.model';
import { AuthorService } from '../../core/services/author.service';
import { BookDetailModalComponent } from '../../modals/book-detail-modal/book-detail-modal.component';
import { BookListItemComponent } from '../../shared/book-list-item/book-list-item.component';

@Component({
  selector: 'app-author-detail',
  templateUrl: './author-detail.page.html',
  styleUrls: ['./author-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonList,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonChip,
    BookListItemComponent
  ]
})
export class AuthorDetailPage implements OnInit {
  author$?: Observable<Author | undefined>;
  books$?: Observable<Book[]>;
  filteredBooks$?: Observable<Book[]>;
  mediaType: 'audiobook' | 'ebook' = 'audiobook';
  loading = true;
  bioExpanded = false;
  bookFiles: any[] = [];
  downloadQueue: any[] = [];

  // Book search and sort
  bookSearchTerm = '';
  bookSort: 'title' | 'releaseDate' | 'series' | 'rating' = 'title';
  bookOrder: 'asc' | 'desc' = 'asc';
  private booksSubject = new BehaviorSubject<Book[]>([]);

  constructor(
    private route: ActivatedRoute,
    private authorService: AuthorService,
    private actionSheetController: ActionSheetController,
    private sanitizer: DomSanitizer,
    private modalController: ModalController
  ) {
    addIcons({
      eyeOutline,
      eyeOffOutline,
      filterOutline,
      arrowUpOutline,
      arrowDownOutline
    });
  }

  ngOnInit() {
    // Get the author ID from the route and load data
    this.author$ = this.route.params.pipe(
      switchMap(params => {
        const authorId = params['id'];
        return this.authorService.getAuthorById(authorId);
      }),
      tap(() => this.loading = false)
    );

    // Load books and book files for the author
    this.route.params.pipe(
      switchMap(params => {
        const authorId = params['id'];
        return combineLatest([
          this.authorService.getAuthorBooks(authorId, this.mediaType),
          this.authorService.getAuthorBookFiles(authorId, this.mediaType)
        ]);
      })
    ).subscribe(([books, bookFiles]) => {
      // Store book files
      this.bookFiles = bookFiles;

      // Merge book file info into books
      const booksWithFiles = books.map(book => {
        const matchingFiles = bookFiles.filter((f: any) => f.bookId === book.id);
        return {
          ...book,
          bookFiles: { value: matchingFiles, isLoaded: true }
        };
      });

      this.booksSubject.next(booksWithFiles);
    });

    // Set up filtered books observable
    this.filteredBooks$ = this.booksSubject.pipe(
      map(books => this.filterAndSortBooks(books))
    );
  }

  segmentChanged(event: any) {
    this.mediaType = event.detail.value;
    this.bookSearchTerm = ''; // Reset search when changing media type
    // Reload books with the new media type
    this.route.params.pipe(
      switchMap(params => {
        const authorId = params['id'];
        return combineLatest([
          this.authorService.getAuthorBooks(authorId, this.mediaType),
          this.authorService.getAuthorBookFiles(authorId, this.mediaType)
        ]);
      })
    ).subscribe(([books, bookFiles]) => {
      // Store book files
      this.bookFiles = bookFiles;

      // Merge book file info into books
      const booksWithFiles = books.map(book => {
        const matchingFiles = bookFiles.filter((f: any) => f.bookId === book.id);
        return {
          ...book,
          bookFiles: { value: matchingFiles, isLoaded: true }
        };
      });

      this.booksSubject.next(booksWithFiles);
    });
  }

  async toggleMonitored(author: Author) {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}

    this.authorService.toggleMonitored(author.id).subscribe();
  }

  handleRefresh(event: any) {
    // Refresh author, books, and book files
    const authorId = this.route.snapshot.params['id'];

    combineLatest([
      this.authorService.loadAuthors(),
      this.authorService.getAuthorBooks(authorId, this.mediaType),
      this.authorService.getAuthorBookFiles(authorId, this.mediaType)
    ]).subscribe(([authors, books, bookFiles]) => {
      // Store book files
      this.bookFiles = bookFiles;

      // Merge book file info into books
      const booksWithFiles = books.map(book => {
        const matchingFiles = bookFiles.filter((f: any) => f.bookId === book.id);
        return {
          ...book,
          bookFiles: { value: matchingFiles, isLoaded: true }
        };
      });

      this.booksSubject.next(booksWithFiles);
      event.target.complete();
    });
  }

  toggleBio() {
    this.bioExpanded = !this.bioExpanded;
  }

  shouldShowBioButton(overview: string): boolean {
    // Show button if text is longer than approximately 4 lines (roughly 300 characters)
    return overview ? overview.length > 300 : false;
  }

  formatBio(bio: string): SafeHtml {
    if (!bio) return '';

    // First, strip out all HTML tags except line breaks
    let cleanBio = bio
      // Preserve line breaks by converting them to newlines
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<br>/gi, '\n')
      // Strip all other HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      // Trim excessive whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 newlines in a row
      .trim();

    return this.sanitizer.sanitize(1, cleanBio) || cleanBio;
  }

  onSearchBooks(event: any) {
    this.bookSearchTerm = event.detail.value || '';
    // Trigger re-filtering
    this.booksSubject.next(this.booksSubject.value);
  }

  filterAndSortBooks(books: Book[]): Book[] {
    let filtered = [...books];

    // Apply search filter
    if (this.bookSearchTerm) {
      const searchLower = this.bookSearchTerm.toLowerCase();
      filtered = filtered.filter(book => {
        const title = book.title?.toLowerCase() || '';
        const series = book.seriesLinks?.value?.[0]?.series?.value?.title?.toLowerCase() || '';
        return title.includes(searchLower) || series.includes(searchLower);
      });
    }

    // Apply sorting
    const dir = this.bookOrder === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      switch (this.bookSort) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '') * dir;
        case 'releaseDate':
          const dateA = new Date(a.releaseDate || 0).getTime();
          const dateB = new Date(b.releaseDate || 0).getTime();
          return (dateA - dateB) * dir;
        case 'series':
          const seriesA = a.seriesLinks?.value?.[0]?.series?.value?.title || 'zzz';
          const seriesB = b.seriesLinks?.value?.[0]?.series?.value?.title || 'zzz';
          const seriesCompare = seriesA.localeCompare(seriesB);
          if (seriesCompare !== 0) return seriesCompare * dir;
          // If same series, sort by position
          const posA = parseFloat(a.seriesLinks?.value?.[0]?.position || '0');
          const posB = parseFloat(b.seriesLinks?.value?.[0]?.position || '0');
          return (posA - posB) * dir;
        case 'rating':
          const ratingA = a.ratings?.value || 0;
          const ratingB = b.ratings?.value || 0;
          return (ratingA - ratingB) * dir;
        default:
          return 0;
      }
    });

    return filtered;
  }

  async presentBookSortOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Sort Books By',
      cssClass: 'action-sheet-custom',
      buttons: [
        {
          text: 'Title',
          handler: () => {
            this.bookSort = 'title';
            this.booksSubject.next(this.booksSubject.value);
          }
        },
        {
          text: 'Release Date',
          handler: () => {
            this.bookSort = 'releaseDate';
            this.booksSubject.next(this.booksSubject.value);
          }
        },
        {
          text: 'Series',
          handler: () => {
            this.bookSort = 'series';
            this.booksSubject.next(this.booksSubject.value);
          }
        },
        {
          text: 'Rating',
          handler: () => {
            this.bookSort = 'rating';
            this.booksSubject.next(this.booksSubject.value);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  toggleBookOrder() {
    this.bookOrder = this.bookOrder === 'asc' ? 'desc' : 'asc';
    this.booksSubject.next(this.booksSubject.value);
  }

  getBookSortLabel(): string {
    switch (this.bookSort) {
      case 'title': return 'Title';
      case 'releaseDate': return 'Release Date';
      case 'series': return 'Series';
      case 'rating': return 'Rating';
      default: return 'Sort';
    }
  }

  isBookDownloading(bookId: number): boolean {
    // Check if book is in the download queue
    return this.downloadQueue.some((item: any) => item.bookId === bookId);
  }

  getDownloadProgress(bookId: number): number | undefined {
    const queueItem = this.downloadQueue.find((item: any) => item.bookId === bookId);
    return queueItem?.sizeleft && queueItem?.size
      ? Math.round((1 - queueItem.sizeleft / queueItem.size) * 100)
      : undefined;
  }

  async openBookDetail(book: Book) {
    const author = this.author$ ? await firstValueFrom(this.author$) : undefined;
    const modal = await this.modalController.create({
      component: BookDetailModalComponent,
      componentProps: {
        book,
        author
      },
      breakpoints: [0, 0.25, 0.5, 0.75, 1],
      initialBreakpoint: 0.75,
      canDismiss: true,
      handleBehavior: 'cycle',
      cssClass: 'book-detail-modal',
      expandToScroll: false,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    // If the book was updated (e.g., monitored status changed), update our local list
    if (data?.updatedBook) {
      const currentBooks = this.booksSubject.value;
      const updatedBooks = currentBooks.map(b =>
        b.id === data.updatedBook.id ? { ...b, ...data.updatedBook } : b
      );
      this.booksSubject.next(updatedBooks);
    }
  }
}
