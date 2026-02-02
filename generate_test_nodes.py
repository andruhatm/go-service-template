#!/usr/bin/env python3
"""
Скрипт для генерации тестовых monitoring objects (узлов/нодов).
Создает 10 тестовых узлов, соответствующих метрикам test_metric_*.
"""

import json
import sys
from typing import List, Dict, Any, Optional

# Конфигурация
TEST_NODES = [
    {
        'name': 'test_node_01',
        'type': 'eNodeB',
        'technology': '4G',
        'platform': 'Ericsson',
        'network': 'Test Network',
        'manufacturer': 'Ericsson',
        'description': 'Тестовый узел для метрики с восходящим трендом'
    },
    {
        'name': 'test_node_02',
        'type': 'eNodeB',
        'technology': '4G',
        'platform': 'Huawei',
        'network': 'Test Network',
        'manufacturer': 'Huawei',
        'description': 'Тестовый узел для метрики с нисходящим трендом'
    },
    {
        'name': 'test_node_03',
        'type': 'gNodeB',
        'technology': '5G',
        'platform': 'Nokia',
        'network': 'Test Network',
        'manufacturer': 'Nokia',
        'description': 'Тестовый узел для метрики с суточной сезонностью'
    },
    {
        'name': 'test_node_04',
        'type': 'gNodeB',
        'technology': '5G',
        'platform': 'Samsung',
        'network': 'Test Network',
        'manufacturer': 'Samsung',
        'description': 'Тестовый узел для метрики с недельной сезонностью'
    },
    {
        'name': 'test_node_05',
        'type': 'eNodeB',
        'technology': '4G',
        'platform': 'ZTE',
        'network': 'Test Network',
        'manufacturer': 'ZTE',
        'description': 'Тестовый узел для метрики со случайным блужданием'
    },
    {
        'name': 'test_node_06',
        'type': 'Server',
        'technology': 'Core',
        'platform': 'Dell',
        'network': 'Test Network',
        'manufacturer': 'Dell',
        'description': 'Тестовый узел для метрики с константным значением'
    },
    {
        'name': 'test_node_07',
        'type': 'Router',
        'technology': 'Network',
        'platform': 'Cisco',
        'network': 'Test Network',
        'manufacturer': 'Cisco',
        'description': 'Тестовый узел для метрики с аномалиями'
    },
    {
        'name': 'test_node_08',
        'type': 'gNodeB',
        'technology': '5G',
        'platform': 'Ericsson',
        'network': 'Test Network',
        'manufacturer': 'Ericsson',
        'description': 'Тестовый узел для метрики с трендом и сезонностью'
    },
    {
        'name': 'test_node_09',
        'type': 'eNodeB',
        'technology': '4G',
        'platform': 'Huawei',
        'network': 'Test Network',
        'manufacturer': 'Huawei',
        'description': 'Тестовый узел для метрики с экспоненциальным ростом'
    },
    {
        'name': 'test_node_10',
        'type': 'Server',
        'technology': 'Core',
        'platform': 'HP',
        'network': 'Test Network',
        'manufacturer': 'HP',
        'description': 'Тестовый узел для метрики со ступенчатыми изменениями'
    }
]


def generate_node_json(node: Dict[str, str]) -> Dict[str, Any]:
    """Генерирует JSON для создания узла через API."""
    return {
        'name': node['name'],
        'type': node['type'],
        'technology': node['technology'],
        'platform': node['platform'],
        'network': node['network'],
        'manufacturer': node['manufacturer']
    }


def generate_json_file() -> str:
    """Генерирует JSON файл со всеми узлами."""
    nodes_data = []
    
    for node in TEST_NODES:
        node_json = generate_node_json(node)
        nodes_data.append(node_json)
    
    return json.dumps(nodes_data, indent=2, ensure_ascii=False)


