package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"
)

const (
	// Токен для псевдо-авторизации (8 байт)
	AuthToken = "12345678"
	// URL основного Django сервиса
	DjangoBaseURL = "http://django:8000"
	// Порт для Go-сервиса
	Port = ":8080"
)

// Request структура для входящего запроса на расчет
type CalculationRequest struct {
	RequestID      int     `json:"request_id"`
	RequiredRValue float64 `json:"required_r_value"`
	Details        []Detail `json:"details"`
}

// Detail структура для деталей заявки
type Detail struct {
	ID                int     `json:"id"`
	InsulatorID       int     `json:"insulator_id"`
	ThermalConductivity float64 `json:"thermal_conductivity"`
	Quantity          int     `json:"quantity"`
}

// ResultRequest структура для отправки результата в Django
type ResultRequest struct {
	RequestID     int     `json:"request_id"`
	TotalThickness float64 `json:"total_thickness"`
	Success       bool    `json:"success"`
	Token         string  `json:"token"`
}

// Response структура для ответа клиенту
type CalculationResponse struct {
	RequestID int    `json:"request_id"`
	Status    string `json:"status"`
	Message   string `json:"message"`
}

func main() {
	// Инициализация генератора случайных чисел
	// В Go 1.20+ глобальный генератор уже инициализирован, но для совместимости
	// можно использовать локальный генератор или просто использовать глобальный

	// Получаем URL Django из переменной окружения или используем значение по умолчанию
	djangoURL := os.Getenv("DJANGO_URL")
	if djangoURL == "" {
		djangoURL = DjangoBaseURL
	}

	http.HandleFunc("/calculate", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req CalculationRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
			return
		}

		// Отправляем немедленный ответ клиенту
		response := CalculationResponse{
			RequestID: req.RequestID,
			Status:    "accepted",
			Message:   "Calculation started",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)

		// Запускаем асинхронный расчет
		go calculateAsync(req, djangoURL)
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	log.Printf("Go calculation service starting on port %s", Port)
	log.Printf("Django URL: %s", djangoURL)
	if err := http.ListenAndServe(Port, nil); err != nil {
		log.Fatal(err)
	}
}

func calculateAsync(req CalculationRequest, djangoURL string) {
	// Задержка 5-10 секунд
	delay := time.Duration(5+rand.Intn(6)) * time.Second
	log.Printf("Starting calculation for request %d, delay: %v", req.RequestID, delay)
	time.Sleep(delay)

	// Вычисляем total_thickness
	var totalThickness float64
	for _, detail := range req.Details {
		calculatedThickness := req.RequiredRValue * detail.ThermalConductivity * float64(detail.Quantity)
		totalThickness += calculatedThickness
	}

	// Случайный результат (успех/неуспех)
	success := rand.Float32() > 0.3 // 70% вероятность успеха

	log.Printf("Calculation completed for request %d: total_thickness=%.2f, success=%v", 
		req.RequestID, totalThickness, success)

	// Отправляем результат в Django
	sendResultToDjango(req.RequestID, totalThickness, success, djangoURL)
}

func sendResultToDjango(requestID int, totalThickness float64, success bool, djangoURL string) {
	result := ResultRequest{
		RequestID:     requestID,
		TotalThickness: totalThickness,
		Success:       success,
		Token:         AuthToken,
	}

	jsonData, err := json.Marshal(result)
	if err != nil {
		log.Printf("Error marshaling result: %v", err)
		return
	}

	url := fmt.Sprintf("%s/api/insulatorrequests/%d/update-thickness/", djangoURL, requestID)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Error creating request: %v", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending result to Django: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		log.Printf("Successfully sent result to Django for request %d", requestID)
	} else {
		log.Printf("Failed to send result to Django for request %d, status: %d", requestID, resp.StatusCode)
	}
}

