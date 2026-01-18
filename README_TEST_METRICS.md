# Тестовые метрики для прогнозирования

## 📋 Описание

Набор скриптов для генерации, загрузки и визуализации тестовых метрик с различными временными паттернами. Предназначен для тестирования функциональности прогнозирования временных рядов.

## 🎯 Возможности

- ✅ **10 различных паттернов** метрик (тренды, сезонность, аномалии и т.д.)
- ✅ **721 час данных** (30 дней) с почасовой детализацией
- ✅ **7210 точек данных** (721 час × 10 метрик)
- ✅ **Форматы экспорта**: Prometheus, CSV
- ✅ **Автоматическая загрузка** в VictoriaMetrics
- ✅ **Визуализация** с помощью matplotlib
- ✅ **Статистика** по каждой метрике

## 📁 Файлы проекта

### Исполняемые скрипты
- **`generate_test_metrics.py`** - Генератор тестовых данных
- **`load_test_metrics.sh`** - Загрузчик данных в VictoriaMetrics
- **`visualize_test_metrics.py`** - Визуализация метрик

### Документация
- **`QUICKSTART_TEST_METRICS.md`** - Быстрый старт (начните отсюда!)
- **`TEST_METRICS_GUIDE.md`** - Подробное руководство
- **`README_TEST_METRICS.md`** - Этот файл

### Генерируемые файлы
- **`test_metrics_prometheus.txt`** - Данные в формате Prometheus (~558 KB)
- **`test_metrics_data.csv`** - Данные в формате CSV (~77 KB)
- **`test_metrics_summary.txt`** - Сводная статистика
- **`test_metrics_*.png`** - Графики (при визуализации)

## 🚀 Быстрый старт

### Предварительные требования
```bash
# Python 3.6+
python3 --version

# VictoriaMetrics должна быть запущена
docker-compose up -d victoriametrics

# Опционально: для визуализации
pip install matplotlib pandas
```

### Использование

#### 1. Генерация данных
```bash
python3 generate_test_metrics.py
```

#### 2. Загрузка в VictoriaMetrics
```bash
chmod +x load_test_metrics.sh
./load_test_metrics.sh
```

#### 3. Визуализация (опционально)
```bash
chmod +x visualize_test_metrics.py
python3 visualize_test_metrics.py
```

#### 4. Тестирование прогнозов
Откройте UI: `http://localhost:4200/anomaly`

## 📊 Метрики

| Метрика | Объект | Описание | Подходит для |
|---------|--------|----------|--------------|
| `test_metric_uptrend` | `test_node_01` | 📈 Линейный восходящий тренд | Прогноз роста |
| `test_metric_downtrend` | `test_node_02` | 📉 Линейный нисходящий тренд | Прогноз снижения |
| `test_metric_daily_season` | `test_node_03` | 🌞 Суточная сезонность | Дневные циклы |
| `test_metric_weekly_season` | `test_node_04` | 📅 Недельная сезонность | Будни vs выходные |
| `test_metric_random_walk` | `test_node_05` | 🎲 Случайное блуждание | Волатильность |
| `test_metric_constant` | `test_node_06` | ➡️ Константное значение | Стабильность |
| `test_metric_anomalies` | `test_node_07` | ⚠️ С аномалиями (5%) | Обработка выбросов |
| `test_metric_trend_season` | `test_node_08` | 🔄 Тренд + сезонность | Реалистичный сценарий |
| `test_metric_exponential` | `test_node_09` | 🚀 Экспоненциальный рост | Быстрый рост |
| `test_metric_step_changes` | `test_node_10` | 📊 Ступенчатые изменения | Релизы/обновления |

## 💻 Примеры использования

### Проверка загруженных метрик
```bash
# Список всех метрик
curl 'http://localhost:8428/api/v1/label/__name__/values' | grep test_metric

# Данные конкретной метрики
curl 'http://localhost:8428/api/v1/query?query=test_metric_uptrend{name="test_node_01"}'

# Временной ряд (последние 7 дней)
curl 'http://localhost:8428/api/v1/query_range?query=test_metric_daily_season&start='$(date -u -d '7 days ago' +%s)'&end='$(date -u +%s)'&step=3600'
```

### Создание прогноза через API
```bash
# Получить токен (замените на ваши учетные данные)
TOKEN="your-keycloak-token"

# Создать прогноз
curl -X POST "http://localhost:8080/api/forecasts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mon_object_name": "test_node_01",
    "metric_name": "test_metric_uptrend",
    "from_timestamp": '$(date -u -d '30 days ago' +%s)',
    "forecast_periods": 168,
    "freq": "H",
    "step": "1h",
    "seasonality_mode": "additive",
    "changepoint_prior_scale": 0.05
  }'
```

### Анализ данных в Python
```python
import pandas as pd
import matplotlib.pyplot as plt

# Загрузить данные
df = pd.read_csv('test_metrics_data.csv')
df['datetime'] = pd.to_datetime(df['datetime'])

# Вывести статистику
print(df.describe())

# Построить график одной метрики
plt.figure(figsize=(12, 6))
plt.plot(df['datetime'], df['test_metric_uptrend'])
plt.title('Test Metric: Uptrend')
plt.xlabel('Time')
plt.ylabel('Value')
plt.grid(True)
plt.show()
```

## 🎨 Визуализация

