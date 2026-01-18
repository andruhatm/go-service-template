#!/usr/bin/env python3
"""
Скрипт для генерации тестовых метрик с различными паттернами.
Данные записываются в формате Prometheus для загрузки в VictoriaMetrics.
"""

import math
import os
import random
from datetime import datetime, timedelta
from typing import List, Tuple

# Конфигурация
DEFAULT_TEST_METRICS_DAYS = 180
TEST_METRICS_DAYS = int(os.getenv("TEST_METRICS_DAYS", str(DEFAULT_TEST_METRICS_DAYS)))
HOURS_BACK = 24 * TEST_METRICS_DAYS
END_TIME = datetime.now()
START_TIME = END_TIME - timedelta(hours=HOURS_BACK)


def generate_timestamps() -> List[int]:
    """Генерирует список timestamp для каждого часа за выбранный период."""
    timestamps = []
    current = START_TIME
    while current <= END_TIME:
        timestamps.append(int(current.timestamp() * 1000))  # в миллисекундах
        current += timedelta(hours=1)
    return timestamps


def pattern_linear_uptrend(hour: int, base: float = 100.0) -> float:
    """Линейный восходящий тренд с небольшим шумом."""
    trend = base + (hour * 0.5)
    noise = random.uniform(-5, 5)
    return max(0, trend + noise)


def pattern_linear_downtrend(hour: int, base: float = 200.0) -> float:
    """Линейный нисходящий тренд с небольшим шумом."""
    trend = base - (hour * 0.3)
    noise = random.uniform(-5, 5)
    return max(0, trend + noise)


def pattern_daily_seasonality(hour: int, base: float = 150.0) -> float:
    """Суточная сезонность (пик днем, минимум ночью)."""
    hour_of_day = hour % 24
    # Синусоида с пиком в 14:00 (час 14)
    seasonal = base + 40 * math.sin(2 * math.pi * (hour_of_day - 6) / 24)
    noise = random.uniform(-3, 3)
    return max(0, seasonal + noise)


def pattern_weekly_seasonality(hour: int, base: float = 180.0) -> float:
    """Недельная сезонность (активность выше в будни)."""
    hour_of_week = hour % (24 * 7)
    day_of_week = hour_of_week // 24
    # Понедельник-Пятница (0-4) - выше, Суббота-Воскресенье (5-6) - ниже
    if day_of_week < 5:  # Будни
        seasonal = base + 30
    else:  # Выходные
        seasonal = base - 20
    noise = random.uniform(-5, 5)
    return max(0, seasonal + noise)


def pattern_random_walk(hour: int, base: float = 120.0, _last=[120.0]) -> float:
    """Случайное блуждание."""
    change = random.uniform(-8, 8)
    _last[0] = max(10, min(250, _last[0] + change))
    return _last[0]


def pattern_constant(hour: int, base: float = 100.0) -> float:
    """Константное значение с малым шумом."""
    noise = random.uniform(-2, 2)
    return base + noise


def pattern_with_anomalies(hour: int, base: float = 130.0) -> float:
    """Нормальный паттерн с редкими аномалиями."""
    # Базовое значение с суточной сезонностью
    hour_of_day = hour % 24
    value = base + 20 * math.sin(2 * math.pi * (hour_of_day - 6) / 24)
    
    # Добавляем аномалии (5% вероятность)
    if random.random() < 0.05:
        # Случайный выброс вверх или вниз
        anomaly = random.choice([1, -1]) * random.uniform(50, 100)
        value += anomaly
    
    noise = random.uniform(-3, 3)
    return max(0, value + noise)


def pattern_combined_trend_seasonality(hour: int, base: float = 100.0) -> float:
    """Комбинация восходящего тренда и суточной сезонности."""
    # Тренд
    trend = base + (hour * 0.4)
    
    # Суточная сезонность
    hour_of_day = hour % 24
    seasonal = 30 * math.sin(2 * math.pi * (hour_of_day - 6) / 24)
    
    noise = random.uniform(-4, 4)
    return max(0, trend + seasonal + noise)


def pattern_exponential_growth(hour: int, base: float = 50.0) -> float:
    """Экспоненциальный рост (имитация роста пользователей)."""
    growth_rate = 0.003
    value = base * math.exp(growth_rate * hour)
    noise = random.uniform(-value * 0.05, value * 0.05)
    return max(0, value + noise)


def pattern_step_changes(hour: int, base: float = 100.0) -> float:
    """Ступенчатые изменения (например, после обновлений)."""
    # Изменения каждые 5 дней (~120 часов)
    step = hour // 120
    value = base + (step * 20)
    noise = random.uniform(-3, 3)
    return max(0, value + noise)


# Определяем метрики с их паттернами
METRICS = [
    {
        'name': 'test_metric_uptrend',
        'mon_object': 'test_node_01',
        'pattern': pattern_linear_uptrend,
        'description': 'Линейный восходящий тренд'
    },
    {
        'name': 'test_metric_downtrend',
        'mon_object': 'test_node_02',
        'pattern': pattern_linear_downtrend,
        'description': 'Линейный нисходящий тренд'
    },
    {
        'name': 'test_metric_daily_season',
        'mon_object': 'test_node_03',
        'pattern': pattern_daily_seasonality,
        'description': 'Суточная сезонность'
    },
    {
        'name': 'test_metric_weekly_season',
        'mon_object': 'test_node_04',
        'pattern': pattern_weekly_seasonality,
        'description': 'Недельная сезонность'
    },
    {
        'name': 'test_metric_random_walk',
        'mon_object': 'test_node_05',
        'pattern': pattern_random_walk,
        'description': 'Случайное блуждание'
    },
    {
        'name': 'test_metric_constant',
        'mon_object': 'test_node_06',
        'pattern': pattern_constant,
        'description': 'Константное значение'
    },
    {
        'name': 'test_metric_anomalies',
        'mon_object': 'test_node_07',
        'pattern': pattern_with_anomalies,
        'description': 'Паттерн с аномалиями'
    },
    {
        'name': 'test_metric_trend_season',
        'mon_object': 'test_node_08',
        'pattern': pattern_combined_trend_seasonality,
        'description': 'Тренд + сезонность'
    },
    {
        'name': 'test_metric_exponential',
        'mon_object': 'test_node_09',
        'pattern': pattern_exponential_growth,
        'description': 'Экспоненциальный рост'
    },
    {
        'name': 'test_metric_step_changes',
        'mon_object': 'test_node_10',
        'pattern': pattern_step_changes,
        'description': 'Ступенчатые изменения'
    }
]


