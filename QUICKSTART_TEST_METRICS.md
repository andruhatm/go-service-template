# Быстрый старт: Тестовые метрики для прогнозирования

## 🚀 Быстрый запуск (3 шага)

### 1. Генерация данных
```bash
python3 generate_test_metrics.py
```
**Результат:** Создаются 3 файла с тестовыми данными (10 метрик, 721 час, 7210 точек данных)

### 2. Загрузка в VictoriaMetrics
```bash
./load_test_metrics.sh
```
**Или вручную:**
```bash
curl -X POST http://localhost:8428/api/v1/import/prometheus \
     -H "Content-Type: text/plain" \
     --data-binary @test_metrics_prometheus.txt
```

### 3. Создание прогноза в UI
1. Откройте `http://localhost:4200/anomaly`
2. Нажмите "Создать прогноз"
3. Выберите:
   - **Метрика**: `test_metric_uptrend` (или любая другая)
   - **Объект**: `test_node_01` (соответствует метрике)
   - **Периоды**: 168 (неделя)
   - **Частота**: H
4. Создайте и дождитесь завершения
5. Нажмите кнопку 👁️ для просмотра графика

---

## 📊 Доступные метрики

| # | Метрика | Объект | Паттерн |
|---|---------|--------|---------|
| 1 | `test_metric_uptrend` | `test_node_01` | 📈 Линейный рост |
| 2 | `test_metric_downtrend` | `test_node_02` | 📉 Линейное снижение |
| 3 | `test_metric_daily_season` | `test_node_03` | 🌞 Суточная сезонность |
| 4 | `test_metric_weekly_season` | `test_node_04` | 📅 Недельная сезонность |
| 5 | `test_metric_random_walk` | `test_node_05` | 🎲 Случайное блуждание |
| 6 | `test_metric_constant` | `test_node_06` | ➡️ Константа |
| 7 | `test_metric_anomalies` | `test_node_07` | ⚠️ С аномалиями |
| 8 | `test_metric_trend_season` | `test_node_08` | 🔄 Тренд + сезонность |
| 9 | `test_metric_exponential` | `test_node_09` | 🚀 Экспоненциальный рост |
| 10 | `test_metric_step_changes` | `test_node_10` | 📊 Ступенчатые изменения |

---

## 🎨 Визуализация (опционально)

Создать графики метрик перед прогнозированием:

```bash
# Установить зависимости (если еще не установлены)
pip install matplotlib pandas

# Создать графики
chmod +x visualize_test_metrics.py
python3 visualize_test_metrics.py
```

**Результат:** Создаются 3 PNG файла с графиками

---

## ✅ Проверка данных

### Проверить, что метрики загружены:
```bash
# Список всех метрик
curl 'http://localhost:8428/api/v1/label/__name__/values' | grep test_metric

# Конкретная метрика
curl 'http://localhost:8428/api/v1/query?query=test_metric_uptrend'

# Количество точек данных
curl 'http://localhost:8428/api/v1/query?query=count(test_metric_uptrend)'
```

### Проверить доступность сервисов:
```bash
# VictoriaMetrics
curl http://localhost:8428/health

# Forecast Service
curl http://localhost:8082/health

# Go API
curl http://localhost:8080/probes/readiness
```

---

## 🎯 Рекомендуемые параметры прогноза

### Для линейных трендов (uptrend, downtrend):
```
Периоды: 168 (7 дней)
Частота: H
Шаг: 1h
Seasonality mode: additive
Changepoint prior scale: 0.05
```

### Для сезонных паттернов (daily_season, weekly_season):
```
Периоды: 168-336 (7-14 дней)
Частота: H
Шаг: 1h
Seasonality mode: multiplicative
Changepoint prior scale: 0.1
```

### Для экспоненциального роста:
```
Периоды: 72 (3 дня) - короткие прогнозы лучше
Частота: H
Шаг: 1h
Seasonality mode: multiplicative
Changepoint prior scale: 0.1
```

---

## 🔧 Устранение проблем

### Данные не загружаются в VictoriaMetrics
```bash
# Проверить, что VictoriaMetrics запущена
docker-compose ps victoriametrics

# Запустить
docker-compose up -d victoriametrics

# Проверить логи
docker-compose logs victoriametrics
```

### Прогноз завершается с ошибкой
```bash
# Проверить логи forecast-service
docker-compose logs forecast-service

# Перезапустить forecast-service
docker-compose restart forecast-service
```

### Метрики не видны в UI
1. Проверьте, что выбран правильный период (последние 30 дней)
2. Убедитесь, что метрики загружены (см. "Проверка данных")
3. Проверьте консоль браузера на ошибки

---

## 🧹 Очистка

### Удалить сгенерированные файлы:
```bash
rm -f test_metrics_*.txt test_metrics_*.csv test_metrics_*.png
```

### Удалить метрики из VictoriaMetrics:
```bash
# Все тестовые метрики
for metric in uptrend downtrend daily_season weekly_season random_walk constant anomalies trend_season exponential step_changes; do
  curl -X POST "http://localhost:8428/api/v1/admin/tsdb/delete_series?match[]=test_metric_$metric"
done
```

---

## 📚 Дополнительная документация

- **TEST_METRICS_GUIDE.md** - Подробное руководство
- **FORECAST_DETAIL_VIEW_GUIDE.md** - Руководство по просмотру прогнозов
- **FORECAST_DETAIL_CHANGES.md** - Список изменений

---

## 💡 Советы

1. **Начните с простых метрик**: `test_metric_uptrend` или `test_metric_constant`
2. **Дождитесь завершения**: Прогноз может занять 30-60 секунд
3. **Экспериментируйте с параметрами**: Разные паттерны требуют разных настроек
4. **Используйте визуализацию**: График помогает понять качество прогноза

---

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи всех сервисов: `docker-compose logs`
2. Убедитесь, что все сервисы запущены: `docker-compose ps`
3. Проверьте документацию в TEST_METRICS_GUIDE.md

