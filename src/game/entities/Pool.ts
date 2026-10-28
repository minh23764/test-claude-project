export interface Poolable {
  active: boolean
}

/**
 * Fixed-capacity object pool. All objects are allocated up front and recycled, so spawning
 * and destroying hundreds of entities per second creates no garbage and no GC stutter.
 */
export class Pool<T extends Poolable> {
  /** Every object, active or not. Iterate and skip `!active` ones. */
  readonly items: readonly T[]
  private readonly free: T[]
  private activeCount = 0

  constructor(factory: () => T, capacity: number) {
    const items: T[] = []
    for (let i = 0; i < capacity; i++) {
      const item = factory()
      item.active = false
      items.push(item)
    }
    this.items = items
    this.free = items.slice().reverse()
  }

  get size(): number {
    return this.activeCount
  }

  /** Returns an inactive object marked active, or null when the pool is exhausted. */
  acquire(): T | null {
    const item = this.free.pop()
    if (!item) return null
    item.active = true
    this.activeCount++
    return item
  }

  release(item: T) {
    if (!item.active) return
    item.active = false
    this.free.push(item)
    this.activeCount--
  }

  clear() {
    for (const item of this.items) this.release(item)
  }
}
