#!/bin/bash

echo "========================================="
echo "Исправление настроек SSL в Keycloak"
echo "========================================="
echo ""

# Check if Keycloak is running
if ! curl -s http://localhost:8080 > /dev/null; then
    echo "❌ Keycloak не запущен на localhost:8080"
    echo "Запустите: docker-compose up -d keycloak"
    exit 1
fi

echo "✓ Keycloak доступен"
echo ""
echo "Ожидание полной загрузки Keycloak (30 секунд)..."
sleep 30

echo ""
echo "Получение токена администратора..."

# Get admin token
TOKEN=$(curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Не удалось получить токен администратора"
    echo ""
    echo "Попробуйте вручную через Web UI:"
    echo "1. Откройте http://localhost:8080"
    echo "2. Войдите как admin/admin"
    echo "3. Выберите myrealm"
    echo "4. Realm Settings → Login → Require SSL → None"
    exit 1
fi

echo "✓ Токен получен"
echo ""
echo "Обновление настроек realm 'myrealm'..."

# Update realm settings
RESPONSE=$(curl -s -X PUT "http://localhost:8080/admin/realms/myrealm" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sslRequired": "none"
  }')

echo "✓ Настройки обновлены"
echo ""
echo "========================================="
echo "✅ Keycloak настроен для HTTP"
echo "========================================="
echo ""
echo "Теперь запустите ваш backend:"
echo "  cd go-api"
echo "  go run main.go"
echo ""
echo "Ошибка 'HTTPS required' больше не должна появляться!"
echo ""


