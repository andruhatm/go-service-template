package repository

import (
	"database/sql"
	"fmt"
	"live/models"
	"time"

	"github.com/gookit/slog"
)

// MetricSourceRepository handles database operations for metric sources
type MetricSourceRepository struct {
	db *sql.DB
}

// NewMetricSourceRepository creates a new metric source repository
func NewMetricSourceRepository(db *sql.DB) *MetricSourceRepository {
	return &MetricSourceRepository{db: db}
}

// Create creates a new metric source
func (r *MetricSourceRepository) Create(source *models.MetricSource) error {
	query := `
		INSERT INTO metric_sources (
			source_name, description, connection_type, host, port, 
			file_path, username, password, schedule, enabled, created_by
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(
		query,
		source.SourceName,
		source.Description,
		source.ConnectionType,
		source.Host,
		source.FTPPort,
		source.FilePath,
		source.Username,
		source.Password,
		source.Schedule,
		source.Enabled,
		source.CreatedBy,
	).Scan(&source.ID, &source.CreatedAt, &source.UpdatedAt)

	if err != nil {
		slog.Errorf("Failed to create metric source: %v", err)
		return err
	}

	return nil
}

// GetByID retrieves a metric source by ID
func (r *MetricSourceRepository) GetByID(id int) (*models.MetricSource, error) {
	query := `
		SELECT 
			id, source_name, description, connection_type, host, port,
			file_path, username, password, schedule, enabled,
			last_sync_at, last_sync_status, last_sync_error,
			last_file_hash, last_file_mod_time,
			created_at, updated_at, created_by
		FROM metric_sources
		WHERE id = $1
	`

	source := &models.MetricSource{}
	err := r.db.QueryRow(query, id).Scan(
		&source.ID,
		&source.SourceName,
		&source.Description,
		&source.ConnectionType,
		&source.Host,
		&source.FTPPort,
		&source.FilePath,
		&source.Username,
		&source.Password,
		&source.Schedule,
		&source.Enabled,
		&source.LastSyncAt,
		&source.LastSyncStatus,
		&source.LastSyncError,
		&source.LastFileHash,
		&source.LastFileModTime,
		&source.CreatedAt,
		&source.UpdatedAt,
		&source.CreatedBy,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("metric source not found")
	}
	if err != nil {
		slog.Errorf("Failed to get metric source: %v", err)
		return nil, err
	}

	return source, nil
}

// List retrieves all metric sources
func (r *MetricSourceRepository) List() ([]*models.MetricSource, error) {
	query := `
		SELECT 
			id, source_name, description, connection_type, host, port,
			file_path, username, password, schedule, enabled,
			last_sync_at, last_sync_status, last_sync_error,
			last_file_hash, last_file_mod_time,
			created_at, updated_at, created_by
		FROM metric_sources
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		slog.Errorf("Failed to list metric sources: %v", err)
		return nil, err
	}
	defer rows.Close()

	var sources []*models.MetricSource
	for rows.Next() {
		source := &models.MetricSource{}
		err := rows.Scan(
			&source.ID,
			&source.SourceName,
			&source.Description,
			&source.ConnectionType,
			&source.Host,
			&source.FTPPort,
			&source.FilePath,
			&source.Username,
			&source.Password,
			&source.Schedule,
			&source.Enabled,
			&source.LastSyncAt,
			&source.LastSyncStatus,
			&source.LastSyncError,
			&source.LastFileHash,
			&source.LastFileModTime,
			&source.CreatedAt,
			&source.UpdatedAt,
			&source.CreatedBy,
		)
		if err != nil {
			slog.Errorf("Failed to scan metric source: %v", err)
			continue
		}
		sources = append(sources, source)
	}

	return sources, nil
}

