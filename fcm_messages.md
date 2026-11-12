Your current PostgreSQL database design is a good starting point for your Reminder SaaS application. You do not need to redesign everything.

However, I recommend a few changes before implementing Firebase notifications with Go and React Native Expo.

The main issue is that your current design stores only one FCM device token per user and your notification log does not store Firebase response IDs, error details, or retry information.

For a SaaS application, one user may log in from multiple devices, so I recommend separating device registrations from users.

## 1. Review of your existing tables

| Table             | Recommendation      | Reason                                      |
| ----------------- | ------------------- | ------------------------------------------- |
| users             | Keep, minor changes | Multiple device support                     |
| reminders         | Keep, minor changes | Add processing and retry support separately |
| notification_logs | Modify              | Track Firebase responses and failures       |
| user_devices      | Add                 | Store multiple mobile device tokens         |
| notification_jobs | Optional            | Useful for reliable background processing   |

My recommendation: Keep your existing tables and apply incremental migrations.

## 2. Updated database architecture

users

Tenant / user accounts

user_devices

Multiple FCM tokens per user

reminders

Reminder information and next due date

notification_logs

Notification delivery history per device

## 3. Add a user_devices table

Recommended

Remove the dependency on one `fcm_device_token` in `users` over time.

```
CREATE TABLE user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    device_token TEXT NOT NULL UNIQUE,

    platform VARCHAR(20) NOT NULL,
    device_name VARCHAR(150),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_devices_user_id
ON user_devices(user_id, is_active);
```

Example:

| User   | Device      | Platform |
| ------ | ----------- | -------- |
| User 1 | FCM Token A | Android  |
| User 1 | FCM Token B | iOS      |
| User 2 | FCM Token C | Android  |

When a user logs in from another mobile device, register its token separately.

## 4. Update notification_logs

Your current table has:

```
status VARCHAR(20) DEFAULT 'sent',
channel VARCHAR(20) DEFAULT 'push'
```

These columns may be too restrictive for future notification statuses and channel names. Also, you need to store Firebase response details.

I recommend this updated design:

```
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reminder_id UUID
        REFERENCES reminders(id) ON DELETE SET NULL,

    user_id UUID
        REFERENCES users(id) ON DELETE SET NULL,

    device_id UUID
        REFERENCES user_devices(id) ON DELETE SET NULL,

    scheduled_for TIMESTAMPTZ NOT NULL,

    sent_at TIMESTAMPTZ,

    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    channel VARCHAR(50) NOT NULL DEFAULT 'push',

    provider VARCHAR(30) DEFAULT 'firebase',

    provider_message_id TEXT,

    error_message TEXT,

    retry_count INT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

Important: If you already created `notification_logs`, do not execute the above `CREATE TABLE` again. Use the migration below instead.

### Migration for your existing notification_logs

```
ALTER TABLE notification_logs
    ALTER COLUMN status TYPE VARCHAR(30),
    ALTER COLUMN status SET DEFAULT 'pending',
    ALTER COLUMN channel TYPE VARCHAR(50),
    ADD COLUMN IF NOT EXISTS device_id UUID,
    ADD COLUMN IF NOT EXISTS provider VARCHAR(30) DEFAULT 'firebase',
    ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
    ADD COLUMN IF NOT EXISTS error_message TEXT,
    ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE notification_logs
    ALTER COLUMN sent_at DROP DEFAULT;

ALTER TABLE notification_logs
    ADD CONSTRAINT fk_notification_logs_device
    FOREIGN KEY (device_id)
    REFERENCES user_devices(id)
    ON DELETE SET NULL;
```

This migration assumes you have not already added `device_id` or its foreign key.

Add useful indexes:

```
CREATE INDEX idx_notification_logs_reminder
ON notification_logs(reminder_id);

CREATE INDEX idx_notification_logs_user
ON notification_logs(user_id);

CREATE INDEX idx_notification_logs_status
ON notification_logs(status, scheduled_for);
```

## 5. Update reminders table

Your reminders table is mostly correct.

I recommend adding these columns:

```
ALTER TABLE reminders
ADD COLUMN IF NOT EXISTS notification_time TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
```

Why?

For example, a user creates:

- Reminder: Insurance renewal
- Due date: 15 December 2026
- Notification time: 09:00 AM
- Timezone: Asia/Kolkata
- Advance notice: 7 days

Your worker should send the notification on 8 December at 9 AM, not at midnight UTC.

Also add validation for custom recurrence:

```
ALTER TABLE reminders
ADD CONSTRAINT chk_custom_recurrence
CHECK (
    recurrence <> 'custom'
    OR (
        custom_interval_value > 0
        AND custom_interval_unit IS NOT NULL
    )
);
```

## 6. Fix your existing Firebase worker error immediately

Your earlier error was:

```
ERROR: value too long for type character varying(20)
```

Run this first:

```
ALTER TABLE notification_logs
    ALTER COLUMN status TYPE VARCHAR(50),
    ALTER COLUMN channel TYPE VARCHAR(50);
```

This addresses the two existing 20-character fields. If the error continues, inspect every column receiving a value in your Go INSERT statement.

## 7. Recommended notification statuses

Use consistent status values throughout your Go application.

| Status     | Meaning                         |
| ---------- | ------------------------------- |
| pending    | Notification waiting to be sent |
| processing | Worker is processing            |
| sent       | Firebase accepted the message   |
| failed     | Sending failed                  |
| retrying   | Waiting for another attempt     |

Remember: `sent` means Firebase accepted the message, not necessarily that the device displayed it.

## 8. How your final database should look

users

User accounts and SaaS tenant information

user_devices

Multiple Android/iOS FCM tokens per user

reminders

Reminder details, recurrence, due date and timezone

notification_logs

Per-device notification attempts, Firebase IDs, failures and retries

## 9. Final recommendations

| Feature                            | Recommendation                                                 |
| ---------------------------------- | -------------------------------------------------------------- |
| Multiple devices                   | Yes                                                            |
| Firebase FCM                       | Yes                                                            |
| Notification history               | Yes                                                            |
| Failed notification retry          | Yes                                                            |
| Daily / weekly / monthly reminders | Yes                                                            |
| Timezone support                   | Yes                                                            |
| Notification scheduling            | Go worker                                                      |
| Duplicate prevention               | Database transaction and locking                               |
| Multi-tenant support               | Add tenant isolation if users belong to separate organizations |

One additional consideration: Your current `users` table uses `tenant_user` and `super_admin`. If your SaaS will support organizations with multiple users, eventually introduce a separate `tenants` table and tenant membership relationship.

My recommendation: You can retain your existing four-table foundation, add `user_devices`, and improve `notification_logs`. You do not need a complete database redesign.

The next important step is to make your Go worker safely process multiple reminders and multiple devices without duplicate notifications.