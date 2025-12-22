import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Subs {
  id: number;
  source_name: string;
  description: string;
  connection_type: string;
  host: string;
  FTPport: string;
  file_path: string;
  username: string;
  password: string;
  schedule: string;
}

@Injectable({ providedIn: 'root' })
export class EmsService {
  // Замените на ваш реальный URL API
  private baseUrl = '/api/ems';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Subs[]> {
    return this.http.get<Subs[]>(`${this.baseUrl}`);
  }

  getById(id: number): Observable<Subs> {
    return this.http.get<Subs>(`${this.baseUrl}/${id}`);
  }

  create(payload: Partial<Subs>): Observable<Subs> {
    return this.http.post<Subs>(`${this.baseUrl}`, payload);
  }

  update(id: number, payload: Partial<Subs>): Observable<Subs> {
    return this.http.put<Subs>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
