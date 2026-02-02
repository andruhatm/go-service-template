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
			status, auto_refresh_enabled, refresh_interval, next_refresh_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		RETURNING id, created_at, updated_at
	`

	id := uuid.New().String()
	now := time.Now()

	// Calculate next refresh time if auto-refresh is enabled
	var nextRefreshAt *time.Time
	if forecast.AutoRefreshEnabled {
		nextRefresh := calculateNextRefresh(now, forecast.RefreshInterval)
		nextRefreshAt = &nextRefresh
	}

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
		forecast.AutoRefreshEnabled,
		forecast.RefreshInterval,
		nextRefreshAt,
		now,
		now,
	).Scan(&forecast.ID, &forecast.CreatedAt, &forecast.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create forecast: %w", err)
	}

	forecast.Status = models.ForecastStatusPending
	forecast.NextRefreshAt = nextRefreshAt
	return nil
}

// GetByID retrieves a forecast by ID
func (r *ForecastRepository) GetByID(id string) (*models.Forecast, error) {
	query := `
		SELECT id, user_id, mon_object_name, metric_name, from_timestamp,
			forecast_periods, freq, step, seasonality_mode, changepoint_prior_scale,
			status, forecast_start_date, forecast_end_date, forecast_points,
			error_message, auto_refresh_enabled, refresh_interval, last_refresh_at, 
			next_refresh_at, created_at, updated_at
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
		&forecast.AutoRefreshEnabled,
		&forecast.RefreshInterval,
		&forecast.LastRefreshAt,
		&forecast.NextRefreshAt,
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
			error_message, auto_refresh_enabled, refresh_interval, last_refresh_at,
			next_refresh_at, created_at, updated_at
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
			&forecast.AutoRefreshEnabled,
			&forecast.RefreshInterval,
			&forecast.LastRefreshAt,
			&forecast.NextRefreshAt,
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
			error_message, auto_refresh_enabled, refresh_interval, last_refresh_at,
			next_refresh_at, created_at, updated_at
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
			&forecast.AutoRefreshEnabled,
			&forecast.RefreshInterval,
			&forecast.LastRefreshAt,
			&forecast.NextRefreshAt,
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
			auto_refresh_enabled = COALESCE($6, auto_refresh_enabled),
			refresh_interval = COALESCE($7, refresh_interval),
			last_refresh_at = COALESCE($8, last_refresh_at),
			next_refresh_at = COALESCE($9, next_refresh_at),
			updated_at = $10
		WHERE id = $11
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
		update.AutoRefreshEnabled,
		update.RefreshInterval,
		update.LastRefreshAt,
		update.NextRefreshAt,
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

// GetForecastsForRefresh retrieves forecasts that need to be refreshed
func (r *ForecastRepository) GetForecastsForRefresh() ([]*models.Forecast, error) {
	query := `
		SELECT id, user_id, mon_object_name, metric_name, from_timestamp,
			forecast_periods, freq, step, seasonality_mode, changepoint_prior_scale,
			status, forecast_start_date, forecast_end_date, forecast_points,
			error_message, auto_refresh_enabled, refresh_interval, last_refresh_at,
			next_refresh_at, created_at, updated_at
		FROM forecasts
		WHERE auto_refresh_enabled = TRUE 
			AND status = 'completed'
			AND next_refresh_at <= $1
		ORDER BY next_refresh_at ASC
		LIMIT 100
	`

	now := time.Now()
	rows, err := r.db.Query(query, now)
	if err != nil {
		return nil, fmt.Errorf("failed to get forecasts for refresh: %w", err)
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
			&forecast.AutoRefreshEnabled,
			&forecast.RefreshInterval,
			&forecast.LastRefreshAt,
			&forecast.NextRefreshAt,
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

// calculateNextRefresh calculates the next refresh time based on the interval
func calculateNextRefresh(from time.Time, interval string) time.Time {
	duration, err := parseDuration(interval)
	if err != nil {
		// Default to 1 hour if parsing fails
		duration = time.Hour
	}
	return from.Add(duration)
}

// parseDuration parses a duration string (e.g., "1h", "6h", "24h")
func parseDuration(s string) (time.Duration, error) {
	return time.ParseDuration(s)
}
