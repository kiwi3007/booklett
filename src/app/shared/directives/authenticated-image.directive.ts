import { Directive, ElementRef, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { AuthenticatedImageService } from '../../core/services/authenticated-image.service';
import { firstValueFrom } from 'rxjs';

@Directive({
  selector: '[appAuthenticatedImage]',
  standalone: true,
})
export class AuthenticatedImageDirective implements OnChanges, OnDestroy {
  @Input() appAuthenticatedImage?: string;
  @Input() fallbackSrc = 'assets/no-cover.svg';

  private blobUrl?: string | null;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private imageService: AuthenticatedImageService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appAuthenticatedImage']) {
      this.updateImage();
    }
  }

  ngOnDestroy(): void {
    this.cleanupBlobUrl();
  }

  private async updateImage() {
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

    // Check if URL needs authentication
    if (!this.imageService.needsAuthentication(this.appAuthenticatedImage)) {
      this.el.nativeElement.src = this.appAuthenticatedImage;
      this.el.nativeElement.style.opacity = '1';
      return;
    }

    try {
      // Load authenticated image
      this.blobUrl = await firstValueFrom(this.imageService.loadImage(this.appAuthenticatedImage));
      if (this.blobUrl) {
        this.el.nativeElement.src = this.blobUrl;
      } else {
        this.el.nativeElement.src = this.fallbackSrc;
      }
    } catch (error) {
      console.error('Failed to load authenticated image:', error);
      this.el.nativeElement.src = this.fallbackSrc;
    } finally {
      this.el.nativeElement.style.opacity = '1';
    }
  }

  private cleanupBlobUrl() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = undefined;
    }
  }
}
