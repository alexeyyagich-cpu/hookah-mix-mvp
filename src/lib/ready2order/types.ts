// ready2order API Types

export interface R2OProduct {
  product_id: number
  product_name: string
  product_price: number
  product_vat: number
  product_description: string | null
  product_stock: number | null
  product_stockValue: number | null
  product_stockEnabled: boolean
  product_group_id: number | null
  product_barcode: string | null
  product_active: boolean
  product_type: 'normal' | 'deposit' | 'tipProduct'
  created_at: string
  updated_at: string
}

export interface R2OProductGroup {
  productGroup_id: number
  productGroup_name: string
  productGroup_sortIndex: number
}

export interface R2OInvoiceItem {
  item_name: string
  item_price: number
  item_quantity: number
  item_vat: number
  product_id: number | null
}

export interface R2OInvoice {
  invoice_id: number
  invoice_number: string
  invoice_timestamp: string
  invoice_totalPrice: number
  invoice_items: R2OInvoiceItem[]
  invoice_paymentMethod: string
  invoice_type: 'invoice' | 'cancellation'
}

export interface R2OWebhookEvent {
  event: string
  accountId: string
  data: Record<string, unknown>
  timestamp: string
}

export interface R2OGrantResponse {
  grantAccessUri: string
  grantAccessToken: string
}

export interface R2OAccountToken {
  accountToken: string
}

export type R2OConnectionStatus = 'connected' | 'disconnected' | 'error'

export interface R2OConnection {
  id: string
  profile_id: string
  encrypted_token: string
  token_iv: string
  status: R2OConnectionStatus
  webhook_registered: boolean
  product_group_id: number | null
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export type R2OSyncStatus = 'synced' | 'pending' | 'error'

export interface R2OProductMapping {
  id: string
  profile_id: string
  tobacco_inventory_id: string
  r2o_product_id: number
  r2o_product_name: string
  sync_status: R2OSyncStatus
  last_synced_at: string | null
  created_at: string
}

export interface R2OSalesLog {
  id: string
  profile_id: string
  r2o_invoice_id: number
  invoice_number: string
  invoice_timestamp: string
  total_price: number
  items: R2OInvoiceItem[]
  processed: boolean
  created_at: string
}
