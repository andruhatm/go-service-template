#!/bin/bash

echo "========================================="
echo "Полная настройка Keycloak для разработки"
echo "========================================="
echo ""

# Функция для проверки готовности Keycloak
wait_for_keycloak() {
    echo "Проверка доступности Keycloak..."
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf http://localhost:8080/realms/master > /dev/null 2>&1; then
            echo "✓ Keycloak готов к работе!"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo ""
    echo "❌ Keycloak не запустился за отведенное время"
    return 1
}

# Проверяем, запущен ли Keycloak
if ! docker ps | grep -q keycloak; then
    echo "Keycloak не запущен. Запускаем..."
    docker-compose up -d keycloak
fi

# Ждем готовности Keycloak
if ! wait_for_keycloak; then
    exit 1
fi

echo ""
echo "Дополнительное ожидание для полной готовности (10 секунд)..."
sleep 10

# Получаем admin токен
echo ""
echo "Получение токена администратора..."
TOKEN_RESPONSE=$(curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-cli")

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Не удалось получить токен администратора"
    echo "Response: $TOKEN_RESPONSE"
    echo ""
    echo "Попробуйте через несколько секунд еще раз:"
    echo "  bash setup_keycloak_complete.sh"
    exit 1
fi

echo "✓ Токен получен"

# Проверяем, существует ли realm
echo ""
echo "Проверка существования realm 'myrealm'..."
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/admin/realms/myrealm")

if [ "$REALM_EXISTS" = "200" ]; then
    echo "Realm 'myrealm' уже существует. Обновляем настройки SSL..."
    
    # Обновляем существующий realm
    curl -s -X PUT "http://localhost:8080/admin/realms/myrealm" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "realm": "myrealm",
        "enabled": true,
        "sslRequired": "none"
      }'
    
    echo "✓ Realm обновлен (SSL отключен)"
else
    echo "Создание нового realm 'myrealm'..."
    
    # Создаем новый realm
    CREATE_RESPONSE=$(curl -s -X POST "http://localhost:8080/admin/realms" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "realm": "myrealm",
        "enabled": true,
        "sslRequired": "none",
        "registrationAllowed": false,
        "loginWithEmailAllowed": true,
        "duplicateEmailsAllowed": false,
        "resetPasswordAllowed": true,
        "editUsernameAllowed": false,
        "bruteForceProtected": true
      }')
    
    if [ -n "$CREATE_RESPONSE" ]; then
        echo "Ответ: $CREATE_RESPONSE"
    fi
    
    echo "✓ Realm создан"
    
    # Создаем клиент spa-client
    echo ""
    echo "Создание клиента 'spa-client'..."
    curl -s -X POST "http://localhost:8080/admin/realms/myrealm/clients" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "clientId": "spa-client",
        "enabled": true,
        "publicClient": true,
        "directAccessGrantsEnabled": true,
        "standardFlowEnabled": true,
        "implicitFlowEnabled": false,
        "serviceAccountsEnabled": false,
        "redirectUris": ["http://localhost:80/*", "http://localhost/*", "http://localhost:4200/*"],
        "webOrigins": ["http://localhost:80", "http://localhost", "http://localhost:4200"],
        "protocol": "openid-connect"
      }'
    
    echo "✓ Клиент spa-client создан"
    
    # Создаем клиент admin-service
    echo ""
    echo "Создание клиента 'admin-service'..."
    curl -s -X POST "http://localhost:8080/admin/realms/myrealm/clients" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "clientId": "admin-service",
        "enabled": true,
        "publicClient": false,
        "secret": "wqswKbViD5FwRJTiOnhyQCTT3jjjbaNU",
        "directAccessGrantsEnabled": true,
        "serviceAccountsEnabled": true,
        "protocol": "openid-connect"
      }'
    
    echo "✓ Клиент admin-service создан"
    
    # Создаем роли
    echo ""
    echo "Создание ролей..."
    curl -s -X POST "http://localhost:8080/admin/realms/myrealm/roles" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"name": "ROLE_ADMIN", "description": "Administrator role"}'
    
    curl -s -X POST "http://localhost:8080/admin/realms/myrealm/roles" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"name": "ROLE_OPERATOR", "description": "Operator role"}'
    
    curl -s -X POST "http://localhost:8080/admin/realms/myrealm/roles" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"name": "ROLE_MONITOR", "description": "Monitor role"}'
    
    echo "✓ Роли созданы"
    
    # Создаем тестового пользователя
    echo ""
    echo "Создание тестового пользователя 'testuser'..."
    curl -s -X POST "http://localhost:8080/admin/realms/myrealm/users" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "username": "testuser",
        "email": "test@example.com",
        "enabled": true,
        "emailVerified": true,
        "credentials": [
          {
            "type": "password",
            "value": "testpass",
            "temporary": false
          }
        ]
      }'
    
    echo "✓ Пользователь создан (testuser / testpass)"
fi

# Проверяем финальную конфигурацию
echo ""
echo "Проверка конфигурации realm..."
REALM_CONFIG=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/admin/realms/myrealm")

SSL_REQUIRED=$(echo "$REALM_CONFIG" | grep -o '"sslRequired":"[^"]*' | cut -d'"' -f4)

echo ""
echo "========================================="
echo "✅ Keycloak полностью настроен!"
echo "========================================="
echo ""
echo "Конфигурация:"
echo "  - Realm: myrealm"
echo "  - SSL Required: $SSL_REQUIRED (должно быть 'none' или 'NONE')"
echo "  - Clients: spa-client, admin-service"
echo "  - Roles: ROLE_ADMIN, ROLE_OPERATOR, ROLE_MONITOR"
echo "  - Test User: testuser / testpass"
echo ""
echo "Keycloak Admin UI: http://localhost:8080"
echo "  Login: admin / admin"
echo ""
echo "Теперь можно запускать backend:"
echo "  cd go-api"
echo "  go run main.go"
echo ""
echo "Backend должен запуститься БЕЗ ошибок HTTPS!"
echo ""


