import { describe, expect, it } from 'vitest'
import { SpatialGrid } from './SpatialGrid.ts'

function makeGrid() {
  const grid = new SpatialGrid<{ x: number; y: number; id: string }>(50)
  grid.resize(500, 500, 50)
  return grid
}

describe('SpatialGrid', () => {
  it('finds nearby items and skips distant ones', () => {
    const grid = makeGrid()
    grid.insert({ x: 100, y: 100, id: 'near' })
    grid.insert({ x: 400, y: 400, id: 'far' })
    const ids = grid.query(110, 110, 20, []).map((i) => i.id)
    expect(ids).toEqual(['near'])
  })

  it('finds items across cell boundaries', () => {
    const grid = makeGrid()
    grid.insert({ x: 149, y: 100, id: 'a' })
    grid.insert({ x: 151, y: 100, id: 'b' })
    const ids = grid.query(150, 100, 5, []).map((i) => i.id)
    expect(ids.sort()).toEqual(['a', 'b'])
  })

  it('handles items in the off-screen margin and beyond it', () => {
    const grid = makeGrid()
    grid.insert({ x: -30, y: 250, id: 'margin' })
    grid.insert({ x: -5000, y: 250, id: 'way-out' })
    const ids = grid.query(-40, 250, 10, []).map((i) => i.id)
    expect(ids.sort()).toEqual(['margin', 'way-out'])
  })

  it('empties on clear and reuses the output array', () => {
    const grid = makeGrid()
    grid.insert({ x: 10, y: 10, id: 'a' })
    const out = grid.query(10, 10, 5, [])
    grid.clear()
    expect(grid.query(10, 10, 5, out)).toBe(out)
    expect(out).toHaveLength(0)
  })
})
