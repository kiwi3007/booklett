import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonButton, 
  IonIcon,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonList,
  IonSpinner,
  IonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  ModalController,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, folderOutline, bookOutline, eyeOutline, addCircleOutline, searchOutline, optionsOutline, informationCircleOutline, personOutline } from 'ionicons/icons';
import { AuthorService } from '../../core/services/author.service';
import { ApiConfigService } from '../../core/services/api-config.service';
import { getBookCoverUrl, resolveImageUrl } from '../../core/utils/image-url.utils';

@Component({
  selector: 'app-book-add-modal',
  templateUrl: './book-add-modal.component.html',
  styleUrls: ['./book-add-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonList,
    IonSpinner,
    IonText,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSegment,
    IonSegmentButton
  ]
})
export class BookAddModalComponent implements OnInit {
  @Input() book: any; // Book data from search results
  @Input() author: any; // Author data if available

  qualityProfiles: any[] = [];
  metadataProfiles: any[] = [];
  audiobookRootFolders: string[] = [];
  ebookRootFolders: string[] = [];
  
  mediaType: 'audiobook' | 'ebook' = 'audiobook';
  selectedQualityProfile: number | null = null;
  selectedMetadataProfile: number | null = null;
  selectedRootFolder: string = '';
  monitorAuthor: boolean = true;  // Default to true - Monitor other books by author
  monitorNewBooks: boolean = true;  // Default to true - Monitor new books by author
  searchNow: boolean = false;  // Search for this book now
  
  loading: boolean = true;
  profilesLoading: boolean = false;
  saving: boolean = false;
  descriptionExpanded: boolean = false; // Track description expansion state

  constructor(
    private modalController: ModalController,
    private authorService: AuthorService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private apiConfig: ApiConfigService
  ) {
    addIcons({ 
      closeOutline, 
      folderOutline, 
      bookOutline, 
      eyeOutline, 
      addCircleOutline, 
      searchOutline, 
      optionsOutline, 
      informationCircleOutline,
      personOutline 
    });
  }

  ngOnInit() {
    this.initializeRootFolders();
    this.loadProfiles(true);
  }

  initializeRootFolders() {
    // In a real implementation, these would come from the API
    // For now, using defaults to demonstrate the logic
    this.audiobookRootFolders = ['/audiobooks'];
    this.ebookRootFolders = ['/ebooks'];
    
    // Determine initial media type based on available root folders
    if (this.audiobookRootFolders.length === 0 && this.ebookRootFolders.length > 0) {
      this.mediaType = 'ebook';
    } else if (this.ebookRootFolders.length === 0 && this.audiobookRootFolders.length > 0) {
      this.mediaType = 'audiobook';
    }
    // Otherwise keep default (audiobook)
    
    // Set initial root folder
    this.updateRootFolder();
  }

  updateRootFolder() {
    const folders = this.getCurrentRootFolders();
    if (folders.length > 0 && !folders.includes(this.selectedRootFolder)) {
      this.selectedRootFolder = folders[0];
    }
  }

  getCurrentRootFolders(): string[] {
    return this.mediaType === 'audiobook' ? this.audiobookRootFolders : this.ebookRootFolders;
  }

  isMediaTypeDisabled(type: 'audiobook' | 'ebook'): boolean {
    if (type === 'audiobook') {
      return this.audiobookRootFolders.length === 0;
    } else {
      return this.ebookRootFolders.length === 0;
    }
  }

