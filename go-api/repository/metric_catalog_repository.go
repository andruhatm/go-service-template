package repository

import (
	"database/sql"
	"fmt"
	"live/models"

	"github.com/gookit/slog"
)

type MetricCatalogRepository struct {
	db *sql.DB
}

func NewMetricCatalogRepository(db *sql.DB) *MetricCatalogRepository {
	return &MetricCatalogRepository{db: db}
}

// ListMetrics retrieves all metrics from metrics_configuration table with pagination
func (r *MetricCatalogRepository) ListMetrics(page, pageSize int, groupFilter string) (*models.MetricCatalogListResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 1000 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize

	// Build query with optional group filter
	query := `SELECT id, name, unit, degradation, "group", threshold_critical, threshold_warning, created_at, updated_at 
			  FROM metrics_configuration`
	countQuery := `SELECT COUNT(*) FROM metrics_configuration`

	args := []interface{}{}

	if groupFilter != "" {
		query += ` WHERE "group" = $1`
		countQuery += ` WHERE "group" = $1`
		args = append(args, groupFilter)
	}

	// Add ordering and pagination
	query += ` ORDER BY name ASC LIMIT $` + fmt.Sprintf("%d", len(args)+1) + ` OFFSET $` + fmt.Sprintf("%d", len(args)+2)
	args = append(args, pageSize, offset)

	// Get total count
	var total int
	countArgs := []interface{}{}
	if groupFilter != "" {
		countArgs = append(countArgs, groupFilter)
	}

	err := r.db.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		slog.Errorf("Failed to count metrics: %v", err)
		return nil, fmt.Errorf("failed to count metrics: %w", err)
	}

	// Execute query
	rows, err := r.db.Query(query, args...)
	if err != nil {
		slog.Errorf("Failed to query metrics: %v", err)
		return nil, fmt.Errorf("failed to query metrics: %w", err)
	}
	defer rows.Close()

	metrics := []models.MetricCatalog{}
	for rows.Next() {
		var metric models.MetricCatalog
		err := rows.Scan(
			&metric.ID,
			&metric.Name,
			&metric.Unit,
			&metric.Degradation,
			&metric.Group,
			&metric.ThresholdCritical,
			&metric.ThresholdWarning,
			&metric.CreatedAt,
			&metric.UpdatedAt,
		)
		if err != nil {
			slog.Errorf("Failed to scan metric row: %v", err)
			continue
		}
		metrics = append(metrics, metric)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating metrics: %w", err)
	}

	totalPages := (total + pageSize - 1) / pageSize

	return &models.MetricCatalogListResponse{
		Items:      metrics,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// GetMetricByID retrieves a single metric by ID
func (r *MetricCatalogRepository) GetMetricByID(id string) (*models.MetricCatalog, error) {
	query := `SELECT id, name, unit, degradation, "group", threshold_critical, threshold_warning, created_at, updated_at 
			  FROM metrics_configuration WHERE id = $1`

	var metric models.MetricCatalog
	err := r.db.QueryRow(query, id).Scan(
		&metric.ID,
		&metric.Name,
		&metric.Unit,
		&metric.Degradation,
		&metric.Group,
		&metric.ThresholdCritical,
		&metric.ThresholdWarning,
		&metric.CreatedAt,
		&metric.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("metric not found")
	}
	if err != nil {
		slog.Errorf("Failed to get metric by ID: %v", err)
		return nil, fmt.Errorf("failed to get metric: %w", err)
	}

	return &metric, nil
}

// GetGroupsList retrieves all unique groups
func (r *MetricCatalogRepository) GetGroupsList() ([]string, error) {
	query := `SELECT DISTINCT "group" FROM metrics_configuration WHERE "group" IS NOT NULL ORDER BY "group" ASC`

	rows, err := r.db.Query(query)
	if err != nil {
		slog.Errorf("Failed to query groups: %v", err)
		return nil, fmt.Errorf("failed to query groups: %w", err)
	}
	defer rows.Close()

	groups := []string{}
	for rows.Next() {
		var group string
		if err := rows.Scan(&group); err != nil {
			slog.Errorf("Failed to scan group row: %v", err)
			continue
		}
		groups = append(groups, group)
	}

	return groups, nil
}

// CreateMetric creates a new metric in the database
func (r *MetricCatalogRepository) CreateMetric(req *models.CreateMetricCatalogRequest) (*models.MetricCatalog, error) {
	query := `INSERT INTO metrics_configuration (name, unit, degradation, "group", threshold_critical, threshold_warning) 
			  VALUES ($1, $2, $3, $4, $5, $6) 
			  RETURNING id, name, unit, degradation, "group", threshold_critical, threshold_warning, created_at, updated_at`

	var metric models.MetricCatalog
	err := r.db.QueryRow(query, req.Name, req.Unit, req.Degradation, req.Group, req.ThresholdCritical, req.ThresholdWarning).Scan(
		&metric.ID,
		&metric.Name,
		&metric.Unit,
		&metric.Degradation,
		&metric.Group,
		&metric.ThresholdCritical,
		&metric.ThresholdWarning,
		&metric.CreatedAt,
		&metric.UpdatedAt,
	)

	if err != nil {
		slog.Errorf("Failed to create metric: %v", err)
		return nil, fmt.Errorf("failed to create metric: %w", err)
	}

	return &metric, nil
}

// UpdateMetric updates an existing metric
func (r *MetricCatalogRepository) UpdateMetric(id string, req *models.UpdateMetricCatalogRequest) (*models.MetricCatalog, error) {
	// Build dynamic update query
	query := `UPDATE metrics_configuration SET updated_at = CURRENT_TIMESTAMP`
	args := []interface{}{}
	argCount := 1

	if req.Name != nil {
		query += fmt.Sprintf(`, name = $%d`, argCount)
		args = append(args, *req.Name)
		argCount++
	}
	if req.Unit != nil {
		query += fmt.Sprintf(`, unit = $%d`, argCount)
		args = append(args, *req.Unit)
		argCount++
	}
	if req.Degradation != nil {
		query += fmt.Sprintf(`, degradation = $%d`, argCount)
		args = append(args, *req.Degradation)
		argCount++
	}
	if req.Group != nil {
		query += fmt.Sprintf(`, "group" = $%d`, argCount)
		args = append(args, *req.Group)
		argCount++
	}
	if req.ThresholdCritical != nil {
		query += fmt.Sprintf(`, threshold_critical = $%d`, argCount)
		args = append(args, *req.ThresholdCritical)
		argCount++
	}
	if req.ThresholdWarning != nil {
		query += fmt.Sprintf(`, threshold_warning = $%d`, argCount)
		args = append(args, *req.ThresholdWarning)
		argCount++
	}

	query += fmt.Sprintf(` WHERE id = $%d RETURNING id, name, unit, degradation, "group", threshold_critical, threshold_warning, created_at, updated_at`, argCount)
	args = append(args, id)

	var metric models.MetricCatalog
	err := r.db.QueryRow(query, args...).Scan(
		&metric.ID,
		&metric.Name,
		&metric.Unit,
		&metric.Degradation,
		&metric.Group,
		&metric.ThresholdCritical,
		&metric.ThresholdWarning,
		&metric.CreatedAt,
		&metric.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("metric not found")
	}
	if err != nil {
		slog.Errorf("Failed to update metric: %v", err)
		return nil, fmt.Errorf("failed to update metric: %w", err)
	}

	return &metric, nil
}

// DeleteMetric deletes a metric by ID
func (r *MetricCatalogRepository) DeleteMetric(id string) error {
	query := `DELETE FROM metrics_configuration WHERE id = $1`

	result, err := r.db.Exec(query, id)
	if err != nil {
		slog.Errorf("Failed to delete metric: %v", err)
		return fmt.Errorf("failed to delete metric: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("metric not found")
	}

	return nil
}
