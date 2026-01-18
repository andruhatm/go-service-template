# Notifications System - Quick Start Guide

## 🚀 Быстрый старт

### Шаг 1: Применить миграцию

Миграция применяется автоматически при запуске сервера:

```bash
cd go-api
go run main.go
```

Или вручную:

```bash
migrate -path go-api/db/migrations \
  -database "postgresql://user:pass@localhost:5432/dbname?sslmode=disable" \
  up
```

### Шаг 2: Проверить создание таблицы

```bash
psql -U your_user -d your_database -c "\d notifications"
```

### Шаг 3: Тестирование API

#### 3.1. Создать прогноз (автоматически создаст уведомление)

```bash
TOKEN="your_jwt_token"

curl -X POST "http://localhost:8080/api/forecasts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mon_object_name": "eNB12345",
    "metric_name": "RRCConnEstabSucc",
    "from_timestamp": 1705500000,
    "forecast_periods": 24
  }'
```

#### 3.2. Проверить уведомления

```bash
# Получить непрочитанные
curl -X GET "http://localhost:8080/api/notifications/unread" \
  -H "Authorization: Bearer $TOKEN"

# Получить все с пагинацией
curl -X GET "http://localhost:8080/api/notifications?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

#### 3.3. Отметить как прочитанное

```bash
NOTIFICATION_ID="uuid-from-previous-response"

curl -X PUT "http://localhost:8080/api/notifications/$NOTIFICATION_ID/read" \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Что создает уведомления?

| Событие | Тип уведомления | Когда создается |
|---------|----------------|-----------------|
| Создание прогноза | `forecast_created` | Сразу при POST /api/forecasts |
| Начало обработки | `forecast_processing` | Когда forecast-service начал работу |
| Успешное завершение | `forecast_completed` | Прогноз готов |
| Ошибка | `forecast_failed` | Любая ошибка в процессе |

## 🔔 Frontend интеграция

### Минимальный код для показа уведомлений

#### 1. Создайте сервис `notification.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = '/api/notifications';

  constructor(private http: HttpClient) {}

  getUnreadNotifications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/unread`);
  }

  pollNotifications(intervalMs = 30000): Observable<any> {
    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getUnreadNotifications())
    );
  }

  markAsRead(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/read`, {});
  }
}
```

#### 2. Добавьте в компонент

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService } from '@services/notification.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

export class YourComponent implements OnInit, OnDestroy {
  private notificationSub: Subscription;

  constructor(
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Polling каждые 30 секунд
    this.notificationSub = this.notificationService
      .pollNotifications(30000)
      .subscribe(response => {
        if (response.notifications?.length > 0) {
          this.showLatestNotification(response.notifications[0]);
        }
      });
  }

  showLatestNotification(notification: any) {
    const message = notification.message;
    const action = 'Просмотр';
    
    const config = {
      duration: 5000,
      horizontalPosition: 'right' as const,
      verticalPosition: 'top' as const,
      panelClass: this.getNotificationClass(notification.type)
    };

    this.snackBar.open(message, action, config)
      .onAction()
      .subscribe(() => {
        // Отметить как прочитанное
        this.notificationService.markAsRead(notification.id).subscribe();
        // Перейти к прогнозу
        if (notification.related_type === 'forecast') {
          // this.router.navigate(['/forecasts', notification.related_id]);
        }
      });
  }

  getNotificationClass(type: string): string {
    const classes = {
      'forecast_completed': 'notification-success',
      'forecast_failed': 'notification-error',
      'forecast_created': 'notification-info',
      'forecast_processing': 'notification-info'
    };
    return classes[type] || 'notification-default';
  }

  ngOnDestroy() {
    this.notificationSub?.unsubscribe();
  }
}
```

#### 3. Добавьте стили в `styles.scss`

```scss
.notification-success {
  background-color: #4caf50 !important;
  color: white !important;
}

.notification-error {
  background-color: #f44336 !important;
  color: white !important;
}

.notification-info {
  background-color: #2196f3 !important;
  color: white !important;
}

.notification-default {
  background-color: #757575 !important;
  color: white !important;
}
```

## 🎯 Простой пример использования

### В anomalypage.component.ts

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService } from '@services/notification.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-anomaly',
  templateUrl: './anomalypage.component.html',
  styleUrls: ['./anomalypage.component.css']
})
export class AnomalypageComponent implements OnInit, OnDestroy {
  private notificationSubscription: Subscription;
  unreadCount = 0;

