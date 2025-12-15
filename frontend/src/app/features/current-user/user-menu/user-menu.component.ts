import { Component, OnInit, SimpleChanges } from '@angular/core';
import { CurrentUserService } from '../../../core/auth/current-user.service';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.sass']
})
export class UserMenuComponent implements OnInit {
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
}


