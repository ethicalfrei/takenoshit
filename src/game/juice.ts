export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
};

export type Floater = {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  color: string;
};

export class Juice {
  trauma = 0;
  hitstop = 0;
  flash = 0;
  flashColor = "#ffffff";
  particles: Particle[] = [];
  floaters: Floater[] = [];
  reduced = false;
  private pool: Particle[] = [];

  constructor() {
    if (typeof window !== "undefined" && window.matchMedia) {
      this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  }

  addTrauma(n: number) {
    if (this.reduced) {
      this.trauma = Math.min(0.25, this.trauma + n * 0.35);
      return;
    }
    this.trauma = Math.min(1, this.trauma + n);
  }

  freeze(seconds: number) {
    this.hitstop = Math.max(this.hitstop, this.reduced ? seconds * 0.35 : seconds);
  }

  burst(x: number, y: number, n: number, color: string, speed = 180) {
    const count = this.reduced ? Math.ceil(n * 0.4) : n;
    for (let i = 0; i < count; i++) {
      const p = this.pool.pop() ?? ({} as Particle);
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s - 40;
      p.life = 0;
      p.max = 0.28 + Math.random() * 0.35;
      p.size = 2 + Math.random() * 5;
      p.color = color;
      p.rot = Math.random() * Math.PI;
      p.vr = (Math.random() - 0.5) * 12;
      this.particles.push(p);
    }
  }

  float(x: number, y: number, text: string, color: string) {
    this.floaters.push({ x, y, text, life: 0, max: 0.7, color });
  }

  screenFlash(color: string, amount = 0.45) {
    this.flash = amount;
    this.flashColor = color;
  }

  update(dt: number) {
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      this.flash = Math.max(0, this.flash - dt * 3);
      return "frozen" as const;
    }
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    this.flash = Math.max(0, this.flash - dt * 2.6);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
      p.rot += p.vr * dt;
      if (p.life >= p.max) {
        this.particles.splice(i, 1);
        if (this.pool.length < 80) this.pool.push(p);
      }
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life += dt;
      f.y -= 48 * dt;
      if (f.life >= f.max) this.floaters.splice(i, 1);
    }
    return "live" as const;
  }

  shake(t: number) {
    const mag = this.trauma * this.trauma * 14;
    if (mag < 0.2) return { x: 0, y: 0, r: 0 };
    return {
      x: Math.sin(t * 73.1) * mag,
      y: Math.cos(t * 61.7) * mag * 0.7,
      r: Math.sin(t * 40) * mag * 0.01,
    };
  }
}
