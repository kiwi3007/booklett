import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonBadge } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { Author } from '../../core/models/author.model';

@Component({
  selector: 'app-author-card',
  templateUrl: './author-card.component.html',
  styleUrls: ['./author-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonBadge, RouterModule]
})
export class AuthorCardComponent {
  @Input() author!: Author;
}
