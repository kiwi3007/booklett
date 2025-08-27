import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Author, AuthorSort, ChaptarrAuthor, mapChaptarrAuthorToAuthor } from '../models/author.model';
import { Book, mapApiBookToBook } from '../models/book.model';

@Injectable({ providedIn: 'root' })
export class AuthorService {
  private readonly authorsSubject = new BehaviorSubject<Author[]>([]);
  readonly authors$ = this.authorsSubject.asObservable();
  private isLoading = false;
  private hasLoadedInitially = false;

  constructor(private http: HttpClient) {
    // Don't auto-load on service initialization anymore
    // Let components request when needed
  }

  /**
   * Load authors from the Chaptarr API with caching
   * Only fetches from API if not cached or force refresh is requested
   */
  loadAuthors(forceRefresh: boolean = false): Observable<Author[]> {
    // If we have cached data and not forcing refresh, return cached data
    if (!forceRefresh && this.hasLoadedInitially && this.authorsSubject.value.length > 0) {
      return of(this.authorsSubject.value);
    }
    
    // If already loading and not forcing refresh, return the current observable
    if (this.isLoading && !forceRefresh) {
      return this.authors$;
    }

    this.isLoading = true;
    
    // Make the API call to /api/v1/author
    // The HTTP interceptor will add the base URL and API key
    return this.http.get<ChaptarrAuthor[]>('/api/v1/author').pipe(
      map(chaptarrAuthors => {
        // Convert API response to app model
        const authors = chaptarrAuthors.map(mapChaptarrAuthorToAuthor);
        return authors;
      }),
      tap(authors => {
        // Update the BehaviorSubject with the fetched data
        this.authorsSubject.next(authors);
        this.isLoading = false;
        this.hasLoadedInitially = true;
      }),
      catchError(error => {
        console.error('Error loading authors:', error);
        this.isLoading = false;
        // Don't mark as loaded on error so it will retry
        this.hasLoadedInitially = false;
        // Return empty array on error
        return of([]);
      })
    );
  }

  /**
   * Refresh the authors list from the API (forces reload)
   */
  refresh(): Observable<Author[]> {
    return this.loadAuthors(true);
  }
  
  /**
   * Get cached authors synchronously
   */
  getCachedAuthors(): Author[] {
    return this.authorsSubject.value;
  }
  
  /**
   * Clear the authors cache
   */
  clearAuthorsCache(): void {
    this.authorsSubject.next([]);
    this.hasLoadedInitially = false;
  }

  /**
   * Toggle the monitored status of an author
   * @param id Author ID
   */
  toggleMonitored(id: string): Observable<any> {
    // Find the author
    const author = this.authorsSubject.value.find(a => a.id === id);
    if (!author) {
      return of(null);
    }

    // Update locally first for immediate UI response
    const updatedAuthors = this.authorsSubject.value.map(a => 
      a.id === id ? { ...a, monitored: !a.monitored } : a
    );
    this.authorsSubject.next(updatedAuthors);

    // Make API call to update on server
    // The Chaptarr API uses PUT /api/v1/author/{id} to update
    const updatedMonitored = !author.monitored;
    
    return this.http.put(`/api/v1/author/${id}`, { 
      monitored: updatedMonitored 
    }).pipe(
      catchError(error => {
        console.error('Error updating author monitored status:', error);
        // Revert the local change on error
        const revertedAuthors = this.authorsSubject.value.map(a => 
          a.id === id ? { ...a, monitored: author.monitored } : a
        );
        this.authorsSubject.next(revertedAuthors);
        return of(null);
      })
    );
  }

  query(params: {
    search?: string;
    sort?: AuthorSort;
    order?: 'asc' | 'desc';
    monitored?: boolean | 'all';
  } = {}): Observable<Author[]> {
    const { search = '', sort = 'firstName', order = 'asc', monitored = 'all' } = params;
    return this.authors$.pipe(
      map(list => {
        const q = search.trim().toLowerCase();
        let filtered = list.filter(a =>
          (monitored === 'all' ? true : a.monitored === monitored) &&
          (`${a.firstName} ${a.lastName}`.toLowerCase().includes(q))
        );

        const dir = order === 'asc' ? 1 : -1;

        filtered.sort((a, b) => {
          switch (sort) {
            case 'monitored': return (Number(b.monitored) - Number(a.monitored)) * dir;
            case 'firstName': return a.firstName.localeCompare(b.firstName) * dir;
            case 'lastName': return a.lastName.localeCompare(b.lastName) * dir;
            case 'bookCount': return (a.bookCount - b.bookCount) * dir;
            default: return 0;
          }
        });

        return filtered;
      })
    );
  }

  /**
   * Get an author by ID
   * @param id Author ID
   */
  getAuthorById(id: string): Observable<Author | undefined> {
    // First check if we have the author in our local cache
    const cachedAuthor = this.authorsSubject.value.find(a => a.id === id);
    if (cachedAuthor) {
      return of(cachedAuthor);
    }

    // If not in cache, we need to load all authors first
    // This is because the API doesn't have a single author endpoint
    return this.loadAuthors().pipe(
      map(authors => authors.find(a => a.id === id))
    );
  }

  /**
   * Get books for an author
   * @param authorId Author ID
   * @param mediaType Type of media (audiobook or ebook)
   */
  getAuthorBooks(authorId: string, mediaType: 'audiobook' | 'ebook' = 'audiobook'): Observable<Book[]> {
    return this.http.get<any[]>(`/api/v1/book?authorId=${authorId}&mediaType=${mediaType}`).pipe(
      map(apiBooks => apiBooks.map(mapApiBookToBook)),
      catchError(error => {
        console.error('Error loading author books:', error);
        return of([]);
      })
    );
  }

  /**
   * Get series for an author
   * @param authorId Author ID
   * @param mediaType Type of media (audiobook or ebook)
   */
  getAuthorSeries(authorId: string, mediaType: 'audiobook' | 'ebook' = 'audiobook'): Observable<any[]> {
    return this.http.get<any[]>(`/api/v1/series?authorId=${authorId}&mediaType=${mediaType}`).pipe(
      catchError(error => {
        console.error('Error loading author series:', error);
        return of([]);
      })
    );
  }

  /**
   * Get book files for an author
   * @param authorId Author ID
   * @param mediaType Type of media (audiobook or ebook)
   */
  getAuthorBookFiles(authorId: string, mediaType: 'audiobook' | 'ebook' = 'audiobook'): Observable<any[]> {
    return this.http.get<any[]>(`/api/v1/bookFile?authorId=${authorId}&mediaType=${mediaType}`).pipe(
      catchError(error => {
        console.error('Error loading author book files:', error);
        return of([]);
      })
    );
  }

  /**
   * Toggle monitoring status for a book
   * @param bookId Book ID
   * @param monitored New monitored status
   */
  updateBookMonitored(bookId: number, monitored: boolean): Observable<any> {
    return this.http.put(`/api/v1/book/${bookId}`, { monitored }).pipe(
      catchError(error => {
        console.error('Error updating book monitored status:', error);
        return of(null);
      })
    );
  }
}
