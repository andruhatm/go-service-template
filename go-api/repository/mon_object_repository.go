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

// MonObjectRepository handles database operations for monitoring objects
type MonObjectRepository struct {
	db *sql.DB
}

// NewMonObjectRepository creates a new repository instance
func NewMonObjectRepository(db *sql.DB) *MonObjectRepository {
	return &MonObjectRepository{db: db}
}

// Create inserts a new monitoring object into the database
func (r *MonObjectRepository) Create(ctx context.Context, req *models.CreateMonObjectRequest) (*models.MonObject, error) {
	query := `
		INSERT INTO mon_objects (name, type, parent_id, child_id, technology, platform, network, manufacturer)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, name, type, parent_id, child_id, technology, platform, network, manufacturer, created_at, updated_at
	`

	var obj models.MonObject
	err := r.db.QueryRowContext(ctx, query,
		req.Name,
		req.Type,
		req.ParentID,
		req.ChildID,
		req.Technology,
		req.Platform,
		req.Network,
		req.Manufacturer,
	).Scan(
		&obj.ID,
		&obj.Name,
		&obj.Type,
		&obj.ParentID,
		&obj.ChildID,
		&obj.Technology,
		&obj.Platform,
		&obj.Network,
		&obj.Manufacturer,
		&obj.CreatedAt,
		&obj.UpdatedAt,
	)

	if err != nil {
		slog.Errorf("Failed to create monitoring object: %v", err)
		return nil, fmt.Errorf("failed to create monitoring object: %w", err)
	}

	slog.Infof("Created monitoring object with ID: %s", obj.ID)
	return &obj, nil
}

// GetByID retrieves a monitoring object by its ID
func (r *MonObjectRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.MonObject, error) {
	query := `
		SELECT id, name, type, parent_id, child_id, technology, platform, network, manufacturer, created_at, updated_at
		FROM mon_objects
		WHERE id = $1
	`

	var obj models.MonObject
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&obj.ID,
		&obj.Name,
		&obj.Type,
		&obj.ParentID,
		&obj.ChildID,
		&obj.Technology,
		&obj.Platform,
		&obj.Network,
		&obj.Manufacturer,
		&obj.CreatedAt,
		&obj.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("monitoring object not found")
	}
	if err != nil {
		slog.Errorf("Failed to get monitoring object: %v", err)
		return nil, fmt.Errorf("failed to get monitoring object: %w", err)
	}

	return &obj, nil
}

// GetAll retrieves all monitoring objects with pagination
func (r *MonObjectRepository) GetAll(ctx context.Context, page, pageSize int, filters map[string]string) (*models.MonObjectListResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 1000 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize

	// Build WHERE clause for filters
	whereClauses := []string{}
	args := []interface{}{}
	argPos := 1

	if typeFilter, ok := filters["type"]; ok && typeFilter != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("type = $%d", argPos))
		args = append(args, typeFilter)
		argPos++
	}

	if nameFilter, ok := filters["name"]; ok && nameFilter != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("name ILIKE $%d", argPos))
		args = append(args, "%"+nameFilter+"%")
		argPos++
	}

	if techFilter, ok := filters["technology"]; ok && techFilter != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("technology = $%d", argPos))
		args = append(args, techFilter)
		argPos++
	}

	whereClause := ""
	if len(whereClauses) > 0 {
		whereClause = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	// Count total items
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM mon_objects %s", whereClause)
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		slog.Errorf("Failed to count monitoring objects: %v", err)
		return nil, fmt.Errorf("failed to count monitoring objects: %w", err)
	}

	// Get paginated items
	query := fmt.Sprintf(`
		SELECT id, name, type, parent_id, child_id, technology, platform, network, manufacturer, created_at, updated_at
		FROM mon_objects
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		slog.Errorf("Failed to query monitoring objects: %v", err)
		return nil, fmt.Errorf("failed to query monitoring objects: %w", err)
	}
	defer rows.Close()

	items := []models.MonObject{}
	for rows.Next() {
		var obj models.MonObject
		err := rows.Scan(
			&obj.ID,
			&obj.Name,
			&obj.Type,
			&obj.ParentID,
			&obj.ChildID,
			&obj.Technology,
			&obj.Platform,
			&obj.Network,
			&obj.Manufacturer,
			&obj.CreatedAt,
			&obj.UpdatedAt,
		)
		if err != nil {
			slog.Errorf("Failed to scan monitoring object: %v", err)
			return nil, fmt.Errorf("failed to scan monitoring object: %w", err)
		}
		items = append(items, obj)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating monitoring objects: %w", err)
	}

	totalPages := (total + pageSize - 1) / pageSize

	return &models.MonObjectListResponse{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// Update modifies an existing monitoring object
func (r *MonObjectRepository) Update(ctx context.Context, id uuid.UUID, req *models.UpdateMonObjectRequest) (*models.MonObject, error) {
	// Build dynamic UPDATE query
	setClauses := []string{"updated_at = CURRENT_TIMESTAMP"}
	args := []interface{}{}
	argPos := 1

	if req.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argPos))
		args = append(args, *req.Name)
		argPos++
	}
	if req.Type != nil {
		setClauses = append(setClauses, fmt.Sprintf("type = $%d", argPos))
		args = append(args, *req.Type)
		argPos++
	}
	if req.ParentID != nil {
		setClauses = append(setClauses, fmt.Sprintf("parent_id = $%d", argPos))
		args = append(args, *req.ParentID)
		argPos++
	}
	if req.ChildID != nil {
		setClauses = append(setClauses, fmt.Sprintf("child_id = $%d", argPos))
		args = append(args, *req.ChildID)
		argPos++
	}
	if req.Technology != nil {
		setClauses = append(setClauses, fmt.Sprintf("technology = $%d", argPos))
		args = append(args, *req.Technology)
		argPos++
	}
	if req.Platform != nil {
		setClauses = append(setClauses, fmt.Sprintf("platform = $%d", argPos))
		args = append(args, *req.Platform)
		argPos++
	}
	if req.Network != nil {
		setClauses = append(setClauses, fmt.Sprintf("network = $%d", argPos))
		args = append(args, *req.Network)
		argPos++
	}
	if req.Manufacturer != nil {
		setClauses = append(setClauses, fmt.Sprintf("manufacturer = $%d", argPos))
		args = append(args, *req.Manufacturer)
		argPos++
	}

	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE mon_objects
		SET %s
		WHERE id = $%d
		RETURNING id, name, type, parent_id, child_id, technology, platform, network, manufacturer, created_at, updated_at
	`, strings.Join(setClauses, ", "), argPos)

	var obj models.MonObject
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&obj.ID,
		&obj.Name,
		&obj.Type,
		&obj.ParentID,
		&obj.ChildID,
		&obj.Technology,
		&obj.Platform,
		&obj.Network,
		&obj.Manufacturer,
		&obj.CreatedAt,
		&obj.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("monitoring object not found")
	}
	if err != nil {
		slog.Errorf("Failed to update monitoring object: %v", err)
		return nil, fmt.Errorf("failed to update monitoring object: %w", err)
	}

	slog.Infof("Updated monitoring object with ID: %s", obj.ID)
	return &obj, nil
}

// Delete removes a monitoring object from the database
func (r *MonObjectRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM mon_objects WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		slog.Errorf("Failed to delete monitoring object: %v", err)
		return fmt.Errorf("failed to delete monitoring object: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("monitoring object not found")
	}

	slog.Infof("Deleted monitoring object with ID: %s", id)
	return nil
}
