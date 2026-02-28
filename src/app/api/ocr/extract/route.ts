import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { ocrExtractResponseSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

export async function POST(request: NextRequest) {
  // Rate limit: 10 req/min per IP (paid API calls)
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`ocr:${ip}`, rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  // Auth: require logged-in user
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'OCR not configured' }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Reject files larger than 10 MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 10 MB)' }, { status: 400 })
    }

    // Convert to base64
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    const base64 = Buffer.from(buffer).toString('base64')

    // Validate actual file content via magic bytes (don't trust client MIME type)
    type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
    let mediaType: ImageMediaType | null = null
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) mediaType = 'image/jpeg'
    else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) mediaType = 'image/png'
    else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) mediaType = 'image/gif'
    else if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) mediaType = 'image/webp'

    if (!mediaType) {
      return NextResponse.json({ error: 'Unsupported image format. Use JPEG, PNG, or WebP.' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY, timeout: 30_000 })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `Extract tobacco items from this invoice/receipt image. Return a JSON object with this structure:
{
  "items": [
    { "brand": "Brand Name", "flavor": "Flavor Name", "quantity": 1, "price": 25.99, "packageGrams": 200 }
  ],
  "total": 123.45,
  "supplier": "Supplier Name or null",
  "date": "2024-01-15 or null"
}

Rules:
- Extract ALL tobacco items (hookah/shisha tobacco)
- For quantity, use the number of packages (default 1)
- For packageGrams, use the weight per package in grams (default 200)
- For price, use the unit price per item
- If any field is unclear, use reasonable defaults
- Return ONLY the JSON, no other text`,
            },
          ],
        },
      ],
    })

    // Extract text from response
    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response' }, { status: 500 })
    }

    // Parse JSON from response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse response' }, { status: 500 })
    }

    const raw = JSON.parse(jsonMatch[0])
    const validated = ocrExtractResponseSchema.safeParse(raw)
    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid extraction result' }, { status: 500 })
    }

    return NextResponse.json(validated.data)
  } catch (error) {
    logger.error('OCR extraction error', { error: String(error) })
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}
