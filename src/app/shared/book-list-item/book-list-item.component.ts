import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonItem, IonLabel, IonThumbnail, IonIcon, IonChip, IonSpinner } from '@ionic/angular/standalone';
import { Book } from '../../core/models/book.model';
import { addIcons } from 'ionicons';
import { calendarOutline, starOutline, downloadOutline, checkmarkCircleOutline, cloudDownloadOutline } from 'ionicons/icons';
import { ApiConfigService } from '../../core/services/api-config.service';
import { getBookCoverUrl } from '../../core/utils/image-url.utils';

@Component({
  selector: 'app-book-list-item',
  templateUrl: './book-list-item.component.html',
  styleUrls: ['./book-list-item.component.scss'],
  standalone: true,
  imports: [CommonModule, IonItem, IonLabel, IonThumbnail, IonIcon, IonChip, IonSpinner]
})
export class BookListItemComponent {
  @Input() book!: Book;
  @Input() isDownloading?: boolean = false;
  @Input() downloadProgress?: number;
  // When true, suppress showing the "Missing" status chip
  @Input() hideMissing: boolean = false;
  // When true, display the author's name under the title
  @Input() showAuthorName: boolean = false;
  @Output() bookClick = new EventEmitter<Book>();

  constructor(private apiConfig: ApiConfigService) {
    addIcons({ calendarOutline, starOutline, downloadOutline, checkmarkCircleOutline, cloudDownloadOutline });
  }

  get bookImage(): string {
    const serverUrl = this.apiConfig.getBaseUrlSync();
    const apiKey = this.apiConfig.getApiKeySync();
    return getBookCoverUrl(this.book, serverUrl, apiKey);
  }

  get releaseYear(): string {
    if (!this.book.releaseDate) return '';
    return new Date(this.book.releaseDate).getFullYear().toString();
  }

  get authorDisplayName(): string | null {
    const b: any = this.book as any;
    if (b.authorName) return b.authorName as string;
    const nameFromAuthor = b.author?.value?.name;
    if (nameFromAuthor) return nameFromAuthor as string;
    const nameFromMeta = b.authorMetadata?.value?.name;
    if (nameFromMeta) return nameFromMeta as string;
    return null;
  }

  get seriesName(): string | null {
    const primarySeries = this.book.seriesLinks?.value?.find(sl => sl.isPrimary);
    return primarySeries?.series?.value?.title || null;
  }

  get seriesPosition(): string | null {
    const primarySeries = this.book.seriesLinks?.value?.find(sl => sl.isPrimary);
    return primarySeries?.position || null;
  }

  get hasFile(): boolean {
    // Check if book has any files
    return this.book.bookFiles?.value?.length > 0 || false;
  }

  get fileInfo(): { format: string; quality: string } | null {
    if (!this.hasFile || !this.book.bookFiles?.value?.[0]) return null;
    
    const file = this.book.bookFiles.value[0];
    // Extract format from the file info - this may need adjustment based on actual API response
    const format = file.quality?.quality?.name || 'Unknown';
    const size = this.formatFileSize(file.size || 0);
    
    return {
      format: format,
      quality: size
    };
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  onBookClick() {
    this.bookClick.emit(this.book);
  }
}
