# Frontend Integration Guide for Notifications

## Обзор

Это руководство показывает, как интегрировать систему уведомлений в Angular frontend.

## Созданные файлы

✅ **`frontend/src/app/core/models/notification.model.ts`**
- Интерфейсы и enums для уведомлений

✅ **`frontend/src/app/core/services/notification.service.ts`**
- Сервис для работы с API уведомлений
- Методы для получения, отметки прочитанным, удаления
- Polling механизм
- BehaviorSubject для реактивного отслеживания количества непрочитанных

## Шаг 1: Проверить структуру директорий

Убедитесь, что созданы директории:
```
frontend/src/app/
  └── core/
      ├── models/
      │   └── notification.model.ts  ✅
      └── services/
          └── notification.service.ts  ✅
```

Если папки не существуют, создайте их:
```bash
mkdir -p frontend/src/app/core/models
mkdir -p frontend/src/app/core/services
```

## Шаг 2: Убедиться в наличии HttpClient

В `app.module.ts` должен быть импортирован `HttpClientModule`:

```typescript
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    // ...
    HttpClientModule,
    // ...
  ]
})
export class AppModule { }
```

## Шаг 3: Добавить MatSnackBarModule (для toast уведомлений)

Если используете Angular Material:

```typescript
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({
  imports: [
    // ...
    MatSnackBarModule,
    // ...
  ]
})
export class AppModule { }
```

Если не используете Angular Material, можете использовать любую другую библиотеку для toast/alert.

## Шаг 4: Интегрировать в Anomaly Page Component

### Вариант A: Минимальная интеграция (только toast)

Обновите `anomalypage.component.ts`:

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification, NotificationType } from '../../../core/models/notification.model';

@Component({
  selector: 'app-anomaly',
  templateUrl: './anomalypage.component.html',
  styleUrls: ['./anomalypage.component.css']
})
export class AnomalypageComponent implements OnInit, OnDestroy {
  private notificationSubscription?: Subscription;
  private lastNotificationId?: string;

  constructor(
    private readonly fb: FormBuilder,
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Start polling for notifications every 30 seconds
    this.notificationSubscription = this.notificationService
      .pollNotifications(30000)
      .subscribe(response => {
        if (response.notifications && response.notifications.length > 0) {
          const latestNotification = response.notifications[0];
          
          // Only show if it's a new notification (different from last shown)
          if (latestNotification.id !== this.lastNotificationId) {
            this.lastNotificationId = latestNotification.id;
            this.showNotificationToast(latestNotification);
          }
        }
      });
  }

  ngOnDestroy(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  private showNotificationToast(notification: Notification): void {
    const config = this.getSnackBarConfig(notification.type);
    
    const snackBarRef = this.snackBar.open(
      notification.message,
      'Просмотр',
      {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        ...config
      }
    );

    snackBarRef.onAction().subscribe(() => {
      // Mark as read
      this.notificationService.markAsRead(notification.id).subscribe();
      
      // Navigate to related item if needed
      if (notification.related_type === 'forecast' && notification.related_id) {
        // TODO: Navigate to forecast detail page
        console.log('Navigate to forecast:', notification.related_id);
      }
    });
  }

  private getSnackBarConfig(type: NotificationType): any {
    switch (type) {
      case NotificationType.FORECAST_COMPLETED:
        return {
          panelClass: ['notification-success'],
          duration: 5000
        };
      case NotificationType.FORECAST_FAILED:
        return {
          panelClass: ['notification-error'],
          duration: 8000
        };
      case NotificationType.FORECAST_CREATED:
      case NotificationType.FORECAST_PROCESSING:
        return {
          panelClass: ['notification-info'],
          duration: 4000
        };
      default:
        return {
          panelClass: ['notification-default'],
          duration: 5000
        };
    }
  }
}
```

### Вариант B: Полная интеграция (с UI для списка уведомлений)

Добавьте в HTML template (`anomalypage.component.html`):

```html
<!-- Notification badge в header или toolbar -->
<button mat-icon-button [matMenuTriggerFor]="notificationMenu">
  <mat-icon [matBadge]="unreadCount" matBadgeColor="warn">
    notifications
  </mat-icon>
</button>

<mat-menu #notificationMenu="matMenu" class="notification-menu">
  <div class="notification-header" (click)="$event.stopPropagation()">
    <h3>Уведомления</h3>
    <button mat-button (click)="markAllAsRead()" *ngIf="unreadCount > 0">
      Отметить все
    </button>
  </div>
  
