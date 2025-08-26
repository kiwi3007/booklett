import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonAvatar, IonSearchbar, IonInfiniteScroll, IonInfiniteScrollContent, IonSpinner, ModalController, IonRefresher, IonRefresherContent, IonButton } from '@ionic/angular/standalone';
import { BookService } from '../../core/services/book.service';
import { Subject, debounceTime, distinctUntilChanged, firstValueFrom, takeUntil } from 'rxjs';
import { BookDetailModalComponent } from '../../modals/book-detail-modal/book-detail-modal.component';

@Component({
  selector: 'app-wanted',
  templateUrl: './wanted.page.html',
  styleUrls: ['./wanted.page.scss'],
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonAvatar, IonSearchbar,
    IonInfiniteScroll, IonInfiniteScrollContent, IonSpinner,
    IonRefresher, IonRefresherContent,
    IonButton
  ],
})
export class WantedPage implements OnInit, OnDestroy {
  items: any[] = [];
  totalRecords = 0;
  page = 1;
  pageSize = 20;
  lastLoadedPage = 0;
  loadingInitial = false;
  loadingMore = false;

  // Search state
  searchTerm = '';
  private search$ = new Subject<string>();
  searching = false;
  searchResults: any[] | null = null;

  private destroy$ = new Subject<void>();
  private currentSearchId = 0;

  // Multi-select
  selectedIds = new Set<number>();
  get selectedCount(): number { return this.selectedIds.size; }
  get inMultiSelect(): boolean { return this.selectedIds.size > 0; }
  get allSelectedInFiltered(): boolean {
    const filtered = this.searchTerm ? this.filterRecords(this.items, this.searchTerm) : this.items;
    if (filtered.length === 0) return false;
    // Only treat as all-selected if we've loaded all pages
    if (this.items.length < this.totalRecords) return false;
    return filtered.every(r => {
      const id = this.getRecId(r);
      return id != null && this.selectedIds.has(id);
    });
  }
  selectingAll = false;

  get canLoadMore(): boolean {
    return this.items.length < this.totalRecords && !this.searchTerm;
  }

  constructor(private books: BookService, private modalCtrl: ModalController) {}

  ngOnInit(): void {
    this.loadingInitial = true;
    this.loadPage(1).finally(() => (this.loadingInitial = false));

    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => this.handleSearch(term));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadPage(page: number): Promise<void> {
    this.loadingMore = true;
    try {
      const res = await firstValueFrom(this.books.getWantedMissing(page, this.pageSize));
      if (page === 1) {
        this.items = [];
      }
      this.totalRecords = res.totalRecords ?? this.totalRecords;
      this.items.push(...(res.records || []));
      this.page = page;
      this.lastLoadedPage = page;

      // Optionally hydrate queue details without blocking UI
      const ids = (res.records || [])
        .map(r => Number(r.localBookId || r.id || r.bookId))
        .filter(Boolean);
      if (ids.length) {
        this.books.getQueueDetailsByBookIds(ids).subscribe({
          next: details => {
            // If needed in future, attach details to items here by id mapping
          },
          error: () => {}
        });
      }
    } catch (e) {
      console.error('Failed to load wanted page', e);
    } finally {
      this.loadingMore = false;
    }
  }

  getRecId(rec: any): number | null {
    return (rec?.id ?? rec?.localBookId ?? rec?.bookId) != null ? Number(rec.id ?? rec.localBookId ?? rec.bookId) : null;
  }

  isSelected(rec: any): boolean {
    const id = this.getRecId(rec);
    return id != null ? this.selectedIds.has(id) : false;
  }

  toggleSelect(rec: any, ev?: Event) {
    if (ev) ev.stopPropagation();
    const id = this.getRecId(rec);
    if (id == null) return;
    if (this.selectedIds.has(id)) this.selectedIds.delete(id); else this.selectedIds.add(id);
  }

  onBulkSearch() {
    // Stub: no-op for now
  }

  onUnmonitorSelected() {
    // Stub: no-op for now
  }

  async onToggleSelectAll() {
    if (this.allSelectedInFiltered) {
      this.selectedIds.clear();
      return;
    }
    await this.selectAllFiltered();
  }

  private async selectAllFiltered() {
    if (this.selectingAll) return;
    this.selectingAll = true;
    try {
      // Cancel any in-flight search to avoid race conditions
      this.currentSearchId++;
      this.searching = false;

      // Ensure all pages are loaded
      if (this.lastLoadedPage === 0) {
        await this.loadPage(1);
      }
      while (this.items.length < this.totalRecords) {
        await this.loadPage(this.lastLoadedPage + 1);
      }

      const filtered = this.searchTerm ? this.filterRecords(this.items, this.searchTerm) : this.items;
      for (const rec of filtered) {
        const id = this.getRecId(rec);
        if (id != null) this.selectedIds.add(id);
      }
    } finally {
      this.selectingAll = false;
    }
  }

