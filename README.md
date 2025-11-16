# Grid (Kim-Nguyen algorithm)

A visual project featuring an animated grid on a canvas with Beings, Payloads, and Waves. Built with React and TypeScript.

**🔗 Live Demo:** https://jaderemi.github.io/kim-grid/

## Quick Start

```bash
yarn install
yarn dev
```

## Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn deploy` - Deploy to GitHub Pages
- `yarn lint` - Run ESLint and type checking
- `yarn test` - Run tests

## Deployment

Deploy to GitHub Pages:

```bash
yarn deploy
```

This builds the project and publishes the `dist` folder to the `gh-pages` branch.

Live at: `https://jaderemi.github.io/kim-grid/`

## Features

- 1920x1080 canvas with constant 60 FPS rendering
- Beings: Multi-cell organisms with gradient colors and values
- Payloads: Interactive round blobs with indigo gradients
- Waves: Scrolling Simplex noise pattern
- Real-time FPS display
- Performance-optimized rendering with texture caching