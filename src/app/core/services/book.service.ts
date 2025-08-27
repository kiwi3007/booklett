import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Book } from '../models/book.model';

export interface BookFile {
  id: number;
  path: string;
  size: number;
  dateAdded: string;
  quality: {
    quality: {
      id: number;
      name: string;
    };
  };
  mediaInfo?: {
    audioBitrate: string;
    audioChannels: number;
    audioCodec: string;
    audioDuration: string;
  };
}

export interface BookHistory {
  id: number;
  bookId: number;
  sourceTitle: string;
  date: string;
  eventType: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  // Separate caches for audiobooks and ebooks
  private readonly audiobooksCache$ = new BehaviorSubject<Book[] | null>(null);
  private readonly ebooksCache$ = new BehaviorSubject<Book[] | null>(null);
  private isLoadingAudiobooks = false;
  private isLoadingEbooks = false;
  
  constructor(private http: HttpClient) {}

  /**
   * Get the paginated wanted/missing list
   * Mirrors calls like /api/v1/wanted/missing?page=2&pageSize=20&sortDirection=descending&sortKey=releaseDate&includeAuthor=true&monitored=true
   */
  getWantedMissing(page: number, pageSize: number): Observable<{
    page: number;
    pageSize: number;
    sortKey: string;
    sortDirection: string;
    totalRecords: number;
    records: any[];
  }> {
    return this.http.get<{
      page: number;
      pageSize: number;
      sortKey: string;
      sortDirection: string;
      totalRecords: number;
      records: any[];
    }>(`/api/v1/wanted/missing`, {
      params: {
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortDirection: 'descending',
        sortKey: 'releaseDate',
        includeAuthor: 'true',
        monitored: 'true'
      }
    });
  }

  /**
   * Get all books - with caching
   * Only fetches from API if not cached or force refresh is requested
   * @param mediaType - 'audiobook' or 'ebook'
   * @param forceRefresh - Force refresh from API
   */
  getAllBooks(mediaType: 'audiobook' | 'ebook' = 'audiobook', forceRefresh: boolean = false): Observable<Book[]> {
    // Select the appropriate cache based on media type
    const cache$ = mediaType === 'audiobook' ? this.audiobooksCache$ : this.ebooksCache$;
    const isLoading = mediaType === 'audiobook' ? this.isLoadingAudiobooks : this.isLoadingEbooks;
    
    // If we have cached data and not forcing refresh, return cached data
    if (!forceRefresh && cache$.value !== null) {
      return of(cache$.value);
    }
    
    // If already loading, return empty array
    if (isLoading && !forceRefresh) {
      return of([]);
    }
    
    // Set loading state
    if (mediaType === 'audiobook') {
      this.isLoadingAudiobooks = true;
    } else {
      this.isLoadingEbooks = true;
    }
    
    return this.http.get<Book[]>(`/api/v1/book`, {
      params: { mediaType }
    }).pipe(
      tap(books => {
        cache$.next(books);
        if (mediaType === 'audiobook') {
          this.isLoadingAudiobooks = false;
        } else {
          this.isLoadingEbooks = false;
        }
      }),
      catchError(error => {
        console.error(`Error loading ${mediaType}s:`, error);
        if (mediaType === 'audiobook') {
          this.isLoadingAudiobooks = false;
        } else {
          this.isLoadingEbooks = false;
        }
        // Return empty array on error but don't cache it
        return of([]);
      })
    );
  }
  
  /**
   * Force refresh books from the API
   * @param mediaType - 'audiobook' or 'ebook'
   */
  refreshBooks(mediaType: 'audiobook' | 'ebook' = 'audiobook'): Observable<Book[]> {
    return this.getAllBooks(mediaType, true);
  }
  
  /**
   * Get cached books synchronously (may be null if not loaded yet)
   * @param mediaType - 'audiobook' or 'ebook'
   */
  getCachedBooks(mediaType: 'audiobook' | 'ebook' = 'audiobook'): Book[] | null {
    const cache$ = mediaType === 'audiobook' ? this.audiobooksCache$ : this.ebooksCache$;
    return cache$.value;
  }
  