def generate_curl_script() -> str:
    """Генерирует bash скрипт с curl командами."""
    lines = []
    
    lines.append('#!/bin/bash')
    lines.append('# Скрипт для создания тестовых monitoring objects через API')
    lines.append('# Требуется токен аутентификации с ролью ADMIN')
    lines.append('')
    lines.append('set -e')
    lines.append('')
    lines.append('# Конфигурация')
    lines.append('API_URL="${API_URL:-http://localhost:8080}"')
    lines.append('TOKEN="${KEYCLOAK_TOKEN}"')
    lines.append('')
    lines.append('if [ -z "$TOKEN" ]; then')
    lines.append('    echo "❌ Ошибка: Не установлена переменная KEYCLOAK_TOKEN"')
    lines.append('    echo "Получите токен через Keycloak и установите: export KEYCLOAK_TOKEN=your_token"')
    lines.append('    echo ""')
    lines.append('    echo "Или используйте test_mon_objects_api.sh для создания узлов"')
    lines.append('    exit 1')
    lines.append('fi')
    lines.append('')
    lines.append('echo "=========================================="')
    lines.append('echo "Создание тестовых monitoring objects"')
    lines.append('echo "=========================================="')
    lines.append('echo')
    lines.append('')
    lines.append('# Счетчик успешных созданий')
    lines.append('SUCCESS_COUNT=0')
    lines.append('TOTAL_COUNT=' + str(len(TEST_NODES)))
    lines.append('')
    
    for i, node in enumerate(TEST_NODES, 1):
        node_json = generate_node_json(node)
        json_str = json.dumps(node_json, ensure_ascii=False)
        
        lines.append(f'# {i}. Создание {node["name"]} ({node["description"]})')
        lines.append(f'echo "{i}. Создание {node["name"]}..."')
        lines.append(f"RESPONSE=$(curl -s -X POST \"${{API_URL}}/api/mon-objects\" \\")
        lines.append(f'  -H "Authorization: Bearer $TOKEN" \\')
        lines.append(f'  -H "Content-Type: application/json" \\')
        lines.append(f"  -d '{json_str}' \\")
        lines.append(f'  -w "\\n%{{http_code}}")')
        lines.append('')
        lines.append('HTTP_CODE=$(echo "$RESPONSE" | tail -n1)')
        lines.append('BODY=$(echo "$RESPONSE" | sed \'$d\')')
        lines.append('')
        lines.append('if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then')
        lines.append(f'    echo "✓ {node["name"]} создан успешно"')
        lines.append('    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))')
        lines.append('elif [ "$HTTP_CODE" = "409" ]; then')
        lines.append(f'    echo "⚠ {node["name"]} уже существует"')
        lines.append('    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))')
        lines.append('else')
        lines.append(f'    echo "❌ Ошибка при создании {node["name"]}: HTTP $HTTP_CODE"')
        lines.append('    echo "$BODY"')
        lines.append('fi')
        lines.append('echo')
        lines.append('')
    
    lines.append('echo "=========================================="')
    lines.append('echo "РЕЗУЛЬТАТ"')
    lines.append('echo "=========================================="')
    lines.append('echo "Успешно создано/существует: $SUCCESS_COUNT из $TOTAL_COUNT"')
    lines.append('echo')
    lines.append('')
    lines.append('if [ $SUCCESS_COUNT -eq $TOTAL_COUNT ]; then')
    lines.append('    echo "✓ Все тестовые узлы готовы!"')
    lines.append('    echo ""')
    lines.append('    echo "Проверить список узлов:"')
    lines.append('    echo "  curl \'${API_URL}/api/mon-objects\'"')
    lines.append('    exit 0')
    lines.append('else')
    lines.append('    echo "⚠ Некоторые узлы не были созданы"')
    lines.append('    exit 1')
    lines.append('fi')
    
    return '\n'.join(lines)


def generate_summary() -> str:
    """Генерирует сводную информацию."""
    lines = []
    
    lines.append('=' * 80)
    lines.append('СВОДКА ПО ТЕСТОВЫМ MONITORING OBJECTS')
    lines.append('=' * 80)
    lines.append(f'Количество узлов: {len(TEST_NODES)}')
    lines.append('')
    lines.append('УЗЛЫ:')
    lines.append('-' * 80)
    
    for i, node in enumerate(TEST_NODES, 1):
        lines.append(f'{i}. {node["name"]}')
        lines.append(f'   Тип: {node["type"]}')
        lines.append(f'   Технология: {node["technology"]}')
        lines.append(f'   Платформа: {node["platform"]}')
        lines.append(f'   Производитель: {node["manufacturer"]}')
        lines.append(f'   Описание: {node["description"]}')
        lines.append('')
    
    lines.append('=' * 80)
    lines.append('')
    lines.append('СООТВЕТСТВИЕ С МЕТРИКАМИ:')
    lines.append('-' * 80)
    
    metrics = [
        ('test_metric_uptrend', 'test_node_01', 'Линейный восходящий тренд'),
        ('test_metric_downtrend', 'test_node_02', 'Линейный нисходящий тренд'),
        ('test_metric_daily_season', 'test_node_03', 'Суточная сезонность'),
        ('test_metric_weekly_season', 'test_node_04', 'Недельная сезонность'),
        ('test_metric_random_walk', 'test_node_05', 'Случайное блуждание'),
        ('test_metric_constant', 'test_node_06', 'Константное значение'),
        ('test_metric_anomalies', 'test_node_07', 'С аномалиями'),
        ('test_metric_trend_season', 'test_node_08', 'Тренд + сезонность'),
        ('test_metric_exponential', 'test_node_09', 'Экспоненциальный рост'),
        ('test_metric_step_changes', 'test_node_10', 'Ступенчатые изменения')
    ]
    
    for metric, node, description in metrics:
        lines.append(f'{metric:30} → {node:15} ({description})')
    
    lines.append('=' * 80)
    
    return '\n'.join(lines)


