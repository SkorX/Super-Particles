# Super-Particles

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
- [x] Particles linking
- [x] Particles attraction / gravity
- [x] Particles warp (to the other side of canvas)
- [x] Particles bouncing (from the edge of canvas)
- [x] Particles slowing down to initial speed (on warp or bounce)
- [ ] Particles options loading
- [x] Particles controlling 
- [x] Event system
- [x] Window resize handling (for canvases that change it's size according to screen size)
- [x] Diagnostics (fps meter, particles count, frame count)
- [x] Screenshot exporting
- [ ] Better demo page