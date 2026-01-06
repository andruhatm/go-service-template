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

// DashboardHandler handles HTTP requests for dashboards
type DashboardHandler struct {
	repo *repository.DashboardRepository
}

// NewDashboardHandler creates a new handler instance
func NewDashboardHandler(repo *repository.DashboardRepository) *DashboardHandler {
	return &DashboardHandler{repo: repo}
}

// CreateDashboard handles POST /api/dashboards
// Allows authenticated users to create dashboards
// Note: In production, should validate that users can only create dashboards for themselves
// by comparing req.UserID with the authenticated user ID from context
func (h *DashboardHandler) CreateDashboard(w http.ResponseWriter, r *http.Request) {
	var req models.CreateDashboardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warnf("Invalid request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.UserID == uuid.Nil {
		http.Error(w, "UserID is required", http.StatusBadRequest)
		return
	}
	if len(req.Data) == 0 {
		http.Error(w, "Data is required", http.StatusBadRequest)
		return
	}

	// TODO: Security enhancement - validate that non-admin users can only create dashboards for themselves
	// currentUserID := middleware.GetUserID(r.Context())
	// if !middleware.HasRole(r.Context(), "realm:ROLE_ADMIN") && req.UserID.String() != currentUserID {
	//     http.Error(w, "Forbidden: Cannot create dashboard for another user", http.StatusForbidden)
	//     return
	// }

	dashboard, err := h.repo.Create(r.Context(), &req)
	if err != nil {
		slog.Errorf("Failed to create dashboard: %v", err)
		http.Error(w, "Failed to create dashboard", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(dashboard); err != nil {
		slog.Errorf("Failed to encode response: %v", err)
	}
}

// GetDashboard handles GET /api/dashboards/{id}
func (h *DashboardHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	dashboard, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		if err.Error() == "dashboard not found" {
			http.Error(w, "Dashboard not found", http.StatusNotFound)
			return
		}
		slog.Errorf("Failed to get dashboard: %v", err)
		http.Error(w, "Failed to get dashboard", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(dashboard); err != nil {
		slog.Errorf("Failed to encode response: %v", err)
	}
}

// ListDashboards handles GET /api/dashboards
func (h *DashboardHandler) ListDashboards(w http.ResponseWriter, r *http.Request) {
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
	if userIDFilter := r.URL.Query().Get("user_id"); userIDFilter != "" {
		filters["user_id"] = userIDFilter
	}

	response, err := h.repo.GetAll(r.Context(), page, pageSize, filters)
	if err != nil {
		slog.Errorf("Failed to list dashboards: %v", err)
		http.Error(w, "Failed to list dashboards", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		slog.Errorf("Failed to encode response: %v", err)
	}
}

// UpdateDashboard handles PUT /api/dashboards/{id}
func (h *DashboardHandler) UpdateDashboard(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	var req models.UpdateDashboardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warnf("Invalid request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	dashboard, err := h.repo.Update(r.Context(), id, &req)
	if err != nil {
		if err.Error() == "dashboard not found" {
			http.Error(w, "Dashboard not found", http.StatusNotFound)
			return
		}
		slog.Errorf("Failed to update dashboard: %v", err)
		http.Error(w, "Failed to update dashboard", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(dashboard); err != nil {
		slog.Errorf("Failed to encode response: %v", err)
	}
}

// DeleteDashboard handles DELETE /api/dashboards/{id}
func (h *DashboardHandler) DeleteDashboard(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	err = h.repo.Delete(r.Context(), id)
	if err != nil {
		if err.Error() == "dashboard not found" {
			http.Error(w, "Dashboard not found", http.StatusNotFound)
			return
		}
		slog.Errorf("Failed to delete dashboard: %v", err)
		http.Error(w, "Failed to delete dashboard", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
