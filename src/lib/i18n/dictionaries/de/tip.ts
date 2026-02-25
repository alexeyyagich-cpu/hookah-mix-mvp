import type { tip as TipType } from '../ru/tip'

export const tip: typeof TipType = {
  leaveTip: 'Trinkgeld geben',
  customAmount: 'Eigener Betrag',
  namePlaceholder: 'Ihr Name (optional)',
  messagePlaceholder: 'Nachricht (optional)',
  processing: 'Verarbeitung...',
  tipBtn: 'Trinkgeld',
  thankYou: 'Vielen Dank!',
  tipReceived: (amount: number, name: string) => `Ihr Trinkgeld von ${amount}\u20AC f\u00FCr ${name} wurde empfangen.`,
  staffNotFound: 'Mitarbeiter nicht gefunden',
  staffNotFoundDesc: 'Dieser Trinkgeld-Link ist ung\u00FCltig oder deaktiviert.',
  error: 'Fehler',
  serviceNotConfigured: 'Dienst nicht konfiguriert',
  paymentFailed: 'Zahlung fehlgeschlagen',
  connectionError: 'Verbindungsfehler',
  poweredBy: 'Powered by Hookah Torus',
}
