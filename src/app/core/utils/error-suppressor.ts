/**
 * Suppresses known browser extension errors in production
 * These errors come from browser extensions injecting scripts into the page
 * and are not related to the application code
 */
export function suppressBrowserExtensionErrors() {
  if (typeof window === 'undefined') return;

  const originalError = console.error;
  console.error = function(...args) {
    // Convert arguments to string to check for extension errors
    const errorString = args.join(' ');
    
    // Common extension error patterns to suppress
    const extensionErrorPatterns = [
      'MutationObserver.observe',
      'content.js',
      'injected.js',
      'extension://',
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://'
    ];
    
    // Check if this is likely an extension error
    const isExtensionError = extensionErrorPatterns.some(pattern => 
      errorString.includes(pattern)
    );
    
    // Only suppress in production
    const isProduction = !window.location.hostname.includes('localhost');
    
    if (isExtensionError && isProduction) {
      // Silently ignore extension errors in production
      return;
    }
    
    // Otherwise, call the original console.error
    originalError.apply(console, args);
  };

  // Also handle uncaught errors
  window.addEventListener('error', (event) => {
    const errorMessage = event.error?.toString() || event.message || '';
    
    // Check if it's from an extension
    if (
      errorMessage.includes('MutationObserver.observe') ||
      event.filename?.includes('extension://') ||
      event.filename?.includes('content.js') ||
      event.filename?.includes('injected.js')
    ) {
      // Prevent the error from appearing in the console
      event.preventDefault();
      return false;
    }
  });
}
