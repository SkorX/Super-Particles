# Super-Particles
![Language](https://img.shields.io/badge/-javascript-blue.svg)
![Lib size](https://img.shields.io/github/size/SkorX/Super-Particles/dist/super-particles.js.svg)
![Lib size (minified)](https://img.shields.io/github/size/SkorX/Super-Particles/dist/super-particles.min.js.svg?color=blue&label=size%20%28minified%29&logoColor=blue)
![Version](https://img.shields.io/github/manifest-json/v/SkorX/Super-Particles.svg)
![License](https://img.shields.io/github/license/SkorX/Super-Particles.svg)

### JavaScript library for creating highly customizable particles.
-----

## Working demo
> https://skorx.github.io/Super-Particles

## Current state
Please note this project is actually in active development and it's waiting for stable version release.

It's pretty new project, but has implemented multiple core features.

## How to use
- Download `src/super-particles.js` file
- Load it on your page `<script type="javascript" src="super-particles.js"></script>`
- Prepare `<canvas>` element on your page
- Initialize **Super-Particles** library `new superParticles(canvas, options)`
- **DONE**

## Task List
- [x] Start / Stop functionality
- [x] Dynamic particles adding / removing
- [ ] Options loading
- [ ] Default particles loading (from Super Particles settings)
- [ ] Dynamic particles changing / count changing (when new options are loaded)
- [x] Particles linking
- [ ] User interactivity
- [x] Canvas backgrounds (transparent, color, image)
- [x] Particles attraction / gravity
- [x] Particles warp (to the other side of canvas)
- [x] Particles bouncing (from the edge of canvas)
- [ ] Particles destroying when OoB
- [x] Particles slowing down to initial speed (on warp or bounce)
- [ ] Particles options loading
- [x] Particles controlling methods
- [ ] Particles properties alternation (eg. opacity)
- [x] Event system
- [ ] More engine events (particle add, particle remove, particle out of bounds)
- [x] Window resize handling (for canvases that change it's size according to screen size)
- [x] Diagnostics (fps meter, particles count, frame count)
- [x] Low FPS mode (limit to max 30 FPS)
- [ ] Better demo page
- [x] Screenshot exporting
- [ ] Konami Code support
