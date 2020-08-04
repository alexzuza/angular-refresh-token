<h1 align="center">Angular refresh token interceptors :repeat_one:</h1> 

Three ways to refresh token with Angular Http Interceptor

- Brute force solution with `tokenRefreshed$` BehaviorSubject as a semaphore
- Using `caught` parameter in `catchError` rxjs operator to retry request failed request
- Using `retryWhen` operator

## Features

- ✅ Refresh token only once for multiple requests
- ✅ Log out user if refreshToken failed
- ✅ Log out if user gets an error after first refreshing
- ✅ Queue all requests while token is being refreshed(except `BruteForceInterceptor`)
- ✅ Tests for all cases above

## Usage

Add HttpInterceptor in `providers` section of your `AppModule`:

```ts
@NgModule({
  imports: [
    HttpClientModule
  ],
  providers: [
    AuthService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RetryWhenInterceptor,
      multi: true
    },
  ],
})
export class AuthModule { }
```
