package handlers

import (
	"encoding/json"
	"live/middleware"
	"live/models"
	"live/repository"
	"net/http"
	"strconv"

	"github.com/gookit/slog"
	"github.com/gorilla/mux"
)

// MetricSourceHandler handles metric source-related HTTP requests
type MetricSourceHandler struct {
	repo *repository.MetricSourceRepository
}

// NewMetricSourceHandler creates a new metric source handler
func NewMetricSourceHandler(repo *repository.MetricSourceRepository) *MetricSourceHandler {
	return &MetricSourceHandler{repo: repo}
}

// CreateMetricSource creates a new metric source
func (h *MetricSourceHandler) CreateMetricSource(w http.ResponseWriter, r *http.Request) {
	var req models.CreateMetricSourceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.SourceName == "" || req.Host == "" || req.FilePath == "" || req.Schedule == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Get user ID from context
	userID := middleware.GetUserID(r.Context())

	// Set default values
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}

	source := &models.MetricSource{
		SourceName:     req.SourceName,
		Description:    req.Description,
		ConnectionType: req.ConnectionType,
		Host:           req.Host,
		FTPPort:        req.FTPPort,
		FilePath:       req.FilePath,
		Username:       req.Username,
		Password:       req.Password,
		Schedule:       req.Schedule,
		Enabled:        enabled,
		CreatedBy:      &userID,
	}

	if err := h.repo.Create(source); err != nil {
		slog.Errorf("Failed to create metric source: %v", err)
		http.Error(w, "Failed to create metric source", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(source)
}

// GetMetricSource retrieves a specific metric source
func (h *MetricSourceHandler) GetMetricSource(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	source, err := h.repo.GetByID(id)
	if err != nil {
		http.Error(w, "Metric source not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(source)
}

// ListMetricSources lists all metric sources
func (h *MetricSourceHandler) ListMetricSources(w http.ResponseWriter, r *http.Request) {
	sources, err := h.repo.List()
	if err != nil {
		slog.Errorf("Failed to list metric sources: %v", err)
		http.Error(w, "Failed to retrieve metric sources", http.StatusInternalServerError)
		return
	}

	if sources == nil {
		sources = []*models.MetricSource{}
	}

	// Convert to slice for response
	items := make([]models.MetricSource, len(sources))
	for i, source := range sources {
		items[i] = *source
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

// UpdateMetricSource updates a metric source
func (h *MetricSourceHandler) UpdateMetricSource(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var req models.UpdateMetricSourceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.repo.Update(id, &req); err != nil {
		slog.Errorf("Failed to update metric source: %v", err)
		if err.Error() == "metric source not found" {
			http.Error(w, err.Error(), http.StatusNotFound)
		} else {
			http.Error(w, "Failed to update metric source", http.StatusInternalServerError)
		}
		return
	}

	// Retrieve and return updated source
	source, err := h.repo.GetByID(id)
	if err != nil {
		http.Error(w, "Failed to retrieve updated metric source", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(source)
}

// DeleteMetricSource deletes a metric source
func (h *MetricSourceHandler) DeleteMetricSource(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	if err := h.repo.Delete(id); err != nil {
		slog.Errorf("Failed to delete metric source: %v", err)
		if err.Error() == "metric source not found" {
			http.Error(w, err.Error(), http.StatusNotFound)
		} else {
			http.Error(w, "Failed to delete metric source", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
