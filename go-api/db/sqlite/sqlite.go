package sqlite

import (
	"context"
	"database/sql"
	"live/db"

	_ "github.com/mattn/go-sqlite3"
)

type SQLiteService struct {
	db *sql.DB
}

func NewSQLiteService(dsn string) (*SQLiteService, error) {
	// dsn — путь к файлу, например "./data.db" или "file::memory:?cache=shared"
	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, err
	}
	// Опционально: установить параметры (timeout, busy_timeout) в dsn
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}
	return &SQLiteService{db: db}, nil
}

func (s *SQLiteService) Close() error {
	if s.db != nil {
		return s.db.Close()
	}
	return nil
}
func (s *SQLiteService) Execute(ctx context.Context, query string, args ...interface{}) (db.Result, error) {
	res, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	return &sqlResult{res: res}, nil
}
func (s *SQLiteService) Query(ctx context.Context, query string, args ...interface{}) (db.Rows, error) {
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	return &sqlRows{rows: rows}, nil
}

// Adapters for Result and Rows over database/sql
type sqlResult struct {
	res sql.Result
}

func (r *sqlResult) RowsAffected() (int64, error) {
	return r.res.RowsAffected()
}
func (r *sqlResult) LastInsertId() (int64, error) {
	return r.res.LastInsertId()
}

type sqlRows struct {
	rows *sql.Rows
}

func (r *sqlRows) Next() bool {
	return r.rows.Next()
}
func (r *sqlRows) Scan(dest ...interface{}) error {
	return r.rows.Scan(dest...)
}
func (r *sqlRows) Close() error {
	return r.rows.Close()
}
func (r *sqlRows) Err() error {
	return r.rows.Err()
}
