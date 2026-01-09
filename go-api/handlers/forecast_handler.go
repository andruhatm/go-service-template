package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"live/middleware"
	"live/models"
	"live/repository"
	"net/http"
	"strconv"
	"time"

	"github.com/gookit/slog"
	"github.com/gorilla/mux"
)

// ForecastHandler handles forecast-related HTTP requests
type ForecastHandler struct {
	repo               *repository.ForecastRepository
	forecastServiceURL string
}

// NewForecastHandler creates a new forecast handler
func NewForecastHandler(repo *repository.ForecastRepository, forecastServiceURL string) *ForecastHandler {
	return &ForecastHandler{
		repo:               repo,
		forecastServiceURL: forecastServiceURL,
	}
}

// CreateForecast creates a new forecast and triggers the forecast service
func (h *ForecastHandler) CreateForecast(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.ForecastCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if req.MonObjectName == "" || req.MetricName == "" || req.FromTimestamp <= 0 || req.ForecastPeriods <= 0 {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Set defaults
	if req.Freq == "" {
		req.Freq = "H"
	}
	if req.Step == "" {
		req.Step = "1h"
	}
	if req.SeasonalityMode == "" {
		req.SeasonalityMode = "additive"
	}
	if req.ChangepointPriorScale == 0 {
		req.ChangepointPriorScale = 0.05
	}

	// Create forecast record
	forecast := &models.Forecast{
		UserID:                userID,
		MonObjectName:         req.MonObjectName,
		MetricName:            req.MetricName,
		FromTimestamp:         req.FromTimestamp,
		ForecastPeriods:       req.ForecastPeriods,
		Freq:                  req.Freq,
		Step:                  req.Step,
		SeasonalityMode:       req.SeasonalityMode,
		ChangepointPriorScale: req.ChangepointPriorScale,
		Status:                models.ForecastStatusPending,
	}

	if err := h.repo.Create(forecast); err != nil {
		slog.Errorf("Failed to create forecast: %v", err)
		http.Error(w, "Failed to create forecast", http.StatusInternalServerError)
		return
	}

	// Trigger forecast service asynchronously
	go h.triggerForecastService(forecast)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(forecast)
}

// triggerForecastService calls the Python forecast service
func (h *ForecastHandler) triggerForecastService(forecast *models.Forecast) {
	// Update status to processing
	h.repo.Update(forecast.ID, &models.ForecastUpdateRequest{
		Status: models.ForecastStatusProcessing,
	})

	// Prepare request to forecast service
	reqBody := map[string]interface{}{
		"metric_name":             forecast.MetricName,
		"mon_obj":                 forecast.MonObjectName,
		"from_timestamp":          forecast.FromTimestamp,
		"forecast_periods":        forecast.ForecastPeriods,
		"freq":                    forecast.Freq,
		"step":                    forecast.Step,
		"seasonality_mode":        forecast.SeasonalityMode,
		"changepoint_prior_scale": forecast.ChangepointPriorScale,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		slog.Errorf("Failed to marshal forecast request: %v", err)
		errMsg := fmt.Sprintf("Failed to marshal request: %v", err)
		h.repo.Update(forecast.ID, &models.ForecastUpdateRequest{
			Status:       models.ForecastStatusFailed,
			ErrorMessage: &errMsg,
		})
		return
	}

	// Call forecast service
	url := fmt.Sprintf("%s/api/v1/forecast", h.forecastServiceURL)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		slog.Errorf("Failed to call forecast service: %v", err)
		errMsg := fmt.Sprintf("Failed to call forecast service: %v", err)
		h.repo.Update(forecast.ID, &models.ForecastUpdateRequest{
			Status:       models.ForecastStatusFailed,
			ErrorMessage: &errMsg,
		})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		slog.Errorf("Forecast service returned error: %s", string(body))
		errMsg := fmt.Sprintf("Forecast service error: %s", string(body))
		h.repo.Update(forecast.ID, &models.ForecastUpdateRequest{
			Status:       models.ForecastStatusFailed,
			ErrorMessage: &errMsg,
		})
		return
	}

	// Parse response
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		slog.Errorf("Failed to parse forecast response: %v", err)
		errMsg := fmt.Sprintf("Failed to parse response: %v", err)
		h.repo.Update(forecast.ID, &models.ForecastUpdateRequest{
			Status:       models.ForecastStatusFailed,
			ErrorMessage: &errMsg,
		})
		return
	}

	// Update forecast with results
	update := &models.ForecastUpdateRequest{
		Status: models.ForecastStatusCompleted,
	}

	if startDate, ok := result["start_date"].(string); ok {
		if t, err := time.Parse(time.RFC3339, startDate); err == nil {
			update.ForecastStartDate = &t
		}
	}

	if endDate, ok := result["end_date"].(string); ok {
		if t, err := time.Parse(time.RFC3339, endDate); err == nil {
			update.ForecastEndDate = &t
		}
	}

	if points, ok := result["forecast_points"].(float64); ok {
		p := int(points)
		update.ForecastPoints = &p
	}

	if err := h.repo.Update(forecast.ID, update); err != nil {
		slog.Errorf("Failed to update forecast status: %v", err)
	}
}

