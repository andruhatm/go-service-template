#!/bin/bash
# Упрощенный скрипт для очистки и пересоздания тестовых данных
# Работает без токена для удаления метрик из VictoriaMetrics

set -e

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    ОЧИСТКА И ПЕРЕСОЗДАНИЕ ТЕСТОВЫХ ДАННЫХ                    ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo

# Конфигурация
API_URL="${API_URL:-http://localhost:8080}"
VICTORIA_URL="${VICTORIA_METRICS_URL:-http://localhost:8428}"

# Проверка наличия токена
if [ -z "$KEYCLOAK_TOKEN" ]; then
    echo "⚠  KEYCLOAK_TOKEN не установлен"
    echo
    echo "Будет выполнено:"
    echo "  ✓ Удаление метрик из VictoriaMetrics"
    echo "  ✓ Генерация новых данных"
    echo "  ✓ Загрузка метрик в VictoriaMetrics"
    echo "  ✗ Удаление узлов из БД (требуется токен)"
    echo "  ✗ Создание узлов через API (требуется токен)"
    echo
    echo "Для полной очистки установите токен:"
    echo "  export KEYCLOAK_TOKEN=your_admin_token"
    echo "  или запустите: python3 cleanup_and_recreate_test_data.py"
    echo
    read -p "Продолжить без удаления узлов? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    echo
fi

# ============================================================================
# ШАГ 1: УДАЛЕНИЕ ТЕСТОВЫХ УЗЛОВ (если есть токен)
# ============================================================================
if [ -n "$KEYCLOAK_TOKEN" ]; then
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "                        ШАГ 1: УДАЛЕНИЕ ТЕСТОВЫХ УЗЛОВ                          "
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo

    echo "📊 Получение списка тестовых узлов..."
    
    # Получаем список узлов и фильтруем тестовые
    NODES=$(curl -s "${API_URL}/api/mon-objects" | \
            jq -r '.items[] | select(.name | startswith("test_node_")) | .id')
    
    NODE_COUNT=$(echo "$NODES" | grep -c . || echo "0")
    
    if [ "$NODE_COUNT" -eq "0" ]; then
        echo "✓ Тестовые узлы не найдены (уже удалены)"
    else
        echo "Найдено тестовых узлов: $NODE_COUNT"
        echo
        
        DELETED=0
        FAILED=0
        
        for NODE_ID in $NODES; do
            NODE_NAME=$(curl -s "${API_URL}/api/mon-objects" | \
                       jq -r ".items[] | select(.id==\"$NODE_ID\") | .name")
            
            echo -n "  Удаление $NODE_NAME... "
            
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
                -X DELETE "${API_URL}/api/mon-objects/${NODE_ID}" \
                -H "Authorization: Bearer $KEYCLOAK_TOKEN")
            
            if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
                echo "✓"
                DELETED=$((DELETED + 1))
            else
                echo "❌ HTTP $HTTP_CODE"
                FAILED=$((FAILED + 1))
            fi
        done
        
        echo
        echo "Удалено узлов: $DELETED"
        echo "Ошибок: $FAILED"
    fi
    echo
fi

# ============================================================================
# ШАГ 2: УДАЛЕНИЕ ТЕСТОВЫХ МЕТРИК
# ============================================================================
echo "════════════════════════════════════════════════════════════════════════════════"
echo "                       ШАГ 2: УДАЛЕНИЕ ТЕСТОВЫХ МЕТРИК                          "
echo "════════════════════════════════════════════════════════════════════════════════"
echo

echo "Удаление метрик из VictoriaMetrics..."
echo

METRICS=(
    "test_metric_uptrend"
    "test_metric_downtrend"
    "test_metric_daily_season"
    "test_metric_weekly_season"
    "test_metric_random_walk"
    "test_metric_constant"
    "test_metric_anomalies"
    "test_metric_trend_season"
    "test_metric_exponential"
    "test_metric_step_changes"
)

DELETED=0

for METRIC in "${METRICS[@]}"; do
    echo -n "  Удаление $METRIC... "
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "${VICTORIA_URL}/api/v1/admin/tsdb/delete_series?match[]=${METRIC}")
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
        echo "✓"
    else
        echo "⚠ HTTP $HTTP_CODE (возможно уже удалена)"
    fi
    DELETED=$((DELETED + 1))
done

echo
echo "Обработано метрик: $DELETED"
echo

# ============================================================================
# ШАГ 3: ГЕНЕРАЦИЯ ТЕСТОВЫХ ДАННЫХ
# ============================================================================
echo "════════════════════════════════════════════════════════════════════════════════"
echo "                      ШАГ 3: ГЕНЕРАЦИЯ ТЕСТОВЫХ ДАННЫХ                          "
echo "════════════════════════════════════════════════════════════════════════════════"
echo

echo "1. Генерация тестовых узлов..."
python3 generate_test_nodes.py > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Узлы сгенерированы"
else
    echo "❌ Ошибка при генерации узлов"
    exit 1
fi

echo

echo "2. Генерация тестовых метрик..."
python3 generate_test_metrics.py > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Метрики сгенерированы"
else
    echo "❌ Ошибка при генерации метрик"
    exit 1
fi

echo

