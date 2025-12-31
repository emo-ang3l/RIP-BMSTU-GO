# Инструкция по тестированию исправления

## Что было исправлено

Проблема: Метод `update_thickness` использовал `self.get_object()`, который требует аутентифицированного пользователя. Когда Go-сервис отправлял запрос без пользователя, возникала ошибка 500.

Решение: Метод теперь получает объект напрямую по `pk` через `InsulatorRequest.objects.get(pk=pk)`, минуя систему разрешений, так как у нас есть токен для авторизации.

## Как протестировать

### 1. Создайте новую заявку или используйте существующую со статусом FORMED

### 2. Завершите заявку через API (это запустит асинхронный расчет):

**Postman:**
- Method: `PUT`
- URL: `http://localhost:8000/api/insulatorrequests/{id}/complete/`
- Headers: `Authorization: Bearer {ваш_токен}`

### 3. Подождите 5-10 секунд

### 4. Проверьте заявку:

**Postman:**
- Method: `GET`
- URL: `http://localhost:8000/api/insulatorrequests/{id}/`
- Headers: `Authorization: Bearer {ваш_токен}`

**Ожидаемый результат:** Поле `total_thickness` должно быть заполнено.

### 5. Проверьте логи:

```powershell
# Логи Go-сервиса
docker-compose logs go-service

# Логи Django
docker-compose logs django | Select-String "update-thickness"
```

**Ожидаемый результат в логах Go-сервиса:**
```
Successfully sent result to Django for request {id}
```

**Ожидаемый результат в логах Django:**
```
POST /api/insulatorrequests/{id}/update-thickness/ HTTP/1.1" 200
```

## Если все еще не работает

1. Проверьте, что Django контейнер перезапущен после изменений
2. Проверьте логи на наличие ошибок
3. Убедитесь, что Go-сервис доступен: `curl http://localhost:8080/health`
4. Проверьте, что токен в Go-сервисе правильный: `"12345678"`

