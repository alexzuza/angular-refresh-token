import { Injectable } from '@angular/core';
import { BehaviorSubject, defer, Observable, of } from 'rxjs';
import { catchError, delay, filter, take, tap } from 'rxjs/operators';

export interface RefreshTokenResult {
  accessToken: string;
}

@Injectable()
export class AuthService {
  private tokenSubject$ = new BehaviorSubject<string | null>(null);

  token$ = this.tokenSubject$.pipe(
    filter((token) => token !== null),
    take(1)
  );

  refreshToken$: Observable<any> = defer(() => {
    if (this.tokenSubject$.value === null) {
      return this.token$;
    }
    // Defer allows us to easily execute some action when the Observable
    // is subscribed. Here, we set the current token to `null` until the
    // refresh operation is complete. This ensures no requests will be
    // sent with a known bad token.
    this.tokenSubject$.next(null);

    return this.refreshToken().pipe(
      tap((res) => {
        this.tokenSubject$.next(res.accessToken);
      }),
      catchError((err) => {
        this.logout();
        throw err;
      })
    );
  });

  get token(): string | null {
    return this.tokenSubject$.value;
  }

  authenticate(): void {
    this.tokenSubject$.next('someToken');
  }

  refreshToken(): Observable<RefreshTokenResult> {
    return of({
      accessToken: 'newToken',
    }).pipe(
      delay(0),
    );
  }

  logout(): void {}
}
