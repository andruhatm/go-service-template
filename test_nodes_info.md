# Тестовые Monitoring Objects

## Список узлов

| № | Имя | Тип | Технология | Платформа | Производитель | Описание |
|---|-----|-----|------------|-----------|---------------|----------|
| 1 | `test_node_01` | eNodeB | 4G | Ericsson | Ericsson | Тестовый узел для метрики с восходящим трендом |
| 2 | `test_node_02` | eNodeB | 4G | Huawei | Huawei | Тестовый узел для метрики с нисходящим трендом |
| 3 | `test_node_03` | gNodeB | 5G | Nokia | Nokia | Тестовый узел для метрики с суточной сезонностью |
| 4 | `test_node_04` | gNodeB | 5G | Samsung | Samsung | Тестовый узел для метрики с недельной сезонностью |
| 5 | `test_node_05` | eNodeB | 4G | ZTE | ZTE | Тестовый узел для метрики со случайным блужданием |
| 6 | `test_node_06` | Server | Core | Dell | Dell | Тестовый узел для метрики с константным значением |
| 7 | `test_node_07` | Router | Network | Cisco | Cisco | Тестовый узел для метрики с аномалиями |
| 8 | `test_node_08` | gNodeB | 5G | Ericsson | Ericsson | Тестовый узел для метрики с трендом и сезонностью |
| 9 | `test_node_09` | eNodeB | 4G | Huawei | Huawei | Тестовый узел для метрики с экспоненциальным ростом |
| 10 | `test_node_10` | Server | Core | HP | HP | Тестовый узел для метрики со ступенчатыми изменениями |

## Соответствие с метриками

| Метрика | Узел | Паттерн |
|---------|------|---------|
| `test_metric_uptrend` | `test_node_01` | 📈 Линейный восходящий тренд |
| `test_metric_downtrend` | `test_node_02` | 📉 Линейный нисходящий тренд |
| `test_metric_daily_season` | `test_node_03` | 🌞 Суточная сезонность |
| `test_metric_weekly_season` | `test_node_04` | 📅 Недельная сезонность |
| `test_metric_random_walk` | `test_node_05` | 🎲 Случайное блуждание |
| `test_metric_constant` | `test_node_06` | ➡️ Константное значение |
| `test_metric_anomalies` | `test_node_07` | ⚠️ С аномалиями |
| `test_metric_trend_season` | `test_node_08` | 🔄 Тренд + сезонность |
| `test_metric_exponential` | `test_node_09` | 🚀 Экспоненциальный рост |
| `test_metric_step_changes` | `test_node_10` | 📊 Ступенчатые изменения |