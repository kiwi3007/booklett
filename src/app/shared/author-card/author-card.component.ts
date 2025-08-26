import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonBadge } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { Author } from '../../core/models/author.model';
import { ApiConfigService } from '../../core/services/api-config.service';
import { getAuthorImageUrl } from '../../core/utils/image-url.utils';

@Component({
  selector: 'app-author-card',
  templateUrl: './author-card.component.html',
  styleUrls: ['./author-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonBadge, RouterModule]
})
export class AuthorCardComponent {
  @Input() author!: Author;

  constructor(private apiConfig: ApiConfigService) {}

  get authorImage(): string {
    const serverUrl = this.apiConfig.getBaseUrlSync();
    return getAuthorImageUrl(this.author, serverUrl);
  }
}
