package router

import (
	"github.com/gookit/slog"
	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"net/http"
)

func GenerateServeMux() *mux.Router {
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
