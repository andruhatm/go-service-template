#!/usr/bin/env python3
"""
Упрощенный скрипт для автоматической загрузки тестовых узлов.
Получает токен от Keycloak и создает узлы через API.
"""

import json
import sys
import os
from urllib import request, parse
from urllib.error import HTTPError, URLError

# Конфигурация
API_URL = os.getenv('API_URL', 'http://localhost:8080')
KEYCLOAK_URL = os.getenv('KEYCLOAK_URL', 'http://localhost:8180')
KEYCLOAK_REALM = os.getenv('KEYCLOAK_REALM', 'monitoring')
KEYCLOAK_CLIENT = os.getenv('KEYCLOAK_CLIENT', 'monitoring-client')

# Учетные данные администратора
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')


def get_keycloak_token() -> str:
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
    except HTTPError as e:
        print(f'❌ Ошибка при получении токена: HTTP {e.code}')
        print(f'   {e.read().decode("utf-8")}')
        return None
    except URLError as e:
        print(f'❌ Ошибка подключения к Keycloak: {e.reason}')
        print(f'   URL: {token_url}')
        return None
    except Exception as e:
        print(f'❌ Неожиданная ошибка при получении токена: {e}')
        return None


def load_nodes_from_file() -> list:
    """Загружает узлы из JSON файла."""
    try:
        with open('test_nodes.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print('❌ Файл test_nodes.json не найден!')
        print('   Сначала запустите: python3 generate_test_nodes.py')
        return None
    except json.JSONDecodeError as e:
        print(f'❌ Ошибка при чтении JSON: {e}')
        return None


def create_node(node_data: dict, token: str) -> tuple:
    """Создает узел через API."""
    url = f'{API_URL}/api/mon-objects'
    
    data = json.dumps(node_data).encode('utf-8')
    
    try:
        req = request.Request(url, data=data, method='POST')
        req.add_header('Content-Type', 'application/json')
        req.add_header('Authorization', f'Bearer {token}')
        
        with request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return (response.code, result)
    except HTTPError as e:
        error_body = e.read().decode('utf-8')
        return (e.code, error_body)
    except URLError as e:
        return (0, str(e.reason))
    except Exception as e:
        return (0, str(e))


def main():
    """Основная функция."""
    print('=' * 80)
    print('АВТОМАТИЧЕСКАЯ ЗАГРУЗКА ТЕСТОВЫХ MONITORING OBJECTS')
    print('=' * 80)
    print()
    
    # Загружаем узлы из файла
    print('📂 Загрузка данных из test_nodes.json...')
    nodes = load_nodes_from_file()
    if nodes is None:
        sys.exit(1)
    print(f'✓ Загружено {len(nodes)} узлов')
    print()
    
    # Получаем токен
    print('🔑 Получение токена от Keycloak...')
    print(f'   URL: {KEYCLOAK_URL}')
    print(f'   Realm: {KEYCLOAK_REALM}')
    print(f'   User: {ADMIN_USERNAME}')
    
    token = get_keycloak_token()
    if token is None:
        print()
        print('💡 Совет: Убедитесь, что:')
        print('   1. Keycloak запущен: docker-compose up -d keycloak')
        print('   2. Realm "monitoring" существует')
        print('   3. Учетные данные администратора верны')
        print()
        print('Или установите переменные окружения:')
        print('   export KEYCLOAK_URL=http://localhost:8180')
        print('   export ADMIN_USERNAME=admin')
        print('   export ADMIN_PASSWORD=your_password')
        sys.exit(1)
    
    print('✓ Токен получен успешно')
    print()
    
    # Создаем узлы
    print('📤 Создание узлов через API...')
    print(f'   URL: {API_URL}/api/mon-objects')
    print()
    
    success_count = 0
    already_exists_count = 0
    failed_count = 0
    
    for i, node in enumerate(nodes, 1):
        node_name = node['name']
        print(f'{i}. Создание {node_name}...', end=' ')
        
        code, result = create_node(node, token)
        
        if code in (200, 201):
            print('✓ Создан')
            success_count += 1
        elif code == 409:
            print('⚠ Уже существует')
            already_exists_count += 1
        else:
            print(f'❌ Ошибка (HTTP {code})')
            if isinstance(result, str):
                print(f'   {result}')
            failed_count += 1
    
    print()
    print('=' * 80)
    print('РЕЗУЛЬТАТ')
    print('=' * 80)
    print(f'Создано новых:       {success_count}')
    print(f'Уже существовало:    {already_exists_count}')
    print(f'Ошибки:              {failed_count}')
    print(f'Всего обработано:    {len(nodes)}')
    print()
    
    if failed_count == 0:
        print('✓ Все тестовые узлы готовы!')
        print()
        print('Проверить список узлов:')
        print(f'  curl \'{API_URL}/api/mon-objects\'')
        print()
        print('Теперь можно:')
        print('  1. Загрузить метрики: ./load_test_metrics.sh')
        print('  2. Создавать прогнозы в UI: http://localhost:4200/anomaly')
        sys.exit(0)
    else:
        print('⚠ Некоторые узлы не были созданы')
        print('Проверьте логи Go API: docker-compose logs go-api')
        sys.exit(1)


if __name__ == '__main__':
    main()


