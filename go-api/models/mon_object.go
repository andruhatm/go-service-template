package models

import (
	"time"

	"github.com/google/uuid"
)

// MonObject represents a monitoring object in the system
type MonObject struct {
	ID           uuid.UUID  `json:"id"`
	Name         string     `json:"name" validate:"required,min=1,max=255"`
	Type         *string    `json:"type,omitempty"`
	ParentID     *uuid.UUID `json:"parentId,omitempty"`
	ChildID      *uuid.UUID `json:"childId,omitempty"`
	Technology   *string    `json:"technology,omitempty"`
	Platform     *string    `json:"platform,omitempty"`
	Network      *string    `json:"network,omitempty"`
	Manufacturer *string    `json:"manufacturer,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

// CreateMonObjectRequest represents the request body for creating a monitoring object
type CreateMonObjectRequest struct {
	Name         string     `json:"name" validate:"required,min=1,max=255"`
	Type         *string    `json:"type,omitempty"`
	ParentID     *uuid.UUID `json:"parentId,omitempty"`
	ChildID      *uuid.UUID `json:"childId,omitempty"`
	Technology   *string    `json:"technology,omitempty"`
	Platform     *string    `json:"platform,omitempty"`
	Network      *string    `json:"network,omitempty"`
	Manufacturer *string    `json:"manufacturer,omitempty"`
}

// UpdateMonObjectRequest represents the request body for updating a monitoring object
type UpdateMonObjectRequest struct {
	Name         *string    `json:"name,omitempty" validate:"omitempty,min=1,max=255"`
	Type         *string    `json:"type,omitempty"`
	ParentID     *uuid.UUID `json:"parentId,omitempty"`
	ChildID      *uuid.UUID `json:"childId,omitempty"`
	Technology   *string    `json:"technology,omitempty"`
	Platform     *string    `json:"platform,omitempty"`
	Network      *string    `json:"network,omitempty"`
	Manufacturer *string    `json:"manufacturer,omitempty"`
}

// MonObjectListResponse represents a paginated list response
type MonObjectListResponse struct {
	Items      []MonObject `json:"items"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}
