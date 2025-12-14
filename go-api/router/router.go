package router

import (
	"live/middleware"
	"net/http"

	"github.com/gookit/slog"
	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func GenerateServeMux(authMiddleware middleware.AuthMiddleware) *mux.Router {

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

	keycloakRouter := sm.Methods("GET").Subrouter()
	// Public routes
	keycloakRouter.HandleFunc("/public", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Public endpoint"))
	}).Methods("GET")
	// Protected routes
	protected := keycloakRouter.PathPrefix("/api").Subrouter()
	protected.Use(authMiddleware.Middleware)

	// Роут с проверкой роли админа
	protected.HandleFunc("/admin", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:admin") {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		w.Write([]byte("Admin endpoint"))
	}).Methods("GET")

	// Роут с проверкой роли оператора
	protected.HandleFunc("/operator", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:operator") {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		w.Write([]byte("Operator endpoint"))
	}).Methods("GET")

	// Роут для мониторинга
	protected.HandleFunc("/monitoring", func(w http.ResponseWriter, r *http.Request) {
		if !middleware.HasRole(r.Context(), "realm:monitor") {
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

	buisinessRouter := sm.Methods("GET").Subrouter()
	buisinessRouter.HandleFunc("/buisiness/saveObj", func(w http.ResponseWriter, r *http.Request) {

		w.WriteHeader(http.StatusCreated)
		_, err := w.Write([]byte("ok"))
		if err != nil {
			slog.Fatal(err)
		}
	})

	//prometheus endpoint
	sm.Handle("/metrics", promhttp.Handler())

	return sm
}
