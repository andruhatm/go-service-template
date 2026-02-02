# EMS UI Integration - Complete Setup

## Что было сделано

### ✅ 1. Frontend обновлен для работы с реальным API

**Изменения в `ems.service.ts`:**
- Обновлен интерфейс `Subs`:
  - `FTPport` изменен с `string` на `number`
  - Добавлены опциональные поля: `enabled`, `last_sync_at`, `last_sync_status`, `last_sync_error`
  - Добавлены поля аудита: `created_at`, `updated_at`

**Изменения в `events.page.ts`:**
- ❌ Удалены заглушки (stub data)
- ✅ Включен реальный API вызов через `emsService.getAll()`
- ✅ Добавлены методы для отображения статуса:
  - `getStatusIcon()` - показывает иконку статуса (✓, ✗, ⏳)
  - `getStatusColor()` - цвет статуса (зеленый, красный, оранжевый)
  - `formatDate()` - форматирует дату синхронизации

**Изменения в `events.page.html`:**
- Обновлена таблица для отображения:
  - Тип подключения (FTP, SFTP, HTTP, File)
  - Частота сбора (schedule)
  - Статус активности (enabled)
  - Статус синхронизации (success/error/pending)
  - Время последней синхронизации
- Убраны лишние колонки (username, password, port) для более компактного вида

### ✅ 2. Созданы скрипты для тестирования

**`setup_test_metric_source.sh`** - Полная настройка:
1. Создает файл с тестовыми метриками `/tmp/ems_test_metrics.txt`
2. Добавляет тестовый источник в базу данных
3. Показывает текущие источники
4. Выводит инструкции для проверки

**`verify_ems_integration.sh`** - Проверка интеграции:
1. Проверяет работу backend
2. Проверяет подключение к БД
3. Проверяет наличие таблицы `metric_sources`
4. Показывает текущие источники
5. Тестирует API endpoint
6. Проверяет VictoriaMetrics
7. Показывает логи синхронизации

**`insert_test_source.sql`** - SQL для ручной вставки тестового источника

## Как запустить и проверить

### Вариант 1: Автоматическая настройка (рекомендуется)

```bash
# 1. Запустите скрипт настройки
./setup_test_metric_source.sh

# 2. Подождите 1 минуту для автоматической синхронизации

# 3. Проверьте интеграцию
./verify_ems_integration.sh
```

### Вариант 2: Ручная настройка

```bash
# 1. Создайте файл с метриками
cat > /tmp/ems_test_metrics.txt << 'EOF'
# TYPE ems_test_counter counter
ems_test_counter{source="test",node="node1"} 100

# TYPE ems_test_gauge gauge
ems_test_gauge{source="test",type="cpu"} 42.5
EOF

# 2. Вставьте тестовый источник в БД
docker-compose exec -T db psql -U user -d appdb << 'EOSQL'
INSERT INTO metric_sources (
    source_name, connection_type, host, port, 
    file_path, schedule, enabled
) VALUES (
    'Test Local Source',
    'file',
    'localhost',
    0,
    '/tmp/ems_test_metrics.txt',
    '1m',
    true
);
EOSQL

# 3. Проверьте, что источник создан
docker-compose exec db psql -U user -d appdb \
  -c "SELECT * FROM metric_sources;"
```

### Вариант 3: Через API

```bash
# Получите токен (если требуется аутентификация)
TOKEN=$(curl -X POST "http://localhost:8080/realms/myrealm/protocol/openid-connect/token" \
  -d "username=admin&password=admin&grant_type=password&client_id=spa-client&client_secret=jym5bshxscBAQJqBsfo45hphL0oRdhx3" \
  | jq -r '.access_token')

# Создайте файл с метриками
cat > /tmp/ems_test_metrics.txt << 'EOF'
ems_test_counter{source="test"} 100
EOF

# Создайте источник через API
curl -X POST http://localhost:8081/api/ems \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "API Test Source",
    "connection_type": "file",
    "host": "localhost",
    "FTPport": 0,
    "file_path": "/tmp/ems_test_metrics.txt",
    "schedule": "1m",
    "enabled": true
  }'
```

