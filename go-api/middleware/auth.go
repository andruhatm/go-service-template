package middleware

import (
	"context"
	"live/configuration"
	"log"
	"net/http"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

type AuthMiddleware struct {
	verifier *oidc.IDTokenVerifier
	config   *oauth2.Config
}

func NewAuthMiddleware(config configuration.KeycloakConfig) (*AuthMiddleware, error) {
	ctx := context.Background()

	provider, err := oidc.NewProvider(ctx, config.Issuer)
	if err != nil {
		return nil, err
	}

	oidcConfig := &oidc.Config{
		ClientID: config.ClientID,
	}

	verifier := provider.Verifier(oidcConfig)

	oauth2Config := &oauth2.Config{
		ClientID:     config.ClientID,
		ClientSecret: config.ClientSecret,
		Endpoint:     provider.Endpoint(),
		Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
	}

	return &AuthMiddleware{
		verifier: verifier,
		config:   oauth2Config,
	}, nil
}

func (a *AuthMiddleware) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, "Authorization header format must be Bearer {token}", http.StatusUnauthorized)
			return
		}

		token := parts[1]

		// Проверка токена
		idToken, err := a.verifier.Verify(r.Context(), token)
		if err != nil {
			log.Printf("Failed to verify token: %v", err)
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Извлечение claims
		var claims map[string]interface{}
		if err := idToken.Claims(&claims); err != nil {
			log.Printf("Failed to parse claims: %v", err)
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		// Добавление claims в контекст
		ctx := context.WithValue(r.Context(), "claims", claims)
		ctx = context.WithValue(ctx, "userID", claims["sub"])
		ctx = context.WithValue(ctx, "roles", extractRoles(claims))

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func extractRoles(claims map[string]interface{}) []string {
	var roles []string

	// Проверяем realm_access роли
	if realmAccess, ok := claims["realm_access"].(map[string]interface{}); ok {
		if realmRoles, ok := realmAccess["roles"].([]interface{}); ok {
			for _, role := range realmRoles {
				if roleStr, ok := role.(string); ok {
					roles = append(roles, "realm:"+roleStr)
				}
			}
		}
	}

	// Проверяем resource_access роли (роли клиента)
	if resourceAccess, ok := claims["resource_access"].(map[string]interface{}); ok {
		for client, access := range resourceAccess {
			if accessMap, ok := access.(map[string]interface{}); ok {
				if clientRoles, ok := accessMap["roles"].([]interface{}); ok {
					for _, role := range clientRoles {
						if roleStr, ok := role.(string); ok {
							roles = append(roles, client+":"+roleStr)
						}
					}
				}
			}
		}
	}

	return roles
}

// Вспомогательная функция для проверки ролей
func HasRole(ctx context.Context, requiredRole string) bool {
	roles, ok := ctx.Value("roles").([]string)
	if !ok {
		return false
	}

	for _, role := range roles {
		if role == requiredRole {
			return true
		}
	}
	return false
}

func GetUserID(ctx context.Context) string {
	userID, _ := ctx.Value("userID").(string)
	return userID
}
