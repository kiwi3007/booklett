import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  calendarOutline,
  checkmarkCircle,
  close,
  documentTextOutline,
  folderOpenOutline,
  libraryOutline,
  star,
  time as timeIcon,
  timeOutline
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { ApiConfigService } from '../../core/services/api-config.service';
import { BookFile, BookHistory, BookService } from '../../core/services/book.service';
import { getBookCoverUrl } from '../../core/utils/image-url.utils';

@Component({
  selector: 'app-book-detail-modal',
  templateUrl: './book-detail-modal.component.html',
  styleUrls: ['./book-detail-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class BookDetailModalComponent implements OnInit {
  @Input() book: any;
  @Input() author: any;

  selectedTab = 'details';
  bookFiles: BookFile[] = [];
  bookHistory: BookHistory[] = [];
  isLoadingFiles = false;
  isLoadingHistory = false;
  isUpdatingMonitor = false;
  authorName = '';
  genresList: string[] = [];

  constructor(
    private modalController: ModalController,
    private bookService: BookService,
    private sanitizer: DomSanitizer,
    private apiConfig: ApiConfigService
  ) {
    // Register all required icons
    addIcons({
      close,
      star,
      checkmarkCircle,
      addCircleOutline,
      calendarOutline,
      timeOutline,
      documentTextOutline,
      libraryOutline,
      folderOpenOutline,
      timeIcon,
      'checkmark-circle': checkmarkCircle,
      'add-circle-outline': addCircleOutline,
      'calendar-outline': calendarOutline,
      'time-outline': timeOutline,
      'document-text-outline': documentTextOutline,
      'library-outline': libraryOutline,
      'folder-open-outline': folderOpenOutline,
      'time': timeIcon
    });
  }

  ngOnInit() {
    // Set author name from either the passed author or the book's nested author
    console.log('Author', this.author);
    console.log('Book', this.book);
    if (this.author?.firstName || this.author?.lastName) {
      this.authorName = [this.author.firstName, this.author.lastName].join(' ');
    } else if (this.book?.author?.value?.name) {
      this.authorName = this.book.author.value.name;
    } else if (this.book?.authorMetadata?.value?.name) {
      this.authorName = this.book.authorMetadata.value.name;
    } else if (this.book?.authorName) {
      this.authorName = this.book.authorName;
    }

    // Extract genres from the book object
    if (this.book?.genres) {
      this.genresList = Array.isArray(this.book.genres) ? this.book.genres : this.book.genres.split(',');
      // Sort genres alphabetically
      this.genresList.sort();
    }

    // Load files and history when modal opens
    this.loadBookFiles();
    this.loadBookHistory();
  }

  dismiss() {
    this.modalController.dismiss();
  }

  selectTab(tab: string) {
    this.selectedTab = tab;

    // Load data if not already loaded
    if (tab === 'files' && this.bookFiles.length === 0 && !this.isLoadingFiles) {
      this.loadBookFiles();
    } else if (tab === 'history' && this.bookHistory.length === 0 && !this.isLoadingHistory) {
      this.loadBookHistory();
    }
  }

  async toggleMonitor() {
    if (this.isUpdatingMonitor) return;

    this.isUpdatingMonitor = true;
    try {
      const updatedBook = await firstValueFrom(
        this.bookService.updateBookMonitored(
          this.book.id,
          !this.book.monitored
        )
      );

      if (updatedBook) {
        this.book.monitored = updatedBook.monitored;
        // Dismiss with the updated book so parent can update its list
        this.modalController.dismiss({ updatedBook });
      }
    } catch (error) {
      console.error('Error updating book monitored status:', error);
    } finally {
      this.isUpdatingMonitor = false;
    }
  }

  async loadBookFiles() {
    this.isLoadingFiles = true;
    try {
      const files = await firstValueFrom(
        this.bookService.getBookFiles(this.book.id)
      );
      this.bookFiles = files || [];
    } catch (error) {
      console.error('Error loading book files:', error);
      this.bookFiles = [];
    } finally {
      this.isLoadingFiles = false;
    }
  }

  async loadBookHistory() {
    this.isLoadingHistory = true;
    try {
      const history = await firstValueFrom(
        this.bookService.getBookHistory(this.book.id)
      );
      this.bookHistory = history || [];
    } catch (error) {
      console.error('Error loading book history:', error);
      this.bookHistory = [];
    } finally {
      this.isLoadingHistory = false;
    }
  }

  getBookCover(): string {
    const serverUrl = this.apiConfig.getBaseUrlSync();
    return getBookCoverUrl(this.book, serverUrl);
  }

  formatDuration(minutes: number): string {
    if (!minutes) return 'Unknown';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  hasAdditionalInfo(): boolean {
    // Check if editions exist and have the needed fields
    const editions = this.book?.editions?.value;
    if (editions && editions.length > 0) {
      const edition = editions.find((e: any) => e.monitored) || editions[0];
      if (edition?.publisher || edition?.asin || edition?.isbn13) {
        return true;
      }
    }

    // Check direct book properties
    return !!(this.book?.publisher ||
              this.book?.narrator ||
              this.book?.asin ||
              this.book?.isbn ||
              (this.genresList && this.genresList.length > 0));
  }

  getPublisher(): string | null {
    if (this.book?.publisher) return this.book.publisher;
    const editions = this.book?.editions?.value;
    if (editions && editions.length > 0) {
      const edition = editions.find((e: any) => e.monitored) || editions[0];
      return edition?.publisher || null;
    }
    return null;
  }

  getAsin(): string | null {
    if (this.book?.asin) return this.book.asin;
    const editions = this.book?.editions?.value;
    if (editions && editions.length > 0) {
      const edition = editions.find((e: any) => e.monitored) || editions[0];
      return edition?.asin || null;
    }
    return null;
  }

  getIsbn(): string | null {
    if (this.book?.isbn) return this.book.isbn;
    const editions = this.book?.editions?.value;
    if (editions && editions.length > 0) {
      const edition = editions.find((e: any) => e.monitored) || editions[0];
      return edition?.isbn13 || null;
    }
    return null;
  }

  formatOverview(overview: string): string {
    if (!overview) return '';

    // First decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = overview;
    let decodedText = textarea.value;

    // Clean and format the text
    let cleanOverview = decodedText
      // Handle paragraph tags - must do closing tags first
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '')
      // Replace line breaks with single newlines
      .replace(/<br\s*\/?>/gi, '\n')
      // Strip all remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up excessive whitespace
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Max 2 newlines in a row
      .replace(/^\s+|\s+$/g, '') // Trim start and end
      .trim();

    return cleanOverview;
  }
}
