#!/usr/bin/env python3
"""
Тестирование системы прогнозирования
Создает прогнозы для различных паттернов метрик и вычисляет метрики точности
"""

import requests
import json
import time
from datetime import datetime, timedelta
import numpy as np
from typing import Dict, List, Tuple

# Конфигурация
FORECAST_SERVICE_URL = "http://localhost:8082"
VICTORIA_METRICS_URL = "http://localhost:8428"

# Тестовые метрики с различными паттернами
TEST_METRICS = [
    {
        "name": "test_metric_uptrend",
        "mon_object": "test_node_01",
        "description": "Линейный восходящий тренд",
        "expected_pattern": "uptrend"
    },
    {
        "name": "test_metric_downtrend", 
        "mon_object": "test_node_02",
        "description": "Линейный нисходящий тренд",
        "expected_pattern": "downtrend"
    },
    {
        "name": "test_metric_daily_season",
        "mon_object": "test_node_03",
        "description": "Суточная сезонность",
        "expected_pattern": "daily_seasonality"
    },
    {
        "name": "test_metric_weekly_season",
        "mon_object": "test_node_04",
        "description": "Недельная сезонность",
        "expected_pattern": "weekly_seasonality"
    },
    {
        "name": "test_metric_constant",
        "mon_object": "test_node_06",
        "description": "Константное значение",
        "expected_pattern": "constant"
    },
    {
        "name": "test_metric_trend_season",
        "mon_object": "test_node_08",
        "description": "Тренд + сезонность",
        "expected_pattern": "combined"
    },
    {
        "name": "test_metric_anomalies",
        "mon_object": "test_node_07",
        "description": "Паттерн с аномалиями (5% выбросов)",
        "expected_pattern": "with_anomalies"
    },
    {
        "name": "test_metric_high_noise_trend",
        "mon_object": "test_node_11",
        "description": "Тренд с высоким уровнем шума (±20%)",
        "expected_pattern": "high_noise"
    },
    {
        "name": "test_metric_high_noise_season",
        "mon_object": "test_node_12",
        "description": "Сезонность с высоким уровнем шума",
        "expected_pattern": "high_noise_seasonal"
    },
    {
        "name": "test_metric_realistic_throughput",
        "mon_object": "test_node_13",
        "description": "Реалистичная пропускная способность (тренд+сезонность+шум+всплески)",
        "expected_pattern": "realistic"
    }
]


def get_historical_data(metric_name: str, hours_back: int = 720) -> List[Tuple[int, float]]:
    """Получить исторические данные из VictoriaMetrics"""
    end_time = int(time.time())
    start_time = end_time - (hours_back * 3600)
    
    query = f'{metric_name}'
    url = f"{VICTORIA_METRICS_URL}/api/v1/query_range"
    params = {
        'query': query,
        'start': start_time,
        'end': end_time,
        'step': '3600'  # 1 час
    }
    
    response = requests.get(url, params=params)
    if response.status_code != 200:
        print(f"Ошибка получения данных для {metric_name}: {response.status_code}")
        return []
    
    data = response.json()
    if data['status'] != 'success' or not data['data']['result']:
        print(f"Нет данных для метрики {metric_name}")
        return []
    
    values = data['data']['result'][0]['values']
    return [(int(v[0]), float(v[1])) for v in values]


def create_forecast(metric_name: str, mon_object: str, forecast_hours: int = 168) -> Dict:
    """Создать запрос на прогнозирование"""
    # Используем данные за последние 30 дней для обучения
    training_period_hours = 720  # 30 дней
    end_time = int(time.time())
    from_timestamp = end_time - (training_period_hours * 3600)
    
    forecast_request = {
        "mon_obj": mon_object,
        "metric_name": metric_name,
        "from_timestamp": from_timestamp,
        "forecast_periods": forecast_hours,
        "freq": "H",
        "step": "1h",
        "seasonality_mode": "additive",
        "changepoint_prior_scale": 0.05
    }
    
    print(f"\n📊 Создание прогноза для {metric_name}...")
    print(f"   Период обучения: {training_period_hours} часов")
    print(f"   Горизонт прогноза: {forecast_hours} часов")
    
    url = f"{FORECAST_SERVICE_URL}/api/v1/forecast"
    start_time = time.time()
    
    try:
        response = requests.post(url, json=forecast_request, timeout=120)
        elapsed_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            result['elapsed_time'] = elapsed_time
            print(f"   ✓ Прогноз создан за {elapsed_time:.2f} сек")
            return result
        else:
            print(f"   ✗ Ошибка: {response.status_code} - {response.text}")
            return {"error": response.text, "elapsed_time": elapsed_time}
    except requests.exceptions.Timeout:
        print(f"   ✗ Timeout (>120 сек)")
        return {"error": "Timeout", "elapsed_time": 120}
    except Exception as e:
        print(f"   ✗ Исключение: {str(e)}")
        return {"error": str(e), "elapsed_time": 0}


