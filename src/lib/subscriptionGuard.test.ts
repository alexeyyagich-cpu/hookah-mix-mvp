import { describe, it, expect } from 'vitest'
import { hasFeatureAccess, featureNotAvailable } from './subscriptionGuard'

describe('hasFeatureAccess', () => {
  // Core/Trial features
  it('core has export', () => {
    expect(hasFeatureAccess('core', 'export')).toBe(true)
  })

  it('core has bar_module', () => {
    expect(hasFeatureAccess('core', 'bar_module')).toBe(true)
  })

  it('core has pos_integration', () => {
    expect(hasFeatureAccess('core', 'pos_integration')).toBe(true)
  })

  it('core does not have crm', () => {
    expect(hasFeatureAccess('core', 'crm')).toBe(false)
  })

  it('core does not have waiter_tablet', () => {
    expect(hasFeatureAccess('core', 'waiter_tablet')).toBe(false)
  })

  it('core does not have financial_reports', () => {
    expect(hasFeatureAccess('core', 'financial_reports')).toBe(false)
  })

  it('core does not have api_access', () => {
    expect(hasFeatureAccess('core', 'api_access')).toBe(false)
  })

  it('core max_locations is 1 (truthy)', () => {
    expect(hasFeatureAccess('core', 'max_locations')).toBe(true)
  })

  // Trial = same as core
  it('trial has same features as core', () => {
    expect(hasFeatureAccess('trial', 'export')).toBe(true)
    expect(hasFeatureAccess('trial', 'crm')).toBe(false)
  })

  // Multi features
  it('multi has crm', () => {
    expect(hasFeatureAccess('multi', 'crm')).toBe(true)
  })

  it('multi has waiter_tablet', () => {
    expect(hasFeatureAccess('multi', 'waiter_tablet')).toBe(true)
  })

  it('multi has financial_reports', () => {
    expect(hasFeatureAccess('multi', 'financial_reports')).toBe(true)
  })

  it('multi has api_access', () => {
    expect(hasFeatureAccess('multi', 'api_access')).toBe(true)
  })

  it('multi has marketplace', () => {
    expect(hasFeatureAccess('multi', 'marketplace')).toBe(true)
  })

  // Enterprise = same as multi
  it('enterprise has same features as multi', () => {
    expect(hasFeatureAccess('enterprise', 'crm')).toBe(true)
    expect(hasFeatureAccess('enterprise', 'api_access')).toBe(true)
  })
})

describe('featureNotAvailable', () => {
  it('returns 403 with feature name in error', async () => {
    const res = featureNotAvailable('crm')
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toContain('crm')
  })
})
