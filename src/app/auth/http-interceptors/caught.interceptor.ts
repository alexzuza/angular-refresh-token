import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../auth.service';
import { concat, Observable, throwError } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';

@Injectable()
export class CaughtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let retries = 0;
    return this.authService.token$.pipe(
      map(token => req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })),
      concatMap(authReq => next.handle(authReq)),
      // Catch the 401 and handle it by refreshing the token and restarting the chain
      // (where a new subscription to this.auth.token will get the latest token).
      catchError((err, restart) => {
        // If the request is unauthorized, try refreshing the token before restarting.
        if (err.status === 401 && retries === 0) {
          retries++;

          return concat(this.authService.refreshToken$, restart);
        }

        if (retries > 0) {
          this.authService.logout();
        }

        return throwError(err);
      })
    );
  }
}

