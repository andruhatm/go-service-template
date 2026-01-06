package models

import (
	"time"

	"github.com/google/uuid"
)

// MetricCatalog represents a metric configuration in the system
type MetricCatalog struct {
	ID                uuid.UUID `json:"id"`
	Name              string    `json:"name"`
	Unit              *string   `json:"unit,omitempty"`
	Degradation       *string   `json:"degradation,omitempty"`
	Group             *string   `json:"group,omitempty"`
	ThresholdCritical *string   `json:"threshold_critical,omitempty"`
	ThresholdWarning  *string   `json:"threshold_warning,omitempty"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

// MetricCatalogListResponse represents a list response
type MetricCatalogListResponse struct {
	Items      []MetricCatalog `json:"items"`
	Total      int             `json:"total"`
	Page       int             `json:"page"`
	PageSize   int             `json:"pageSize"`
	TotalPages int             `json:"totalPages"`
}

// CreateMetricCatalogRequest represents the request body for creating a metric
type CreateMetricCatalogRequest struct {
	Name              string  `json:"name" validate:"required,min=1,max=255"`
	Unit              *string `json:"unit,omitempty"`
	Degradation       *string `json:"degradation,omitempty"`
	Group             *string `json:"group,omitempty"`
	ThresholdCritical *string `json:"threshold_critical,omitempty"`
	ThresholdWarning  *string `json:"threshold_warning,omitempty"`
}

// UpdateMetricCatalogRequest represents the request body for updating a metric
type UpdateMetricCatalogRequest struct {
	Name              *string `json:"name,omitempty" validate:"omitempty,min=1,max=255"`
	Unit              *string `json:"unit,omitempty"`
	Degradation       *string `json:"degradation,omitempty"`
	Group             *string `json:"group,omitempty"`
	ThresholdCritical *string `json:"threshold_critical,omitempty"`
	ThresholdWarning  *string `json:"threshold_warning,omitempty"`
}
