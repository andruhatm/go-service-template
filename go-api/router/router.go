package router

import (
	"live/configuration"
	adminhandlers "live/handlers"
	"live/middleware"
	"net/http"

	"github.com/gookit/slog"
	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func GenerateServeMux(authMiddleware middleware.AuthMiddleware, cfg configuration.Configuration) http.Handler {

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
