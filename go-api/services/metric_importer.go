package services

import (
	"bufio"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"live/db/victoria"
	"live/models"
	"live/repository"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gookit/slog"
	"github.com/jlaffaye/ftp"
	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

// MetricImporterService handles the periodic import of metrics from configured sources
type MetricImporterService struct {
	repo      *repository.MetricSourceRepository
	vmService *victoria.VictoriaMetricsService
	stopChan  chan struct{}
	wg        sync.WaitGroup
}

// NewMetricImporterService creates a new metric importer service
func NewMetricImporterService(repo *repository.MetricSourceRepository, vmService *victoria.VictoriaMetricsService) *MetricImporterService {
	return &MetricImporterService{
		repo:      repo,
		vmService: vmService,
		stopChan:  make(chan struct{}),
	}
}

// Start begins the metric import service
func (s *MetricImporterService) Start(ctx context.Context) {
	slog.Info("Starting metric importer service")

	// Start a goroutine that checks for sources to sync every minute
	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()

		// Do an initial check immediately
		s.checkAndSyncSources(ctx)

		for {
			select {
			case <-ticker.C:
				s.checkAndSyncSources(ctx)
			case <-s.stopChan:
				slog.Info("Metric importer service stopped")
				return
			case <-ctx.Done():
				slog.Info("Metric importer service context cancelled")
				return
			}
		}
	}()
}

// Stop stops the metric import service
func (s *MetricImporterService) Stop() {
	slog.Info("Stopping metric importer service")
	close(s.stopChan)
	s.wg.Wait()
}

// checkAndSyncSources checks all enabled sources and syncs them if needed
func (s *MetricImporterService) checkAndSyncSources(ctx context.Context) {
	sources, err := s.repo.ListEnabled()
	if err != nil {
		slog.Errorf("Failed to list enabled sources: %v", err)
		return
	}

	for _, source := range sources {
		if s.shouldSync(source) {
			slog.Infof("Syncing source: %s (ID: %d)", source.SourceName, source.ID)
			go s.syncSource(ctx, source)
		}
	}
}

// shouldSync determines if a source should be synced based on its schedule
func (s *MetricImporterService) shouldSync(source *models.MetricSource) bool {
	// If never synced, sync now
	if source.LastSyncAt == nil {
		return true
	}

	// Parse schedule (simple interval parsing, e.g., "5m", "1h", "30s")
	interval, err := s.parseSchedule(source.Schedule)
	if err != nil {
		slog.Errorf("Failed to parse schedule for source %d: %v", source.ID, err)
		return false
	}

	// Check if enough time has passed since last sync
	return time.Since(*source.LastSyncAt) >= interval
}

// parseSchedule parses a schedule string into a duration
// Supports formats like "5m", "1h", "30s", "1m30s"
func (s *MetricImporterService) parseSchedule(schedule string) (time.Duration, error) {
	// Try to parse as duration first
	duration, err := time.ParseDuration(schedule)
	if err == nil {
		return duration, nil
	}

	// If that fails, could implement cron expression parsing here
	// For now, return a default of 5 minutes
	slog.Warnf("Could not parse schedule '%s', using default 5m", schedule)
	return 5 * time.Minute, nil
}

