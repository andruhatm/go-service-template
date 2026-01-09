# ОКОНЧАТЕЛЬНОЕ ИСПРАВЛЕНИЕ Keycloak

## Проблема

Keycloak 22.x имеет особенность: даже с параметрами `--http-enabled=true`, master realm по умолчанию может требовать HTTPS для внешних подключений.

## Решение

### Вариант 1: Использовать Docker Compose (обновлен docker-compose.yaml)

```bash
# 1. Остановить все
docker-compose down

# 2. Удалить volumes
docker volume rm go-service-template_keycloak-db-data

# 3. Запустить заново
docker-compose up -d

# 4. Подождать 60 секунд
sleep 60

# 5. Настроить realm через Web UI
```

### Вариант 2: Ручная настройка (САМЫЙ НАДЁЖНЫЙ)

**Шаг 1:** Убедитесь что Keycloak запущен
```bash
docker-compose up -d keycloak
# Подождите 60 секунд
sleep 60
```

**Шаг 2:** Откройте Web UI
- Откройте: http://localhost:8080
- Login: `admin`
- Password: `admin`

**Шаг 3:** Настройте Master Realm (ВАЖНО!)
1. В левом верхнем углу выберите **master**
2. Перейдите в **Realm Settings** → **Login**
3. Найдите **Require SSL** → выберите **none**
4. Нажмите **Save**

**Шаг 4:** Создайте myrealm
1. В левом верхнем углу нажмите на dropdown с realm
2. Нажмите **Create Realm**
3. Введите имя: `myrealm`
4. Нажмите **Create**

**Шаг 5:** Настройте myrealm
1. Убедитесь что выбран **myrealm** (в левом верхнем углу)
2. Перейдите в **Realm Settings** → **Login**
3. Найдите **Require SSL** → выберите **none**
4. Нажмите **Save**

**Шаг 6:** Создайте Client для SPA
1. В меню слева выберите **Clients**
2. Нажмите **Create client**
3. Заполните:
   - Client ID: `spa-client`
   - Client Protocol: `openid-connect`
4. Нажмите **Next**
5. Включите:
   - **Standard flow**: ON
   - **Direct access grants**: ON
6. Нажмите **Next**
7. Заполните:
   - Valid redirect URIs: `http://localhost:80/*` и `http://localhost/*`
   - Web origins: `*`
8. Нажмите **Save**

**Шаг 7:** Создайте Client для Backend
1. **Clients** → **Create client**
2. Заполните:
   - Client ID: `admin-service`
3. Нажмите **Next**
4. Включите:
   - **Client authentication**: ON
   - **Service accounts roles**: ON
   - **Direct access grants**: ON
5. Нажмите **Save**
6. Перейдите на вкладку **Credentials**
7. Установите **Client secret**: `wqswKbViD5FwRJTiOnhyQCTT3jjjbaNU`

**Шаг 8:** Создайте Roles
1. В меню слева выберите **Realm roles**
2. Нажмите **Create role**
3. Создайте роли:
   - `ROLE_ADMIN`
   - `ROLE_OPERATOR`
   - `ROLE_MONITOR`

**Шаг 9:** Создайте тестового пользователя
1. В меню слева выберите **Users**
2. Нажмите **Create new user**
3. Заполните:
   - Username: `testuser`
   - Email: `test@example.com`
   - Email verified: ON
4. Нажмите **Create**
5. Перейдите на вкладку **Credentials**
6. Нажмите **Set password**
7. Введите пароль: `testpass`
8. Выключите **Temporary**: OFF
9. Нажмите **Save**

### Вариант 3: Использовать Keycloak 21 (если ничего не помогло)

Если Keycloak 22 продолжает вызывать проблемы, используйте версию 21:

```yaml
# В docker-compose.yaml измените:
keycloak:
  image: quay.io/keycloak/keycloak:21.1.2  # Вместо 22.0.1
  command: start-dev
  # ... остальное без изменений
```

Затем:
```bash
docker-compose down
docker volume rm go-service-template_keycloak-db-data
docker-compose up -d
```

## Проверка

После настройки проверьте:

```bash
# Должен вернуть токен без ошибки HTTPS
curl -X POST "http://localhost:8080/realms/myrealm/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser" \
  -d "password=testpass" \
  -d "grant_type=password" \
  -d "client_id=spa-client"
```

Если получаете токен - всё работает!

## Запуск Backend

```bash
cd go-api
go run main.go
```

Должен запуститься без ошибок HTTPS!

