# Test Data Refresh (6 Months)

This guide documents how to очистить тестовые данные и пересоздать тестовые
узлы, каталог метрик и временные ряды в VictoriaMetrics за последние 6 месяцев.

## Preconditions

- Services are running:
  - Keycloak: `http://localhost:8080`
  - Go API: `http://localhost:8081`
  - VictoriaMetrics: `http://localhost:8428`
- You are in repo root: `/Users/andrewgerasimov/GolandProjects/go-service-template`

Check:

```bash
docker-compose ps
```

## Environment

```bash
export API_URL=http://localhost:8081
export KEYCLOAK_URL=http://localhost:8080
export KEYCLOAK_REALM=myrealm
export KEYCLOAK_CLIENT=spa-client
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD=admin
export TEST_METRICS_DAYS=180
```

## 1) Delete all VictoriaMetrics series

This removes all series from VictoriaMetrics (not only test series):

```bash
curl -s -X POST -d 'match[]={__name__!=""}' \
  http://localhost:8428/api/v1/admin/tsdb/delete_series
```

## 2) Refresh test nodes in DB

Because `mon_objects` has no unique constraint for `ON CONFLICT`, use the
simple SQL script:

```bash
docker-compose exec -T db psql -U user -d appdb < insert_test_nodes_simple.sql
```

## 3) Refresh metrics catalog in DB

```bash
docker-compose exec -T db psql -U user -d appdb < insert_test_metrics_catalog.sql
```

## 4) Generate metrics for last 6 months

```bash
export TEST_METRICS_DAYS=180
python3 generate_test_metrics.py
```

This writes:

- `test_metrics_prometheus.txt`
- `test_metrics_data.csv`
- `test_metrics_summary.txt`

## 5) Load metrics into VictoriaMetrics

```bash
./load_test_metrics.sh
```

Note: on macOS, the script may print a `date: illegal option -- d` warning.
The upload still succeeds because it does not block the request.

## 6) Verify

```bash
# test nodes in DB
docker-compose exec -T db psql -U user -d appdb \
  -c "SELECT COUNT(*) FROM mon_objects WHERE name LIKE 'test_node_%';"

# metrics catalog
docker-compose exec -T db psql -U user -d appdb \
  -c "SELECT COUNT(*) FROM metrics_configuration WHERE name LIKE 'test_metric_%';"

# VictoriaMetrics series names
curl -s 'http://localhost:8428/api/v1/label/__name__/values' | grep test_metric

# sample series points count (~4321 for 180 days hourly)
curl -s 'http://localhost:8428/api/v1/query?query=count(test_metric_uptrend{name="test_node_01"})'
```

## One-shot (all steps)

```bash
export API_URL=http://localhost:8081
export KEYCLOAK_URL=http://localhost:8080
export KEYCLOAK_REALM=myrealm
export KEYCLOAK_CLIENT=spa-client
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD=admin
export TEST_METRICS_DAYS=180

curl -s -X POST -d 'match[]={__name__!=""}' \
  http://localhost:8428/api/v1/admin/tsdb/delete_series

docker-compose exec -T db psql -U user -d appdb < insert_test_nodes_simple.sql
docker-compose exec -T db psql -U user -d appdb < insert_test_metrics_catalog.sql

python3 generate_test_metrics.py
./load_test_metrics.sh
```

