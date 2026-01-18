# Команды для работы с тестовыми данными

## 🚀 Быстрый старт (одна команда)

### Вариант 1: Bash скрипт (работает без Keycloak токена)
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template
echo "y" | ./cleanup_and_recreate.sh
```

### Вариант 2: Python скрипт (полная автоматизация с токеном)
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template
python3 cleanup_and_recreate_test_data.py
```

---

## 📋 Пошаговые команды

### 1️⃣ ОЧИСТКА ТЕСТОВЫХ ДАННЫХ

#### Удалить метрики из VictoriaMetrics
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template

# Удалить все тестовые метрики
for metric in test_metric_{uptrend,downtrend,daily_season,weekly_season,random_walk,constant,anomalies,trend_season,exponential,step_changes}; do
  curl -X POST "http://localhost:8428/api/v1/admin/tsdb/delete_series?match[]=$metric"
done
```

#### Удалить узлы из PostgreSQL
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template

# Удалить тестовые узлы
PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb -c \
  "DELETE FROM mon_objects WHERE name LIKE 'test_node_%';"
```

#### Удалить метрики из каталога
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template

# Удалить из каталога метрик
PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb -c \
  "DELETE FROM metrics_configuration WHERE name LIKE 'test_metric_%';"
```

#### Удалить прогнозы (опционально)
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template

# Удалить тестовые прогнозы
PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb -c \
  "DELETE FROM forecasts WHERE metric_name LIKE 'test_metric_%';"
```

---

### 2️⃣ ГЕНЕРАЦИЯ НОВЫХ ДАННЫХ

#### Сгенерировать узлы
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template
python3 generate_test_nodes.py
```

#### Сгенерировать метрики
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template
python3 generate_test_metrics.py
```

---

### 3️⃣ ЗАГРУЗКА НОВЫХ ДАННЫХ

#### Загрузить узлы в PostgreSQL
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template
PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb < insert_test_nodes_simple.sql
```

#### Загрузить метрики в каталог
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template
PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb < insert_test_metrics_catalog.sql
```

#### Загрузить данные метрик в VictoriaMetrics
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template
curl -X POST "http://localhost:8428/api/v1/import/prometheus" \
  -H "Content-Type: text/plain" \
  --data-binary @test_metrics_prometheus.txt
```

---

### 4️⃣ ПРОВЕРКА РЕЗУЛЬТАТОВ

#### Проверить узлы
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template

# Количество узлов
PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb -c \
  "SELECT COUNT(*) as nodes FROM mon_objects WHERE name LIKE 'test_node_%';"

# Список узлов
PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb -c \
  "SELECT name, type, manufacturer FROM mon_objects WHERE name LIKE 'test_node_%' ORDER BY name;"
```

#### Проверить метрики в каталоге
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template

# Количество метрик
PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb -c \
  "SELECT COUNT(*) as metrics FROM metrics_configuration WHERE name LIKE 'test_metric_%';"

# Список метрик
PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb -c \
  "SELECT name, unit, \"group\" FROM metrics_configuration WHERE name LIKE 'test_metric_%' ORDER BY name;"
```

#### Проверить данные в VictoriaMetrics
```bash
# Список метрик
curl -s 'http://localhost:8428/api/v1/label/__name__/values' | \
  jq '.data[] | select(startswith("test_metric_"))'

# Количество точек данных
curl -s 'http://localhost:8428/api/v1/query?query=count(test_metric_uptrend{name="test_node_01"})' | \
  jq -r '.data.result[0].value[1]'
```

---

## 🔄 ПОЛНЫЙ ЦИКЛ (все команды подряд)

### Скопируйте и выполните:

```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template

echo "============================================"
echo "1. ОЧИСТКА СТАРЫХ ДАННЫХ"
echo "============================================"

# Удаление метрик из VictoriaMetrics
for metric in test_metric_{uptrend,downtrend,daily_season,weekly_season,random_walk,constant,anomalies,trend_season,exponential,step_changes}; do
  curl -s -X POST "http://localhost:8428/api/v1/admin/tsdb/delete_series?match[]=$metric" > /dev/null
  echo "Удалена метрика: $metric"
