// Simple noise generator for consistent patterns per page load
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }
}

export function generateNoise(width: number, height: number, seed: number): number[][] {
  const rng = new SeededRandom(seed)
  const noise: number[][] = []
  
  for (let y = 0; y < height; y++) {
    noise[y] = []
    for (let x = 0; x < width; x++) {
      noise[y][x] = rng.next()
    }
  }
  
  return noise
}

// Simplex-like 2D noise for wave patterns
export function simplexNoise2D(x: number, y: number, seed: number): number {
  const X = Math.floor(x)
  const Y = Math.floor(y)
  
  const hash = (i: number, j: number): number => {
    const h = (i * 374761393 + j * 668265263 + seed) % 2147483647
    return (h ^ (h >> 13)) / 2147483647
  }
  
  const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10)
  
  const xf = x - X
  const yf = y - Y
  
  const a = hash(X, Y)
  const b = hash(X + 1, Y)
  const c = hash(X, Y + 1)
  const d = hash(X + 1, Y + 1)
  
  const u = fade(xf)
  const v = fade(yf)
  
  const x1 = a * (1 - u) + b * u
  const x2 = c * (1 - u) + d * u
  
  return x1 * (1 - v) + x2 * v
}

