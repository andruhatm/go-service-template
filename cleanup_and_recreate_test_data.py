#!/usr/bin/env python3
"""
Скрипт для полной очистки и повторного создания тестовых данных.
1. Удаляет тестовые объекты из PostgreSQL
2. Удаляет тестовые метрики из VictoriaMetrics
3. Создает новые тестовые объекты
4. Загружает новые тестовые метрики
"""

import json
import sys
import os
import subprocess
from urllib import request, parse
from urllib.error import HTTPError, URLError

# Конфигурация
API_URL = os.getenv('API_URL', 'http://localhost:8080')
VICTORIA_URL = os.getenv('VICTORIA_METRICS_URL', 'http://localhost:8428')
KEYCLOAK_URL = os.getenv('KEYCLOAK_URL', 'http://localhost:8180')
KEYCLOAK_REALM = os.getenv('KEYCLOAK_REALM', 'monitoring')
KEYCLOAK_CLIENT = os.getenv('KEYCLOAK_CLIENT', 'monitoring-client')
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')
DEFAULT_TEST_METRICS_DAYS = 180
TEST_METRICS_DAYS = int(os.getenv('TEST_METRICS_DAYS', str(DEFAULT_TEST_METRICS_DAYS)))


def print_section(title):
    """Выводит красивый заголовок секции."""
    print()
    print('=' * 80)
    print(title.center(80))
    print('=' * 80)
    print()


def get_keycloak_token():
    """Получает токен от Keycloak."""
    token_url = f'{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token'
    
    data = parse.urlencode({
        'grant_type': 'password',
        'client_id': KEYCLOAK_CLIENT,
        'username': ADMIN_USERNAME,
        'password': ADMIN_PASSWORD
    }).encode('utf-8')
    
    try:
        req = request.Request(token_url, data=data, method='POST')
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        
        with request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result['access_token']
    except Exception as e:
        print(f'❌ Ошибка при получении токена: {e}')
        return None


def delete_test_nodes(token):
    """Удаляет все тестовые узлы из базы данных."""
    print_section('ШАГ 1: УДАЛЕНИЕ ТЕСТОВЫХ УЗЛОВ')
    
    print('📊 Получение списка тестовых узлов...')
    
    # Получаем список узлов
    try:
        req = request.Request(f'{API_URL}/api/mon-objects')
        with request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            all_nodes = data.get('items', [])
    except Exception as e:
        print(f'❌ Ошибка при получении списка узлов: {e}')
        return False
    
    # Фильтруем тестовые узлы
    test_nodes = [node for node in all_nodes if node['name'].startswith('test_node_')]
    
    if not test_nodes:
        print('✓ Тестовые узлы не найдены (уже удалены)')
        return True
    
    print(f'Найдено тестовых узлов: {len(test_nodes)}')
    print()
    
    # Удаляем каждый узел
    deleted_count = 0
    failed_count = 0
    
    for node in test_nodes:
        node_id = node['id']
        node_name = node['name']
        print(f'  Удаление {node_name}...', end=' ')
        
        try:
            req = request.Request(
                f'{API_URL}/api/mon-objects/{node_id}',
                method='DELETE'
            )
            req.add_header('Authorization', f'Bearer {token}')
            
            with request.urlopen(req) as response:
                if response.code in (200, 204):
                    print('✓')
                    deleted_count += 1
                else:
                    print(f'❌ HTTP {response.code}')
                    failed_count += 1
        except HTTPError as e:
            print(f'❌ HTTP {e.code}')
            failed_count += 1
        except Exception as e:
            print(f'❌ {e}')
            failed_count += 1
    
    print()
    print(f'Удалено узлов: {deleted_count}')
    print(f'Ошибок: {failed_count}')
    
    return failed_count == 0


def delete_test_metrics():
    """Удаляет все тестовые метрики из VictoriaMetrics."""
    print_section('ШАГ 2: УДАЛЕНИЕ ТЕСТОВЫХ МЕТРИК')
    
    test_metrics = [
        'test_metric_uptrend',
        'test_metric_downtrend',
        'test_metric_daily_season',
        'test_metric_weekly_season',
        'test_metric_random_walk',
        'test_metric_constant',
        'test_metric_anomalies',
        'test_metric_trend_season',
        'test_metric_exponential',
        'test_metric_step_changes'
    ]
    
    print(f'Удаление {len(test_metrics)} метрик из VictoriaMetrics...')
    print()
    
    deleted_count = 0
    failed_count = 0
    
    for metric in test_metrics:
        print(f'  Удаление {metric}...', end=' ')
        
        try:
            delete_url = f'{VICTORIA_URL}/api/v1/admin/tsdb/delete_series'
            data = parse.urlencode({
                'match[]': metric
            }).encode('utf-8')
            
            req = request.Request(f'{delete_url}?{data.decode()}', method='POST')
            
            with request.urlopen(req) as response:
                if response.code == 204 or response.code == 200:
                    print('✓')
                    deleted_count += 1
                else:
                    print(f'❌ HTTP {response.code}')
                    failed_count += 1
        except Exception as e:
            print(f'⚠ {e} (может быть уже удалена)')
            # Не считаем это ошибкой, возможно метрика не существовала
            deleted_count += 1
    
    print()
    print(f'Обработано метрик: {deleted_count}')
    print(f'Ошибок: {failed_count}')
    
    return True


