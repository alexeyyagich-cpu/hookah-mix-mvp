import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.R2O_ENCRYPTION_KEY
  if (!key || key.length < 32) {
    throw new Error('R2O_ENCRYPTION_KEY must be at least 32 characters')
  }
  // Use first 32 bytes as key
  return Buffer.from(key.slice(0, 32), 'utf-8')
}

export function encrypt(plaintext: string): { encrypted: string; iv: string } {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const tag = cipher.getAuthTag()

  return {
    encrypted: encrypted + tag.toString('hex'),
    iv: iv.toString('hex'),
  }
}

export function decrypt(encryptedHex: string, ivHex: string): string {
  const key = getKey()
  const iv = Buffer.from(ivHex, 'hex')

  // Split encrypted data and auth tag
  const tagStart = encryptedHex.length - TAG_LENGTH * 2
  const encrypted = encryptedHex.slice(0, tagStart)
  const tag = Buffer.from(encryptedHex.slice(tagStart), 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
