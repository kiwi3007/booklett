import { HttpInterceptorFn } from '@angular/common/http';

export const imageInterceptor: HttpInterceptorFn = (req, next) => {
  // Keep image requests simple - do not add custom headers that could trigger preflight.
  // Let the api interceptor attach apiKey via query param for MediaCover blob requests.
  return next(req);
};