## Проверка работы UI

### 1. Откройте страницу подписок
```
http://localhost:4200/ems
```
(или ваш URL frontend)

### 2. Что вы должны увидеть

**Таблица "Текущие подписки"** с колонками:
- **Название источника** - имя источника
- **Тип** - FTP, SFTP, HTTP или FILE
- **Хост** - адрес сервера
- **Частота** - интервал сбора (например, "1m")
- **Активно** - зеленая галочка если включено
- **Статус** - иконка и текст:
  - ✓ success (зеленый) - успешная синхронизация
  - ✗ error (красный) - ошибка синхронизации
  - ⏳ pending (оранжевый) - в процессе
  - — (серый) - еще не синхронизировано
- **Последняя синхронизация** - дата и время
- **Редактирование** - кнопка редактирования
- **Удаление** - кнопка удаления

### 3. Первая синхронизация

После создания источника:
1. **Сразу**: статус будет "—" (не синхронизировано)
2. **Через ~1 минуту**: статус изменится на "⏳ pending"
3. **Еще через несколько секунд**: статус станет "✓ success"

Обновите страницу (F5) чтобы увидеть обновленный статус.

### 4. Проверка импортированных метрик

```bash
# Проверьте, что метрики попали в VictoriaMetrics
curl "http://localhost:8428/api/v1/query?query=ems_test_counter"

# Должны увидеть что-то вроде:
# {
#   "status": "success",
#   "data": {
#     "result": [
#       {
#         "metric": {"__name__": "ems_test_counter", "source": "test", ...},
#         "value": [1675349200, "100"]
#       }
#     ]
#   }
# }
```

## Мониторинг и отладка

### Просмотр логов синхронизации

```bash
# Все логи metric importer
docker-compose logs -f go-api | grep "metric importer"

# Логи конкретной синхронизации
docker-compose logs -f go-api | grep -i "sync"

# Последние 50 строк
docker-compose logs --tail=50 go-api
```

**Что искать в логах:**
```
Starting metric importer service          # Сервис запущен
Syncing source: Test Local Source (ID: 1) # Начало синхронизации
Successfully synced metrics from source   # Успешная синхронизация
Failed to fetch metrics from source       # Ошибка (если есть)
```

### Проверка статуса в базе данных

```bash
# Статус всех источников
docker-compose exec db psql -U user -d appdb -c "
SELECT 
    id,
    source_name,
    enabled,
    last_sync_status,
    last_sync_at,
    last_sync_error
FROM metric_sources
ORDER BY id;
"

# Детальная информация об источнике
docker-compose exec db psql -U user -d appdb -c "
SELECT * FROM metric_sources WHERE id = 1;
"
```

### Проверка через API

```bash
# Список всех источников (может требовать авторизацию)
curl http://localhost:8081/api/ems | jq

# Конкретный источник
curl http://localhost:8081/api/ems/1 | jq
```

## Типичные проблемы и решения

### ❌ Проблема: UI показывает пустую таблицу

**Причины:**
1. Backend не запущен
2. API endpoint недоступен
3. Требуется аутентификация
4. Нет источников в БД

**Решение:**
```bash
# Проверьте backend
curl http://localhost:8081/probes/readiness

# Проверьте API
curl http://localhost:8081/api/ems

# Проверьте БД
docker-compose exec db psql -U user -d appdb \
  -c "SELECT COUNT(*) FROM metric_sources;"

# Добавьте тестовый источник
./setup_test_metric_source.sh
```

### ❌ Проблема: Статус остается "pending" долго

**Причины:**
1. Файл не существует
2. Неправильный путь к файлу
3. Файл пустой или некорректный формат

