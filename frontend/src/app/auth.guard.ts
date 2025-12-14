import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { KeycloakService, KeycloakAuthGuard } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard extends KeycloakAuthGuard {

  constructor(
    protected readonly router: Router,
    protected readonly keycloak: KeycloakService
  ) {
    super(router, keycloak);
  }

  public async isAccessAllowed(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    // Проверяем авторизацию
    if (!this.authenticated) {
      await this.keycloak.login({
        redirectUri: window.location.origin + state.url
      });
      return false;
    }

    // Проверяем роли если они указаны в data маршрута
    const requiredRoles = route.data['roles'] as string[];

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Проверяем наличие хотя бы одной требуемой роли
    const hasRequiredRole = requiredRoles.some(role =>
      this.roles.includes(role)
    );

    if (!hasRequiredRole) {
      // Перенаправляем на домашнюю страницу если нет прав
      this.router.navigate(['/']);
    }

    return hasRequiredRole;
  }
}
