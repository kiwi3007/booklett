import { Directive, ElementRef, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { AuthenticatedImageService } from '../../core/services/authenticated-image.service';

const UPDATE_THROTTLE = 500; // ms to wait between update attempts

@Directive({
  selector: '[appAuthenticatedImage]',
  standalone: true,
})
export class AuthenticatedImageDirective implements OnChanges, OnDestroy {
  @Input() appAuthenticatedImage?: string;
  @Input() fallbackSrc = 'assets/no-cover.svg';

  private blobUrl?: string | null;
  private lastUpdate = 0;
  private updatePromise?: Promise<void>;
  private currentSrc?: string;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private imageService: AuthenticatedImageService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['appAuthenticatedImage'];
    if (change && change.currentValue !== change.previousValue) {
      this.updateImage();
    }
  }

  ngOnDestroy(): void {
    this.cleanupBlobUrl();
  }

  private async updateImage() {
    // Skip if URL hasn't changed
    if (this.appAuthenticatedImage === this.currentSrc) {
      return;
    }
    this.currentSrc = this.appAuthenticatedImage;

    // Throttle updates
    const now = Date.now();
    if (now - this.lastUpdate < UPDATE_THROTTLE) {
      return;
    }
    this.lastUpdate = now;

    // If there's an existing update in progress, wait for it
    if (this.updatePromise) {
      await this.updatePromise;
      return;
    }

    this.updatePromise = (async () => {
      try {
        // Clear any existing blob URL
        this.cleanupBlobUrl();

        // Set loading state
        this.el.nativeElement.style.opacity = '0.5';

        // If no URL provided, use fallback
        if (!this.appAuthenticatedImage) {
          this.el.nativeElement.src = this.fallbackSrc;
          this.el.nativeElement.style.opacity = '1';
          return;
        }

        // If no auth needed, set directly
        if (!this.imageService.needsAuthentication(this.appAuthenticatedImage)) {
          this.el.nativeElement.src = this.appAuthenticatedImage;
          this.el.nativeElement.style.opacity = '1';
          return;
        }

        // Load via HttpClient with API key and set blob URL
        const blobUrl = await this.imageService.loadImage(this.appAuthenticatedImage);
        if (blobUrl) {
          this.blobUrl = blobUrl;
          this.el.nativeElement.src = blobUrl;
        } else {
          this.el.nativeElement.src = this.fallbackSrc;
        }
        this.el.nativeElement.style.opacity = '1';
      } catch (err) {
        console.error('Failed to update image:', err);
        this.el.nativeElement.src = this.fallbackSrc;
        this.el.nativeElement.style.opacity = '1';
      } finally {
        this.updatePromise = undefined;
      }
    })();

    await this.updatePromise;
  }

  private cleanupBlobUrl() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = undefined;
    }
  }
}
