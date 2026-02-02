import { Component, OnInit, OnDestroy } from '@angular/core';
import { CurrentUserService } from '../../../core/auth/current-user.service';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.sass']
})
export class UserMenuComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  username: string | undefined;
  token: string = '';
  apiResponse: any;
  
  // Notifications
  notifications: Notification[] = [];
  unreadCount = 0;
  loading = false;
  private notificationSubscription?: Subscription;
  private unreadCountSubscription?: Subscription;

  constructor(
    private keycloakService: KeycloakService, 
    private http: HttpClient,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.isLoggedIn = await this.keycloakService.isLoggedIn();

    if (this.isLoggedIn) {
      const userProfile = await this.keycloakService.loadUserProfile();
      this.username = userProfile.username;
      
      // Initialize notifications
      this.initNotifications();
    }
  }

  ngOnDestroy() {
    this.notificationSubscription?.unsubscribe();
    this.unreadCountSubscription?.unsubscribe();
  }

  initNotifications(): void {
    // Subscribe to unread count
    this.unreadCountSubscription = this.notificationService.unreadCount$
      .subscribe(count => {
        this.unreadCount = count;
      });

    // Load initial notifications
    this.loadNotifications();

    // Start polling for notifications (every 30 seconds)
    this.notificationSubscription = this.notificationService
      .pollNotifications(30000)
      .subscribe(response => {
        this.notifications = response?.notifications || [];
      });
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications(20, 0).subscribe({
      next: (response) => {
        this.notifications = response?.notifications || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
        this.notifications = [];
        this.loading = false;
      }
    });
  }

  onMenuOpened(): void {
    // Reload notifications when menu is opened
    this.loadNotifications();
  }

  onNotificationClick(notification: Notification): void {
    // Mark as read if unread
    if (notification.status === 'unread') {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        notification.status = 'read' as any;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      });
    }

    // Navigate to related item
    if (notification.related_type === 'forecast' && notification.related_id) {
      this.router.navigate(['/anomaly', notification.related_id]);
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      if (this.notifications && Array.isArray(this.notifications)) {
        this.notifications.forEach(n => n.status = 'read' as any);
      }
      this.unreadCount = 0;
    });
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification.id).subscribe(() => {
      this.notifications = (this.notifications || []).filter(n => n.id !== notification.id);
      if (notification.status === 'unread') {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'forecast_completed':
        return 'check_circle';
      case 'forecast_failed':
        return 'error';
      case 'forecast_created':
        return 'add_circle';
      case 'forecast_processing':
        return 'hourglass_empty';
      default:
        return 'notifications';
    }
  }

  getNotificationIconClass(type: string): string {
    switch (type) {
      case 'forecast_completed':
        return 'icon-success';
      case 'forecast_failed':
        return 'icon-error';
      case 'forecast_created':
      case 'forecast_processing':
        return 'icon-info';
      default:
        return 'icon-default';
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} д назад`;
    
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
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


