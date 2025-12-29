import { Injectable, Provider } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { CurrentUserService } from './current-user.service';
import { Observable, from } from 'rxjs';
import { first, switchMap, tap } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class TokenDemoInterceptor implements HttpInterceptor {
  constructor(
    private readonly currentUserService: CurrentUserService,
    private readonly keycloakService: KeycloakService
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log('TokenInterceptor: intercepting request to', req.url);
    
    // Get token from Keycloak service
    return from(this.keycloakService.getToken()).pipe(
      switchMap((token) => {
        console.log('TokenInterceptor: token available:', !!token);
        
        if (token) {
          const newRequest = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          
          return next.handle(newRequest).pipe(
            tap((response) => {
              console.log('TokenInterceptor: response for', req.url, response.type);
            })
          );
        }
        
        // If no token, proceed without Authorization header
        return next.handle(req);
      })
    );
  }
}

export const TOKEN_INTERCEPTOR: Provider = {
  provide: HTTP_INTERCEPTORS,
  useClass: TokenDemoInterceptor,
  multi: true
};
