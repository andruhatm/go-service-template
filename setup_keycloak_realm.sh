#!/bin/bash

echo "========================================="
echo "Автоматическая настройка Keycloak realm"
echo "========================================="
echo ""

# Wait for Keycloak to be fully ready
echo "Ожидание полной загрузки Keycloak (может занять до 60 секунд)..."
for i in {1..30}; do
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo "✓ Keycloak доступен"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# Get admin token
echo "Получение токена администратора..."
TOKEN_RESPONSE=$(curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-cli")

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Не удалось получить токен. Попробуйте позже или настройте вручную."
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "✓ Токен получен"
echo ""

# Create realm
echo "Создание realm 'myrealm'..."
curl -s -X POST "http://localhost:8080/admin/realms" \
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
  }'

echo "✓ Realm создан"
echo ""

# Create client
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
    "redirectUris": ["http://localhost:80/*", "http://localhost/*"],
    "webOrigins": ["http://localhost:80", "http://localhost"],
    "protocol": "openid-connect"
  }'

echo "✓ Клиент spa-client создан"
echo ""

# Create admin client for backend
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
echo ""

# Create realm roles
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
echo ""

# Create test user
echo "Создание тестового пользователя..."
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

echo "✓ Пользователь создан (testuser/testpass)"
echo ""

echo "========================================="
echo "✅ Keycloak настроен!"
echo "========================================="
echo ""
echo "Настройки:"
echo "  - Realm: myrealm"
echo "  - SSL: ОТКЛЮЧЕН (HTTP разрешен)"
echo "  - Клиенты: spa-client, admin-service"
echo "  - Роли: ROLE_ADMIN, ROLE_OPERATOR, ROLE_MONITOR"
echo "  - Тестовый пользователь: testuser / testpass"
echo ""
echo "Теперь можно запускать backend:"
echo "  cd go-api"
echo "  go run main.go"
echo ""
echo "Web UI: http://localhost:8080"
echo "  Admin: admin / admin"
echo ""


