import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { BookService, BookFile, BookHistory } from '../../core/services/book.service';
import { firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import { 
  close, 
  star, 
  checkmarkCircle, 
  addCircleOutline,
  calendarOutline,
  timeOutline,
  documentTextOutline,
  libraryOutline,
  folderOpenOutline,
  time as timeIcon
} from 'ionicons/icons';

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
    private bookService: BookService
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
    // Set author name from either the passed author or the book's author
    if (this.author?.authorName) {
      this.authorName = this.author.authorName;
    } else if (this.book?.authorName) {
      this.authorName = this.book.authorName;
    }
    
    // Extract genres from the book object
    if (this.book?.genres && Array.isArray(this.book.genres)) {
      this.genresList = this.book.genres;
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
    if (this.book.images && this.book.images.length > 0) {
      const cover = this.book.images.find((img: any) => img.coverType === 'cover');
      if (cover) {
        return cover.url;
      }
    }
    return 'assets/no-cover.svg';
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
}
