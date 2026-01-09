#!/bin/bash

echo "==========================================="
echo "ПОЛНОЕ исправление Keycloak (принудительно)"
echo "==========================================="
echo ""

# Останавливаем все
echo "1. Остановка всех сервисов..."
docker-compose down

# Удаляем volumes Keycloak
echo "2. Удаление Keycloak volumes..."
docker volume rm go-service-template_keycloak-db-data 2>/dev/null || echo "   Volume уже удален"

# Удаляем образы (чтобы пересобрать с новыми параметрами)
echo "3. Очистка Keycloak образов..."
docker-compose rm -f keycloak keycloak-db 2>/dev/null || echo "   Контейнеры уже удалены"

# Проверяем docker-compose.yaml
echo ""
echo "4. Проверка docker-compose.yaml..."
if grep -q "KC_HTTP_ENABLED" docker-compose.yaml; then
    echo "   ✓ Параметры HTTP найдены в docker-compose.yaml"
else
    echo "   ❌ ОШИБКА: Параметры HTTP НЕ найдены в docker-compose.yaml"
    echo ""
    echo "   Добавьте в секцию keycloak -> environment:"
    echo "      KC_HTTP_ENABLED: \"true\""
    echo "      KC_HOSTNAME_STRICT: \"false\""
    echo "      KC_HOSTNAME_STRICT_HTTPS: \"false\""
    echo ""
    echo "   И в command:"
    echo "      command: start-dev --http-enabled=true --hostname-strict=false --hostname-strict-https=false"
    echo ""
    exit 1
fi

# Запускаем заново
echo ""
echo "5. Запуск Keycloak DB..."
docker-compose up -d keycloak-db
sleep 5

echo ""
echo "6. Запуск Keycloak с новыми параметрами..."
docker-compose up -d keycloak

echo ""
echo "7. Ожидание полного запуска Keycloak (может занять до 60 секунд)..."
echo "   Это важно - НЕ прерывайте процесс!"

# Более тщательная проверка готовности
max_attempts=60
attempt=1
while [ $attempt -le $max_attempts ]; do
    # Проверяем доступность master realm
    if curl -sf http://localhost:8080/realms/master > /dev/null 2>&1; then
        # Проверяем, что можем получить токен без HTTPS error
        TOKEN_TEST=$(curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
          -H "Content-Type: application/x-www-form-urlencoded" \
          -d "username=admin" \
          -d "password=admin" \
          -d "grant_type=password" \
          -d "client_id=admin-cli" 2>&1)
        
        if echo "$TOKEN_TEST" | grep -q "access_token"; then
            echo ""
            echo "   ✓ Keycloak полностью готов и принимает HTTP запросы!"
            break
        elif echo "$TOKEN_TEST" | grep -q "HTTPS required"; then
            echo ""
            echo "   ❌ Keycloak все еще требует HTTPS"
            echo "   Проверяем логи..."
            docker logs go-service-template-keycloak-1 2>&1 | grep -i "hostname\|http\|ssl" | tail -5
            break
        fi
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo ""
    echo "   ❌ Keycloak не запустился за отведенное время"
    echo ""
    echo "   Проверьте логи:"
    echo "   docker logs go-service-template-keycloak-1"
    exit 1
fi

# Дополнительная пауза для стабилизации
echo ""
echo "8. Финальная стабилизация (10 секунд)..."
sleep 10

# Теперь настраиваем realm
echo ""
echo "9. Настройка realm 'myrealm'..."

TOKEN_RESPONSE=$(curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-cli")

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "   ❌ Не удалось получить токен"
    echo "   Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "   ✓ Токен получен"

# Создаем realm
echo "   Создание realm..."
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
  }' > /dev/null 2>&1

echo "   ✓ Realm создан"

# Создаем клиенты
echo "   Создание клиентов..."
curl -s -X POST "http://localhost:8080/admin/realms/myrealm/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "spa-client",
    "enabled": true,
    "publicClient": true,
    "directAccessGrantsEnabled": true,
    "standardFlowEnabled": true,
    "redirectUris": ["http://localhost:80/*", "http://localhost/*"],
    "webOrigins": ["*"],
    "protocol": "openid-connect"
  }' > /dev/null 2>&1

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
  }' > /dev/null 2>&1

echo "   ✓ Клиенты созданы"

# Создаем роли
echo "   Создание ролей..."
curl -s -X POST "http://localhost:8080/admin/realms/myrealm/roles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "ROLE_ADMIN"}' > /dev/null 2>&1

curl -s -X POST "http://localhost:8080/admin/realms/myrealm/roles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "ROLE_OPERATOR"}' > /dev/null 2>&1

curl -s -X POST "http://localhost:8080/admin/realms/myrealm/roles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "ROLE_MONITOR"}' > /dev/null 2>&1

echo "   ✓ Роли созданы"

echo ""
echo "==========================================="
echo "✅ SUCCESS! Keycloak настроен правильно!"
echo "==========================================="
echo ""
echo "Настройки:"
echo "  • Realm: myrealm"
echo "  • SSL: ОТКЛЮЧЕН (HTTP разрешен)"
echo "  • Clients: spa-client, admin-service"
echo "  • Roles: ROLE_ADMIN, ROLE_OPERATOR, ROLE_MONITOR"
echo ""
echo "Web UI: http://localhost:8080"
echo "  Login: admin / admin"
echo ""
echo "============================================"
echo "ТЕПЕРЬ ЗАПУСТИТЕ ВАШ BACKEND:"
echo "============================================"
echo "  cd go-api"
echo "  go run main.go"
echo ""
echo "Ошибки HTTPS больше НЕ должно быть! ✅"
echo ""

