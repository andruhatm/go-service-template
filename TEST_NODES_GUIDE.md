# Руководство по тестовым Monitoring Objects (узлам)

## Обзор

Набор скриптов для создания тестовых monitoring objects (узлов/нодов), соответствующих тестовым метрикам. Эти узлы используются для организации и группировки метрик в системе прогнозирования.

## Созданные узлы

### Список (10 узлов)

| № | Имя | Тип | Технология | Платформа | Производитель | Назначение |
|---|-----|-----|------------|-----------|---------------|------------|
| 1 | `test_node_01` | eNodeB | 4G | Ericsson | Ericsson | Метрика с восходящим трендом |
| 2 | `test_node_02` | eNodeB | 4G | Huawei | Huawei | Метрика с нисходящим трендом |
| 3 | `test_node_03` | gNodeB | 5G | Nokia | Nokia | Метрика с суточной сезонностью |
| 4 | `test_node_04` | gNodeB | 5G | Samsung | Samsung | Метрика с недельной сезонностью |
| 5 | `test_node_05` | eNodeB | 4G | ZTE | ZTE | Метрика со случайным блужданием |
| 6 | `test_node_06` | Server | Core | Dell | Dell | Метрика с константным значением |
| 7 | `test_node_07` | Router | Network | Cisco | Cisco | Метрика с аномалиями |
| 8 | `test_node_08` | gNodeB | 5G | Ericsson | Ericsson | Метрика с трендом и сезонностью |
| 9 | `test_node_09` | eNodeB | 4G | Huawei | Huawei | Метрика с экспоненциальным ростом |
| 10 | `test_node_10` | Server | Core | HP | HP | Метрика со ступенчатыми изменениями |

### Соответствие с метриками

| Метрика | Узел | Паттерн |
|---------|------|---------|
| `test_metric_uptrend` | `test_node_01` | 📈 Линейный восходящий тренд |
| `test_metric_downtrend` | `test_node_02` | 📉 Линейный нисходящий тренд |
| `test_metric_daily_season` | `test_node_03` | 🌞 Суточная сезонность |
| `test_metric_weekly_season` | `test_node_04` | 📅 Недельная сезонность |
| `test_metric_random_walk` | `test_node_05` | 🎲 Случайное блуждание |
| `test_metric_constant` | `test_node_06` | ➡️ Константное значение |
| `test_metric_anomalies` | `test_node_07` | ⚠️ С аномалиями |
| `test_metric_trend_season` | `test_node_08` | 🔄 Тренд + сезонность |
| `test_metric_exponential` | `test_node_09` | 🚀 Экспоненциальный рост |
| `test_metric_step_changes` | `test_node_10` | 📊 Ступенчатые изменения |

## Файлы проекта

### Исполняемые скрипты
- **`generate_test_nodes.py`** - Генератор данных узлов
- **`load_test_nodes.sh`** - Bash скрипт для загрузки (требует токен)
- **`load_test_nodes_auto.py`** - Python скрипт с автоматическим получением токена

### Генерируемые файлы
- **`test_nodes.json`** - Данные узлов в формате JSON (~1.7 KB)
- **`test_nodes_summary.txt`** - Сводная информация
- **`test_nodes_info.md`** - Документация в Markdown

## 🚀 Использование

### Метод 1: Автоматический (рекомендуется)

```bash
# 1. Генерация данных узлов
python3 generate_test_nodes.py

# 2. Автоматическая загрузка с получением токена
chmod +x load_test_nodes_auto.py
python3 load_test_nodes_auto.py
```

**Преимущества:**
- Автоматическое получение токена от Keycloak
- Не требует ручной настройки
- Подробный вывод с результатами

### Метод 2: С токеном вручную

```bash
# 1. Генерация данных
python3 generate_test_nodes.py

# 2. Получить токен (через UI или API)
export KEYCLOAK_TOKEN="your_admin_token_here"

# 3. Загрузить узлы
chmod +x load_test_nodes.sh
./load_test_nodes.sh
```

### Метод 3: Использование существующего скрипта

Если у вас уже есть скрипт для работы с mon-objects:

```bash
# Использовать test_mon_objects_api.sh (если доступен)
./test_mon_objects_api.sh
```

## Конфигурация

### Переменные окружения

```bash
# URL сервисов
export API_URL="http://localhost:8080"
export KEYCLOAK_URL="http://localhost:8180"

# Keycloak настройки
export KEYCLOAK_REALM="monitoring"
export KEYCLOAK_CLIENT="monitoring-client"

# Учетные данные администратора
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="admin123"
```

### Значения по умолчанию

Если переменные не установлены, используются:
- API_URL: `http://localhost:8080`
- KEYCLOAK_URL: `http://localhost:8180`
- KEYCLOAK_REALM: `monitoring`
- KEYCLOAK_CLIENT: `monitoring-client`
- ADMIN_USERNAME: `admin`
- ADMIN_PASSWORD: `admin123`

## Структура данных

### Формат JSON для создания узла

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

### API Endpoint

**POST** `/api/mon-objects`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {token}`

**Response (201 Created):**
```json
{
  "id": "uuid-here",
  "name": "test_node_01",
  "type": "eNodeB",
  "technology": "4G",
  "platform": "Ericsson",
  "network": "Test Network",
  "manufacturer": "Ericsson",
  "createdAt": "2026-01-13T00:00:00Z",
  "updatedAt": "2026-01-13T00:00:00Z"
}
```

## Проверка результатов

### Через API

```bash
# Получить список всех узлов
curl 'http://localhost:8080/api/mon-objects'

# Получить конкретный узел
curl 'http://localhost:8080/api/mon-objects/{id}'

