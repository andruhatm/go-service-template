# ✅ Реализация: Генератор тестовых Monitoring Objects

## 🎯 Задача
Создать скрипт для генерации тестовых monitoring objects (узлов), соответствующих тестовым метрикам для полного цикла тестирования прогнозирования.

## ✅ Выполнено

### 📦 Созданные компоненты

#### 1. Python скрипты (2 файла)

**`generate_test_nodes.py`** (14 KB) - Генератор данных
- ✅ 10 тестовых узлов различных типов
- ✅ Соответствие тестовым метрикам
- ✅ Экспорт в JSON и bash скрипт
- ✅ Генерация документации
- ✅ Статистика и сводки

**`load_test_nodes_auto.py`** (4 KB) - Автоматический загрузчик
- ✅ Автоматическое получение токена от Keycloak
- ✅ Создание узлов через API
- ✅ Обработка ошибок
- ✅ Подробный вывод результатов

#### 2. Сгенерированные файлы (4 файла)

| Файл | Размер | Содержимое |
|------|--------|-----------|
| **test_nodes.json** | 1.6 KB | Данные узлов в JSON |
| **load_test_nodes.sh** | 11 KB | Bash скрипт с curl |
| **test_nodes_summary.txt** | 3.9 KB | Сводная информация |
| **test_nodes_info.md** | 2.7 KB | Markdown документация |

#### 3. Документация (2 файла)

| Файл | Размер | Назначение |
|------|--------|-----------|
| **QUICKSTART_TEST_NODES.md** | 2 KB | 🚀 Быстрый старт |
| **TEST_NODES_GUIDE.md** | 11 KB | 📚 Подробное руководство |

---

## 📊 Созданные узлы

### Полный список (10 узлов)

| № | Имя | Тип | Технология | Производитель | Метрика |
|---|-----|-----|------------|---------------|---------|
| 1 | `test_node_01` | eNodeB | 4G | Ericsson | `test_metric_uptrend` |
| 2 | `test_node_02` | eNodeB | 4G | Huawei | `test_metric_downtrend` |
| 3 | `test_node_03` | gNodeB | 5G | Nokia | `test_metric_daily_season` |
| 4 | `test_node_04` | gNodeB | 5G | Samsung | `test_metric_weekly_season` |
| 5 | `test_node_05` | eNodeB | 4G | ZTE | `test_metric_random_walk` |
| 6 | `test_node_06` | Server | Core | Dell | `test_metric_constant` |
| 7 | `test_node_07` | Router | Network | Cisco | `test_metric_anomalies` |
| 8 | `test_node_08` | gNodeB | 5G | Ericsson | `test_metric_trend_season` |
| 9 | `test_node_09` | eNodeB | 4G | Huawei | `test_metric_exponential` |
| 10 | `test_node_10` | Server | Core | HP | `test_metric_step_changes` |

### Разнообразие типов

- **eNodeB (4G):** 4 узла - Ericsson, Huawei, ZTE
- **gNodeB (5G):** 3 узла - Nokia, Samsung, Ericsson
- **Server (Core):** 2 узла - Dell, HP
- **Router (Network):** 1 узел - Cisco

---

## 🚀 Использование

### Быстрый старт (2 команды)

```bash
# 1. Генерация данных
python3 generate_test_nodes.py

# 2. Автоматическая загрузка
python3 load_test_nodes_auto.py
```

### С ручным токеном

```bash
# 1. Генерация
python3 generate_test_nodes.py

# 2. Получить токен
export KEYCLOAK_TOKEN="your_admin_token"

# 3. Загрузить
./load_test_nodes.sh
```

---

## 🔗 Интеграция с метриками

Каждый узел соответствует одной тестовой метрике:

```
test_metric_uptrend     → test_node_01 (eNodeB 4G)
test_metric_downtrend   → test_node_02 (eNodeB 4G)
test_metric_daily_*     → test_node_03 (gNodeB 5G)
test_metric_weekly_*    → test_node_04 (gNodeB 5G)
test_metric_random_*    → test_node_05 (eNodeB 4G)
test_metric_constant    → test_node_06 (Server Core)
test_metric_anomalies   → test_node_07 (Router)
test_metric_trend_*     → test_node_08 (gNodeB 5G)
test_metric_exponential → test_node_09 (eNodeB 4G)
test_metric_step_*      → test_node_10 (Server Core)
```

---