def generate_markdown_table() -> str:
    """Генерирует markdown таблицу с узлами."""
    lines = []
    
    lines.append('# Тестовые Monitoring Objects')
    lines.append('')
    lines.append('## Список узлов')
    lines.append('')
    lines.append('| № | Имя | Тип | Технология | Платформа | Производитель | Описание |')
    lines.append('|---|-----|-----|------------|-----------|---------------|----------|')
    
    for i, node in enumerate(TEST_NODES, 1):
        lines.append(f"| {i} | `{node['name']}` | {node['type']} | {node['technology']} | "
                    f"{node['platform']} | {node['manufacturer']} | {node['description']} |")
    
    lines.append('')
    lines.append('## Соответствие с метриками')
    lines.append('')
    lines.append('| Метрика | Узел | Паттерн |')
    lines.append('|---------|------|---------|')
    
    metrics = [
        ('test_metric_uptrend', 'test_node_01', '📈 Линейный восходящий тренд'),
        ('test_metric_downtrend', 'test_node_02', '📉 Линейный нисходящий тренд'),
        ('test_metric_daily_season', 'test_node_03', '🌞 Суточная сезонность'),
        ('test_metric_weekly_season', 'test_node_04', '📅 Недельная сезонность'),
        ('test_metric_random_walk', 'test_node_05', '🎲 Случайное блуждание'),
        ('test_metric_constant', 'test_node_06', '➡️ Константное значение'),
        ('test_metric_anomalies', 'test_node_07', '⚠️ С аномалиями'),
        ('test_metric_trend_season', 'test_node_08', '🔄 Тренд + сезонность'),
        ('test_metric_exponential', 'test_node_09', '🚀 Экспоненциальный рост'),
        ('test_metric_step_changes', 'test_node_10', '📊 Ступенчатые изменения')
    ]
    
    for metric, node, description in metrics:
        lines.append(f'| `{metric}` | `{node}` | {description} |')
    
    return '\n'.join(lines)


def main():
    """Основная функция."""
    print('Генерация тестовых monitoring objects...')
    print(f'Количество узлов: {len(TEST_NODES)}')
    print()
    
    # Генерируем JSON файл
    print('Создание JSON файла...')
    json_data = generate_json_file()
    with open('test_nodes.json', 'w', encoding='utf-8') as f:
        f.write(json_data)
    print(f'✓ Создан файл: test_nodes.json ({len(json_data)} байт)')
    
    # Генерируем curl скрипт
    print('Создание bash скрипта...')
    script_data = generate_curl_script()
    with open('load_test_nodes.sh', 'w', encoding='utf-8') as f:
        f.write(script_data)
    print(f'✓ Создан файл: load_test_nodes.sh ({len(script_data)} байт)')
    
    # Генерируем сводку
    print('Создание сводки...')
    summary = generate_summary()
    with open('test_nodes_summary.txt', 'w', encoding='utf-8') as f:
        f.write(summary)
    print(f'✓ Создан файл: test_nodes_summary.txt')
    
    # Генерируем markdown документацию
    print('Создание документации...')
    markdown = generate_markdown_table()
    with open('test_nodes_info.md', 'w', encoding='utf-8') as f:
        f.write(markdown)
    print(f'✓ Создан файл: test_nodes_info.md')
    
    print()
    print('=' * 80)
    print(summary)
    print('=' * 80)
    print()
    print('ГОТОВО! Файлы созданы:')
    print('  1. test_nodes.json - данные в формате JSON')
    print('  2. load_test_nodes.sh - скрипт для загрузки через API')
    print('  3. test_nodes_summary.txt - сводная информация')
    print('  4. test_nodes_info.md - документация в Markdown')
    print()
    print('Для создания узлов выполните:')
    print('  chmod +x load_test_nodes.sh')
    print('  export KEYCLOAK_TOKEN=your_admin_token')
    print('  ./load_test_nodes.sh')
    print()
    print('Или используйте существующий скрипт:')
    print('  ./test_mon_objects_api.sh  # (если доступен)')


if __name__ == '__main__':
    main()


