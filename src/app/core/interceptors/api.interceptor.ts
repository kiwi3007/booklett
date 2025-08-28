import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiConfigService } from '../services/api-config.service';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(ApiConfigService);

  const baseUrl = config.getBaseUrlSync();
  let url = req.url;

  // Only prefix when a relative URL is used
  if (baseUrl && !/^https?:\/\//i.test(url)) {
    url = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  const apiKey = config.getApiKeySync();

  // For MediaCover image requests (blob), append apiKey as query param to avoid CORS preflight
  if (apiKey && req.responseType === 'blob' && /\/mediacover\//i.test(url)) {
    const u = new URL(url);
    if (!u.searchParams.has('apikey')) {
      u.searchParams.set('apikey', apiKey);
    }
    url = u.toString();
    // Do NOT set custom header for these to avoid preflight
    const cloned = req.clone({ url, headers: req.headers });
    return next(cloned);
  }

  // Default: add API key header if set
  const headers = apiKey ? req.headers.set('X-Api-Key', apiKey) : req.headers;
  const cloned = req.clone({ url, headers });
  return next(cloned);
};