def generate_prometheus_format() -> str:
    """Генерирует данные в формате Prometheus exposition."""
    timestamps = generate_timestamps()
    lines = []
    
    # Заголовок
    lines.append("# Тестовые метрики для прогнозирования")
    lines.append(f"# Сгенерировано: {datetime.now().isoformat()}")
    lines.append(f"# Период: {START_TIME.isoformat()} - {END_TIME.isoformat()}")
    lines.append(f"# Точек данных на метрику: {len(timestamps)}")
    lines.append("")
    
    for metric in METRICS:
        lines.append(f"# {metric['description']}")
        
        for hour, timestamp in enumerate(timestamps):
            value = metric['pattern'](hour)
            # Формат: metric_name{labels} value timestamp
            line = f"{metric['name']}{{name=\"{metric['mon_object']}\",type=\"actual\"}} {value:.2f} {timestamp}"
            lines.append(line)
        
        lines.append("")  # Пустая строка между метриками
    
    return '\n'.join(lines)


def generate_csv_format() -> str:
    """Генерирует данные в формате CSV для анализа."""
    timestamps = generate_timestamps()
    lines = []
    
    # Заголовок CSV
    header = ['timestamp', 'datetime'] + [m['name'] for m in METRICS]
    lines.append(','.join(header))
    
    # Данные
    for hour, timestamp in enumerate(timestamps):
        dt = datetime.fromtimestamp(timestamp / 1000)
        row = [str(timestamp), dt.isoformat()]
        
        for metric in METRICS:
            value = metric['pattern'](hour)
            row.append(f"{value:.2f}")
        
        lines.append(','.join(row))
    
    return '\n'.join(lines)


def generate_summary() -> str:
    """Генерирует сводную информацию о метриках."""
    timestamps = generate_timestamps()
    lines = []
    
    lines.append("=" * 80)
    lines.append("СВОДКА ПО ТЕСТОВЫМ МЕТРИКАМ")
    lines.append("=" * 80)
    lines.append(f"Период: {START_TIME.strftime('%Y-%m-%d %H:%M')} - {END_TIME.strftime('%Y-%m-%d %H:%M')}")
    lines.append(f"Общее количество часов: {len(timestamps)}")
    lines.append(f"Количество метрик: {len(METRICS)}")
    lines.append(f"Всего точек данных: {len(timestamps) * len(METRICS)}")
    lines.append("")
    lines.append("МЕТРИКИ:")
    lines.append("-" * 80)
    
    for i, metric in enumerate(METRICS, 1):
        lines.append(f"{i}. {metric['name']}")
        lines.append(f"   Объект: {metric['mon_object']}")
        lines.append(f"   Паттерн: {metric['description']}")
        
        # Вычисляем статистику
        values = [metric['pattern'](hour) for hour in range(len(timestamps))]
        min_val = min(values)
        max_val = max(values)
        avg_val = sum(values) / len(values)
        
        lines.append(f"   Мин: {min_val:.2f}, Макс: {max_val:.2f}, Средн: {avg_val:.2f}")
        lines.append("")
    
    return '\n'.join(lines)


def main():
    """Основная функция."""
    print("Генерация тестовых метрик...")
    print(f"Период: {START_TIME} - {END_TIME}")
    print(f"Количество метрик: {len(METRICS)}")
    print()
    
    # Генерируем и записываем в формате Prometheus
    print("Создание файла в формате Prometheus...")
    prometheus_data = generate_prometheus_format()
    with open('test_metrics_prometheus.txt', 'w', encoding='utf-8') as f:
        f.write(prometheus_data)
    print(f"✓ Создан файл: test_metrics_prometheus.txt ({len(prometheus_data)} байт)")
    
    # Генерируем и записываем в формате CSV
    print("Создание файла в формате CSV...")
    csv_data = generate_csv_format()
    with open('test_metrics_data.csv', 'w', encoding='utf-8') as f:
        f.write(csv_data)
    print(f"✓ Создан файл: test_metrics_data.csv ({len(csv_data)} байт)")
    
    # Генерируем сводку
    print("Создание сводки...")
    summary = generate_summary()
    with open('test_metrics_summary.txt', 'w', encoding='utf-8') as f:
        f.write(summary)
    print(f"✓ Создан файл: test_metrics_summary.txt")
    
    print()
    print("=" * 80)
    print(summary)
    print("=" * 80)
    print()
    print("ГОТОВО! Файлы созданы:")
    print("  1. test_metrics_prometheus.txt - для загрузки в VictoriaMetrics")
    print("  2. test_metrics_data.csv - для анализа в Excel/pandas")
    print("  3. test_metrics_summary.txt - сводная информация")
    print()
    print("Для загрузки в VictoriaMetrics выполните:")
    print("  curl -X POST http://victoriametrics:8428/api/v1/import/prometheus \\")
    print("       -T test_metrics_prometheus.txt")


if __name__ == '__main__':
    main()

