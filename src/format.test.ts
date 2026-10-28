import { describe, expect, it } from 'vitest'
import { formatTime } from './format.ts'

describe('formatTime', () => {
  it('formats as m:ss', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(9.9)).toBe('0:09')
    expect(formatTime(75)).toBe('1:15')
    expect(formatTime(600)).toBe('10:00')
  })
})