  <div class="notification-list">
    <div *ngIf="notifications.length === 0" class="no-notifications">
      Нет уведомлений
    </div>
    
    <mat-list>
      <mat-list-item 
        *ngFor="let notification of notifications" 
        [class.unread]="notification.status === 'unread'"
        (click)="onNotificationClick(notification)">
        <mat-icon mat-list-icon [class]="getNotificationIconClass(notification.type)">
          {{ getNotificationIcon(notification.type) }}
        </mat-icon>
        <div mat-line>
          <strong>{{ notification.title }}</strong>
        </div>
        <div mat-line class="notification-message">
          {{ notification.message }}
        </div>
        <div mat-line class="notification-time">
          {{ notification.created_at | date:'short' }}
        </div>
      </mat-list-item>
    </mat-list>
  </div>
  
  <div class="notification-footer" (click)="$event.stopPropagation()">
    <button mat-button (click)="viewAllNotifications()">
      Показать все
    </button>
  </div>
</mat-menu>
```

И обновите компонент:

```typescript
export class AnomalypageComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  private notificationSubscription?: Subscription;
  private unreadCountSubscription?: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private notificationService: NotificationService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to unread count
    this.unreadCountSubscription = this.notificationService.unreadCount$
      .subscribe(count => {
        this.unreadCount = count;
      });

    // Start polling
    this.notificationSubscription = this.notificationService
      .pollNotifications(30000)
      .subscribe(response => {
        this.notifications = response.notifications;
        
        // Show toast for new notifications
        if (response.notifications.length > 0) {
          const latestNotification = response.notifications[0];
          this.showNotificationToast(latestNotification);
        }
      });
  }

  ngOnDestroy(): void {
    this.notificationSubscription?.unsubscribe();
    this.unreadCountSubscription?.unsubscribe();
  }

  onNotificationClick(notification: Notification): void {
    // Mark as read
    if (notification.status === 'unread') {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        notification.status = 'read' as any;
      });
    }

    // Navigate to related item
    if (notification.related_type === 'forecast' && notification.related_id) {
      this.router.navigate(['/forecasts', notification.related_id]);
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.status = 'read' as any);
      this.snackBar.open('Все уведомления отмечены как прочитанные', 'OK', {
        duration: 2000
      });
    });
  }

  viewAllNotifications(): void {
    // Navigate to notifications page if you have one
    this.router.navigate(['/notifications']);
  }

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.FORECAST_COMPLETED:
        return 'check_circle';
      case NotificationType.FORECAST_FAILED:
        return 'error';
      case NotificationType.FORECAST_CREATED:
        return 'add_circle';
      case NotificationType.FORECAST_PROCESSING:
        return 'hourglass_empty';
      default:
        return 'notifications';
    }
  }

  getNotificationIconClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.FORECAST_COMPLETED:
        return 'icon-success';
      case NotificationType.FORECAST_FAILED:
        return 'icon-error';
      case NotificationType.FORECAST_CREATED:
      case NotificationType.FORECAST_PROCESSING:
        return 'icon-info';
      default:
        return 'icon-default';
    }
  }

  private showNotificationToast(notification: Notification): void {
    // Same as Variant A
  }
}
```

## Шаг 5: Добавить стили

Создайте или обновите `anomalypage.component.css`:

```css
/* Notification toast styles */
::ng-deep .notification-success {
  background-color: #4caf50 !important;
  color: white !important;
}

::ng-deep .notification-error {
  background-color: #f44336 !important;
  color: white !important;
}

::ng-deep .notification-info {
  background-color: #2196f3 !important;
  color: white !important;
}

::ng-deep .notification-default {
  background-color: #757575 !important;
  color: white !important;
}

