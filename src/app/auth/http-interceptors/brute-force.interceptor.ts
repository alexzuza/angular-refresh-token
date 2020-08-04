import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { throwError, Observable, BehaviorSubject } from 'rxjs';
import { catchError, concatMap, filter, finalize, take } from 'rxjs/operators';

import { environment } from '@app/env';
import { AuthService, RefreshTokenResult } from '../auth.service';

@Injectable()
export class BruteForceInterceptor implements HttpInterceptor {
  isRefreshingToken = false;

  tokenRefreshed$ = new BehaviorSubject<boolean>(false);

  constructor(private authService: AuthService) {}

  addToken(req: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.token;
    return token ? req.clone({ setHeaders: { Authorization: 'Bearer ' + token } }) : req;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(this.addToken(req)).pipe(
      catchError(err => {
        if (err.status === 401) {
          return this.handle401Error(req, next);
        }

        return throwError(err);
      })
    );
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    if (this.isRefreshingToken) {
      return this.tokenRefreshed$.pipe(
        filter(Boolean),
        take(1),
        concatMap(() => next.handle(this.addToken(req)))
      );
    }

    this.isRefreshingToken = true;

    // Reset here so that the following requests wait until the token
    // comes back from the refreshToken call.
    this.tokenRefreshed$.next(false);

    return this.authService.refreshToken().pipe(
      concatMap((res: RefreshTokenResult) => {
          if (!environment.production) {
            console.info('Token was successfully refreshed'); // tslint:disable-line
          }

          this.tokenRefreshed$.next(true);
          return next.handle(this.addToken(req));
      }),
      catchError((err) => {
        this.authService.logout();
        return throwError(err);
      }),
      finalize(() => {
        this.isRefreshingToken = false;
      })
    );
  }
}
