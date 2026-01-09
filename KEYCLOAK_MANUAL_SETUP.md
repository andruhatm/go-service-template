# Ручная настройка Keycloak (ПОШАГОВО)

## ⚠️ ВАЖНО: Выполняйте ВСЕ шаги по порядку!

---

## Шаг 1: Откройте Keycloak Web UI

1. Откройте браузер
2. Перейдите на: **http://localhost:8080**
3. Нажмите **Administration Console**
4. Войдите:
   - Username: `admin`
   - Password: `admin`

---

## Шаг 2: Отключите SSL для Master Realm

**⚠️ КРИТИЧЕСКИ ВАЖНО - БЕЗ ЭТОГО НИЧЕГО НЕ ЗАРАБОТАЕТ!**

1. В левом верхнем углу убедитесь что выбран **master** realm
2. В меню слева нажмите **Realm settings**
3. Перейдите на вкладку **Login**
4. Прокрутите вниз до **Require SSL**
5. Выберите: **none** (вместо external/all)
6. Нажмите кнопку **Save** внизу страницы
7. ✅ Вы должны увидеть сообщение "Success!"

---

## Шаг 3: Создайте Realm 'myrealm'

1. В левом верхнем углу нажмите на dropdown (где написано **master**)
2. Нажмите **Create Realm**
3. Заполните:
   - **Realm name**: `myrealm`
   - **Enabled**: ON (галочка)
4. Нажмите **Create**

---

## Шаг 4: Отключите SSL для myrealm

**⚠️ КРИТИЧЕСКИ ВАЖНО!**

1. Убедитесь что в левом верхнем углу выбран **myrealm** (не master!)
2. В меню слева нажмите **Realm settings**
3. Перейдите на вкладку **Login**
4. Прокрутите вниз до **Require SSL**
5. Выберите: **none**
6. Нажмите **Save**
7. ✅ Вы должны увидеть сообщение "Success!"

---

## Шаг 5: Создайте Client 'spa-client'

1. Убедитесь что выбран **myrealm**
2. В меню слева нажмите **Clients**
3. Нажмите **Create client**
4. На странице "General Settings":
   - **Client type**: OpenID Connect
   - **Client ID**: `spa-client`
5. Нажмите **Next**
6. На странице "Capability config":
   - **Client authentication**: OFF
   - **Authorization**: OFF
   - **Standard flow**: ON ✅
   - **Direct access grants**: ON ✅
   - **Implicit flow**: OFF
   - **Service accounts roles**: OFF
   - **OAuth 2.0 Device Authorization Grant**: OFF
7. Нажмите **Next**
8. На странице "Login settings":
   - **Root URL**: `http://localhost`
   - **Valid redirect URIs**: 
     - `http://localhost/*`
     - `http://localhost:80/*`
     - `http://localhost:4200/*`
   - **Web origins**: `*`
9. Нажмите **Save**

---

## Шаг 6: Создайте Client 'admin-service'

1. Убедитесь что выбран **myrealm**
2. В меню слева нажмите **Clients**
3. Нажмите **Create client**
4. На странице "General Settings":
   - **Client ID**: `admin-service`
5. Нажмите **Next**
6. На странице "Capability config":
   - **Client authentication**: ON ✅ (ВАЖНО!)
   - **Authorization**: OFF
   - **Standard flow**: OFF
   - **Direct access grants**: ON ✅
   - **Service accounts roles**: ON ✅
7. Нажмите **Save**
8. Перейдите на вкладку **Credentials**
9. Скопируйте **Client secret** и замените его на:
   ```
   wqswKbViD5FwRJTiOnhyQCTT3jjjbaNU
   ```
10. Нажмите **Save** (если есть кнопка)

---

## Шаг 7: Создайте Роли

1. Убедитесь что выбран **myrealm**
2. В меню слева нажмите **Realm roles**
3. Нажмите **Create role**
4. Создайте роль `ROLE_ADMIN`:
   - **Role name**: `ROLE_ADMIN`
   - Нажмите **Save**
5. Повторите для `ROLE_OPERATOR`:
   - **Role name**: `ROLE_OPERATOR`
   - Нажмите **Save**
6. Повторите для `ROLE_MONITOR`:
   - **Role name**: `ROLE_MONITOR`
   - Нажмите **Save**

---

## Шаг 8: Создайте тестового пользователя

1. Убедитесь что выбран **myrealm**
2. В меню слева нажмите **Users**
3. Нажмите **Create new user**
4. Заполните:
   - **Username**: `testuser`
   - **Email**: `test@example.com`
   - **Email verified**: ON ✅
   - **First name**: Test
   - **Last name**: User
5. Нажмите **Create**
6. Перейдите на вкладку **Credentials**
7. Нажмите **Set password**
8. Заполните:
   - **Password**: `testpass`
   - **Password confirmation**: `testpass`
   - **Temporary**: OFF ⚠️ (выключите!)
9. Нажмите **Save**
10. Подтвердите в диалоге

---

## Шаг 9: Назначьте роли пользователю

1. Находясь в профиле пользователя **testuser**
2. Перейдите на вкладку **Role mapping**
3. Нажмите **Assign role**
4. Выберите **Filter by realm roles**
5. Отметьте галочками:
   - ROLE_ADMIN
   - ROLE_OPERATOR
   - ROLE_MONITOR
6. Нажмите **Assign**

---

## ✅ Проверка настроек

Выполните в терминале:

```bash
curl -X POST "http://localhost:8080/realms/myrealm/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser" \
  -d "password=testpass" \
  -d "grant_type=password" \
  -d "client_id=spa-client"
```

**Если всё настроено правильно**, вы увидите JSON с полем `"access_token"`.

**Если видите ошибку `"HTTPS required"`**, значит вы пропустили **Шаг 2** или **Шаг 4** - вернитесь и отключите SSL!

---

## 🚀 Запуск Backend

После успешной проверки:

```bash
cd go-api
go run main.go
```

**Backend должен запуститься БЕЗ ошибок!** ✅

---

## 📝 Готово!

Теперь у вас:
- ✅ Keycloak настроен с HTTP (без SSL)
- ✅ Realm 'myrealm' создан
- ✅ Clients настроены
- ✅ Роли созданы
- ✅ Тестовый пользователь готов
- ✅ Backend может подключиться к Keycloak

**Успехов! 🎉**

