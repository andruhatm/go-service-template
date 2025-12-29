import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface KeycloakStats {
  totalUsers: number;
  activeUsers?: number;
  totalSessions?: number;
  activeSessions?: number;
  realmName: string;
  keycloakUrl: string;
  offlineSessions?: number;
  clientsCount?: number;
  groupsCount?: number;
  rolesCount?: number;
  loginEvents?: number;
  loginErrors?: number;
}

@Injectable({
  providedIn: 'root'
})
export class KeycloakAdminService {
  // Use backendUrl from environment if proxy isn't working
  private apiUrl = environment['backendUrl'] 
    ? `${environment['backendUrl']}/api/admin` 
    : '/api/admin';
  
  // Keycloak configuration from environment
  private keycloakUrl = 'http://localhost:8080';
  private realmName = 'myrealm';

  constructor(private http: HttpClient) {}

  getKeycloakStats(): Observable<KeycloakStats> {
    // Try to fetch stats from backend API
    return this.http.get<KeycloakStats>(`${this.apiUrl}/keycloak-stats`).pipe(
      catchError(() => {
        // If API is not implemented yet, return mock data
        return of({
          totalUsers: 0,
          activeUsers: 0,
          totalSessions: 0,
          activeSessions: 0,
          realmName: this.realmName,
          keycloakUrl: this.keycloakUrl
        });
      })
    );
  }

  getKeycloakAdminUrl(): string {
    return `${this.keycloakUrl}/admin/master/console/#/${this.realmName}/users`;
  }

  getRealmName(): string {
    return this.realmName;
  }
}



