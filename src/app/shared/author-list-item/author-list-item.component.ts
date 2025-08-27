import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  constructor(
    private apiConfig: ApiConfigService,
    private navCtrl: NavController
  ) {}

  get fullName() { 
    return `${this.author.firstName} ${this.author.lastName}`; 
  }

  get authorImage(): string {
    const serverUrl = this.apiConfig.getBaseUrlSync();
    return getAuthorImageUrl(this.author, serverUrl);
  }
  
  navigateToAuthor() {
    this.navCtrl.navigateForward(`/author/${this.author.id}`);
  }
}
