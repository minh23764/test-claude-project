interface Point {
  x: number
  y: number
}

/**
 * Uniform grid for broad-phase collision. Items are bucketed by center, so callers must widen
 * query radii by the largest item radius. Positions outside the grid clamp to the edge cells.
 */
export class SpatialGrid<T extends Point> {
  private readonly cellSize: number
  private originX = 0
  private originY = 0
  private cols = 0
  private rows = 0
  private cells: T[][] = []

  constructor(cellSize: number) {
    this.cellSize = cellSize
  }

  /** Covers the arena plus `margin` on every side, so just-spawned off-screen items get real cells. */
  resize(width: number, height: number, margin: number) {
    this.originX = -margin
    this.originY = -margin
    this.cols = Math.max(1, Math.ceil((width + margin * 2) / this.cellSize))
    this.rows = Math.max(1, Math.ceil((height + margin * 2) / this.cellSize))
    this.cells = Array.from({ length: this.cols * this.rows }, () => [])
  }

  clear() {
    for (const cell of this.cells) cell.length = 0
  }

  insert(item: T) {
    this.cells[this.row(item.y) * this.cols + this.col(item.x)].push(item)
  }

  /** Collects every item whose cell overlaps the square around (x, y) with half-size `radius`. */
  query(x: number, y: number, radius: number, out: T[]): T[] {
    out.length = 0
    const c0 = this.col(x - radius)
    const c1 = this.col(x + radius)
    const r0 = this.row(y - radius)
    const r1 = this.row(y + radius)
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        for (const item of this.cells[r * this.cols + c]) out.push(item)
      }
    }
    return out
  }

  private col(x: number): number {
    const c = Math.floor((x - this.originX) / this.cellSize)
    return c < 0 ? 0 : c >= this.cols ? this.cols - 1 : c
  }

  private row(y: number): number {
    const r = Math.floor((y - this.originY) / this.cellSize)
    return r < 0 ? 0 : r >= this.rows ? this.rows - 1 : r
  }
}