## 🎨 Особенности реализации

### 1. Автоматическое получение токена

Скрипт `load_test_nodes_auto.py` автоматически:
1. Подключается к Keycloak
2. Аутентифицируется как администратор
3. Получает access token
4. Использует токен для создания узлов

**Код получения токена:**
```python
def get_keycloak_token() -> str:
    token_url = f'{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token'
    data = {
        'grant_type': 'password',
        'client_id': KEYCLOAK_CLIENT,
        'username': ADMIN_USERNAME,
        'password': ADMIN_PASSWORD
    }
    # ... запрос токена
```

### 2. Структура данных узла

```json
{
  "name": "test_node_01",
  "type": "eNodeB",
  "technology": "4G",
  "platform": "Ericsson",
  "network": "Test Network",
  "manufacturer": "Ericsson"
}
```

### 3. API интеграция

**Endpoint:** `POST /api/mon-objects`

**Требования:**
- Content-Type: application/json
- Authorization: Bearer {token}
- Роль: ROLE_ADMIN

**Responses:**
- 200/201: Успешно создан
- 409: Уже существует
- 401: Не авторизован
- 403: Нет прав доступа

### 4. Обработка дубликатов

Если узел уже существует (HTTP 409), скрипт:
- Считает это успехом
- Выводит предупреждение ⚠
- Продолжает создание остальных

---

## 📈 Статистика

```
Всего узлов:           10
Типов устройств:       4 (eNodeB, gNodeB, Server, Router)
Технологий:            3 (4G, 5G, Core, Network)
Производителей:        7 (Ericsson, Huawei, Nokia, Samsung, ZTE, Dell, HP, Cisco)
Размер JSON:           1.6 KB
Размер bash скрипта:   11 KB
```

---

## 🎯 Полный тестовый сценарий

### 1. Создание инфраструктуры

```bash
# Запуск сервисов
docker-compose up -d postgres keycloak go-api victoriametrics forecast-service

# Ожидание готовности
sleep 30
```

### 2. Создание узлов

```bash
# Генерация и загрузка
python3 generate_test_nodes.py
python3 load_test_nodes_auto.py
```

### 3. Загрузка метрик

```bash
# Генерация и загрузка
python3 generate_test_metrics.py
./load_test_metrics.sh
```

### 4. Проверка

```bash
# Проверить узлы
curl 'http://localhost:8080/api/mon-objects' | jq '.total'
# Должно быть >= 10

# Проверить метрики
curl 'http://localhost:8428/api/v1/label/__name__/values' | jq '. | length'
# Должно быть >= 10
```

### 5. Создание прогноза

1. UI: `http://localhost:4200/anomaly`
2. Создать прогноз:
   - Метрика: `test_metric_uptrend`
   - Объект: `test_node_01`
   - Периоды: 168
3. Дождаться завершения
4. Просмотреть график (кнопка 👁️)

---

## 🔍 Проверка данных

### Через API

```bash
# Все узлы
curl -s 'http://localhost:8080/api/mon-objects' | jq '.items[] | .name'

# Конкретный узел
curl -s 'http://localhost:8080/api/mon-objects' | jq '.items[] | select(.name=="test_node_01")'

# Количество
curl -s 'http://localhost:8080/api/mon-objects' | jq '.total'
```

### Через базу данных

```sql
-- Все тестовые узлы
SELECT id, name, type, technology, manufacturer 
FROM mon_objects 
WHERE name LIKE 'test_node_%' 
ORDER BY name;

-- Группировка по типам
SELECT type, COUNT(*) as count 
FROM mon_objects 
WHERE name LIKE 'test_node_%' 
GROUP BY type;

-- Группировка по технологиям
SELECT technology, COUNT(*) as count 
FROM mon_objects 
WHERE name LIKE 'test_node_%' 
GROUP BY technology;
```

---

## 🧪 Примеры использования

### Пример 1: Быстрое создание окружения

```bash
#!/bin/bash
# setup_test_environment.sh

echo "Создание тестового окружения..."

# 1. Узлы
python3 generate_test_nodes.py
python3 load_test_nodes_auto.py

# 2. Метрики
python3 generate_test_metrics.py
./load_test_metrics.sh

echo "✓ Тестовое окружение готово!"
```

### Пример 2: Проверка соответствия

