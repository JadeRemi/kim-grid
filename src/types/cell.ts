export type CellType = 'empty' | 'being'

export interface Cell {
  type: CellType
  value: number
  baseValue: number // For Empty cells to remember their base value
  lastGrowthTime?: number // For Beings
  nextGrowthDelay?: number // For Beings
  consumeTime?: number // For yellow fade effect
  beingId?: string // ID of the Being this cell belongs to
  isBeingCenter?: boolean // True if this is the center cell of a Being
  beingDistance?: number // Distance from Being center (for body cells)
}

export interface Being {
  id: string
  centerRow: number
  centerCol: number
  bodyCells: { row: number; col: number; distance: number }[]
  value: number
  lastGrowthTime: number
  nextGrowthDelay: number
  consumeTime?: number
}

export interface Payload {
  row: number
  col: number
  value: number
  targetCol: number // For smooth sub-cell movement
  centerValue: number // Original center value for gradient calculation
}

