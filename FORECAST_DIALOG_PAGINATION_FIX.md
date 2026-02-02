# Исправление ошибок пагинации в Forecast Dialog

## 🐛 Проблема

При открытии модального окна "Создать прогноз" возникали ошибки:

```javascript
ERROR TypeError: Cannot read properties of null (reading 'length')
ERROR TypeError: this.monObjects.slice is not a function
```

### Причина
API возвращает **пагинированные ответы** в формате:
```json
{
  "items": [...],      // Массив данных
  "total": 35,
  "page": 1,
  "pageSize": 20,
  "totalPages": 2
}
```

А код ожидал **простой массив**: `[...]`

## ✅ Решение

### 1. Обновлен `mon-objects.service.ts`

```typescript
// Добавлен интерфейс для пагинированного ответа
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Обновлен метод getMonObjects()
getMonObjects(): Observable<MonObject[]> {
  const params = new HttpParams().set('pageSize', '1000');
  return this.http.get<PaginatedResponse<MonObject>>(this.apiUrl, { params })
    .pipe(
      map(response => response.items || [])  // Извлекаем массив items
    );
}
```

**Что изменилось:**
- ✅ Добавлен `PaginatedResponse<T>` интерфейс
- ✅ Используется `map()` для извлечения `items` из ответа
- ✅ Запрашивается `pageSize=1000` для получения всех объектов
- ✅ Добавлен метод `getMonObjectsPaginated()` для постраничной загрузки

### 2. Обновлен `metrics-catalog.service.ts`

Аналогичные изменения для метрик:

```typescript
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

getMetrics(): Observable<MetricCatalog[]> {
  const params = new HttpParams().set('pageSize', '1000');
  return this.http.get<PaginatedResponse<MetricCatalog>>(this.apiUrl, { params })
    .pipe(
      map(response => response.items || [])
    );
}
```

### 3. Использование environment для API URL

Оба сервиса теперь используют:
```typescript
private apiUrl = `${environment.api}/mon-objects`;
```

Вместо хардкодированных URL:
```typescript
private apiUrl = 'http://localhost:8081/api/mon-objects';  // ❌ Было
```

## 📊 Результат

### Было (ошибка):
```
MonObjects loaded: {items: Array(20), total: 35, ...}
❌ ERROR: this.monObjects.slice is not a function
```

### Стало (работает):
```
MonObjects loaded: [...]  // Массив из 20+ объектов
Filtered MonObjects: [...] // Массив скопирован успешно
✅ All data loaded successfully
```

## 🧪 Тестирование

1. **Откройте консоль браузера (F12)**
2. **Перейдите на страницу прогнозов**
3. **Нажмите "Создать прогноз"**

### Ожидаемый результат в консоли:
```
MonObjects loaded: Array(35)
  0: {id: "1", name: "eNodeB_001", type: "eNodeB", ...}
  1: {id: "2", name: "eNodeB_002", type: "eNodeB", ...}
  ...
Filtered MonObjects: Array(35)
Metrics loaded: Array(150)
  0: {id: "1", name: "DL_PRB_Usage_Rate", group: "Radio", ...}
  ...
Filtered Metrics: Array(150)
All data loaded successfully
```

### Проверка в Network вкладке:
```
✅ GET /api/mon-objects?pageSize=1000  → 200 OK
   Response: {"items": [...], "total": 35, ...}

✅ GET /api/metrics-catalog?pageSize=1000  → 200 OK
   Response: {"items": [...], "total": 150, ...}
```

## 📝 Дополнительные улучшения

### Добавлены методы для постраничной загрузки:

```typescript
// Для компонентов с таблицами и пагинацией
getMonObjectsPaginated(page: number = 1, pageSize: number = 20): Observable<PaginatedResponse<MonObject>>

getMetricsPaginated(page: number = 1, pageSize: number = 20): Observable<PaginatedResponse<MetricCatalog>>
```

Эти методы можно использовать в списках/таблицах для эффективной пагинации.

## 🔧 Затронутые файлы

1. ✅ `frontend/src/app/services/mon-objects.service.ts`
2. ✅ `frontend/src/app/services/metrics-catalog.service.ts`
3. ✅ `frontend/src/app/services/forecast.service.ts` (исправлен URL)
4. ✅ `frontend/src/app/routed/anomaly/components/add-forecast-req/forecast-dialog.component.ts`

## ⚠️ Важные замечания

1. **PageSize = 1000** используется для получения всех объектов в выпадающих списках
2. Если объектов/метрик станет больше 1000, нужно будет реализовать:
   - Серверную фильтрацию/поиск
   - Виртуальный скроллинг
   - Ленивую загрузку

3. **Для больших списков рекомендуется:**
   - Использовать `mat-autocomplete` с серверным поиском
   - Загружать данные по мере ввода
   - Кэшировать результаты

## 🎯 Статус

✅ **Ошибки пагинации исправлены**  
✅ **Данные загружаются корректно**  
✅ **Выпадающие списки заполняются**  
✅ **Поиск работает**  
✅ **Нет ошибок компиляции в наших файлах**


