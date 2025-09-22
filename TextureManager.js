class TextureManager {
  constructor() {
    this.patterns = new Map();
    this.images = new Map();
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  loadTextures(textureMap) {
    // Create procedural textures for different ground types
    this.createAsphaltTexture();
    this.createGrassTexture();
    this.createDirtTexture();
    this.createGravelTexture();
    this.createMudTexture();
    this.createRockTexture();
    this.createMarbleTexture();
  }

  createAsphaltTexture() {
    const size = 64;
    this.canvas.width = size;
    this.canvas.height = size;

    // Base asphalt color
    this.ctx.fillStyle = '#2b2b2b';
    this.ctx.fillRect(0, 0, size, size);

    // Add subtle noise for texture
    const imageData = this.ctx.getImageData(0, 0, size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }

    this.ctx.putImageData(imageData, 0, 0);
    // store offscreen canvas instead of dataURL
    this.images.set('asphalt', this.canvas);
  }

  createGrassTexture() {
    const size = 64;
    this.canvas.width = size;
    this.canvas.height = size;

    this.ctx.fillStyle = '#0a4d1f';
    this.ctx.fillRect(0, 0, size, size);

    // Add grass-like texture
    for (let i = 0; i < 100; i++) {
      this.ctx.fillStyle = `hsl(120, 60%, ${20 + Math.random() * 20}%)`;
      this.ctx.fillRect(
        Math.random() * size,
        Math.random() * size,
        2 + Math.random() * 4,
        2 + Math.random() * 4
      );
    }

    // store offscreen canvas instead of dataURL
    this.images.set('grass', this.canvas);
  }

  createDirtTexture() {
    const size = 64;
    this.canvas.width = size;
    this.canvas.height = size;

    this.ctx.fillStyle = '#5a3b1f';
    this.ctx.fillRect(0, 0, size, size);

    // Add dirt clumps
    for (let i = 0; i < 50; i++) {
      this.ctx.fillStyle = `hsl(30, 50%, ${15 + Math.random() * 15}%)`;
      this.ctx.beginPath();
      this.ctx.arc(
        Math.random() * size,
        Math.random() * size,
        1 + Math.random() * 3,
        0, Math.PI * 2
      );
      this.ctx.fill();
    }

    // store offscreen canvas instead of dataURL
    this.images.set('dirt', this.canvas);
  }

  createGravelTexture() {
    const size = 64;
    this.canvas.width = size;
    this.canvas.height = size;

    this.ctx.fillStyle = '#464646';
    this.ctx.fillRect(0, 0, size, size);

    // Add gravel pieces
    for (let i = 0; i < 80; i++) {
      this.ctx.fillStyle = `hsl(0, 0%, ${40 + Math.random() * 40}%)`;
      this.ctx.beginPath();
      this.ctx.arc(
        Math.random() * size,
        Math.random() * size,
        1 + Math.random() * 2,
        0, Math.PI * 2
      );
      this.ctx.fill();
    }

    // store offscreen canvas instead of dataURL
    this.images.set('gravel', this.canvas);
  }

  createMudTexture() {
    const size = 64;
    this.canvas.width = size;
    this.canvas.height = size;

    this.ctx.fillStyle = '#4a2c14';
    this.ctx.fillRect(0, 0, size, size);

    // Add muddy texture
    for (let i = 0; i < 30; i++) {
      this.ctx.fillStyle = `hsl(25, 40%, ${10 + Math.random() * 10}%)`;
      this.ctx.beginPath();
      this.ctx.arc(
        Math.random() * size,
        Math.random() * size,
        2 + Math.random() * 4,
        0, Math.PI * 2
      );
      this.ctx.fill();
    }

    // store offscreen canvas instead of dataURL
    this.images.set('mud', this.canvas);
  }

  createRockTexture() {
    const size = 64;
    this.canvas.width = size;
    this.canvas.height = size;

    this.ctx.fillStyle = '#2f3b3f';
    this.ctx.fillRect(0, 0, size, size);

    // Add rock-like patterns
    for (let i = 0; i < 40; i++) {
      this.ctx.fillStyle = `hsl(200, 20%, ${25 + Math.random() * 25}%)`;
      this.ctx.fillRect(
        Math.random() * size,
        Math.random() * size,
        3 + Math.random() * 6,
        1 + Math.random() * 3
      );
    }

    // store offscreen canvas instead of dataURL
    this.images.set('rock', this.canvas);
  }

  createMarbleTexture() {
    const size = 64;
    this.canvas.width = size;
    this.canvas.height = size;

    this.ctx.fillStyle = '#606a70';
    this.ctx.fillRect(0, 0, size, size);

    // Add marble veining
    for (let i = 0; i < 20; i++) {
      this.ctx.strokeStyle = `hsl(210, 10%, ${60 + Math.random() * 20}%)`;
      this.ctx.lineWidth = 0.5 + Math.random();
      this.ctx.beginPath();
      this.ctx.moveTo(Math.random() * size, 0);
      this.ctx.lineTo(Math.random() * size, size);
      this.ctx.stroke();
    }

    // store offscreen canvas instead of dataURL
    this.images.set('marble', this.canvas);
  }

  getPattern(name, ctx) {
    if (this.patterns.has(name)) {
      return this.patterns.get(name);
    }
    const src = this.images.get(name);
    if (src) {
      const pattern = ctx.createPattern(src, 'repeat');
      this.patterns.set(name, pattern);
      return pattern;
    }
    const colors = {
      asphalt: '#2b2b2b', grass: '#0a4d1f', dirt: '#5a3b1f',
      gravel: '#464646', mud: '#4a2c14', rock: '#2f3b3f', marble: '#606a70'
    };
    return colors[name] || '#303030';
  }
}

window.TextureManager = TextureManager;