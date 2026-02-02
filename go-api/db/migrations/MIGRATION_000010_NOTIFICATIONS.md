# Migration 000010: Notifications Table

## Описание

Создает таблицу для хранения уведомлений пользователей о событиях в системе.

## Файлы

- `000010_create_notifications_table.up.sql` - создание таблицы
- `000010_create_notifications_table.down.sql` - откат миграции

## Структура таблицы

### Колонки

| Колонка       | Тип           | Описание                                          | Ограничения         |
|--------------|---------------|--------------------------------------------------|---------------------|
| id           | UUID          | Уникальный идентификатор уведомления             | PRIMARY KEY, auto   |
| user_id      | VARCHAR(255)  | ID пользователя из Keycloak                      | NOT NULL            |
| type         | VARCHAR(50)   | Тип уведомления                                   | NOT NULL            |
| title        | VARCHAR(255)  | Заголовок уведомления                             | NOT NULL            |
| message      | TEXT          | Текст уведомления                                 | NOT NULL            |
| related_id   | VARCHAR(255)  | ID связанной сущности (например, forecast)       | NULL                |
| related_type | VARCHAR(50)   | Тип связанной сущности                            | NULL                |
| status       | VARCHAR(50)   | Статус уведомления (unread/read/dismissed)       | DEFAULT 'unread'    |
| created_at   | TIMESTAMP     | Дата и время создания                             | DEFAULT NOW()       |
| read_at      | TIMESTAMP     | Дата и время прочтения                            | NULL                |
| expires_at   | TIMESTAMP     | Дата и время истечения срока действия             | NULL                |

### Индексы

1. `idx_notifications_user_id` - на `user_id`
2. `idx_notifications_status` - на `status`
3. `idx_notifications_created_at` - на `created_at DESC`
4. `idx_notifications_type` - на `type`
5. `idx_notifications_user_status_created` - составной на `(user_id, status, created_at DESC)`

## Типы уведомлений

### Forecast-related

- `forecast_created` - Прогноз создан
- `forecast_processing` - Прогноз обрабатывается
- `forecast_completed` - Прогноз завершен успешно
- `forecast_failed` - Ошибка при выполнении прогноза

### System

- `system` - Системные уведомления

## Статусы уведомлений

- `unread` - Непрочитанное (по умолчанию)
- `read` - Прочитанное
- `dismissed` - Отклоненное/скрытое

## Использование

### Автоматическое создание при событиях

Уведомления создаются автоматически в следующих случаях:

1. **Создание прогноза** - при `POST /api/forecasts`
2. **Начало обработки** - когда forecast service начинает обработку
3. **Успешное завершение** - когда прогноз готов
4. **Ошибка** - при любой ошибке в процессе прогнозирования

### Ручное создание (admin)

Администраторы могут создавать системные уведомления через API:

```sql
INSERT INTO notifications (user_id, type, title, message, expires_at)
VALUES ('user-123', 'system', 'Заголовок', 'Сообщение', NOW() + INTERVAL '7 days');
```

## Срок действия

По умолчанию уведомления создаются со сроком действия 7 дней:

```go
expiresTime := time.Now().Add(7 * 24 * time.Hour)
```

Истекшие уведомления должны удаляться периодической задачей.

## Примеры запросов

### Получить непрочитанные уведомления пользователя

```sql
SELECT * FROM notifications
WHERE user_id = 'user-123'
  AND status = 'unread'
  AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY created_at DESC
LIMIT 20;
```

### Подсчитать непрочитанные уведомления

```sql
SELECT COUNT(*) FROM notifications
WHERE user_id = 'user-123'
  AND status = 'unread'
  AND (expires_at IS NULL OR expires_at > NOW());
```

### Отметить уведомление как прочитанное

```sql
UPDATE notifications
SET status = 'read', read_at = NOW()
WHERE id = 'notification-uuid'
  AND user_id = 'user-123';
```

### Удалить истекшие уведомления

```sql
DELETE FROM notifications
WHERE expires_at IS NOT NULL
  AND expires_at < NOW();
```

## Связи с другими таблицами

Уведомления связаны с другими сущностями через поля:
- `related_id` - ID связанной записи
- `related_type` - тип сущности (например, "forecast", "dashboard")

Это soft relationship (без внешних ключей), что позволяет:
- Сохранять уведомления даже после удаления связанной сущности
- Использовать для любых типов сущностей
- Избежать проблем с циклическими зависимостями

## Производительность

### Оптимизация запросов

1. **Составной индекс** `(user_id, status, created_at)` оптимизирует частые запросы:
   - Получение непрочитанных уведомлений пользователя
   - Сортировка по дате

2. **Отдельные индексы** для фильтрации:
   - По типу уведомления
   - По статусу
   - По дате создания

### Рекомендации

1. Регулярно очищать истекшие уведомления (cron job)
2. Архивировать старые прочитанные уведомления (> 30 дней)
3. Мониторить размер таблицы
4. При большом объеме рассмотреть партиционирование по дате

## Миграция данных

Эта миграция не требует переноса существующих данных, так как это новая функциональность.

## Откат

Для отката миграции:

```bash
migrate -path db/migrations -database "postgresql://..." down 1
```

Это удалит таблицу `notifications` и все связанные индексы.

⚠️ **Внимание**: При откате все уведомления будут удалены безвозвратно!

## Интеграция с кодом

### Repository

`go-api/repository/notification_repository.go` предоставляет методы:
- Create, GetByID, List, ListUnread
- Count, CountUnread
- Update, MarkAsRead, MarkAllAsRead
- Delete, DeleteExpired

### Handler

`go-api/handlers/notification_handler.go` предоставляет HTTP endpoints:
- Список уведомлений (с пагинацией)
- Получение одного уведомления
- Отметка как прочитанное
- Удаление

### Router

Endpoints в `go-api/router/router.go`:
- `GET /api/notifications` - все уведомления
- `GET /api/notifications/unread` - непрочитанные
- `GET /api/notifications/{id}` - конкретное
- `PUT /api/notifications/{id}/read` - отметить прочитанным
- `PUT /api/notifications/mark-all-read` - все как прочитанные
- `DELETE /api/notifications/{id}` - удалить
- `POST /api/notifications` - создать (admin only)

## Безопасность

- Все операции требуют аутентификации
- Пользователи видят только свои уведомления
- Проверка ownership при всех операциях
- SQL injection защита через prepared statements

## Monitoring

Рекомендуется отслеживать:
- Количество уведомлений на пользователя
- Скорость создания уведомлений
- Процент прочитанных уведомлений
- Размер таблицы

## Версия

- **Номер миграции**: 000010
- **Дата создания**: 2026-01-18
- **Автор**: System
- **Зависимости**: 000009 (forecasts table)


