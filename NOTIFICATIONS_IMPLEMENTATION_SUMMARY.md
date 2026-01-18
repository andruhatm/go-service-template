# Notifications System Implementation Summary

## Обзор

Реализована полная система уведомлений для информирования пользователей о событиях прогнозирования.

## Созданные файлы

### 1. Миграции базы данных

**`go-api/db/migrations/000010_create_notifications_table.up.sql`**
- Создает таблицу `notifications` с полями для хранения уведомлений
- Добавляет индексы для оптимизации запросов
- Поддерживает срок действия уведомлений (expires_at)

**`go-api/db/migrations/000010_create_notifications_table.down.sql`**
- Откат миграции (удаление таблицы и индексов)

### 2. Модели

**`go-api/models/notification.go`**
- Модель `Notification` для работы с уведомлениями
- Константы для типов уведомлений:
  - `NotificationTypeForecastCreated`
  - `NotificationTypeForecastProcessing`
  - `NotificationTypeForecastCompleted`
  - `NotificationTypeForecastFailed`
  - `NotificationTypeSystem`
- Константы для статусов: `unread`, `read`, `dismissed`

### 3. Repository

**`go-api/repository/notification_repository.go`**
- `Create()` - создание уведомления
- `GetByID()` - получение по ID
- `List()` - список с пагинацией
- `ListUnread()` - непрочитанные уведомления
- `Count()` / `CountUnread()` - подсчет
- `MarkAsRead()` - отметить как прочитанное
- `MarkAllAsRead()` - отметить все как прочитанные
- `Delete()` - удаление
- `DeleteExpired()` - удаление истекших

### 4. Handler

**`go-api/handlers/notification_handler.go`**
- HTTP обработчики для всех операций с уведомлениями
- `CreateForecastNotification()` - вспомогательная функция для создания уведомлений о прогнозах

### 5. Router

**Обновлен `go-api/router/router.go`**
- Добавлены endpoints для работы с уведомлениями
- Интегрирован `NotificationHandler` с `ForecastHandler`

### 6. Forecast Handler

**Обновлен `go-api/handlers/forecast_handler.go`**
- Добавлено поле `notificationHandler`
- Добавлен метод `SetNotificationHandler()`
- Автоматическое создание уведомлений на всех этапах прогнозирования:
  - При создании прогноза
  - При начале обработки
  - При успешном завершении
  - При ошибке (в 4 точках возможных ошибок)

### 7. Документация

**`NOTIFICATIONS_API_GUIDE.md`**
- Полное описание API
- Примеры использования
- Интеграция с Frontend
- Рекомендации по реализации

**`NOTIFICATIONS_IMPLEMENTATION_SUMMARY.md`** (этот файл)
- Краткое резюме изменений

## API Endpoints

Все endpoints защищены аутентификацией (`/api` prefix):

1. `GET /api/notifications` - список всех уведомлений пользователя
2. `GET /api/notifications/unread` - непрочитанные уведомления
3. `GET /api/notifications/{id}` - конкретное уведомление
4. `PUT /api/notifications/{id}/read` - отметить как прочитанное
5. `PUT /api/notifications/mark-all-read` - отметить все как прочитанные
6. `DELETE /api/notifications/{id}` - удалить уведомление
7. `POST /api/notifications` - создать уведомление (только admin)

## Автоматические уведомления

### Сценарии создания уведомлений

#### 1. Создание прогноза
```
Пользователь → POST /api/forecasts → Создается forecast
                                    ↓
                            Уведомление: "Прогноз создан"
                                    ↓
                        Запуск async обработки
```

#### 2. Обработка прогноза
```
Обработка начата → Статус: processing
                         ↓
                Уведомление: "Прогноз в обработке"
                         ↓
            Вызов forecast-service
```

#### 3. Успешное завершение
```
Forecast service → Успешный ответ → Статус: completed
                                          ↓
                            Уведомление: "Прогноз готов"
```

#### 4. Ошибка прогноза
```
Ошибка на любом этапе → Статус: failed
                              ↓
                  Уведомление: "Ошибка прогноза"
                  (с описанием ошибки)
```

## Запуск миграции

```bash
# Применить миграцию
cd go-api
go run main.go # миграции применяются автоматически при запуске

# Или вручную с помощью golang-migrate
migrate -path db/migrations -database "postgresql://user:pass@localhost:5432/dbname?sslmode=disable" up
```

## Тестирование API

### 1. Создать прогноз (уведомление создается автоматически)

```bash
curl -X POST "http://localhost:8080/api/forecasts" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mon_object_name": "eNB12345",
    "metric_name": "RRCConnEstabSucc",
    "from_timestamp": 1705500000,
    "forecast_periods": 24
  }'
```

### 2. Проверить непрочитанные уведомления

