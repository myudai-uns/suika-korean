/* ============================================================
 * physics.js — Lightweight 2D circle physics for Suika
 * No external libs. Iterative impulse + positional correction.
 * ============================================================ */

let _bodyId = 1;

class Body {
  constructor(opts){
    this.id = _bodyId++;
    this.x = opts.x;
    this.y = opts.y;
    this.r = opts.radius;
    this.vx = opts.vx || 0;
    this.vy = opts.vy || 0;
    this.angle = (Math.random() - 0.5) * 0.4;
    this.angularVel = 0;
    this.level = opts.level || 1;
    this.data = opts.data || {};       // { word, meaning, roma, color }
    this.mass = Math.PI * this.r * this.r * 0.001; // area-based
    this.invMass = opts.static ? 0 : 1 / this.mass;
    this.static = !!opts.static;
    this.frozen = !!opts.frozen;       // pre-drop (held at top)
    this.bornAt = performance.now();
    this.markedForRemoval = false;
    this.aboveCeilingAt = 0;           // timestamp first crossed danger line
    this.lastMergeFlash = 0;           // for visual pop
    this.scale = 0;                    // grow-in animation
  }
}

class World {
  constructor(opts){
    this.w = opts.width;
    this.h = opts.height;
    this.gravity = opts.gravity ?? 0.55;     // px/frame²  (60fps)
    this.airDamp = 0.9985;
    this.angularDamp = 0.92;
    this.angularMax = 0.18;                  // rad/frame, hard cap
    this.restitution = 0.18;
    this.friction = 0.4;
    this.ceiling = opts.ceiling ?? 80;       // danger line y
    this.bodies = [];
    this.solverIter = 4;
    this.events = { merge: [], landed: [], ceiling: [] };
  }
  on(ev, fn){ this.events[ev].push(fn); }
  emit(ev, ...args){ for(const fn of this.events[ev]) fn(...args); }

  add(body){ this.bodies.push(body); return body; }
  remove(body){
    const i = this.bodies.indexOf(body);
    if(i >= 0) this.bodies.splice(i, 1);
  }

  step(dtScale = 1){
    const bodies = this.bodies;
    // Integrate
    for(const b of bodies){
      if(b.frozen || b.static) continue;
      b.vy += this.gravity * dtScale;
      b.vx *= this.airDamp;
      b.vy *= this.airDamp;
      b.angularVel *= this.angularDamp;
      if(b.angularVel >  this.angularMax) b.angularVel =  this.angularMax;
      if(b.angularVel < -this.angularMax) b.angularVel = -this.angularMax;
      b.x += b.vx * dtScale;
      b.y += b.vy * dtScale;
      b.angle += b.angularVel * dtScale;
      // Scale-in animation
      if(b.scale < 1) b.scale = Math.min(1, b.scale + 0.12);
    }

    // Solver passes
    for(let it = 0; it < this.solverIter; it++){
      // Walls
      for(const b of bodies){
        if(b.frozen) continue;
        // Left
        if(b.x - b.r < 0){
          b.x = b.r;
          if(b.vx < 0){ b.vx = -b.vx * this.restitution; }
        }
        // Right
        if(b.x + b.r > this.w){
          b.x = this.w - b.r;
          if(b.vx > 0){ b.vx = -b.vx * this.restitution; }
        }
        // Bottom
        if(b.y + b.r > this.h){
          b.y = this.h - b.r;
          if(b.vy > 0){
            b.vy = -b.vy * this.restitution;
            b.vx *= 0.85;
            b.angularVel += (Math.random()-0.5) * 0.02;
          }
        }
      }

      // Body-body (O(n²) but n is small ~30)
      for(let i = 0; i < bodies.length; i++){
        const a = bodies[i];
        if(a.frozen) continue;
        for(let j = i+1; j < bodies.length; j++){
          const b = bodies[j];
          if(b.frozen) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx*dx + dy*dy;
          const minDist = a.r + b.r;
          if(distSq >= minDist * minDist) continue;
          const dist = Math.sqrt(distSq) || 0.0001;
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;

          // Mark merge candidate (only on last iteration to avoid double-emit)
          if(it === this.solverIter - 1 && a.level === b.level &&
             !a.markedForRemoval && !b.markedForRemoval &&
             a.scale > 0.7 && b.scale > 0.7){
            this.emit('merge', a, b, nx, ny);
            // After emit, game may mark them for removal — break inner loop
            if(a.markedForRemoval) break;
            continue;
          }

          // Positional correction (split by inverse mass)
          const totalInv = a.invMass + b.invMass || 1;
          const corrA = overlap * (a.invMass / totalInv);
          const corrB = overlap * (b.invMass / totalInv);
          a.x -= nx * corrA;
          a.y -= ny * corrA;
          b.x += nx * corrB;
          b.y += ny * corrB;

          // Velocity along normal
          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const velAlongN = rvx * nx + rvy * ny;
          if(velAlongN > 0) continue; // separating
          const e = this.restitution;
          let jImp = -(1 + e) * velAlongN / totalInv;
          const ix = jImp * nx;
          const iy = jImp * ny;
          a.vx -= ix * a.invMass;
          a.vy -= iy * a.invMass;
          b.vx += ix * b.invMass;
          b.vy += iy * b.invMass;

          // Tangential friction (simple)
          const tx = -ny;
          const ty =  nx;
          const velAlongT = rvx * tx + rvy * ty;
          const jt = -velAlongT * this.friction / totalInv;
          a.vx -= jt * tx * a.invMass;
          a.vy -= jt * ty * a.invMass;
          b.vx += jt * tx * b.invMass;
          b.vy += jt * ty * b.invMass;

          // Add a touch of spin from impact (clamped per-step to prevent runaway)
          const spin = Math.max(-0.04, Math.min(0.04, velAlongT * 0.0008));
          a.angularVel -= spin;
          b.angularVel += spin;
        }
      }
    }

    // Ceiling check
    const now = performance.now();
    for(const b of bodies){
      if(b.frozen || b.markedForRemoval) continue;
      const top = b.y - b.r;
      const speed = Math.abs(b.vy);
      if(top < this.ceiling && speed < 0.6){
        if(b.aboveCeilingAt === 0) b.aboveCeilingAt = now;
        else if(now - b.aboveCeilingAt > 1500){
          this.emit('ceiling', b);
        }
      } else {
        b.aboveCeilingAt = 0;
      }
    }

    // Sweep removed bodies
    if(this.bodies.some(b => b.markedForRemoval)){
      this.bodies = this.bodies.filter(b => !b.markedForRemoval);
    }
  }
}