def generate_test_data():
    """Генерирует тестовые данные."""
    print_section('ШАГ 3: ГЕНЕРАЦИЯ ТЕСТОВЫХ ДАННЫХ')
    
    # Генерация узлов
    print('1. Генерация тестовых узлов...')
    try:
        result = subprocess.run(
            ['python3', 'generate_test_nodes.py'],
            capture_output=True,
            text=True,
            check=True
        )
        print('✓ Узлы сгенерированы')
    except subprocess.CalledProcessError as e:
        print(f'❌ Ошибка при генерации узлов: {e}')
        return False
    
    print()
    
    # Генерация метрик
    print('2. Генерация тестовых метрик...')
    try:
        result = subprocess.run(
            ['python3', 'generate_test_metrics.py'],
            capture_output=True,
            text=True,
            check=True
        )
        print('✓ Метрики сгенерированы')
    except subprocess.CalledProcessError as e:
        print(f'❌ Ошибка при генерации метрик: {e}')
        return False
    
    return True


def create_test_nodes(token):
    """Создает тестовые узлы."""
    print_section('ШАГ 4: СОЗДАНИЕ ТЕСТОВЫХ УЗЛОВ')
    
    # Загружаем узлы из файла
    try:
        with open('test_nodes.json', 'r', encoding='utf-8') as f:
            nodes = json.load(f)
    except FileNotFoundError:
        print('❌ Файл test_nodes.json не найден!')
        return False
    
    print(f'Создание {len(nodes)} узлов...')
    print()
    
    success_count = 0
    failed_count = 0
    
    for node in nodes:
        node_name = node['name']
        print(f'  Создание {node_name}...', end=' ')
        
        try:
            data = json.dumps(node).encode('utf-8')
            req = request.Request(
                f'{API_URL}/api/mon-objects',
                data=data,
                method='POST'
            )
            req.add_header('Content-Type', 'application/json')
            req.add_header('Authorization', f'Bearer {token}')
            
            with request.urlopen(req) as response:
                if response.code in (200, 201):
                    print('✓')
                    success_count += 1
                else:
                    print(f'❌ HTTP {response.code}')
                    failed_count += 1
        except HTTPError as e:
            if e.code == 409:
                print('⚠ Уже существует')
                success_count += 1
            else:
                print(f'❌ HTTP {e.code}')
                failed_count += 1
        except Exception as e:
            print(f'❌ {e}')
            failed_count += 1
    
    print()
    print(f'Создано узлов: {success_count}')
    print(f'Ошибок: {failed_count}')
    
    return failed_count == 0


def load_test_metrics():
    """Загружает тестовые метрики в VictoriaMetrics."""
    print_section('ШАГ 5: ЗАГРУЗКА ТЕСТОВЫХ МЕТРИК')
    
    print('Загрузка метрик в VictoriaMetrics...')
    print()
    
    try:
        # Читаем файл с метриками
        with open('test_metrics_prometheus.txt', 'r', encoding='utf-8') as f:
            metrics_data = f.read().encode('utf-8')
        
        print(f'Размер данных: {len(metrics_data)} байт')
        
        # Отправляем в VictoriaMetrics
        req = request.Request(
            f'{VICTORIA_URL}/api/v1/import/prometheus',
            data=metrics_data,
            method='POST'
        )
        req.add_header('Content-Type', 'text/plain')
        
        with request.urlopen(req) as response:
            if response.code in (200, 204):
                print('✓ Метрики успешно загружены')
                return True
            else:
                print(f'❌ HTTP {response.code}')
                return False
    except FileNotFoundError:
        print('❌ Файл test_metrics_prometheus.txt не найден!')
        return False
    except Exception as e:
        print(f'❌ Ошибка при загрузке метрик: {e}')
        return False


