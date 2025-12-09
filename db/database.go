package db

import (
	"context"
)

// DBService определяет общие операции для работы с базами данных
type DBService interface {
	Close() error
	Execute(ctx context.Context, query string, args ...interface{}) (Result, error)
	Query(ctx context.Context, query string, args ...interface{}) (Rows, error)
	// Добавьте другие методы по мере необходимости, например, для транзакций
}

// Result представляет результат выполнения команды (например, количество затронутых строк)
type Result interface {
	RowsAffected() (int64, error)
	LastInsertId() (int64, error)
}

// Rows представляет набор строк, возвращенных запросом
type Rows interface {
	Next() bool
	Scan(dest ...interface{}) error
	Close() error
	Err() error
}
