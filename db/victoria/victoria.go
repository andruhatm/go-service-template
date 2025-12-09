package victoria

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv" // Добавлено для parseStep
	"strings"
	"time"
)

// VictoriaMetricsService предоставляет методы для взаимодействия с VictoriaMetrics
// через ее HTTP API.
type VictoriaMetricsService struct {
	baseURL    string
	httpClient *http.Client
}

// NewVictoriaMetricsService создает новый экземпляр VictoriaMetricsService.
// baseURL: базовый URL вашего экземпляра VictoriaMetrics (например, "http://localhost:8428").
// timeout: таймаут для HTTP-запросов.
func NewVictoriaMetricsService(baseURL string, timeout time.Duration) (*VictoriaMetricsService, error) {
	parsedURL, err := url.ParseRequestURI(baseURL)
	if err != nil {
		return nil, fmt.Errorf("неверный базовый URL VictoriaMetrics: %w", err)
	}
	client := &http.Client{Timeout: timeout}
	return &VictoriaMetricsService{
		baseURL:    strings.TrimRight(parsedURL.String(), "/"),
		httpClient: client,
	}, nil
}

// Close закрывает ресурсы. Для http.Client это обычно не требуется.
func (v *VictoriaMetricsService) Close() error {
	// Ничего не нужно закрывать для http.Client, но метод для совместимости или будущих расширений.
	return nil
}

// WritePrometheusText отправляет метрики в формате Prometheus exposition (text)
// на эндпоинт /api/v1/import/prometheus.
// body: строка или байты, содержащие метрики в текстовом формате Prometheus.
// Пример: "metric_name{label=\"value\"} 123 1672531200000\n"
func (v *VictoriaMetricsService) WritePrometheusText(ctx context.Context, body string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, v.baseURL+"/api/v1/import/prometheus", bytes.NewBufferString(body))
	if err != nil {
		return fmt.Errorf("не удалось создать запрос на запись Prometheus текста: %w", err)
	}
	req.Header.Set("Content-Type", "text/plain; version=0.0.4") // Важно для VM

	resp, err := v.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("ошибка HTTP запроса на запись Prometheus текста: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode/100 != 2 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("неожиданный статус при записи Prometheus текста: %s, тело ответа: %s", resp.Status, string(b))
	}
	return nil
}

// QueryInstant выполняет PromQL запрос (instant query) к эндпоинту /api/v1/query.
// promql: строка PromQL запроса.
// ts: момент времени для запроса (может быть time.Now()).
// Возвращает JSON-ответ от VictoriaMetrics в виде байтового массива.
func (v *VictoriaMetricsService) QueryInstant(ctx context.Context, promql string, ts time.Time) ([]byte, error) {
	u := v.baseURL + "/api/v1/query"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("не удалось создать запрос на PromQL instant query: %w", err)
	}

	q := req.URL.Query()
	q.Add("query", promql)
	q.Add("time", fmt.Sprintf("%d", ts.Unix())) // Время в секундах Unix
	req.URL.RawQuery = q.Encode()

	resp, err := v.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ошибка HTTP запроса PromQL instant query: %w", err)
	}
	defer resp.Body.Close()

	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("не удалось прочитать тело ответа PromQL instant query: %w", err)
	}

	if resp.StatusCode/100 != 2 {
		return nil, fmt.Errorf("PromQL instant query провалился: %s, тело ответа: %s", resp.Status, string(b))
	}
	return b, nil
}

// QueryRange выполняет PromQL запрос (range query) к эндпоинту /api/v1/query_range.
// promql: строка PromQL запроса.
// start, end: начальный и конечный момент времени для запроса.
// step: шаг выборки данных.
// Возвращает JSON-ответ от VictoriaMetrics в виде байтового массива.
func (v *VictoriaMetricsService) QueryRange(ctx context.Context, promql string, start, end time.Time, step time.Duration) ([]byte, error) {
	u := v.baseURL + "/api/v1/query_range"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("не удалось создать запрос на PromQL range query: %w", err)
	}

	q := req.URL.Query()
	q.Add("query", promql)
	q.Add("start", fmt.Sprintf("%d", start.Unix()))    // Время в секундах Unix
	q.Add("end", fmt.Sprintf("%d", end.Unix()))        // Время в секундах Unix
	q.Add("step", fmt.Sprintf("%.0f", step.Seconds())) // Шаг в секундах
	req.URL.RawQuery = q.Encode()

	resp, err := v.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ошибка HTTP запроса PromQL range query: %w", err)
	}
	defer resp.Body.Close()

	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("не удалось прочитать тело ответа PromQL range query: %w", err)
	}

	if resp.StatusCode/100 != 2 {
		return nil, fmt.Errorf("PromQL range query провалился: %s, тело ответа: %s", resp.Status, string(b))
	}
	return b, nil
}

// Вспомогательные функции для парсинга JSON ответов VictoriaMetrics.
// Эти структуры могут быть использованы для десериализации ответа.

// VMResponse общая структура для ответа VictoriaMetrics
type VMResponse struct {
	Status string `json:"status"`
	Data   VMData `json:"data"`
	Error  string `json:"error,omitempty"`
	// Другие поля, такие как warnings, могут быть добавлены по мере необходимости
}

// VMData содержит данные запроса
type VMData struct {
	ResultType string     `json:"resultType"`
	Result     []VMResult `json:"result"`
}

// VMResult представляет собой отдельный элемент результата запроса
type VMResult struct {
	Metric map[string]string `json:"metric"`
	// Для "vector" и "scalar" type
	Value []interface{} `json:"value,omitempty"` // [timestamp, value]
	// Для "matrix" type
	Values [][]interface{} `json:"values,omitempty"` // [[timestamp, value], ...]
}

// parseUnix (вспомогательная функция, если нужно парсить Unix-время из строк)
// Пример: "1672531200"
func parseUnix(s string) (time.Time, error) {
	sec, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return time.Time{}, fmt.Errorf("неверный формат Unix-времени: %w", err)
	}
	return time.Unix(sec, 0), nil
}

// parseStep (вспомогательная функция, если нужно парсить шаг из строк)
// Пример: "60" или "30.5"
func parseStep(s string) (time.Duration, error) {
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, fmt.Errorf("неверный формат шага: %w", err)
	}
	return time.Duration(f * float64(time.Second)), nil
}
