# Диаграммы системы

## Диаграмма последовательности: Завершение заявки с асинхронным расчетом total_thickness

```mermaid
sequenceDiagram
    participant Client as Клиент (Frontend)
    participant Django as Django Service
    participant GoService as Go Calculation Service
    participant DB as PostgreSQL

    Client->>Django: PUT /api/insulatorrequests/{id}/complete/
    Django->>DB: Проверка прав доступа и статуса заявки
    Django->>DB: Обновление статуса на COMPLETED
    Django->>DB: Расчет calculated_thickness для деталей
    Django->>DB: Сохранение заявки (без total_thickness)
    Django-->>Client: 200 OK (заявка завершена, расчет запущен)
    
    Note over Django,GoService: Асинхронный вызов
    Django->>GoService: POST /calculate (в отдельном потоке)
    GoService-->>Django: 200 OK (расчет принят)
    
    Note over GoService: Задержка 5-10 секунд
    GoService->>GoService: Расчет total_thickness
    GoService->>GoService: Генерация случайного результата (успех/неуспех)
    
    GoService->>Django: POST /api/insulatorrequests/{id}/update-thickness/
    Note over GoService,Django: Токен авторизации: "12345678"
    Django->>Django: Проверка токена
    Django->>DB: Обновление total_thickness
    Django-->>GoService: 200 OK (результат сохранен)
```

## Диаграмма развертывания

```mermaid
graph TB
    subgraph "Docker Network: insulation-network"
        subgraph "Frontend Layer"
            Frontend[Frontend Application<br/>React + Tauri]
        end
        
        subgraph "API Layer"
            Django[Django Service<br/>:8000<br/>Python/Django]
            GoService[Go Calculation Service<br/>:8080<br/>Go]
        end
        
        subgraph "Data Layer"
            Postgres[(PostgreSQL<br/>:5432<br/>insulation_db)]
            Redis[(Redis<br/>:6379<br/>Cache & Sessions)]
        end
        
        subgraph "Storage Layer"
            Minio1[MinIO 1<br/>:9000]
            Minio2[MinIO 2<br/>:9000]
            Minio3[MinIO 3<br/>:9000]
            Minio4[MinIO 4<br/>:9000]
            Nginx[Nginx<br/>:9000, :9001<br/>Load Balancer]
        end
    end
    
    Frontend -->|HTTP/REST| Django
    Django -->|HTTP/REST| GoService
    GoService -->|HTTP/REST| Django
    Django -->|SQL| Postgres
    Django -->|Cache| Redis
    Django -->|Object Storage| Nginx
    Nginx -->|Distribute| Minio1
    Nginx -->|Distribute| Minio2
    Nginx -->|Distribute| Minio3
    Nginx -->|Distribute| Minio4
    
    style Django fill:#4A90E2,color:#fff
    style GoService fill:#00ADD8,color:#fff
    style Postgres fill:#336791,color:#fff
    style Redis fill:#DC382D,color:#fff
    style Frontend fill:#61DAFB,color:#000
```

## Описание компонентов

### Django Service
- **Порт**: 8000
- **Технологии**: Python, Django, Django REST Framework
- **Функции**:
  - Основной веб-сервис для управления заявками
  - Аутентификация и авторизация пользователей
  - Управление изоляторами и заявками
  - Прием результатов расчета от Go-сервиса

### Go Calculation Service
- **Порт**: 8080
- **Технологии**: Go
- **Функции**:
  - Асинхронный расчет total_thickness
  - Задержка выполнения 5-10 секунд
  - Генерация случайного результата (успех/неуспех)
  - Отправка результатов в Django через HTTP

### PostgreSQL
- **Порт**: 5432
- **База данных**: insulation_db
- **Хранение**: Заявки, изоляторы, детали заявок, пользователи

### Redis
- **Порт**: 6379
- **Использование**: Кэширование и хранение сессий

### MinIO Cluster
- **Порты**: 9000, 9001
- **Количество узлов**: 4
- **Использование**: Хранение изображений изоляторов
- **Балансировщик**: Nginx

## Взаимодействие сервисов

1. **Завершение заявки**:
   - Клиент отправляет запрос на завершение заявки в Django
   - Django обновляет статус заявки и рассчитывает calculated_thickness для деталей
   - Django асинхронно вызывает Go-сервис для расчета total_thickness
   - Go-сервис выполняет расчет с задержкой 5-10 секунд
   - Go-сервис отправляет результат обратно в Django с токеном авторизации
   - Django обновляет total_thickness в базе данных

2. **Псевдо-авторизация**:
   - Go-сервис использует токен "12345678" (8 байт) для авторизации
   - Django проверяет токен в методе update_thickness
   - Метод update_thickness доступен без стандартной аутентификации Django

3. **Асинхронность**:
   - Вызов Go-сервиса происходит в отдельном потоке Python
   - Клиент получает ответ сразу после обновления статуса заявки
   - Расчет total_thickness выполняется асинхронно


