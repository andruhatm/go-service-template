#!/bin/bash
# Скрипт для быстрой перезагрузки тестовых данных

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     ПЕРЕЗАГРУЗКА ТЕСТОВЫХ ДАННЫХ                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo

# 1. Очистка
echo "🗑️  Очистка старых данных..."
for metric in test_metric_{uptrend,downtrend,daily_season,weekly_season,random_walk,constant,anomalies,trend_season,exponential,step_changes}; do
  curl -s -X POST "http://localhost:8428/api/v1/admin/tsdb/delete_series?match[]=$metric" > /dev/null
done

PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb -c \
  "DELETE FROM mon_objects WHERE name LIKE 'test_node_%'; DELETE FROM metrics_configuration WHERE name LIKE 'test_metric_%';" > /dev/null 2>&1

echo "✓ Очистка завершена"
echo

# 2. Генерация
echo "📝 Генерация новых данных..."
python3 generate_test_nodes.py > /dev/null
python3 generate_test_metrics.py > /dev/null
echo "✓ Данные сгенерированы"
echo

# 3. Загрузка
echo "📤 Загрузка данных..."
PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb < insert_test_nodes_simple.sql > /dev/null 2>&1
PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb < insert_test_metrics_catalog.sql > /dev/null 2>&1
curl -s -X POST "http://localhost:8428/api/v1/import/prometheus" \
  -H "Content-Type: text/plain" \
  --data-binary @test_metrics_prometheus.txt > /dev/null

echo "✓ Данные загружены"
echo

# 4. Проверка
echo "🔍 Проверка результатов..."
NODES=$(PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb -c \
  "SELECT COUNT(*) FROM mon_objects WHERE name LIKE 'test_node_%';" 2>&1 | grep -v warning | tail -3 | head -1 | xargs)
METRICS_CAT=$(PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb -c \
  "SELECT COUNT(*) FROM metrics_configuration WHERE name LIKE 'test_metric_%';" 2>&1 | grep -v warning | tail -3 | head -1 | xargs)
METRICS_VM=$(curl -s 'http://localhost:8428/api/v1/label/__name__/values' | \
  jq '[.data[] | select(startswith("test_metric_"))] | length')

echo "  • Узлов: $NODES"
echo "  • Метрик в каталоге: $METRICS_CAT"
echo "  • Метрик в VictoriaMetrics: $METRICS_VM"
echo

if [ "$NODES" = "10" ] && [ "$METRICS_CAT" = "10" ] && [ "$METRICS_VM" = "10" ]; then
    echo "✅ Все тестовые данные успешно перезагружены!"
    exit 0
else
    echo "⚠️  Некоторые данные не загрузились полностью"
    exit 1
fi