def calculate_metrics(actual: List[float], predicted: List[float]) -> Dict:
    """
    Вычислить метрики точности прогноза с детальной диагностикой и пошаговыми расчетами.
    
    Метрики точности прогнозирования:
    
    1. MAE (Mean Absolute Error) - Средняя абсолютная ошибка
       Формула: MAE = (1/n) * Σ|yᵢ - ŷᵢ|
       Интерпретация: средняя величина ошибки в абсолютных единицах измерения метрики
       
    2. RMSE (Root Mean Squared Error) - Корень из средней квадратичной ошибки
       Формула: RMSE = √[(1/n) * Σ(yᵢ - ŷᵢ)²]
       Интерпретация: средняя ошибка с повышенным весом для больших отклонений
       Свойство: RMSE ≥ MAE всегда, причем RMSE = MAE только если все ошибки одинаковы
       Отношение RMSE/MAE показывает вариативность ошибок:
       - близко к 1.0: ошибки очень однородны (подозрительно)
       - 1.1-1.3: нормальная вариативность
       - >1.5: высокая вариативность с большими выбросами
    
    3. MAPE (Mean Absolute Percentage Error) - Средняя абсолютная процентная ошибка
       Формула: MAPE = (100%/n) * Σ|((yᵢ - ŷᵢ)/yᵢ)|
       Интерпретация: средняя относительная ошибка в процентах
       Недостаток: чувствительна к малым значениям yᵢ
       
    4. WAPE (Weighted Absolute Percentage Error) - Взвешенная абсолютная процентная ошибка
       Формула: WAPE = (Σ|yᵢ - ŷᵢ|) / (Σ|yᵢ|) * 100%
       Интерпретация: общая относительная ошибка, более устойчива к выбросам чем MAPE
       Преимущество: легче интерпретировать для бизнеса, не искажается при малых значениях
       
    5. R² (Coefficient of Determination) - Коэффициент детерминации
       Формула: R² = 1 - (SS_res / SS_tot), где
                SS_res = Σ(yᵢ - ŷᵢ)² (сумма квадратов остатков)
                SS_tot = Σ(yᵢ - ȳ)² (общая сумма квадратов)
       Интерпретация: доля объясненной дисперсии (0.0 = плохо, 1.0 = идеально)
       Может быть отрицательным если модель хуже среднего значения
    
    где: yᵢ - фактическое значение, ŷᵢ - прогнозное значение, n - количество точек
    """
    actual = np.array(actual)
    predicted = np.array(predicted)
    
    # Убираем NaN значения
    mask = ~(np.isnan(actual) | np.isnan(predicted))
    actual = actual[mask]
    predicted = predicted[mask]
    
    if len(actual) == 0:
        return {
            "mae": None,
            "mape": None,
            "wape": None,
            "rmse": None,
            "r2": None,
            "points": 0
        }
    
    n = len(actual)
    
    # Вычисляем ошибки для каждой точки
    errors = actual - predicted  # eᵢ = yᵢ - ŷᵢ
    abs_errors = np.abs(errors)  # |eᵢ|
    squared_errors = errors ** 2  # eᵢ²
    
    # 1. Mean Absolute Error: MAE = (1/n) * Σ|eᵢ|
    mae = np.mean(abs_errors)
    
    # 2. Root Mean Squared Error: RMSE = √[(1/n) * Σ(eᵢ²)]
    mse = np.mean(squared_errors)  # Mean Squared Error
    rmse = np.sqrt(mse)
    
    # 3. Mean Absolute Percentage Error: MAPE = (100%/n) * Σ|(eᵢ/yᵢ)|
    mask_nonzero = actual != 0
    if np.sum(mask_nonzero) > 0:
        percentage_errors = np.abs(errors[mask_nonzero] / actual[mask_nonzero]) * 100
        mape = np.mean(percentage_errors)
    else:
        mape = None
    
    # 4. Weighted Absolute Percentage Error: WAPE = (Σ|eᵢ|) / (Σ|yᵢ|) * 100%
    sum_abs_errors = np.sum(abs_errors)
    sum_abs_actual = np.sum(np.abs(actual))
    wape = (sum_abs_errors / sum_abs_actual * 100) if sum_abs_actual > 0 else None
    
    # 5. R² Score: R² = 1 - (SS_res / SS_tot)
    ss_res = np.sum(squared_errors)  # Σ(yᵢ - ŷᵢ)²
    mean_actual = np.mean(actual)
    ss_tot = np.sum((actual - mean_actual) ** 2)  # Σ(yᵢ - ȳ)²
    r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else None
    
    # Дополнительная диагностика
    std_error = np.std(errors)
    min_error = float(np.min(errors))
    max_error = float(np.max(errors))
    median_abs_error = float(np.median(abs_errors))
    
    # КРИТИЧЕСКАЯ ПРОВЕРКА: RMSE/MAE отношение
    # Теоретически: RMSE = MAE * √[(Σeᵢ⁴) / (Σeᵢ²)²]
    # Если все ошибки одинаковы: RMSE = MAE (отношение = 1.0)
    # Для нормального распределения ошибок: RMSE/MAE ≈ 1.25
    # Высокая вариативность/выбросы: RMSE/MAE > 1.5
    rmse_mae_ratio = rmse / mae if mae > 0 else None
    
    # Расчет квартилей ошибок для понимания распределения
    q1_error = float(np.percentile(abs_errors, 25))
    q3_error = float(np.percentile(abs_errors, 75))
    p95_error = float(np.percentile(abs_errors, 95))
    p99_error = float(np.percentile(abs_errors, 99))
    
    # Количество больших ошибок (>2*MAE)
    large_errors = np.sum(abs_errors > 2 * mae)
    large_errors_pct = (large_errors / n) * 100
    
    return {
        # Основные метрики
        "mae": float(mae),
        "rmse": float(rmse),
        "mape": float(mape) if mape is not None else None,
        "wape": float(wape) if wape is not None else None,
        "r2": float(r2) if r2 is not None else None,
        
        # Промежуточные расчеты для верификации
        "mse": float(mse),
        "sum_abs_errors": float(sum_abs_errors),
        "sum_abs_actual": float(sum_abs_actual),
        "ss_res": float(ss_res),
        "ss_tot": float(ss_tot),
        
        # Статистика данных
        "points": n,
        "mean_actual": float(mean_actual),
        "mean_predicted": float(np.mean(predicted)),
        "std_actual": float(np.std(actual)),
        "std_predicted": float(np.std(predicted)),
        
        # Статистика ошибок
        "std_error": float(std_error),
        "min_error": min_error,
        "max_error": max_error,
        "median_abs_error": median_abs_error,
        "q1_abs_error": q1_error,
        "q3_abs_error": q3_error,
        "p95_abs_error": p95_error,
        "p99_abs_error": p99_error,
        
        # Критические диагностические показатели
        "rmse_mae_ratio": float(rmse_mae_ratio) if rmse_mae_ratio is not None else None,
        "large_errors_count": int(large_errors),
        "large_errors_pct": float(large_errors_pct)
    }


