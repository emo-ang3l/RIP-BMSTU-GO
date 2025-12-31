# Инструкция по запуску системы

## Предварительные требования

1. **Docker** и **Docker Compose** должны быть установлены
2. Проверьте версию Docker Compose:
   ```bash
   docker-compose --version
   ```
   Должна быть версия 1.29.0 или выше

## Запуск системы

### 1. Перейдите в директорию проекта

```bash
cd 3LABRIP
```

### 2. Запустите все сервисы

```bash
docker-compose up --build
```

Флаг `--build` необходим для пересборки образов, особенно при первом запуске или после изменений в коде.

### 3. Запуск в фоновом режиме (опционально)

Если хотите запустить сервисы в фоне:

```bash
docker-compose up -d --build
```

### 4. Просмотр логов

Для просмотра логов всех сервисов:
```bash
docker-compose logs -f
```

Для просмотра логов конкретного сервиса:
```bash
docker-compose logs -f django
docker-compose logs -f go-service
docker-compose logs -f postgres
```

## Проверка работоспособности

### 1. Проверка статуса сервисов

```bash
docker-compose ps
```

Все сервисы должны быть в статусе `Up` или `Up (healthy)`.

### 2. Проверка Django сервиса

Откройте в браузере:
- API: http://localhost:8000/api/
- Swagger UI: http://localhost:8000/swagger/
- Admin панель: http://localhost:8000/admin/

### 3. Проверка Go-сервиса

Проверьте health endpoint:
```bash
curl http://localhost:8080/health
```

Должен вернуться ответ `OK`.

### 4. Проверка базы данных

```bash
docker-compose exec postgres psql -U postgres -d insulation_db -c "\dt"
```

## Остановка системы

### Остановка с сохранением данных

```bash
docker-compose stop
```

### Остановка и удаление контейнеров (данные сохраняются в volumes)

```bash
docker-compose down
```

### Полная очистка (удаление контейнеров, volumes и образов)

```bash
docker-compose down -v --rmi all
```

⚠️ **Внимание**: Это удалит все данные из базы данных!

## Порты сервисов

- **Django**: http://localhost:8000
- **Go Calculation Service**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MinIO (через Nginx)**: http://localhost:9000
- **MinIO Console**: http://localhost:9001

## Решение проблем

### Проблема: Сервис не запускается

1. Проверьте логи:
   ```bash
   docker-compose logs [service-name]
   ```

2. Проверьте, не заняты ли порты:
   ```bash
   # Windows PowerShell
   netstat -ano | findstr :8000
   netstat -ano | findstr :8080
   ```

3. Пересоберите образы:
   ```bash
   docker-compose build --no-cache
   docker-compose up
   ```

### Проблема: Go-сервис не может подключиться к Django

1. Убедитесь, что оба сервиса в одной сети `insulation-network`
2. Проверьте переменные окружения:
   ```bash
   docker-compose exec go-service env | grep DJANGO_URL
   docker-compose exec django env | grep GO_SERVICE_URL
   ```

### Проблема: Ошибки миграций Django

1. Остановите сервисы
2. Удалите volume с базой данных (если можно):
   ```bash
   docker-compose down -v
   ```
3. Запустите заново:
   ```bash
   docker-compose up --build
   ```

### Проблема: Go-сервис не компилируется

1. Проверьте, что Go установлен локально (для проверки синтаксиса):
   ```bash
   cd GO
   go mod tidy
   go build .
   ```

2. Проверьте Dockerfile в директории `GO/`

## Тестирование асинхронного расчета

1. Создайте заявку через API
2. Добавьте изоляторы в заявку
3. Сформируйте заявку (статус FORMED)
4. Завершите заявку (статус COMPLETED):
   ```bash
   curl -X PUT http://localhost:8000/api/insulatorrequests/{id}/complete/ \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json"
   ```

5. Проверьте, что заявка получила статус COMPLETED сразу
6. Подождите 5-10 секунд
7. Проверьте, что поле `total_thickness` обновилось:
   ```bash
   curl http://localhost:8000/api/insulatorrequests/{id}/ \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Полезные команды

### Перезапуск конкретного сервиса

```bash
docker-compose restart django
docker-compose restart go-service
```

### Выполнение команд внутри контейнера

```bash
# Django
docker-compose exec django python manage.py shell
docker-compose exec django python manage.py createsuperuser

# PostgreSQL
docker-compose exec postgres psql -U postgres -d insulation_db

# Go-сервис
docker-compose exec go-service sh
```

### Просмотр использования ресурсов

```bash
docker stats
```

## Структура сервисов

```
3LABRIP/
├── docker-compose.yml          # Конфигурация всех сервисов
├── Dockerfile                   # Образ для Django
├── GO/                          # Go-сервис
│   ├── main.go
│   ├── go.mod
│   └── Dockerfile
├── calculator/                  # Django приложение
├── insulation_backend/          # Django проект
└── requirements.txt             # Python зависимости
```

## Дополнительная информация

- См. `DIAGRAMS.md` для диаграмм архитектуры
- См. `CHANGES.md` для описания изменений
- См. `README.md` для общей информации о проекте


