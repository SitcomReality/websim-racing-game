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
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const cx = c.getContext('2d');
    cx.fillStyle = '#2b2b2b'; cx.fillRect(0, 0, size, size);
    const imageData = cx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 30;
      data[i] = Math.max(0, Math.min(255, data[i] + n));
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + n));
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + n));
    }
    cx.putImageData(imageData, 0, 0);
    this.images.set('asphalt', c);
  }

  createGrassTexture() {
    const size = 64;
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const cx = c.getContext('2d');
    cx.fillStyle = '#0a4d1f'; cx.fillRect(0, 0, size, size);
    for (let i = 0; i < 100; i++) {
      cx.fillStyle = `hsl(120, 60%, ${20 + Math.random() * 20}%)`;
      cx.fillRect(Math.random()*size, Math.random()*size, 2+Math.random()*4, 2+Math.random()*4);
    }
    this.images.set('grass', c);
  }

  createDirtTexture() {
    const size = 64;
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const cx = c.getContext('2d');
    cx.fillStyle = '#5a3b1f'; cx.fillRect(0, 0, size, size);
    for (let i = 0; i < 50; i++) {
      cx.fillStyle = `hsl(30, 50%, ${15 + Math.random() * 15}%)`;
      cx.beginPath(); cx.arc(Math.random()*size, Math.random()*size, 1+Math.random()*3, 0, Math.PI*2); cx.fill();
    }
    this.images.set('dirt', c);
  }

  createGravelTexture() {
    const size = 64;
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const cx = c.getContext('2d');
    cx.fillStyle = '#464646'; cx.fillRect(0, 0, size, size);
    for (let i = 0; i < 80; i++) {
      cx.fillStyle = `hsl(0, 0%, ${40 + Math.random() * 40}%)`;
      cx.beginPath(); cx.arc(Math.random()*size, Math.random()*size, 1+Math.random()*2, 0, Math.PI*2); cx.fill();
    }
    this.images.set('gravel', c);
  }

  createMudTexture() {
    const size = 64;
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const cx = c.getContext('2d');
    cx.fillStyle = '#4a2c14'; cx.fillRect(0, 0, size, size);
    for (let i = 0; i < 30; i++) {
      cx.fillStyle = `hsl(25, 40%, ${10 + Math.random() * 10}%)`;
      cx.beginPath(); cx.arc(Math.random()*size, Math.random()*size, 2+Math.random()*4, 0, Math.PI*2); cx.fill();
    }
    this.images.set('mud', c);
  }

  createRockTexture() {
    const size = 64;
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const cx = c.getContext('2d');
    cx.fillStyle = '#2f3b3f'; cx.fillRect(0, 0, size, size);
    for (let i = 0; i < 40; i++) {
      cx.fillStyle = `hsl(200, 20%, ${25 + Math.random() * 25}%)`;
      cx.fillRect(Math.random()*size, Math.random()*size, 3+Math.random()*6, 1+Math.random()*3);
    }
    this.images.set('rock', c);
  }

  createMarbleTexture() {
    const size = 64;
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const cx = c.getContext('2d');
    cx.fillStyle = '#606a70'; cx.fillRect(0, 0, size, size);
    for (let i = 0; i < 20; i++) {
      cx.strokeStyle = `hsl(210, 10%, ${60 + Math.random() * 20}%)`;
      cx.lineWidth = 0.5 + Math.random(); cx.beginPath();
      cx.moveTo(Math.random()*size, 0); cx.lineTo(Math.random()*size, size); cx.stroke();
    }
    this.images.set('marble', c);
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