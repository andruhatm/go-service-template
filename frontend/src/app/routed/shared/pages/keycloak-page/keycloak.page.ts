import {Component, OnInit} from '@angular/core';
import { JsonPipe, NgIf } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'keycloak-page',
  templateUrl: './keycloak.page.html',
  standalone: true,
  imports: [JsonPipe, NgIf],
  styleUrls: ['./keycloak.page.sass']
})
export class KeycloakPage implements OnInit {
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
