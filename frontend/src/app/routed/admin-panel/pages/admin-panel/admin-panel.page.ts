import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { KeycloakAdminService, KeycloakStats } from '../../services/keycloak-admin.service';

@Component({
  templateUrl: './admin-panel.page.html',
  styleUrls: ['./admin-panel.page.css']
})
export class AdminPanelPage implements OnInit {
  stats: KeycloakStats | null = null;
  loading = true;
  error: string | null = null;
  keycloakAdminUrl = '';

  constructor(
    private titleService: Title,
    private keycloakAdminService: KeycloakAdminService
  ) {
    this.titleService.setTitle('Панель администратора');
  }

  ngOnInit(): void {
    this.keycloakAdminUrl = this.keycloakAdminService.getKeycloakAdminUrl();
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;

    this.keycloakAdminService.getKeycloakStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading Keycloak stats:', err);
        this.error = 'Ошибка загрузки статистики';
        this.loading = false;
      }
    });
  }

  openKeycloakAdmin(): void {
    window.open(this.keycloakAdminUrl, '_blank');
  }

  refreshStats(): void {
    this.loadStats();
  }

  getSuccessRate(): number {
    if (!this.stats || !this.stats.loginEvents || this.stats.loginEvents === 0) {
      return 0;
    }
    const successful = this.stats.loginEvents - (this.stats.loginErrors || 0);
    return Math.round((successful / this.stats.loginEvents) * 100);
  }

  getErrorRate(): number {
    if (!this.stats || !this.stats.loginEvents || this.stats.loginEvents === 0) {
      return 0;
    }
    return Math.round(((this.stats.loginErrors || 0) / this.stats.loginEvents) * 100);
  }
}



