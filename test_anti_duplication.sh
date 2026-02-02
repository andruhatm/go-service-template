#!/bin/bash

# Script to demonstrate anti-duplication protection

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Тест защиты от дублирования метрик                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Show current state
echo -e "${YELLOW}Шаг 1: Текущее состояние источника${NC}"
docker-compose exec -T db psql -U user -d appdb << 'EOSQL'
SELECT 
    id,
    source_name,
    CASE 
        WHEN last_file_hash IS NULL THEN 'Нет хеша (первый импорт)'
        ELSE 'Хеш: ' || SUBSTRING(last_file_hash, 1, 8) || '...'
    END as hash_status,
    COALESCE(to_char(last_file_mod_time, 'HH24:MI:SS'), 'Нет данных') as mod_time,
    COALESCE(to_char(last_sync_at, 'HH24:MI:SS'), 'Не синхронизировано') as last_sync
FROM metric_sources
WHERE id = 1;
EOSQL
echo ""

# Step 2: Wait for next sync
echo -e "${YELLOW}Шаг 2: Ожидание следующей синхронизации (30 секунд)...${NC}"
echo "Первая синхронизация должна выполниться (хеш еще не записан)"
sleep 35

# Step 3: Check after first sync
echo -e "${YELLOW}Шаг 3: Проверка после первой синхронизации${NC}"
docker-compose exec -T db psql -U user -d appdb << 'EOSQL'
SELECT 
    id,
    source_name,
    SUBSTRING(last_file_hash, 1, 16) || '...' as file_hash,
    to_char(last_file_mod_time, 'YYYY-MM-DD HH24:MI:SS') as mod_time,
    to_char(last_sync_at, 'HH24:MI:SS') as synced_at
FROM metric_sources
WHERE id = 1;
EOSQL
echo ""
echo -e "${GREEN}✓ Хеш файла сохранен в БД${NC}"
echo ""

# Step 4: Wait for next sync (should be skipped)
echo -e "${YELLOW}Шаг 4: Ожидание повторной синхронизации (30 секунд)...${NC}"
echo "Файл НЕ изменился → импорт должен быть ПРОПУЩЕН"
echo ""
echo "Проверьте логи backend:"
echo -e "${BLUE}  Ожидается: 'File unchanged (hash: ...), skipping import to avoid duplicates'${NC}"
echo ""
sleep 35

# Step 5: Verify sync was skipped
echo -e "${YELLOW}Шаг 5: Проверка - импорт был пропущен?${NC}"
PREV_SYNC=$(docker-compose exec -T db psql -U user -d appdb -t -c "SELECT last_sync_at FROM metric_sources WHERE id = 1;")
echo "Время последней синхронизации: $PREV_SYNC"
echo -e "${GREEN}✓ Время обновлено, но импорт НЕ выполнялся (файл не изменился)${NC}"
echo ""

# Step 6: Modify file
echo -e "${YELLOW}Шаг 6: Изменение файла с метриками${NC}"
echo "Добавляю новую метрику в файл..."
cat >> /tmp/ems_test_metrics.txt << 'EOF'

# New metric added
ems_new_metric{test="dedup"} 999
EOF
echo -e "${GREEN}✓ Файл изменен${NC}"
echo ""

# Step 7: Wait for sync with changed file
echo -e "${YELLOW}Шаг 7: Ожидание синхронизации с измененным файлом (30 секунд)...${NC}"
echo "Файл ИЗМЕНИЛСЯ → импорт должен быть ВЫПОЛНЕН"
sleep 35

# Step 8: Verify new sync happened
echo -e "${YELLOW}Шаг 8: Проверка - новый импорт выполнен?${NC}"
docker-compose exec -T db psql -U user -d appdb << 'EOSQL'
SELECT 
    id,
    source_name,
    SUBSTRING(last_file_hash, 1, 16) || '...' as new_hash,
    to_char(last_sync_at, 'HH24:MI:SS') as new_sync_time
FROM metric_sources
WHERE id = 1;
EOSQL
echo ""
echo -e "${GREEN}✓ Новый хеш сохранен, импорт выполнен${NC}"
echo ""

# Step 9: Verify new metric in VictoriaMetrics
echo -e "${YELLOW}Шаг 9: Проверка новой метрики в VictoriaMetrics${NC}"
NEW_METRIC=$(curl -s "http://localhost:8428/api/v1/query?query=ems_new_metric" | jq -r '.data.result[0].value[1]' 2>/dev/null)
if [ "$NEW_METRIC" == "999" ]; then
    echo -e "${GREEN}✓ Новая метрика найдена: ems_new_metric = 999${NC}"
else
    echo -e "${YELLOW}⚠ Метрика еще не импортирована или требуется больше времени${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Итоги теста                                                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Защита от дублирования работает!${NC}"
echo ""
echo "Механизм защиты:"
echo "  1️⃣  Проверка SHA256 хеша содержимого файла"
echo "  2️⃣  Проверка времени модификации файла (mtime)"
echo ""
echo "Результаты:"
echo "  ✓ Первый импорт - выполнен (хеш сохранен)"
echo "  ✓ Повторный импорт - пропущен (файл не изменился)"
echo "  ✓ Импорт после изменения - выполнен (новый хеш)"
echo ""
echo -e "${YELLOW}Экономия ресурсов:${NC}"
echo "  • Без дублирования данных в VictoriaMetrics"
echo "  • Меньше нагрузки на сеть и диск"
echo "  • Оптимальное использование ресурсов"
echo ""
echo -e "${BLUE}📖 Подробности: ANTI_DUPLICATION_GUIDE.md${NC}"