  /**
   * Clear the books cache
   * @param mediaType - Optional, if not provided clears both caches
   */
  clearBooksCache(mediaType?: 'audiobook' | 'ebook'): void {
    if (!mediaType || mediaType === 'audiobook') {
      this.audiobooksCache$.next(null);
    }
    if (!mediaType || mediaType === 'ebook') {
      this.ebooksCache$.next(null);
    }
  }

  /**
   * Get books for a specific author
   */
  getBooksByAuthor(authorId: number, mediaType: string = 'audiobook'): Observable<any[]> {
    return this.http.get<any[]>(`/api/v1/book`, {
      params: {
        authorId: authorId.toString(),
        mediaType
      }
    });
  }

  /**
   * Get a single book by ID
   */
  getBook(bookId: number): Observable<any> {
    return this.http.get<any>(`/api/v1/book/${bookId}`);
  }

  /**
   * Update a book's monitored status
   * Uses the /api/v1/book/monitor endpoint with bookIds array
   */
  updateBookMonitored(bookId: number, monitored: boolean): Observable<any> {
    // The API expects an array of bookIds and a monitored flag
    return this.http.put<any[]>(`/api/v1/book/monitor`, { 
      bookIds: [bookId], 
      monitored 
    }).pipe(
      // Return the first book from the array response
      map(books => books && books.length > 0 ? books[0] : null),
      catchError(error => {
        console.error('Error updating book monitored status:', error);
        return of(null);
      })
    );
  }

  /**
   * Update multiple books
   */
  updateBooks(books: any[]): Observable<any[]> {
    return this.http.put<any[]>(`/api/v1/book/bulk`, books);
  }

  /**
   * Get book files for a specific book
   */
  getBookFiles(bookId: number): Observable<BookFile[]> {
    return this.http.get<BookFile[]>(`/api/v1/bookFile`, {
      params: {
        bookId: bookId.toString()
      }
    });
  }

  /**
   * Get history for a specific book
   */
  getBookHistory(bookId: number): Observable<BookHistory[]> {
    return this.http.get<BookHistory[]>(`/api/v1/history`, {
      params: {
        bookId: bookId.toString(),
        sortKey: 'date',
        sortDirection: 'descending'
      }
    });
  }

  /**
   * Search for books
   */
  searchBooks(term: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/v1/book/lookup`, {
      params: {
        term
      }
    });
  }

  /**
   * Get book queue details
   */
  getBookQueueDetails(bookId: number): Observable<any[]> {
    return this.http.get<any[]>(`/api/v1/queue/details`, {
      params: {
        bookId: bookId.toString()
      }
    });
  }

  /**
   * Get queue details for multiple books in a single request (uses bookIds param).
   */
  getQueueDetailsByBookIds(bookIds: number[]): Observable<any[]> {
    if (!bookIds || bookIds.length === 0) return new Observable<any[]>((sub) => { sub.next([]); sub.complete(); });
    let params = new HttpParams();
    // Server accepts repeated bookIds parameters, e.g., ?bookIds=1&bookIds=2
    for (const id of bookIds) {
      params = params.append('bookIds', id.toString());
    }
    return this.http.get<any[]>(`/api/v1/queue/details`, { params });
  }

  /**
   * Monitor or unmonitor all books in a series
   */
  updateSeriesMonitoring(seriesId: number, monitored: boolean): Observable<any> {
    return this.http.put<any>(`/api/v1/series/${seriesId}`, { monitored });
  }

  /**
   * Get series for an author
   */
  getSeriesByAuthor(authorId: number, mediaType: string = 'audiobook'): Observable<any[]> {
    return this.http.get<any[]>(`/api/v1/series`, {
      params: {
        authorId: authorId.toString(),
        mediaType
      }
    });
  }
}
