import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface SearchResult {
  id: number;
  foreignId?: string;
  author?: any;
  book?: any;
  series?: any;
  // Helper field to identify the type of result
  resultType: 'author' | 'book' | 'series';
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  constructor(private http: HttpClient) {}

  /**
   * Search for authors, books, and series using the Chaptarr API
   * @param term The search term
   * @param provider The search provider (defaults to 'hardcover')
   * @returns Observable array of mixed search results
   */
  search(term: string, provider: string = 'hardcover'): Observable<SearchResult[]> {
    if (!term?.trim()) {
      return of([]);
    }

    return this.http.get<any[]>('/api/v1/search', {
      params: { 
        term: term.trim(),
        provider 
      }
    }).pipe(
      map(results => {
        // The API returns an array of mixed results
        // Each result has an author, book, or series property
        return results.map(result => {
          // Determine the type based on which property exists
          let resultType: 'author' | 'book' | 'series';
          if (result.author) {
            resultType = 'author';
          } else if (result.book) {
            resultType = 'book';
          } else if (result.series) {
            resultType = 'series';
          } else {
            // Default to author if no clear type
            resultType = 'author';
          }

          return {
            ...result,
            resultType
          };
        });
      }),
      catchError(error => {
        console.error('Error searching:', error);
        return of([]);
      })
    );
  }

  /**
   * Helper to extract author data from a search result
   */
  getAuthorFromResult(result: SearchResult): any {
    return result.author;
  }

  /**
   * Helper to extract book data from a search result
   */
  getBookFromResult(result: SearchResult): any {
    return result.book;
  }

  /**
   * Helper to extract series data from a search result
   */
  getSeriesFromResult(result: SearchResult): any {
    return result.series;
  }
}
