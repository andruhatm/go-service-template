#!/bin/bash

echo "========================================="
echo "Назначение ролей для admin-service"
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
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "✓ Токен получен"
echo ""

# Получаем ID клиента admin-service
echo "Поиск клиента admin-service..."
CLIENTS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/admin/realms/myrealm/clients")

ADMIN_SERVICE_ID=$(echo "$CLIENTS" | grep -o '"id":"[^"]*","clientId":"admin-service"' | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_SERVICE_ID" ]; then
    echo "❌ Клиент admin-service не найден"
    exit 1
fi

echo "✓ Клиент найден: $ADMIN_SERVICE_ID"
echo ""

# Получаем ID клиента realm-management
echo "Поиск клиента realm-management..."
REALM_MGMT_ID=$(echo "$CLIENTS" | grep -o '"id":"[^"]*","clientId":"realm-management"' | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$REALM_MGMT_ID" ]; then
    echo "❌ Клиент realm-management не найден"
    exit 1
fi

echo "✓ realm-management найден: $REALM_MGMT_ID"
echo ""

# Получаем service account user для admin-service
echo "Получение service account пользователя..."
SERVICE_ACCOUNT=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/admin/realms/myrealm/clients/$ADMIN_SERVICE_ID/service-account-user")

SERVICE_ACCOUNT_ID=$(echo "$SERVICE_ACCOUNT" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$SERVICE_ACCOUNT_ID" ]; then
    echo "❌ Service account не найден. Убедитесь, что у клиента admin-service включен 'Service Accounts Enabled'"
    exit 1
fi

echo "✓ Service account найден: $SERVICE_ACCOUNT_ID"
echo ""

# Получаем доступные роли realm-management
echo "Получение доступных ролей realm-management..."
AVAILABLE_ROLES=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/admin/realms/myrealm/users/$SERVICE_ACCOUNT_ID/role-mappings/clients/$REALM_MGMT_ID/available")

echo "Доступные роли:"
echo "$AVAILABLE_ROLES" | grep -o '"name":"[^"]*' | cut -d'"' -f4

# Извлекаем роль realm-admin (самая важная)
REALM_ADMIN_ROLE=$(echo "$AVAILABLE_ROLES" | grep -o '{"id":"[^"]*","name":"realm-admin"[^}]*}' | head -1)

if [ -z "$REALM_ADMIN_ROLE" ]; then
    echo "⚠️  Роль realm-admin не найдена среди доступных (возможно уже назначена)"
    
    # Проверяем текущие роли
    echo ""
    echo "Проверка текущих ролей..."
    CURRENT_ROLES=$(curl -s -H "Authorization: Bearer $TOKEN" \
      "http://localhost:8080/admin/realms/myrealm/users/$SERVICE_ACCOUNT_ID/role-mappings/clients/$REALM_MGMT_ID")
    
    echo "Текущие роли:"
    echo "$CURRENT_ROLES" | grep -o '"name":"[^"]*' | cut -d'"' -f4
    
    if echo "$CURRENT_ROLES" | grep -q "realm-admin"; then
        echo ""
        echo "✓ Роль realm-admin уже назначена!"
        echo ""
        echo "========================================="
        echo "✅ Настройка завершена!"
        echo "========================================="
        exit 0
    fi
else
    echo ""
    echo "Назначение роли realm-admin..."
    
    # Назначаем роль realm-admin
    ASSIGN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "[$REALM_ADMIN_ROLE]" \
      "http://localhost:8080/admin/realms/myrealm/users/$SERVICE_ACCOUNT_ID/role-mappings/clients/$REALM_MGMT_ID")
    
    HTTP_CODE=$(echo "$ASSIGN_RESPONSE" | tail -1)
    
    if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
        echo "✓ Роль realm-admin успешно назначена!"
    else
        echo "⚠️  Получен код ответа: $HTTP_CODE"
        echo "Response: $ASSIGN_RESPONSE"
    fi
fi

echo ""
echo "========================================="
echo "✅ Настройка завершена!"
echo "========================================="
echo ""
echo "Теперь:"
echo "1. Перезапустите backend (если он запущен)"
echo "2. Обновите страницу админ панели"
echo "3. Счетчики должны показать реальные данные"
echo ""
