import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