// GetForecast retrieves a specific forecast
func (h *ForecastHandler) GetForecast(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	forecast, err := h.repo.GetByID(id)
	if err != nil {
		http.Error(w, "Forecast not found", http.StatusNotFound)
		return
	}

	// Check ownership or admin role
	userID := middleware.GetUserID(r.Context())
	isAdmin := middleware.HasRole(r.Context(), "realm:ROLE_ADMIN")

	if forecast.UserID != userID && !isAdmin {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(forecast)
}

// ListForecasts lists forecasts for the current user
func (h *ForecastHandler) ListForecasts(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse pagination parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50 // default
	offset := 0

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	forecasts, err := h.repo.List(userID, limit, offset)
	if err != nil {
		slog.Errorf("Failed to list forecasts: %v", err)
		http.Error(w, "Failed to retrieve forecasts", http.StatusInternalServerError)
		return
	}

	total, err := h.repo.Count(userID)
	if err != nil {
		slog.Errorf("Failed to count forecasts: %v", err)
		total = 0
	}

	response := map[string]interface{}{
		"forecasts": forecasts,
		"total":     total,
		"limit":     limit,
		"offset":    offset,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// ListAllForecasts lists all forecasts (admin only)
func (h *ForecastHandler) ListAllForecasts(w http.ResponseWriter, r *http.Request) {
	if !middleware.HasRole(r.Context(), "realm:ROLE_ADMIN") {
		http.Error(w, "Forbidden: ROLE_ADMIN required", http.StatusForbidden)
		return
	}

	// Parse pagination parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50 // default
	offset := 0

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	forecasts, err := h.repo.ListAll(limit, offset)
	if err != nil {
		slog.Errorf("Failed to list all forecasts: %v", err)
		http.Error(w, "Failed to retrieve forecasts", http.StatusInternalServerError)
		return
	}

	total, err := h.repo.CountAll()
	if err != nil {
		slog.Errorf("Failed to count all forecasts: %v", err)
		total = 0
	}

	response := map[string]interface{}{
		"forecasts": forecasts,
		"total":     total,
		"limit":     limit,
		"offset":    offset,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// DeleteForecast deletes a forecast
func (h *ForecastHandler) DeleteForecast(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	userID := middleware.GetUserID(r.Context())
	isAdmin := middleware.HasRole(r.Context(), "realm:ROLE_ADMIN")

	var err error
	if isAdmin {
		err = h.repo.DeleteByID(id)
	} else {
		err = h.repo.Delete(id, userID)
	}

	if err != nil {
		slog.Errorf("Failed to delete forecast: %v", err)
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