// ListEnabled retrieves all enabled metric sources
func (r *MetricSourceRepository) ListEnabled() ([]*models.MetricSource, error) {
	query := `
		SELECT 
			id, source_name, description, connection_type, host, port,
			file_path, username, password, schedule, enabled,
			last_sync_at, last_sync_status, last_sync_error,
			last_file_hash, last_file_mod_time,
			created_at, updated_at, created_by
		FROM metric_sources
		WHERE enabled = true
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		slog.Errorf("Failed to list enabled metric sources: %v", err)
		return nil, err
	}
	defer rows.Close()

	var sources []*models.MetricSource
	for rows.Next() {
		source := &models.MetricSource{}
		err := rows.Scan(
			&source.ID,
			&source.SourceName,
			&source.Description,
			&source.ConnectionType,
			&source.Host,
			&source.FTPPort,
			&source.FilePath,
			&source.Username,
			&source.Password,
			&source.Schedule,
			&source.Enabled,
			&source.LastSyncAt,
			&source.LastSyncStatus,
			&source.LastSyncError,
			&source.LastFileHash,
			&source.LastFileModTime,
			&source.CreatedAt,
			&source.UpdatedAt,
			&source.CreatedBy,
		)
		if err != nil {
			slog.Errorf("Failed to scan metric source: %v", err)
			continue
		}
		sources = append(sources, source)
	}

	return sources, nil
}

// Update updates a metric source
func (r *MetricSourceRepository) Update(id int, req *models.UpdateMetricSourceRequest) error {
	// Build dynamic update query
	query := `UPDATE metric_sources SET updated_at = CURRENT_TIMESTAMP`
	args := []interface{}{}
	argPos := 1

	if req.SourceName != nil {
		query += fmt.Sprintf(", source_name = $%d", argPos)
		args = append(args, *req.SourceName)
		argPos++
	}
	if req.Description != nil {
		query += fmt.Sprintf(", description = $%d", argPos)
		args = append(args, *req.Description)
		argPos++
	}
	if req.ConnectionType != nil {
		query += fmt.Sprintf(", connection_type = $%d", argPos)
		args = append(args, *req.ConnectionType)
		argPos++
	}
	if req.Host != nil {
		query += fmt.Sprintf(", host = $%d", argPos)
		args = append(args, *req.Host)
		argPos++
	}
	if req.FTPPort != nil {
		query += fmt.Sprintf(", port = $%d", argPos)
		args = append(args, *req.FTPPort)
		argPos++
	}
	if req.FilePath != nil {
		query += fmt.Sprintf(", file_path = $%d", argPos)
		args = append(args, *req.FilePath)
		argPos++
	}
	if req.Username != nil {
		query += fmt.Sprintf(", username = $%d", argPos)
		args = append(args, *req.Username)
		argPos++
	}
	if req.Password != nil {
		query += fmt.Sprintf(", password = $%d", argPos)
		args = append(args, *req.Password)
		argPos++
	}
	if req.Schedule != nil {
		query += fmt.Sprintf(", schedule = $%d", argPos)
		args = append(args, *req.Schedule)
		argPos++
	}
	if req.Enabled != nil {
		query += fmt.Sprintf(", enabled = $%d", argPos)
		args = append(args, *req.Enabled)
		argPos++
	}

	query += fmt.Sprintf(" WHERE id = $%d", argPos)
	args = append(args, id)

	result, err := r.db.Exec(query, args...)
	if err != nil {
		slog.Errorf("Failed to update metric source: %v", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("metric source not found")
	}

	return nil
}

// Delete deletes a metric source
func (r *MetricSourceRepository) Delete(id int) error {
	query := `DELETE FROM metric_sources WHERE id = $1`

	result, err := r.db.Exec(query, id)
	if err != nil {
		slog.Errorf("Failed to delete metric source: %v", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("metric source not found")
	}

	return nil
}

// UpdateSyncStatus updates the sync status of a metric source
func (r *MetricSourceRepository) UpdateSyncStatus(id int, status models.SyncStatus, errorMsg *string) error {
	query := `
		UPDATE metric_sources 
		SET last_sync_at = $1, 
		    last_sync_status = $2, 
		    last_sync_error = $3,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
	`

	now := time.Now()
	result, err := r.db.Exec(query, now, status, errorMsg, id)
	if err != nil {
		slog.Errorf("Failed to update sync status: %v", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("metric source not found")
	}

	return nil
}

// UpdateFileTracking updates file hash and modification time to track changes
func (r *MetricSourceRepository) UpdateFileTracking(id int, fileHash string, modTime time.Time) error {
	query := `
		UPDATE metric_sources 
		SET last_file_hash = $1,
		    last_file_mod_time = $2,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $3
	`

	result, err := r.db.Exec(query, fileHash, modTime, id)
	if err != nil {
		slog.Errorf("Failed to update file tracking: %v", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("metric source not found")
	}

	return nil
}
