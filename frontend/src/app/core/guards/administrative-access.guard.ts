import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { CurrentUserService } from '../auth/current-user.service';
import { first, map } from 'rxjs/operators';
import { Role } from '../auth/role.model';

@Injectable({
  providedIn: 'root'
})
export class AdministrativeAccessGuard implements CanActivate {
  constructor(private readonly currentUser: CurrentUserService) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.currentUser.user$.pipe(
      first(),
      map((user) => user.hasRole(Role.ROLE_ADMIN))
    );
  }
}
