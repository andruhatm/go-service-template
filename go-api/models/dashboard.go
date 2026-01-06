package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// Dashboard represents a user dashboard in the system
type Dashboard struct {
	ID        uuid.UUID       `json:"id"`
	UserID    uuid.UUID       `json:"userId"`
	Data      json.RawMessage `json:"data"`
	CreatedAt time.Time       `json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
}

// CreateDashboardRequest represents the request body for creating a dashboard
type CreateDashboardRequest struct {
	UserID uuid.UUID       `json:"userId" validate:"required"`
	Data   json.RawMessage `json:"data" validate:"required"`
}

// UpdateDashboardRequest represents the request body for updating a dashboard
type UpdateDashboardRequest struct {
	Data json.RawMessage `json:"data,omitempty"`
}

// DashboardListResponse represents a paginated list response
type DashboardListResponse struct {
	Items      []Dashboard `json:"items"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}
