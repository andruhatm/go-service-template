import { KeycloakService } from 'keycloak-angular';

export function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'http://localhost:8080', // URL вашего Keycloak сервера
        realm: 'myrealm',           // Название вашего реалма из docker-compose (KEYCLOAK_ISSUER)
        clientId: 'spa-client'      // ID вашего клиента SPA в Keycloak
      },
      initOptions: {
        onLoad: 'check-sso', // 'login-required' для обязательной авторизации при загрузке, 'check-sso' для проверки сессии
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html'
      },
      enableBearerInterceptor: true, // Включает перехватчик для автоматического добавления токена к HTTP-запросам
    });
}
