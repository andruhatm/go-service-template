package main

import (
	"context"
	"fmt"
	"live/configuration"
	"live/db/pg"
	"live/db/victoria"
	"live/middleware"
	r "live/router"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/gookit/slog"
)

const appPref = "test:"

func main() {

	// init logs
	slog.Configure(func(logger *slog.SugaredLogger) {
		f := logger.Formatter.(*slog.TextFormatter)
		f.EnableColor = true
	})

	// config Init
	cfg, err := configuration.InitConfiguration("./configuration.local.yaml")
	if err != nil {
		slog.Fatal(err)
		panic(err)
	}
	slog.Debugf("%s Configuration values passed: %+v", appPref, cfg)

	// init db's
	//1 postgres
	pgConnStr := fmt.Sprintf("user=%s password=%s host=%s port=%s dbname=%s sslmode=disable",
		cfg.PostgresCfg[0].User,
		cfg.PostgresCfg[0].Password,
		cfg.PostgresCfg[0].Host,
		cfg.PostgresCfg[0].Port,
		cfg.PostgresCfg[0].Database)
	pgService, err := pg.NewPostgreSQLService(pgConnStr)
	if err != nil {
		slog.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer pgService.Close()
	slog.Info("Connected to PostgreSQL successfully")

	//2 VictoriaMetrics
	vmService, err := victoria.NewVictoriaMetricsService(cfg.VictoriaCfg.URL, 10*time.Second)
	if err != nil {
		slog.Fatalf("Failed to create VictoriaMetricsService: %v", err)
	}
	defer vmService.Close()
	slog.Info("Connected to VictoriaMetrics successfully")

	// init keycloak middleware
	authMiddleware, err := middleware.NewAuthMiddleware(cfg.KeycloakCfg)
	if err != nil {
		slog.Fatal("Failed to create auth middleware:", err)
	}

	// init router
	router := r.GenerateServeMux(*authMiddleware, cfg)

	// run server
	s := &http.Server{
		Addr:         fmt.Sprintf("%s:%s", cfg.Api.Host, cfg.Api.Port),
		Handler:      router,
		TLSConfig:    nil,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		slog.Printf("Starting server at %s", cfg.Api.Port)
		err := s.ListenAndServe()
		if err != nil {
			slog.Fatal(err)
		}
	}()

	// graceful shutdown
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt)
	signal.Notify(sigCh, os.Kill)

	sig := <-sigCh
	slog.Println("Got signal:", sig)

	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	err = s.Shutdown(ctx)
	if err != nil {
		slog.Fatal(err)
		return
	}

	time.Sleep(5 * time.Second)
}