# Поиск по имени (если поддерживается)
curl 'http://localhost:8080/api/mon-objects?name=test_node_01'
```

### Через UI

1. Откройте `http://localhost:4200`
2. Перейдите в раздел "Объекты мониторинга"
3. Проверьте наличие тестовых узлов

### Через базу данных

```sql
-- Список всех тестовых узлов
SELECT * FROM mon_objects WHERE name LIKE 'test_node_%' ORDER BY name;

-- Количество тестовых узлов
SELECT COUNT(*) FROM mon_objects WHERE name LIKE 'test_node_%';
```

## Полный сценарий использования

### 1. Подготовка

```bash
# Убедиться, что сервисы запущены
docker-compose ps

# Запустить необходимые сервисы
docker-compose up -d postgres go-api keycloak victoriametrics forecast-service
```

### 2. Создание узлов

```bash
# Генерация данных
python3 generate_test_nodes.py

# Автоматическая загрузка
python3 load_test_nodes_auto.py
```

### 3. Загрузка метрик

```bash
# Генерация тестовых метрик
python3 generate_test_metrics.py

# Загрузка в VictoriaMetrics
./load_test_metrics.sh
```

### 4. Создание прогнозов

1. Откройте UI: `http://localhost:4200/anomaly`
2. Нажмите "Создать прогноз"
3. Выберите:
   - **Метрика**: `test_metric_uptrend`
   - **Объект**: `test_node_01`
   - **Периоды**: 168
4. Создайте прогноз

## Устранение неполадок

### Ошибка: "Connection refused" к Keycloak

```bash
# Проверить статус Keycloak
docker-compose ps keycloak

# Запустить Keycloak
docker-compose up -d keycloak

# Проверить логи
docker-compose logs keycloak

# Дождаться готовности (может занять 30-60 секунд)
curl http://localhost:8180/health
```

### Ошибка: "Unauthorized" или "Forbidden"

```bash
# Проверить учетные данные
echo $ADMIN_USERNAME
echo $ADMIN_PASSWORD

# Убедиться, что пользователь имеет роль ADMIN
# Через Keycloak Admin Console:
# http://localhost:8180/admin
# Users → admin → Role Mappings → Assign role → ROLE_ADMIN
```

### Ошибка: "Node already exists" (409)

Это нормально! Узел уже создан ранее. Скрипт пропустит его и продолжит.

### Ошибка: "API not responding"

```bash
# Проверить Go API
docker-compose ps go-api
docker-compose logs go-api

# Проверить readiness
curl http://localhost:8080/probes/readiness

# Перезапустить API
docker-compose restart go-api
```

## Очистка

### Удалить все тестовые узлы

```bash
# Через API (требуется токен ADMIN)
for name in test_node_{01..10}; do
  # Получить ID узла
  ID=$(curl -s "http://localhost:8080/api/mon-objects?name=$name" | jq -r '.items[0].id')
  
  # Удалить узел
  curl -X DELETE "http://localhost:8080/api/mon-objects/$ID" \
    -H "Authorization: Bearer $KEYCLOAK_TOKEN"
done
```

### Через базу данных

```sql
DELETE FROM mon_objects WHERE name LIKE 'test_node_%';
```

### Удалить сгенерированные файлы

```bash
rm -f test_nodes*.json test_nodes*.txt test_nodes*.md load_test_nodes.sh
```

## Интеграция с тестированием

### Автоматизированный тест

```bash
#!/bin/bash
# test_full_stack.sh

echo "1. Создание тестовых узлов..."
python3 generate_test_nodes.py
python3 load_test_nodes_auto.py

echo "2. Загрузка тестовых метрик..."
python3 generate_test_metrics.py
./load_test_metrics.sh

echo "3. Проверка данных..."
NODE_COUNT=$(curl -s 'http://localhost:8080/api/mon-objects' | jq '.total')
if [ "$NODE_COUNT" -ge "10" ]; then
    echo "✓ Узлы созданы: $NODE_COUNT"
else
    echo "❌ Недостаточно узлов: $NODE_COUNT"
    exit 1
fi

METRIC_COUNT=$(curl -s 'http://localhost:8428/api/v1/label/__name__/values' | jq '. | length')
if [ "$METRIC_COUNT" -ge "10" ]; then
    echo "✓ Метрики загружены: $METRIC_COUNT"
else
    echo "❌ Недостаточно метрик: $METRIC_COUNT"
    exit 1
fi

echo "✓ Тестовое окружение готово!"
```

## API Reference

### Создание узла
**POST** `/api/mon-objects`
- Требует: аутентификация, роль `ROLE_ADMIN`
- Body: JSON с полями name, type, technology, platform, network, manufacturer
- Response: 201 Created с данными узла

### Получение списка
**GET** `/api/mon-objects`
- Публичный endpoint (для разработки)
- Query params: page, pageSize, name (filter)
- Response: 200 OK с пагинированным списком

### Получение узла
**GET** `/api/mon-objects/{id}`
- Публичный endpoint
- Response: 200 OK с данными узла

### Обновление узла
**PUT** `/api/mon-objects/{id}`
- Требует: аутентификация, роль `ROLE_ADMIN`
- Body: JSON с обновляемыми полями
- Response: 200 OK с обновленными данными

### Удаление узла
**DELETE** `/api/mon-objects/{id}`
- Требует: аутентификация, роль `ROLE_ADMIN`
- Response: 204 No Content

## Дополнительные ресурсы

- **test_nodes_summary.txt** - Краткая сводка по узлам
- **test_nodes_info.md** - Таблицы с узлами
- **test_nodes.json** - Исходные данные
- **MON_OBJECTS_API.md** - Документация по API (если доступна)

## Changelog

**v1.0.0** - 2026-01-13
- Создан генератор тестовых узлов
- 10 узлов с различными типами и технологиями
- Автоматический скрипт загрузки
- Полная документация


