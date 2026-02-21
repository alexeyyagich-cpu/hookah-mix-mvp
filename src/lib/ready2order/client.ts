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
    body: JSON.stringify({ authorizationCallbackUri: redirectUri }),
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
  return r2oFetch<R2OProductGroup[]>('/productgroups', accountToken)
}

export async function createProductGroup(
  accountToken: string,
  name: string
): Promise<R2OProductGroup> {
  const data = await r2oFetch<{ productgroup_id: number; productgroup_name: string }>(
    '/productgroups',
    accountToken,
    {
      method: 'POST',
      body: JSON.stringify({ productgroup_name: name }),
    }
  )
  // Map lowercase R2O response to our interface
  return { productGroup_id: data.productgroup_id, productGroup_name: data.productgroup_name, productGroup_sortIndex: 0 }
}

// ============================================================================
// Invoices
// ============================================================================

export async function getInvoices(
  accountToken: string,
  params?: { from?: string; to?: string; limit?: number }
): Promise<R2OInvoice[]> {
  const searchParams = new URLSearchParams()
  if (params?.from) searchParams.set('dateFrom', params.from)
  if (params?.to) searchParams.set('dateTo', params.to)
  if (params?.limit) searchParams.set('limit', String(params.limit))

  const query = searchParams.toString()
  return r2oFetch<R2OInvoice[]>(`/document/invoice${query ? `?${query}` : ''}`, accountToken)
}

// ============================================================================
// Webhooks (R2O uses PUT /webhook to set URL, PUT /webhook/events to subscribe)
// ============================================================================

export async function registerWebhook(
  accountToken: string,
  url: string,
  events: string[]
): Promise<void> {
  // Step 1: Set the webhook URL
  await r2oFetch<unknown>('/webhook', accountToken, {
    method: 'PUT',
    body: JSON.stringify({ webhookUrl: url }),
  })

  // Step 2: Subscribe to events (one at a time, R2O expects a string not array)
  for (const event of events) {
    await r2oFetch<unknown>('/webhook/events', accountToken, {
      method: 'PUT',
      body: JSON.stringify({ addEvent: event }),
    })
  }
}

export async function getWebhookInfo(
  accountToken: string
): Promise<{ url: string; events: string[] }> {
  return r2oFetch<{ url: string; events: string[] }>('/webhook', accountToken)
}

export async function deleteWebhook(
  accountToken: string
): Promise<void> {
  // Clear webhook URL by setting it to empty
  await r2oFetch<unknown>('/webhook', accountToken, {
    method: 'PUT',
    body: JSON.stringify({ webhookUrl: '' }),
  })
}

// ============================================================================
// Company / Account Info
// ============================================================================

export async function getAccountId(
  accountToken: string
): Promise<string | null> {
  // Extract company_id from the JWT token payload
  try {
    const parts = accountToken.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    return payload.data?.company_id?.toString() || null
  } catch {
    return null
  }
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
