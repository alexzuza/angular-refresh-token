import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../auth.service';
import { Observable, throwError } from 'rxjs';
import { concatMap, map, mergeMap, retryWhen, take } from 'rxjs/operators';

@Injectable()
export class RetryWhenInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.authService.token$.pipe(
      map(token => req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })),
      concatMap(authReq => next.handle(authReq)),
      retryWhen((errors: Observable<any>) => errors.pipe(
        mergeMap((error, index) => {
          // any other error than 401 with {error: 'invalid_grant'} should be ignored by this retryWhen
          if (error.status !== 401) {
            return throwError(error);
          }

          if (index === 0) {
            // first time execute refresh token logic...
            return this.authService.refreshToken$;
          }

          this.authService.logout();
          return throwError(error);
        }),
        take(2)
        // first request should refresh token and retry,
        // if there's still an error the second time is the last time and should navigate to login
      )),
    );
  }
}

