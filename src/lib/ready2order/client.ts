import type {
  R2OProduct,
  R2OProductGroup,
  R2OInvoice,
  R2OGrantResponse,
} from './types'

const R2O_BASE_URL = 'https://api.ready2order.com/v1'

// Rate limiting: 60 requests per minute
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 60

let requestTimestamps: number[] = []

async function rateLimit(): Promise<void> {
  const now = Date.now()
  requestTimestamps = requestTimestamps.filter(t => now - t < RATE_LIMIT_WINDOW)

  if (requestTimestamps.length >= RATE_LIMIT_MAX) {
    const waitUntil = requestTimestamps[0] + RATE_LIMIT_WINDOW
    const delay = waitUntil - now
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  requestTimestamps.push(Date.now())
}

async function r2oFetch<T>(
  path: string,
  accountToken: string,
  options: RequestInit = {}
): Promise<T> {
  await rateLimit()

  const url = `${R2O_BASE_URL}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accountToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`r2o API error ${response.status}: ${errorText}`)
  }

  return response.json() as Promise<T>
}

// ============================================================================
// Grant Access Token Flow
// ============================================================================

export async function grantAccessToken(
  developerToken: string,
  redirectUri: string
): Promise<R2OGrantResponse> {
  await rateLimit()

  const response = await fetch(`${R2O_BASE_URL}/developerToken/grantAccessToken`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${developerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ redirectUri }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`r2o grant error ${response.status}: ${errorText}`)
  }

  return response.json() as Promise<R2OGrantResponse>
}

// ============================================================================
// Products
// ============================================================================

export async function getProducts(accountToken: string): Promise<R2OProduct[]> {
  return r2oFetch<R2OProduct[]>('/products', accountToken)
}

export async function createProduct(
  accountToken: string,
  product: {
    product_name: string
    product_price: number
    product_vat: number
    product_group_id?: number
    product_stockEnabled?: boolean
    product_stock?: number
    product_barcode?: string
  }
): Promise<R2OProduct> {
  return r2oFetch<R2OProduct>('/products', accountToken, {
    method: 'POST',
    body: JSON.stringify(product),
  })
}

export async function updateProduct(
  accountToken: string,
  productId: number,
  updates: Partial<{
    product_name: string
    product_price: number
    product_stock: number
    product_active: boolean
    product_group_id: number
  }>
): Promise<R2OProduct> {
  return r2oFetch<R2OProduct>(`/products/${productId}`, accountToken, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

// ============================================================================
// Product Groups
// ============================================================================

export async function getProductGroups(accountToken: string): Promise<R2OProductGroup[]> {
  return r2oFetch<R2OProductGroup[]>('/productGroups', accountToken)
}

export async function createProductGroup(
  accountToken: string,
  name: string
): Promise<R2OProductGroup> {
  return r2oFetch<R2OProductGroup>('/productGroups', accountToken, {
    method: 'POST',
    body: JSON.stringify({ productGroup_name: name }),
  })
}

// ============================================================================
// Invoices
// ============================================================================

export async function getInvoices(
  accountToken: string,
  params?: { from?: string; to?: string; limit?: number }
): Promise<R2OInvoice[]> {
  const searchParams = new URLSearchParams()
  if (params?.from) searchParams.set('from', params.from)
  if (params?.to) searchParams.set('to', params.to)
  if (params?.limit) searchParams.set('limit', String(params.limit))

  const query = searchParams.toString()
  return r2oFetch<R2OInvoice[]>(`/invoices${query ? `?${query}` : ''}`, accountToken)
}

// ============================================================================
// Webhooks
// ============================================================================

export async function registerWebhook(
  accountToken: string,
  url: string,
  events: string[]
): Promise<{ webhook_id: number }> {
  return r2oFetch<{ webhook_id: number }>('/webhooks', accountToken, {
    method: 'POST',
    body: JSON.stringify({ url, events }),
  })
}

export async function deleteWebhook(
  accountToken: string,
  webhookId: number
): Promise<void> {
  await r2oFetch<void>(`/webhooks/${webhookId}`, accountToken, {
    method: 'DELETE',
  })
}

// ============================================================================
// Stock
// ============================================================================

export async function updateStock(
  accountToken: string,
  productId: number,
  stock: number
): Promise<R2OProduct> {
  return updateProduct(accountToken, productId, { product_stock: stock })
}
