package handlers

import (
	"encoding/json"
	"live/models"
	"live/repository"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/gookit/slog"
	"github.com/gorilla/mux"
)

// MonObjectHandler handles HTTP requests for monitoring objects
type MonObjectHandler struct {
	repo *repository.MonObjectRepository
}

// NewMonObjectHandler creates a new handler instance
func NewMonObjectHandler(repo *repository.MonObjectRepository) *MonObjectHandler {
	return &MonObjectHandler{repo: repo}
}

// CreateMonObject handles POST /api/mon-objects
func (h *MonObjectHandler) CreateMonObject(w http.ResponseWriter, r *http.Request) {
	var req models.CreateMonObjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warnf("Invalid request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	obj, err := h.repo.Create(r.Context(), &req)
	if err != nil {
		slog.Errorf("Failed to create monitoring object: %v", err)
		http.Error(w, "Failed to create monitoring object", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(obj); err != nil {
		slog.Errorf("Failed to encode response: %v", err)
	}
}

// GetMonObject handles GET /api/mon-objects/{id}
func (h *MonObjectHandler) GetMonObject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	obj, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		if err.Error() == "monitoring object not found" {
			http.Error(w, "Monitoring object not found", http.StatusNotFound)
			return
		}
		slog.Errorf("Failed to get monitoring object: %v", err)
		http.Error(w, "Failed to get monitoring object", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(obj); err != nil {
		slog.Errorf("Failed to encode response: %v", err)
	}
}

// ListMonObjects handles GET /api/mon-objects
func (h *MonObjectHandler) ListMonObjects(w http.ResponseWriter, r *http.Request) {
	// Parse pagination parameters
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("pageSize"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	// Parse filter parameters
	filters := make(map[string]string)
	if typeFilter := r.URL.Query().Get("type"); typeFilter != "" {
		filters["type"] = typeFilter
	}
	if nameFilter := r.URL.Query().Get("name"); nameFilter != "" {
		filters["name"] = nameFilter
	}
	if techFilter := r.URL.Query().Get("technology"); techFilter != "" {
		filters["technology"] = techFilter
	}

	response, err := h.repo.GetAll(r.Context(), page, pageSize, filters)
	if err != nil {
		slog.Errorf("Failed to list monitoring objects: %v", err)
		http.Error(w, "Failed to list monitoring objects", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		slog.Errorf("Failed to encode response: %v", err)
	}
}

// UpdateMonObject handles PUT /api/mon-objects/{id}
func (h *MonObjectHandler) UpdateMonObject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	var req models.UpdateMonObjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warnf("Invalid request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	obj, err := h.repo.Update(r.Context(), id, &req)
	if err != nil {
		if err.Error() == "monitoring object not found" {
			http.Error(w, "Monitoring object not found", http.StatusNotFound)
			return
		}
		slog.Errorf("Failed to update monitoring object: %v", err)
		http.Error(w, "Failed to update monitoring object", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(obj); err != nil {
		slog.Errorf("Failed to encode response: %v", err)
	}
}

// DeleteMonObject handles DELETE /api/mon-objects/{id}
func (h *MonObjectHandler) DeleteMonObject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	err = h.repo.Delete(r.Context(), id)
	if err != nil {
		if err.Error() == "monitoring object not found" {
			http.Error(w, "Monitoring object not found", http.StatusNotFound)
			return
		}
		slog.Errorf("Failed to delete monitoring object: %v", err)
		http.Error(w, "Failed to delete monitoring object", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