/* Notification menu styles */
.notification-menu {
  max-width: 400px;
  max-height: 600px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.notification-header h3 {
  margin: 0;
  font-size: 18px;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.no-notifications {
  padding: 32px;
  text-align: center;
  color: #999;
}

.mat-list-item.unread {
  background-color: #e3f2fd;
}

.notification-message {
  font-size: 13px;
  color: #666;
  white-space: normal;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-footer {
  padding: 8px;
  text-align: center;
  border-top: 1px solid #e0e0e0;
}

/* Icon colors */
.icon-success {
  color: #4caf50;
}

.icon-error {
  color: #f44336;
}

.icon-info {
  color: #2196f3;
}

.icon-default {
  color: #757575;
}
```

## Шаг 6: Добавить в глобальные стили (опционально)

В `styles.scss`:

```scss
// Notification snackbar animations
.mat-snack-bar-container {
  &.notification-success,
  &.notification-error,
  &.notification-info,
  &.notification-default {
    .mat-simple-snackbar {
      font-size: 14px;
    }

    .mat-simple-snackbar-action {
      color: white;
    }
  }
}
```

## Шаг 7: Тестирование

### 1. Запустить backend

```bash
cd go-api
go run main.go
```

### 2. Запустить frontend

```bash
cd frontend
npm start
```

### 3. Создать прогноз

Перейдите на страницу прогнозов и создайте новый прогноз. Через несколько секунд должно появиться toast уведомление.

### 4. Проверить консоль браузера

Откройте DevTools и проверьте:
- Network tab: запросы к `/api/notifications/unread` каждые 30 секунд
- Console: логи о получении уведомлений

## Альтернативы polling

### WebSocket (рекомендуется для production)

Вместо polling можно использовать WebSocket для real-time уведомлений:

```typescript
import { webSocket } from 'rxjs/webSocket';

export class NotificationService {
  private wsSubject$ = webSocket('ws://localhost:8080/ws/notifications');

  connectWebSocket(): void {
    this.wsSubject$.subscribe(
      notification => this.handleNewNotification(notification),
      err => console.error('WebSocket error:', err),
      () => console.log('WebSocket connection closed')
    );
  }

  private handleNewNotification(notification: Notification): void {
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    // Show toast
  }
}
```

### Server-Sent Events (SSE)

Другой вариант для односторонней связи:

```typescript
connectSSE(): void {
  const eventSource = new EventSource('/api/notifications/stream');
  
  eventSource.addEventListener('notification', (event) => {
    const notification = JSON.parse(event.data);
    this.handleNewNotification(notification);
  });
}
```

## Настройка частоты polling

По умолчанию polling происходит каждые 30 секунд. Вы можете настроить это:

```typescript
// Более частые обновления (каждые 15 секунд)
this.notificationService.pollNotifications(15000).subscribe(...);

// Менее частые обновления (каждую минуту)
this.notificationService.pollNotifications(60000).subscribe(...);
```

## Best Practices

1. **Unsubscribe в ngOnDestroy** - всегда отписывайтесь от subscriptions
2. **Показывайте только новые** - не спамьте одинаковыми уведомлениями
3. **Различайте по типу** - используйте разные цвета/иконки для разных типов
4. **Добавьте действия** - позволяйте переходить к связанному контенту
5. **Настройте длительность** - ошибки показывайте дольше, чем успехи
6. **Badge в header** - показывайте количество непрочитанных
7. **Оптимизируйте частоту** - не делайте polling слишком частым

## Troubleshooting

### Уведомления не появляются

1. Проверьте, что сервис инжектирован и инициализирован
2. Проверьте Network tab - идут ли запросы к API
3. Проверьте Console на ошибки
4. Убедитесь, что пользователь авторизован (токен валиден)

### Toast не отображается

1. Убедитесь, что `MatSnackBarModule` импортирован
2. Проверьте стили (z-index, position)
3. Проверьте, что метод `showNotificationToast` вызывается

### Слишком много уведомлений

1. Увеличьте интервал polling
2. Фильтруйте уведомления по типу
3. Показывайте только последнее уведомление
4. Добавьте debounce/throttle

## Следующие шаги

1. ✅ Базовая интеграция - завершена
2. ⏳ Создать отдельную страницу для всех уведомлений
3. ⏳ Добавить фильтрацию по типу
4. ⏳ Добавить поиск по уведомлениям
5. ⏳ Реализовать WebSocket для real-time
6. ⏳ Добавить push notifications для мобильных устройств

## Дополнительные ресурсы

- [NOTIFICATIONS_API_GUIDE.md](./NOTIFICATIONS_API_GUIDE.md) - Полное API описание
- [NOTIFICATIONS_QUICKSTART.md](./NOTIFICATIONS_QUICKSTART.md) - Быстрый старт
- [Angular Material Snackbar](https://material.angular.io/components/snack-bar/overview)
- [RxJS Documentation](https://rxjs.dev/)

