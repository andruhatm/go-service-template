# Исправление ошибки Keycloak HTTPS

## Проблема

```
Failed to create auth middleware: 403 Forbidden: {"error":"invalid_request","error_description":"HTTPS required"}
```

Keycloak по умолчанию требует HTTPS соединения. Для локальной разработки это нужно отключить.

## Решение 1: Через Web UI (Рекомендуется)

### Шаг 1: Откройте Keycloak Admin Console

```
http://localhost:8080
```

### Шаг 2: Войдите в систему

- **Username**: `admin`
- **Password**: `admin`

### Шаг 3: Выберите realm

В левом верхнем углу в выпадающем меню выберите **myrealm** (не master!)

### Шаг 4: Откройте настройки Realm

1. В левом меню нажмите **Realm Settings**
2. Перейдите на вкладку **Login**

### Шаг 5: Отключите требование SSL

1. Найдите поле **Require SSL**
2. Измените значение с **external requests** на **none**
3. Нажмите **Save** внизу страницы

### Шаг 6: Перезапустите ваш Go backend

```bash
cd go-api
go run main.go
```

Ошибка должна исчезнуть!

---

## Решение 2: Через Docker Compose (Альтернатива)

Если Web UI не помогает, измените `docker-compose.yaml`:

```yaml
keycloak:
  image: quay.io/keycloak/keycloak:22.0.1
  environment:
    KC_DB: postgres
    KC_DB_URL_HOST: keycloak-db
    KC_DB_USERNAME: keycloak
    KC_DB_PASSWORD: keycloak
    KEYCLOAK_ADMIN: admin
    KEYCLOAK_ADMIN_PASSWORD: admin
    # Добавьте эти строки:
    KC_HOSTNAME_STRICT: "false"
    KC_HOSTNAME_STRICT_HTTPS: "false"
  command: start-dev
  # ... остальное
```

Затем перезапустите Keycloak:

```bash
docker-compose restart keycloak
```

---

## Решение 3: Создать realm через API (Автоматизация)

Если вы часто пересоздаете контейнеры, используйте этот скрипт:

```bash
#!/bin/bash
# fix_keycloak_ssl.sh

echo "Waiting for Keycloak to start..."
sleep 10

# Get admin token
TOKEN=$(curl -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

# Update realm settings
curl -X PUT "http://localhost:8080/admin/realms/myrealm" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sslRequired": "none"
  }'

echo "Keycloak SSL requirement disabled!"
```

Сохраните как `fix_keycloak_ssl.sh` и запустите:

```bash
chmod +x fix_keycloak_ssl.sh
./fix_keycloak_ssl.sh
```

---

## Проверка

После исправления запустите backend:

```bash
cd go-api
go run main.go
```

Вы должны увидеть:

```
[INFO] Connected to PostgreSQL successfully
[INFO] Running database migrations from: db/migrations
[INFO] Current migration version: 9 (dirty: false)
[INFO] Database migrations completed successfully
[INFO] Connected to VictoriaMetrics successfully
[INFO] Auth middleware created successfully ✅
[INFO] Server starting on 0.0.0.0:8081
```

Больше не должно быть ошибки HTTPS!

---

## Почему это происходит?

По умолчанию Keycloak настроен на работу в production окружении, где требуется HTTPS для безопасности. 

Для локальной разработки мы отключаем это требование, устанавливая `sslRequired: "none"`.

⚠️ **ВАЖНО**: В production окружении всегда используйте HTTPS!

---

## Дополнительная проблема: Panic после ошибки

Panic происходит потому что код пытается использовать `authMiddleware`, который равен `nil` после ошибки.

Это будет исправлено после того, как Keycloak перестанет требовать HTTPS.


