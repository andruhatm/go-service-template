/**
 * Notification model
 */
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_id?: string;
  related_type?: string;
  status: NotificationStatus;
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

/**
 * Notification type enum
 */
export enum NotificationType {
  FORECAST_CREATED = 'forecast_created',
  FORECAST_PROCESSING = 'forecast_processing',
  FORECAST_COMPLETED = 'forecast_completed',
  FORECAST_FAILED = 'forecast_failed',
  SYSTEM = 'system'
}

/**
 * Notification status enum
 */
export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  DISMISSED = 'dismissed'
}

/**
 * Response for list notifications
 */
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  limit: number;
  offset: number;
}

/**
 * Response for unread notifications
 */
export interface UnreadNotificationsResponse {
  notifications: Notification[];
  unread_count: number;
  limit: number;
}

/**
 * Request to create a notification (admin only)
 */
export interface CreateNotificationRequest {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_id?: string;
  related_type?: string;
  expires_at?: string;
}


