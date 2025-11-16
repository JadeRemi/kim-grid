export const CONFIG = {
  // Canvas settings
  CANVAS_WIDTH: 1920,
  CANVAS_HEIGHT: 1080,
  MAX_FPS: 60,
  FPS_UPDATE_INTERVAL: 100,
  
  // Grid settings
  CELL_WIDTH: 50,
  CELL_HEIGHT: 20,
  GRID_ROWS: 135,
  GRID_COLS: 192,
  
  // Display settings
  MAX_DIGITS: 10,
  FONT_SIZE: 14,
  FPS_DISPLAY_X: 10,
  FPS_DISPLAY_Y: 30,
  
  // Being settings
  BEING_MIN_DIGITS: 7,
  BEING_MAX_VALUE: 9999999999, // 10 digits
  BEINGS_COUNT: 100,
  BEING_BODY_MIN_SIZE: 1, // Min cells in Being body (1 = just center)
  BEING_BODY_MAX_SIZE: 20, // Max cells in Being body
  BEING_SINGLE_CELL_CHANCE: 0.15, // 15% chance of single-cell Being
  BEING_GROWTH_MIN_INTERVAL: 1000, // 1 second
  BEING_GROWTH_MAX_INTERVAL: 10000, // 10 seconds
  BEING_GROWTH_MIN_POINTS: 0,
  BEING_GROWTH_MAX_POINTS: 9,
  BEING_NO_GROWTH_WEIGHT: 3, // Higher = more likely to get 0 points
  
  // Empty cell settings
  EMPTY_MIN_VALUE: 0,
  EMPTY_MAX_VALUE: 9,
  EMPTY_FLUCTUATION_PROBABILITY: 0.0017, // ~1/600 chance per frame = ~10 sec average at 60fps
  
  // Wave settings (continuous scrolling noise)
  NOISE_SCROLL_SPEED: 2.0, // Pixels per frame (scrolls right-to-left)
  NOISE_SCALE_X: 0.08, // Noise frequency X (for vertical orientation)
  NOISE_SCALE_Y: 0.015, // Noise frequency Y (smaller = horizontal stretching for vertical waves)
  WAVE_THRESHOLD: 0.7, // Noise value above this creates wave effect
  WAVE_PEAK_VALUE: 300, // Max value at wave crest (reduced for less intensity)
  WAVE_MIN_VALUE: 50, // Min value during wave effect
  
  // Payload settings
  PAYLOAD_MIN_VALUE: 100,
  PAYLOAD_MAX_VALUE: 900,
  PAYLOAD_SPEED: 0.04, // Cells per frame (same as wave speed: 2.0 pixels / 50px cell width)
  PAYLOAD_SPLIT_MIN: 1, // Min payloads when consumed
  PAYLOAD_SPLIT_MAX: 3, // Max payloads when consumed
  PAYLOAD_SPLIT_REDUCTION: 0.3, // Split payloads are 30% of original
  BEING_CONSUME_FADE_DURATION: 5000, // 5 seconds yellow fade
  PAYLOAD_BLOB_MIN_SIZE: 1, // Min cells in blob
  PAYLOAD_BLOB_MAX_SIZE: 10, // Max cells in blob
  PAYLOAD_MAX_COUNT: 500, // Maximum number of payloads to prevent memory leaks
  RANDOM_PAYLOAD_PROBABILITY: 0.001, // ~1/1000 chance per frame (~1 every 17 seconds at 60fps)
  RANDOM_PAYLOAD_MIN_VALUE: 20,
  RANDOM_PAYLOAD_MAX_VALUE: 150,
  
  // Colors (RGB)
  COLOR_BACKGROUND_R: 32,
  COLOR_BACKGROUND_G: 32,
  COLOR_BACKGROUND_B: 32,
  COLOR_BEING_R: 255,
  COLOR_BEING_G: 146,
  COLOR_BEING_B: 29,
  COLOR_BEING_FADE_R: 255, // Yellow fade when consuming payload
  COLOR_BEING_FADE_G: 255,
  COLOR_BEING_FADE_B: 100,
  COLOR_EMPTY_MIN_R: 70,  // Dark color for value 00 (close to bg)
  COLOR_EMPTY_MIN_G: 70,
  COLOR_EMPTY_MIN_B: 70,
  COLOR_EMPTY_MAX_R: 140, // Light color for wave peak values (less intense)
  COLOR_EMPTY_MAX_G: 140,
  COLOR_EMPTY_MAX_B: 140,
  COLOR_EMPTY_HOVER_R: 200,
  COLOR_EMPTY_HOVER_G: 200,
  COLOR_EMPTY_HOVER_B: 200,
  COLOR_PAYLOAD_MIN_R: 40, // Dark indigo for low payload values
  COLOR_PAYLOAD_MIN_G: 40,
  COLOR_PAYLOAD_MIN_B: 120,
  COLOR_PAYLOAD_MAX_R: 150, // Light indigo for high payload values (center)
  COLOR_PAYLOAD_MAX_G: 150,
  COLOR_PAYLOAD_MAX_B: 255,
} as const