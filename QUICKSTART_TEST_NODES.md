# Быстрый старт: Тестовые Monitoring Objects

## 🚀 Создание узлов (2 команды)

### Шаг 1: Генерация данных
```bash
python3 generate_test_nodes.py
```

### Шаг 2: Загрузка в систему
```bash
python3 load_test_nodes_auto.py
```

**Готово!** 10 тестовых узлов созданы ✅

---

## 📊 Что создается

| Узел | Тип | Технология | Для метрики |
|------|-----|------------|-------------|
| `test_node_01` | eNodeB | 4G | `test_metric_uptrend` |
| `test_node_02` | eNodeB | 4G | `test_metric_downtrend` |
| `test_node_03` | gNodeB | 5G | `test_metric_daily_season` |
| `test_node_04` | gNodeB | 5G | `test_metric_weekly_season` |
| `test_node_05` | eNodeB | 4G | `test_metric_random_walk` |
| `test_node_06` | Server | Core | `test_metric_constant` |
| `test_node_07` | Router | Network | `test_metric_anomalies` |
| `test_node_08` | gNodeB | 5G | `test_metric_trend_season` |
| `test_node_09` | eNodeB | 4G | `test_metric_exponential` |
| `test_node_10` | Server | Core | `test_metric_step_changes` |

**Итого:** 10 узлов различных типов

---

## ✅ Проверка

```bash
# Список узлов через API
curl 'http://localhost:8080/api/mon-objects'

# Количество узлов
curl 'http://localhost:8080/api/mon-objects' | jq '.total'
```

---

## 🔧 Если что-то пошло не так

### Keycloak недоступен
```bash
docker-compose up -d keycloak
# Подождать 30-60 секунд
```

### Go API не отвечает
```bash
docker-compose restart go-api
```

### Неправильные учетные данные
```bash
# Установить свои
export ADMIN_USERNAME="your_admin"
export ADMIN_PASSWORD="your_password"
```

---

## 🎯 Полный тестовый цикл

```bash
# 1. Создать узлы
python3 generate_test_nodes.py
python3 load_test_nodes_auto.py

# 2. Загрузить метрики
python3 generate_test_metrics.py
./load_test_metrics.sh

# 3. Создать прогноз в UI
# Открыть: http://localhost:4200/anomaly
# Метрика: test_metric_uptrend
# Объект: test_node_01
```

---

## 📚 Подробная документация

- **TEST_NODES_GUIDE.md** - Полное руководство
- **test_nodes_summary.txt** - Сводка по узлам
- **test_nodes_info.md** - Таблицы в Markdown

---

## 💡 Альтернативные методы

### С токеном вручную
```bash
export KEYCLOAK_TOKEN="your_token"
./load_test_nodes.sh
```

### Через существующий скрипт
```bash
./test_mon_objects_api.sh  # если доступен
```

---

**Готово! Узлы созданы и готовы к использованию! 🎉**

