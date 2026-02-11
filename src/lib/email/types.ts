export type EmailNotificationType =
  | 'low_stock_alert'
  | 'order_status_update'
  | 'daily_summary'
  | 'welcome'
  | 'staff_invitation'

export interface EmailSettings {
  id: string
  profile_id: string
  email_notifications_enabled: boolean
  low_stock_email: boolean
  order_updates_email: boolean
  daily_summary_email: boolean
  marketing_email: boolean
  created_at: string
  updated_at: string
}

export interface EmailLog {
  id: string
  profile_id: string
  email_type: EmailNotificationType
  recipient: string
  subject: string
  status: 'sent' | 'failed' | 'bounced'
  error_message: string | null
  sent_at: string
}
