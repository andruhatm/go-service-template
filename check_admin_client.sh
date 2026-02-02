#!/bin/bash

echo "========================================="
echo "Проверка настроек admin-service"
echo "========================================="
echo ""

# Получаем admin токен
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
    exit 1
fi

echo "✓ Токен получен"
echo ""

# Получаем информацию о клиенте admin-service
echo "Получение информации о клиенте admin-service..."
CLIENTS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/admin/realms/myrealm/clients?clientId=admin-service")

echo "$CLIENTS" | python3 -m json.tool 2>/dev/null || echo "$CLIENTS"
echo ""

# Получаем ID клиента
ADMIN_SERVICE_ID=$(echo "$CLIENTS" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ADMIN_SERVICE_ID" ]; then
    echo "❌ Клиент admin-service не найден"
    exit 1
fi

echo "ID клиента: $ADMIN_SERVICE_ID"
echo ""

# Получаем секрет клиента
echo "Получение секрета клиента..."
SECRET_INFO=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/admin/realms/myrealm/clients/$ADMIN_SERVICE_ID/client-secret")

echo "Секрет:"
echo "$SECRET_INFO" | python3 -m json.tool 2>/dev/null || echo "$SECRET_INFO"
echo ""

# Проверяем текущий секрет из конфига
echo "Секрет из конфигурации (configuration.local.yaml):"
grep "admin_client_secret" go-api/configuration.local.yaml
echo ""

# Пытаемся получить токен с текущими credentials
echo "========================================="
echo "Тест получения токена для admin-service:"
echo "========================================="
echo ""

TEST_SECRET="wqswKbViD5FwRJTiOnhyQCTT3jjjbaNU"

TOKEN_TEST=$(curl -s -X POST "http://localhost:8080/realms/myrealm/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=admin-service" \
  -d "client_secret=$TEST_SECRET")

echo "Ответ:"
echo "$TOKEN_TEST" | python3 -m json.tool 2>/dev/null || echo "$TOKEN_TEST"
echo ""

if echo "$TOKEN_TEST" | grep -q "access_token"; then
    echo "✅ Токен успешно получен!"
else
    echo "❌ Не удалось получить токен"
    echo ""
    echo "Попробуйте обновить секрет клиента в Keycloak:"
    echo "1. Откройте http://localhost:8080"
    echo "2. Войдите как admin/admin"
    echo "3. Выберите realm 'myrealm'"
    echo "4. Clients -> admin-service"
    echo "5. Вкладка Credentials"
    echo "6. Нажмите 'Regenerate' и скопируйте новый секрет"
    echo "7. Обновите секрет в go-api/configuration.local.yaml"
fi