  constructor(
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Запуск polling уведомлений каждые 30 секунд
    this.notificationSubscription = this.notificationService
      .pollNotifications(30000)
      .subscribe(response => {
        this.unreadCount = response.unread_count || 0;
        
        // Показать новые уведомления
        if (response.notifications && response.notifications.length > 0) {
          this.displayNotifications(response.notifications);
        }
      });
  }

  displayNotifications(notifications: any[]) {
    // Показываем только последнее уведомление, чтобы не спамить
    const latest = notifications[0];
    
    const snackBarRef = this.snackBar.open(
      latest.message,
      'Просмотр',
      {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: this.getNotificationClass(latest.type)
      }
    );

    snackBarRef.onAction().subscribe(() => {
      // Отметить как прочитанное
      this.notificationService.markAsRead(latest.id).subscribe();
      
      // Можно добавить переход к соответствующей странице
      console.log('Notification clicked:', latest);
    });
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'forecast_completed':
        return 'notification-success';
      case 'forecast_failed':
        return 'notification-error';
      case 'forecast_created':
      case 'forecast_processing':
        return 'notification-info';
      default:
        return 'notification-default';
    }
  }

  ngOnDestroy() {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }
}
```

## 📋 Checklist внедрения

### Backend ✅
- [x] Миграция базы данных
- [x] Модели и константы
- [x] Repository с методами CRUD
- [x] Handler для HTTP endpoints
- [x] Роуты в router.go
- [x] Интеграция с forecast handler
- [x] Документация API

### Frontend (TODO)
- [ ] Создать notification.service.ts
- [ ] Добавить в app.module.ts imports/providers
- [ ] Интегрировать в anomalypage.component.ts
- [ ] Добавить стили для уведомлений
- [ ] Создать UI компонент для списка уведомлений (опционально)
- [ ] Добавить badge с количеством непрочитанных в header
- [ ] Тестирование

## 🧪 Быстрое тестирование

### 1. Проверка через SQL

```sql
-- Посмотреть все уведомления
SELECT id, type, title, status, created_at 
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Непрочитанные по пользователю
SELECT COUNT(*) 
FROM notifications 
WHERE user_id = 'your-user-id' 
  AND status = 'unread';
```

### 2. Проверка через curl

```bash
#!/bin/bash
TOKEN="your-jwt-token"
BASE_URL="http://localhost:8080/api"

echo "=== Creating forecast ==="
FORECAST=$(curl -s -X POST "$BASE_URL/forecasts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mon_object_name": "eNB12345",
    "metric_name": "RRCConnEstabSucc",
    "from_timestamp": 1705500000,
    "forecast_periods": 24
  }')

echo $FORECAST | jq .

echo -e "\n=== Checking notifications ==="
sleep 1
curl -s -X GET "$BASE_URL/notifications/unread" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

## 🔍 Troubleshooting

### Уведомления не создаются

1. Проверьте, что миграция применена:
   ```sql
   SELECT * FROM schema_migrations WHERE version = '000010';
   ```

2. Проверьте логи сервера:
   ```bash
   tail -f go-api/logs/app.log | grep -i notification
   ```

3. Проверьте, что NotificationHandler инициализирован:
   ```go
   // В router.go должно быть:
   notificationHandler := adminhandlers.NewNotificationHandler(notificationRepo)
   forecastHandler.SetNotificationHandler(notificationHandler)
   ```

### Уведомления создаются, но не отображаются

1. Проверьте токен авторизации (JWT должен быть валидным)
2. Проверьте user_id в уведомлении совпадает с user_id из токена
3. Проверьте expires_at - уведомление могло истечь

### Слишком много уведомлений

Настройте частоту polling:
```typescript
// Вместо 30 секунд используйте 60
this.notificationService.pollNotifications(60000)
```

Или показывайте только определенные типы:
```typescript
displayNotifications(notifications: any[]) {
  const filtered = notifications.filter(n => 
    n.type === 'forecast_completed' || n.type === 'forecast_failed'
  );
  // Показать только filtered
}
```

## 📚 Дополнительная документация

- `NOTIFICATIONS_API_GUIDE.md` - Полное API описание
- `NOTIFICATIONS_IMPLEMENTATION_SUMMARY.md` - Технические детали
- `go-api/db/migrations/MIGRATION_000010_NOTIFICATIONS.md` - Описание миграции

## 🎉 Готово!

Система уведомлений готова к использованию. Теперь пользователи будут получать уведомления о:
1. ✅ Создании прогноза
2. ✅ Начале обработки
3. ✅ Успешном завершении
4. ✅ Ошибках при прогнозировании

Следующие шаги:
1. Создайте frontend сервис
2. Интегрируйте в UI компоненты
3. Протестируйте работу
4. Настройте частоту polling
5. Опционально: добавьте WebSocket для real-time обновлений