# ============================================================================
# ШАГ 4: СОЗДАНИЕ ТЕСТОВЫХ УЗЛОВ (если есть токен)
# ============================================================================
if [ -n "$KEYCLOAK_TOKEN" ]; then
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "                       ШАГ 4: СОЗДАНИЕ ТЕСТОВЫХ УЗЛОВ                           "
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo

    echo "Создание узлов через API..."
    echo

    SUCCESS=0
    FAILED=0

    # Читаем JSON файл и создаем узлы
    jq -c '.[]' test_nodes.json | while read NODE; do
        NODE_NAME=$(echo "$NODE" | jq -r '.name')
        echo -n "  Создание $NODE_NAME... "
        
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST "${API_URL}/api/mon-objects" \
            -H "Authorization: Bearer $KEYCLOAK_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$NODE")
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
            echo "✓"
            SUCCESS=$((SUCCESS + 1))
        elif [ "$HTTP_CODE" = "409" ]; then
            echo "⚠ Уже существует"
            SUCCESS=$((SUCCESS + 1))
        else
            echo "❌ HTTP $HTTP_CODE"
            FAILED=$((FAILED + 1))
        fi
    done

    echo
else
    echo "⏭  Пропуск создания узлов (нет токена)"
    echo "   Запустите вручную: python3 load_test_nodes_auto.py"
    echo
fi

# ============================================================================
# ШАГ 5: ЗАГРУЗКА ТЕСТОВЫХ МЕТРИК
# ============================================================================
echo "════════════════════════════════════════════════════════════════════════════════"
echo "                      ШАГ 5: ЗАГРУЗКА ТЕСТОВЫХ МЕТРИК                           "
echo "════════════════════════════════════════════════════════════════════════════════"
echo

echo "Загрузка метрик в VictoriaMetrics..."
echo

FILE_SIZE=$(wc -c < test_metrics_prometheus.txt)
echo "Размер данных: $FILE_SIZE байт"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${VICTORIA_URL}/api/v1/import/prometheus" \
    -H "Content-Type: text/plain" \
    --data-binary @test_metrics_prometheus.txt)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    echo "✓ Метрики успешно загружены"
else
    echo "❌ Ошибка загрузки: HTTP $HTTP_CODE"
    exit 1
fi

echo

# ============================================================================
# ШАГ 6: ПРОВЕРКА ДАННЫХ
# ============================================================================
echo "════════════════════════════════════════════════════════════════════════════════"
echo "                           ШАГ 6: ПРОВЕРКА ДАННЫХ                               "
echo "════════════════════════════════════════════════════════════════════════════════"
echo

echo "1. Проверка узлов в базе данных..."
NODE_COUNT=$(curl -s "${API_URL}/api/mon-objects" | \
             jq '[.items[] | select(.name | startswith("test_node_"))] | length')

if [ "$NODE_COUNT" -ge "10" ]; then
    echo "   ✓ Найдено $NODE_COUNT тестовых узлов"
else
    echo "   ⚠ Найдено только $NODE_COUNT узлов (ожидалось 10)"
fi

echo

echo "2. Проверка метрик в VictoriaMetrics..."
METRIC_COUNT=$(curl -s "${VICTORIA_URL}/api/v1/label/__name__/values" | \
               jq '[.data[] | select(startswith("test_metric_"))] | length')

if [ "$METRIC_COUNT" -ge "10" ]; then
    echo "   ✓ Найдено $METRIC_COUNT тестовых метрик"
else
    echo "   ⚠ Найдено только $METRIC_COUNT метрик (ожидалось 10)"
fi

echo

echo "3. Проверка количества точек данных..."
DATA_POINTS=$(curl -s "${VICTORIA_URL}/api/v1/query?query=count(test_metric_uptrend{name=\"test_node_01\"})" | \
              jq -r '.data.result[0].value[1] // "0"' | cut -d. -f1)

if [ "$DATA_POINTS" -gt "700" ]; then
    echo "   ✓ test_metric_uptrend: $DATA_POINTS точек данных"
else
    echo "   ⚠ test_metric_uptrend: только $DATA_POINTS точек (ожидалось ~721)"
fi

echo

# ============================================================================
# РЕЗУЛЬТАТ
# ============================================================================
echo "════════════════════════════════════════════════════════════════════════════════"
echo "                                 РЕЗУЛЬТАТ                                       "
echo "════════════════════════════════════════════════════════════════════════════════"
echo

if [ "$NODE_COUNT" -ge "10" ] && [ "$METRIC_COUNT" -ge "10" ] && [ "$DATA_POINTS" -gt "700" ]; then
    echo "✅ ВСЕ ТЕСТОВЫЕ ДАННЫЕ УСПЕШНО СОЗДАНЫ!"
    echo
    echo "Что создано:"
    echo "  • $NODE_COUNT тестовых узлов (monitoring objects)"
    echo "  • $METRIC_COUNT тестовых метрик"
    echo "  • ~$DATA_POINTS точек данных на метрику"
    echo
    echo "Теперь можно:"
    echo "  1. Открыть UI: http://localhost:4200/anomaly"
    echo "  2. Создать прогноз для test_metric_uptrend + test_node_01"
    echo "  3. Просмотреть результаты на графике"
    echo
    echo "Проверить данные:"
    echo "  • Узлы:   curl ${API_URL}/api/mon-objects"
    echo "  • Метрики: curl ${VICTORIA_URL}/api/v1/label/__name__/values"
    echo
else
    echo "⚠ ТЕСТОВЫЕ ДАННЫЕ СОЗДАНЫ С ПРЕДУПРЕЖДЕНИЯМИ"
    echo
    echo "Проверьте:"
    echo "  • Узлы: $NODE_COUNT (ожидалось 10)"
    echo "  • Метрики: $METRIC_COUNT (ожидалось 10)"
    echo "  • Точки данных: $DATA_POINTS (ожидалось ~721)"
    echo
    if [ -z "$KEYCLOAK_TOKEN" ]; then
        echo "Для создания узлов запустите:"
        echo "  python3 load_test_nodes_auto.py"
        echo
    fi
fi

