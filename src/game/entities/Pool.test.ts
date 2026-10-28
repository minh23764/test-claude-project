import { describe, expect, it } from 'vitest'
import { Pool } from './Pool.ts'

const makePool = (capacity: number) => new Pool(() => ({ active: false, value: 0 }), capacity)

describe('Pool', () => {
  it('pre-allocates inactive objects', () => {
    const pool = makePool(3)
    expect(pool.items).toHaveLength(3)
    expect(pool.items.every((i) => !i.active)).toBe(true)
    expect(pool.size).toBe(0)
  })

  it('acquires until exhausted, then returns null', () => {
    const pool = makePool(2)
    expect(pool.acquire()).not.toBeNull()
    expect(pool.acquire()).not.toBeNull()
    expect(pool.acquire()).toBeNull()
    expect(pool.size).toBe(2)
  })

  it('recycles released objects', () => {
    const pool = makePool(1)
    const a = pool.acquire()!
    pool.release(a)
    expect(a.active).toBe(false)
    expect(pool.acquire()).toBe(a)
  })

  it('ignores double release', () => {
    const pool = makePool(2)
    const a = pool.acquire()!
    pool.release(a)
    pool.release(a)
    expect(pool.size).toBe(0)
    pool.acquire()
    pool.acquire()
    expect(pool.acquire()).toBeNull()
  })

  it('clears every active object', () => {
    const pool = makePool(3)
    pool.acquire()
    pool.acquire()
    pool.clear()
    expect(pool.size).toBe(0)
    expect(pool.items.some((i) => i.active)).toBe(false)
  })
})
