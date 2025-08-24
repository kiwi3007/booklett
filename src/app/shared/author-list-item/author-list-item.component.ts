import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonAvatar, IonLabel } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { Author } from '../../core/models/author.model';

@Component({
  selector: 'app-author-list-item',
  templateUrl: './author-list-item.component.html',
  styleUrls: ['./author-list-item.component.scss'],
  standalone: true,
  imports: [CommonModule, IonItem, IonAvatar, IonLabel, RouterModule]
})
export class AuthorListItemComponent {
  @Input() author!: Author;

  get fullName() { 
    return `${this.author.firstName} ${this.author.lastName}`; 
  }
}
