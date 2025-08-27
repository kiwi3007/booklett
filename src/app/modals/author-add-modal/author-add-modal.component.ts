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
import { closeOutline, saveOutline, folderOutline, bookOutline, eyeOutline, addCircleOutline, searchOutline, optionsOutline, informationCircleOutline } from 'ionicons/icons';
import { AuthorService } from '../../core/services/author.service';
import { Author } from '../../core/models/author.model';
import { ApiConfigService } from '../../core/services/api-config.service';
import { getAuthorImageUrl } from '../../core/utils/image-url.utils';

@Component({
  selector: 'app-author-add-modal',
  templateUrl: './author-add-modal.component.html',
  styleUrls: ['./author-add-modal.component.scss'],
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
export class AuthorAddModalComponent implements OnInit {
  @Input() author: any; // Author data from search results

  qualityProfiles: any[] = [];
  metadataProfiles: any[] = [];
  audiobookRootFolders: string[] = [];
  ebookRootFolders: string[] = [];
  
  mediaType: 'audiobook' | 'ebook' = 'audiobook';
  selectedQualityProfile: number | null = null;
  selectedMetadataProfile: number | null = null;
  selectedRootFolder: string = '';
  monitorNewBooks: boolean = true;  // Default to true
  searchForMissingBooks: boolean = false;
  
  loading: boolean = true;
  profilesLoading: boolean = false;
  saving: boolean = false;

  constructor(
    private modalController: ModalController,
    private authorService: AuthorService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private apiConfig: ApiConfigService
  ) {
    addIcons({ 
      closeOutline, 
      saveOutline, 
      folderOutline, 
      bookOutline, 
      eyeOutline, 
      addCircleOutline, 
      searchOutline, 
      optionsOutline, 
      informationCircleOutline 
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
    // In a real implementation, this would call the API to add the author
    await this.dismiss(true);
    
    /* Future implementation:
    this.saving = true;
    
    const authorData = {
      ...this.author,
      mediaType: this.mediaType,
      qualityProfileId: this.selectedQualityProfile,
      metadataProfileId: this.selectedMetadataProfile,
      rootFolderPath: this.selectedRootFolder,
      monitored: true,  // Always monitor the author (that's the purpose of this modal)
      monitorNewItems: this.monitorNewBooks,
      searchForMissingBooks: this.searchForMissingBooks,
      addOptions: {
        monitor: this.monitorNewBooks ? 'all' : 'none',
        searchForMissingBooks: this.searchForMissingBooks
      }
    };

    try {
      const loading = await this.loadingController.create({
        message: 'Adding author to library...',
        spinner: 'circular'
      });
      await loading.present();

      await this.authorService.addAuthor(authorData).toPromise();
      
      await loading.dismiss();
      await this.showToast('Author added successfully', 'success');
      await this.dismiss(true);
    } catch (error) {
      console.error('Error adding author:', error);
      await this.showToast('Error adding author to library', 'danger');
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

  getAuthorDisplayName(): string {
    if (!this.author) return 'Unknown Author';
    
    if (this.author.authorName) {
      return this.author.authorName;
    }
    
    const firstName = this.author.authorNameFirstLast || this.author.firstName || '';
    const lastName = this.author.authorNameLastFirst?.split(',')[0] || this.author.lastName || '';
    
    return `${firstName} ${lastName}`.trim() || 'Unknown Author';
  }

  getAuthorImage(): string {
    const serverUrl = this.apiConfig.getBaseUrlSync();
    
    // First check if author has remotePoster property (from search results)
    if (this.author?.remotePoster) {
      return this.author.remotePoster;
    }
    
    // Otherwise use the standard image resolution
    return getAuthorImageUrl(this.author, serverUrl);
  }

  async onMediaTypeChange(event: any) {
    this.mediaType = event.detail.value;
    // Update root folder for the new media type
    this.updateRootFolder();
    // Reload profiles for the new media type (without showing full loading screen)
    await this.loadProfiles(false);
  }
}
