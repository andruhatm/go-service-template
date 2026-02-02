# Исправление проблемы с нулями в админ панели

## Проблема
При открытии админ панели счетчики показывали нули из-за неправильного секрета клиента `admin-service`.

## Диагностика
Лог показывал:
```
[ERROR] Failed to get admin token via client credentials: unauthorized_client
[ERROR] Failed to get users count: failed to get users count, status: 403
```

## Причина
Секрет клиента `admin-service` в конфигурации (`wqswKbViD5FwRJTiOnhyQCTT3jjjbaNU`) не совпадал с реальным секретом в Keycloak (`Bt0kQ0aQyzjbVr7Vnslr4CThTwfqVXeY`).

## Решение
Обновлены файлы конфигурации:
- ✅ `go-api/configuration.local.yaml`
- ✅ `go-api/configuration.yaml`

Секрет изменен на правильный: `Bt0kQ0aQyzjbVr7Vnslr4CThTwfqVXeY`

## Что нужно сделать

### 1. Перезапустите backend
Остановите текущий процесс go-api (если запущен) и запустите заново:

```bash
cd go-api
go run main.go
```

### 2. Обновите админ панель
Откройте админ панель в браузере и обновите страницу (F5 или Cmd+R).

### 3. Проверка
Счетчики должны показать реальные данные:
- **Пользователи**: количество пользователей в Keycloak
- **Активные сессии**: текущие активные сессии
- **Клиенты**: количество клиентов (spa-client, admin-service и др.)
- **Роли**: количество realm ролей
- **События входа**: количество успешных входов (из последних 100 событий)
- **Ошибки**: количество ошибок входа

## Дополнительная информация

### Service Account роли
Клиент `admin-service` уже имеет все необходимые роли:
- ✅ `realm-admin` (главная роль с полным доступом)
- ✅ `view-users`, `query-users`
- ✅ `view-realm`, `view-events`
- ✅ `view-clients`, `query-clients`
- ✅ И другие административные роли

### Тестирование токена вручную
Проверить получение токена можно командой:

```bash
curl -X POST "http://localhost:8080/realms/myrealm/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=admin-service" \
  -d "client_secret=Bt0kQ0aQyzjbVr7Vnslr4CThTwfqVXeY"
```

Должен вернуть JSON с `access_token`.

### Тестирование Admin API
Проверить работу Admin API можно командой:

```bash
# Получаем токен
TOKEN=$(curl -s -X POST "http://localhost:8080/realms/myrealm/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=admin-service" \
  -d "client_secret=Bt0kQ0aQyzjbVr7Vnslr4CThTwfqVXeY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Получаем количество пользователей
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/admin/realms/myrealm/users/count"
```

Должен вернуть число (например, `1` или `2`).

## Файлы
- ✅ `go-api/configuration.local.yaml` - обновлен секрет
- ✅ `go-api/configuration.yaml` - обновлен секрет
- 📝 `fix_admin_service_roles.sh` - скрипт проверки и назначения ролей
- 📝 `check_admin_client.sh` - скрипт диагностики клиента
