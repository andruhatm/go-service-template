# Руководство по тестовым метрикам для прогнозирования

## Обзор

Этот набор скриптов генерирует тестовые метрики с различными временными паттернами для тестирования функциональности прогнозирования. Данные охватывают последний месяц с почасовой детализацией.

## Файлы

1. **`generate_test_metrics.py`** - Python скрипт для генерации тестовых данных
2. **`load_test_metrics.sh`** - Bash скрипт для загрузки данных в VictoriaMetrics
3. **`TEST_METRICS_GUIDE.md`** - Данное руководство

## Сгенерированные метрики

Скрипт создает **10 метрик** с различными паттернами:

### 1. `test_metric_uptrend` (test_node_01)
**Паттерн:** Линейный восходящий тренд
- Подходит для тестирования прогнозирования роста
- Пример: рост количества пользователей, увеличение нагрузки

### 2. `test_metric_downtrend` (test_node_02)
**Паттерн:** Линейный нисходящий тренд
- Подходит для тестирования прогнозирования снижения
- Пример: уменьшение ошибок после оптимизации

### 3. `test_metric_daily_season` (test_node_03)
**Паттерн:** Суточная сезонность
- Пик днем (~14:00), минимум ночью
- Подходит для метрик с суточным циклом
- Пример: нагрузка на сервис в течение дня

### 4. `test_metric_weekly_season` (test_node_04)
**Паттерн:** Недельная сезонность
- Выше в будни, ниже в выходные
- Подходит для бизнес-метрик
- Пример: активность пользователей по дням недели

### 5. `test_metric_random_walk` (test_node_05)
**Паттерн:** Случайное блуждание
- Непредсказуемые изменения
- Подходит для тестирования устойчивости модели
- Пример: волатильные метрики

### 6. `test_metric_constant` (test_node_06)
**Паттерн:** Константное значение
- Стабильное значение с малым шумом
- Подходит для тестирования на стабильных метриках
- Пример: конфигурационные лимиты

### 7. `test_metric_anomalies` (test_node_07)
**Паттерн:** Нормальный паттерн с аномалиями
- Суточная сезонность + редкие выбросы (5%)
- Подходит для тестирования обработки аномалий
- Пример: метрики с случайными сбоями

### 8. `test_metric_trend_season` (test_node_08)
**Паттерн:** Комбинация тренда и сезонности
- Восходящий тренд + суточная сезонность
- Подходит для реалистичных сценариев
- Пример: растущий сервис с суточными колебаниями

### 9. `test_metric_exponential` (test_node_09)
**Паттерн:** Экспоненциальный рост
- Быстро растущее значение
- Подходит для тестирования на быстрорастущих метриках
- Пример: вирусный рост пользователей

### 10. `test_metric_step_changes` (test_node_10)
**Паттерн:** Ступенчатые изменения
- Резкие изменения каждые 5 дней
- Подходит для тестирования после обновлений/релизов
- Пример: производительность после деплоя

## Использование

### Шаг 1: Генерация данных

```bash
# Запустить генератор
python3 generate_test_metrics.py
```

Это создаст 3 файла:
- `test_metrics_prometheus.txt` - данные в формате Prometheus (для VictoriaMetrics)
- `test_metrics_data.csv` - данные в формате CSV (для анализа)
- `test_metrics_summary.txt` - сводная информация

### Шаг 2: Загрузка в VictoriaMetrics

#### Вариант A: Используя скрипт

```bash
# Сделать скрипт исполняемым
chmod +x load_test_metrics.sh

# Запустить загрузку
./load_test_metrics.sh
```

#### Вариант B: Вручную через curl

```bash
# Загрузить данные
curl -X POST http://localhost:8428/api/v1/import/prometheus \
     -H "Content-Type: text/plain" \
     --data-binary @test_metrics_prometheus.txt
```

#### Вариант C: Через Docker

```bash
# Если VictoriaMetrics в Docker
docker cp test_metrics_prometheus.txt $(docker-compose ps -q victoriametrics):/tmp/
docker-compose exec victoriametrics curl -X POST http://localhost:8428/api/v1/import/prometheus \
     --data-binary @/tmp/test_metrics_prometheus.txt
```

### Шаг 3: Проверка данных

```bash
# Проверить список метрик
curl 'http://localhost:8428/api/v1/label/__name__/values'

# Проверить конкретную метрику
curl 'http://localhost:8428/api/v1/query?query=test_metric_uptrend'

# Получить временной ряд
curl 'http://localhost:8428/api/v1/query_range?query=test_metric_daily_season{name="test_node_03"}&start='$(date -u -d '30 days ago' +%s)'&end='$(date -u +%s)'&step=3600'
```

### Шаг 4: Создание прогнозов в UI

1. Откройте UI: `http://localhost:4200/anomaly`
2. Нажмите "Создать прогноз"
3. Выберите одну из тестовых метрик:
   - Метрика: `test_metric_*` (например, `test_metric_uptrend`)
   - Объект: `test_node_*` (например, `test_node_01`)
4. Настройте параметры:
   - **От даты**: 30 дней назад
   - **Периоды прогноза**: 168 (7 дней)
   - **Частота**: H (часовая)
   - **Шаг**: 1h
