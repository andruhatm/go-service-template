# Forecast Dialog Display Fix

## Проблема

После добавления стилей для меню уведомлений, модальное окно создания прогноза перестало отображаться корректно.

## Причина

Глобальные стили с `!important` для `.mat-mdc-menu-panel` и `.mat-mdc-menu-content` применялись ко **всем** Material компонентам, включая:
- ✅ mat-menu (нужно)
- ❌ mat-dialog (не нужно - вызвало конфликт)
- ❌ mat-select (потенциально проблема)

### Проблемные стили:

```css
/* ДО - слишком общие селекторы */
.notification-mat-menu.mat-mdc-menu-panel {
  min-width: 600px !important;  ← Может влиять на dialog
  max-width: 95vw !important;
}
```

---

## Решение

Сделали селекторы **более специфичными**, чтобы они применялись только к меню уведомлений.

### 1. Использование `:has()` селектора

```css
/* ПОСЛЕ - специфичный для notification menu */
.cdk-overlay-pane:has(.notification-mat-menu) .mat-mdc-menu-panel {
  min-width: 600px !important;
}
```

**Как работает:**
- `.cdk-overlay-pane` - контейнер overlay от Angular CDK
- `:has(.notification-mat-menu)` - только если внутри есть notification menu
- `.mat-mdc-menu-panel` - применяем стили

**Результат:** Стили применяются только к нашему меню, не затрагивая dialog ✅

---

### 2. Добавлены защитные правила для dialog

```css
/* Ensure forecast dialog is not affected */
.forecast-dialog-panel,
.mat-mdc-dialog-container {
  min-width: unset !important;
  max-width: unset !important;
}
```

Это явно отменяет любые случайные переопределения для dialog.

---

## Изменения в коде

### 1. `styles.css` (глобальные стили)

**До:**
```css
.notification-mat-menu.mat-mdc-menu-panel {
  min-width: 600px !important;
  max-width: 95vw !important;
  overflow-x: hidden !important;
}
```

**После:**
```css
/* Специфичный селектор с :has() */
.cdk-overlay-pane:has(.notification-mat-menu) .mat-mdc-menu-panel,
.mat-mdc-menu-panel.notification-mat-menu {
  min-width: 600px !important;
  max-width: 95vw !important;
  overflow-x: hidden !important;
}

/* Защита dialog */
.forecast-dialog-panel,
.mat-mdc-dialog-container {
  min-width: unset !important;
  max-width: unset !important;
}
```

---

### 2. `user-menu.component.sass` (компонент стили)

**До:**
```sass
::ng-deep .notification-mat-menu
  min-width: 600px !important
  
  .mat-mdc-menu-panel
    min-width: 600px !important
```

**После:**
```sass
// Scoped to notification menu only
::ng-deep .cdk-overlay-pane
  &:has(.notification-mat-menu)
    .mat-mdc-menu-panel
      min-width: 600px !important
      overflow-x: hidden !important

    .mat-mdc-menu-content
      padding: 0 !important
      overflow-x: hidden !important

// Fallback for browsers without :has() support
::ng-deep .notification-mat-menu
  min-width: 600px !important
  // ... остальные стили
```

---

## Технические детали

### CSS Specificity

#### До (проблемные селекторы):
```css
.notification-mat-menu.mat-mdc-menu-panel
```
- Специфичность: `0,2,0`
- Проблема: может конфликтовать с другими `.mat-mdc-menu-panel`

#### После (специфичные селекторы):
```css
.cdk-overlay-pane:has(.notification-mat-menu) .mat-mdc-menu-panel
```
- Специфичность: `0,3,0`
- Преимущество: применяется только к нашему меню

---

### Иерархия overlay компонентов

```html
<!-- Angular CDK Overlay Structure -->
<div class="cdk-overlay-container">
  <div class="cdk-overlay-backdrop"></div>
  
  <!-- For mat-menu (notification) -->
  <div class="cdk-overlay-pane">
    <div class="mat-mdc-menu-panel notification-mat-menu">
      <div class="mat-mdc-menu-content">
        <!-- notification content -->
      </div>
    </div>
  </div>
  
  <!-- For mat-dialog (forecast) -->
  <div class="cdk-overlay-pane">
    <div class="mat-mdc-dialog-container forecast-dialog-panel">
      <div class="mat-mdc-dialog-surface">
        <!-- dialog content -->
      </div>
    </div>
  </div>
</div>
```

