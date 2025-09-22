
```markdown
# Canvas Migration Guide: Whimsical Blob Racers and Dynamic Track

This guide explains how to migrate the current DOM-based track to an HTML5 Canvas renderer with adorable blobby racers, camera controls, optional 2.5D perspective, textured ground types, and contextual nameplates.

## Objectives

- Replace DOM lanes/segments with a performant canvas renderer.
- Render racers as squishy, cartoony blobs with outlines, eyes, and a rear-facing mouth that exhales to move.
- Procedurally generate a unique blob shape per racer (seeded by name and colors).
- Animate blob breathing (contract/expand) tied to inhale/exhale and race state.
- Contextual and hover-triggered nameplates anchored to racers.
- Camera with zoom, pan, and tracking modes (single racer, leaders, average pack, fit-all).
- Optional 2.5D perspective (racetrack shrinks toward horizon; z-sorted), easily toggleable.
- Textured ground segments per section/ground type.
- Maintain smooth frame rates and clean API integrations with existing game logic.

---

## Architecture Overview

Add the following modules (ESM, loaded in browser via script type="module"):

- CanvasRenderer.js
  - Owns the main canvas, orchestrates render loop, draws track, racers, particles, overlays.
- Camera.js
  - World-to-screen transforms, pan/zoom, tracking modes, damping.
- BlobFactory.js
  - Procedural blob shape generator (seeded), builds control points and per-racer draw routine.
- Nameplate.js
  - Computes and draws racer nameplates contextually; manages hover and culling.
- TextureManager.js
  - Loads ground textures as Image/Pattern per ground type; handles scaling/tiling.
- ParticleSystem.js
  - Mouth exhaust particles; manages pools and updates.
- HitTestIndex.js
  - Spatial index for pointer hover detection (simple grid or quadtree).
- RaceCanvasAdapter.js
  - Bridges existing gameState/currentRace to canvas modules (lifecycle hooks).

Feature flags (extend gameState.settings.render):

```javascript
gameState.settings.render = {
  enabled: true,
  usePerspective: true,
  skyImageUrl: '',          // Optional horizon sky
  devicePixelRatioAware: true,
  camera: {
    mode: 'leaders',        // 'single' | 'leaders' | 'average' | 'fitAll' | 'manual'
    singleRacerId: null,
    zoom: 1.0, minZoom: 0.5, maxZoom: 3.0,
    pan: { x: 0, y: 0 },
    damping: 0.15
  },
  nameplates: {
    showOnHover: true,
    showContextually: true
  },
  particles: {
    enabled: true,
    poolSize: 800
  },
  textures: {
    ground: {
      asphalt: '/assets/images/ground/asphalt.png',
      gravel: '/assets/images/ground/gravel.png',
      dirt: '/assets/images/ground/dirt.png',
      grass: '/assets/images/ground/grass.png',
      mud: '/assets/images/ground/mud.png',
      rock: '/assets/images/ground/rock.png',
      marble: '/assets/images/ground/marble.png'
    },
    sky: '/assets/images/sky/sky_01.jpg'
  }
};
```


```javascript
class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.renderLoop = null;
  }

  startRenderLoop() {
    this.renderLoop = requestAnimationFrame(this.render.bind(this));
  }

  stopRenderLoop() {
    cancelAnimationFrame(this.renderLoop);
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw track
    this.drawTrack();

    // Draw racers
    this.drawRacers();

    // Draw particles
    this.drawParticles();

    // Draw overlays
    this.drawOverlays();

    // Request next frame
    this.renderLoop = requestAnimationFrame(this.render.bind(this));
  }

  drawTrack() {
    // Draw track segments
    for (let i = 0; i < gameState.currentRace.segments.length; i++) {
      const segment = gameState.currentRace.segments[i];
      this.ctx.fillStyle = 'gray';
      this.ctx.fillRect(i * 100, 0, 100, 100);
    }
  }

  drawRacers() {
    // Draw racers
    for (let i = 0; i < gameState.currentRace.racers.length; i++) {
      const racer = gameState.currentRace.racers[i];
      this.ctx.fillStyle = 'blue';
      this.ctx.fillRect(racer.position.x, racer.position.y, 50, 50);
    }
  }

  drawParticles() {
    // Draw particles
    for (let i = 0; i < particleSystem.particles.length; i++) {
      const particle = particleSystem.particles[i];
      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(particle.position.x, particle.position.y, 10, 10);
    }
  }

  drawOverlays() {
    // Draw overlays
    for (let i = 0; i < overlays.length; i++) {
      const overlay = overlays[i];
      this.ctx.fillStyle = 'green';
      this.ctx.fillRect(overlay.position.x, overlay.position.y, 100, 100);
    }
  }
}

