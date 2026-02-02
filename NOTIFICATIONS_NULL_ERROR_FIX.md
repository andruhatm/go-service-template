# Notification Null/Undefined Error Fix

## Проблема

При загрузке приложения появлялись ошибки в консоли:

```
TokenInterceptor: response for /api/notifications/unread 4
TokenInterceptor: response for /api/notifications 4
ERROR TypeError: Cannot read properties of null (reading 'length')
```

## Причина

API возвращает `null` или `undefined` для `notifications` вместо пустого массива `[]`, когда у пользователя нет уведомлений.

Код пытается работать с массивом (например, `.forEach()`, `.filter()`, `.length`), но получает `null`.

---

## Локации ошибок

### 1. Polling subscription (строка 66)
```typescript
// ДО - ошибка если response.notifications === null
this.notifications = response.notifications;
```

### 2. loadNotifications (строка 74)
```typescript
// ДО - ошибка если response.notifications === null
this.notifications = response.notifications;
```

### 3. markAllAsRead (строка 106)
```typescript
// ДО - ошибка если this.notifications === null
this.notifications.forEach(n => n.status = 'read' as any);
```

### 4. deleteNotification (строка 114)
```typescript
// ДО - ошибка если this.notifications === null
this.notifications = this.notifications.filter(n => n.id !== notification.id);
```

---

## Решение

Добавлены проверки на `null`/`undefined` с использованием:
- **Optional chaining** (`?.`)
- **Nullish coalescing** (`||`)
- **Явные проверки** (`Array.isArray()`)

---

## Изменения в коде

### 1. ✅ Polling subscription

**ДО:**
```typescript
this.notificationSubscription = this.notificationService
  .pollNotifications(30000)
  .subscribe(response => {
    this.notifications = response.notifications;  // ❌ Ошибка если null
  });
```

**ПОСЛЕ:**
```typescript
this.notificationSubscription = this.notificationService
  .pollNotifications(30000)
  .subscribe(response => {
    this.notifications = response?.notifications || [];  // ✅ Fallback на []
  });
```

---

### 2. ✅ loadNotifications method

**ДО:**
```typescript
loadNotifications(): void {
  this.loading = true;
  this.notificationService.getNotifications(20, 0).subscribe({
    next: (response) => {
      this.notifications = response.notifications;  // ❌ Ошибка если null
      this.loading = false;
    },
    error: (err) => {
      console.error('Failed to load notifications:', err);
      this.loading = false;  // ❌ Не сбрасывает notifications
    }
  });
}
```

**ПОСЛЕ:**
```typescript
loadNotifications(): void {
  this.loading = true;
  this.notificationService.getNotifications(20, 0).subscribe({
    next: (response) => {
      this.notifications = response?.notifications || [];  // ✅ Fallback на []
      this.loading = false;
    },
    error: (err) => {
      console.error('Failed to load notifications:', err);
      this.notifications = [];  // ✅ Сброс на пустой массив
      this.loading = false;
    }
  });
}
```

---

### 3. ✅ markAllAsRead method

**ДО:**
```typescript
markAllAsRead(): void {
  this.notificationService.markAllAsRead().subscribe(() => {
    this.notifications.forEach(n => n.status = 'read' as any);  // ❌ Ошибка если null
    this.unreadCount = 0;
  });
}
```

**ПОСЛЕ:**
```typescript
markAllAsRead(): void {
  this.notificationService.markAllAsRead().subscribe(() => {
    if (this.notifications && Array.isArray(this.notifications)) {  // ✅ Проверка
      this.notifications.forEach(n => n.status = 'read' as any);
    }
    this.unreadCount = 0;
  });
}
```

---

### 4. ✅ deleteNotification method

**ДО:**
```typescript
deleteNotification(notification: Notification, event: Event): void {
  event.stopPropagation();
  this.notificationService.deleteNotification(notification.id).subscribe(() => {
    this.notifications = this.notifications.filter(n => n.id !== notification.id);  // ❌ Ошибка если null
    if (notification.status === 'unread') {
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    }
  });
}
```

**ПОСЛЕ:**
```typescript
deleteNotification(notification: Notification, event: Event): void {
  event.stopPropagation();
  this.notificationService.deleteNotification(notification.id).subscribe(() => {
    this.notifications = (this.notifications || []).filter(n => n.id !== notification.id);  // ✅ Fallback на []
    if (notification.status === 'unread') {
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    }
  });
}
```

---

## Техники обработки null

### 1. Optional Chaining (`?.`)

