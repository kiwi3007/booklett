import { Directive, ElementRef, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthenticatedImageService } from '../services/authenticated-image.service';
import { DomSanitizer } from '@angular/platform-browser';

@Directive({
  selector: '[appAuthenticatedImage]',
  standalone: true
})
export class AuthenticatedImageDirective implements OnChanges, OnDestroy {
  @Input() appAuthenticatedImage?: string;

  private destroy$ = new Subject<void>();
  private blobUrl?: string;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private authenticatedImageService: AuthenticatedImageService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['appAuthenticatedImage']) {
      const url = this.appAuthenticatedImage;
      if (url && this.authenticatedImageService.needsAuthentication(url)) {
        // Show a loading spinner or placeholder while the image loads
        this.el.nativeElement.style.opacity = '0.5';
        // Clean up any existing blob URL
        this.cleanupBlobUrl();
        // Load the image
        this.authenticatedImageService.loadImage(url)
          .pipe(takeUntil(this.destroy$))
          .subscribe(blobUrl => {
            if (blobUrl) {
              this.blobUrl = blobUrl;
              // Set the authenticated image source and show it
              this.el.nativeElement.src = blobUrl;
              this.el.nativeElement.style.opacity = '1';
            } else {
              // If loading failed, show a fallback image
              this.el.nativeElement.src = 'assets/icon/placeholder.svg';
              this.el.nativeElement.style.opacity = '1';
            }
          });
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupBlobUrl();
  }

  private cleanupBlobUrl() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = undefined;
    }
  }
}
