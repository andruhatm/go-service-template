import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMonitor: boolean;
  username?: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class KeycloakAuthService {
  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    isAdmin: false,
    isMonitor: false,
    roles: []
  });

  public authState$: Observable<AuthState> = this.authStateSubject.asObservable();

  constructor(private keycloakService: KeycloakService) {
    console.log('KeycloakAuthService created');
  }

  /**
   * Initialize authentication state. Should be called once during app initialization.
   */
  async initialize(): Promise<void> {
    console.log('KeycloakAuthService - Initializing...');
    
    try {
      // Get the Keycloak instance directly
      const keycloakInstance = this.keycloakService.getKeycloakInstance();
      
      if (!keycloakInstance) {
        console.warn('KeycloakAuthService - Keycloak instance not available');
        return;
      }

      // Check if user is authenticated
      const isAuthenticated = keycloakInstance.authenticated || false;
      
      console.log('KeycloakAuthService - Authenticated:', isAuthenticated);

      if (isAuthenticated) {
        // Get roles
        const roles = this.keycloakService.getUserRoles() || [];
        const isAdmin = this.keycloakService.isUserInRole('ROLE_ADMIN');
        const isMonitor = this.keycloakService.isUserInRole('ROLE_MONITOR');

        // Get username
        let username: string | undefined;
        try {
          const userProfile = await this.keycloakService.loadUserProfile();
          username = userProfile.username;
        } catch (e) {
          console.warn('KeycloakAuthService - Could not load user profile:', e);
        }

        // Update auth state
        const authState: AuthState = {
          isAuthenticated: true,
          isAdmin,
          isMonitor,
          username,
          roles
        };

        console.log('KeycloakAuthService - Auth state:', authState);
        this.authStateSubject.next(authState);
      } else {
        // User not authenticated
        this.authStateSubject.next({
          isAuthenticated: false,
          isAdmin: false,
          isMonitor: false,
          roles: []
        });
      }
    } catch (error) {
      console.error('KeycloakAuthService - Error during initialization:', error);
      this.authStateSubject.next({
        isAuthenticated: false,
        isAdmin: false,
        isMonitor: false,
        roles: []
      });
    }
  }

  /**
   * Get current authentication state synchronously
   */
  getCurrentAuthState(): AuthState {
    return this.authStateSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  /**
   * Check if user has admin role
   */
  isAdmin(): boolean {
    return this.authStateSubject.value.isAdmin;
  }

  /**
   * Check if user has monitor role
   */
  isMonitor(): boolean {
    return this.authStateSubject.value.isMonitor;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    return this.authStateSubject.value.roles.includes(role);
  }

  /**
   * Get username
   */
  getUsername(): string | undefined {
    return this.authStateSubject.value.username;
  }

  /**
   * Get all roles
   */
  getRoles(): string[] {
    return this.authStateSubject.value.roles;
  }

  /**
   * Trigger login
   */
  login(): void {
    this.keycloakService.login({
      redirectUri: window.location.href
    });
  }

  /**
   * Trigger logout
   */
  logout(): void {
    this.keycloakService.logout();
  }
}

