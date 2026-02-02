#!/bin/bash

echo "========================================="
echo "Полный сброс Keycloak"
echo "========================================="
echo ""

echo "1. Остановка Keycloak..."
docker-compose stop keycloak

echo "2. Остановка Keycloak DB..."
docker-compose stop keycloak-db

echo "3. Удаление контейнеров..."
docker-compose rm -f keycloak keycloak-db

echo "4. Удаление volume с данными Keycloak (сброс настроек)..."
docker volume rm go-service-template_keycloak-db-data 2>/dev/null || echo "Volume уже удален"

echo ""
echo "5. Пересоздание Keycloak с новыми настройками..."
docker-compose up -d keycloak-db
echo "   Ожидание запуска БД (5 секунд)..."
sleep 5

docker-compose up -d keycloak
echo "   Ожидание запуска Keycloak (30 секунд)..."
sleep 30

echo ""
echo "========================================="
echo "✅ Keycloak пересоздан!"
echo "========================================="
echo ""
echo "⚠️  ВАЖНО: Теперь нужно заново настроить realm!"
echo ""
echo "Опция 1 - Автоматическая настройка (рекомендуется):"
echo "  bash setup_keycloak_realm.sh"
echo ""
echo "Опция 2 - Ручная настройка через Web UI:"
echo "  1. Откройте http://localhost:8080"
echo "  2. Войдите как admin/admin"
echo "  3. Создайте realm 'myrealm'"
echo "  4. Настройте клиенты и пользователей"
echo ""