// syncSource synchronizes metrics from a single source
func (s *MetricImporterService) syncSource(ctx context.Context, source *models.MetricSource) {
	// Update status to pending
	status := models.SyncStatusPending
	s.repo.UpdateSyncStatus(source.ID, status, nil)

	// Fetch metrics from source
	metricsData, fileInfo, err := s.fetchMetricsWithInfo(source)
	if err != nil {
		slog.Errorf("Failed to fetch metrics from source %s: %v", source.SourceName, err)
		errorMsg := err.Error()
		s.repo.UpdateSyncStatus(source.ID, models.SyncStatusError, &errorMsg)
		return
	}

	// Calculate file hash to detect changes
	fileHash := s.calculateHash(metricsData)

	// Check if file changed since last import
	if source.LastFileHash != nil && *source.LastFileHash == fileHash {
		slog.Infof("Source %s: File unchanged (hash: %s), skipping import to avoid duplicates",
			source.SourceName, fileHash[:8])
		// Update sync time but keep same status
		s.repo.UpdateSyncStatus(source.ID, models.SyncStatusSuccess, nil)
		return
	}

	// Check modification time for local files
	if fileInfo != nil && source.LastFileModTime != nil {
		if !fileInfo.ModTime().After(*source.LastFileModTime) {
			slog.Infof("Source %s: File not modified, skipping import to avoid duplicates", source.SourceName)
			s.repo.UpdateSyncStatus(source.ID, models.SyncStatusSuccess, nil)
			return
		}
	}

	// Import metrics to VictoriaMetrics
	err = s.vmService.WritePrometheusText(ctx, metricsData)
	if err != nil {
		slog.Errorf("Failed to write metrics to VictoriaMetrics for source %s: %v", source.SourceName, err)
		errorMsg := err.Error()
		s.repo.UpdateSyncStatus(source.ID, models.SyncStatusError, &errorMsg)
		return
	}

	// Update file tracking (hash and mod time)
	if fileInfo != nil {
		s.repo.UpdateFileTracking(source.ID, fileHash, fileInfo.ModTime())
	} else {
		// For remote sources, just update hash
		s.repo.UpdateFileTracking(source.ID, fileHash, time.Now())
	}

	// Update status to success
	slog.Infof("Successfully synced metrics from source %s (hash: %s)", source.SourceName, fileHash[:8])
	s.repo.UpdateSyncStatus(source.ID, models.SyncStatusSuccess, nil)
}

// calculateHash calculates SHA256 hash of the metrics data
func (s *MetricImporterService) calculateHash(data string) string {
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// FileInfo contains metadata about fetched file
type FileInfo struct {
	ModTime time.Time
	Size    int64
}

// fetchMetricsWithInfo fetches metrics and file metadata from a source
func (s *MetricImporterService) fetchMetricsWithInfo(source *models.MetricSource) (string, *FileInfo, error) {
	switch source.ConnectionType {
	case models.ConnectionTypeFTP:
		data, err := s.fetchFromFTP(source)
		return data, nil, err // FTP doesn't provide easy mod time access
	case models.ConnectionTypeSFTP:
		data, err := s.fetchFromSFTP(source)
		return data, nil, err // SFTP would need additional call for file info
	case models.ConnectionTypeHTTP:
		data, err := s.fetchFromHTTP(source)
		return data, nil, err // HTTP Last-Modified could be used but not critical
	case models.ConnectionTypeFile:
		return s.fetchFromFileWithInfo(source)
	default:
		return "", nil, fmt.Errorf("unsupported connection type: %s", source.ConnectionType)
	}
}

// fetchMetrics fetches metrics from a source (legacy method)
func (s *MetricImporterService) fetchMetrics(source *models.MetricSource) (string, error) {
	data, _, err := s.fetchMetricsWithInfo(source)
	return data, err
}

// fetchFromFTP fetches metrics from an FTP server
func (s *MetricImporterService) fetchFromFTP(source *models.MetricSource) (string, error) {
	addr := fmt.Sprintf("%s:%d", source.Host, source.FTPPort)

	// Connect to FTP server
	conn, err := ftp.Dial(addr, ftp.DialWithTimeout(30*time.Second))
	if err != nil {
		return "", fmt.Errorf("failed to connect to FTP server: %w", err)
	}
	defer conn.Quit()

	// Login
	username := "anonymous"
	password := "anonymous"
	if source.Username != nil && *source.Username != "" {
		username = *source.Username
	}
	if source.Password != nil && *source.Password != "" {
		password = *source.Password
	}

	err = conn.Login(username, password)
	if err != nil {
		return "", fmt.Errorf("failed to login to FTP server: %w", err)
	}

	// Retrieve file
	resp, err := conn.Retr(source.FilePath)
	if err != nil {
		return "", fmt.Errorf("failed to retrieve file from FTP: %w", err)
	}
	defer resp.Close()

	// Read file content
	data, err := io.ReadAll(resp)
	if err != nil {
		return "", fmt.Errorf("failed to read FTP file content: %w", err)
	}

	return string(data), nil
}

// fetchFromSFTP fetches metrics from an SFTP server
func (s *MetricImporterService) fetchFromSFTP(source *models.MetricSource) (string, error) {
	addr := fmt.Sprintf("%s:%d", source.Host, source.FTPPort)

	// Setup SSH config
	config := &ssh.ClientConfig{
		User: "anonymous",
		Auth: []ssh.AuthMethod{
			ssh.Password("anonymous"),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         30 * time.Second,
	}

	if source.Username != nil && *source.Username != "" {
		config.User = *source.Username
	}
	if source.Password != nil && *source.Password != "" {
		config.Auth = []ssh.AuthMethod{ssh.Password(*source.Password)}
	}

	// Connect to SSH server
	sshConn, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		return "", fmt.Errorf("failed to connect to SSH server: %w", err)
	}
	defer sshConn.Close()

	// Create SFTP client
	sftpClient, err := sftp.NewClient(sshConn)
	if err != nil {
		return "", fmt.Errorf("failed to create SFTP client: %w", err)
	}
	defer sftpClient.Close()

	// Open file
	file, err := sftpClient.Open(source.FilePath)
	if err != nil {
		return "", fmt.Errorf("failed to open SFTP file: %w", err)
	}
	defer file.Close()

	// Read file content
	data, err := io.ReadAll(file)
	if err != nil {
		return "", fmt.Errorf("failed to read SFTP file content: %w", err)
	}

	return string(data), nil
}

// fetchFromHTTP fetches metrics from an HTTP endpoint
func (s *MetricImporterService) fetchFromHTTP(source *models.MetricSource) (string, error) {
	// Construct URL
	url := fmt.Sprintf("http://%s:%d%s", source.Host, source.FTPPort, source.FilePath)

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Create request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create HTTP request: %w", err)
	}

	// Add basic auth if credentials provided
	if source.Username != nil && source.Password != nil {
		req.SetBasicAuth(*source.Username, *source.Password)
	}

	// Execute request
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to execute HTTP request: %w", err)
	}
	defer resp.Body.Close()

	// Check status code
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP request failed with status: %d", resp.StatusCode)
	}

	// Read response body
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read HTTP response: %w", err)
	}

	return string(data), nil
}

