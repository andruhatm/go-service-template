import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MonObject,
  CreateMonObjectRequest,
  UpdateMonObjectRequest,
  MonObjectListResponse,
  MonObjectListParams
} from '../models/mon-object.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MonObjectService {
  private readonly apiUrl = `${environment.backendUrl}/api/mon-objects`;

  constructor(private http: HttpClient) {}

  /**
   * Note: Authorization headers are automatically added by keycloak-angular's Bearer interceptor
   * No need to manually add Authorization headers
   */

  /**
   * Create a new monitoring object
   * @param data - Monitoring object data
   * @returns Observable<MonObject> - Created object
   */
  createMonObject(data: CreateMonObjectRequest): Observable<MonObject> {
    return this.http.post<MonObject>(this.apiUrl, data);
  }

  /**
   * Get a monitoring object by ID
   * @param id - Object UUID
   * @returns Observable<MonObject> - Monitoring object
   */
  getMonObject(id: string): Observable<MonObject> {
    return this.http.get<MonObject>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get a paginated list of monitoring objects with optional filtering
   * @param params - Pagination and filter parameters
   * @returns Observable<MonObjectListResponse> - List of objects with pagination info
   */
  listMonObjects(params?: MonObjectListParams): Observable<MonObjectListResponse> {
    let httpParams = new HttpParams()
      .set('page', (params?.page || 1).toString())
      .set('pageSize', (params?.pageSize || 20).toString());

    if (params?.type) {
      httpParams = httpParams.set('type', params.type);
    }
    if (params?.name) {
      httpParams = httpParams.set('name', params.name);
    }
    if (params?.technology) {
      httpParams = httpParams.set('technology', params.technology);
    }

    return this.http.get<MonObjectListResponse>(this.apiUrl, {
      params: httpParams
    });
  }

  /**
   * Update an existing monitoring object
   * @param id - Object UUID
   * @param data - Updated fields
   * @returns Observable<MonObject> - Updated object
   */
  updateMonObject(id: string, data: UpdateMonObjectRequest): Observable<MonObject> {
    return this.http.put<MonObject>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete a monitoring object
   * @param id - Object UUID
   * @returns Observable<void>
   */
  deleteMonObject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Search monitoring objects by name (convenience method)
   * @param searchTerm - Search term for name
   * @param page - Page number
   * @param pageSize - Items per page
   * @returns Observable<MonObjectListResponse>
   */
  searchByName(searchTerm: string, page: number = 1, pageSize: number = 20): Observable<MonObjectListResponse> {
    return this.listMonObjects({
      name: searchTerm,
      page,
      pageSize
    });
  }

  /**
   * Get monitoring objects by type (convenience method)
   * @param type - Object type (router, switch, server, etc.)
   * @param page - Page number
   * @param pageSize - Items per page
   * @returns Observable<MonObjectListResponse>
   */
  getByType(type: string, page: number = 1, pageSize: number = 20): Observable<MonObjectListResponse> {
    return this.listMonObjects({
      type,
      page,
      pageSize
    });
  }
}

