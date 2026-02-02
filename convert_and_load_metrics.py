#!/usr/bin/env python3
"""
Конвертирует Prometheus формат в VictoriaMetrics JSON и загружает данные
"""

import re
import requests
import json
from collections import defaultdict

VICTORIA_URL = "http://localhost:8428"

def parse_prometheus_file(filename):
    """Парсит файл в формате Prometheus"""
    metrics_data = defaultdict(lambda: {"timestamps": [], "values": []})
    
    with open(filename, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            # Парсим строку: metric_name{labels} value timestamp
            match = re.match(r'(\w+)\{([^}]+)\}\s+([\d.]+)\s+(\d+)', line)
            if match:
                metric_name = match.group(1)
                labels_str = match.group(2)
                value = float(match.group(3))
                timestamp = int(match.group(4))
                
                # Парсим лейблы
                labels = {}
                for label in labels_str.split(','):
                    key, val = label.split('=')
                    labels[key] = val.strip('"')
                
                # Создаем ключ для группировки
                labels['__name__'] = metric_name
                key = (metric_name, frozenset(labels.items()))
                
                metrics_data[key]["timestamps"].append(timestamp)
                metrics_data[key]["values"].append(value)
                metrics_data[key]["labels"] = labels
    
    return metrics_data

def upload_to_victoriametrics(metrics_data):
    """Загружает данные в VictoriaMetrics через JSON API"""
    url = f"{VICTORIA_URL}/api/v1/import"
    
    total_metrics = len(metrics_data)
    uploaded = 0
    failed = 0
    
    print(f"Загрузка {total_metrics} временных рядов...")
    
    for i, ((metric_name, _), data) in enumerate(metrics_data.items(), 1):
        payload = {
            "metric": data["labels"],
            "values": data["values"],
            "timestamps": data["timestamps"]
        }
        
        try:
            response = requests.post(url, json=payload)
            if response.status_code in (200, 204):
                uploaded += 1
                if i % 5 == 0:
                    print(f"  Загружено {i}/{total_metrics} метрик...")
            else:
                failed += 1
                print(f"  Ошибка для {metric_name}: HTTP {response.status_code}")
        except Exception as e:
            failed += 1
            print(f"  Ошибка для {metric_name}: {e}")
    
    return uploaded, failed

def main():
    print("Конвертация и загрузка тестовых метрик в VictoriaMetrics")
    print("=" * 70)
    
    # Парсим файл
    print("1. Парсинг файла test_metrics_prometheus.txt...")
    metrics_data = parse_prometheus_file('test_metrics_prometheus.txt')
    print(f"   ✓ Найдено {len(metrics_data)} временных рядов")
    
    # Загружаем данные
    print("\n2. Загрузка данных в VictoriaMetrics...")
    uploaded, failed = upload_to_victoriametrics(metrics_data)
    
    print("\n" + "=" * 70)
    print(f"РЕЗУЛЬТАТ:")
    print(f"  Загружено: {uploaded}")
    print(f"  Ошибок: {failed}")
    
    if failed == 0:
        print("\n✅ ВСЕ ДАННЫЕ УСПЕШНО ЗАГРУЖЕНЫ!")
    else:
        print(f"\n⚠ Загружено с ошибками")
    
    # Проверка
    print("\n3. Проверка загруженных данных...")
    response = requests.get(f"{VICTORIA_URL}/api/v1/query?query=test_metric_uptrend")
    result = response.json()
    count = len(result.get('data', {}).get('result', []))
    print(f"   test_metric_uptrend: найдено {count} временных рядов")

if __name__ == '__main__':
    main()
