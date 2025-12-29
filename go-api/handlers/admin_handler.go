package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"live/configuration"
	"net/http"
	"strings"
	"time"

	"github.com/gookit/slog"
)

type KeycloakStats struct {
	TotalUsers      int    `json:"totalUsers"`
	ActiveUsers     int    `json:"activeUsers"`
	TotalSessions   int    `json:"totalSessions"`
	ActiveSessions  int    `json:"activeSessions"`
	OfflineSessions int    `json:"offlineSessions"`
	LoginEvents     int    `json:"loginEvents"`
	LoginErrors     int    `json:"loginErrors"`
	ClientsCount    int    `json:"clientsCount"`
	GroupsCount     int    `json:"groupsCount"`
	RolesCount      int    `json:"rolesCount"`
	RealmName       string `json:"realmName"`
	KeycloakURL     string `json:"keycloakUrl"`
}

type AdminHandler struct {
	keycloakCfg      configuration.KeycloakConfig
	keycloakAdminCfg configuration.KeycloakAdminConfig
}

func NewAdminHandler(keycloakCfg configuration.KeycloakConfig, keycloakAdminCfg configuration.KeycloakAdminConfig) *AdminHandler {
	return &AdminHandler{
		keycloakCfg:      keycloakCfg,
		keycloakAdminCfg: keycloakAdminCfg,
	}
}

// GetKeycloakStats fetches statistics from Keycloak Admin API
func (h *AdminHandler) GetKeycloakStats(w http.ResponseWriter, r *http.Request) {
	// Extract realm name from issuer URL
	// Format: http://keycloak:8080/realms/myrealm
	issuerParts := strings.Split(h.keycloakCfg.Issuer, "/realms/")
	keycloakBaseURL := issuerParts[0]
	realmName := "myrealm"
	if len(issuerParts) > 1 {
		realmName = issuerParts[1]
	}

	slog.Infof("Fetching Keycloak stats from: %s for realm: %s", keycloakBaseURL, realmName)

	// Try to get admin access token via client credentials
	token, err := h.getAdminToken(keycloakBaseURL, realmName)
	if err != nil {
		slog.Errorf("Failed to get admin token via client credentials: %v", err)

		// Try to use the user's token from the request
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 {
				token = parts[1]
				slog.Infof("Using user's token for admin API calls")
			}
		}

		if token == "" {
			slog.Errorf("No valid token available")
			h.returnMockStats(w, realmName, keycloakBaseURL)
			return
		}
	}

	// Fetch users count
	usersCount, err := h.getUsersCount(keycloakBaseURL, realmName, token)
	if err != nil {
		slog.Errorf("Failed to get users count: %v", err)
		h.returnMockStats(w, realmName, keycloakBaseURL)
		return
	}

	slog.Infof("Successfully fetched users count: %d", usersCount)

	// Fetch realm info for more statistics
	realmInfo, err := h.getRealmInfo(keycloakBaseURL, realmName, token)
	if err != nil {
		slog.Warnf("Failed to get realm info: %v", err)
	}

	// Fetch sessions using multiple methods
	sessionsCount, activeSessionsCount, offlineSessionsCount := h.getComprehensiveSessions(keycloakBaseURL, realmName, token)
	slog.Infof("Sessions - Total: %d, Active: %d, Offline: %d", sessionsCount, activeSessionsCount, offlineSessionsCount)

	// Fetch clients count
	clientsCount, err := h.getClientsCount(keycloakBaseURL, realmName, token)
	if err != nil {
		slog.Warnf("Failed to get clients count: %v", err)
	}

	// Fetch groups count
	groupsCount, err := h.getGroupsCount(keycloakBaseURL, realmName, token)
	if err != nil {
		slog.Warnf("Failed to get groups count: %v", err)
	}

	// Fetch roles count
	rolesCount, err := h.getRolesCount(keycloakBaseURL, realmName, token)
	if err != nil {
		slog.Warnf("Failed to get roles count: %v", err)
	}

	// Fetch authentication events (login/error stats)
	loginEvents, loginErrors := h.getAuthenticationEvents(keycloakBaseURL, realmName, token)

	stats := KeycloakStats{
		TotalUsers:      usersCount,
		ActiveUsers:     usersCount, // All users considered as potentially active
		TotalSessions:   sessionsCount,
		ActiveSessions:  activeSessionsCount,
		OfflineSessions: offlineSessionsCount,
		LoginEvents:     loginEvents,
		LoginErrors:     loginErrors,
		ClientsCount:    clientsCount,
		GroupsCount:     groupsCount,
		RolesCount:      rolesCount,
		RealmName:       realmName,
		KeycloakURL:     keycloakBaseURL,
	}

	// Add realm info if available
	if realmInfo != nil {
		if enabled, ok := realmInfo["enabled"].(bool); ok && !enabled {
			slog.Warnf("Realm %s is disabled!", realmName)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// getAdminToken obtains an admin access token using client credentials from admin service account
func (h *AdminHandler) getAdminToken(keycloakURL, realm string) (string, error) {
	tokenURL := fmt.Sprintf("%s/realms/%s/protocol/openid-connect/token", keycloakURL, realm)

	// Use admin service account credentials
	data := fmt.Sprintf("grant_type=client_credentials&client_id=%s&client_secret=%s",
		h.keycloakAdminCfg.ClientID,
		h.keycloakAdminCfg.ClientSecret,
	)

	req, err := http.NewRequest("POST", tokenURL, strings.NewReader(data))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("failed to get token, status: %d, body: %s", resp.StatusCode, string(body))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", err
	}

	return tokenResp.AccessToken, nil
}

// getUsersCount fetches the total number of users
func (h *AdminHandler) getUsersCount(keycloakURL, realm, token string) (int, error) {
	usersURL := fmt.Sprintf("%s/admin/realms/%s/users/count", keycloakURL, realm)

	req, err := http.NewRequest("GET", usersURL, nil)
	if err != nil {
		return 0, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return 0, fmt.Errorf("failed to get users count, status: %d, body: %s", resp.StatusCode, string(body))
	}

	var count int
	if err := json.NewDecoder(resp.Body).Decode(&count); err != nil {
		return 0, err
	}

	return count, nil
}

// getRealmInfo fetches realm information
func (h *AdminHandler) getRealmInfo(keycloakURL, realm, token string) (map[string]interface{}, error) {
	realmURL := fmt.Sprintf("%s/admin/realms/%s", keycloakURL, realm)

	req, err := http.NewRequest("GET", realmURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get realm info, status: %d, body: %s", resp.StatusCode, string(body))
	}

	var realmInfo map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&realmInfo); err != nil {
		return nil, err
	}

	return realmInfo, nil
}

