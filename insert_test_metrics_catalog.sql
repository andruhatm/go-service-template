-- SQL скрипт для добавления тестовых метрик в каталог метрик (metrics_configuration)
-- Это необходимо для отображения метрик в UI

-- Очистка старых тестовых метрик из каталога
DELETE FROM metrics_configuration WHERE name LIKE 'test_metric_%';

-- Вставка 10 тестовых метрик
INSERT INTO metrics_configuration (id, name, unit, degradation, "group", description_ru, threshold_critical, created_at, updated_at)
VALUES
  -- 1. Линейный восходящий тренд
  (
    gen_random_uuid(),
    'test_metric_uptrend',
    'единиц',
    'decrease',
    'Test Metrics',
    'Тестовая метрика с линейным восходящим трендом. Используется для проверки прогнозирования растущих показателей.',
    NULL,
    NOW(),
    NOW()
  ),
  
  -- 2. Линейный нисходящий тренд
  (
    gen_random_uuid(),
    'test_metric_downtrend',
    'единиц',
    'increase',
    'Test Metrics',
    'Тестовая метрика с линейным нисходящим трендом. Используется для проверки прогнозирования снижающихся показателей.',
    NULL,
    NOW(),
    NOW()
  ),
  
  -- 3. Суточная сезонность
  (
    gen_random_uuid(),
    'test_metric_daily_season',
    'единиц',
    'decrease',
    'Test Metrics',
    'Тестовая метрика с суточной сезонностью. Пик активности днем, минимум ночью. Для проверки прогнозирования циклических паттернов.',
    NULL,
    NOW(),
    NOW()
  ),
  
  -- 4. Недельная сезонность
  (
    gen_random_uuid(),
    'test_metric_weekly_season',
    'единиц',
    'decrease',
    'Test Metrics',
    'Тестовая метрика с недельной сезонностью. Выше в будни, ниже в выходные. Для проверки недельных циклов.',
    NULL,
    NOW(),
    NOW()
  ),
  
  -- 5. Случайное блуждание
  (
    gen_random_uuid(),
    'test_metric_random_walk',
    'единиц',
    'both',
    'Test Metrics',
    'Тестовая метрика со случайным блужданием. Непредсказуемые изменения. Для проверки устойчивости модели.',
    NULL,
    NOW(),
    NOW()
  ),
  
  -- 6. Константное значение
  (
    gen_random_uuid(),
    'test_metric_constant',
    'единиц',
    'both',
    'Test Metrics',
    'Тестовая метрика с константным значением. Стабильные показатели с минимальным шумом. Для проверки базовой функциональности.',
    '{"operator": ">", "value": 105}',
    NOW(),
    NOW()
  ),
  
  -- 7. С аномалиями
  (
    gen_random_uuid(),
    'test_metric_anomalies',
    'единиц',
    'both',
    'Test Metrics',
    'Тестовая метрика с редкими аномалиями (5% выбросов). Для проверки обработки аномальных значений.',
    NULL,
    NOW(),
    NOW()
  ),
  
  -- 8. Тренд + сезонность
  (
    gen_random_uuid(),
    'test_metric_trend_season',
    'единиц',
    'decrease',
    'Test Metrics',
    'Тестовая метрика с комбинацией восходящего тренда и суточной сезонности. Реалистичный сценарий для комплексного прогнозирования.',
    NULL,
    NOW(),
    NOW()
  ),
  
  -- 9. Экспоненциальный рост
  (
    gen_random_uuid(),
    'test_metric_exponential',
    'единиц',
    'decrease',
    'Test Metrics',
    'Тестовая метрика с экспоненциальным ростом. Быстро растущие показатели. Для проверки на нелинейных трендах.',
    NULL,
    NOW(),
    NOW()
  ),
  
  -- 10. Ступенчатые изменения
  (
    gen_random_uuid(),
    'test_metric_step_changes',
    'единиц',
    'both',
    'Test Metrics',
    'Тестовая метрика со ступенчатыми изменениями каждые 5 дней. Имитация релизов или обновлений системы.',
    NULL,
    NOW(),
    NOW()
  );

-- Проверка результатов
SELECT 
  name,
  unit,
  "group",
  LEFT(description_ru, 50) || '...' as description
FROM metrics_configuration 
WHERE name LIKE 'test_metric_%' 
ORDER BY name;

-- Вывод количества
SELECT COUNT(*) as "Создано метрик в каталоге" 
FROM metrics_configuration 
WHERE name LIKE 'test_metric_%';