def test_forecast_accuracy(metric_info: Dict) -> Dict:
    """
    Тестировать точность прогноза используя метод скользящего контроля:
    - Берем последние 37 дней данных
    - Обучаем на первых 30 днях  
    - Прогнозируем следующие 7 дней
    - Сравниваем прогноз с фактическими данными
    """
    metric_name = metric_info['name']
    mon_object = metric_info['mon_object']
    
    print(f"\n{'='*80}")
    print(f"Тестирование: {metric_name}")
    print(f"Описание: {metric_info['description']}")
    print(f"{'='*80}")
    
    # Получаем данные за последние 37 дней (30 для обучения + 7 для теста)
    total_hours = 37 * 24  # 888 часов
    all_data = get_historical_data(metric_name, hours_back=total_hours)
    
    if len(all_data) < 100:
        print(f"⚠ Недостаточно данных: {len(all_data)} точек")
        return {
            "metric": metric_name,
            "status": "insufficient_data",
            "data_points": len(all_data)
        }
    
    print(f"📈 Получено {len(all_data)} точек данных")
    
    # Разделяем на обучающие и тестовые данные
    test_hours = 7 * 24  # 168 часов (7 дней) для теста
    train_data = all_data[:-test_hours]
    test_data = all_data[-test_hours:]
    
    print(f"   Обучающая выборка: {len(train_data)} точек")
    print(f"   Тестовая выборка: {len(test_data)} точек")
    
    # Создаем прогноз
    forecast_result = create_forecast(
        metric_name=metric_name,
        mon_object=mon_object,
        forecast_hours=test_hours
    )
    
    if 'error' in forecast_result:
        return {
            "metric": metric_name,
            "status": "error",
            "error": forecast_result['error'],
            "elapsed_time": forecast_result.get('elapsed_time', 0)
        }
    
    # Прогноз записан в VictoriaMetrics, нужно извлечь его оттуда
    # Прогноз хранится с меткой type="forecast"
    print(f"   Извлечение прогноза из VictoriaMetrics...")
    
    # Ждем немного, чтобы данные записались
    time.sleep(2)
    
    # ВАЖНО: Прогноз начинается с конца обучающих данных, а не с текущего времени!
    # Берем временные метки из тестовых данных для корректного извлечения
    if len(test_data) > 0:
        forecast_start_time = test_data[0][0]  # Первая временная метка тестовой выборки
        forecast_end_time = test_data[-1][0]   # Последняя временная метка тестовой выборки
    else:
        # Fallback: если нет тестовых данных, используем относительное время
        forecast_start_time = int(time.time())
        forecast_end_time = forecast_start_time + (test_hours * 3600)
    
    print(f"   Период прогноза: {forecast_start_time} - {forecast_end_time}")
    
    forecast_query = f'{metric_name}{{type="forecast"}}'
    vm_url = f"{VICTORIA_METRICS_URL}/api/v1/query_range"
    
    vm_params = {
        'query': forecast_query,
        'start': forecast_start_time,
        'end': forecast_end_time,
        'step': '3600'
    }
    
    try:
        vm_response = requests.get(vm_url, params=vm_params, timeout=10)
        if vm_response.status_code != 200 or not vm_response.json().get('data', {}).get('result'):
            print("⚠ Не удалось извлечь прогноз из VictoriaMetrics")
            return {
                "metric": metric_name,
                "status": "forecast_not_found_in_vm",
                "forecast_result": forecast_result
            }
        
        vm_data = vm_response.json()
        forecast_values = [float(v[1]) for v in vm_data['data']['result'][0]['values']]
        print(f"   ✓ Извлечено {len(forecast_values)} точек прогноза")
        
    except Exception as e:
        print(f"   ✗ Ошибка извлечения прогноза: {e}")
        return {
            "metric": metric_name,
            "status": "error_reading_forecast",
            "error": str(e)
        }
    
    # Фактические значения из тестовой выборки
    actual_values = [v[1] for v in test_data]
    
    # Выравниваем длины (берем минимум)
    min_len = min(len(actual_values), len(forecast_values))
    actual_values = actual_values[:min_len]
    forecast_values = forecast_values[:min_len]
    
    print(f"   Сравнение: {min_len} точек")
    
    # Вычисляем метрики точности
    metrics = calculate_metrics(actual_values, forecast_values)
    
    result = {
        "metric": metric_name,
        "mon_object": mon_object,
        "description": metric_info['description'],
        "expected_pattern": metric_info['expected_pattern'],
        "status": "success",
        "elapsed_time": forecast_result.get('elapsed_time', 0),
        "training_points": len(train_data),
        "test_points": len(test_data),
        "forecast_points": len(forecast_values),
        "metrics": metrics
    }
    
    # Выводим результаты
    print(f"\n📊 Результаты прогнозирования:")
    print(f"\n   Основные метрики точности:")
    print(f"   MAE:  {metrics['mae']:.4f}" if metrics['mae'] is not None else "   MAE:  N/A")
    print(f"   RMSE: {metrics['rmse']:.4f}" if metrics['rmse'] is not None else "   RMSE: N/A")
    print(f"   MAPE: {metrics['mape']:.2f}%" if metrics['mape'] is not None else "   MAPE: N/A")
    print(f"   WAPE: {metrics['wape']:.2f}%" if metrics.get('wape') is not None else "   WAPE: N/A")
    print(f"   R²:   {metrics['r2']:.4f}" if metrics['r2'] is not None else "   R²:   N/A")
    
    print(f"\n   Диагностика:")
    print(f"   RMSE/MAE: {metrics['rmse_mae_ratio']:.4f}" if metrics.get('rmse_mae_ratio') else "   RMSE/MAE: N/A")
    if metrics.get('rmse_mae_ratio'):
        ratio = metrics['rmse_mae_ratio']
        if ratio < 1.05:
            print(f"   ⚠️  Подозрительно низкое отношение (<1.05) - ошибки слишком однородны")
        elif ratio < 1.2:
            print(f"   ✓  Нормальное распределение ошибок")
        else:
            print(f"   ⚡ Высокая вариативность - есть большие выбросы")
    
    print(f"   Median |error|: {metrics['median_abs_error']:.4f}" if metrics.get('median_abs_error') else "")
    print(f"   95-й перцентиль |error|: {metrics['p95_abs_error']:.4f}" if metrics.get('p95_abs_error') else "")
    print(f"   Больших ошибок (>2×MAE): {metrics['large_errors_count']} ({metrics['large_errors_pct']:.1f}%)" if metrics.get('large_errors_count') is not None else "")
    print(f"   Диапазон ошибок: [{metrics['min_error']:.4f}, {metrics['max_error']:.4f}]" if metrics.get('min_error') else "")
    
    return result


