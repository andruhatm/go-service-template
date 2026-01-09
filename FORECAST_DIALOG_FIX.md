# Исправление проблемы с бесконечной загрузкой в Forecast Dialog

## Проблемы
1. При нажатии на кнопку "Создать прогноз" происходила бесконечная загрузка из-за неправильных API URL и отсутствия таймаутов.
2. API возвращает пагинированные ответы `{items: [], total: N, ...}`, а код ожидал массивы.
3. Ошибка `TypeError: this.monObjects.slice is not a function` - попытка вызвать .slice() на объекте.

## Внесенные исправления

### 1. Исправлены API URL в сервисах
**Было:** Использовались абсолютные URL (`http://localhost:8081/api/...`)
**Стало:** Используются относительные пути через environment (`/api/...`)

#### Измененные файлы:
- `frontend/src/app/services/mon-objects.service.ts`
  - Было: `private apiUrl = 'http://localhost:8081/api/mon-objects';`
  - Стало: `private apiUrl = \`${environment.api}/mon-objects\`;`

- `frontend/src/app/services/metrics-catalog.service.ts`
  - Было: `private apiUrl = 'http://localhost:8081/api/metrics-catalog';`
  - Стало: `private apiUrl = \`${environment.api}/metrics-catalog\`;`

- `frontend/src/app/services/forecast.service.ts`
  - Было: `private apiUrl = \`${environment.apiBaseUrl}/api/forecasts\`;`
  - Стало: `private apiUrl = \`${environment.api}/forecasts\`;`

### Исправлена обработка пагинированных ответов API

API возвращает ответы в формате:
```json
{
  "items": [...],
  "total": 35,
  "page": 1,
  "pageSize": 20,
  "totalPages": 2
}
```

#### Обновлены сервисы:

- `frontend/src/app/services/mon-objects.service.ts`
  - Добавлен интерфейс `PaginatedResponse<T>`
  - Метод `getMonObjects()` теперь извлекает `items` из ответа:
    ```typescript
    return this.http.get<PaginatedResponse<MonObject>>(this.apiUrl, { params })
      .pipe(map(response => response.items || []));
    ```
  - Добавлен метод `getMonObjectsPaginated()` для постраничной загрузки
  - Используется `pageSize=1000` для получения всех объектов

- `frontend/src/app/services/metrics-catalog.service.ts`
  - Аналогичные изменения для метрик
  - Добавлен интерфейс `PaginatedResponse<T>`
  - Извлечение массива `items` из ответа API

### 2. Улучшена логика загрузки данных в forecast-dialog.component.ts

#### Добавлено:
- Таймаут 10 секунд для каждого запроса
- Корректная обработка завершения обоих запросов
- Детальное логирование для отладки
- Предупреждения в консоль при отсутствии данных

### 3. Добавлены визуальные индикаторы в UI

- Warning панели при отсутствии данных
- Счетчики найденных элементов
- Информационные сообщения о состоянии загрузки

## Как работает proxy

В `frontend/proxy.config.json` настроен проксирование:
```json
{
  "/api": {
    "target": "http://localhost:8081",
    "secure": false,
    "logLevel": "debug",
    "changeOrigin": true
  }
}
```

Теперь все запросы к `/api/*` будут проксироваться на `http://localhost:8081/api/*`

## Как тестировать

1. **Запустите backend:**
   ```bash
   cd go-api
   go run main.go
   ```

2. **Запустите frontend с proxy:**
   ```bash
   cd frontend
   npm start
   # или
   ng serve --proxy-config proxy.config.json
   ```

3. **Откройте браузер:**
   - Перейдите на страницу с прогнозами
   - Откройте консоль браузера (F12)
   - Нажмите "Создать прогноз"

4. **Проверьте консоль:**
   Должны увидеть:
   ```
   MonObjects loaded: [...]
   Filtered MonObjects: [...]
   Metrics loaded: [...]
   Filtered Metrics: [...]
   All data loaded successfully
   ```

5. **Если данные не загружаются:**
   - Проверьте, что backend запущен
   - Проверьте Network вкладку в DevTools
   - Убедитесь, что запросы идут на `/api/...`, а не на `http://localhost:8081/api/...`
   - Проверьте CORS настройки в Go API

## Отладка

### В консоли браузера должно быть:
- ✅ `MonObjects loaded: Array(N)` - N объектов загружено
- ✅ `Metrics loaded: Array(M)` - M метрик загружено
- ✅ `All data loaded successfully` - загрузка завершена

### Если видите:
- ⚠️ `No mon objects found or request failed` - проверьте backend
- ⚠️ `Timeout or error loading ...` - backend не отвечает за 10 секунд
- ❌ `Failed to load ...` - ошибка сети или CORS

### Network вкладка:
Запросы должны быть:
- `GET /api/mon-objects` (Status: 200)
- `GET /api/metrics-catalog` (Status: 200)

НЕ должны быть:
- ❌ `GET http://localhost:8081/api/...` (это означает, что proxy не работает)

## Дополнительные улучшения

1. **Трехшаговый интерфейс:**
   - Шаг 1: Выбор объекта мониторинга
   - Шаг 2: Выбор метрики
   - Шаг 3: Настройки прогноза

2. **Поиск в реальном времени** для объектов и метрик

3. **TrackBy функции** для оптимизации производительности

4. **Визуальные подсказки** и предупреждения

