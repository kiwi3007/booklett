import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthorDetailPage } from './author-detail.page';

describe('AuthorDetailPage', () => {
  let component: AuthorDetailPage;
  let fixture: ComponentFixture<AuthorDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthorDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
