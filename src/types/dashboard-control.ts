// Dashboard Control Panel v1 — TypeScript Types
// Maps 1:1 to the JSONB shape returned by dashboard_control_snapshot RPC

export interface TobaccoUsageBlock {
  total_grams_today: number
  cost_today: number
  yesterday_grams: number
  week_avg_daily_grams: number
  week_pct_diff: number | null
}

export type BowlStatus = 'green' | 'yellow' | 'red' | 'no_data'

export interface AvgGramsPerBowlBlock {
  target_grams: number
  actual_avg: number
  overuse_pct: number
  sessions_count: number
  status: BowlStatus
}

export interface StaffRow {
  user_id: string
  display_name: string
  role: string
  sessions_count: number
  total_grams: number
  avg_grams: number
}

export interface LowStockItem {
  id: string
  brand: string
  flavor: string
  remaining_grams: number
  low_stock_threshold: number
  avg_daily_usage: number
  estimated_days_left: number | null
}

export interface RevenueSnapshotBlock {
  hookah_revenue_today: number
  hookah_cost_today: number
  hookah_revenue_yesterday: number
  bar_revenue_today: number
  bar_cost_today: number
  bar_revenue_yesterday: number
  combined_revenue_today: number
  combined_cost_today: number
  combined_revenue_yesterday: number
  hookah_margin_pct: number | null
  bar_margin_pct: number | null
  combined_margin_pct: number | null
}

export interface DashboardControlSnapshot {
  tobacco_usage: TobaccoUsageBlock
  avg_grams_per_bowl: AvgGramsPerBowlBlock
  staff_comparison: StaffRow[]
  low_stock_alerts: LowStockItem[]
  revenue_snapshot: RevenueSnapshotBlock
}

export interface StaffRowEnriched extends StaffRow {
  deviation_from_mean: number
  status: 'best' | 'worst' | 'normal'
}