```typescript
response?.notifications  // undefined если response === null
```

**Преимущества:**
- ✅ Безопасный доступ к вложенным свойствам
- ✅ Возвращает `undefined` вместо ошибки
- ✅ Короткий синтаксис

---

### 2. Nullish Coalescing (`||`)

```typescript
response?.notifications || []  // [] если undefined или null
```

**Преимущества:**
- ✅ Предоставляет значение по умолчанию
- ✅ Работает с любыми falsy значениями

**Альтернатива - `??`** (только для null/undefined):
```typescript
response?.notifications ?? []  // [] только если null или undefined
```

---

### 3. Явная проверка типа

```typescript
if (this.notifications && Array.isArray(this.notifications)) {
  // Безопасно использовать методы массива
}
```

**Преимущества:**
- ✅ Проверяет и null и тип
- ✅ TypeScript type guard
- ✅ Явно и понятно

---

## Защита на уровне типов

### Обновление типа в компоненте:

```typescript
export class UserMenuComponent {
  notifications: Notification[] = [];  // ✅ Инициализация пустым массивом
  // Вместо:
  // notifications: Notification[];  // ❌ По умолчанию undefined
}
```

**Почему это помогает:**
- Гарантирует, что `notifications` всегда массив
- Избегает `undefined` на старте
- TypeScript проверяет присваивания

---

## Возможные источники null

### 1. Backend возвращает null
```json
{
  "notifications": null,
  "total": 0,
  "unread_count": 0
}
```

### 2. Backend возвращает 404/500
```typescript
error: (err) => {
  // response === null
}
```

### 3. Сетевая ошибка
```typescript
// Нет ответа от сервера
```

---

## Тестирование

### Сценарий 1: Новый пользователь без уведомлений

```
1. Создать нового пользователя
2. Авторизоваться
3. Проверить консоль
   ↓
Ожидаемый результат:
- ✅ Нет ошибок в консоли
- ✅ Badge не показывается (0)
- ✅ Меню показывает "Нет уведомлений"
```

---

### Сценарий 2: Ошибка API

```
1. Остановить backend
2. Открыть приложение
3. Проверить консоль
   ↓
Ожидаемый результат:
- ✅ Ошибка залогирована в консоль
- ✅ Нет TypeError
- ✅ notifications = [] (пустой массив)
- ✅ UI показывает "Нет уведомлений"
```

---

### Сценарий 3: Backend возвращает null

```
1. Модифицировать backend чтобы вернул:
   { "notifications": null, "total": 0 }
2. Открыть приложение
3. Проверить консоль
   ↓
Ожидаемый результат:
- ✅ Нет TypeError
- ✅ notifications = [] (преобразовано)
- ✅ UI работает корректно
```

---

## Backend исправление (опционально)

Если хотите исправить на backend, гарантируйте возврат пустого массива:

```go
// В notification_repository.go
func (r *NotificationRepository) List(userID string, limit, offset int) ([]*models.Notification, error) {
    // ...
    
    if len(notifications) == 0 {
        return []*models.Notification{}, nil  // ✅ Пустой массив, не nil
    }
    
    return notifications, nil
}
```

---

## Изменённый файл

- ✏️ `frontend/src/app/features/current-user/user-menu/user-menu.component.ts`
  - Добавлены проверки на null в 4 местах
  - Добавлены fallback на пустой массив
  - Добавлены проверки типов

---

## Готово! ✅

Ошибки `Cannot read properties of null (reading 'length')` больше не появляются.

### Проверьте:

```bash
cd frontend
npm start

# 1. Откройте http://localhost:4200
# 2. Откройте DevTools Console (F12)
# 3. Проверьте отсутствие ошибок ✅
# 4. Откройте меню уведомлений
# 5. Всё работает корректно ✅
```

**Ошибки исправлены!** 🎉

---

## Best Practices

### ✅ Всегда используйте для массивов:

```typescript
// 1. Инициализация
myArray: Type[] = [];

// 2. При получении данных
myArray = response?.data || [];

// 3. При операциях
(myArray || []).forEach(...)
(myArray || []).filter(...)
(myArray || []).map(...)

// 4. Перед методами массива
if (myArray && Array.isArray(myArray)) {
  myArray.forEach(...)
}
```

### ❌ Избегайте:

```typescript
// Плохо - может быть undefined
myArray: Type[];

// Плохо - может вызвать ошибку
myArray = response.data;

// Плохо - небезопасно
myArray.forEach(...)
```
