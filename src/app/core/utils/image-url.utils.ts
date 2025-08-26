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
export function resolveImageUrl(imageUrl: string | null | undefined, serverBaseUrl: string | null): string {
  if (!imageUrl) {
    return 'assets/no-cover.svg';
  }

  // If no server URL is configured, return the default image
  if (!serverBaseUrl) {
    return 'assets/no-cover.svg';
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
export function getBookCoverUrl(book: any, serverBaseUrl: string | null): string {
  if (!book) {
    return 'assets/no-cover.svg';
  }

  // Check for images array
  if (book.images && Array.isArray(book.images) && book.images.length > 0) {
    const cover = book.images.find((img: any) => img.coverType === 'cover');
    if (cover?.url) {
      return resolveImageUrl(cover.url, serverBaseUrl);
    }
  }

  // Check for direct imageUrl property
  if (book.imageUrl) {
    return resolveImageUrl(book.imageUrl, serverBaseUrl);
  }

  return 'assets/no-cover.svg';
}

/**
 * Gets the author image URL
 * @param author The author object
 * @param serverBaseUrl The base URL of the server
 * @returns The absolute author image URL
 */
export function getAuthorImageUrl(author: any, serverBaseUrl: string | null): string {
  if (!author) {
    return 'assets/no-cover.svg';
  }

  // Check for imageUrl property
  if (author.imageUrl) {
    return resolveImageUrl(author.imageUrl, serverBaseUrl);
  }

  // Check for images array
  if (author.images && Array.isArray(author.images) && author.images.length > 0) {
    const primaryImage = author.images.find((img: any) => img.coverType === 'poster' || img.coverType === 'primary');
    if (primaryImage?.url) {
      return resolveImageUrl(primaryImage.url, serverBaseUrl);
    }
    // Fallback to first image
    if (author.images[0]?.url) {
      return resolveImageUrl(author.images[0].url, serverBaseUrl);
    }
  }

  return 'assets/no-cover.svg';
}
