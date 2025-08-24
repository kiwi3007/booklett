export interface Book {
  id: number;
  authorMetadataId: number;
  foreignBookId: string;
  titleSlug: string;
  title: string;
  releaseDate: string;
  links: Link[];
  genres: string[];
  relatedBooks: any[];
  ratings: Rating;
  cleanTitle: string;
  monitored: boolean;
  anyEditionOk: boolean;
  lastInfoSync: string;
  added: string;
  addOptions: AddOptions;
  authorMetadata: {
    value: {
      foreignAuthorId: string;
      titleSlug: string;
      name: string;
      sortName: string;
      sortNameLastFirst: string;
      aliases: string[];
      overview: string;
      disambiguation: string;
      gender: string;
      hometown: string;
      born: string;
      died: string;
      status: string;
      images: Image[];
      links: Link[];
      genres: string[];
      ratings: Rating;
      id: number;
    };
    isLoaded: boolean;
  };
  author: {
    value: {
      authorMetadataId: number;
      name: string;
      sortName: string;
      sortNameLastFirst: string;
      monitored: boolean;
      monitorNewItems: string;
      lastInfoSync: string;
      path: string;
      rootFolderPath: string;
      added: string;
      qualityProfileId: number;
      metadataProfileId: number;
      tags: any[];
      addOptions: AddOptions;
      metadata: {
        isLoaded: boolean;
      };
      qualityProfile: {
        isLoaded: boolean;
      };
      metadataProfile: {
        isLoaded: boolean;
      };
      books: {
        isLoaded: boolean;
      };
      series: {
        isLoaded: boolean;
      };
      name_: string;
      id: number;
    };
    isLoaded: boolean;
  };
  editions: {
    value: Edition[];
    isLoaded: boolean;
  };
  bookFiles: {
    value: any[];
    isLoaded: boolean;
  };
  seriesLinks: {
    value: SeriesLink[];
    isLoaded: boolean;
  };
  overview?: string;
  images?: Image[];
  statistics?: {
    bookFileCount: number;
    bookCount: number;
    totalBookCount: number;
    sizeOnDisk: number;
    percentOfBooks: number;
  };
  rootFolderPath?: string;
  qualityProfileId?: number;
  metadataProfileId?: number;
}

export interface Link {
  url: string;
  name: string;
}

export interface Rating {
  votes: number;
  value: number;
  popularity?: number;
}

export interface AddOptions {
  addType: string;
  searchForNewBook: boolean;
}

export interface Image {
  url: string;
  coverType: string;
  extension: string;
  remoteUrl?: string;
}

export interface Edition {
  id: number;
  bookId: number;
  foreignEditionId: string;
  titleSlug: string;
  isbn13: string;
  asin: string;
  title: string;
  language: string;
  overview: string;
  format: string;
  isEbook: boolean;
  disambiguation: string;
  publisher: string;
  pageCount: number;
  releaseDate: string;
  images: Image[];
  links: Link[];
  ratings: Rating;
  monitored: boolean;
  manualAdd: boolean;
}

export interface SeriesLink {
  id: number;
  position: string;
  seriesId: number;
  bookId: number;
  isPrimary: boolean;
  series: {
    value: {
      id: number;
      foreignSeriesId: string;
      title: string;
      description: string;
      numbered: boolean;
      workCount: number;
      primaryWorkCount: number;
      linkItems: {
        value: any[];
        isLoaded: boolean;
      };
      books: {
        value: any[];
        isLoaded: boolean;
      };
      foreignAuthorId: string;
    };
    isLoaded: boolean;
  };
  book?: {
    isLoaded: boolean;
  };
}

// Helper function to map API response to simplified Book model
export function mapApiBookToBook(apiBook: any): Book {
  // Extract images from editions if not directly on book
  let images = apiBook.images || [];
  
  // If no images on book, try to get from editions
  if ((!images || images.length === 0) && apiBook.editions?.value?.length > 0) {
    // Try to find the monitored edition or fall back to first edition
    const monitoredEdition = apiBook.editions.value.find((e: any) => e.monitored) || apiBook.editions.value[0];
    images = monitoredEdition?.images || [];
  }
  
  return {
    ...apiBook,
    overview: apiBook.overview || apiBook.editions?.value?.[0]?.overview || '',
    images: images
  };
}
