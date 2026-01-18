# Руководство по очистке и пересозданию тестовых данных

## 🎯 Назначение

Эти скрипты позволяют полностью очистить старые тестовые данные и создать новые для тестирования функции прогнозирования.

## 📁 Доступные скрипты

### 1. `cleanup_and_recreate_test_data.py` (рекомендуется)
**Python скрипт с полной автоматизацией**

- ✅ Автоматическое получение токена от Keycloak
- ✅ Удаление тестовых узлов из БД
- ✅ Удаление тестовых метрик из VictoriaMetrics
- ✅ Генерация новых данных
- ✅ Создание новых узлов
- ✅ Загрузка новых метрик
- ✅ Проверка результатов

### 2. `cleanup_and_recreate.sh`
**Bash скрипт (работает без токена для метрик)**

- ✅ Удаление метрик из VictoriaMetrics (без токена)
- ✅ Генерация новых данных
- ✅ Загрузка новых метрик
- ⚠️ Удаление/создание узлов только с токеном

## 🚀 Использование

### Метод 1: Python скрипт (полная очистка)

```bash
# Запустить полную очистку и пересоздание
python3 cleanup_and_recreate_test_data.py
```

**Что происходит:**
1. Автоматически получает токен от Keycloak
2. Удаляет все тестовые узлы из PostgreSQL
3. Удаляет все тестовые метрики из VictoriaMetrics
4. Генерирует новые данные
5. Создает новые узлы через API
6. Загружает новые метрики
7. Проверяет результаты

**Требования:**
- Keycloak должен быть запущен
- Учетные данные админа (по умолчанию admin/admin123)

### Метод 2: Bash скрипт (быстрая очистка метрик)

```bash
# Сделать исполняемым
chmod +x cleanup_and_recreate.sh

# Запустить
./cleanup_and_recreate.sh
```

**Без токена:**
- Удаляет метрики ✓
- Генерирует новые данные ✓
- Загружает метрики ✓
- НЕ трогает узлы ✗

**С токеном:**
```bash
export KEYCLOAK_TOKEN="your_admin_token"
./cleanup_and_recreate.sh
```
- Делает всё, включая узлы ✓

### Метод 3: Ручная очистка

#### Удалить только метрики
```bash
# VictoriaMetrics
for metric in uptrend downtrend daily_season weekly_season random_walk constant anomalies trend_season exponential step_changes; do
  curl -X POST "http://localhost:8428/api/v1/admin/tsdb/delete_series?match[]=test_metric_$metric"
done

# Загрузить новые
python3 generate_test_metrics.py
./load_test_metrics.sh
```

#### Удалить только узлы
```bash
# Получить токен
export TOKEN=$(python3 -c "from load_test_nodes_auto import get_keycloak_token; print(get_keycloak_token())")

# Удалить все тестовые узлы
curl -s 'http://localhost:8080/api/mon-objects' | \
  jq -r '.items[] | select(.name | startswith("test_node_")) | .id' | \
  while read ID; do
    curl -X DELETE "http://localhost:8080/api/mon-objects/$ID" -H "Authorization: Bearer $TOKEN"
  done

# Создать новые
python3 generate_test_nodes.py
python3 load_test_nodes_auto.py
```

#### Удалить всё
```bash
# 1. Метрики
for metric in uptrend downtrend daily_season weekly_season random_walk constant anomalies trend_season exponential step_changes; do
  curl -X POST "http://localhost:8428/api/v1/admin/tsdb/delete_series?match[]=test_metric_$metric"
done

# 2. Узлы (требуется токен)
export TOKEN=$(python3 -c "from load_test_nodes_auto import get_keycloak_token; print(get_keycloak_token())")

curl -s 'http://localhost:8080/api/mon-objects' | \
  jq -r '.items[] | select(.name | startswith("test_node_")) | .id' | \
  while read ID; do
    curl -X DELETE "http://localhost:8080/api/mon-objects/$ID" -H "Authorization: Bearer $TOKEN"
  done

# 3. Пересоздать
python3 generate_test_nodes.py && python3 load_test_nodes_auto.py
python3 generate_test_metrics.py && ./load_test_metrics.sh
```

## 🔧 Конфигурация

### Переменные окружения

```bash
# URL сервисов
export API_URL="http://localhost:8080"
export VICTORIA_METRICS_URL="http://localhost:8428"
export KEYCLOAK_URL="http://localhost:8180"

# Keycloak настройки
export KEYCLOAK_REALM="monitoring"
export KEYCLOAK_CLIENT="monitoring-client"

# Учетные данные
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="admin123"
```

## 📊 Что удаляется

### Тестовые узлы (10 штук)
- `test_node_01` ... `test_node_10`

### Тестовые метрики (10 штук)
- `test_metric_uptrend`
- `test_metric_downtrend`
- `test_metric_daily_season`
- `test_metric_weekly_season`
- `test_metric_random_walk`
- `test_metric_constant`
- `test_metric_anomalies`
- `test_metric_trend_season`
- `test_metric_exponential`
- `test_metric_step_changes`

### Точки данных
- ~7210 точек (721 час × 10 метрик)

## ✅ Проверка результатов

### После выполнения скрипта