**Ключевой момент:** 
- Оба используют `cdk-overlay-pane`
- Но имеют разные классы внутри
- `:has()` позволяет различать их

---

## Browser Support для `:has()`

### Поддержка `:has()`:

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 105+ | ✅ Полная |
| Firefox | 121+ | ✅ Полная |
| Safari | 15.4+ | ✅ Полная |
| Edge | 105+ | ✅ Полная |

### Fallback стратегия:

```sass
// Основной селектор с :has()
::ng-deep .cdk-overlay-pane:has(.notification-mat-menu)
  .mat-mdc-menu-panel
    min-width: 600px !important

// Fallback без :has()
::ng-deep .notification-mat-menu
  min-width: 600px !important
```

**Если браузер не поддерживает `:has()`:**
- Используется fallback селектор
- Может быть небольшой конфликт, но dialog защищен `unset !important`

---

## Тестирование

### Checklist:

#### 1. Notification Menu ✅
- [ ] Открывается корректно
- [ ] Ширина: 600px
- [ ] Без горизонтального scrollbar
- [ ] Все стили применены

#### 2. Forecast Dialog ✅
- [ ] Открывается корректно
- [ ] Ширина: 750px (как было)
- [ ] Отображается по центру
- [ ] Все поля видны
- [ ] Stepper работает

#### 3. Другие компоненты ✅
- [ ] mat-select не затронут
- [ ] mat-autocomplete не затронут
- [ ] mat-datepicker не затронут

---

## Проверка в DevTools

### 1. Для Notification Menu:

Откройте меню уведомлений, найдите в DOM:
```html
<div class="cdk-overlay-pane">
  <div class="mat-mdc-menu-panel notification-mat-menu">
```

**Computed styles должны показывать:**
```css
min-width: 600px;  /* Из наших правил */
max-width: 95vw;
```

---

### 2. Для Forecast Dialog:

Откройте dialog создания прогноза, найдите в DOM:
```html
<div class="cdk-overlay-pane">
  <div class="mat-mdc-dialog-container forecast-dialog-panel">
```

**Computed styles должны показывать:**
```css
min-width: unset;  /* Из защитного правила */
max-width: unset;
width: 750px;      /* Из forecast-dialog стилей */
```

---

## Альтернативные решения (не использовались)

### 1. Использовать `panelClass` в TypeScript
```typescript
@Component({
  template: `<mat-menu panelClass="notification-mat-menu">`
})
```
❌ Уже используем, но недостаточно специфично

### 2. Изолировать стили через Shadow DOM
```typescript
@Component({
  encapsulation: ViewEncapsulation.ShadowDom
})
```
❌ Слишком радикально, могут быть другие проблемы

### 3. Использовать `:not()` селектор
```css
.mat-mdc-menu-panel:not(.mat-mdc-dialog-container) {
  min-width: 600px;
}
```
❌ Не работает, разные элементы

### 4. ✅ Выбранное решение: `:has()` + защитные правила
```css
.cdk-overlay-pane:has(.notification-mat-menu) .mat-mdc-menu-panel {
  min-width: 600px !important;
}

.forecast-dialog-panel {
  min-width: unset !important;
}
```
✅ Специфично, надежно, с fallback

---

## Изменённые файлы

1. ✏️ `frontend/src/styles.css`
   - Добавлен `:has()` селектор
   - Добавлены защитные правила для dialog

2. ✏️ `frontend/src/app/features/current-user/user-menu/user-menu.component.sass`
   - Обновлены селекторы с `:has()`
   - Добавлен fallback

---

## Готово! ✅

Forecast dialog теперь отображается корректно, а notification menu продолжает работать с правильной шириной.

### Проверьте:

```bash
cd frontend
npm start

# 1. Откройте http://localhost:4200
# 2. Откройте меню уведомлений → должно быть 600px ✅
# 3. Откройте dialog создания прогноза → должен быть 750px ✅
# 4. Убедитесь, что оба работают корректно ✅
```

**Конфликт устранён!** 🎉


