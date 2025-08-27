import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SeriesAddModalComponent } from './series-add-modal.component';

describe('SeriesAddModalComponent', () => {
  let component: SeriesAddModalComponent;
  let fixture: ComponentFixture<SeriesAddModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SeriesAddModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SeriesAddModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
