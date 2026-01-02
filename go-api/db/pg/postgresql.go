package pg

import (
	"context"
	"database/sql"
	"live/db"

	_ "github.com/lib/pq"
)

// PostgreSQLService реализует DBService для PostgreSQL
type PostgreSQLService struct {
	db *sql.DB
}

// NewPostgreSQLService устанавливает соединение с базой данных PostgreSQL
func NewPostgreSQLService(connectionString string) (*PostgreSQLService, error) {
	db, err := sql.Open("postgres", connectionString)
	if err != nil {
		return nil, err
	}
	return &PostgreSQLService{db: db}, nil
}

// Close закрывает соединение с базой данных
func (s *PostgreSQLService) Close() error {
	if s.db != nil {
		return s.db.Close()
	}
	return nil
}

// GetDB returns the underlying sql.DB connection for advanced operations like migrations
func (s *PostgreSQLService) GetDB() *sql.DB {
	return s.db
}

// Execute выполняет команду (INSERT, UPDATE, DELETE) и возвращает результат
func (s *PostgreSQLService) Execute(ctx context.Context, query string, args ...interface{}) (db.Result, error) {
	res, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	return &sqlResult{res}, nil // Обернем sql.Result в наш интерфейс Result
}

// Query выполняет запрос (SELECT) и возвращает строки
func (s *PostgreSQLService) Query(ctx context.Context, query string, args ...interface{}) (db.Rows, error) {
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	return &sqlRows{rows}, nil // Обернем sql.Rows в наш интерфейс Rows
}

// sqlResult реализует наш интерфейс Result для sql.Result
type sqlResult struct {
	res sql.Result
}

func (r *sqlResult) RowsAffected() (int64, error) {
	return r.res.RowsAffected()
}

func (r *sqlResult) LastInsertId() (int64, error) {
	// PostgreSQL обычно не возвращает LastInsertId таким образом для всех таблиц.
	// Для получения ID вставки нужно использовать `RETURNING id`.
	// В данном случае, это может быть не применимо напрямую или потребовать дополнительной логики.
	return 0, nil // Или возвращаем ошибку, если это не поддерживается/не используется.
}

// sqlRows реализует наш интерфейс Rows для sql.Rows
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
