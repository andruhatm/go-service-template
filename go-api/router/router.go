package router

import (
	"database/sql"
	"live/configuration"
	"live/db/victoria"
	adminhandlers "live/handlers"
	"live/middleware"
	"live/repository"
	"net/http"

	"github.com/gookit/slog"
	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func GenerateServeMux(authMiddleware middleware.AuthMiddleware, cfg configuration.Configuration, db *sql.DB, vmService *victoria.VictoriaMetricsService) http.Handler {

	sm := mux.NewRouter()
	probesRouter := sm.Methods("GET").Subrouter()
	probesRouter.HandleFunc("/probes/readiness", func(w http.ResponseWriter, r *http.Request) {
		_, err := w.Write([]byte("ok"))
		if err != nil {
			slog.Fatal(err)
		}
	})
	probesRouter.HandleFunc("/probes/liveness", func(w http.ResponseWriter, r *http.Request) {
		_, err := w.Write([]byte("ok"))
		if err != nil {
			slog.Fatal(err)
		}
	})

	// Public routes
	sm.HandleFunc("/public", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Public endpoint"))
	}).Methods("GET")

	// Initialize monitoring objects handler (needed for both public and protected routes)
	monObjectRepo := repository.NewMonObjectRepository(db)
	monObjectHandler := adminhandlers.NewMonObjectHandler(monObjectRepo)

	// Initialize metrics catalog handler
	metricCatalogRepo := repository.NewMetricCatalogRepository(db)
	metricCatalogHandler := adminhandlers.NewMetricCatalogHandler(metricCatalogRepo)

	// Initialize dashboard handler
	dashboardRepo := repository.NewDashboardRepository(db)
	dashboardHandler := adminhandlers.NewDashboardHandler(dashboardRepo)

	// Initialize metrics query handler
	metricsQueryHandler := adminhandlers.NewMetricsQueryHandler(vmService)

	// Initialize forecast handler
	forecastRepo := repository.NewForecastRepository(db)
	forecastHandler := adminhandlers.NewForecastHandler(forecastRepo, cfg.ForecastCfg.URL)

	// Initialize notification handler
	notificationRepo := repository.NewNotificationRepository(db)
	notificationHandler := adminhandlers.NewNotificationHandler(notificationRepo)

	// Pass notification handler to forecast handler
	forecastHandler.SetNotificationHandler(notificationHandler)

	// Public read-only monitoring objects endpoints (for development/testing)
	// TODO: Remove or restrict in production
	sm.HandleFunc("/api/mon-objects", monObjectHandler.ListMonObjects).Methods("GET")
	sm.HandleFunc("/api/mon-objects/{id}", monObjectHandler.GetMonObject).Methods("GET")

	// Public read-only metrics catalog endpoints
	sm.HandleFunc("/api/metrics-catalog", metricCatalogHandler.ListMetrics).Methods("GET")
	sm.HandleFunc("/api/metrics-catalog/groups", metricCatalogHandler.GetGroups).Methods("GET")
	sm.HandleFunc("/api/metrics-catalog/{id}", metricCatalogHandler.GetMetric).Methods("GET")

	// Public read-only dashboards endpoints
	sm.HandleFunc("/api/dashboards", dashboardHandler.ListDashboards).Methods("GET")
	sm.HandleFunc("/api/dashboards/{id}", dashboardHandler.GetDashboard).Methods("GET")

	// Public metrics query endpoints
	sm.HandleFunc("/api/metrics/query", metricsQueryHandler.QueryMetrics).Methods("POST")
	sm.HandleFunc("/api/metrics/query", metricsQueryHandler.QueryMetricsGet).Methods("GET")
	sm.HandleFunc("/api/metrics/query-instant", metricsQueryHandler.QueryMetricsInstant).Methods("GET")

	// Protected routes
	protected := sm.PathPrefix("/api").Subrouter()
	protected.Use(authMiddleware.Middleware)

	// Initialize admin handler with both configs
	adminHandler := adminhandlers.NewAdminHandler(cfg.KeycloakCfg, cfg.KeycloakAdminCfg)

	// Роут с проверкой роли админа
	protected.HandleFunc("/admin", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:ROLE_ADMIN") {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		w.Write([]byte("Admin endpoint"))
	}).Methods("GET")

	// Keycloak statistics endpoint for admin panel
	protected.HandleFunc("/admin/keycloak-stats", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:ROLE_ADMIN") {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		adminHandler.GetKeycloakStats(w, r)
	}).Methods("GET")

	// Роут с проверкой роли оператора
	protected.HandleFunc("/operator", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:ROLE_OPERATOR") {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		w.Write([]byte("Operator endpoint"))
	}).Methods("GET")

	// Роут для мониторинга
	protected.HandleFunc("/monitoring", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:ROLE_MONITOR") {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		w.Write([]byte("Monitoring endpoint"))
	}).Methods("GET")

	// Роут с user ID
	protected.HandleFunc("/me", func(w http.ResponseWriter, r *http.Request) {
		userID := middleware.GetUserID(r.Context())
		w.Write([]byte("User ID: " + userID))
	}).Methods("GET")

	// Monitoring Objects CRUD endpoints (protected - Create, Update, Delete - ROLE_ADMIN only)
	protected.HandleFunc("/mon-objects", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:ROLE_ADMIN") {
			http.Error(w, "Forbidden: ROLE_ADMIN required", http.StatusForbidden)
			return
		}
		monObjectHandler.CreateMonObject(w, r)
	}).Methods("POST")

	protected.HandleFunc("/mon-objects/{id}", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:ROLE_ADMIN") {
			http.Error(w, "Forbidden: ROLE_ADMIN required", http.StatusForbidden)
			return
		}
		monObjectHandler.UpdateMonObject(w, r)
	}).Methods("PUT")

	protected.HandleFunc("/mon-objects/{id}", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:ROLE_ADMIN") {
			http.Error(w, "Forbidden: ROLE_ADMIN required", http.StatusForbidden)
			return
		}
		monObjectHandler.DeleteMonObject(w, r)
	}).Methods("DELETE")

	// Metrics Catalog CRUD endpoints (protected - Create, Update, Delete - ROLE_ADMIN only)
	protected.HandleFunc("/metrics-catalog", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:ROLE_ADMIN") {
			http.Error(w, "Forbidden: ROLE_ADMIN required", http.StatusForbidden)
			return
		}
		metricCatalogHandler.CreateMetric(w, r)
	}).Methods("POST")

	protected.HandleFunc("/metrics-catalog/{id}", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:ROLE_ADMIN") {
			http.Error(w, "Forbidden: ROLE_ADMIN required", http.StatusForbidden)
			return
		}
		metricCatalogHandler.UpdateMetric(w, r)
	}).Methods("PUT")

	protected.HandleFunc("/metrics-catalog/{id}", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:ROLE_ADMIN") {
			http.Error(w, "Forbidden: ROLE_ADMIN required", http.StatusForbidden)
			return
		}
		metricCatalogHandler.DeleteMetric(w, r)
	}).Methods("DELETE")

	// Dashboards CRUD endpoints
	// Create dashboard - Allow any authenticated user to create their own dashboard
	protected.HandleFunc("/dashboards", func(w http.ResponseWriter, r *http.Request) {
		// Users can create dashboards for themselves
		// Admins can create dashboards for any user
		dashboardHandler.CreateDashboard(w, r)
	}).Methods("POST")

	// Update dashboard - Allow users to update their own dashboards, admins can update any
	protected.HandleFunc("/dashboards/{id}", func(w http.ResponseWriter, r *http.Request) {
		dashboardHandler.UpdateDashboard(w, r)
	}).Methods("PUT")

	protected.HandleFunc("/dashboards/{id}", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:ROLE_ADMIN") {
			http.Error(w, "Forbidden: ROLE_ADMIN required", http.StatusForbidden)
			return
		}
		dashboardHandler.DeleteDashboard(w, r)
	}).Methods("DELETE")

	// Forecast endpoints
	// Create forecast - Any authenticated user can create a forecast
	protected.HandleFunc("/forecasts", forecastHandler.CreateForecast).Methods("POST")

	// List forecasts - Users see their own, admins see all
	protected.HandleFunc("/forecasts", forecastHandler.ListForecasts).Methods("GET")

	// List all forecasts - Admin only
	protected.HandleFunc("/forecasts/all", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:ROLE_ADMIN") {
			http.Error(w, "Forbidden: ROLE_ADMIN required", http.StatusForbidden)
			return
		}
		forecastHandler.ListAllForecasts(w, r)
	}).Methods("GET")

	// Get specific forecast
	protected.HandleFunc("/forecasts/{id}", forecastHandler.GetForecast).Methods("GET")

	// Delete forecast - Users can delete their own, admins can delete any
	protected.HandleFunc("/forecasts/{id}", forecastHandler.DeleteForecast).Methods("DELETE")

	// Notification endpoints
	// List all notifications for current user
	protected.HandleFunc("/notifications", notificationHandler.ListNotifications).Methods("GET")

	// List unread notifications for current user
	protected.HandleFunc("/notifications/unread", notificationHandler.ListUnreadNotifications).Methods("GET")

	// Get specific notification
	protected.HandleFunc("/notifications/{id}", notificationHandler.GetNotification).Methods("GET")

	// Mark notification as read
	protected.HandleFunc("/notifications/{id}/read", notificationHandler.MarkAsRead).Methods("PUT")

	// Mark all notifications as read
	protected.HandleFunc("/notifications/mark-all-read", notificationHandler.MarkAllAsRead).Methods("PUT")

	// Delete notification
	protected.HandleFunc("/notifications/{id}", notificationHandler.DeleteNotification).Methods("DELETE")

	// Create notification (for system use, admins only)
	protected.HandleFunc("/notifications", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:ROLE_ADMIN") {
			http.Error(w, "Forbidden: ROLE_ADMIN required", http.StatusForbidden)
			return
		}
		notificationHandler.CreateNotification(w, r)
	}).Methods("POST")

	// Business routes
	sm.HandleFunc("/buisiness/saveObj", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusCreated)
		_, err := w.Write([]byte("ok"))
		if err != nil {
			slog.Fatal(err)
		}
	}).Methods("GET")

	//prometheus endpoint
	sm.Handle("/metrics", promhttp.Handler())

	// Add CORS middleware
	return middleware.CORSMiddleware(sm)
}
