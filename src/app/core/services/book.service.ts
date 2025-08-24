import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  constructor(private http: HttpClient) {}

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
   */
  updateBookMonitored(bookId: number, monitored: boolean): Observable<any> {
    return this.http.put<any>(`/api/v1/book/${bookId}`, { monitored });
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
