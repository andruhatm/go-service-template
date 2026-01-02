package db

import (
	"database/sql"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/gookit/slog"
)

// MigrationService handles database migrations
type MigrationService struct {
	db            *sql.DB
	migrationsDir string
}

// NewMigrationService creates a new migration service
func NewMigrationService(db *sql.DB, migrationsDir string) *MigrationService {
	return &MigrationService{
		db:            db,
		migrationsDir: migrationsDir,
	}
}

// RunMigrations executes all pending migrations
func (m *MigrationService) RunMigrations() error {
	driver, err := postgres.WithInstance(m.db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("failed to create migration driver: %w", err)
	}

	migration, err := migrate.NewWithDatabaseInstance(
		fmt.Sprintf("file://%s", m.migrationsDir),
		"postgres",
		driver,
	)
	if err != nil {
		return fmt.Errorf("failed to create migration instance: %w", err)
	}

	// Run all pending migrations
	if err := migration.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	version, dirty, err := migration.Version()
	if err != nil && err != migrate.ErrNilVersion {
		return fmt.Errorf("failed to get migration version: %w", err)
	}

	if err == migrate.ErrNilVersion {
		slog.Info("No migrations applied yet")
	} else {
		slog.Infof("Current migration version: %d (dirty: %v)", version, dirty)
	}

	return nil
}

// Rollback rolls back the last migration
func (m *MigrationService) Rollback() error {
	driver, err := postgres.WithInstance(m.db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("failed to create migration driver: %w", err)
	}

	migration, err := migrate.NewWithDatabaseInstance(
		fmt.Sprintf("file://%s", m.migrationsDir),
		"postgres",
		driver,
	)
	if err != nil {
		return fmt.Errorf("failed to create migration instance: %w", err)
	}

	if err := migration.Down(); err != nil {
		return fmt.Errorf("failed to rollback migration: %w", err)
	}

	slog.Info("Migration rolled back successfully")
	return nil
}

// MigrateTo migrates to a specific version
func (m *MigrationService) MigrateTo(version uint) error {
	driver, err := postgres.WithInstance(m.db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("failed to create migration driver: %w", err)
	}

	migration, err := migrate.NewWithDatabaseInstance(
		fmt.Sprintf("file://%s", m.migrationsDir),
		"postgres",
		driver,
	)
	if err != nil {
		return fmt.Errorf("failed to create migration instance: %w", err)
	}

	if err := migration.Migrate(version); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to migrate to version %d: %w", version, err)
	}

	slog.Infof("Migrated to version: %d", version)
	return nil
}
