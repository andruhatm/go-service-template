package models

import (
	"time"
)

// ConnectionType represents the type of connection for metric sources
type ConnectionType string

const (
	ConnectionTypeFTP  ConnectionType = "ftp"
	ConnectionTypeSFTP ConnectionType = "sftp"
	ConnectionTypeHTTP ConnectionType = "http"
	ConnectionTypeFile ConnectionType = "file"
)

// SyncStatus represents the status of the last sync
type SyncStatus string

const (
	SyncStatusPending SyncStatus = "pending"
	SyncStatusSuccess SyncStatus = "success"
	SyncStatusError   SyncStatus = "error"
)

// MetricSource represents a source configuration for importing metrics
type MetricSource struct {
	ID              int            `json:"id"`
	SourceName      string         `json:"source_name"`
	Description     *string        `json:"description,omitempty"`
	ConnectionType  ConnectionType `json:"connection_type"`
	Host            string         `json:"host"`
	FTPPort         int            `json:"FTPport"` // Match frontend field name
	FilePath        string         `json:"file_path"`
	Username        *string        `json:"username,omitempty"`
	Password        *string        `json:"password,omitempty"`
	Schedule        string         `json:"schedule"`
	Enabled         bool           `json:"enabled"`
	LastSyncAt      *time.Time     `json:"last_sync_at,omitempty"`
	LastSyncStatus  *SyncStatus    `json:"last_sync_status,omitempty"`
	LastSyncError   *string        `json:"last_sync_error,omitempty"`
	LastFileHash    *string        `json:"last_file_hash,omitempty"`     // Hash to detect file changes
	LastFileModTime *time.Time     `json:"last_file_mod_time,omitempty"` // File modification time
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	CreatedBy       *string        `json:"created_by,omitempty"`
}

// CreateMetricSourceRequest represents the request body for creating a metric source
type CreateMetricSourceRequest struct {
	SourceName     string         `json:"source_name" validate:"required,min=1,max=255"`
	Description    *string        `json:"description,omitempty"`
	ConnectionType ConnectionType `json:"connection_type" validate:"required,oneof=ftp sftp http file"`
	Host           string         `json:"host" validate:"required,min=1,max=255"`
	FTPPort        int            `json:"FTPport" validate:"required,min=1,max=65535"`
	FilePath       string         `json:"file_path" validate:"required,min=1,max=500"`
	Username       *string        `json:"username,omitempty"`
	Password       *string        `json:"password,omitempty"`
	Schedule       string         `json:"schedule" validate:"required,min=1,max=100"`
	Enabled        *bool          `json:"enabled,omitempty"`
}

// UpdateMetricSourceRequest represents the request body for updating a metric source
type UpdateMetricSourceRequest struct {
	SourceName     *string         `json:"source_name,omitempty" validate:"omitempty,min=1,max=255"`
	Description    *string         `json:"description,omitempty"`
	ConnectionType *ConnectionType `json:"connection_type,omitempty" validate:"omitempty,oneof=ftp sftp http file"`
	Host           *string         `json:"host,omitempty" validate:"omitempty,min=1,max=255"`
	FTPPort        *int            `json:"FTPport,omitempty" validate:"omitempty,min=1,max=65535"`
	FilePath       *string         `json:"file_path,omitempty" validate:"omitempty,min=1,max=500"`
	Username       *string         `json:"username,omitempty"`
	Password       *string         `json:"password,omitempty"`
	Schedule       *string         `json:"schedule,omitempty" validate:"omitempty,min=1,max=100"`
	Enabled        *bool           `json:"enabled,omitempty"`
}

// MetricSourceListResponse represents a list of metric sources
type MetricSourceListResponse struct {
	Items []MetricSource `json:"items"`
	Total int            `json:"total"`
}
