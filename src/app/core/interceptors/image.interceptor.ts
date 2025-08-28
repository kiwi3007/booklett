import { HttpInterceptorFn } from '@angular/common/http';

export const imageInterceptor: HttpInterceptorFn = (req, next) => {
  // Only modify image requests (where responseType is 'blob')
  if (req.responseType === 'blob') {
    const imageHeaders = req.headers
      .set('Accept', 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8');

    const imageReq = req.clone({
      headers: imageHeaders
    });
    return next(imageReq);
  }

  // For all other requests, pass through unchanged
  return next(req);
};