def main():
    """Основная функция тестирования"""
    print("="*80)
    print("ТЕСТИРОВАНИЕ СИСТЕМЫ ПРОГНОЗИРОВАНИЯ")
    print("="*80)
    print(f"Дата: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Forecast Service: {FORECAST_SERVICE_URL}")
    print(f"VictoriaMetrics: {VICTORIA_METRICS_URL}")
    
    # Проверка доступности сервисов
    try:
        response = requests.get(f"{FORECAST_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✓ Forecast Service доступен")
        else:
            print("✗ Forecast Service недоступен")
            return
    except Exception as e:
        print(f"✗ Ошибка подключения к Forecast Service: {e}")
        return
    
    try:
        response = requests.get(f"{VICTORIA_METRICS_URL}/api/v1/status/tsdb", timeout=5)
        if response.status_code == 200:
            print("✓ VictoriaMetrics доступен")
        else:
            print("✗ VictoriaMetrics недоступен")
            return
    except Exception as e:
        print(f"✗ Ошибка подключения к VictoriaMetrics: {e}")
        return
    
    # Запускаем тесты для каждой метрики
    results = []
    for metric_info in TEST_METRICS:
        result = test_forecast_accuracy(metric_info)
        results.append(result)
        time.sleep(1)  # Небольшая пауза между тестами
    
    # Сохраняем результаты
    output_file = "forecast_test_results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*80}")
    print(f"✓ Результаты сохранены в {output_file}")
    print(f"{'='*80}")
    
    # Выводим сводку
    print("\n" + "="*80)
    print("СВОДКА РЕЗУЛЬТАТОВ")
    print("="*80)
    successful = [r for r in results if r.get('status') == 'success']
    
    if successful:
        avg_mae = np.mean([r['metrics']['mae'] for r in successful if r['metrics']['mae'] is not None])
        avg_mape = np.mean([r['metrics']['mape'] for r in successful if r['metrics']['mape'] is not None])
        avg_wape = np.mean([r['metrics']['wape'] for r in successful if r['metrics'].get('wape') is not None])
        avg_rmse = np.mean([r['metrics']['rmse'] for r in successful if r['metrics']['rmse'] is not None])
        avg_r2 = np.mean([r['metrics']['r2'] for r in successful if r['metrics']['r2'] is not None])
        avg_rmse_mae_ratio = np.mean([r['metrics']['rmse_mae_ratio'] for r in successful if r['metrics'].get('rmse_mae_ratio') is not None])
        avg_time = np.mean([r['elapsed_time'] for r in successful])
        
        print(f"Успешных тестов: {len(successful)} из {len(results)}")
        print(f"\nСредние метрики точности:")
        print(f"  MAE:  {avg_mae:.4f}")
        print(f"  RMSE: {avg_rmse:.4f}")
        print(f"  MAPE: {avg_mape:.2f}%")
        print(f"  WAPE: {avg_wape:.2f}%")
        print(f"  R²:   {avg_r2:.4f}")
        print(f"\nДиагностика:")
        print(f"  Среднее RMSE/MAE: {avg_rmse_mae_ratio:.4f}")
        print(f"  Среднее время: {avg_time:.2f} сек")
        
        # Выводим детали по каждой метрике
        print(f"\n{'Метрика':<35} {'MAE':>8} {'RMSE':>8} {'MAPE':>7} {'WAPE':>7} {'R²':>7} {'RMSE/MAE':>9}")
        print("-" * 95)
        for r in successful:
            m = r['metrics']
            print(f"{r['metric']:<35} {m['mae']:>8.2f} {m['rmse']:>8.2f} "
                  f"{m['mape']:>6.2f}% {m.get('wape', 0):>6.2f}% {m['r2']:>7.3f} {m.get('rmse_mae_ratio', 0):>9.4f}")
    else:
        print("Нет успешных тестов")
    
    return results


if __name__ == "__main__":
    results = main()

