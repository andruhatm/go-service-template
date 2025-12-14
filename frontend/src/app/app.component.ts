import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { HttpClient } from '@angular/common/http';
import { first } from 'rxjs/operators'; // Для вызова вашего Go API


@Component({
  selector: 'app-root',
  template: `
    <h1>Интеграция с Keycloak</h1>
    <div *ngIf="!isLoggedIn">
      <p>Вы не авторизованы.</p>
      <button (click)="login()">Войти через Keycloak</button>
    </div>
    <div *ngIf="isLoggedIn">
      <p>Привет, {{ username }}!</p>
      <button (click)="logout()">Выйти</button>
      <button (click)="getToken()">Получить Access Token</button>
      <button (click)="callApi()">Вызвать Go API (защищенный эндпоинт)</button>

      <div *ngIf="token">
        <h3>Ваш Access Token:</h3>
        <textarea rows="5" cols="50" [value]="token" readonly></textarea>
      </div>

      <div *ngIf="apiResponse">
        <h3>Ответ от Go API:</h3>
        <pre>{{ apiResponse | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    div { margin-bottom: 10px; }
    button { margin-right: 10px; padding: 8px 15px; cursor: pointer; }
    textarea { width: 100%; box-sizing: border-box; }
    pre { background-color: #f0f0f0; padding: 10px; border-radius: 5px; white-space: pre-wrap; word-break: break-all; }
  `]
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  username: string | undefined;
  token: string = '';
  apiResponse: any;

  constructor(private keycloakService: KeycloakService, private http: HttpClient) {}

  async ngOnInit() {
    this.isLoggedIn = await this.keycloakService.isLoggedIn();

    if (this.isLoggedIn) {
      const userProfile = await this.keycloakService.loadUserProfile();
      this.username = userProfile.username;
    }
  }

  login() {
    // Перенаправляет на страницу входа Keycloak
    this.keycloakService.login();
  }

  logout() {
    // Перенаправляет на страницу выхода Keycloak
    this.keycloakService.logout();
  }

  async getToken() {
    // Получение текущего Access Token
    this.token = await this.keycloakService.getToken();
    console.log('Access Token:', this.token);
  }

  async callApi() {
    try {
      // Keycloak-angular автоматически добавит Bearer Token к этому запросу,
      // благодаря 'enableBearerInterceptor: true' в keycloak-initializer.ts
      const response = await this.http.get('http://localhost:8081/protected').pipe(first()).subscribe(res => {
        this.apiResponse = res;
      });
      this.apiResponse = response;
      console.log('API Response:', response);
    } catch (error: any) {
      this.apiResponse = { error: `Ошибка при вызове API: ${error.message}` };
      console.error('Error calling API:', error);
    }
  }
}