```bash
curl -X GET "http://localhost:8080/api/notifications/unread" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Ожидаемый ответ:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "user-id",
      "type": "forecast_created",
      "title": "Прогноз создан",
      "message": "Ваш запрос на прогнозирование метрики RRCConnEstabSucc для объекта eNB12345 был успешно создан и отправлен на обработку.",
      "related_id": "forecast-uuid",
      "related_type": "forecast",
      "status": "unread",
      "created_at": "2026-01-18T10:30:00Z",
      "expires_at": "2026-01-25T10:30:00Z"
    }
  ],
  "unread_count": 1,
  "limit": 20
}
```

### 3. Отметить как прочитанное

```bash
curl -X PUT "http://localhost:8080/api/notifications/{notification-id}/read" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend интеграция

### Минимальная реализация для anomaly страницы

1. **Создать сервис** `notification.service.ts`
2. **Добавить polling** для проверки новых уведомлений (каждые 30 сек)
3. **Показывать toast/snackbar** при получении новых уведомлений
4. **Добавить badge** с количеством непрочитанных в header

### Пример кода для компонента

```typescript
// В anomalypage.component.ts
import { NotificationService } from '@services/notification.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export class AnomalypageComponent implements OnInit, OnDestroy {
  private notificationSub: Subscription;
  
  constructor(
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit() {
    // Запустить polling уведомлений
    this.notificationSub = this.notificationService
      .pollNotifications(30000) // каждые 30 сек
      .subscribe(response => {
        this.handleNewNotifications(response.notifications);
      });
  }
  
  handleNewNotifications(notifications: Notification[]) {
    notifications.forEach(notification => {
      this.showToast(notification);
    });
  }
  
  showToast(notification: Notification) {
    const config = this.getToastConfig(notification.type);
    
    this.snackBar.open(notification.message, 'Просмотр', {
      duration: 5000,
      ...config
    }).onAction().subscribe(() => {
      // Перейти к прогнозу
      this.router.navigate(['/forecasts', notification.related_id]);
      // Отметить как прочитанное
      this.notificationService.markAsRead(notification.id).subscribe();
    });
  }
  
  getToastConfig(type: string) {
    const configs = {
      'forecast_completed': { 
        panelClass: 'success-toast',
        horizontalPosition: 'right',
        verticalPosition: 'top'
      },
      'forecast_failed': { 
        panelClass: 'error-toast',
        duration: 8000
      },
      // ... другие типы
    };
    return configs[type] || {};
  }
  
  ngOnDestroy() {
    if (this.notificationSub) {
      this.notificationSub.unsubscribe();
    }
  }
}
```

## Рекомендации

### 1. Очистка истекших уведомлений

Добавить cron job или периодическую задачу:

```go
// В main.go или отдельном worker
func startNotificationCleanup(repo *repository.NotificationRepository) {
    ticker := time.NewTicker(24 * time.Hour)
    go func() {
        for range ticker.C {
            if err := repo.DeleteExpired(); err != nil {
                slog.Errorf("Failed to delete expired notifications: %v", err)
            }
        }
    }()
}
```

### 2. WebSocket для real-time уведомлений

В будущем заменить polling на WebSocket для мгновенных уведомлений:

```go
// Пример структуры
type NotificationHub struct {
    clients    map[string]*Client
    broadcast  chan *models.Notification
    register   chan *Client
    unregister chan *Client
}
```

### 3. Push уведомления

Для мобильных устройств добавить поддержку Push Notifications через:
- Firebase Cloud Messaging (FCM)
- Apple Push Notification Service (APNS)

### 4. Email уведомления

Для критических событий отправлять email:

```go
func (h *NotificationHandler) SendEmailNotification(notification *models.Notification) {
    // Интеграция с email сервисом
}
```

## Безопасность

✅ Все endpoints требуют аутентификации
✅ Проверка ownership для всех операций
✅ SQL injection защита через prepared statements
✅ Ограничение лимитов запросов (max 100)
✅ Срок действия уведомлений (7 дней)

## Производительность

- Индексы на часто используемые поля (user_id, status, created_at)
- Составной индекс для оптимизации пользовательских запросов
- Пагинация всех списков
- Автоматическое удаление истекших уведомлений

## Что дальше?

1. ✅ Миграция базы данных - создана
2. ✅ Backend API - реализован
3. ⏳ Frontend сервис - требуется создать
4. ⏳ UI компоненты - требуется создать
5. ⏳ Тестирование - требуется выполнить
6. ⏳ WebSocket интеграция - опционально

## Проверка работы

После запуска сервера и применения миграций:

1. Создайте прогноз через UI или API
2. Проверьте, что уведомление создано: `GET /api/notifications/unread`
3. Дождитесь завершения прогноза (или ошибки)
4. Проверьте, что получено уведомление о результате
5. Отметьте уведомления как прочитанные

## Поддержка

Для вопросов и проблем:
- См. полную документацию в `NOTIFICATIONS_API_GUIDE.md`
- Проверьте логи сервера для отладки
- Используйте curl примеры для тестирования API