Скрипт `visualize_test_metrics.py` создает 3 графика:

1. **test_metrics_all.png** - Все метрики на одном графике
2. **test_metrics_individual.png** - Отдельный график для каждой метрики
3. **test_metrics_patterns.png** - Сравнение паттернов по категориям:
   - Тренды
   - Сезонность
   - Стабильность
   - Комбинированные

## 📈 Рекомендуемые параметры прогноза

### Линейные тренды
```json
{
  "forecast_periods": 168,
  "freq": "H",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.05
}
```

### Сезонные паттерны
```json
{
  "forecast_periods": 168,
  "freq": "H",
  "seasonality_mode": "multiplicative",
  "changepoint_prior_scale": 0.1
}
```

### Экспоненциальный рост
```json
{
  "forecast_periods": 72,
  "freq": "H",
  "seasonality_mode": "multiplicative",
  "changepoint_prior_scale": 0.1
}
```

## 🔧 Настройка генератора

В `generate_test_metrics.py` можно изменить:

```python
# Период данных (по умолчанию 30 дней)
HOURS_IN_MONTH = 24 * 30  # Изменить на 24 * 60 для 2 месяцев

# Базовые значения метрик
def pattern_linear_uptrend(hour: int, base: float = 100.0):
    # base - начальное значение
    # Можно изменить для разных диапазонов
```

Добавить новую метрику:
```python
METRICS.append({
    'name': 'my_custom_metric',
    'mon_object': 'my_node',
    'pattern': my_custom_pattern_function,
    'description': 'Мой паттерн'
})
```

## 🧪 Тестирование качества прогнозов

Рекомендуемая процедура:

1. **Загрузить данные** за 30 дней
2. **Создать прогноз** на 7 дней вперед
3. **Дождаться завершения** прогноза
4. **Просмотреть график** на детальной странице
5. **Оценить качество**:
   - Визуальное соответствие паттерну
   - Доверительные интервалы
   - Отсутствие аномальных выбросов

### Ожидаемые результаты:

| Метрика | Качество прогноза | Примечания |
|---------|------------------|------------|
| uptrend | Отличное ✅ | Четкий линейный тренд |
| downtrend | Отличное ✅ | Четкий линейный тренд |
| daily_season | Хорошее ✅ | Повторяющийся паттерн |
| weekly_season | Хорошее ✅ | Цикличность по неделям |
| random_walk | Удовлетворительное ⚠️ | Высокая неопределенность |
| constant | Отличное ✅ | Стабильное значение |
| anomalies | Хорошее ⚠️ | Могут быть выбросы |
| trend_season | Отличное ✅ | Комплексный паттерн |
| exponential | Хорошее ⚠️ | Нужны короткие прогнозы |
| step_changes | Удовлетворительное ⚠️ | Сложно предсказать скачки |

## 🧹 Очистка

### Удалить файлы данных
```bash
rm -f test_metrics_*.txt test_metrics_*.csv test_metrics_*.png
```

### Удалить метрики из VictoriaMetrics
```bash
# Все тестовые метрики
for metric in uptrend downtrend daily_season weekly_season random_walk constant anomalies trend_season exponential step_changes; do
  curl -X POST "http://localhost:8428/api/v1/admin/tsdb/delete_series?match[]=test_metric_$metric"
done
```

### Удалить прогнозы из базы данных
```sql
-- Через psql или adminer
DELETE FROM forecasts WHERE metric_name LIKE 'test_metric_%';
```

## 🐛 Устранение неполадок

### Проблема: ModuleNotFoundError
```bash
# Установить зависимости
pip install matplotlib pandas
```

### Проблема: Connection refused при загрузке
```bash
# Проверить VictoriaMetrics
docker-compose ps victoriametrics
docker-compose logs victoriametrics

# Запустить
docker-compose up -d victoriametrics
```

### Проблема: Прогноз не создается
```bash
# Проверить forecast-service
docker-compose ps forecast-service
docker-compose logs forecast-service

# Перезапустить
docker-compose restart forecast-service
```

### Проблема: Данные не отображаются в UI
1. Проверить период в фильтрах (последние 30 дней)
2. Проверить формат меток в VictoriaMetrics
3. Проверить консоль браузера на ошибки

## 📚 Дополнительные ресурсы

- **QUICKSTART_TEST_METRICS.md** - Быстрый старт для новичков
- **TEST_METRICS_GUIDE.md** - Подробное руководство с примерами
- **FORECAST_DETAIL_VIEW_GUIDE.md** - Как просматривать прогнозы
- **FORECAST_QUICKSTART.md** - Общее руководство по прогнозированию

## 🤝 Вклад

Идеи для улучшения:
- [ ] Добавить больше паттернов (пилообразный, треугольный)
- [ ] Поддержка разных временных интервалов (минуты, дни)
- [ ] Генерация данных на основе реальных сценариев
- [ ] Автоматическое сравнение качества прогнозов
- [ ] Интеграция с CI/CD для автотестов

## 📝 Лицензия

Часть проекта go-service-template

## 📞 Поддержка

При возникновении проблем:
1. Проверьте документацию в TEST_METRICS_GUIDE.md
2. Проверьте логи сервисов: `docker-compose logs`
3. Убедитесь в доступности всех компонентов

---

**Версия:** 1.0.0  
**Дата:** 2026-01-13  
**Автор:** go-service-template team