def verify_data(token):
    """Проверяет созданные данные."""
    print_section('ШАГ 6: ПРОВЕРКА ДАННЫХ')
    
    all_ok = True
    
    # Проверка узлов
    print('1. Проверка узлов в базе данных...')
    try:
        req = request.Request(f'{API_URL}/api/mon-objects')
        with request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            test_nodes = [n for n in data.get('items', []) if n['name'].startswith('test_node_')]
            
            if len(test_nodes) >= 10:
                print(f'   ✓ Найдено {len(test_nodes)} тестовых узлов')
            else:
                print(f'   ⚠ Найдено только {len(test_nodes)} узлов (ожидалось 10)')
                all_ok = False
    except Exception as e:
        print(f'   ❌ Ошибка проверки узлов: {e}')
        all_ok = False
    
    print()
    
    # Проверка метрик
    print('2. Проверка метрик в VictoriaMetrics...')
    try:
        req = request.Request(f'{VICTORIA_URL}/api/v1/label/__name__/values')
        with request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            metrics = data.get('data', [])
            test_metrics = [m for m in metrics if m.startswith('test_metric_')]
            
            if len(test_metrics) >= 10:
                print(f'   ✓ Найдено {len(test_metrics)} тестовых метрик')
            else:
                print(f'   ⚠ Найдено только {len(test_metrics)} метрик (ожидалось 10)')
                all_ok = False
    except Exception as e:
        print(f'   ❌ Ошибка проверки метрик: {e}')
        all_ok = False
    
    print()
    
    # Проверка точек данных
    print('3. Проверка количества точек данных...')
    try:
        req = request.Request(
            f'{VICTORIA_URL}/api/v1/query?query=count(test_metric_uptrend{{name="test_node_01"}})'
        )
        with request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            result = data.get('data', {}).get('result', [])
            if result:
                count = int(float(result[0]['value'][1]))
                expected_points = TEST_METRICS_DAYS * 24 + 1
                if count >= expected_points - 5:
                    print(f'   ✓ test_metric_uptrend: {count} точек данных')
                else:
                    print(f'   ⚠ test_metric_uptrend: только {count} точек (ожидалось ~{expected_points})')
                    all_ok = False
            else:
                print('   ⚠ Нет данных для test_metric_uptrend')
                all_ok = False
    except Exception as e:
        print(f'   ❌ Ошибка проверки точек данных: {e}')
        all_ok = False
    
    return all_ok


def main():
    """Основная функция."""
    print()
    print('╔' + '═' * 78 + '╗')
    print('║' + 'ОЧИСТКА И ПЕРЕСОЗДАНИЕ ТЕСТОВЫХ ДАННЫХ'.center(78) + '║')
    print('╚' + '═' * 78 + '╝')
    
    # Получаем токен
    print()
    print('🔑 Получение токена аутентификации...')
    token = get_keycloak_token()
    if not token:
        print()
        print('❌ Не удалось получить токен. Проверьте:')
        print('   1. Keycloak запущен: docker-compose ps keycloak')
        print('   2. Учетные данные верны')
        print('   3. URL доступен: ' + KEYCLOAK_URL)
        sys.exit(1)
    print('✓ Токен получен')
    
    # Шаг 1: Удаление узлов
    if not delete_test_nodes(token):
        print('⚠ Предупреждение: не все узлы были удалены')
    
    # Шаг 2: Удаление метрик
    if not delete_test_metrics():
        print('⚠ Предупреждение: не все метрики были удалены')
    
    # Шаг 3: Генерация данных
    if not generate_test_data():
        print()
        print('❌ Ошибка при генерации данных')
        sys.exit(1)
    
    # Шаг 4: Создание узлов
    if not create_test_nodes(token):
        print()
        print('⚠ Предупреждение: не все узлы были созданы')
    
    # Шаг 5: Загрузка метрик
    if not load_test_metrics():
        print()
        print('❌ Ошибка при загрузке метрик')
        sys.exit(1)
    
    # Шаг 6: Проверка
    all_ok = verify_data(token)
    
    # Итог
    print_section('РЕЗУЛЬТАТ')
    
    if all_ok:
        print('✅ ВСЕ ТЕСТОВЫЕ ДАННЫЕ УСПЕШНО СОЗДАНЫ!')
        print()
        expected_points = TEST_METRICS_DAYS * 24 + 1
        print('Что создано:')
        print('  • 10 тестовых узлов (monitoring objects)')
        print('  • 10 тестовых метрик')
        print(f'  • ~{expected_points * 10} точек данных ({expected_points} час × 10 метрик)')
        print()
        print('Теперь можно:')
        print('  1. Открыть UI: http://localhost:4200/anomaly')
        print('  2. Создать прогноз для test_metric_uptrend + test_node_01')
        print('  3. Просмотреть результаты на графике')
        print()
        print('Проверить данные:')
        print(f'  • Узлы:   curl {API_URL}/api/mon-objects')
        print(f'  • Метрики: curl {VICTORIA_URL}/api/v1/label/__name__/values')
        sys.exit(0)
    else:
        print('⚠ ТЕСТОВЫЕ ДАННЫЕ СОЗДАНЫ С ПРЕДУПРЕЖДЕНИЯМИ')
        print()
        print('Проверьте логи выше для деталей')
        print('Некоторые данные могут быть неполными')
        sys.exit(1)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print()
        print()
        print('❌ Прервано пользователем')
        sys.exit(1)
    except Exception as e:
        print()
        print(f'❌ Неожиданная ошибка: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