  onItemClick(rec: any) {
    if (this.inMultiSelect) {
      this.toggleSelect(rec);
    } else {
      this.openBookDetail(rec);
    }
  }

  async loadMore(ev: any) {
    const next = this.page + 1;
    await this.loadPage(next);
    const infinite = ev.target as HTMLIonInfiniteScrollElement;
    if (infinite && typeof infinite.complete === 'function') {
      infinite.complete();
    }
    if (!this.canLoadMore && infinite) {
      infinite.disabled = true;
    }
  }

  onSearchInput(ev: any) {
    const val = (ev?.detail?.value ?? ev?.target?.value ?? '').toString();
    this.searchTerm = val;
    // When user clears term, stop searching and show base list
    if (!val) {
      this.searchResults = null;
      this.searching = false;
    }
    this.search$.next(val);
  }

  private filterRecords(records: any[], term: string): any[] {
    const q = term.trim().toLowerCase();
    if (!q) return [];
    return records.filter(r =>
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.authorTitle && r.authorTitle.toLowerCase().includes(q)) ||
      (r.author?.authorName && r.author.authorName.toLowerCase().includes(q))
    );
  }

  async openBookDetail(rec: any) {
    // Build a minimal book object
    const book = rec;

    // Normalize author data for the modal so it can show the by line
    let author: any = undefined;
    const a = rec?.author;
    if (a) {
      let firstName = '';
      let lastName = '';
      if (a.authorNameLastFirst && typeof a.authorNameLastFirst === 'string' && a.authorNameLastFirst.includes(',')) {
        const parts = a.authorNameLastFirst.split(',');
        lastName = (parts[0] || '').trim();
        firstName = (parts.slice(1).join(' ') || '').trim();
      } else if (a.authorName && typeof a.authorName === 'string') {
        const parts = a.authorName.trim().split(/\s+/);
        if (parts.length > 1) {
          lastName = parts.pop() as string;
          firstName = parts.join(' ');
        } else {
          firstName = a.authorName.trim();
          lastName = '';
        }
      }
      author = {
        id: a.id ?? a.authorMetadataId ?? a.localAuthorId ?? a.localId ?? a.authorId,
        firstName,
        lastName,
      };
    }

    const modal = await this.modalCtrl.create({
      component: BookDetailModalComponent,
      componentProps: { book, author },
      breakpoints: [0, 0.5, 0.75, 1],
      initialBreakpoint: 0.75,
      canDismiss: true,
      handleBehavior: 'cycle',
      cssClass: 'book-detail-modal',
      expandToScroll: false,
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.updatedBook) {
      const updated = data.updatedBook;
      this.items = this.items.map(it => (it.id === updated.id ? { ...it, ...updated } : it));
      if (this.searchResults) {
        this.searchResults = this.searchResults.map(it => (it.id === updated.id ? { ...it, ...updated } : it));
      }
    }
  }

  async handleRefresh(event: any) {
    this.selectedIds.clear();
    // Clear state and reload from page 1
    this.items = [];
    this.totalRecords = 0;
    this.page = 1;
    this.lastLoadedPage = 0;
    // Keep the search term; restart search after initial page reload
    const term = this.searchTerm;
    try {
      await this.loadPage(1);
      if (term) {
        await this.handleSearch(term);
      }
    } catch (e) {
      console.error('Refresh failed', e);
    } finally {
      if (event?.target?.complete) {
        event.target.complete();
      }
    }
  }

  private async handleSearch(term: string) {
    const q = term.trim();
    const mySearchId = ++this.currentSearchId;

    if (!q) {
      this.searchResults = null;
      this.searching = false;
      return;
    }

    this.searching = true;
    this.searchResults = [];

    // Ensure at least the first page is loaded so totalRecords is known
    if (this.lastLoadedPage === 0) {
      await this.loadPage(1);
      if (mySearchId !== this.currentSearchId) return; // cancelled by a new search
    }

    // Seed with matches from already-loaded items
    let current = this.filterRecords(this.items, q);
    if (mySearchId !== this.currentSearchId) return;
    this.searchResults = current;

    // Progressively load more pages and append matches
    while (this.items.length < this.totalRecords) {
      const prevLen = this.items.length;
      const nextPage = this.lastLoadedPage + 1;
      await this.loadPage(nextPage);
      if (mySearchId !== this.currentSearchId) return; // cancelled by a new search

      const newRecords = this.items.slice(prevLen);
      const newMatches = this.filterRecords(newRecords, q);
      if (newMatches.length) {
        // Append and reassign to trigger change detection
        current = [...(this.searchResults || []), ...newMatches];
        this.searchResults = current;
      }
    }

    // Finished scanning all pages
    if (mySearchId !== this.currentSearchId) return;
    this.searching = false;
  }
}
