/**
 * Utility functions for handling image URLs from the Chaptarr server
 */

/**
 * Resolves an image URL to ensure it's absolute
 * If the URL is relative (starts with /), prepends the server base URL
 * @param imageUrl The image URL from the server
 * @param serverBaseUrl The base URL of the server
 * @returns The absolute image URL
 */
export function resolveImageUrl(imageUrl: string | null | undefined, serverBaseUrl: string | null, apiKey?: string | null): string {
  if (!imageUrl) {
    return 'assets/no-cover.svg';
  }

  // If no server URL is configured, return the default image
  if (!serverBaseUrl) {
    return 'assets/no-cover.svg';
  }

  // Transform MediaCover URLs to the authenticated api/v1 form with apikey
  // e.g. /MediaCover/Books/3044/cover.jpg?x -> <base>/api/v1/MediaCover/Books/3044/cover.jpg?x&apikey=KEY
  const mediaMatch = /^\/?(MediaCover\/.*)$/i.exec(imageUrl);
  if (mediaMatch) {
    const mediaPath = mediaMatch[1];
    try {
      if (!apiKey) return 'assets/no-cover.svg';
      const base = serverBaseUrl.endsWith('/') ? serverBaseUrl.slice(0, -1) : serverBaseUrl;
      const u = new URL(`${base}/api/v1/${mediaPath}`);
      u.searchParams.append('apikey', apiKey);
      return u.toString();
    } catch {
      return 'assets/no-cover.svg';
    }
  }

  // If it's already an absolute URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a relative URL starting with /, prepend the server base URL
  if (imageUrl.startsWith('/')) {
    return `${serverBaseUrl}${imageUrl}`;
  }

  // For any other format, assume it's relative and prepend base URL with /
  return `${serverBaseUrl}/${imageUrl}`;
}

/**
 * Gets the book cover image URL
 * @param book The book object
 * @param serverBaseUrl The base URL of the server
 * @returns The absolute book cover URL
 */
export function getBookCoverUrl(book: any, serverBaseUrl: string | null, apiKey?: string | null): string {
  if (!book) {
    return 'assets/no-cover.svg';
  }

  // Check for images array
  if (book.images && Array.isArray(book.images) && book.images.length > 0) {
    const cover = book.images.find((img: any) => img.coverType === 'cover');
    if (cover?.url) {
      return resolveImageUrl(cover.url, serverBaseUrl, apiKey);
    }
  }

  // Check for direct imageUrl property
  if (book.imageUrl) {
    return resolveImageUrl(book.imageUrl, serverBaseUrl, apiKey);
  }

  return 'assets/no-cover.svg';
}

/**
 * Gets the author image URL
 * @param author The author object
 * @param serverBaseUrl The base URL of the server
 * @returns The absolute author image URL
 */
export function getAuthorImageUrl(author: any, serverBaseUrl: string | null, apiKey?: string | null): string {
  if (!author) {
    return 'assets/no-cover.svg';
  }

  // Check for imageUrl property
  if (author.imageUrl) {
    return resolveImageUrl(author.imageUrl, serverBaseUrl, apiKey);
  }

  // Check for images array
  if (author.images && Array.isArray(author.images) && author.images.length > 0) {
    const primaryImage = author.images.find((img: any) => img.coverType === 'poster' || img.coverType === 'primary');
    if (primaryImage?.url) {
      return resolveImageUrl(primaryImage.url, serverBaseUrl, apiKey);
    }
    // Fallback to first image
    if (author.images[0]?.url) {
      return resolveImageUrl(author.images[0].url, serverBaseUrl, apiKey);
    }
  }

  return 'assets/no-cover.svg';
}
