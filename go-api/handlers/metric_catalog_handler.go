package handlers

import (
	"encoding/json"
	"live/models"
	"live/repository"
	"net/http"
	"strconv"
	"strings"

	"github.com/gookit/slog"
	"github.com/gorilla/mux"
)

type MetricCatalogHandler struct {
	repo *repository.MetricCatalogRepository
}

func NewMetricCatalogHandler(repo *repository.MetricCatalogRepository) *MetricCatalogHandler {
	return &MetricCatalogHandler{repo: repo}
}

// ListMetrics handles GET /api/metrics-catalog
func (h *MetricCatalogHandler) ListMetrics(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	pageStr := r.URL.Query().Get("page")
	pageSizeStr := r.URL.Query().Get("pageSize")
	groupFilter := r.URL.Query().Get("group")

	page := 1
	pageSize := 20

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 && ps <= 1000 {
			pageSize = ps
		}
	}

	// Fetch metrics from database
	response, err := h.repo.ListMetrics(page, pageSize, groupFilter)
	if err != nil {
		slog.Errorf("Failed to list metrics: %v", err)
		http.Error(w, "Failed to fetch metrics", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		slog.Errorf("Failed to encode response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// GetMetric handles GET /api/metrics-catalog/{id}
func (h *MetricCatalogHandler) GetMetric(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		http.Error(w, "Metric ID is required", http.StatusBadRequest)
		return
	}

	metric, err := h.repo.GetMetricByID(id)
	if err != nil {
		slog.Errorf("Failed to get metric: %v", err)
		if err.Error() == "metric not found" {
			http.Error(w, "Metric not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to fetch metric", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(metric); err != nil {
		slog.Errorf("Failed to encode response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// GetGroups handles GET /api/metrics-catalog/groups
func (h *MetricCatalogHandler) GetGroups(w http.ResponseWriter, r *http.Request) {
	groups, err := h.repo.GetGroupsList()
	if err != nil {
		slog.Errorf("Failed to get groups: %v", err)
		http.Error(w, "Failed to fetch groups", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"groups": groups,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		slog.Errorf("Failed to encode response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// CreateMetric handles POST /api/metrics-catalog (protected - ROLE_ADMIN only)
func (h *MetricCatalogHandler) CreateMetric(w http.ResponseWriter, r *http.Request) {
	var req models.CreateMetricCatalogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	metric, err := h.repo.CreateMetric(&req)
	if err != nil {
		slog.Errorf("Failed to create metric: %v", err)
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			http.Error(w, "Metric with this name already exists", http.StatusConflict)
			return
		}
		http.Error(w, "Failed to create metric", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(metric); err != nil {
		slog.Errorf("Failed to encode response: %v", err)
	}
}

// UpdateMetric handles PUT /api/metrics-catalog/{id} (protected - ROLE_ADMIN only)
func (h *MetricCatalogHandler) UpdateMetric(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		http.Error(w, "Metric ID is required", http.StatusBadRequest)
		return
	}

	var req models.UpdateMetricCatalogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	metric, err := h.repo.UpdateMetric(id, &req)
	if err != nil {
		slog.Errorf("Failed to update metric: %v", err)
		if err.Error() == "metric not found" {
			http.Error(w, "Metric not found", http.StatusNotFound)
			return
		}
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			http.Error(w, "Metric with this name already exists", http.StatusConflict)
			return
		}
		http.Error(w, "Failed to update metric", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(metric); err != nil {
		slog.Errorf("Failed to encode response: %v", err)
	}
}

// DeleteMetric handles DELETE /api/metrics-catalog/{id} (protected - ROLE_ADMIN only)
func (h *MetricCatalogHandler) DeleteMetric(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		http.Error(w, "Metric ID is required", http.StatusBadRequest)
		return
	}

	err := h.repo.DeleteMetric(id)
	if err != nil {
		slog.Errorf("Failed to delete metric: %v", err)
		if err.Error() == "metric not found" {
			http.Error(w, "Metric not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to delete metric", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
