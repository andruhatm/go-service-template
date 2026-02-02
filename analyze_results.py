#!/usr/bin/env python3
"""Анализ результатов тестирования прогнозирования"""

import json

with open('forecast_test_results.json', 'r') as f:
    data = json.load(f)

print('\n' + '='*120)
print('ПОДРОБНЫЕ РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ СИСТЕМЫ ПРОГНОЗИРОВАНИЯ')
print('='*120)
print(f"{'Метрика':<40} {'Паттерн':<25} {'MAE':>10} {'MAPE,%':>8} {'RMSE':>10} {'R²':>8} {'Время,с':>8}")
print('-'*120)

successful = []
for r in data:
    if r.get('status') == 'success':
        m = r['metrics']
        mape_str = f"{m['mape']:.2f}" if m['mape'] is not None else 'N/A'
        r2_str = f"{m['r2']:.3f}" if m['r2'] is not None else 'N/A'
        
        print(f"{r['metric'][:39]:<40} {r['expected_pattern'][:24]:<25} {m['mae']:>10.3f} {mape_str:>8} "
              f"{m['rmse']:>10.3f} {r2_str:>8} {r['elapsed_time']:>8.3f}")
        
        # Детали
        print(f"  Описание: {r['description']}")
        print(f"  Точек обучения: {r['training_points']}, Точек теста: {r['test_points']}, "
              f"Точек прогноза: {r['forecast_points']}")
        print(f"  Среднее фактическое: {m['mean_actual']:.2f}, Среднее прогнозное: {m['mean_predicted']:.2f}")
        print()
        
        successful.append(r)
    else:
        print(f"{r['metric']:<40} {'ERROR':>25} {'N/A':>10} {'N/A':>8} {'N/A':>10} {'N/A':>8} {'N/A':>8}")
        print(f"  Статус: {r['status']}")
        print()

print('='*120)
print(f'Успешных тестов: {len(successful)} из {len(data)}')

# Вычисляем средние метрики только для метрик с непустыми значениями
if successful:
    mae_values = [r['metrics']['mae'] for r in successful if r['metrics']['mae'] is not None]
    mape_values = [r['metrics']['mape'] for r in successful if r['metrics']['mape'] is not None]
    rmse_values = [r['metrics']['rmse'] for r in successful if r['metrics']['rmse'] is not None]
    r2_values = [r['metrics']['r2'] for r in successful if r['metrics']['r2'] is not None]
    time_values = [r['elapsed_time'] for r in successful]
    
    print(f'\nСредние метрики точности:')
    if mae_values:
        print(f'  MAE:  {sum(mae_values)/len(mae_values):.4f}')
    if mape_values:
        print(f'  MAPE: {sum(mape_values)/len(mape_values):.2f}%')
    if rmse_values:
        print(f'  RMSE: {sum(rmse_values)/len(rmse_values):.4f}')
    if r2_values:
        print(f'  R²:   {sum(r2_values)/len(r2_values):.4f}')
    if time_values:
        print(f'\nСреднее время выполнения: {sum(time_values)/len(time_values):.2f} сек')

print('='*120)

# Группируем по категориям
print('\n' + '='*120)
print('АНАЛИЗ ПО КАТЕГОРИЯМ')
print('='*120)

categories = {
    'Простые паттерны': ['uptrend', 'downtrend', 'constant'],
    'Сезонность': ['daily_seasonality', 'weekly_seasonality', 'high_noise_seasonal'],
    'Комбинированные': ['combined', 'realistic'],
    'С шумом и аномалиями': ['with_anomalies', 'high_noise']
}

for category, patterns in categories.items():
    cat_results = [r for r in successful if r['expected_pattern'] in patterns]
    if cat_results:
        mape_values = [r['metrics']['mape'] for r in cat_results if r['metrics']['mape'] is not None]
        r2_values = [r['metrics']['r2'] for r in cat_results if r['metrics']['r2'] is not None]
        
        print(f'\n{category}:')
        print(f'  Количество метрик: {len(cat_results)}')
        if mape_values:
            print(f'  Средний MAPE: {sum(mape_values)/len(mape_values):.2f}%')
        if r2_values:
            print(f'  Средний R²: {sum(r2_values)/len(r2_values):.4f}')

print('\n' + '='*120)


