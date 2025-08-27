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
  IonBadge,
  ModalController,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, folderOutline, bookOutline, eyeOutline, addCircleOutline, searchOutline, optionsOutline, informationCircleOutline, albumsOutline } from 'ionicons/icons';
import { AuthorService } from '../../core/services/author.service';
import { ApiConfigService } from '../../core/services/api-config.service';
import { resolveImageUrl } from '../../core/utils/image-url.utils';

@Component({
  selector: 'app-series-add-modal',
  templateUrl: './series-add-modal.component.html',
  styleUrls: ['./series-add-modal.component.scss'],
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
    IonSegmentButton,
    IonBadge
  ]
})
export class SeriesAddModalComponent implements OnInit {
  @Input() series: any; // Series data from search results
  @Input() author: any; // Author data if available

  qualityProfiles: any[] = [];
  metadataProfiles: any[] = [];
  audiobookRootFolders: string[] = [];
  ebookRootFolders: string[] = [];
  
  mediaType: 'audiobook' | 'ebook' = 'audiobook';
  selectedQualityProfile: number | null = null;
  selectedMetadataProfile: number | null = null;
  selectedRootFolder: string = '';
  monitorNewBooks: boolean = true;  // Default to true - Monitor new books in series
  searchForMissingBooks: boolean = false;  // Search for missing books in series
  monitorExistingBooks: boolean = true;  // Monitor existing books in the series
  
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
      albumsOutline 
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
    // In a real implementation, this would call the API to add the series
    await this.dismiss(true);
    
    /* Future implementation:
    this.saving = true;
    
    const seriesData = {
      ...this.series,
      mediaType: this.mediaType,
      qualityProfileId: this.selectedQualityProfile,
      metadataProfileId: this.selectedMetadataProfile,
      rootFolderPath: this.selectedRootFolder,
      monitored: true,  // Always monitor the series (that's the purpose of this modal)
      monitorNewItems: this.monitorNewBooks,
      monitorExistingItems: this.monitorExistingBooks,
      searchForMissingBooks: this.searchForMissingBooks,
      addOptions: {
        monitor: this.monitorNewBooks ? 'all' : 'none',
        searchForMissingBooks: this.searchForMissingBooks,
        monitorExisting: this.monitorExistingBooks
      }
    };

    try {
      const loading = await this.loadingController.create({
        message: 'Adding series to library...',
        spinner: 'circular'
      });
      await loading.present();

      // API call would go here
      // await this.seriesService.addSeries(seriesData).toPromise();
      
      await loading.dismiss();
      await this.showToast('Series added successfully', 'success');
      await this.dismiss(true);
    } catch (error) {
      console.error('Error adding series:', error);
      await this.showToast('Error adding series to library', 'danger');
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

  getSeriesTitle(): string {
    return this.series?.title || this.series?.name || 'Unknown Series';
  }

  getAuthorName(): string | null {
    // First check if we have author data passed directly
    if (this.author?.authorName) {
      return this.author.authorName;
    }
    
    // Check if the series has author information
    if (this.series?.author?.authorName) {
      return this.series.author.authorName;
    }
    
    if (this.series?.author?.authorNameLastFirst) {
      // Convert "Last, First" to "First Last"
      const parts = this.series.author.authorNameLastFirst.split(',');
      if (parts.length === 2) {
        return `${parts[1].trim()} ${parts[0].trim()}`;
      }
      return this.series.author.authorNameLastFirst;
    }
    
    // Check if series has authorName directly
    if (this.series?.authorName) {
      return this.series.authorName;
    }
    
    // No author info available for series
    return null;
  }

  // Series don't have images, so we don't need this method
  // We're using an icon-based design instead

  getSeriesDescription(): string | null {
    return this.series?.overview || this.series?.description || null;
  }

  getBookCount(): number {
    return this.series?.workCount || this.series?.bookCount || 0;
  }

  shouldShowReadMore(): boolean {
    const description = this.getSeriesDescription();
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
