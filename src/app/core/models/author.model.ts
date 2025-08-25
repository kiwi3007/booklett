// API Response Models
export interface ChaptarrAuthor {
  id: number;
  authorMetadataId: number;
  status: string;
  ended: boolean;
  authorName: string;
  authorNameLastFirst: string;
  foreignAuthorId: string;
  localAuthorId: string;
  titleSlug: string;
  overview?: string;
  links?: Array<{
    url: string;
    name: string;
  }>;
  images?: Array<{
    url: string;
    coverType: string;
    extension: string;
  }>;
  path: string;
  audiobookQualityProfileId: number;
  audiobookMetadataProfileId: number;
  monitored: boolean;
  audiobookMonitorExisting: number;
  audiobookMonitorFuture: boolean;
  audiobookRootFolderPath: string;
  genres: string[];
  cleanName: string;
  sortName: string;
  sortNameLastFirst: string;
  tags: any[];
  added: string;
  ratings: {
    votes: number;
    value: number;
    popularity: number;
  };
  lastSelectedMediaType: string;
  statistics: {
    bookFileCount: number;
    bookCount: number;
    availableBookCount: number;
    totalBookCount: number;
    sizeOnDisk: number;
    percentOfBooks: number;
  };
  nextBook?: any;
  lastBook?: any;
}

// App Display Model
export interface Author {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  monitored: boolean;
  bookCount: number;        // Total number of books (totalBookCount from API)
  availableBookCount: number; // Number of available books
  overview?: string;
  path?: string;
  sizeOnDisk?: number;
}

export type AuthorSort =
  | 'monitored'
  | 'firstName'
  | 'lastName'
  | 'bookCount';

// Helper function to convert API response to app model
export function mapChaptarrAuthorToAuthor(chaptarrAuthor: ChaptarrAuthor): Author {
  // Extract first and last name from authorName
  const nameParts = chaptarrAuthor.authorName.split(' ');
  const lastName = nameParts.pop() || '';
  const firstName = nameParts.join(' ');
  
  // Get the first poster image if available
  const posterImage = chaptarrAuthor.images?.find(img => img.coverType === 'poster');
  
  return {
    id: chaptarrAuthor.id.toString(),
    firstName,
    lastName,
    imageUrl: posterImage?.url,
    monitored: chaptarrAuthor.monitored,
    bookCount: chaptarrAuthor.statistics?.totalBookCount || 0,
    availableBookCount: chaptarrAuthor.statistics?.availableBookCount || 0,
    overview: chaptarrAuthor.overview,
    path: chaptarrAuthor.path,
    sizeOnDisk: chaptarrAuthor.statistics?.sizeOnDisk
  };
}