  async loadProfiles(isInitialLoad: boolean = false) {
    // Only show loading spinner on initial load
    if (isInitialLoad) {
      this.loading = true;
    } else {
      this.profilesLoading = true;
    }
    
    try {
      // Load quality and metadata profiles in parallel
      const [qualityProfiles, metadataProfiles] = await Promise.all([
        this.authorService.getQualityProfiles(this.mediaType).toPromise(),
        this.authorService.getMetadataProfiles(this.mediaType).toPromise()
      ]);

      this.qualityProfiles = qualityProfiles || [];
      this.metadataProfiles = metadataProfiles || [];

      // Set default selections if available
      if (this.qualityProfiles.length > 0) {
        const defaultQuality = this.qualityProfiles.find(p => p.name === 'Any') || this.qualityProfiles[0];
        this.selectedQualityProfile = defaultQuality.id;
      }

      if (this.metadataProfiles.length > 0) {
        const defaultMetadata = this.metadataProfiles.find(p => p.name === 'Standard') || this.metadataProfiles[0];
        this.selectedMetadataProfile = defaultMetadata.id;
      }

    } catch (error) {
      console.error('Error loading profiles:', error);
      await this.showToast('Error loading profiles', 'danger');
    } finally {
      this.loading = false;
      this.profilesLoading = false;
    }
  }

  async save() {
    // Validation
    if (!this.selectedQualityProfile || !this.selectedMetadataProfile || !this.selectedRootFolder) {
      await this.showToast('Please select all required options', 'warning');
      return;
    }

    // For now, just close the modal as requested
    // In a real implementation, this would call the API to add the book
    await this.dismiss(true);
    
    /* Future implementation:
    this.saving = true;
    
    const bookData = {
      ...this.book,
      mediaType: this.mediaType,
      qualityProfileId: this.selectedQualityProfile,
      metadataProfileId: this.selectedMetadataProfile,
      rootFolderPath: this.selectedRootFolder,
      monitored: true,  // Always monitor the book (that's the purpose of this modal)
      monitorAuthor: this.monitorAuthor,
      monitorNewBooks: this.monitorNewBooks,
      searchNow: this.searchNow,
      addOptions: {
        searchForBook: this.searchNow,
        monitorAuthor: this.monitorAuthor,
        monitor: this.monitorNewBooks ? 'future' : 'none'
      }
    };

    try {
      const loading = await this.loadingController.create({
        message: 'Adding book to library...',
        spinner: 'circular'
      });
      await loading.present();

      // API call would go here
      
      await loading.dismiss();
      await this.showToast('Book added successfully', 'success');
      await this.dismiss(true);
    } catch (error) {
      console.error('Error adding book:', error);
      await this.showToast('Error adding book to library', 'danger');
    } finally {
      this.saving = false;
    }
    */
  }

  async dismiss(saved: boolean = false) {
    await this.modalController.dismiss(saved);
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    await toast.present();
  }

  getBookTitle(): string {
    return this.book?.title || this.book?.titleSlug || 'Unknown Book';
  }

  getAuthorName(): string {
    if (this.author?.authorName) {
      return this.author.authorName;
    }
    
    if (this.book?.author?.authorName) {
      return this.book.author.authorName;
    }
    
    if (this.book?.author?.authorNameLastFirst) {
      // Convert "Last, First" to "First Last"
      const parts = this.book.author.authorNameLastFirst.split(',');
      if (parts.length === 2) {
        return `${parts[1].trim()} ${parts[0].trim()}`;
      }
      return this.book.author.authorNameLastFirst;
    }
    
    return 'Unknown Author';
  }

  getBookImage(): string {
    const serverUrl = this.apiConfig.getBaseUrlSync();
    
    // First check if book has remoteCover property (from search results)
    if (this.book?.remoteCover) {
      // Remote cover might be a relative path, so we need to resolve it
      return resolveImageUrl(this.book.remoteCover, serverUrl);
    }
    
    // Otherwise use the standard image resolution
    return getBookCoverUrl(this.book, serverUrl);
  }

  getBookDescription(): string | null {
    return this.book?.overview || this.book?.description || null;
  }

  shouldShowReadMore(): boolean {
    const description = this.getBookDescription();
    return !!description && description.length > 300;
  }

  toggleDescription() {
    this.descriptionExpanded = !this.descriptionExpanded;
  }

  async onMediaTypeChange(event: any) {
    this.mediaType = event.detail.value;
    // Update root folder for the new media type
    this.updateRootFolder();
    // Reload profiles for the new media type (without showing full loading screen)
    await this.loadProfiles(false);
  }
}
