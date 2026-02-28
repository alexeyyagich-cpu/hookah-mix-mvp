/** Client-safe email configuration check — does NOT import the resend package. */
export const isEmailConfigured = Boolean(process.env.RESEND_API_KEY)
