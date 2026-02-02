package models

import (
	"time"
)

// Forecast represents a forecast request and its results
type Forecast struct {
	ID                    string     `json:"id" db:"id"`
	UserID                string     `json:"user_id" db:"user_id"`
	MonObjectName         string     `json:"mon_object_name" db:"mon_object_name"`
	MetricName            string     `json:"metric_name" db:"metric_name"`
	FromTimestamp         int64      `json:"from_timestamp" db:"from_timestamp"`
	ForecastPeriods       int        `json:"forecast_periods" db:"forecast_periods"`
	Freq                  string     `json:"freq" db:"freq"`
	Step                  string     `json:"step" db:"step"`
	SeasonalityMode       string     `json:"seasonality_mode" db:"seasonality_mode"`
	ChangepointPriorScale float64    `json:"changepoint_prior_scale" db:"changepoint_prior_scale"`
	Status                string     `json:"status" db:"status"`
	ForecastStartDate     *time.Time `json:"forecast_start_date,omitempty" db:"forecast_start_date"`
	ForecastEndDate       *time.Time `json:"forecast_end_date,omitempty" db:"forecast_end_date"`
	ForecastPoints        *int       `json:"forecast_points,omitempty" db:"forecast_points"`
	ErrorMessage          *string    `json:"error_message,omitempty" db:"error_message"`
	AutoRefreshEnabled    bool       `json:"auto_refresh_enabled" db:"auto_refresh_enabled"`
	RefreshInterval       string     `json:"refresh_interval" db:"refresh_interval"`
	LastRefreshAt         *time.Time `json:"last_refresh_at,omitempty" db:"last_refresh_at"`
	NextRefreshAt         *time.Time `json:"next_refresh_at,omitempty" db:"next_refresh_at"`
	CreatedAt             time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at" db:"updated_at"`
}

// ForecastCreateRequest represents the request to create a new forecast
type ForecastCreateRequest struct {
	MonObjectName         string  `json:"mon_object_name" validate:"required"`
	MetricName            string  `json:"metric_name" validate:"required"`
	FromTimestamp         int64   `json:"from_timestamp" validate:"required,gt=0"`
	ForecastPeriods       int     `json:"forecast_periods" validate:"required,gt=0,lte=1000"`
	Freq                  string  `json:"freq,omitempty"`
	Step                  string  `json:"step,omitempty"`
	SeasonalityMode       string  `json:"seasonality_mode,omitempty"`
	ChangepointPriorScale float64 `json:"changepoint_prior_scale,omitempty"`
	AutoRefreshEnabled    bool    `json:"auto_refresh_enabled"`
	RefreshInterval       string  `json:"refresh_interval,omitempty"`
}

// ForecastUpdateRequest represents the request to update a forecast (mainly for status updates)
type ForecastUpdateRequest struct {
	Status             string     `json:"status,omitempty"`
	ForecastStartDate  *time.Time `json:"forecast_start_date,omitempty"`
	ForecastEndDate    *time.Time `json:"forecast_end_date,omitempty"`
	ForecastPoints     *int       `json:"forecast_points,omitempty"`
	ErrorMessage       *string    `json:"error_message,omitempty"`
	AutoRefreshEnabled *bool      `json:"auto_refresh_enabled,omitempty"`
	RefreshInterval    *string    `json:"refresh_interval,omitempty"`
	LastRefreshAt      *time.Time `json:"last_refresh_at,omitempty"`
	NextRefreshAt      *time.Time `json:"next_refresh_at,omitempty"`
}

// ForecastStatus represents the possible statuses of a forecast
const (
	ForecastStatusPending    = "pending"
	ForecastStatusProcessing = "processing"
	ForecastStatusCompleted  = "completed"
	ForecastStatusFailed     = "failed"
)