class Camera {
  constructor() {
    this.mode = 'leaders';
    this.singleRacerId = null;
    this.zoom = 1.0;
    this.minZoom = 0.5;
    this.maxZoom = 3.0;
    this.pan = { x: 0, y: 0 };
    this.damping = 0.15;
  }

  update() {
    // Update camera position and zoom
    if (this.mode === 'leaders') {
      // Follow leaders
      const leaders = getLeaders();
      this.pan.x = leaders.position.x;
      this.pan.y = leaders.position.y;
    } else if (this.mode === 'single') {
      // Follow single racer
      const racer = getRacer(this.singleRacerId);
      this.pan.x = racer.position.x;
      this.pan.y = racer.position.y;
    } else if (this.mode === 'average') {
      // Follow average pack
      const averagePack = getAveragePack();
      this.pan.x = averagePack.position.x;
      this.pan.y = averagePack.position.y;
    } else if (this.mode === 'fitAll') {
      // Fit all racers in view
      const allRacers = getAllRacers();
      this.pan.x = allRacers.position.x;
      this.pan.y = allRacers.position.y;
    }

    // Apply damping
    this.pan.x += (this.pan.x - this.prevPan.x) * this.damping;
    this.pan.y += (this.pan.y - this.prevPan.y) * this.damping;

    // Update prev pan
    this.prevPan = { x: this.pan.x, y: this.pan.y };
  }
}

class BlobFactory {
  constructor() {
    this.blobShapes = {};
  }

  getBlobShape(racer) {
    // Get blob shape for racer
    if (!this.blobShapes[racer.id]) {
      // Generate new blob shape
      const blobShape = generateBlobShape(racer);
      this.blobShapes[racer.id] = blobShape;
    }

    return this.blobShapes[racer.id];
  }
}

class Nameplate {
  constructor() {
    this.nameplates = {};
  }

  getNameplate(racer) {
    // Get nameplate for racer
    if (!this.nameplates[racer.id]) {
      // Create new nameplate
      const nameplate = createNameplate(racer);
      this.nameplates[racer.id] = nameplate;
    }

    return this.nameplates[racer.id];
  }
}

class TextureManager {
  constructor() {
    this.textures = {};
  }

  getTexture(groundType) {
    // Get texture for ground type
    if (!this.textures[groundType]) {
      // Load texture
      const texture = loadTexture(groundType);
      this.textures[groundType] = texture;
    }

    return this.textures[groundType];
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  update() {
    // Update particles
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      particle.update();
    }
  }
}

class HitTestIndex {
  constructor() {
    this.index = {};
  }

  add(racer) {
    // Add racer to index
    this.index[racer.id] = racer;
  }

  remove(racer) {
    // Remove racer from index
    delete this.index[racer.id];
  }

  get(racerId) {
    // Get racer from index
    return this.index[racerId];
  }
}

class RaceCanvasAdapter {
  constructor() {
    this.canvasRenderer = new CanvasRenderer(document.getElementById('canvas'));
    this.camera = new Camera();
    this.blobFactory = new BlobFactory();
    this.nameplate = new Nameplate();
    this.textureManager = new TextureManager();
    this.particleSystem = new ParticleSystem();
    this.hitTestIndex = new HitTestIndex();
  }

  init() {
    // Initialize canvas renderer
    this.canvasRenderer.startRenderLoop();
  }

  update() {
    // Update camera
    this.camera.update();

    // Update blob factory
    this.blobFactory.update();

    // Update nameplate
    this.nameplate.update();

    // Update texture manager
    this.textureManager.update();

    // Update particle system
    this.particleSystem.update();

    // Update hit test index
    this.hitTestIndex.update();
  }
}
```


```javascript
// Get leaders
function getLeaders() {
  // Get leaders from game state
  const leaders = [];
  for (let i = 0; i < gameState.currentRace.racers.length; i++) {
    const racer = gameState.currentRace.racers[i];
    if (racer.position.x > leaders.position.x) {
      leaders.push(racer);
    }
  }

  return leaders;
}

