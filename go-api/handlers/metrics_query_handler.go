package handlers

import (
	"encoding/json"
	"fmt"
	"live/db/victoria"
	"net/http"
	"strconv"
	"time"

	"github.com/gookit/slog"
)

// MetricsQueryHandler handles HTTP requests for querying VictoriaMetrics
type MetricsQueryHandler struct {
	vmService *victoria.VictoriaMetricsService
}

// NewMetricsQueryHandler creates a new handler instance
func NewMetricsQueryHandler(vmService *victoria.VictoriaMetricsService) *MetricsQueryHandler {
	return &MetricsQueryHandler{vmService: vmService}
}

// QueryMetricsRequest represents the request for querying metrics
type QueryMetricsRequest struct {
	MetricName string  `json:"metricName"`
	ObjectName string  `json:"objectName"`
	StartTime  int64   `json:"startTime"`  // Unix timestamp in seconds
	EndTime    int64   `json:"endTime"`    // Unix timestamp in seconds
	Step       int     `json:"step"`       // Step in seconds
	Type       *string `json:"type"`       // Optional: filter by type (e.g., "actual", "forecast")
	ForecastID *string `json:"forecastId"` // Optional: filter by forecast_id
}

// QueryMetricsResponse represents the response from VictoriaMetrics
type QueryMetricsResponse struct {
	Status string          `json:"status"`
	Data   victoria.VMData `json:"data"`
	Error  string          `json:"error,omitempty"`
}

// QueryMetrics handles POST /api/metrics/query
// Queries VictoriaMetrics for time-series data based on metric name and object
func (h *MetricsQueryHandler) QueryMetrics(w http.ResponseWriter, r *http.Request) {
	var req QueryMetricsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warnf("Invalid request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	h.handleQueryMetrics(w, r, req)
}

// QueryMetricsGet handles GET /api/metrics/query
// Supports query params: metricName|metric, objectName|object, startTime|start, endTime|end, step, type, forecastId
func (h *MetricsQueryHandler) QueryMetricsGet(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	req := QueryMetricsRequest{
		MetricName: q.Get("metricName"),
		ObjectName: q.Get("objectName"),
	}

	if req.MetricName == "" {
		req.MetricName = q.Get("metric")
	}
	if req.ObjectName == "" {
		req.ObjectName = q.Get("object")
	}

	startStr := q.Get("startTime")
	if startStr == "" {
		startStr = q.Get("start")
	}
	endStr := q.Get("endTime")
	if endStr == "" {
		endStr = q.Get("end")
	}
	if startStr != "" {
		start, err := strconv.ParseInt(startStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid startTime parameter", http.StatusBadRequest)
			return
		}
		req.StartTime = start
	}
	if endStr != "" {
		end, err := strconv.ParseInt(endStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid endTime parameter", http.StatusBadRequest)
			return
		}
		req.EndTime = end
	}
	if stepStr := q.Get("step"); stepStr != "" {
		step, err := strconv.Atoi(stepStr)
		if err != nil {
			http.Error(w, "Invalid step parameter", http.StatusBadRequest)
			return
		}
		req.Step = step
	}
	if t := q.Get("type"); t != "" {
		req.Type = &t
	}
	if forecastID := q.Get("forecastId"); forecastID != "" {
		req.ForecastID = &forecastID
	}

	h.handleQueryMetrics(w, r, req)
}

func (h *MetricsQueryHandler) handleQueryMetrics(w http.ResponseWriter, r *http.Request, req QueryMetricsRequest) {
	// Validate required fields
	if req.MetricName == "" {
		http.Error(w, "MetricName is required", http.StatusBadRequest)
		return
	}
	if req.ObjectName == "" {
		http.Error(w, "ObjectName is required", http.StatusBadRequest)
		return
	}
	if req.StartTime == 0 || req.EndTime == 0 {
		http.Error(w, "StartTime and EndTime are required", http.StatusBadRequest)
		return
	}
	if req.Step <= 0 {
		req.Step = 60 // Default to 60 seconds
	}

	// Build PromQL query with optional filters
	// Example: test1{name="enb27738", type="actual"}
	// Example: test1{name="enb27738", type="forecast", forecast_id="uuid"}
	filters := fmt.Sprintf(`name="%s"`, req.ObjectName)

	if req.Type != nil && *req.Type != "" {
		filters += fmt.Sprintf(`, type="%s"`, *req.Type)
	}

	if req.ForecastID != nil && *req.ForecastID != "" {
		filters += fmt.Sprintf(`, forecast_id="%s"`, *req.ForecastID)
	}

	promql := fmt.Sprintf(`%s{%s}`, req.MetricName, filters)

	slog.Infof("Querying VictoriaMetrics: query=%s, start=%d, end=%d, step=%d",
		promql, req.StartTime, req.EndTime, req.Step)

	// Query VictoriaMetrics
	start := time.Unix(req.StartTime, 0)
	end := time.Unix(req.EndTime, 0)
	step := time.Duration(req.Step) * time.Second

	data, err := h.vmService.QueryRange(r.Context(), promql, start, end, step)
	if err != nil {
		slog.Errorf("Failed to query VictoriaMetrics: %v", err)
		http.Error(w, fmt.Sprintf("Failed to query metrics: %v", err), http.StatusInternalServerError)
		return
	}

	// Parse response
	var vmResponse victoria.VMResponse
	if err := json.Unmarshal(data, &vmResponse); err != nil {
		slog.Errorf("Failed to parse VictoriaMetrics response: %v", err)
		http.Error(w, "Failed to parse metrics response", http.StatusInternalServerError)
		return
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(vmResponse); err != nil {
		slog.Errorf("Failed to encode response: %v", err)
	}
}

// QueryMetricsInstant handles GET /api/metrics/query-instant
// Queries VictoriaMetrics for instant metric value
func (h *MetricsQueryHandler) QueryMetricsInstant(w http.ResponseWriter, r *http.Request) {
	metricName := r.URL.Query().Get("metric")
	objectName := r.URL.Query().Get("object")
	timeStr := r.URL.Query().Get("time")

	if metricName == "" || objectName == "" {
		http.Error(w, "metric and object parameters are required", http.StatusBadRequest)
		return
	}

	var ts time.Time
	if timeStr != "" {
		unix, err := strconv.ParseInt(timeStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid time parameter", http.StatusBadRequest)
			return
		}
		ts = time.Unix(unix, 0)
	} else {
		ts = time.Now()
	}

	// Build PromQL query
	promql := fmt.Sprintf(`%s{name="%s"}`, metricName, objectName)

	slog.Infof("Querying VictoriaMetrics instant: query=%s, time=%s", promql, ts.Format(time.RFC3339))

	// Query VictoriaMetrics
	data, err := h.vmService.QueryInstant(r.Context(), promql, ts)
	if err != nil {
		slog.Errorf("Failed to query VictoriaMetrics: %v", err)
		http.Error(w, fmt.Sprintf("Failed to query metrics: %v", err), http.StatusInternalServerError)
		return
	}

	// Parse response
	var vmResponse victoria.VMResponse
	if err := json.Unmarshal(data, &vmResponse); err != nil {
		slog.Errorf("Failed to parse VictoriaMetrics response: %v", err)
		http.Error(w, "Failed to parse metrics response", http.StatusInternalServerError)
		return
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(vmResponse); err != nil {
		slog.Errorf("Failed to encode response: %v", err)
	}
}
