import { vi } from 'vitest'

// Mock AudioContext for useKDS beep tests
vi.stubGlobal('AudioContext', class MockAudioContext {
  state = 'running'
  currentTime = 0
  createOscillator() {
    return {
      type: '',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }
  }
  createGain() {
    return {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    }
  }
  get destination() { return {} }
  resume() { return Promise.resolve() }
})

// Stub navigator.onLine
Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
