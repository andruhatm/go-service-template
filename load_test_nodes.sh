#!/bin/bash
# Скрипт для создания тестовых monitoring objects через API
# Требуется токен аутентификации с ролью ADMIN

set -e

# Конфигурация
API_URL="${API_URL:-http://localhost:8080}"
TOKEN="${KEYCLOAK_TOKEN}"

if [ -z "$TOKEN" ]; then
    echo "❌ Ошибка: Не установлена переменная KEYCLOAK_TOKEN"
    echo "Получите токен через Keycloak и установите: export KEYCLOAK_TOKEN=your_token"
    echo ""
    echo "Или используйте test_mon_objects_api.sh для создания узлов"
    exit 1
fi

echo "=========================================="
echo "Создание тестовых monitoring objects"
echo "=========================================="
echo

# Счетчик успешных созданий
SUCCESS_COUNT=0
TOTAL_COUNT=10

# 1. Создание test_node_01 (Тестовый узел для метрики с восходящим трендом)
echo "1. Создание test_node_01..."
RESPONSE=$(curl -s -X POST "${API_URL}/api/mon-objects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "test_node_01", "type": "eNodeB", "technology": "4G", "platform": "Ericsson", "network": "Test Network", "manufacturer": "Ericsson"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✓ test_node_01 создан успешно"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
elif [ "$HTTP_CODE" = "409" ]; then
    echo "⚠ test_node_01 уже существует"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo "❌ Ошибка при создании test_node_01: HTTP $HTTP_CODE"
    echo "$BODY"
fi
echo

# 2. Создание test_node_02 (Тестовый узел для метрики с нисходящим трендом)
echo "2. Создание test_node_02..."
RESPONSE=$(curl -s -X POST "${API_URL}/api/mon-objects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "test_node_02", "type": "eNodeB", "technology": "4G", "platform": "Huawei", "network": "Test Network", "manufacturer": "Huawei"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✓ test_node_02 создан успешно"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
elif [ "$HTTP_CODE" = "409" ]; then
    echo "⚠ test_node_02 уже существует"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo "❌ Ошибка при создании test_node_02: HTTP $HTTP_CODE"
    echo "$BODY"
fi
echo

# 3. Создание test_node_03 (Тестовый узел для метрики с суточной сезонностью)
echo "3. Создание test_node_03..."
RESPONSE=$(curl -s -X POST "${API_URL}/api/mon-objects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "test_node_03", "type": "gNodeB", "technology": "5G", "platform": "Nokia", "network": "Test Network", "manufacturer": "Nokia"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✓ test_node_03 создан успешно"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
elif [ "$HTTP_CODE" = "409" ]; then
    echo "⚠ test_node_03 уже существует"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo "❌ Ошибка при создании test_node_03: HTTP $HTTP_CODE"
    echo "$BODY"
fi
echo

# 4. Создание test_node_04 (Тестовый узел для метрики с недельной сезонностью)
echo "4. Создание test_node_04..."
RESPONSE=$(curl -s -X POST "${API_URL}/api/mon-objects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "test_node_04", "type": "gNodeB", "technology": "5G", "platform": "Samsung", "network": "Test Network", "manufacturer": "Samsung"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✓ test_node_04 создан успешно"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
elif [ "$HTTP_CODE" = "409" ]; then
    echo "⚠ test_node_04 уже существует"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo "❌ Ошибка при создании test_node_04: HTTP $HTTP_CODE"
    echo "$BODY"
fi
echo

# 5. Создание test_node_05 (Тестовый узел для метрики со случайным блужданием)
echo "5. Создание test_node_05..."
RESPONSE=$(curl -s -X POST "${API_URL}/api/mon-objects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "test_node_05", "type": "eNodeB", "technology": "4G", "platform": "ZTE", "network": "Test Network", "manufacturer": "ZTE"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✓ test_node_05 создан успешно"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
elif [ "$HTTP_CODE" = "409" ]; then
    echo "⚠ test_node_05 уже существует"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo "❌ Ошибка при создании test_node_05: HTTP $HTTP_CODE"
    echo "$BODY"
fi
echo

# 6. Создание test_node_06 (Тестовый узел для метрики с константным значением)
echo "6. Создание test_node_06..."
RESPONSE=$(curl -s -X POST "${API_URL}/api/mon-objects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "test_node_06", "type": "Server", "technology": "Core", "platform": "Dell", "network": "Test Network", "manufacturer": "Dell"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✓ test_node_06 создан успешно"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
elif [ "$HTTP_CODE" = "409" ]; then
    echo "⚠ test_node_06 уже существует"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo "❌ Ошибка при создании test_node_06: HTTP $HTTP_CODE"
    echo "$BODY"
fi
echo

# 7. Создание test_node_07 (Тестовый узел для метрики с аномалиями)
echo "7. Создание test_node_07..."
RESPONSE=$(curl -s -X POST "${API_URL}/api/mon-objects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "test_node_07", "type": "Router", "technology": "Network", "platform": "Cisco", "network": "Test Network", "manufacturer": "Cisco"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✓ test_node_07 создан успешно"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
elif [ "$HTTP_CODE" = "409" ]; then
    echo "⚠ test_node_07 уже существует"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo "❌ Ошибка при создании test_node_07: HTTP $HTTP_CODE"
    echo "$BODY"
fi
echo

# 8. Создание test_node_08 (Тестовый узел для метрики с трендом и сезонностью)
echo "8. Создание test_node_08..."
RESPONSE=$(curl -s -X POST "${API_URL}/api/mon-objects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "test_node_08", "type": "gNodeB", "technology": "5G", "platform": "Ericsson", "network": "Test Network", "manufacturer": "Ericsson"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✓ test_node_08 создан успешно"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
elif [ "$HTTP_CODE" = "409" ]; then
    echo "⚠ test_node_08 уже существует"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo "❌ Ошибка при создании test_node_08: HTTP $HTTP_CODE"
    echo "$BODY"
fi
echo

# 9. Создание test_node_09 (Тестовый узел для метрики с экспоненциальным ростом)
echo "9. Создание test_node_09..."
RESPONSE=$(curl -s -X POST "${API_URL}/api/mon-objects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "test_node_09", "type": "eNodeB", "technology": "4G", "platform": "Huawei", "network": "Test Network", "manufacturer": "Huawei"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✓ test_node_09 создан успешно"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
elif [ "$HTTP_CODE" = "409" ]; then
    echo "⚠ test_node_09 уже существует"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo "❌ Ошибка при создании test_node_09: HTTP $HTTP_CODE"
    echo "$BODY"
fi
echo

# 10. Создание test_node_10 (Тестовый узел для метрики со ступенчатыми изменениями)
echo "10. Создание test_node_10..."
RESPONSE=$(curl -s -X POST "${API_URL}/api/mon-objects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "test_node_10", "type": "Server", "technology": "Core", "platform": "HP", "network": "Test Network", "manufacturer": "HP"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✓ test_node_10 создан успешно"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
elif [ "$HTTP_CODE" = "409" ]; then
    echo "⚠ test_node_10 уже существует"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo "❌ Ошибка при создании test_node_10: HTTP $HTTP_CODE"
    echo "$BODY"
fi
echo

echo "=========================================="
echo "РЕЗУЛЬТАТ"
echo "=========================================="
echo "Успешно создано/существует: $SUCCESS_COUNT из $TOTAL_COUNT"
echo

if [ $SUCCESS_COUNT -eq $TOTAL_COUNT ]; then
    echo "✓ Все тестовые узлы готовы!"
    echo ""
    echo "Проверить список узлов:"
    echo "  curl '${API_URL}/api/mon-objects'"
    exit 0
else
    echo "⚠ Некоторые узлы не были созданы"
    exit 1
fi