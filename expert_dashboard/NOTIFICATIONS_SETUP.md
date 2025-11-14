# Notifications System Setup Guide

This guide will help you set up the real-time notifications feature for the BitterScan Expert Dashboard.

## Database Setup

### 1. Create Notifications Table

Go to your Supabase project dashboard, navigate to the **SQL Editor**, and run the following SQL commands:

```sql
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  expert_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_id INTEGER NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT notifications_expert_scan_unique UNIQUE (expert_id, scan_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_expert_id ON notifications(expert_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scan_id ON notifications(scan_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expert_unread ON notifications(expert_id, is_read) WHERE is_read = FALSE;

-- Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow experts to view their own notifications
CREATE POLICY "Experts can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = expert_id);

-- Create policy to allow experts to update their own notifications
CREATE POLICY "Experts can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = expert_id);

-- Create policy to allow system to insert notifications
-- Note: This allows any authenticated user to insert notifications
-- In production, you might want to restrict this to a service role or use a database function
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = expert_id);
```

### 2. Enable Realtime for Notifications Table

To enable real-time updates for notifications, run:

```sql
-- Enable Realtime on notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

**Note:** If you see an error about the publication not existing, you may need to enable Realtime in your Supabase project settings first:
1. Go to Database → Replication
2. Enable Realtime for the `notifications` table

### 3. Optional: Create Database Function for Auto-Notification Creation

You can optionally create a database function that automatically creates notifications when new scans are inserted. This ensures notifications are created even if the application is temporarily unavailable:

```sql
-- Create function to automatically create notifications for new scans
CREATE OR REPLACE FUNCTION create_scan_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for all experts (you may want to filter by role)
  INSERT INTO notifications (expert_id, scan_id, message, is_read)
  SELECT 
    id as expert_id,
    NEW.id as scan_id,
    'A new scan has been submitted and needs validation.' as message,
    FALSE as is_read
  FROM profiles
  WHERE role = 'expert'
  ON CONFLICT (expert_id, scan_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on scan insert
CREATE TRIGGER trigger_create_scan_notification
  AFTER INSERT ON scans
  FOR EACH ROW
  EXECUTE FUNCTION create_scan_notification();
```

**Note:** If you use this trigger approach, you may want to remove the notification creation logic from the `NotificationContext.tsx` to avoid duplicates.

## Features

### Real-Time Notifications
- Notifications appear instantly when new scans are added to the database
- Uses Supabase Realtime (WebSockets) for instant updates
- No page refresh required

### Notification Bell
- Located in the header next to the account dropdown
- Shows unread count badge (red circle with number)
- Click to open dropdown with list of notifications

### Notification Dropdown
- Displays last 10 notifications
- Shows notification message, scan ID, farmer name, and timestamp
- Unread notifications are highlighted with blue background
- Click on a notification to:
  - Mark it as read
  - Navigate to the validation page for that scan
- "Mark all as read" button to clear all unread notifications
- "View all scans" link to navigate to the validate page

### Notification States
- **Unread**: New notifications that haven't been clicked
- **Read**: Notifications that have been viewed/interacted with
- Notifications persist in the database until deleted

## Troubleshooting

### Notifications Not Appearing
1. **Check Realtime is Enabled**: Ensure Realtime is enabled for the `notifications` table
2. **Check RLS Policies**: Verify Row Level Security policies allow the current user to read notifications
3. **Check Console**: Look for errors in the browser console related to Supabase subscriptions
4. **Verify User ID**: Ensure the `expert_id` in notifications matches the logged-in user's ID

### Real-Time Not Working
1. **Enable Realtime**: Run the SQL command to add the table to the Realtime publication
2. **Check Network**: Ensure WebSocket connections are not blocked
3. **Check Supabase Dashboard**: Verify Realtime is enabled in your project settings

### Duplicate Notifications
- If you're using the database trigger AND the application code to create notifications, you may get duplicates
- Choose one approach: either use the trigger OR the application code, not both

## Database Schema

The `notifications` table has the following structure:

- `id` (BIGSERIAL) - Primary key
- `expert_id` (UUID) - References auth.users(id) - The expert who should receive the notification
- `scan_id` (INTEGER) - References scans(id) - The scan that triggered the notification
- `message` (TEXT) - The notification message
- `is_read` (BOOLEAN) - Whether the notification has been read (default: FALSE)
- `created_at` (TIMESTAMP) - When the notification was created
- `read_at` (TIMESTAMP) - When the notification was marked as read (nullable)

## Security

- Row Level Security (RLS) ensures experts can only see their own notifications
- Notifications are automatically cleaned up when scans or users are deleted (CASCADE)
- All database operations are authenticated through Supabase Auth

## Performance

- Indexes are created on frequently queried columns (expert_id, is_read, created_at)
- Notifications are limited to the last 50 in the UI
- Real-time subscriptions are properly cleaned up to prevent memory leaks

