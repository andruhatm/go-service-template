package repository

import (
	"database/sql"
	"fmt"
	"live/models"
	"time"

	"github.com/gookit/slog"
)

// NotificationRepository handles database operations for notifications
type NotificationRepository struct {
	db *sql.DB
}

// NewNotificationRepository creates a new notification repository
func NewNotificationRepository(db *sql.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

// Create creates a new notification
func (r *NotificationRepository) Create(notification *models.Notification) error {
	query := `
		INSERT INTO notifications (user_id, type, title, message, related_id, related_type, status, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`

	err := r.db.QueryRow(
		query,
		notification.UserID,
		notification.Type,
		notification.Title,
		notification.Message,
		notification.RelatedID,
		notification.RelatedType,
		models.NotificationStatusUnread,
		notification.ExpiresAt,
	).Scan(&notification.ID, &notification.CreatedAt)

	if err != nil {
		slog.Errorf("Failed to create notification: %v", err)
		return err
	}

	notification.Status = models.NotificationStatusUnread
	return nil
}

// GetByID retrieves a notification by ID
func (r *NotificationRepository) GetByID(id string) (*models.Notification, error) {
	query := `
		SELECT id, user_id, type, title, message, related_id, related_type, status, created_at, read_at, expires_at
		FROM notifications
		WHERE id = $1
	`

	notification := &models.Notification{}
	err := r.db.QueryRow(query, id).Scan(
		&notification.ID,
		&notification.UserID,
		&notification.Type,
		&notification.Title,
		&notification.Message,
		&notification.RelatedID,
		&notification.RelatedType,
		&notification.Status,
		&notification.CreatedAt,
		&notification.ReadAt,
		&notification.ExpiresAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("notification not found")
	}
	if err != nil {
		slog.Errorf("Failed to get notification: %v", err)
		return nil, err
	}

	return notification, nil
}

// List retrieves notifications for a specific user with pagination
func (r *NotificationRepository) List(userID string, limit, offset int) ([]*models.Notification, error) {
	query := `
		SELECT id, user_id, type, title, message, related_id, related_type, status, created_at, read_at, expires_at
		FROM notifications
		WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		slog.Errorf("Failed to list notifications: %v", err)
		return nil, err
	}
	defer rows.Close()

	var notifications []*models.Notification
	for rows.Next() {
		notification := &models.Notification{}
		err := rows.Scan(
			&notification.ID,
			&notification.UserID,
			&notification.Type,
			&notification.Title,
			&notification.Message,
			&notification.RelatedID,
			&notification.RelatedType,
			&notification.Status,
			&notification.CreatedAt,
			&notification.ReadAt,
			&notification.ExpiresAt,
		)
		if err != nil {
			slog.Errorf("Failed to scan notification: %v", err)
			continue
		}
		notifications = append(notifications, notification)
	}

	return notifications, nil
}

// ListUnread retrieves unread notifications for a specific user
func (r *NotificationRepository) ListUnread(userID string, limit int) ([]*models.Notification, error) {
	query := `
		SELECT id, user_id, type, title, message, related_id, related_type, status, created_at, read_at, expires_at
		FROM notifications
		WHERE user_id = $1 AND status = $2 AND (expires_at IS NULL OR expires_at > NOW())
		ORDER BY created_at DESC
		LIMIT $3
	`

	rows, err := r.db.Query(query, userID, models.NotificationStatusUnread, limit)
	if err != nil {
		slog.Errorf("Failed to list unread notifications: %v", err)
		return nil, err
	}
	defer rows.Close()

	var notifications []*models.Notification
	for rows.Next() {
		notification := &models.Notification{}
		err := rows.Scan(
			&notification.ID,
			&notification.UserID,
			&notification.Type,
			&notification.Title,
			&notification.Message,
			&notification.RelatedID,
			&notification.RelatedType,
			&notification.Status,
			&notification.CreatedAt,
			&notification.ReadAt,
			&notification.ExpiresAt,
		)
		if err != nil {
			slog.Errorf("Failed to scan notification: %v", err)
			continue
		}
		notifications = append(notifications, notification)
	}

	return notifications, nil
}

// Count returns the total number of notifications for a user
func (r *NotificationRepository) Count(userID string) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM notifications
		WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
	`

	var count int
	err := r.db.QueryRow(query, userID).Scan(&count)
	if err != nil {
		slog.Errorf("Failed to count notifications: %v", err)
		return 0, err
	}

	return count, nil
}

// CountUnread returns the number of unread notifications for a user
func (r *NotificationRepository) CountUnread(userID string) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM notifications
		WHERE user_id = $1 AND status = $2 AND (expires_at IS NULL OR expires_at > NOW())
	`

	var count int
	err := r.db.QueryRow(query, userID, models.NotificationStatusUnread).Scan(&count)
	if err != nil {
		slog.Errorf("Failed to count unread notifications: %v", err)
		return 0, err
	}

	return count, nil
}

// Update updates a notification
func (r *NotificationRepository) Update(id string, req *models.NotificationUpdateRequest) error {
	query := `
		UPDATE notifications
		SET status = COALESCE($1, status),
		    read_at = COALESCE($2, read_at)
		WHERE id = $3
	`

	result, err := r.db.Exec(query, req.Status, req.ReadAt, id)
	if err != nil {
		slog.Errorf("Failed to update notification: %v", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("notification not found")
	}

	return nil
}

// MarkAsRead marks a notification as read
func (r *NotificationRepository) MarkAsRead(id, userID string) error {
	now := time.Now()
	query := `
		UPDATE notifications
		SET status = $1, read_at = $2
		WHERE id = $3 AND user_id = $4
	`

	result, err := r.db.Exec(query, models.NotificationStatusRead, now, id, userID)
	if err != nil {
		slog.Errorf("Failed to mark notification as read: %v", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("notification not found or unauthorized")
	}

	return nil
}

// MarkAllAsRead marks all unread notifications as read for a user
func (r *NotificationRepository) MarkAllAsRead(userID string) error {
	now := time.Now()
	query := `
		UPDATE notifications
		SET status = $1, read_at = $2
		WHERE user_id = $3 AND status = $4
	`

	_, err := r.db.Exec(query, models.NotificationStatusRead, now, userID, models.NotificationStatusUnread)
	if err != nil {
		slog.Errorf("Failed to mark all notifications as read: %v", err)
		return err
	}

	return nil
}

// Delete deletes a notification
func (r *NotificationRepository) Delete(id, userID string) error {
	query := `DELETE FROM notifications WHERE id = $1 AND user_id = $2`

	result, err := r.db.Exec(query, id, userID)
	if err != nil {
		slog.Errorf("Failed to delete notification: %v", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("notification not found or unauthorized")
	}

	return nil
}

// DeleteExpired deletes expired notifications
func (r *NotificationRepository) DeleteExpired() error {
	query := `DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < NOW()`

	result, err := r.db.Exec(query)
	if err != nil {
		slog.Errorf("Failed to delete expired notifications: %v", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err == nil {
		slog.Infof("Deleted %d expired notifications", rowsAffected)
	}

	return nil
}
