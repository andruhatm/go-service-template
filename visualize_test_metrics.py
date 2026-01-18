#!/usr/bin/env python3
"""
Скрипт для визуализации тестовых метрик.
Создает графики для всех сгенерированных метрик.
"""

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime
import sys

def load_data(filename='test_metrics_data.csv'):
    """Загружает данные из CSV файла."""
    try:
        df = pd.read_csv(filename)
        df['datetime'] = pd.to_datetime(df['datetime'])
        return df
    except FileNotFoundError:
        print(f"❌ Файл {filename} не найден!")
        print("Сначала запустите: python3 generate_test_metrics.py")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Ошибка при загрузке данных: {e}")
        sys.exit(1)


def plot_all_metrics(df):
    """Создает график со всеми метриками."""
    fig, ax = plt.subplots(figsize=(16, 10))
    
    # Получаем список метрик (все колонки кроме timestamp и datetime)
    metrics = [col for col in df.columns if col not in ['timestamp', 'datetime']]
    
    # Рисуем каждую метрику
    for metric in metrics:
        ax.plot(df['datetime'], df[metric], label=metric, alpha=0.7, linewidth=1.5)
    
    # Настройка графика
    ax.set_xlabel('Время', fontsize=12)
    ax.set_ylabel('Значение', fontsize=12)
    ax.set_title('Все тестовые метрики за месяц', fontsize=14, fontweight='bold')
    ax.legend(loc='upper left', fontsize=9)
    ax.grid(True, alpha=0.3)
    
    # Форматирование оси X
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%d-%m'))
    ax.xaxis.set_major_locator(mdates.DayLocator(interval=3))
    plt.xticks(rotation=45)
    
    plt.tight_layout()
    filename = 'test_metrics_all.png'
    plt.savefig(filename, dpi=150)
    print(f"✓ Сохранен график: {filename}")
    plt.close()


def plot_individual_metrics(df):
    """Создает отдельные графики для каждой метрики."""
    metrics = [col for col in df.columns if col not in ['timestamp', 'datetime']]
    
    # Описания метрик
    descriptions = {
        'test_metric_uptrend': 'Линейный восходящий тренд',
        'test_metric_downtrend': 'Линейный нисходящий тренд',
        'test_metric_daily_season': 'Суточная сезонность',
        'test_metric_weekly_season': 'Недельная сезонность',
        'test_metric_random_walk': 'Случайное блуждание',
        'test_metric_constant': 'Константное значение',
        'test_metric_anomalies': 'Паттерн с аномалиями',
        'test_metric_trend_season': 'Тренд + сезонность',
        'test_metric_exponential': 'Экспоненциальный рост',
        'test_metric_step_changes': 'Ступенчатые изменения'
    }
    
    # Создаем subplot для каждой метрики
    fig, axes = plt.subplots(5, 2, figsize=(18, 20))
    axes = axes.flatten()
    
    for idx, metric in enumerate(metrics):
        ax = axes[idx]
        ax.plot(df['datetime'], df[metric], linewidth=1.5, color='#2E86AB')
        
        # Статистика
        mean_val = df[metric].mean()
        ax.axhline(y=mean_val, color='red', linestyle='--', alpha=0.5, label=f'Среднее: {mean_val:.1f}')
        
        # Настройка графика
        title = descriptions.get(metric, metric)
        ax.set_title(f'{metric}\n({title})', fontsize=10, fontweight='bold')
        ax.set_xlabel('Время', fontsize=9)
        ax.set_ylabel('Значение', fontsize=9)
        ax.legend(fontsize=8)
        ax.grid(True, alpha=0.3)
        
        # Форматирование оси X
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%d-%m'))
        ax.xaxis.set_major_locator(mdates.DayLocator(interval=5))
        plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right', fontsize=8)
    
    plt.tight_layout()
    filename = 'test_metrics_individual.png'
    plt.savefig(filename, dpi=150)
    print(f"✓ Сохранен график: {filename}")
    plt.close()