// fetchFromFile fetches metrics from a local file
func (s *MetricImporterService) fetchFromFile(source *models.MetricSource) (string, error) {
	data, _, err := s.fetchFromFileWithInfo(source)
	return data, err
}

// fetchFromFileWithInfo fetches metrics and file info from a local file
func (s *MetricImporterService) fetchFromFileWithInfo(source *models.MetricSource) (string, *FileInfo, error) {
	// Get file info first
	fileInfo, err := os.Stat(source.FilePath)
	if err != nil {
		return "", nil, fmt.Errorf("failed to stat file: %w", err)
	}

	// Open file
	file, err := os.Open(source.FilePath)
	if err != nil {
		return "", nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	// Read file content
	data, err := io.ReadAll(file)
	if err != nil {
		return "", nil, fmt.Errorf("failed to read file content: %w", err)
	}

	info := &FileInfo{
		ModTime: fileInfo.ModTime(),
		Size:    fileInfo.Size(),
	}

	return string(data), info, nil
}

// parsePrometheusMetrics validates and optionally enriches Prometheus format metrics
func (s *MetricImporterService) parsePrometheusMetrics(data string) (string, error) {
	// Basic validation - check if data looks like Prometheus format
	scanner := bufio.NewScanner(strings.NewReader(data))
	var validLines []string

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines and comments (but keep TYPE and HELP comments)
		if line == "" {
			continue
		}
		if strings.HasPrefix(line, "#") {
			validLines = append(validLines, line)
			continue
		}

		// Basic check for metric format: name{labels} value [timestamp]
		// or: name value [timestamp]
		parts := strings.Fields(line)
		if len(parts) >= 2 {
			validLines = append(validLines, line)
		} else {
			slog.Warnf("Skipping invalid metric line: %s", line)
		}
	}

	if err := scanner.Err(); err != nil {
		return "", fmt.Errorf("error reading metrics data: %w", err)
	}

	if len(validLines) == 0 {
		return "", fmt.Errorf("no valid metrics found in data")
	}

	return strings.Join(validLines, "\n"), nil
}
