#!/bin/bash
# Скрипт для загрузки тестовых метрик в VictoriaMetrics

set -e

echo "=========================================="
echo "Загрузка тестовых метрик в VictoriaMetrics"
echo "=========================================="
echo

# Проверка наличия файла
if [ ! -f "test_metrics_prometheus.txt" ]; then
    echo "❌ Файл test_metrics_prometheus.txt не найден!"
    echo "Сначала запустите: python3 generate_test_metrics.py"
    exit 1
fi

# Конфигурация
VICTORIA_URL="${VICTORIA_METRICS_URL:-http://localhost:8428}"

echo "URL VictoriaMetrics: $VICTORIA_URL"
echo

# Проверка доступности VictoriaMetrics
echo "Проверка доступности VictoriaMetrics..."
if curl -s -f "${VICTORIA_URL}/health" > /dev/null; then
    echo "✓ VictoriaMetrics доступна"
else
    echo "❌ VictoriaMetrics недоступна по адресу $VICTORIA_URL"
    echo "Убедитесь, что VictoriaMetrics запущена:"
    echo "  docker-compose up -d victoriametrics"
    exit 1
fi

echo

# Загрузка данных
echo "Загрузка данных..."
FILE_SIZE=$(wc -c < test_metrics_prometheus.txt)
echo "Размер файла: $FILE_SIZE байт"

if curl -X POST "${VICTORIA_URL}/api/v1/import/prometheus" \
    -H "Content-Type: text/plain" \
    --data-binary @test_metrics_prometheus.txt \
    -w "\nHTTP Status: %{http_code}\n"; then
    echo
    echo "✓ Данные успешно загружены!"
else
    echo
    echo "❌ Ошибка при загрузке данных"
    exit 1
fi

echo
echo "=========================================="
echo "ЗАГРУЗКА ЗАВЕРШЕНА"
echo "=========================================="
echo
echo "Проверить данные можно запросами:"
echo
echo "1. Все метрики:"
echo "   curl '${VICTORIA_URL}/api/v1/label/__name__/values'"
echo
echo "2. Конкретная метрика (например, test_metric_uptrend):"
echo "   curl '${VICTORIA_URL}/api/v1/query?query=test_metric_uptrend'"
echo
echo "3. Временной ряд:"
echo "   curl '${VICTORIA_URL}/api/v1/query_range?query=test_metric_daily_season&start=$(date -u -d '30 days ago' +%s)&end=$(date -u +%s)&step=3600'"
echo

# Опционально: показать загруженные метрики
echo "Загруженные метрики:"
curl -s "${VICTORIA_URL}/api/v1/label/__name__/values" | grep -o '"test_metric_[^"]*"' | sort | uniq

echo
echo "Готово! Теперь можно создавать прогнозы в UI."


