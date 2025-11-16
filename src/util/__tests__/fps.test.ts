import { describe, it, expect } from 'vitest'
import { calculateFPS } from '../fps'

describe('calculateFPS', () => {
  it('should return 0 when elapsed time is 0', () => {
    expect(calculateFPS(100, 0)).toBe(0)
  })

  it('should calculate FPS correctly for 60 frames in 1 second', () => {
    expect(calculateFPS(60, 1000)).toBe(60)
  })

  it('should calculate FPS correctly for 30 frames in 0.5 seconds', () => {
    expect(calculateFPS(30, 500)).toBe(60)
  })

  it('should calculate FPS correctly for 120 frames in 2 seconds', () => {
    expect(calculateFPS(120, 2000)).toBe(60)
  })

  it('should handle fractional FPS values', () => {
    expect(calculateFPS(100, 3000)).toBeCloseTo(33.33, 1)
  })
})