import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonLabel, IonAvatar, IonIcon, IonButton } from '@ionic/angular/standalone';
import { AuthenticatedImageDirective } from '../directives/authenticated-image.directive';
import { Book } from '../../core/models/book.model';
import { BookService } from '../../core/services/book.service';
import { ModalController } from '@ionic/angular/standalone';
import { BookDetailModalComponent } from '../../modals/book-detail-modal/book-detail-modal.component';
import { addIcons } from 'ionicons';
import { bookOutline, checkmarkCircleOutline, ellipseOutline, chevronForwardOutline } from 'ionicons/icons';
import { getBookCoverUrl } from '../../core/utils/image-url.utils';
import { ServerSettingsService } from '../../core/services/server-settings.service';

@Component({
  selector: 'app-book-library-list-item',
  templateUrl: './book-library-list-item.component.html',
  styleUrls: ['./book-library-list-item.component.scss'],
  imports: [
    CommonModule,
    IonItem,
    IonLabel,
    IonAvatar,
    IonIcon,
    IonButton,
    AuthenticatedImageDirective
  ],
  standalone: true
})
export class BookLibraryListItemComponent {
  @Input() book!: Book;
  @Input() disableNavigation: boolean = false;
  @Output() bookClick = new EventEmitter<Book>();

  private serverBaseUrl: string | null = null;

  constructor(
    private bookService: BookService,
    private modalCtrl: ModalController,
    private serverSettingsService: ServerSettingsService
  ) {
    addIcons({ bookOutline, checkmarkCircleOutline, ellipseOutline, chevronForwardOutline });
    this.serverBaseUrl = this.serverSettingsService.getBaseUrl();
  }

  get coverImageUrl(): string {
    return getBookCoverUrl(this.book, this.serverBaseUrl);
  }

  get authorName(): string {
    // First try to get from author object if available
    if (this.book.author?.value?.name) {
      return this.book.author.value.name;
    }
    if (this.book.authorMetadata?.value?.name) {
      return this.book.authorMetadata.value.name;
    }
    
    // Parse from authorTitle field (format: "lastName, firstName title")
    if (this.book.authorTitle) {
      const authorTitle = this.book.authorTitle;
      
      // The title should be at the end, so we can remove it
      const bookTitle = this.book.title?.toLowerCase() || '';
      const authorTitleLower = authorTitle.toLowerCase();
      
      // Find where the book title starts in the authorTitle string
      const titleIndex = authorTitleLower.indexOf(bookTitle);
      
      if (titleIndex > 0) {
        // Extract just the author part before the title
        const authorPart = authorTitle.substring(0, titleIndex).trim();
        
        // Format: "lastName, firstName" - convert to "firstName lastName"
        if (authorPart.includes(',')) {
          const [lastName, firstName] = authorPart.split(',').map(s => s.trim());
          return firstName && lastName ? `${firstName} ${lastName}` : authorPart;
        }
        
        return authorPart;
      }
      
      // If we can't find the title, try to parse by comma
      if (authorTitle.includes(',')) {
        const parts = authorTitle.split(',');
        if (parts.length >= 2) {
          // Assume format is "lastName, firstName ..."
          const lastName = parts[0].trim();
          const firstName = parts[1].trim().split(' ')[0]; // Take first word after comma as first name
          return `${firstName} ${lastName}`;
        }
      }
    }
    
    return 'Unknown Author';
  }

  get releaseYear(): string {
    if (this.book.releaseDate) {
      return new Date(this.book.releaseDate).getFullYear().toString();
    }
    return '';
  }

  async handleClick() {
    if (this.disableNavigation) {
      // Emit event instead of navigating
      this.bookClick.emit(this.book);
    } else {
      // Default behavior - open book detail modal
      await this.openBook();
    }
  }

  async openBook() {
    const modal = await this.modalCtrl.create({
      component: BookDetailModalComponent,
      componentProps: { 
        book: this.book,
        author: this.book.author?.value || null
      },
      breakpoints: [0, 0.25, 0.5, 0.75, 1],
      initialBreakpoint: 0.75,
      canDismiss: true,
      handleBehavior: 'cycle',
      cssClass: 'book-detail-modal',
      expandToScroll: false
    });
    
    await modal.present();
    
    const { data } = await modal.onWillDismiss();
    
    // If the book was updated (e.g., monitored status changed), update local state
    if (data?.updatedBook) {
      // Update the book object with the changes
      Object.assign(this.book, data.updatedBook);
    }
  }

  toggleMonitored(event: Event) {
    event.stopPropagation();
    this.bookService.updateBookMonitored(this.book.id, !this.book.monitored).subscribe(
      updated => {
        // Update local book state
        this.book.monitored = !this.book.monitored;
      }
    );
  }
}
