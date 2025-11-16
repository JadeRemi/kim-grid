import { useEffect, useRef, useState, useCallback } from 'react'
import { CONFIG } from '../config'
import { calculateFPS } from '../util/fps'
import { PALETTE } from '../styles/palette'
import { TYPOGRAPHY } from '../styles/typography'
import { Cell, Payload, Being } from '../types/cell'
import { generateNoise, simplexNoise2D } from '../util/noise'
import './GameCanvas.css'

function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationIdRef = useRef<number>(0)
  const [fps, setFps] = useState(0)
  const frameCountRef = useRef(0)
  const fpsUpdateTimeRef = useRef(0)
  const lastFrameTimeRef = useRef(0)
  
  const pageSeedRef = useRef(Math.random() * 100000)
  const noiseOffsetRef = useRef(0) // Continuous scrolling offset
  const hoveredCellRef = useRef<{ col: number; row: number } | null>(null) // Cache hover state
  
  // Pre-calculated noise texture for scrolling (huge performance win)
  const noiseTextureRef = useRef<number[][]>([])

  // Initialize grid with Beings and Empty cells
  const gridRef = useRef<Cell[][] | null>(null)
  
  // Beings system (separate from grid for easier management)
  const beingsRef = useRef<Being[]>([])
  
  // Payloads system
  const payloadsRef = useRef<Payload[]>([])

  const initializeGrid = useCallback(() => {
    const noise = generateNoise(CONFIG.GRID_COLS, CONFIG.GRID_ROWS, pageSeedRef.current)
    const grid: Cell[][] = []
    
    // Initialize empty grid first
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      grid[row] = []
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const baseValue = Math.floor(Math.pow(noise[row][col], 2.5) * (CONFIG.EMPTY_MAX_VALUE + 1))
        grid[row][col] = {
          type: 'empty',
          value: baseValue,
          baseValue
        }
      }
    }
    
    // Find top N noise values for Being centers
    const noiseValues: { value: number; row: number; col: number }[] = []
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        noiseValues.push({ value: noise[row][col], row, col })
      }
    }
    noiseValues.sort((a, b) => b.value - a.value)
    
    // Create Beings with blob-shaped bodies
    const beings: Being[] = []
    for (let i = 0; i < CONFIG.BEINGS_COUNT; i++) {
      const centerRow = noiseValues[i].row
      const centerCol = noiseValues[i].col
      const beingId = `being-${i}`
      
      // Generate blob-shaped body
      const bodySize = CONFIG.BEING_BODY_MIN_SIZE + 
        Math.floor(Math.random() * (CONFIG.BEING_BODY_MAX_SIZE - CONFIG.BEING_BODY_MIN_SIZE + 1))
      
      const bodyCells: { row: number; col: number }[] = [{ row: centerRow, col: centerCol }]
      const candidates: { row: number; col: number }[] = [{ row: centerRow, col: centerCol }]
      const visited = new Set<string>()
      visited.add(`${centerRow},${centerCol}`)
      
      while (bodyCells.length < bodySize && candidates.length > 0) {
        const idx = Math.floor(Math.random() * candidates.length)
        const cell = candidates.splice(idx, 1)[0]
        
        // Add adjacent cells as candidates
        const adjacent = [
          { row: cell.row - 1, col: cell.col },
          { row: cell.row + 1, col: cell.col },
          { row: cell.row, col: cell.col - 1 },
          { row: cell.row, col: cell.col + 1 }
        ]
        
        for (const adj of adjacent) {
          const key = `${adj.row},${adj.col}`
          if (!visited.has(key) && 
              adj.row >= 0 && adj.row < CONFIG.GRID_ROWS &&
              adj.col >= 0 && adj.col < CONFIG.GRID_COLS &&
              grid[adj.row][adj.col].type === 'empty') {
            visited.add(key)
            if (Math.random() < 0.6 && bodyCells.length < bodySize) {
              bodyCells.push(adj)
              candidates.push(adj)
            }
          }
        }
      }
      
      // Create Being
      const digits = 7 + Math.floor(noise[centerRow][centerCol] * 4)
      const value = Math.floor(Math.pow(10, digits - 1) + noise[centerRow][centerCol] * Math.pow(10, digits - 1) * 9)
      
      beings.push({
        id: beingId,
        centerRow,
        centerCol,
        bodyCells,
        value,
        lastGrowthTime: 0,
        nextGrowthDelay: CONFIG.BEING_GROWTH_MIN_INTERVAL + 
          Math.random() * (CONFIG.BEING_GROWTH_MAX_INTERVAL - CONFIG.BEING_GROWTH_MIN_INTERVAL)
      })
      
      // Mark body cells in grid
      bodyCells.forEach(cell => {
        grid[cell.row][cell.col] = {
          type: 'being',
          value,
          baseValue: value,
          beingId,
          isBeingCenter: cell.row === centerRow && cell.col === centerCol
        }
      })
    }
    
    beingsRef.current = beings
    return grid
  }, [])

  // Color gradient cache
  const colorCacheRef = useRef<Map<number, string>>(new Map())
  
  const getColorForCell = useCallback((cell: Cell, displayValue: number, isHovered: boolean, payloadValue: number, timestamp: number): string => {
    if (payloadValue > 0) {
      // Gradient from dark to light indigo based on payload value
      const t = Math.min(1, payloadValue / CONFIG.PAYLOAD_MAX_VALUE)
      const r = Math.floor(CONFIG.COLOR_PAYLOAD_MIN_R + (CONFIG.COLOR_PAYLOAD_MAX_R - CONFIG.COLOR_PAYLOAD_MIN_R) * t)
      const g = Math.floor(CONFIG.COLOR_PAYLOAD_MIN_G + (CONFIG.COLOR_PAYLOAD_MAX_G - CONFIG.COLOR_PAYLOAD_MIN_G) * t)
      const b = Math.floor(CONFIG.COLOR_PAYLOAD_MIN_B + (CONFIG.COLOR_PAYLOAD_MAX_B - CONFIG.COLOR_PAYLOAD_MIN_B) * t)
      return `rgb(${r}, ${g}, ${b})`
    }
    
    if (cell.type === 'being') {
      // Yellow fade effect if recently consumed payload
      if (cell.consumeTime && timestamp - cell.consumeTime < CONFIG.BEING_CONSUME_FADE_DURATION) {
        const fadeProgress = (timestamp - cell.consumeTime) / CONFIG.BEING_CONSUME_FADE_DURATION
        const r = Math.floor(CONFIG.COLOR_BEING_FADE_R + (CONFIG.COLOR_BEING_R - CONFIG.COLOR_BEING_FADE_R) * fadeProgress)
        const g = Math.floor(CONFIG.COLOR_BEING_FADE_G + (CONFIG.COLOR_BEING_G - CONFIG.COLOR_BEING_FADE_G) * fadeProgress)
        const b = Math.floor(CONFIG.COLOR_BEING_FADE_B + (CONFIG.COLOR_BEING_B - CONFIG.COLOR_BEING_FADE_B) * fadeProgress)
        return `rgb(${r}, ${g}, ${b})`
      }
      return `rgb(${CONFIG.COLOR_BEING_R}, ${CONFIG.COLOR_BEING_G}, ${CONFIG.COLOR_BEING_B})`
    } else {
      if (isHovered) {
        return `rgb(${CONFIG.COLOR_EMPTY_HOVER_R}, ${CONFIG.COLOR_EMPTY_HOVER_G}, ${CONFIG.COLOR_EMPTY_HOVER_B})`
      }
      
      // Check cache first
      const cached = colorCacheRef.current.get(displayValue)
      if (cached) return cached
      
      // Calculate color gradient based on value
      const t = Math.min(displayValue / CONFIG.WAVE_PEAK_VALUE, 1)
      const r = Math.floor(CONFIG.COLOR_EMPTY_MIN_R + (CONFIG.COLOR_EMPTY_MAX_R - CONFIG.COLOR_EMPTY_MIN_R) * t)
      const g = Math.floor(CONFIG.COLOR_EMPTY_MIN_G + (CONFIG.COLOR_EMPTY_MAX_G - CONFIG.COLOR_EMPTY_MIN_G) * t)
      const b = Math.floor(CONFIG.COLOR_EMPTY_MIN_B + (CONFIG.COLOR_EMPTY_MAX_B - CONFIG.COLOR_EMPTY_MIN_B) * t)
      
      const color = `rgb(${r}, ${g}, ${b})`
      colorCacheRef.current.set(displayValue, color)
      return color
    }
  }, [])

  const updateNoise = useCallback(() => {
    // Continuously scroll noise pattern right-to-left
    noiseOffsetRef.current += CONFIG.NOISE_SCROLL_SPEED / CONFIG.CELL_WIDTH
  }, [])
  
  const updateEmptyCells = useCallback(() => {
    if (!gridRef.current) return
    
    // Random fluctuation for empty cells (no per-cell timers)
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const cell = gridRef.current[row][col]
        
        if (cell.type === 'empty') {
          // Small probability of change each frame
          if (Math.random() < CONFIG.EMPTY_FLUCTUATION_PROBABILITY) {
            const change = Math.floor(Math.random() * 3) - 1 // -1, 0, or +1
            cell.baseValue = Math.max(CONFIG.EMPTY_MIN_VALUE, 
              Math.min(CONFIG.EMPTY_MAX_VALUE, cell.baseValue + change))
          }
        }
      }
    }
  }, [])
  
  const updatePayloads = useCallback((timestamp: number) => {
    if (!gridRef.current) return
    
    const payloads = payloadsRef.current
    const toRemove: number[] = []
    
    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i]
      
      // Move payload left
      payload.targetCol -= CONFIG.PAYLOAD_SPEED
      payload.col = Math.floor(payload.targetCol)
      
      // Check if reached left edge
      if (payload.col < 0) {
        toRemove.push(i)
        continue
      }
      
      // Check if hit a Being (check any body cell)
      if (payload.col >= 0 && payload.col < CONFIG.GRID_COLS) {
        const cell = gridRef.current[payload.row][payload.col]
        
        if (cell.type === 'being' && cell.beingId) {
          // Find the Being
          const being = beingsRef.current.find(b => b.id === cell.beingId)
          if (being) {
            // Consume payload
            being.consumeTime = timestamp
            // Update all body cells
            being.bodyCells.forEach(bc => {
              gridRef.current![bc.row][bc.col].consumeTime = timestamp
            })
            toRemove.push(i)
            
            // Release 1-3 new payloads to adjacent empty cells (not to the right)
            const splitCount = CONFIG.PAYLOAD_SPLIT_MIN + 
              Math.floor(Math.random() * (CONFIG.PAYLOAD_SPLIT_MAX - CONFIG.PAYLOAD_SPLIT_MIN + 1))
            const splitValue = Math.floor(payload.value * CONFIG.PAYLOAD_SPLIT_REDUCTION)
            
            // Create set of existing payload positions
            const existingPayloads = new Set<string>()
            payloads.forEach(p => {
              existingPayloads.add(`${p.row},${Math.floor(p.targetCol)}`)
            })
            
            // Find all adjacent empty cells to the Being's body (excluding right side)
            const adjacentEmptyCells: { row: number; col: number }[] = []
            const checked = new Set<string>()
            
            being.bodyCells.forEach(bc => {
              const directions = [
                { row: bc.row - 1, col: bc.col },     // top
                { row: bc.row + 1, col: bc.col },     // bottom
                { row: bc.row, col: bc.col - 1 }      // left
                // NOT right: { row: bc.row, col: bc.col + 1 }
              ]
              
              directions.forEach(dir => {
                const key = `${dir.row},${dir.col}`
                if (!checked.has(key) &&
                    dir.row >= 0 && dir.row < CONFIG.GRID_ROWS &&
                    dir.col >= 0 && dir.col < CONFIG.GRID_COLS) {
                  checked.add(key)
                  const targetCell = gridRef.current![dir.row][dir.col]
                  if (targetCell.type === 'empty' && !existingPayloads.has(key)) {
                    adjacentEmptyCells.push(dir)
                  }
                }
              })
            })
            
            // Randomly select cells to spawn payloads
            for (let j = 0; j < splitCount && adjacentEmptyCells.length > 0; j++) {
              const idx = Math.floor(Math.random() * adjacentEmptyCells.length)
              const target = adjacentEmptyCells.splice(idx, 1)[0]
              const key = `${target.row},${target.col}`
              
              payloads.push({
                row: target.row,
                col: target.col,
                targetCol: target.col,
                value: splitValue,
                centerValue: splitValue
              })
              existingPayloads.add(key)
            }
          }
        }
      }
    }
    
    // Remove consumed/destroyed payloads
    for (let i = toRemove.length - 1; i >= 0; i--) {
      payloads.splice(toRemove[i], 1)
    }
  }, [])

  const updateBeings = useCallback((timestamp: number) => {
    if (!gridRef.current) return
    
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const cell = gridRef.current[row][col]
        
        if (cell.type === 'being' && cell.lastGrowthTime !== undefined) {
          if (timestamp - cell.lastGrowthTime >= cell.nextGrowthDelay!) {
            // Determine growth points (more likely to be 0)
            const rand = Math.random()
            const noGrowthChance = CONFIG.BEING_NO_GROWTH_WEIGHT / (CONFIG.BEING_NO_GROWTH_WEIGHT + CONFIG.BEING_GROWTH_MAX_POINTS)
            
            let points = 0
            if (rand > noGrowthChance) {
              points = 1 + Math.floor(Math.random() * CONFIG.BEING_GROWTH_MAX_POINTS)
            }
            
            cell.value = Math.min(cell.value + points, CONFIG.BEING_MAX_VALUE)
            cell.lastGrowthTime = timestamp
            cell.nextGrowthDelay = CONFIG.BEING_GROWTH_MIN_INTERVAL + 
              Math.random() * (CONFIG.BEING_GROWTH_MAX_INTERVAL - CONFIG.BEING_GROWTH_MIN_INTERVAL)
          }
        }
      }
    }
  }, [])

  const renderGrid = useCallback((ctx: CanvasRenderingContext2D, timestamp: number) => {
    if (!gridRef.current) return
    
    // Set font once
    ctx.font = `${CONFIG.FONT_SIZE}px ${TYPOGRAPHY.fonts.primary}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Use cached hover state (updated less frequently)
    const hoveredCol = hoveredCellRef.current?.col ?? -1
    const hoveredRow = hoveredCellRef.current?.row ?? -1

    const noiseOffset = Math.floor(noiseOffsetRef.current)
    const noiseTexture = noiseTextureRef.current
    const textureWidth = noiseTexture[0]?.length || 0
    
    // Create payload position map for quick lookup
    const payloadMap = new Set<string>()
    payloadsRef.current.forEach(p => {
      if (p.col >= 0 && p.col < CONFIG.GRID_COLS) {
        payloadMap.add(`${p.row},${p.col}`)
      }
    })
    
    // Batch rendering by color to reduce fillStyle calls
    const renderBatches = new Map<string, Array<{x: number, y: number, text: string}>>()

    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const cell = gridRef.current[row][col]
        
        // Check if payload is on this cell
        const hasPayload = payloadMap.has(`${row},${col}`)
        
        // Calculate display value
        let displayValue = cell.baseValue
        
        // Add payload value if present
        if (hasPayload) {
          const payload = payloadsRef.current.find(p => p.row === row && Math.floor(p.targetCol) === col)
          if (payload) {
            displayValue += payload.value
          }
        }
        
        // Continuous scrolling noise for empty cells
        if (cell.type === 'empty' && textureWidth > 0 && !hasPayload) {
          // Sample from pre-calculated noise texture
          const texCol = (col + noiseOffset) % textureWidth
          const noiseValue = noiseTexture[row][texCol]
          
          // Only apply wave effect if noise is above threshold
          if (noiseValue > CONFIG.WAVE_THRESHOLD) {
            const waveIntensity = (noiseValue - CONFIG.WAVE_THRESHOLD) / (1 - CONFIG.WAVE_THRESHOLD)
            const waveBoost = CONFIG.WAVE_MIN_VALUE + 
              waveIntensity * (CONFIG.WAVE_PEAK_VALUE - CONFIG.WAVE_MIN_VALUE)
            displayValue = Math.floor(cell.baseValue + waveBoost)
          }
        } else if (cell.type === 'being' && !hasPayload) {
          displayValue = cell.value
        }
        
        // Check if this cell is hovered
        const isHovered = (col === hoveredCol && row === hoveredRow && cell.type === 'empty')
        
        // Get color (uses cache)
        const color = getColorForCell(cell, displayValue, isHovered, hasPayload, timestamp)
        
        // Batch by color
        if (!renderBatches.has(color)) {
          renderBatches.set(color, [])
        }
        
        const x = col * CONFIG.CELL_WIDTH + CONFIG.CELL_WIDTH / 2
        const y = row * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2
        const paddedValue = displayValue.toString().padStart(2, '0')
        
        renderBatches.get(color)!.push({ x, y, text: `[${paddedValue}]` })
      }
    }
    
    // Render all cells of the same color together (reduces fillStyle calls)
    renderBatches.forEach((cells, color) => {
      ctx.fillStyle = color
      cells.forEach(({ x, y, text }) => {
        ctx.fillText(text, x, y)
      })
    })
  }, [getColorForCell])

  const renderUI = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = PALETTE.ui.fps
    ctx.font = `${TYPOGRAPHY.sizes.fps}px ${TYPOGRAPHY.fonts.fps}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(`FPS: ${fps.toFixed(0)}`, CONFIG.FPS_DISPLAY_X, CONFIG.FPS_DISPLAY_Y)
  }, [fps])

  useEffect(() => {
    // Pre-calculate noise texture (one-time cost, huge performance win)
    const textureWidth = CONFIG.GRID_COLS * 3 // 3x width for seamless scrolling
    const texture: number[][] = []
    const seed = pageSeedRef.current
    
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      texture[row] = []
      for (let col = 0; col < textureWidth; col++) {
        // Stretched noise for vertical/diagonal stripe pattern
        const noiseX = col * CONFIG.NOISE_SCALE_X
        const noiseY = row * CONFIG.NOISE_SCALE_Y
        texture[row][col] = simplexNoise2D(noiseX, noiseY, seed)
      }
    }
    noiseTextureRef.current = texture
    
    // Initialize grid on mount
    gridRef.current = initializeGrid()
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Mouse move handler - throttled to avoid FPS drops
    let lastHoverUpdate = 0
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now()
      if (now - lastHoverUpdate < 50) return // Throttle to 20 updates/sec max
      lastHoverUpdate = now
      
      const rect = canvas.getBoundingClientRect()
      const scaleX = CONFIG.CANVAS_WIDTH / rect.width
      const scaleY = CONFIG.CANVAS_HEIGHT / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY
      
      const col = Math.floor(x / CONFIG.CELL_WIDTH)
      const row = Math.floor(y / CONFIG.CELL_HEIGHT)
      
      if (col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS) {
        hoveredCellRef.current = { col, row }
      } else {
        hoveredCellRef.current = null
      }
    }

    const handleMouseLeave = () => {
      hoveredCellRef.current = null
    }
    
    const handleClick = (e: MouseEvent) => {
      if (!gridRef.current) return
      
      const rect = canvas.getBoundingClientRect()
      const scaleX = CONFIG.CANVAS_WIDTH / rect.width
      const scaleY = CONFIG.CANVAS_HEIGHT / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY
      
      const clickCol = Math.floor(x / CONFIG.CELL_WIDTH)
      const clickRow = Math.floor(y / CONFIG.CELL_HEIGHT)
      
      if (clickCol >= 0 && clickCol < CONFIG.GRID_COLS && clickRow >= 0 && clickRow < CONFIG.GRID_ROWS) {
        // Create blob of payloads (1-10 cells)
        const blobSize = CONFIG.PAYLOAD_BLOB_MIN_SIZE + 
          Math.floor(Math.random() * (CONFIG.PAYLOAD_BLOB_MAX_SIZE - CONFIG.PAYLOAD_BLOB_MIN_SIZE + 1))
        
        const value = CONFIG.PAYLOAD_MIN_VALUE + 
          Math.floor(Math.random() * (CONFIG.PAYLOAD_MAX_VALUE - CONFIG.PAYLOAD_MIN_VALUE + 1))
        
        // Create set of existing payload positions
        const existingPayloads = new Set<string>()
        payloadsRef.current.forEach(p => {
          existingPayloads.add(`${p.row},${Math.floor(p.targetCol)}`)
        })
        
        // Start with clicked cell and grow blob
        const blobCells: { row: number; col: number }[] = []
        const candidates: { row: number; col: number }[] = [{ row: clickRow, col: clickCol }]
        const visited = new Set<string>()
        
        while (blobCells.length < blobSize && candidates.length > 0) {
          const idx = Math.floor(Math.random() * candidates.length)
          const cell = candidates.splice(idx, 1)[0]
          const key = `${cell.row},${cell.col}`
          
          if (visited.has(key)) continue
          visited.add(key)
          
          // Check if cell is valid for payload
          if (cell.row >= 0 && cell.row < CONFIG.GRID_ROWS && 
              cell.col >= 0 && cell.col < CONFIG.GRID_COLS) {
            const gridCell = gridRef.current[cell.row][cell.col]
            
            // Only add if cell is empty and no payload exists there
            if (gridCell.type === 'empty' && !existingPayloads.has(key)) {
              blobCells.push(cell)
              existingPayloads.add(key) // Mark as occupied for this blob
              
              // Add adjacent cells as candidates
              const adjacent = [
                { row: cell.row - 1, col: cell.col },     // top
                { row: cell.row + 1, col: cell.col },     // bottom
                { row: cell.row, col: cell.col - 1 },     // left
                { row: cell.row, col: cell.col + 1 },     // right
              ]
              candidates.push(...adjacent)
            }
          }
        }
        
        // Create payloads for all cells in blob
        blobCells.forEach(cell => {
          payloadsRef.current.push({
            row: cell.row,
            col: cell.col,
            targetCol: cell.col,
            value
          })
        })
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove, { passive: true })
    canvas.addEventListener('mouseleave', handleMouseLeave)
    canvas.addEventListener('click', handleClick)

    const gameLoop = (timestamp: number) => {
      // Always request next frame immediately (constant rate)
      animationIdRef.current = requestAnimationFrame(gameLoop)
      
      // Cap at 60 FPS - skip frame if too fast
      const deltaTime = timestamp - lastFrameTimeRef.current
      const frameInterval = 1000 / CONFIG.MAX_FPS
      
      if (deltaTime < frameInterval - 1) {
        return // Skip this frame, too early
      }

      lastFrameTimeRef.current = timestamp
        
      // Count frames for FPS display
        frameCountRef.current++
        
        if (timestamp - fpsUpdateTimeRef.current >= CONFIG.FPS_UPDATE_INTERVAL) {
          const currentFps = calculateFPS(
            frameCountRef.current,
            timestamp - fpsUpdateTimeRef.current
          )
          setFps(currentFps)
          frameCountRef.current = 0
          fpsUpdateTimeRef.current = timestamp
        }

      // Update game state (does not affect render rate)
      updateNoise()
      updateBeings(timestamp)
      updateEmptyCells()
      updatePayloads(timestamp)

      // Clear canvas with dark grey background
        ctx.fillStyle = PALETTE.background.canvas
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT)

      // Render grid and UI every frame
      renderGrid(ctx, timestamp)
        renderUI(ctx)
    }

    animationIdRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      canvas.removeEventListener('click', handleClick)
    }
  }, [initializeGrid, renderGrid, renderUI, updateNoise, updateBeings, updateEmptyCells, updatePayloads])

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        width={CONFIG.CANVAS_WIDTH}
        height={CONFIG.CANVAS_HEIGHT}
        className="game-canvas"
      />
    </div>
  )
}

export default GameCanvas