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
- **Beings**: Living entities with high values (7-10 digits), colored orange, grow over time
- **Empty Cells**: Regular cells with values 00-09, dark grey
- **Waves**: Periodic events moving right-to-left that temporarily boost Empty cell values
- **Movement Direction**: All movement in the app is right-to-left
- Canvas updates at constant 60 FPS regardless of game events