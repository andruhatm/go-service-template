import { Component, OnInit, OnDestroy } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { HttpClient } from '@angular/common/http';
import { first } from 'rxjs/operators'; // Для вызова вашего Go API
import { KeycloakAuthService } from './core/auth/keycloak-auth.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styles: [`
    div { margin-bottom: 10px; }
    button { margin-right: 10px; padding: 8px 15px; cursor: pointer; }
    textarea { width: 100%; box-sizing: border-box; }
    pre { background-color: #f0f0f0; padding: 10px; border-radius: 5px; white-space: pre-wrap; word-break: break-all; }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  private authSubscription?: Subscription;
  
  isLoggedIn = false;
  username: string | undefined;
  token: string = '';
  apiResponse: any;
  userAdmin: boolean = false;

  constructor(
    private keycloakService: KeycloakService, 
    private http: HttpClient,
    private keycloakAuthService: KeycloakAuthService
  ) {}

  async ngOnInit() {
    // Initialize the auth service - this will cache the auth state
    await this.keycloakAuthService.initialize();

    // Subscribe to auth state changes
    this.authSubscription = this.keycloakAuthService.authState$.subscribe(authState => {
      this.isLoggedIn = authState.isAuthenticated;
      this.userAdmin = authState.isAdmin;
      this.username = authState.username;

      console.log('AppComponent - isLoggedIn:', this.isLoggedIn);
      console.log('AppComponent - userAdmin:', this.userAdmin);
      console.log('AppComponent - username:', this.username);
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
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