done

# Удаление из PostgreSQL
PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb -c \
  "DELETE FROM mon_objects WHERE name LIKE 'test_node_%';" 2>&1 | grep DELETE

PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb -c \
  "DELETE FROM metrics_configuration WHERE name LIKE 'test_metric_%';" 2>&1 | grep DELETE

echo ""
echo "============================================"
echo "2. ГЕНЕРАЦИЯ НОВЫХ ДАННЫХ"
echo "============================================"

python3 generate_test_nodes.py > /dev/null
echo "✓ Узлы сгенерированы"

python3 generate_test_metrics.py > /dev/null
echo "✓ Метрики сгенерированы"

echo ""
echo "============================================"
echo "3. ЗАГРУЗКА НОВЫХ ДАННЫХ"
echo "============================================"

PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb < insert_test_nodes_simple.sql 2>&1 | grep "INSERT"
PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb < insert_test_metrics_catalog.sql 2>&1 | grep "INSERT"

curl -s -X POST "http://localhost:8428/api/v1/import/prometheus" \
  -H "Content-Type: text/plain" \
  --data-binary @test_metrics_prometheus.txt > /dev/null
echo "✓ Данные загружены в VictoriaMetrics"

echo ""
echo "============================================"
echo "4. ПРОВЕРКА РЕЗУЛЬТАТОВ"
echo "============================================"

echo -n "Узлов: "
PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb -c \
  "SELECT COUNT(*) FROM mon_objects WHERE name LIKE 'test_node_%';" 2>&1 | grep -v warning | tail -3 | head -1 | xargs

echo -n "Метрик в каталоге: "
PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb -c \
  "SELECT COUNT(*) FROM metrics_configuration WHERE name LIKE 'test_metric_%';" 2>&1 | grep -v warning | tail -3 | head -1 | xargs

echo -n "Метрик в VictoriaMetrics: "
curl -s 'http://localhost:8428/api/v1/label/__name__/values' | \
  jq '[.data[] | select(startswith("test_metric_"))] | length'

echo ""
echo "✅ ГОТОВО!"
```

---

## 🎯 Создание скрипта для быстрого запуска

### Создать удобный скрипт:

```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template

cat > reload_test_data.sh << 'EOF'
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
EOF

chmod +x reload_test_data.sh
```

### Затем просто запускайте:

```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template
./reload_test_data.sh
```

---

## 📌 Сохранить в избранное

### Алиасы для быстрого доступа (добавить в ~/.zshrc или ~/.bashrc):

```bash
# Добавить в ~/.zshrc:
alias test-data-reload='cd /Users/andrewgerasimov/GolandProjects/go-service-template && ./reload_test_data.sh'
alias test-data-check='cd /Users/andrewgerasimov/GolandProjects/go-service-template && PGPASSWORD=pass docker-compose exec -T db psql -U user -d appdb -c "SELECT COUNT(*) FROM mon_objects WHERE name LIKE '\''test_node_%'\'';" && curl -s '\''http://localhost:8428/api/v1/label/__name__/values'\'' | jq '\''[.data[] | select(startswith("test_metric_"))] | length'\'''

# Затем:
source ~/.zshrc

# Использование:
test-data-reload
test-data-check
```

---

## 🆘 Устранение проблем

### Если сервисы недоступны:

```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template

# Проверить статус
docker-compose ps

# Перезапустить нужные сервисы
docker-compose restart db victoriametrics go-api

# Подождать готовности
sleep 10
```

### Если база данных заблокирована:

```bash
# Перезапустить PostgreSQL
docker-compose restart db
sleep 5
```

---

## 📚 Связанная документация

- **CLEANUP_GUIDE.md** - подробное руководство по очистке
- **QUICKSTART_TEST_METRICS.md** - быстрый старт по метрикам
- **QUICKSTART_TEST_NODES.md** - быстрый старт по узлам

---

**Сохраните этот файл для быстрого доступа к командам!** 📋

