import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonRefresher, IonRefresherContent, ModalController, IonDatetime, IonDatetimeButton, IonModal } from '@ionic/angular/standalone';
import { BehaviorSubject, combineLatest, map, switchMap, of } from 'rxjs';
import { CalendarService } from '../../core/services/calendar.service';
import { AuthorService } from '../../core/services/author.service';
import { Book } from '../../core/models/book.model';
import { BookListItemComponent } from '../../shared/book-list-item/book-list-item.component';
import { BookDetailModalComponent } from '../../modals/book-detail-modal/book-detail-modal.component';
import { BookService } from '../../core/services/book.service';

interface DateGroup {
  dateKey: string; // YYYY-MM-DD
  date: Date;
  books: Book[];
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonRefresher,
    IonRefresherContent,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    BookListItemComponent
  ],
})
export class CalendarPage implements OnInit {
  // Date range state, default to current month
  startDate!: Date;
  endDate!: Date;
  // Maximum date allowed (now + 2 years)
  private maxDate!: Date;
  // Minimum date allowed (now - 3 years)
  private minDate!: Date;
  private startDate$ = new BehaviorSubject<Date>(new Date());
  private endDate$ = new BehaviorSubject<Date>(new Date());

  // Raw books for selected range
  private booksRaw$ = combineLatest([this.startDate$, this.endDate$]).pipe(
    switchMap(([start, end]) => this.calendar.getReleasesInRange({ start, end }))
  );

  // Enriched books with author names from the authors cache
  books$ = combineLatest([this.booksRaw$, this.authorService.authors$]).pipe(
    map(([books, authors]) => {
      const byId = new Map<number, string>();
      for (const a of authors) {
        const numId = parseInt(a.id, 10);
        if (!isNaN(numId)) {
          byId.set(numId, `${a.firstName} ${a.lastName}`.trim());
        }
      }
      return books.map(b => {
        const anyB: any = b as any;
        const aid: number | undefined = anyB?.author?.value?.id ?? anyB?.authorMetadata?.value?.id;
        const name = aid != null ? byId.get(aid) : undefined;
        if (name) {
          anyB.authorName = name;
          if (!anyB.author) anyB.author = { value: {}, isLoaded: false };
          if (!anyB.author.value) anyB.author.value = {};
          anyB.author.value.name = name;
          if (!anyB.authorMetadata) anyB.authorMetadata = { value: {}, isLoaded: false };
          if (!anyB.authorMetadata.value) anyB.authorMetadata.value = {};
          anyB.authorMetadata.value.name = name;
        }
        return anyB as Book;
      });
    })
  );

  // Grouped view
  groups$ = this.books$.pipe(map((books) => this.groupByDate(books)));

  // Queue status map: { [bookId]: { isDownloading: boolean, progress?: number } }
  queueMap$ = this.books$.pipe(
    switchMap((books) => {
      const ids = Array.from(new Set(books.map((b) => b.id).filter((id) => typeof id === 'number')));
      if (ids.length === 0) return of({} as Partial<Record<number, { isDownloading: boolean; progress?: number }>>);
      return this.bookService.getQueueDetailsByBookIds(ids).pipe(
        map((items: any[]) => {
          const mapObj: Partial<Record<number, { isDownloading: boolean; progress?: number }>> = {};
          for (const it of items || []) {
            const bookId = it.bookId ?? it.book?.id ?? it.id;
            if (bookId == null) continue;
            const size = it.size || it.sizebytes || 0;
            const sizeleft = it.sizeleft || 0;
            const progress = size > 0 ? Math.round((1 - sizeleft / size) * 100) : undefined;
            mapObj[bookId] = { isDownloading: true, progress };
          }
          return mapObj;
        })
      );
    })
  );

  constructor(private calendar: CalendarService, private bookService: BookService, private authorService: AuthorService, private modalCtrl: ModalController) {}

