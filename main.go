package main

import (
	"context"
	"fmt"
	"live/configuration"
	"live/db/pg"
	"live/db/sqlite"
	"live/db/victoria"
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
	cfg, err := configuration.InitConfiguration("./configuration.yaml")
	if err != nil {
		slog.Fatal(err)
		panic(err)
	}
	slog.Debugf("%s Configuration values passed: %+v", appPref, cfg)

	// init db's

	//1 postgres
	pgConnStr := "user=user password=password host=localhost port=5432 dbname=mydb sslmode=disable"
	pgService, err := pg.NewPostgreSQLService(pgConnStr)
	if err != nil {
		slog.Fatalf("Ошибка подключения к PostgreSQL: %v", err)
	}
	defer pgService.Close()
	fmt.Println("Подключено к PostgreSQL")

	//2 sqlite
	sqliteSvc, err := sqlite.NewSQLiteService(fmt.Sprintf("file:%s?_busy_timeout=5000&_journal_mode=WAL", cfg.SqliteCfg.Path))
	if err != nil {
		slog.Fatalf("Ошибка подключения к SQLite: %v", err)
	}
	defer sqliteSvc.Close()

	//3 VictoriaMetrics
	vmService, err := victoria.NewVictoriaMetricsService(fmt.Sprintf("%s", cfg.VictoriaCfg.URL), 10*time.Second)
	if err != nil {
		fmt.Printf("Ошибка при создании VictoriaMetricsService: %v\n", err)
		return
	}
	defer vmService.Close()

	// init traces

	// init router
	router := r.GenerateServeMux()

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
