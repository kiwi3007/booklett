import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Book } from '../models/book.model';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface UpcomingOptions {
  mediaType: 'audiobook' | 'ebook';
  daysPast?: number; // include items released in the past N days
  daysAhead?: number; // include items releasing in the next N days
  includeUnmonitored?: boolean; // include authors that are not monitored
  concurrency?: number; // number of concurrent requests when aggregating
}

export interface CalendarItem {
  id: number; // local book id
  title: string;
  authorTitle?: string;
  overview?: string;
  authorId?: number;
  foreignBookId?: string;
  goodreadsBookId?: string;
  goodreadsWorkId?: string;
  titleSlug?: string;
  monitored?: boolean;
  audiobookMonitored?: boolean;
  ebookMonitored?: boolean;
  anyEditionOk?: boolean;
  ratings?: { votes: number; value: number; popularity?: number };
  releaseDate: string;
  pageCount?: number;
  genres?: string; // server returns comma string
  images?: { url: string; coverType: string; extension: string }[];
}

@Injectable({ providedIn: 'root' })
export class CalendarService {
  constructor(private http: HttpClient) {}

  /**
   * Returns upcoming (and recent) releases across all authors.
   * This aggregates by fetching books per author and filtering by relative date offsets.
   */
  getUpcomingReleases(options: UpcomingOptions): Observable<Book[]> {
    const {
      mediaType,
      daysPast = 0,
      daysAhead = 60,
      includeUnmonitored = false,
      concurrency = 6,
    } = options;

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - daysPast);
    const end = new Date(now);
    end.setDate(end.getDate() + daysAhead);
    end.setHours(23, 59, 59, 999);

    return this.getReleasesInRange({ mediaType, start, end, includeUnmonitored });
  }

  /**
   * Returns releases within an absolute date range (inclusive) using the server's calendar API.
   * Filters by mediaType client-side using the audiobookMonitored/ebookMonitored flags.
   */
  getReleasesInRange(params: {
    start: Date;
    end: Date;
    includeUnmonitored?: boolean; // when true, include unmonitored in the server response
    mediaType?: 'audiobook' | 'ebook'; // optional; when omitted, include all items
  }): Observable<Book[]> {
    const { start, end, includeUnmonitored = false, mediaType } = params;

    // Ensure start <= end and clamp time bounds
    let startDate = new Date(start);
    let endDate = new Date(end);
    if (startDate > endDate) {
      const tmp = startDate;
      startDate = endDate;
      endDate = tmp;
    }
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    return this.http
      .get<CalendarItem[]>(`/api/v1/calendar`, {
        params: {
          unmonitored: includeUnmonitored ? 'true' : 'false',
          start: startIso,
          end: endIso,
        },
      })
      .pipe(
        map((items) => {
          // Filter by selected media type using *_Monitored flags when available
          const filtered = mediaType
            ? items.filter((it) => (mediaType === 'audiobook' ? it.audiobookMonitored === true : it.ebookMonitored === true))
            : items;

          // Map to Book model for reuse in list components
          const mapped = filtered.map((it) => this.mapCalendarItemToBook(it));

          // Sort by release date asc
          mapped.sort((a, b) => {
            const da = new Date(a.releaseDate || 0).getTime();
            const db = new Date(b.releaseDate || 0).getTime();
            if (da !== db) return da - db;
            return (a.title || '').localeCompare(b.title || '');
          });

          return mapped;
        }),
        catchError(() => of([] as Book[]))
      );
  }

  private mapCalendarItemToBook(item: CalendarItem): Book {
    const genresArray = item.genres ? item.genres.split(',').map((g) => g.trim()).filter(Boolean) : [];
    const rating = item.ratings || { votes: 0, value: 0 };
    const book: any = {
      id: item.id,
      authorMetadataId: 0,
      foreignBookId: item.foreignBookId || '',
      titleSlug: item.titleSlug || '',
      title: item.title,
      releaseDate: item.releaseDate,
      links: [],
      genres: genresArray,
      relatedBooks: [],
      ratings: rating,
      cleanTitle: (item.title || '').toLowerCase(),
      monitored: item.monitored ?? true,
      anyEditionOk: item.anyEditionOk ?? true,
      lastInfoSync: '',
      added: '',
      addOptions: { addType: 'automatic', searchForNewBook: false },
      authorMetadata: { value: { id: item.authorId || 0 }, isLoaded: false },
      author: { value: { id: item.authorId || 0 }, isLoaded: false },
      authorName: undefined,
      editions: { value: [], isLoaded: false },
      bookFiles: { value: [], isLoaded: true },
      seriesLinks: { value: [], isLoaded: false },
      overview: item.overview || '',
      images: item.images || [],
    };
    return book as Book;
  }
}
