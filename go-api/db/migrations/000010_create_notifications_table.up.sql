CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id VARCHAR(255),
    related_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Create a composite index for user queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_status_created ON notifications(user_id, status, created_at DESC);

COMMENT ON TABLE notifications IS 'Stores user notifications for events like forecast creation and completion';
COMMENT ON COLUMN notifications.user_id IS 'Keycloak user ID who should receive the notification';
COMMENT ON COLUMN notifications.type IS 'Notification type: forecast_created, forecast_completed, forecast_failed, etc.';
COMMENT ON COLUMN notifications.title IS 'Notification title';
COMMENT ON COLUMN notifications.message IS 'Notification message body';
COMMENT ON COLUMN notifications.related_id IS 'ID of related entity (e.g., forecast ID)';
COMMENT ON COLUMN notifications.related_type IS 'Type of related entity (e.g., forecast, dashboard)';
COMMENT ON COLUMN notifications.status IS 'Notification status: unread, read, dismissed';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when notification was read';
COMMENT ON COLUMN notifications.expires_at IS 'Timestamp when notification should be automatically removed';