```bash
#!/bin/bash
# verify_test_data.sh

# Проверить, что все узлы созданы
for i in {01..10}; do
  NODE="test_node_$i"
  EXISTS=$(curl -s "http://localhost:8080/api/mon-objects" | jq ".items[] | select(.name==\"$NODE\") | .name" -r)
  
  if [ "$EXISTS" = "$NODE" ]; then
    echo "✓ $NODE существует"
  else
    echo "❌ $NODE не найден"
  fi
done
```

### Пример 3: Автоматизированный тест прогноза

```bash
#!/bin/bash
# test_forecast_pipeline.sh

# 1. Создать узлы и метрики
python3 generate_test_nodes.py
python3 load_test_nodes_auto.py
python3 generate_test_metrics.py
./load_test_metrics.sh

# 2. Создать прогноз через API
TOKEN=$(python3 -c "from load_test_nodes_auto import get_keycloak_token; print(get_keycloak_token())")

FORECAST_ID=$(curl -s -X POST "http://localhost:8080/api/forecasts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mon_object_name": "test_node_01",
    "metric_name": "test_metric_uptrend",
    "from_timestamp": '$(date -u -d '30 days ago' +%s)',
    "forecast_periods": 168,
    "freq": "H"
  }' | jq -r '.id')

echo "Создан прогноз: $FORECAST_ID"

# 3. Ожидание завершения
echo "Ожидание завершения прогноза..."
for i in {1..60}; do
  STATUS=$(curl -s "http://localhost:8080/api/forecasts/$FORECAST_ID" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.status')
  
  echo "  Статус: $STATUS"
  
  if [ "$STATUS" = "completed" ]; then
    echo "✓ Прогноз завершен успешно!"
    exit 0
  elif [ "$STATUS" = "failed" ]; then
    echo "❌ Прогноз завершился с ошибкой"
    exit 1
  fi
  
  sleep 5
done

echo "⏱ Timeout: прогноз не завершился за 5 минут"
exit 1
```

---

## 🧹 Очистка

### Удалить все тестовые узлы

```bash
# Получить токен
TOKEN=$(python3 -c "from load_test_nodes_auto import get_keycloak_token; print(get_keycloak_token())")

# Удалить все тестовые узлы
curl -s 'http://localhost:8080/api/mon-objects' | jq -r '.items[] | select(.name | startswith("test_node_")) | .id' | while read ID; do
  curl -X DELETE "http://localhost:8080/api/mon-objects/$ID" -H "Authorization: Bearer $TOKEN"
  echo "Удален: $ID"
done
```

### Удалить файлы

```bash
rm -f test_nodes*.json test_nodes*.txt test_nodes*.md load_test_nodes.sh load_test_nodes_auto.py
```

---

## 📚 Связанная документация

### Созданная в этой задаче
- **QUICKSTART_TEST_NODES.md** - Быстрый старт
- **TEST_NODES_GUIDE.md** - Подробное руководство
- **test_nodes_summary.txt** - Сводка
- **test_nodes_info.md** - Markdown таблицы

### Для полного цикла тестирования
- **QUICKSTART_TEST_METRICS.md** - Быстрый старт по метрикам
- **TEST_METRICS_GUIDE.md** - Руководство по метрикам
- **FORECAST_DETAIL_VIEW_GUIDE.md** - Просмотр прогнозов
- **COMPLETE_TEST_METRICS_IMPLEMENTATION.md** - Итоги по метрикам

---

## 🎉 Итоги

### Что получили
✅ **2 Python скрипта** для генерации и загрузки  
✅ **10 тестовых узлов** различных типов и технологий  
✅ **Автоматическое получение токена** от Keycloak  
✅ **Полное соответствие метрикам** для тестирования  
✅ **4 сгенерированных файла** (JSON, bash, txt, md)  
✅ **2 файла документации** с инструкциями  

### Применение
🎯 Создание тестовых объектов мониторинга  
🎯 Интеграция с тестовыми метриками  
🎯 Полный цикл тестирования прогнозирования  
🎯 Автоматизированное тестирование  
🎯 Демонстрация функциональности  

### Преимущества
⚡ Быстрое создание (2 команды)  
⚡ Автоматическая аутентификация  
⚡ Обработка ошибок и дубликатов  
⚡ Подробная документация  
⚡ Готовность к автоматизации  

---

**Статус:** ✅ Полностью реализовано и готово к использованию  
**Версия:** 1.0.0  
**Дата:** 2026-01-13  

**Приятного тестирования! 🎊**