```bash
# Проверить узлы
curl -s 'http://localhost:8080/api/mon-objects' | \
  jq '[.items[] | select(.name | startswith("test_node_"))] | length'
# Должно быть: 10

# Проверить метрики
curl -s 'http://localhost:8428/api/v1/label/__name__/values' | \
  jq '[.[] | select(startswith("test_metric_"))] | length'
# Должно быть: 10

# Проверить точки данных
curl -s 'http://localhost:8428/api/v1/query?query=count(test_metric_uptrend{name="test_node_01"})' | \
  jq -r '.data.result[0].value[1]'
# Должно быть: ~721
```

## 🐛 Устранение неполадок

### Ошибка: Connection refused (Keycloak)

```bash
# Проверить статус
docker-compose ps keycloak

# Запустить Keycloak
docker-compose up -d keycloak

# Дождаться готовности (30-60 сек)
sleep 60
curl http://localhost:8180/health
```

**Решение:** Использовать bash скрипт без токена
```bash
./cleanup_and_recreate.sh
# Затем создать узлы вручную:
python3 load_test_nodes_auto.py
```

### Ошибка: Connection refused (VictoriaMetrics)

```bash
# Проверить VictoriaMetrics
docker-compose ps victoriametrics
docker-compose up -d victoriametrics

# Проверить health
curl http://localhost:8428/health
```

### Ошибка: Connection refused (Go API)

```bash
# Проверить Go API
docker-compose ps go-api
docker-compose restart go-api

# Проверить readiness
curl http://localhost:8080/probes/readiness
```

### Узлы не удаляются

**Причина:** Нет токена или нет прав

**Решение:**
```bash
# Вариант 1: Получить токен
export TOKEN=$(python3 -c "from load_test_nodes_auto import get_keycloak_token; print(get_keycloak_token())")

# Вариант 2: Удалить через БД напрямую
docker-compose exec postgres psql -U monitoring -d monitoring_db -c "DELETE FROM mon_objects WHERE name LIKE 'test_node_%';"
```

### Метрики не удаляются

**Причина:** VictoriaMetrics недоступна

**Решение:**
```bash
# Перезапустить VictoriaMetrics
docker-compose restart victoriametrics

# Проверить доступность
curl http://localhost:8428/health

# Повторить удаление
for metric in test_metric_{uptrend,downtrend,daily_season,weekly_season,random_walk,constant,anomalies,trend_season,exponential,step_changes}; do
  curl -X POST "http://localhost:8428/api/v1/admin/tsdb/delete_series?match[]=$metric"
done
```

## 📝 Примеры сценариев

### Сценарий 1: Быстрая перезагрузка метрик

```bash
# Только метрики (без узлов)
./cleanup_and_recreate.sh
```

### Сценарий 2: Полная пересборка

```bash
# Всё с нуля (с Keycloak)
python3 cleanup_and_recreate_test_data.py
```

### Сценарий 3: Пересоздание после сбоя

```bash
# Если что-то пошло не так
# 1. Проверить сервисы
docker-compose ps

# 2. Запустить необходимые
docker-compose up -d postgres keycloak go-api victoriametrics forecast-service

# 3. Дождаться готовности
sleep 60

# 4. Повторить
python3 cleanup_and_recreate_test_data.py
```

### Сценарий 4: Тестирование в CI/CD

```bash
#!/bin/bash
# test_pipeline.sh

# Подготовка
docker-compose up -d
sleep 60

# Создание тестовых данных
python3 cleanup_and_recreate_test_data.py

# Проверка
NODE_COUNT=$(curl -s 'http://localhost:8080/api/mon-objects' | jq '[.items[] | select(.name | startswith("test_node_"))] | length')
METRIC_COUNT=$(curl -s 'http://localhost:8428/api/v1/label/__name__/values' | jq '[.[] | select(startswith("test_metric_"))] | length')

if [ "$NODE_COUNT" -ge "10" ] && [ "$METRIC_COUNT" -ge "10" ]; then
    echo "✓ Тестовое окружение готово"
    exit 0
else
    echo "❌ Тестовое окружение не готово"
    exit 1
fi
```

## 🎯 Best Practices

### Перед тестированием

1. **Всегда очищайте старые данные**
   ```bash
   python3 cleanup_and_recreate_test_data.py
   ```

2. **Проверяйте статус сервисов**
   ```bash
   docker-compose ps
   ```

3. **Дожидайтесь готовности**
   ```bash
   # Особенно Keycloak (30-60 сек)
   sleep 60
   ```

### После тестирования

1. **Можно оставить данные** для повторных тестов
2. **Или очистить** перед следующей итерацией
3. **Удалить прогнозы** если нужно:
   ```sql
   DELETE FROM forecasts WHERE metric_name LIKE 'test_metric_%';
   ```

### Для production

⚠️ **НИКОГДА не запускайте эти скрипты в production!**

Они удаляют данные по шаблону `test_*` - убедитесь, что:
- У вас нет реальных узлов с именами `test_node_*`
- У вас нет реальных метрик с именами `test_metric_*`

## 📚 Связанная документация

- **QUICKSTART_TEST_METRICS.md** - Быстрый старт по метрикам
- **QUICKSTART_TEST_NODES.md** - Быстрый старт по узлам
- **TEST_METRICS_GUIDE.md** - Подробное руководство по метрикам
- **TEST_NODES_GUIDE.md** - Подробное руководство по узлам

## 📞 Поддержка

При проблемах:
1. Проверьте логи: `docker-compose logs`
2. Проверьте статус: `docker-compose ps`
3. Проверьте документацию выше
4. Попробуйте ручную очистку

---

**Версия:** 1.0.0  
**Дата:** 2026-01-13

