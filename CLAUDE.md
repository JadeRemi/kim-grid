# Claude Hints for Kim-Nguyen Grid Project

## Project Overview
Single-page React TypeScript application displaying an animated grid on a 1920x1080 canvas, built with Vite.

## Important Commands
After making significant changes, run these commands:
```bash
yarn lint      # Check code style
yarn typecheck # Check TypeScript types
yarn test      # Run unit tests
```

## Project Structure
- `/src/components/` - React components (GameCanvas, ErrorBoundary)
- `/src/util/` - Utility functions with unit tests
- `/src/util/__tests__/` - Unit tests for utility functions
- `/src/config.ts` - Canvas configuration constants
- `/src/styles/` - Color palette and typography

## Key Configuration
- Canvas: 1920x1080 resolution, maintains aspect ratio
- FPS: Locked at 60 with constant rerender rate
- Grid: Numbers displayed in square brackets on dark grey background
- All constants in `/src/config.ts`
- **User frequently modifies config values during development - this is normal and expected**

## Development
- User will run `yarn dev` themselves
- Build with `yarn build` (outputs to `/dist`)
- Tests only cover `/src/util` functions
- No complex state management, no API, simple visual project

## Current Features
- 60 FPS canvas rendering with FPS display
- Simple grid visualization
- Error boundary for React errors

## Future Plans
- Logic will be added later, grid rendering is the foundation

## Code Style
- Functional React components with hooks
- TypeScript strict mode enabled
- ESLint configured for React/TypeScript
- **All magic numbers must go into CONFIG constants** - no hardcoded values in components

## Game Mechanics

### Core Entities
- **Beings**: Living entities occupying 8-18 cells in thick, blob-shaped bodies (100 per grid)
  - **Never touch each other** - positioned with at least 1 cell gap between bodies
  - Center cell displays full value (7-10 digits), body cells show abbreviated values (e.g. `[12.]`)
  - **Gradient color based on both distance and value** - not uniform rings, varies by cell
    - Center: full orange `rgb(255, 146, 29)`
    - Edges: warm orange-brown `rgb(180, 110, 60)` for visibility
    - Color factor: 70% distance from center + 30% cell value variation
  - Gradient values from center to edges (median empty cell value)
  - Orange color at center, grows over time (0-9 points every 1-10 seconds)
  - Yellow fade effect for 5 seconds after consuming a Payload (all body cells)
  - Consume Payloads when touching any body cell
  - Release 1-3 split Payloads (30% of original value) to adjacent empty cells (not to the right)
  - Bodies are solid, rounded blobs with no gaps (mountain-like shape)

- **Empty Cells**: Regular cells with values 00-09, dark grey
  - Fluctuate randomly between 00-09 over time
  - Affected by Waves (temporarily boosted to 50-300)
  - Can be hovered (lightens text)

- **Waves**: Continuous scrolling Simplex noise pattern moving right-to-left
  - Creates vertical/diagonal stripe patterns
  - Temporarily boosts Empty cell values at wave crests
  - Does not affect Beings or Payloads

- **Payloads**: Interactive objects with multiple spawn methods
  - **Click-spawned**: Round blobs (1-10 cells) with gradient values (100-900)
    - Center has highest value, edges have ~30% of center
  - **Being-spawned**: Released when Being consumes payload (1-3 cells, 30% of original)
  - **Random-spawned**: Single cells from right edge (~1 every 17 seconds, 20-150 value)
  - Color: Indigo gradient (darker for low values, lighter for high values)
  - Move right-to-left at constant speed (same as waves)
  - Temporarily increase cell display value
  - Consumed by Beings on contact with any body cell
  - **Cannot be created in Being body cells** (all spawn methods check for empty cells)

### Movement & Performance
- **All movement is right-to-left** (Waves, Payloads)
- **Constant 60 FPS** rendering rate regardless of game events
- Performance optimizations:
  - Noise texture pre-calculation (one-time at startup)
  - Color string caching for empty cells
  - Being color cache (maxDistance lookup)
  - Batch rendering by color (reduces `fillStyle` calls)
  - Deterministic Being body generation (no per-frame recalculation)