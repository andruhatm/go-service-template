# Notifications API Guide

## Обзор

Система уведомлений предназначена для информирования пользователей о важных событиях в приложении, таких как:
- Создание прогноза
- Обработка прогноза
- Успешное завершение прогноза
- Ошибка при выполнении прогноза

## Миграция базы данных

Таблица уведомлений создается миграцией `000010_create_notifications_table.up.sql`:

```sql
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id VARCHAR(255),
    related_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    expires_at TIMESTAMP
);
```

## API Endpoints

### 1. Получить список всех уведомлений

**GET** `/api/notifications`

Возвращает список уведомлений текущего пользователя с пагинацией.

**Query Parameters:**
- `limit` (optional, default: 50, max: 100) - количество записей
- `offset` (optional, default: 0) - смещение для пагинации

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "user-123",
      "type": "forecast_created",
      "title": "Прогноз создан",
      "message": "Ваш запрос на прогнозирование метрики X для объекта Y был успешно создан",
      "related_id": "forecast-uuid",
      "related_type": "forecast",
      "status": "unread",
      "created_at": "2026-01-18T10:00:00Z",
      "read_at": null,
      "expires_at": "2026-01-25T10:00:00Z"
    }
  ],
  "total": 10,
  "unread_count": 5,
  "limit": 50,
  "offset": 0
}
```

### 2. Получить непрочитанные уведомления

**GET** `/api/notifications/unread`

Возвращает только непрочитанные уведомления текущего пользователя.

**Query Parameters:**
- `limit` (optional, default: 20, max: 50) - количество записей

**Response:**
```json
{
  "notifications": [...],
  "unread_count": 5,
  "limit": 20
}
```

### 3. Получить конкретное уведомление

**GET** `/api/notifications/{id}`

Возвращает информацию о конкретном уведомлении.

**Response:**
```json
{
  "id": "uuid",
  "user_id": "user-123",
  "type": "forecast_completed",
  "title": "Прогноз готов",
  "message": "Прогнозирование метрики X для объекта Y успешно завершено",
  "related_id": "forecast-uuid",
  "related_type": "forecast",
  "status": "unread",
  "created_at": "2026-01-18T10:00:00Z"
}
```

### 4. Отметить уведомление как прочитанное

**PUT** `/api/notifications/{id}/read`

Отмечает конкретное уведомление как прочитанное.

**Response:** `204 No Content`

### 5. Отметить все уведомления как прочитанные

**PUT** `/api/notifications/mark-all-read`

Отмечает все непрочитанные уведомления пользователя как прочитанные.

**Response:** `204 No Content`

### 6. Удалить уведомление

**DELETE** `/api/notifications/{id}`

Удаляет конкретное уведомление.

**Response:** `204 No Content`

### 7. Создать уведомление (только для админов)

**POST** `/api/notifications`

Создает новое уведомление. Доступно только пользователям с ролью `ROLE_ADMIN`.

**Request Body:**
```json
{
  "user_id": "user-123",
  "type": "system",
  "title": "Системное уведомление",
  "message": "Важная информация для пользователя",
  "related_id": "optional-related-id",
  "related_type": "optional-type",
  "expires_at": "2026-01-25T10:00:00Z"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "user_id": "user-123",
  "type": "system",
  "title": "Системное уведомление",
  "message": "Важная информация для пользователя",
  "status": "unread",
  "created_at": "2026-01-18T10:00:00Z"
}
```

## Типы уведомлений

### Forecast-related notifications

1. **forecast_created** - Прогноз создан и отправлен на обработку
2. **forecast_processing** - Прогноз начал обрабатываться
3. **forecast_completed** - Прогноз успешно завершен
4. **forecast_failed** - Ошибка при выполнении прогноза

### System notifications

- **system** - Общие системные уведомления

## Статусы уведомлений

- **unread** - Непрочитанное (по умолчанию)
- **read** - Прочитанное
- **dismissed** - Отклоненное

## Автоматическое создание уведомлений

Уведомления автоматически создаются при следующих событиях:

### 1. Создание прогноза
Когда пользователь создает новый запрос на прогнозирование через `POST /api/forecasts`, автоматически создается уведомление типа `forecast_created`.

### 2. Начало обработки прогноза
Когда прогноз начинает обрабатываться сервисом прогнозирования, создается уведомление типа `forecast_processing`.

### 3. Успешное завершение прогноза
Когда прогноз успешно завершается, создается уведомление типа `forecast_completed`.

### 4. Ошибка прогноза
При любой ошибке в процессе прогнозирования создается уведомление типа `forecast_failed` с описанием ошибки.

## Пример использования в Frontend

### Получение непрочитанных уведомлений при загрузке

```typescript
async getUnreadNotifications(): Promise<Notification[]> {
  const response = await this.http.get<NotificationResponse>(
    `${this.apiUrl}/notifications/unread?limit=20`
  ).toPromise();
  return response.notifications;
}
```

### Периодическая проверка новых уведомлений (polling)

```typescript
startNotificationPolling() {
  this.pollingSubscription = interval(30000) // каждые 30 секунд
    .pipe(
      switchMap(() => this.getUnreadNotifications())
    )
    .subscribe(notifications => {
      this.showNotifications(notifications);
    });
}
```

### WebSocket альтернатива (будущая реализация)

Для real-time уведомлений рекомендуется реализовать WebSocket соединение вместо polling.

### Отметить уведомление как прочитанное

```typescript
async markAsRead(notificationId: string): Promise<void> {
  await this.http.put(
    `${this.apiUrl}/notifications/${notificationId}/read`,
    {}
  ).toPromise();
}
```

### Отобразить всплывающее уведомление

```typescript
showNotification(notification: Notification) {
  // Используйте Angular Material Snackbar или другой UI компонент
  this.snackBar.open(notification.message, 'Закрыть', {
    duration: 5000,
    horizontalPosition: 'right',
    verticalPosition: 'top',
    panelClass: this.getNotificationClass(notification.type)
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
```

## Срок действия уведомлений

Уведомления автоматически удаляются через 7 дней после создания (параметр `expires_at`). Для очистки истекших уведомлений можно настроить cron-задачу или периодический job.

## Безопасность

- Все endpoints уведомлений требуют аутентификации
- Пользователи могут видеть только свои уведомления
- Создание уведомлений напрямую доступно только администраторам
- Система автоматически проверяет ownership при всех операциях

## Рекомендации для Frontend

1. **Показывать badge с количеством непрочитанных уведомлений** в header приложения
2. **Использовать polling** (каждые 30-60 секунд) для проверки новых уведомлений
3. **Отображать всплывающие уведомления** при получении новых уведомлений
4. **Создать отдельную страницу** для просмотра истории всех уведомлений
5. **Группировать уведомления** по типу или дате
6. **Автоматически отмечать как прочитанные** при просмотре связанной сущности (например, открытии прогноза)

## Интеграция с существующим кодом

Для интеграции уведомлений в страницу аномалий (`anomalypage.component.ts`), создайте сервис уведомлений и подпишитесь на новые уведомления в компоненте.

### Пример сервиса

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/api/notifications';

  constructor(private http: HttpClient) {}

  getUnreadNotifications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/unread`);
  }

  pollNotifications(intervalMs: number = 30000): Observable<any> {
    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getUnreadNotifications())
    );
  }

  markAsRead(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/mark-all-read`, {});
  }
}
```

### Использование в компоненте

```typescript
export class AnomalypageComponent implements OnInit, OnDestroy {
  private notificationSubscription: Subscription;

  constructor(
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Подписаться на уведомления
    this.notificationSubscription = this.notificationService
      .pollNotifications(30000)
      .subscribe(response => {
        if (response.notifications && response.notifications.length > 0) {
          // Показать последнее уведомление
          const latest = response.notifications[0];
          this.showNotificationToast(latest);
        }
      });
  }

  ngOnDestroy() {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  showNotificationToast(notification: any) {
    this.snackBar.open(notification.message, 'Просмотр', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    }).onAction().subscribe(() => {
      // Отметить как прочитанное и перейти к прогнозу
      this.notificationService.markAsRead(notification.id).subscribe();
      if (notification.related_type === 'forecast') {
        this.router.navigate(['/forecasts', notification.related_id]);
      }
    });
  }
}
```

## Примеры curl запросов

```bash
# Получить непрочитанные уведомления
curl -X GET "http://localhost:8080/api/notifications/unread" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Отметить уведомление как прочитанное
curl -X PUT "http://localhost:8080/api/notifications/{id}/read" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Отметить все как прочитанные
curl -X PUT "http://localhost:8080/api/notifications/mark-all-read" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Удалить уведомление
curl -X DELETE "http://localhost:8080/api/notifications/{id}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