def plot_patterns_comparison(df):
    """Создает график для сравнения паттернов по категориям."""
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    
    # 1. Тренды
    ax1 = axes[0, 0]
    ax1.plot(df['datetime'], df['test_metric_uptrend'], label='Восходящий', linewidth=2)
    ax1.plot(df['datetime'], df['test_metric_downtrend'], label='Нисходящий', linewidth=2)
    ax1.plot(df['datetime'], df['test_metric_exponential'], label='Экспоненциальный', linewidth=2)
    ax1.set_title('Паттерны трендов', fontsize=12, fontweight='bold')
    ax1.set_xlabel('Время')
    ax1.set_ylabel('Значение')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    ax1.xaxis.set_major_formatter(mdates.DateFormatter('%d-%m'))
    
    # 2. Сезонность
    ax2 = axes[0, 1]
    # Показываем только первые 7 дней для наглядности
    mask = df['datetime'] <= df['datetime'].iloc[0] + pd.Timedelta(days=7)
    ax2.plot(df[mask]['datetime'], df[mask]['test_metric_daily_season'], label='Суточная', linewidth=2)
    ax2.plot(df[mask]['datetime'], df[mask]['test_metric_weekly_season'], label='Недельная', linewidth=2)
    ax2.set_title('Паттерны сезонности (первые 7 дней)', fontsize=12, fontweight='bold')
    ax2.set_xlabel('Время')
    ax2.set_ylabel('Значение')
    ax2.legend()
    ax2.grid(True, alpha=0.3)
    ax2.xaxis.set_major_formatter(mdates.DateFormatter('%d-%m %H:%M'))
    plt.setp(ax2.xaxis.get_majorticklabels(), rotation=45, ha='right')
    
    # 3. Стабильность
    ax3 = axes[1, 0]
    ax3.plot(df['datetime'], df['test_metric_constant'], label='Константа', linewidth=2)
    ax3.plot(df['datetime'], df['test_metric_random_walk'], label='Случайное блуждание', linewidth=2)
    ax3.plot(df['datetime'], df['test_metric_step_changes'], label='Ступенчатые изменения', linewidth=2)
    ax3.set_title('Паттерны стабильности/изменчивости', fontsize=12, fontweight='bold')
    ax3.set_xlabel('Время')
    ax3.set_ylabel('Значение')
    ax3.legend()
    ax3.grid(True, alpha=0.3)
    ax3.xaxis.set_major_formatter(mdates.DateFormatter('%d-%m'))
    
    # 4. Комбинированные
    ax4 = axes[1, 1]
    ax4.plot(df['datetime'], df['test_metric_trend_season'], label='Тренд + Сезонность', linewidth=2)
    ax4.plot(df['datetime'], df['test_metric_anomalies'], label='С аномалиями', linewidth=2)
    ax4.set_title('Комбинированные паттерны', fontsize=12, fontweight='bold')
    ax4.set_xlabel('Время')
    ax4.set_ylabel('Значение')
    ax4.legend()
    ax4.grid(True, alpha=0.3)
    ax4.xaxis.set_major_formatter(mdates.DateFormatter('%d-%m'))
    
    plt.tight_layout()
    filename = 'test_metrics_patterns.png'
    plt.savefig(filename, dpi=150)
    print(f"✓ Сохранен график: {filename}")
    plt.close()


def print_statistics(df):
    """Выводит статистику по всем метрикам."""
    metrics = [col for col in df.columns if col not in ['timestamp', 'datetime']]
    
    print("\n" + "=" * 80)
    print("СТАТИСТИКА ПО МЕТРИКАМ")
    print("=" * 80)
    print(f"{'Метрика':<35} {'Мин':>10} {'Макс':>10} {'Средн':>10} {'СтдОткл':>10}")
    print("-" * 80)
    
    for metric in metrics:
        min_val = df[metric].min()
        max_val = df[metric].max()
        mean_val = df[metric].mean()
        std_val = df[metric].std()
        print(f"{metric:<35} {min_val:>10.2f} {max_val:>10.2f} {mean_val:>10.2f} {std_val:>10.2f}")
    
    print("=" * 80 + "\n")


def main():
    """Основная функция."""
    print("=" * 80)
    print("ВИЗУАЛИЗАЦИЯ ТЕСТОВЫХ МЕТРИК")
    print("=" * 80)
    print()
    
    # Загружаем данные
    print("Загрузка данных...")
    df = load_data()
    print(f"✓ Загружено {len(df)} строк данных")
    print()
    
    # Выводим статистику
    print_statistics(df)
    
    # Создаем графики
    print("Создание графиков...")
    print()
    
    print("1. Создание общего графика...")
    plot_all_metrics(df)
    
    print("2. Создание индивидуальных графиков...")
    plot_individual_metrics(df)
    
    print("3. Создание сравнительных графиков...")
    plot_patterns_comparison(df)
    
    print()
    print("=" * 80)
    print("ВИЗУАЛИЗАЦИЯ ЗАВЕРШЕНА")
    print("=" * 80)
    print()
    print("Созданные файлы:")
    print("  1. test_metrics_all.png - все метрики на одном графике")
    print("  2. test_metrics_individual.png - отдельные графики для каждой метрики")
    print("  3. test_metrics_patterns.png - сравнение паттернов по категориям")
    print()


if __name__ == '__main__':
    try:
        import matplotlib
        main()
    except ImportError:
        print("❌ Требуется библиотека matplotlib!")
        print("Установите: pip install matplotlib pandas")
        sys.exit(1)