5. Создайте прогноз и дождитесь завершения
6. Просмотрите результаты на детальной странице

## Структура данных

### Формат Prometheus

```
metric_name{name="object_name",type="actual"} value timestamp
```

Пример:
```
test_metric_uptrend{name="test_node_01",type="actual"} 102.34 1704067200000
test_metric_uptrend{name="test_node_01",type="actual"} 102.89 1704070800000
```

### Формат CSV

```
timestamp,datetime,test_metric_uptrend,test_metric_downtrend,...
1704067200000,2024-01-01T00:00:00,102.34,198.76,...
```

## Параметры генерации

В скрипте `generate_test_metrics.py` можно настроить:

```python
# Период данных
HOURS_IN_MONTH = 24 * 30  # По умолчанию 720 часов (30 дней)

# Базовые значения для каждого паттерна
base = 100.0  # Начальное значение

# Параметры шума
noise = random.uniform(-5, 5)  # Диапазон случайного шума
```

## Анализ данных в CSV

### С использованием Python/pandas

```python
import pandas as pd
import matplotlib.pyplot as plt

# Загрузить данные
df = pd.read_csv('test_metrics_data.csv')
df['datetime'] = pd.to_datetime(df['datetime'])
df.set_index('datetime', inplace=True)

# Построить график
plt.figure(figsize=(14, 8))
for col in df.columns[1:]:  # Пропускаем timestamp
    plt.plot(df.index, df[col], label=col, alpha=0.7)
plt.legend()
plt.title('Тестовые метрики за месяц')
plt.xlabel('Время')
plt.ylabel('Значение')
plt.grid(True)
plt.tight_layout()
plt.savefig('test_metrics_plot.png')
print("График сохранен в test_metrics_plot.png")
```

### С использованием Excel

1. Откройте `test_metrics_data.csv` в Excel
2. Выделите столбец datetime и данные метрик
3. Вставка → Диаграмма → График
4. Настройте внешний вид графика

## Рекомендации по тестированию прогнозов

### Для разных паттернов используйте разные параметры:

#### 1. Линейные тренды (uptrend, downtrend)
```
Периоды прогноза: 168 (7 дней)
Частота: H
Seasonality mode: additive
Changepoint prior scale: 0.05
```

#### 2. Сезонные паттерны (daily_season, weekly_season)
```
Периоды прогноза: 168 (7 дней) или 336 (14 дней)
Частота: H
Seasonality mode: multiplicative
Changepoint prior scale: 0.1
```

#### 3. Комбинированные (trend_season)
```
Периоды прогноза: 168-336
Частота: H
Seasonality mode: multiplicative
Changepoint prior scale: 0.05
```

#### 4. Экспоненциальный рост (exponential)
```
Периоды прогноза: 72 (3 дня) - короткие прогнозы
Частота: H
Seasonality mode: multiplicative
Changepoint prior scale: 0.1
```

#### 5. С аномалиями (anomalies)
```
Периоды прогноза: 168
Частота: H
Seasonality mode: additive
Changepoint prior scale: 0.2 (выше для адаптации)
```

## Устранение неполадок

### Проблема: "Connection refused" при загрузке

**Решение:**
```bash
# Проверить, что VictoriaMetrics запущена
docker-compose ps victoriametrics

# Запустить, если не запущена
docker-compose up -d victoriametrics

# Проверить логи
docker-compose logs victoriametrics
```

### Проблема: Данные не отображаются в UI

**Решение:**
```bash
# Проверить, что данные загружены
curl 'http://localhost:8428/api/v1/query?query=test_metric_uptrend'

# Проверить диапазон времени
# Убедитесь, что в UI выбран корректный период (последние 30 дней)
```

### Проблема: Прогноз завершается с ошибкой

**Решение:**
```bash
# Проверить логи forecast-service
docker-compose logs forecast-service

# Убедиться, что forecast-service запущен
docker-compose up -d forecast-service

# Проверить health
curl http://localhost:8082/health
```

## Очистка данных

Для удаления тестовых метрик из VictoriaMetrics:

```bash
# Удалить конкретную метрику
curl -X POST 'http://localhost:8428/api/v1/admin/tsdb/delete_series?match[]=test_metric_uptrend'

# Удалить все тестовые метрики
for metric in uptrend downtrend daily_season weekly_season random_walk constant anomalies trend_season exponential step_changes; do
  curl -X POST "http://localhost:8428/api/v1/admin/tsdb/delete_series?match[]=test_metric_$metric"
done
```

## Дополнительные ресурсы

- [VictoriaMetrics API](https://docs.victoriametrics.com/Single-server-VictoriaMetrics.html#prometheus-querying-api-usage)
- [Prometheus Exposition Format](https://prometheus.io/docs/instrumenting/exposition_formats/)
- [Prophet Documentation](https://facebook.github.io/prophet/)

## Changelog

**v1.0.0** - 2026-01-13
- Создан генератор тестовых метрик
- 10 различных паттернов
- Поддержка форматов Prometheus и CSV
- Скрипт автоматической загрузки


