import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, interval, BehaviorSubject } from 'rxjs';
import { switchMap, startWith, tap } from 'rxjs/operators';
import {
  Notification,
  NotificationListResponse,
  UnreadNotificationsResponse,
  CreateNotificationRequest
} from '../models/notification.model';

/**
 * Notification Service
 * Manages user notifications from the backend API
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = '/api/notifications';
  private unreadCountSubject = new BehaviorSubject<number>(0);
  
  /**
   * Observable for unread notification count
   */
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all notifications with pagination
   * @param limit Number of notifications to fetch (default: 50, max: 100)
   * @param offset Offset for pagination (default: 0)
   */
  getNotifications(limit: number = 50, offset: number = 0): Observable<NotificationListResponse> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<NotificationListResponse>(this.apiUrl, { params }).pipe(
      tap(response => this.unreadCountSubject.next(response.unread_count))
    );
  }

  /**
   * Get unread notifications
   * @param limit Number of notifications to fetch (default: 20, max: 50)
   */
  getUnreadNotifications(limit: number = 20): Observable<UnreadNotificationsResponse> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http.get<UnreadNotificationsResponse>(`${this.apiUrl}/unread`, { params }).pipe(
      tap(response => this.unreadCountSubject.next(response.unread_count))
    );
  }

  /**
   * Get a specific notification by ID
   * @param id Notification ID
   */
  getNotification(id: string): Observable<Notification> {
    return this.http.get<Notification>(`${this.apiUrl}/${id}`);
  }

  /**
   * Mark a notification as read
   * @param id Notification ID
   */
  markAsRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        // Decrease unread count
        const currentCount = this.unreadCountSubject.value;
        this.unreadCountSubject.next(Math.max(0, currentCount - 1));
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );
  }

  /**
   * Delete a notification
   * @param id Notification ID
   */
  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a notification (admin only)
   * @param request Create notification request
   */
  createNotification(request: CreateNotificationRequest): Observable<Notification> {
    return this.http.post<Notification>(this.apiUrl, request);
  }

  /**
   * Start polling for new notifications
   * @param intervalMs Polling interval in milliseconds (default: 30000 = 30 seconds)
   * @returns Observable that emits notification responses
   */
  pollNotifications(intervalMs: number = 30000): Observable<UnreadNotificationsResponse> {
    return interval(intervalMs).pipe(
      startWith(0), // Trigger immediately
      switchMap(() => this.getUnreadNotifications())
    );
  }

  /**
   * Get current unread count (synchronous)
   */
  getCurrentUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Refresh unread count
   */
  refreshUnreadCount(): void {
    this.getUnreadNotifications(1).subscribe();
  }
}