// Get racer
function getRacer(racerId) {
  // Get racer from game state
  for (let i = 0; i < gameState.currentRace.racers.length; i++) {
    const racer = gameState.currentRace.racers[i];
    if (racer.id === racerId) {
      return racer;
    }
  }

  return null;
}

// Get average pack
function getAveragePack() {
  // Get average pack from game state
  const averagePack = { position: { x: 0, y: 0 } };
  for (let i = 0; i < gameState.currentRace.racers.length; i++) {
    const racer = gameState.currentRace.racers[i];
    averagePack.position.x += racer.position.x;
    averagePack.position.y += racer.position.y;
  }

  averagePack.position.x /= gameState.currentRace.racers.length;
  averagePack.position.y /= gameState.currentRace.racers.length;

  return averagePack;
}

// Get all racers
function getAllRacers() {
  // Get all racers from game state
  return gameState.currentRace.racers;
}

// Generate blob shape
function generateBlobShape(racer) {
  // Generate blob shape based on racer's name and colors
  const blobShape = {
    controlPoints: [],
    color: racer.colors[0]
  };

  // Generate control points
  for (let i = 0; i < 10; i++) {
    const controlPoint = {
      x: Math.random() * 100,
      y: Math.random() * 100
    };
    blobShape.controlPoints.push(controlPoint);
  }

  return blobShape;
}

// Create nameplate
function createNameplate(racer) {
  // Create nameplate based on racer's name and colors
  const nameplate = {
    text: racer.name,
    color: racer.colors[0]
  };

  return nameplate;
}

// Load texture
function loadTexture(groundType) {
  // Load texture based on ground type
  const texture = new Image();
  texture.src = `/assets/images/ground/${groundType}.png`;

  return texture;
}
```


```javascript
// Initialize game state
gameState = {
  currentRace: {
    racers: [],
    segments: []
  },
  settings: {
    render: {
      enabled: true,
      usePerspective: true,
      skyImageUrl: '',
      devicePixelRatioAware: true,
      camera: {
        mode: 'leaders',
        singleRacerId: null,
        zoom: 1.0,
        minZoom: 0.5,
        maxZoom: 3.0,
        pan: { x: 0, y: 0 },
        damping: 0.15
      },
      nameplates: {
        showOnHover: true,
        showContextually: true
      },
      particles: {
        enabled: true,
        poolSize: 800
      },
      textures: {
        ground: {
          asphalt: '/assets/images/ground/asphalt.png',
          gravel: '/assets/images/ground/gravel.png',
          dirt: '/assets/images/ground/dirt.png',
          grass: '/assets/images/ground/grass.png',
          mud: '/assets/images/ground/mud.png',
          rock: '/assets/images/ground/rock.png',
          marble: '/assets/images/ground/marble.png'
        },
        sky: '/assets/images/sky/sky_01.jpg'
      }
    }
  }
};

// Initialize canvas renderer
const canvasRenderer = new CanvasRenderer(document.getElementById('canvas'));

// Initialize camera
const camera = new Camera();

// Initialize blob factory
const blobFactory = new BlobFactory();

// Initialize nameplate
const nameplate = new Nameplate();

// Initialize texture manager
const textureManager = new TextureManager();

// Initialize particle system
const particleSystem = new ParticleSystem();

// Initialize hit test index
const hitTestIndex = new HitTestIndex();

// Initialize race canvas adapter
const raceCanvasAdapter = new RaceCanvasAdapter();

// Initialize game
raceCanvasAdapter.init();

// Update game
function update() {
  // Update camera
  camera.update();

  // Update blob factory
  blobFactory.update();

  // Update nameplate
  nameplate.update();

  // Update texture manager
  textureManager.update();

  // Update particle system
  particleSystem.update();

  // Update hit test index
  hitTestIndex.update();

  // Render frame
  canvasRenderer.render();

  // Request next frame
  requestAnimationFrame(update);
}

// Start game
update();
```