// getComprehensiveSessions tries multiple methods to get accurate session counts
func (h *AdminHandler) getComprehensiveSessions(keycloakURL, realm, token string) (total, active, offline int) {
	// Method 1: Try user sessions endpoint
	usersURL := fmt.Sprintf("%s/admin/realms/%s/users", keycloakURL, realm)
	req, err := http.NewRequest("GET", usersURL+"?max=1000", nil)
	if err == nil {
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Do(req)
		if err == nil && resp.StatusCode == http.StatusOK {
			var users []map[string]interface{}
			if json.NewDecoder(resp.Body).Decode(&users) == nil {
				// Count sessions for each user
				for _, user := range users {
					userID, ok := user["id"].(string)
					if !ok {
						continue
					}
					userSessionsURL := fmt.Sprintf("%s/admin/realms/%s/users/%s/sessions", keycloakURL, realm, userID)
					sessReq, _ := http.NewRequest("GET", userSessionsURL, nil)
					sessReq.Header.Set("Authorization", "Bearer "+token)
					sessResp, err := client.Do(sessReq)
					if err == nil && sessResp.StatusCode == http.StatusOK {
						var sessions []map[string]interface{}
						if json.NewDecoder(sessResp.Body).Decode(&sessions) == nil {
							active += len(sessions)
						}
						sessResp.Body.Close()
					}
				}
			}
			resp.Body.Close()
		}
	}

	// Method 2: Try client session stats
	sessionsURL := fmt.Sprintf("%s/admin/realms/%s/client-session-stats", keycloakURL, realm)
	req, err = http.NewRequest("GET", sessionsURL, nil)
	if err == nil {
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Do(req)
		if err == nil {
			defer resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				var sessionStats []map[string]interface{}
				if json.NewDecoder(resp.Body).Decode(&sessionStats) == nil {
					for _, stat := range sessionStats {
						// Check different possible field names
						if activeCount, ok := stat["active"].(float64); ok {
							total += int(activeCount)
						}
						if offlineCount, ok := stat["offline"].(float64); ok {
							offline += int(offlineCount)
						}
					}
				}
			}
		}
	}

	// If we got active sessions from user sessions, use that
	if active > 0 {
		total = active + offline
	}

	slog.Infof("Comprehensive session stats - Total: %d, Active: %d, Offline: %d", total, active, offline)
	return total, active, offline
}

