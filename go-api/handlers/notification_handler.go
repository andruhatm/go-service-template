package handlers

import (
	"encoding/json"
	"live/middleware"
	"live/models"
	"live/repository"
	"net/http"
	"strconv"
	"time"

	"github.com/gookit/slog"
	"github.com/gorilla/mux"
)

// NotificationHandler handles notification-related HTTP requests
type NotificationHandler struct {
	repo *repository.NotificationRepository
}

// NewNotificationHandler creates a new notification handler
func NewNotificationHandler(repo *repository.NotificationRepository) *NotificationHandler {
	return &NotificationHandler{repo: repo}
}

// CreateNotification creates a new notification
func (h *NotificationHandler) CreateNotification(w http.ResponseWriter, r *http.Request) {
	var req models.NotificationCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if req.UserID == "" || req.Type == "" || req.Title == "" || req.Message == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	notification := &models.Notification{
		UserID:      req.UserID,
		Type:        req.Type,
		Title:       req.Title,
		Message:     req.Message,
		RelatedID:   req.RelatedID,
		RelatedType: req.RelatedType,
		ExpiresAt:   req.ExpiresAt,
	}

	if err := h.repo.Create(notification); err != nil {
		slog.Errorf("Failed to create notification: %v", err)
		http.Error(w, "Failed to create notification", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(notification)
}

// GetNotification retrieves a specific notification
func (h *NotificationHandler) GetNotification(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	notification, err := h.repo.GetByID(id)
	if err != nil {
		http.Error(w, "Notification not found", http.StatusNotFound)
		return
	}

	// Check ownership
	userID := middleware.GetUserID(r.Context())
	if notification.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notification)
}

// ListNotifications lists notifications for the current user
func (h *NotificationHandler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse pagination parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50 // default
	offset := 0

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	notifications, err := h.repo.List(userID, limit, offset)
	if err != nil {
		slog.Errorf("Failed to list notifications: %v", err)
		http.Error(w, "Failed to retrieve notifications", http.StatusInternalServerError)
		return
	}

	total, err := h.repo.Count(userID)
	if err != nil {
		slog.Errorf("Failed to count notifications: %v", err)
		total = 0
	}

	unreadCount, err := h.repo.CountUnread(userID)
	if err != nil {
		slog.Errorf("Failed to count unread notifications: %v", err)
		unreadCount = 0
	}

	response := map[string]interface{}{
		"notifications": notifications,
		"total":         total,
		"unread_count":  unreadCount,
		"limit":         limit,
		"offset":        offset,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// ListUnreadNotifications lists unread notifications for the current user
func (h *NotificationHandler) ListUnreadNotifications(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse limit parameter
	limitStr := r.URL.Query().Get("limit")
	limit := 20 // default

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 50 {
			limit = l
		}
	}

	notifications, err := h.repo.ListUnread(userID, limit)
	if err != nil {
		slog.Errorf("Failed to list unread notifications: %v", err)
		http.Error(w, "Failed to retrieve notifications", http.StatusInternalServerError)
		return
	}

	unreadCount, err := h.repo.CountUnread(userID)
	if err != nil {
		slog.Errorf("Failed to count unread notifications: %v", err)
		unreadCount = 0
	}

	response := map[string]interface{}{
		"notifications": notifications,
		"unread_count":  unreadCount,
		"limit":         limit,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// MarkAsRead marks a notification as read
func (h *NotificationHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.repo.MarkAsRead(id, userID); err != nil {
		slog.Errorf("Failed to mark notification as read: %v", err)
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// MarkAllAsRead marks all notifications as read for the current user
func (h *NotificationHandler) MarkAllAsRead(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.repo.MarkAllAsRead(userID); err != nil {
		slog.Errorf("Failed to mark all notifications as read: %v", err)
		http.Error(w, "Failed to mark notifications as read", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DeleteNotification deletes a notification
func (h *NotificationHandler) DeleteNotification(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.repo.Delete(id, userID); err != nil {
		slog.Errorf("Failed to delete notification: %v", err)
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// CreateForecastNotification is a helper function to create forecast-related notifications
func (h *NotificationHandler) CreateForecastNotification(userID, notificationType, forecastID string, forecast *models.Forecast) error {
	var title, message string
	var expiresAt *time.Time

	// Set expiration to 7 days from now
	expiresTime := time.Now().Add(7 * 24 * time.Hour)
	expiresAt = &expiresTime

	relatedType := "forecast"

	switch notificationType {
	case models.NotificationTypeForecastCreated:
		title = "Прогноз создан"
		message = "Ваш запрос на прогнозирование метрики " + forecast.MetricName + " для объекта " + forecast.MonObjectName + " был успешно создан и отправлен на обработку."
	case models.NotificationTypeForecastProcessing:
		title = "Прогноз в обработке"
		message = "Прогнозирование метрики " + forecast.MetricName + " для объекта " + forecast.MonObjectName + " началось."
	case models.NotificationTypeForecastCompleted:
		title = "Прогноз готов"
		message = "Прогнозирование метрики " + forecast.MetricName + " для объекта " + forecast.MonObjectName + " успешно завершено. Результаты доступны для просмотра."
	case models.NotificationTypeForecastFailed:
		title = "Ошибка прогноза"
		message = "Не удалось выполнить прогнозирование метрики " + forecast.MetricName + " для объекта " + forecast.MonObjectName + "."
		if forecast.ErrorMessage != nil {
			message += " Причина: " + *forecast.ErrorMessage
		}
	default:
		return nil
	}

	notification := &models.Notification{
		UserID:      userID,
		Type:        notificationType,
		Title:       title,
		Message:     message,
		RelatedID:   &forecastID,
		RelatedType: &relatedType,
		ExpiresAt:   expiresAt,
	}

	return h.repo.Create(notification)
}
