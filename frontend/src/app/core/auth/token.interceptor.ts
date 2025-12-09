import { Injectable, Provider } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { CurrentUserService } from './current-user.service';
import { Observable } from 'rxjs';
import { first, switchMap, tap } from 'rxjs/operators';

@Injectable()
export class TokenDemoInterceptor implements HttpInterceptor {
  constructor(private readonly currentUserService: CurrentUserService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log('intercepted');
    return this.currentUserService.user$.pipe(
      first(),
      switchMap(() => {
        const newRequest = req.clone({
          setHeaders: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        return next.handle(newRequest).pipe(
          tap((response) => {
            console.log('response for', req.url, response.type);
          })
        );
      })
    );
  }
}

export const TOKEN_INTERCEPTOR: Provider = {
  provide: HTTP_INTERCEPTORS,
  useClass: TokenDemoInterceptor,
  multi: true
};
