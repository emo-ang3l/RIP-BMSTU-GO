# Используем golang образ для сборки (не alpine из-за проблем с архитектурой на Windows)
FROM golang:1.21 AS builder

WORKDIR /app

# Копируем go.mod
COPY go.mod ./

# Загружаем зависимости
RUN go mod download

# Копируем исходный код
COPY main.go ./

# Собираем приложение статически
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o calculation-service .

# Финальный образ - используем debian slim для меньшего размера
FROM debian:bookworm-slim

# Устанавливаем необходимые пакеты
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /root/

# Копируем бинарник из builder
COPY --from=builder /app/calculation-service .

EXPOSE 8080

CMD ["./calculation-service"]