**Решение:**
```bash
# Проверьте файл
ls -la /tmp/ems_test_metrics.txt
cat /tmp/ems_test_metrics.txt

# Проверьте ошибку в БД
docker-compose exec db psql -U user -d appdb -c "
SELECT last_sync_error FROM metric_sources WHERE id = 1;
"

# Посмотрите логи
docker-compose logs go-api | grep -i error
```

### ❌ Проблема: Статус "error"

**Причины:**
1. Файл не найден
2. Формат метрик неправильный
3. VictoriaMetrics недоступен
4. Нет прав на чтение файла

**Решение:**
```bash
# Проверьте сообщение об ошибке
docker-compose exec db psql -U user -d appdb -c "
SELECT id, source_name, last_sync_error 
FROM metric_sources 
WHERE last_sync_status = 'error';
"

# Проверьте VictoriaMetrics
curl http://localhost:8428/health

# Пересоздайте файл с правильным форматом
cat > /tmp/ems_test_metrics.txt << 'EOF'
# TYPE metric_name counter
metric_name{label="value"} 123
EOF
```

### ❌ Проблема: "Unauthorized" при доступе к API

**Причина:** Требуется аутентификация

**Решение:**
UI автоматически добавляет токен через Keycloak. Для ручного тестирования:
```bash
# Получите токен
TOKEN=$(curl -X POST "http://localhost:8080/realms/myrealm/protocol/openid-connect/token" \
  -d "username=admin&password=admin&grant_type=password&client_id=spa-client&client_secret=jym5bshxscBAQJqBsfo45hphL0oRdhx3" \
  | jq -r '.access_token')

# Используйте токен
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/ems
```

## Дальнейшие действия

### 1. Добавьте реальные источники

Через UI или API добавьте:
- FTP сервер с метриками
- SFTP сервер с метриками
- HTTP endpoint с метриками

### 2. Настройте автообновление UI

Добавьте в `events.page.ts`:
```typescript
ngOnInit(): void {
  this.loadData();
  
  // Обновляйте данные каждые 30 секунд
  setInterval(() => {
    this.loadData();
  }, 30000);
}
```

### 3. Добавьте уведомления

При ошибках показывайте пользователю snackbar:
```typescript
private loadData(): void {
  this.emsService.getAll().subscribe({
    next: (data) => {
      this.dataSource.data = data;
      
      // Проверьте ошибки
      const errorSources = data.filter(s => s.last_sync_status === 'error');
      if (errorSources.length > 0) {
        this.showNotification(`${errorSources.length} источник(ов) с ошибками`);
      }
    },
    error: (err) => {
      this.showNotification('Ошибка загрузки источников', 'error');
    }
  });
}
```

### 4. Реализуйте форму создания/редактирования

В `add-event.page.ts` добавьте форму для создания новых источников:
- Выбор типа подключения (dropdown)
- Поля для хоста, порта, пути
- Поле для расписания с подсказками ("1m", "5m", "1h")
- Валидация полей

## Итого

### ✅ Выполнено:
- [x] Frontend подключен к реальному API
- [x] Добавлено отображение статуса синхронизации
- [x] Созданы скрипты для тестирования
- [x] Добавлена тестовая подписка
- [x] Проверен импорт метрик из файлов

### 📋 Следующие шаги:
- [ ] Протестировать UI в браузере
- [ ] Добавить автообновление таблицы
- [ ] Реализовать форму создания источников
- [ ] Добавить уведомления об ошибках
- [ ] Протестировать с реальными FTP/SFTP источниками

## Быстрая проверка (Copy-Paste)

```bash
# 1. Создайте все необходимое
./setup_test_metric_source.sh

# 2. Подождите 1 минуту

# 3. Проверьте результат
./verify_ems_integration.sh

# 4. Откройте UI
echo "Open: http://localhost:4200/ems"

# 5. Проверьте метрики
curl "http://localhost:8428/api/v1/query?query=ems_test_counter" | jq
```

Готово! 🎉
