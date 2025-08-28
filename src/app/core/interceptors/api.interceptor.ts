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

  // Add API key header for every request if set
  const apiKey = config.getApiKeySync();
  const headers = apiKey ? req.headers.set('X-Api-Key', apiKey) : req.headers;
  
  // Clone with updated URL and headers
  const cloned = req.clone({ url, headers });
  return next(cloned);
};
