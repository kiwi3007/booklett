import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonBadge, NavController } from '@ionic/angular/standalone';
import { Author } from '../../core/models/author.model';
import { ApiConfigService } from '../../core/services/api-config.service';
import { getAuthorImageUrl } from '../../core/utils/image-url.utils';

@Component({
  selector: 'app-author-card',
  templateUrl: './author-card.component.html',
  styleUrls: ['./author-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonBadge]
})
export class AuthorCardComponent {
  @Input() author!: Author;

  constructor(
    private apiConfig: ApiConfigService,
    private navCtrl: NavController
  ) {}

  get authorImage(): string {
    const serverUrl = this.apiConfig.getBaseUrlSync();
    const apiKey = this.apiConfig.getApiKeySync();
    return getAuthorImageUrl(this.author, serverUrl, apiKey);
  }
  
  navigateToAuthor() {
    this.navCtrl.navigateForward(`/author/${this.author.id}`);
  }
}
