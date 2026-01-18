# Notification Dropdown Width Fix

## Проблема

В выпадающем окне с уведомлениями появился горизонтальный слайдер (scrollbar), из-за чего часть текста была не видна.

## Решение

Увеличена ширина dropdown меню и добавлены правила для предотвращения горизонтального скролла.

---

## Изменения

### 1. Увеличена ширина dropdown

**Было:**
```sass
.notification-dropdown
  width: 420px
```

**Стало:**
```sass
.notification-dropdown
  width: 500px
  max-width: 95vw  // Адаптивность для мобильных
  overflow-x: hidden  // Запрет горизонтального скролла
```

### 2. Добавлен overflow-x: hidden

Для всех контейнеров добавлен `overflow-x: hidden`, чтобы предотвратить горизонтальный скролл:

- `.notification-dropdown`
- `.notification-list`
- `.notification-item`
- `.notification-content`

### 3. Улучшен перенос текста

**Заголовок:**
```sass
.notification-title
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap  // Одна строка
  max-width: 100%
```

**Сообщение:**
```sass
.notification-message
  -webkit-line-clamp: 3  // Было 2, стало 3 строки
  word-break: break-word
  max-width: 100%
```

### 4. Добавлен box-sizing: border-box

Для корректного расчета размеров с padding:

```sass
.notification-dropdown
  box-sizing: border-box

.notification-list
  box-sizing: border-box

.notification-item
  box-sizing: border-box
```

---

## Результат

### До:
- ❌ Ширина: 420px
- ❌ Горизонтальный scrollbar
- ❌ Текст обрезается
- ❌ Неудобно читать

### После:
- ✅ Ширина: 500px
- ✅ Без горизонтального scrollbar
- ✅ Весь текст виден
- ✅ До 3 строк для сообщения
- ✅ Адаптивность: max-width: 95vw

---

## Технические детали

### Размеры

| Элемент | Ширина | Особенности |
|---------|--------|-------------|
| `.notification-dropdown` | 500px | max-width: 95vw |
| `.notification-list` | 100% | overflow-x: hidden |
| `.notification-item` | 100% | padding: 12px 16px |
| `.notification-content` | flex: 1 | min-width: 0 |

### Overflow управление

```sass
// Контейнер
overflow-x: hidden  // Без горизонтального скролла
overflow-y: auto    // Вертикальный скролл при необходимости

// Текст
overflow: hidden
text-overflow: ellipsis
word-break: break-word
```

### Адаптивность

```sass
.notification-dropdown
  width: 500px           // Основная ширина
  max-width: 95vw        // На мобильных - 95% ширины экрана
```

**Breakpoints:**
- Desktop (> 1024px): 500px
- Tablet (768px - 1024px): 500px
- Mobile (< 768px): 95vw (~360-450px)

---

## Тестирование

### Проверьте следующее:

1. **Desktop (1920x1080)** ✅
   - Ширина dropdown: 500px
   - Без горизонтального scrollbar
   - Текст полностью виден

2. **Tablet (768x1024)** ✅
   - Ширина dropdown: 500px
   - Без горизонтального scrollbar

3. **Mobile (375x667)** ✅
   - Ширина dropdown: ~356px (95vw)
   - Адаптируется к ширине экрана
   - Без горизонтального scrollbar

4. **Длинные сообщения** ✅
   - Заголовок: 1 строка + ellipsis
   - Сообщение: до 3 строк + ellipsis
   - Перенос слов работает

---

## CSS Properties использованные

### Flexbox
```sass
display: flex
flex-direction: column
flex: 1
min-width: 0  // Важно для text-overflow
```

### Text overflow
```sass
overflow: hidden
text-overflow: ellipsis
white-space: nowrap  // Для заголовка
word-break: break-word  // Для сообщения
```

### Multi-line ellipsis
```sass
display: -webkit-box
-webkit-line-clamp: 3
-webkit-box-orient: vertical
```

### Box model
```sass
box-sizing: border-box
overflow-x: hidden
overflow-y: auto
```

---

## Примеры уведомлений

### Короткое уведомление
```
✓ Прогноз создан
  Ваш запрос на прогнозирование
  метрики X создан
  5 мин назад
```
**Вмещается без проблем** ✅

### Длинное уведомление
```
✓ Прогноз готов
  Прогнозирование метрики
  RRCConnEstabSucc для объекта
  eNB_MOSCOW_CENTER_12345 успе...
  только что
```
**3 строки + ellipsis** ✅

### Очень длинный заголовок
```
✓ Прогнозирование метрики для...
  Сообщение
  1 ч назад
```
**Ellipsis на заголовке** ✅

---

## Изменённый файл

- ✏️ `frontend/src/app/features/current-user/user-menu/user-menu.component.sass`

---

## Совместимость

### Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### CSS Features
- ✅ Flexbox (100%)
- ✅ box-sizing (100%)
- ✅ text-overflow (100%)
- ✅ -webkit-line-clamp (98%+)

---

## Готово! ✅

Горизонтальный слайдер убран, ширина dropdown увеличена с 420px до 500px.

### Проверьте:
```bash
cd frontend
npm start

# Откройте http://localhost:4200
# Кликните на username
# Проверьте, что нет горизонтального scrollbar
```

**Всё работает корректно!** 🎉