// getClientsCount fetches the number of clients
func (h *AdminHandler) getClientsCount(keycloakURL, realm, token string) (int, error) {
	clientsURL := fmt.Sprintf("%s/admin/realms/%s/clients", keycloakURL, realm)

	req, err := http.NewRequest("GET", clientsURL, nil)
	if err != nil {
		return 0, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("failed to get clients, status: %d", resp.StatusCode)
	}

	var clients []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&clients); err != nil {
		return 0, err
	}

	return len(clients), nil
}

// getGroupsCount fetches the number of groups
func (h *AdminHandler) getGroupsCount(keycloakURL, realm, token string) (int, error) {
	groupsURL := fmt.Sprintf("%s/admin/realms/%s/groups/count", keycloakURL, realm)

	req, err := http.NewRequest("GET", groupsURL, nil)
	if err != nil {
		return 0, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("failed to get groups count, status: %d", resp.StatusCode)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, err
	}

	if count, ok := result["count"].(float64); ok {
		return int(count), nil
	}

	return 0, nil
}

// getRolesCount fetches the number of realm roles
func (h *AdminHandler) getRolesCount(keycloakURL, realm, token string) (int, error) {
	rolesURL := fmt.Sprintf("%s/admin/realms/%s/roles", keycloakURL, realm)

	req, err := http.NewRequest("GET", rolesURL, nil)
	if err != nil {
		return 0, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("failed to get roles, status: %d", resp.StatusCode)
	}

	var roles []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&roles); err != nil {
		return 0, err
	}

	return len(roles), nil
}

// getAuthenticationEvents fetches login and error events from Keycloak
func (h *AdminHandler) getAuthenticationEvents(keycloakURL, realm, token string) (loginEvents, loginErrors int) {
	// Try to get events (last 100)
	eventsURL := fmt.Sprintf("%s/admin/realms/%s/events?max=100", keycloakURL, realm)

	req, err := http.NewRequest("GET", eventsURL, nil)
	if err != nil {
		slog.Warnf("Failed to create events request: %v", err)
		return 0, 0
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		slog.Warnf("Failed to fetch events: %v", err)
		return 0, 0
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		slog.Warnf("Failed to get events, status: %d, body: %s", resp.StatusCode, string(body))
		return 0, 0
	}

	var events []map[string]interface{}
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		slog.Warnf("Failed to read events body: %v", err)
		return 0, 0
	}

	if err := json.Unmarshal(bodyBytes, &events); err != nil {
		slog.Warnf("Failed to decode events: %v, body: %s", err, string(bodyBytes))
		return 0, 0
	}

	slog.Infof("Fetched %d events from Keycloak", len(events))

	// Track unique event types for debugging
	eventTypes := make(map[string]int)

	// Count login events and errors
	for _, event := range events {
		eventType, ok := event["type"].(string)
		if !ok {
			continue
		}

		eventTypes[eventType]++

		// Check for login-related events
		// Keycloak event types can vary: LOGIN, LOGIN_ERROR, REFRESH_TOKEN, etc.
		switch eventType {
		case "LOGIN":
			loginEvents++
		case "LOGIN_ERROR":
			loginErrors++
		case "REFRESH_TOKEN":
			// Count as login activity
			loginEvents++
		case "CODE_TO_TOKEN":
			// Count as login activity
			loginEvents++
		}

		// Also check error field for any login-related events
		if err, hasError := event["error"].(string); hasError && err != "" {
			// If there's an error in the event, count it as error
			if eventType == "LOGIN" || eventType == "CODE_TO_TOKEN" {
				loginErrors++
			}
		}
	}

	// Log all event types found for debugging
	slog.Infof("Event types found: %v", eventTypes)
	slog.Infof("Authentication events - Total logins: %d, Errors: %d", loginEvents, loginErrors)

	return loginEvents, loginErrors
}

// returnMockStats returns mock statistics when Keycloak is unavailable
func (h *AdminHandler) returnMockStats(w http.ResponseWriter, realm, keycloakURL string) {
	stats := KeycloakStats{
		TotalUsers:     0,
		ActiveUsers:    0,
		TotalSessions:  0,
		ActiveSessions: 0,
		RealmName:      realm,
		KeycloakURL:    keycloakURL,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
