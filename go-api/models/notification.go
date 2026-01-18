package models

import (
	"time"
)

// Notification represents a user notification
type Notification struct {
	ID          string     `json:"id" db:"id"`
	UserID      string     `json:"user_id" db:"user_id"`
	Type        string     `json:"type" db:"type"`
	Title       string     `json:"title" db:"title"`
	Message     string     `json:"message" db:"message"`
	RelatedID   *string    `json:"related_id,omitempty" db:"related_id"`
	RelatedType *string    `json:"related_type,omitempty" db:"related_type"`
	Status      string     `json:"status" db:"status"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	ReadAt      *time.Time `json:"read_at,omitempty" db:"read_at"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty" db:"expires_at"`
}

// NotificationCreateRequest represents the request to create a new notification
type NotificationCreateRequest struct {
	UserID      string     `json:"user_id" validate:"required"`
	Type        string     `json:"type" validate:"required"`
	Title       string     `json:"title" validate:"required"`
	Message     string     `json:"message" validate:"required"`
	RelatedID   *string    `json:"related_id,omitempty"`
	RelatedType *string    `json:"related_type,omitempty"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
}

// NotificationUpdateRequest represents the request to update a notification
type NotificationUpdateRequest struct {
	Status string     `json:"status,omitempty"`
	ReadAt *time.Time `json:"read_at,omitempty"`
}

// NotificationType represents the possible types of notifications
const (
	NotificationTypeForecastCreated    = "forecast_created"
	NotificationTypeForecastCompleted  = "forecast_completed"
	NotificationTypeForecastFailed     = "forecast_failed"
	NotificationTypeForecastProcessing = "forecast_processing"
	NotificationTypeSystem             = "system"
)

// NotificationStatus represents the possible statuses of a notification
const (
	NotificationStatusUnread    = "unread"
	NotificationStatusRead      = "read"
	NotificationStatusDismissed = "dismissed"
)
