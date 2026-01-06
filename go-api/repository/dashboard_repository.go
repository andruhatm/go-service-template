package repository

import (
	"context"
	"database/sql"
	"fmt"
	"live/models"
	"strings"

	"github.com/google/uuid"
	"github.com/gookit/slog"
)

// DashboardRepository handles database operations for dashboards
type DashboardRepository struct {
	db *sql.DB
}

// NewDashboardRepository creates a new repository instance
func NewDashboardRepository(db *sql.DB) *DashboardRepository {
	return &DashboardRepository{db: db}
}

// Create inserts a new dashboard into the database
func (r *DashboardRepository) Create(ctx context.Context, req *models.CreateDashboardRequest) (*models.Dashboard, error) {
	query := `
		INSERT INTO dashboards (user_id, data)
		VALUES ($1, $2)
		RETURNING id, user_id, data, created_at, updated_at
	`

	var dashboard models.Dashboard
	err := r.db.QueryRowContext(ctx, query,
		req.UserID,
		req.Data,
	).Scan(
		&dashboard.ID,
		&dashboard.UserID,
		&dashboard.Data,
		&dashboard.CreatedAt,
		&dashboard.UpdatedAt,
	)

	if err != nil {
		slog.Errorf("Failed to create dashboard: %v", err)
		return nil, fmt.Errorf("failed to create dashboard: %w", err)
	}

	slog.Infof("Created dashboard with ID: %s for user: %s", dashboard.ID, dashboard.UserID)
	return &dashboard, nil
}

// GetByID retrieves a dashboard by its ID
func (r *DashboardRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Dashboard, error) {
	query := `
		SELECT id, user_id, data, created_at, updated_at
		FROM dashboards
		WHERE id = $1
	`

	var dashboard models.Dashboard
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&dashboard.ID,
		&dashboard.UserID,
		&dashboard.Data,
		&dashboard.CreatedAt,
		&dashboard.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("dashboard not found")
	}
	if err != nil {
		slog.Errorf("Failed to get dashboard: %v", err)
		return nil, fmt.Errorf("failed to get dashboard: %w", err)
	}

	return &dashboard, nil
}

// GetAll retrieves all dashboards with pagination and optional user filter
func (r *DashboardRepository) GetAll(ctx context.Context, page, pageSize int, filters map[string]string) (*models.DashboardListResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize

	// Build WHERE clause for filters
	whereClauses := []string{}
	args := []interface{}{}
	argPos := 1

	if userIDFilter, ok := filters["user_id"]; ok && userIDFilter != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("user_id = $%d", argPos))
		userID, err := uuid.Parse(userIDFilter)
		if err != nil {
			return nil, fmt.Errorf("invalid user_id format: %w", err)
		}
		args = append(args, userID)
		argPos++
	}

	whereClause := ""
	if len(whereClauses) > 0 {
		whereClause = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	// Count total items
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM dashboards %s", whereClause)
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		slog.Errorf("Failed to count dashboards: %v", err)
		return nil, fmt.Errorf("failed to count dashboards: %w", err)
	}

	// Get paginated items
	query := fmt.Sprintf(`
		SELECT id, user_id, data, created_at, updated_at
		FROM dashboards
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		slog.Errorf("Failed to query dashboards: %v", err)
		return nil, fmt.Errorf("failed to query dashboards: %w", err)
	}
	defer rows.Close()

	items := []models.Dashboard{}
	for rows.Next() {
		var dashboard models.Dashboard
		err := rows.Scan(
			&dashboard.ID,
			&dashboard.UserID,
			&dashboard.Data,
			&dashboard.CreatedAt,
			&dashboard.UpdatedAt,
		)
		if err != nil {
			slog.Errorf("Failed to scan dashboard: %v", err)
			return nil, fmt.Errorf("failed to scan dashboard: %w", err)
		}
		items = append(items, dashboard)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating dashboards: %w", err)
	}

	totalPages := (total + pageSize - 1) / pageSize

	return &models.DashboardListResponse{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// Update modifies an existing dashboard
func (r *DashboardRepository) Update(ctx context.Context, id uuid.UUID, req *models.UpdateDashboardRequest) (*models.Dashboard, error) {
	// Build dynamic UPDATE query
	setClauses := []string{"updated_at = CURRENT_TIMESTAMP"}
	args := []interface{}{}
	argPos := 1

	if req.Data != nil {
		setClauses = append(setClauses, fmt.Sprintf("data = $%d", argPos))
		args = append(args, req.Data)
		argPos++
	}

	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE dashboards
		SET %s
		WHERE id = $%d
		RETURNING id, user_id, data, created_at, updated_at
	`, strings.Join(setClauses, ", "), argPos)

	var dashboard models.Dashboard
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&dashboard.ID,
		&dashboard.UserID,
		&dashboard.Data,
		&dashboard.CreatedAt,
		&dashboard.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("dashboard not found")
	}
	if err != nil {
		slog.Errorf("Failed to update dashboard: %v", err)
		return nil, fmt.Errorf("failed to update dashboard: %w", err)
	}

	slog.Infof("Updated dashboard with ID: %s", dashboard.ID)
	return &dashboard, nil
}

// Delete removes a dashboard from the database
func (r *DashboardRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM dashboards WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		slog.Errorf("Failed to delete dashboard: %v", err)
		return fmt.Errorf("failed to delete dashboard: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("dashboard not found")
	}

	slog.Infof("Deleted dashboard with ID: %s", id)
	return nil
}
