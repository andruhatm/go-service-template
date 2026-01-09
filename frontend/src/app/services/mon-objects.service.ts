import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface MonObject {
  id: string;
  name: string;
  type: string;
  technology?: string;
  platform?: string;
  network?: string;
  manufacturer?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class MonObjectsService {
  private apiUrl = `${environment.api}/mon-objects`;

  constructor(private http: HttpClient) {}

  /**
   * Get all monitoring objects (without pagination for selection)
   */
  getMonObjects(): Observable<MonObject[]> {
    // Request with large pageSize to get all items
    const params = new HttpParams().set('pageSize', '1000');
    return this.http.get<PaginatedResponse<MonObject>>(this.apiUrl, { params })
      .pipe(
        map(response => response.items || [])
      );
  }

  /**
   * Get paginated monitoring objects
   */
  getMonObjectsPaginated(page: number = 1, pageSize: number = 20): Observable<PaginatedResponse<MonObject>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PaginatedResponse<MonObject>>(this.apiUrl, { params });
  }

  /**
   * Get a single monitoring object by ID
   */
  getMonObject(id: string): Observable<MonObject> {
    return this.http.get<MonObject>(`${this.apiUrl}/${id}`);
  }
}