  ngOnInit(): void {
    // Initialize to current month
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    first.setHours(0, 0, 0, 0);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    last.setHours(23, 59, 59, 999);

    // Set max date to now + 2 years (end of day)
    const max = new Date(now);
    max.setFullYear(max.getFullYear() + 2);
    max.setHours(23, 59, 59, 999);
    this.maxDate = max;

    // Set min date to now - 3 years (start of day)
    const min = new Date(now);
    min.setFullYear(min.getFullYear() - 3);
    min.setHours(0, 0, 0, 0);
    this.minDate = min;

    // Clamp initial dates within [min, max]
    const clampedStart = first < min ? new Date(min) : (first > max ? new Date(max.getFullYear(), max.getMonth(), 1) : first);
    const clampedEnd = last > max ? new Date(max) : (last < min ? new Date(min) : last);

    this.startDate = clampedStart;
    this.endDate = clampedEnd;

    this.startDate$.next(this.startDate);
    this.endDate$.next(this.endDate);
  }

  // ISO strings for IonDatetime
  get startIso(): string {
    return this.startDate.toISOString();
  }
  get endIso(): string {
    return this.endDate.toISOString();
  }
  get maxIso(): string {
    return this.maxDate.toISOString();
  }
  get minIso(): string {
    return this.minDate.toISOString();
  }


  onStartDateChange(ev: any) {
    const iso = ev?.detail?.value as string;
    if (!iso) return;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return;
    d.setHours(0, 0, 0, 0);
    // Clamp to bounds if necessary
    if (d < this.minDate) {
      d.setTime(this.minDate.getTime());
      d.setHours(0, 0, 0, 0);
    }
    if (d > this.maxDate) {
      d.setTime(this.maxDate.getTime());
      d.setHours(0, 0, 0, 0);
    }
    this.startDate = d;
    // Ensure start <= end and end within max
    if (this.startDate > this.endDate) {
      const newEnd = new Date(this.startDate);
      newEnd.setHours(23, 59, 59, 999);
      this.endDate = newEnd > this.maxDate ? new Date(this.maxDate) : newEnd;
      this.endDate$.next(this.endDate);
    }
    this.startDate$.next(this.startDate);
  }

  onEndDateChange(ev: any) {
    const iso = ev?.detail?.value as string;
    if (!iso) return;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return;
    d.setHours(23, 59, 59, 999);
    // Clamp to bounds if necessary
    if (d < this.minDate) {
      d.setTime(this.minDate.getTime());
      d.setHours(23, 59, 59, 999);
    }
    if (d > this.maxDate) {
      d.setTime(this.maxDate.getTime());
    }
    this.endDate = d;
    // Ensure start <= end
    if (this.startDate > this.endDate) {
      const newStart = new Date(this.endDate);
      newStart.setHours(0, 0, 0, 0);
      this.startDate = newStart;
      this.startDate$.next(this.startDate);
    }
    this.endDate$.next(this.endDate);
  }

  isFuture(book: Book): boolean {
    if (!book?.releaseDate) return false;
    const d = new Date(book.releaseDate).getTime();
    return d > Date.now();
  }

  async openBookDetail(book: Book) {
    const modal = await this.modalCtrl.create({
      component: BookDetailModalComponent,
      componentProps: {
        book,
        author: undefined,
      },
      breakpoints: [0, 0.5, 0.75, 1],
      initialBreakpoint: 0.75,
      canDismiss: true,
      handleBehavior: 'cycle',
      cssClass: 'book-detail-modal',
      expandToScroll: false,
    });
    await modal.present();
  }

  handleRefresh(event: any) {
    // Re-emit current values to force re-fetch via switchMap chain
    const start = this.startDate$.value;
    const end = this.endDate$.value;
    setTimeout(() => {
      this.startDate$.next(new Date(start));
      this.endDate$.next(new Date(end));
      event.target.complete();
    }, 300);
  }

  private groupByDate(books: Book[]): DateGroup[] {
    const groups = new Map<string, DateGroup>();
    for (const b of books) {
      if (!b.releaseDate) continue;
      const d = new Date(b.releaseDate);
      if (isNaN(d.getTime())) continue;
      const key = this.toDateKey(d);
      if (!groups.has(key)) {
        groups.set(key, { dateKey: key, date: new Date(key), books: [] });
      }
      groups.get(key)!.books.push(b);
    }

    const result = Array.from(groups.values());
    result.sort((a, b) => a.date.getTime() - b.date.getTime());
    // Sort books within each group by title
    for (const g of result) {
      g.books.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    return result;
  }

  private toDateKey(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
