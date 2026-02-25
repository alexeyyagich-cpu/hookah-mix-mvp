import type { tip as TipType } from '../ru/tip'

export const tip: typeof TipType = {
  leaveTip: 'Leave a tip',
  customAmount: 'Custom amount',
  namePlaceholder: 'Your name (optional)',
  messagePlaceholder: 'Message (optional)',
  processing: 'Processing...',
  tipBtn: 'Tip',
  thankYou: 'Thank you!',
  tipReceived: (amount: number, name: string) => `Your tip of ${amount}\u20AC for ${name} has been received.`,
  staffNotFound: 'Staff member not found',
  staffNotFoundDesc: 'This tip link may be invalid or disabled.',
  error: 'Error',
  serviceNotConfigured: 'Service not configured',
  paymentFailed: 'Payment failed',
  connectionError: 'Connection error',
  poweredBy: 'Powered by Hookah Torus',
}
