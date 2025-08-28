import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonItem, IonAvatar, IonLabel, NavController } from '@ionic/angular/standalone';
import { Author } from '../../core/models/author.model';
import { ApiConfigService } from '../../core/services/api-config.service';
import { getAuthorImageUrl } from '../../core/utils/image-url.utils';

@Component({
  selector: 'app-author-list-item',
  templateUrl: './author-list-item.component.html',
  styleUrls: ['./author-list-item.component.scss'],
  standalone: true,
  imports: [CommonModule, IonItem, IonAvatar, IonLabel]
})
export class AuthorListItemComponent {
  @Input() author!: Author;
  @Input() disableNavigation: boolean = false;
  @Output() authorClick = new EventEmitter<Author>();

  constructor(
    private apiConfig: ApiConfigService,
    private navCtrl: NavController
  ) {}

  get fullName() { 
    return `${this.author.firstName} ${this.author.lastName}`; 
  }

  get authorImage(): string {
    const serverUrl = this.apiConfig.getBaseUrlSync();
    const apiKey = this.apiConfig.getApiKeySync();
    return getAuthorImageUrl(this.author, serverUrl, apiKey);
  }
  
  handleClick() {
    if (this.disableNavigation) {
      // Emit event instead of navigating
      this.authorClick.emit(this.author);
    } else {
      // Default behavior - navigate to author detail
      this.navigateToAuthor();
    }
  }

  navigateToAuthor() {
    this.navCtrl.navigateForward(`/author/${this.author.id}`);
  }
}
