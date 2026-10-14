/**
 * TaskFlow - Interactive 3D Holographic Canvas Engine
 * High-performance, zero-dependency 3D geometry & particle visualizer
 */

class Interactive3DBackground {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Camera & Interaction
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.camera = { x: 0, y: 0, z: 900, fov: 600 };
    this.time = 0;

    // 3D Objects in Scene
    this.objects = [];
    this.particles = [];

    this.init();
  }

  init() {
    // Create or locate canvas
    let container = document.querySelector('.ambient-bg-canvas');
    if (!container) {
      container = document.createElement('div');
      container.className = 'ambient-bg-canvas';
      document.body.prepend(container);
    }

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'ambient-3d-canvas';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1';
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.resize();

    // Create 3D Scene Assets
    this.createSceneObjects();
    this.create3DParticles(70);

    // Event Listeners
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: true });

    // Start 60fps render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.camera.fov = Math.max(450, Math.min(this.width, this.height) * 0.7);
  }

  onMouseMove(e) {
    const normX = (e.clientX / this.width) * 2 - 1;
    const normY = (e.clientY / this.height) * 2 - 1;
    this.mouse.targetX = normX * 180;
    this.mouse.targetY = normY * 120;
  }

  onTouchMove(e) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const normX = (touch.clientX / this.width) * 2 - 1;
      const normY = (touch.clientY / this.height) * 2 - 1;
      this.mouse.targetX = normX * 120;
      this.mouse.targetY = normY * 80;
    }
  }

  createSceneObjects() {
    // 1. Floating Icosahedron (Top Right)
    this.objects.push(this.createIcosahedron({
      pos: { x: this.width * 0.35, y: -this.height * 0.25, z: 120 },
      scale: 130,
      rotSpeed: { x: 0.006, y: 0.009, z: 0.004 },
      floatSpeed: 0.0018,
      floatAmp: 25,
      color: 'rgba(99, 102, 241, ',
      wireColor: 'rgba(79, 70, 229, 0.45)',
      fillAlpha: 0.08
    }));

    // 2. Floating 3D Torus (Bottom Left)
    this.objects.push(this.createTorus({
      pos: { x: -this.width * 0.36, y: this.height * 0.28, z: 80 },
      majorR: 110,
      minorR: 38,
      rings: 14,
      segments: 8,
      rotSpeed: { x: 0.008, y: 0.005, z: 0.007 },
      floatSpeed: 0.0015,
      floatAmp: 30,
      color: 'rgba(168, 85, 247, ',
      wireColor: 'rgba(147, 51, 234, 0.4)',
      fillAlpha: 0.07
    }));

    // 3. Floating 3D Octahedron Crystal (Center Right)
    this.objects.push(this.createOctahedron({
      pos: { x: this.width * 0.38, y: this.height * 0.26, z: 160 },
      scale: 115,
      rotSpeed: { x: 0.007, y: -0.008, z: 0.005 },
      floatSpeed: 0.002,
      floatAmp: 28,
      color: 'rgba(6, 182, 212, ',
      wireColor: 'rgba(8, 145, 178, 0.45)',
      fillAlpha: 0.09
    }));

    // 4. Floating 3D Cube / Matrix Block (Top Left)
    this.objects.push(this.createCube({
      pos: { x: -this.width * 0.38, y: -this.height * 0.3, z: 100 },
      scale: 100,
      rotSpeed: { x: -0.005, y: 0.007, z: 0.006 },
      floatSpeed: 0.0016,
      floatAmp: 22,
      color: 'rgba(244, 63, 94, ',
      wireColor: 'rgba(225, 29, 72, 0.4)',
      fillAlpha: 0.07
    }));
  }

  createIcosahedron(config) {
    const t = (1.0 + Math.sqrt(5.0)) / 2.0;
    const verts = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ].map(v => {
      const len = Math.hypot(v[0], v[1], v[2]);
      return { x: (v[0] / len) * config.scale, y: (v[1] / len) * config.scale, z: (v[2] / len) * config.scale };
    });

    const faces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];

    return { ...config, vertices: verts, faces, rot: { x: 0.2, y: 0.4, z: 0 }, basePos: { ...config.pos } };
  }

  createOctahedron(config) {
    const verts = [
      { x: 0, y: -config.scale, z: 0 },
      { x: config.scale, y: 0, z: 0 },
      { x: 0, y: 0, z: config.scale },
      { x: -config.scale, y: 0, z: 0 },
      { x: 0, y: 0, z: -config.scale },
      { x: 0, y: config.scale, z: 0 }
    ];

    const faces = [
      [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
      [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]
    ];

    return { ...config, vertices: verts, faces, rot: { x: 0.5, y: 0.1, z: 0.3 }, basePos: { ...config.pos } };
  }

  createCube(config) {
    const s = config.scale * 0.7;
    const verts = [
      { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s },
      { x: s, y: s, z: -s }, { x: -s, y: s, z: -s },
      { x: -s, y: -s, z: s }, { x: s, y: -s, z: s },
      { x: s, y: s, z: s }, { x: -s, y: s, z: s }
    ];

    const faces = [
      [0, 1, 2, 3], [4, 5, 6, 7],
      [0, 1, 5, 4], [2, 3, 7, 6],
      [0, 3, 7, 4], [1, 2, 6, 5]
    ];

    return { ...config, vertices: verts, faces, rot: { x: 0.4, y: 0.6, z: 0.2 }, basePos: { ...config.pos } };
  }

  createTorus(config) {
    const verts = [];
    const faces = [];
    const { majorR, minorR, rings, segments } = config;

    for (let i = 0; i < rings; i++) {
      const u = (i / rings) * Math.PI * 2;
      for (let j = 0; j < segments; j++) {
        const v = (j / segments) * Math.PI * 2;
        const x = (majorR + minorR * Math.cos(v)) * Math.cos(u);
        const y = (majorR + minorR * Math.cos(v)) * Math.sin(u);
        const z = minorR * Math.sin(v);
        verts.push({ x, y, z });
      }
    }

    for (let i = 0; i < rings; i++) {
      const nextI = (i + 1) % rings;
      for (let j = 0; j < segments; j++) {
        const nextJ = (j + 1) % segments;
        const p1 = i * segments + j;
        const p2 = nextI * segments + j;
        const p3 = nextI * segments + nextJ;
        const p4 = i * segments + nextJ;
        faces.push([p1, p2, p3, p4]);
      }
    }

    return { ...config, vertices: verts, faces, rot: { x: 0.8, y: 0.3, z: 0.5 }, basePos: { ...config.pos } };
  }

  create3DParticles(count) {
    this.particles = [];
    const boundX = this.width * 0.9;
    const boundY = this.height * 0.9;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * boundX,
        y: (Math.random() - 0.5) * boundY,
        z: (Math.random() - 0.5) * 600,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2.5 + 1.2,
        color: ['#6366f1', '#a855f7', '#06b6d4', '#ec4899'][Math.floor(Math.random() * 4)]
      });
    }
  }

  project(p, camera, mouseOffset) {
    // Apply camera parallax
    const camX = camera.x + mouseOffset.x;
    const camY = camera.y + mouseOffset.y;
    const relX = p.x - camX;
    const relY = p.y - camY;
    const relZ = p.z + camera.z;

    if (relZ <= 50) return null;

    const scale = camera.fov / relZ;
    return {
      x: this.width / 2 + relX * scale,
      y: this.height / 2 + relY * scale,
      z: relZ,
      scale: scale
    };
  }

  rotatePoint(p, rot) {
    // Rotate X
    let y1 = p.y * Math.cos(rot.x) - p.z * Math.sin(rot.x);
    let z1 = p.y * Math.sin(rot.x) + p.z * Math.cos(rot.x);
    let x1 = p.x;

    // Rotate Y
    let x2 = x1 * Math.cos(rot.y) + z1 * Math.sin(rot.y);
    let z2 = -x1 * Math.sin(rot.y) + z1 * Math.cos(rot.y);
    let y2 = y1;

    // Rotate Z
    let x3 = x2 * Math.cos(rot.z) - y2 * Math.sin(rot.z);
    let y3 = x2 * Math.sin(rot.z) + y2 * Math.cos(rot.z);
    let z3 = z2;

    return { x: x3, y: y3, z: z3 };
  }

  animate() {
    this.time += 0.016;

    // Smooth mouse interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Clear Canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Update & Draw 3D Particles
    this.draw3DParticles();

    // 2. Update & Draw 3D Polyhedra
    this.draw3DObjects();

    requestAnimationFrame(this.animate);
  }

  draw3DParticles() {
    const projectedParticles = [];
    const boundX = this.width * 0.9;
    const boundY = this.height * 0.9;

    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;

      if (p.x < -boundX / 2 || p.x > boundX / 2) p.vx *= -1;
      if (p.y < -boundY / 2 || p.y > boundY / 2) p.vy *= -1;
      if (p.z < -300 || p.z > 300) p.vz *= -1;

      const proj = this.project(p, this.camera, this.mouse);
      if (proj) {
        projectedParticles.push({ ...proj, orig: p });
      }
    }

    // Connect close 3D particles with glowing neural lines
    this.ctx.lineWidth = 0.8;
    for (let i = 0; i < projectedParticles.length; i++) {
      const p1 = projectedParticles[i];
      for (let j = i + 1; j < projectedParticles.length; j++) {
        const p2 = projectedParticles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 110) {
          const alpha = (1 - dist / 110) * 0.22 * Math.min(p1.scale, p2.scale);
          this.ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }

    // Render particle spheres
    for (let p of projectedParticles) {
      const r = Math.max(1, p.orig.radius * p.scale * 1.5);
      const alpha = Math.min(0.65, 0.4 * p.scale);

      this.ctx.fillStyle = p.orig.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      this.ctx.fill();

      // Subtle particle glow
      this.ctx.fillStyle = p.orig.color;
      this.ctx.globalAlpha = alpha * 0.3;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  draw3DObjects() {
    for (let obj of this.objects) {
      // Rotate object
      obj.rot.x += obj.rotSpeed.x;
      obj.rot.y += obj.rotSpeed.y;
      obj.rot.z += obj.rotSpeed.z;

      // Floating sine wave animation
      const floatY = Math.sin(this.time * obj.floatSpeed * 100) * obj.floatAmp;
      const currentPos = {
        x: obj.basePos.x,
        y: obj.basePos.y + floatY,
        z: obj.basePos.z
      };

      // Transform and project all vertices
      const transformedVerts = obj.vertices.map(v => {
        const rotated = this.rotatePoint(v, obj.rot);
        const worldPoint = {
          x: rotated.x + currentPos.x,
          y: rotated.y + currentPos.y,
          z: rotated.z + currentPos.z
        };
        return {
          world: worldPoint,
          proj: this.project(worldPoint, this.camera, this.mouse)
        };
      });

      // Prepare faces for depth sorting (Painter's Algorithm)
      const renderFaces = [];
      for (let faceIndices of obj.faces) {
        let avgZ = 0;
        let valid = true;
        const pts = [];

        for (let idx of faceIndices) {
          const v = transformedVerts[idx];
          if (!v.proj) {
            valid = false;
            break;
          }
          avgZ += v.world.z;
          pts.push(v.proj);
        }

        if (valid) {
          avgZ /= faceIndices.length;
          renderFaces.push({ pts, avgZ });
        }
      }

      // Sort faces back to front
      renderFaces.sort((a, b) => b.avgZ - a.avgZ);

      // Render 3D Polyhedron Faces & Edges
      for (let face of renderFaces) {
        const pts = face.pts;
        if (pts.length < 3) continue;

        // Calculate face normal 2D orientation for backface lighting
        const v1x = pts[1].x - pts[0].x;
        const v1y = pts[1].y - pts[0].y;
        const v2x = pts[2].x - pts[0].x;
        const v2y = pts[2].y - pts[0].y;
        const cross = v1x * v2y - v1y * v2x;
        const lightShade = Math.max(0.2, Math.min(1.0, 0.5 + cross * 0.0001));

        this.ctx.beginPath();
        this.ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          this.ctx.lineTo(pts[i].x, pts[i].y);
        }
        this.ctx.closePath();

        // Translucent iridescent face fill
        this.ctx.fillStyle = `${obj.color}${obj.fillAlpha * lightShade})`;
        this.ctx.fill();

        // Glowing wireframe edge stroke
        this.ctx.strokeStyle = obj.wireColor;
        this.ctx.lineWidth = 1.2;
        this.ctx.stroke();
      }

      // Render glowing vertex nodes
      for (let v of transformedVerts) {
        if (!v.proj) continue;
        this.ctx.fillStyle = obj.wireColor;
        this.ctx.beginPath();
        this.ctx.arc(v.proj.x, v.proj.y, 2.2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }
}

// Auto-initialize 3D background engine on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new Interactive3DBackground());
} else {
  new Interactive3DBackground();
}
