package repository

import (
	"database/sql"
	"fmt"
	"live/models"
	"time"

	"github.com/google/uuid"
)

// ForecastRepository handles database operations for forecasts
type ForecastRepository struct {
	db *sql.DB
}

// NewForecastRepository creates a new forecast repository
func NewForecastRepository(db *sql.DB) *ForecastRepository {
	return &ForecastRepository{db: db}
}

// Create creates a new forecast in the database
func (r *ForecastRepository) Create(forecast *models.Forecast) error {
	query := `
		INSERT INTO forecasts (
			id, user_id, mon_object_name, metric_name, from_timestamp,
			forecast_periods, freq, step, seasonality_mode, changepoint_prior_scale,
			status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, created_at, updated_at
	`

	id := uuid.New().String()
	now := time.Now()

	err := r.db.QueryRow(
		query,
		id,
		forecast.UserID,
		forecast.MonObjectName,
		forecast.MetricName,
		forecast.FromTimestamp,
		forecast.ForecastPeriods,
		forecast.Freq,
		forecast.Step,
		forecast.SeasonalityMode,
		forecast.ChangepointPriorScale,
		models.ForecastStatusPending,
		now,
		now,
	).Scan(&forecast.ID, &forecast.CreatedAt, &forecast.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create forecast: %w", err)
	}

	forecast.Status = models.ForecastStatusPending
	return nil
}

// GetByID retrieves a forecast by ID
func (r *ForecastRepository) GetByID(id string) (*models.Forecast, error) {
	query := `
		SELECT id, user_id, mon_object_name, metric_name, from_timestamp,
			forecast_periods, freq, step, seasonality_mode, changepoint_prior_scale,
			status, forecast_start_date, forecast_end_date, forecast_points,
			error_message, created_at, updated_at
		FROM forecasts
		WHERE id = $1
	`

	forecast := &models.Forecast{}
	err := r.db.QueryRow(query, id).Scan(
		&forecast.ID,
		&forecast.UserID,
		&forecast.MonObjectName,
		&forecast.MetricName,
		&forecast.FromTimestamp,
		&forecast.ForecastPeriods,
		&forecast.Freq,
		&forecast.Step,
		&forecast.SeasonalityMode,
		&forecast.ChangepointPriorScale,
		&forecast.Status,
		&forecast.ForecastStartDate,
		&forecast.ForecastEndDate,
		&forecast.ForecastPoints,
		&forecast.ErrorMessage,
		&forecast.CreatedAt,
		&forecast.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("forecast not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get forecast: %w", err)
	}

	return forecast, nil
}

// List retrieves all forecasts with optional filtering
func (r *ForecastRepository) List(userID string, limit, offset int) ([]*models.Forecast, error) {
	query := `
		SELECT id, user_id, mon_object_name, metric_name, from_timestamp,
			forecast_periods, freq, step, seasonality_mode, changepoint_prior_scale,
			status, forecast_start_date, forecast_end_date, forecast_points,
			error_message, created_at, updated_at
		FROM forecasts
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list forecasts: %w", err)
	}
	defer rows.Close()

	var forecasts []*models.Forecast
	for rows.Next() {
		forecast := &models.Forecast{}
		err := rows.Scan(
			&forecast.ID,
			&forecast.UserID,
			&forecast.MonObjectName,
			&forecast.MetricName,
			&forecast.FromTimestamp,
			&forecast.ForecastPeriods,
			&forecast.Freq,
			&forecast.Step,
			&forecast.SeasonalityMode,
			&forecast.ChangepointPriorScale,
			&forecast.Status,
			&forecast.ForecastStartDate,
			&forecast.ForecastEndDate,
			&forecast.ForecastPoints,
			&forecast.ErrorMessage,
			&forecast.CreatedAt,
			&forecast.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan forecast: %w", err)
		}
		forecasts = append(forecasts, forecast)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating forecasts: %w", err)
	}

	return forecasts, nil
}

// ListAll retrieves all forecasts (admin only)
func (r *ForecastRepository) ListAll(limit, offset int) ([]*models.Forecast, error) {
	query := `
		SELECT id, user_id, mon_object_name, metric_name, from_timestamp,
			forecast_periods, freq, step, seasonality_mode, changepoint_prior_scale,
			status, forecast_start_date, forecast_end_date, forecast_points,
			error_message, created_at, updated_at
		FROM forecasts
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list all forecasts: %w", err)
	}
	defer rows.Close()

	var forecasts []*models.Forecast
	for rows.Next() {
		forecast := &models.Forecast{}
		err := rows.Scan(
			&forecast.ID,
			&forecast.UserID,
			&forecast.MonObjectName,
			&forecast.MetricName,
			&forecast.FromTimestamp,
			&forecast.ForecastPeriods,
			&forecast.Freq,
			&forecast.Step,
			&forecast.SeasonalityMode,
			&forecast.ChangepointPriorScale,
			&forecast.Status,
			&forecast.ForecastStartDate,
			&forecast.ForecastEndDate,
			&forecast.ForecastPoints,
			&forecast.ErrorMessage,
			&forecast.CreatedAt,
			&forecast.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan forecast: %w", err)
		}
		forecasts = append(forecasts, forecast)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating forecasts: %w", err)
	}

	return forecasts, nil
}

// Update updates a forecast
func (r *ForecastRepository) Update(id string, update *models.ForecastUpdateRequest) error {
	query := `
		UPDATE forecasts
		SET status = COALESCE($1, status),
			forecast_start_date = COALESCE($2, forecast_start_date),
			forecast_end_date = COALESCE($3, forecast_end_date),
			forecast_points = COALESCE($4, forecast_points),
			error_message = COALESCE($5, error_message),
			updated_at = $6
		WHERE id = $7
	`

	now := time.Now()
	var status *string
	if update.Status != "" {
		status = &update.Status
	}

	result, err := r.db.Exec(
		query,
		status,
		update.ForecastStartDate,
		update.ForecastEndDate,
		update.ForecastPoints,
		update.ErrorMessage,
		now,
		id,
	)

	if err != nil {
		return fmt.Errorf("failed to update forecast: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("forecast not found")
	}

	return nil
}

// Delete deletes a forecast
func (r *ForecastRepository) Delete(id string, userID string) error {
	query := `DELETE FROM forecasts WHERE id = $1 AND user_id = $2`

	result, err := r.db.Exec(query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete forecast: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("forecast not found or not owned by user")
	}

	return nil
}

// DeleteByID deletes a forecast by ID (admin only)
func (r *ForecastRepository) DeleteByID(id string) error {
	query := `DELETE FROM forecasts WHERE id = $1`

	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete forecast: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("forecast not found")
	}

	return nil
}

// Count returns the total count of forecasts for a user
func (r *ForecastRepository) Count(userID string) (int, error) {
	query := `SELECT COUNT(*) FROM forecasts WHERE user_id = $1`

	var count int
	err := r.db.QueryRow(query, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count forecasts: %w", err)
	}

	return count, nil
}

// CountAll returns the total count of all forecasts
func (r *ForecastRepository) CountAll() (int, error) {
	query := `SELECT COUNT(*) FROM forecasts`

	var count int
	err := r.db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count all forecasts: %w", err)
	}

	return count, nil
}
