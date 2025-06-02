package main

import (
	"context"
	"fmt"
	"github.com/gookit/slog"
	"live/configuration"
	r "live/router"
	"net/http"
	"os"
	"os/signal"
	"time"
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
