import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonLabel, IonThumbnail, IonIcon, IonChip, IonSpinner } from '@ionic/angular/standalone';
import { Book } from '../../core/models/book.model';
import { addIcons } from 'ionicons';
import { calendarOutline, starOutline, downloadOutline, checkmarkCircleOutline, cloudDownloadOutline } from 'ionicons/icons';

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
  @Output() bookClick = new EventEmitter<Book>();

  constructor() {
    addIcons({ calendarOutline, starOutline, downloadOutline, checkmarkCircleOutline, cloudDownloadOutline });
  }

  get bookImage(): string {
    // Check for images in the book object or from editions
    const image = this.book.images?.[0] || this.book.editions?.value?.[0]?.images?.[0];
    
    if (image) {
      // Use remoteUrl if available, otherwise use url
      return image.remoteUrl || image.url || 'assets/images/book-placeholder.svg';
    }
    
    return 'assets/images/book-placeholder.svg';
  }

  get releaseYear(): string {
    if (!this.book.releaseDate) return '';
    return new Date(this.book.releaseDate).getFullYear().toString();
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
