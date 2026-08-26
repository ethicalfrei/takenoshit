import type { SpriteBook } from "./assets";
import type { PlayerPose, ViewModel } from "./combat";
import type { Lane } from "./content/roster";

function coverDraw(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  pan = 0,
) {
  const ir = img.width / img.height;
  const cr = w / h;
  let dw = w;
  let dh = h;
  let dx = 0;
  let dy = 0;
  if (ir > cr) {
    dw = h * ir;
    dx = (w - dw) / 2 - pan * (dw - w) * 0.5;
  } else {
    dh = w / ir;
    dy = (h - dh) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

function sprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  bottom: number,
  height: number,
  opts?: { flip?: boolean; rot?: number; sx?: number; sy?: number; alpha?: number },
) {
  const scale = height / img.height;
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.save();
  ctx.translate(cx, bottom);
  if (opts?.rot) ctx.rotate(opts.rot);
  ctx.scale(opts?.flip ? -1 : 1, 1);
  ctx.scale(opts?.sx ?? 1, opts?.sy ?? 1);
  ctx.globalAlpha = opts?.alpha ?? 1;
  ctx.drawImage(img, -w / 2, -h, w, h);
  ctx.restore();
}

function playerImg(assets: SpriteBook, pose: PlayerPose, slap: boolean, variant = 0) {
  if (pose === "punch") {
    if (slap) return assets.player.slap ?? assets.player.punch;
    // jab (from-behind) + left-hand camera uppercut. Skip the right-hand huge fist.
    if (variant === 1) return assets.player.punch3 ?? assets.player.punch2;
    return assets.player.punch2 ?? assets.player.punch;
  }
  if (pose === "grab") return assets.player.grab ?? assets.player.punch;
  if (pose === "dodgeL" || pose === "dodgeR") return assets.player.dodge;
  if (pose === "duck") return assets.player.duck;
  if (pose === "hurt") return assets.player.duck;
  return assets.player.idle;
}

function laneX(lane: Lane, w: number) {
  if (lane === "left") return w * 0.32;
  if (lane === "right") return w * 0.68;
  return w * 0.5;
}

function drawWalk(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  vm: ViewModel,
  assets: SpriteBook,
) {
  const bg = assets.walkBg[vm.boss.id];
  const pan = Math.min(1, vm.walkT / Math.max(8, vm.walkDuration * 0.88));
  if (bg) {
    ctx.save();
    ctx.filter = "brightness(0.82) saturate(0.95)";
    coverDraw(ctx, bg, w, h, pan);
    ctx.filter = "none";
    ctx.restore();
  } else {
    ctx.fillStyle = "#140e0c";
    ctx.fillRect(0, 0, w, h);
  }
  const g = ctx.createLinearGradient(0, h * 0.45, 0, h);
  g.addColorStop(0, "rgba(20,14,12,0)");
  g.addColorStop(1, "rgba(20,14,12,0.78)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const frames = assets.walk;
  if (frames.length) {
    const fps = 8;
    const fi = Math.floor(vm.walkT * fps) % frames.length;
    const x = w * 0.36;
    sprite(ctx, frames[fi], x, h * 0.96, h * 0.44);
  }

  if (vm.showIntro) {
    const bset = assets.bosses[vm.boss.id];
    const u = Math.min(1, (vm.walkT - vm.introAt) / 1.7);
    const arenaU = Math.min(1, (vm.walkT - vm.introAt) / 1.6);
    if (bset && arenaU < 0.55) {
      const xBoss = w * (0.96 - 0.22 * u);
      sprite(ctx, bset.idle, xBoss, h * 0.8, h * 0.46, {
        alpha: (0.2 + 0.8 * u) * (1 - Math.min(1, arenaU / 0.55)),
        sx: 0.92 + 0.08 * u,
        sy: 0.92 + 0.08 * u,
      });
    }
  }
}

function drawFightPreview(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  vm: ViewModel,
  assets: SpriteBook,
) {
  const bg = assets.bg[vm.boss.id];
  if (bg) {
    ctx.save();
    ctx.filter = "brightness(0.78) saturate(0.9)";
    coverDraw(ctx, bg, w, h);
    ctx.filter = "none";
    ctx.restore();
  } else {
    ctx.fillStyle = "#140e0c";
    ctx.fillRect(0, 0, w, h);
  }
  const g = ctx.createLinearGradient(0, h * 0.55, 0, h);
  g.addColorStop(0, "rgba(20,14,12,0)");
  g.addColorStop(1, "rgba(20,14,12,0.72)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.62, w * 0.22, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.92, w * 0.2, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  const bset = assets.bosses[vm.boss.id];
  if (bset) {
    const bossH = vm.boss.id === "cops" ? h * 0.62 : h * 0.52;
    const bossY = vm.boss.id === "cops" ? h * 0.72 : h * 0.68;
    sprite(ctx, bset.idle, w * 0.5, bossY, bossH);
  }
  const pimg = playerImg(assets, "idle", vm.boss.id === "manager" || vm.boss.id === "hr");
  sprite(ctx, pimg, w * 0.5, h * 0.98, h * 0.46);
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  vm: ViewModel,
  assets: SpriteBook,
) {
  if (vm.phase === "interlude") {
    drawWalk(ctx, w, h, vm, assets);
    if (vm.showIntro) {
      const u = Math.min(1, (vm.walkT - vm.introAt) / 1.55);
      if (u > 0.02) {
        ctx.save();
        ctx.globalAlpha = u;
        drawFightPreview(ctx, w, h, vm, assets);
        ctx.restore();
      }
    }
    return;
  }

  const shake = vm.juice.shake(vm.time);
  ctx.save();
  ctx.translate(shake.x, shake.y);
  ctx.rotate(shake.r);

  const bg = assets.bg[vm.boss.id];
  if (bg) {
    ctx.save();
    ctx.filter = "brightness(0.78) saturate(0.9)";
    coverDraw(ctx, bg, w, h);
    ctx.filter = "none";
    ctx.restore();
  } else {
    ctx.fillStyle = "#140e0c";
    ctx.fillRect(0, 0, w, h);
  }

  const g = ctx.createLinearGradient(0, h * 0.55, 0, h);
  g.addColorStop(0, "rgba(20,14,12,0)");
  g.addColorStop(1, "rgba(20,14,12,0.72)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.62, w * 0.22, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.5 + vm.playerX * w * 0.16, h * 0.92, w * 0.2, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  const bset = assets.bosses[vm.boss.id];
  if (bset && vm.phase !== "finisher") {
    const bimg =
      vm.bossPose === "attack" ? bset.attack : vm.bossPose === "hurt" || vm.bossPose === "stun" || vm.bossPose === "ko" ? bset.hurt : bset.idle;
    const glow = vm.boss.palette.glow;
    if (vm.guard !== "none" && vm.phase === "fight" && vm.boss.id !== "cops") {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(vm.time * 8) * 0.1;
      ctx.fillStyle = glow;
      const gx = vm.guard === "left" ? w * 0.38 : w * 0.62;
      ctx.beginPath();
      ctx.ellipse(gx, h * 0.42, 28, 70, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const flash = vm.bossPose === "hurt" ? 0.12 : 0;
    const bossH = vm.boss.id === "cops" ? h * 0.62 : h * 0.52;
    const bossY = vm.boss.id === "cops" ? h * 0.72 : h * 0.68;
    sprite(ctx, bimg, w * 0.5 + vm.bossX * 40, bossY, bossH, {
      rot: vm.bossRot,
      sx: vm.bossScaleX,
      sy: vm.bossScaleY,
      alpha: vm.bossPose === "ko" ? 0.85 : 1,
    });
    if (flash) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.35;
      sprite(ctx, bimg, w * 0.5 + vm.bossX * 40, bossY, bossH, {
        rot: vm.bossRot,
        sx: vm.bossScaleX,
        sy: vm.bossScaleY,
      });
      ctx.restore();
    }
  }

  if (vm.phase === "finisher") {
    const still = assets.fatality[vm.boss.id];
    if (still) {
      ctx.save();
      const zoom = 1 + (vm.mash ? vm.mash.count / vm.mash.goal : 1) * 0.12;
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-w / 2, -h / 2);
      coverDraw(ctx, still, w, h);
      ctx.restore();
    }
  }

  for (const p of vm.projectiles) {
    const img = assets.proj[p.kind] ?? assets.proj.beer;
    const u = Math.min(1, p.t / p.life);
    const x = laneX(p.lane, w) + (w * 0.5 + vm.playerX * w * 0.16 - laneX(p.lane, w)) * u;
    const startY = p.lane === "high" ? h * 0.22 : h * 0.36;
    const y = startY + (h * 0.78 - startY) * u;
    if (img) {
      sprite(ctx, img, x, y + 40, 90, { rot: u * 8, sx: 0.9 + u * 0.3, sy: 0.9 + u * 0.3 });
    }
  }

  if (vm.phase !== "finisher") {
    const pimg = playerImg(assets, vm.playerPose, vm.boss.id === "manager" || vm.boss.id === "hr", vm.punchVariant);
    sprite(ctx, pimg, w * 0.5 + vm.playerX * w * 0.18, h * 0.98, h * 0.46, {
      flip: vm.playerPose === "dodgeR",
      sy: vm.playerSquash,
      sx: 1 / Math.max(0.7, vm.playerSquash),
    });
  }

  if (vm.boss.id === "cops" && (vm.phase === "fight" || vm.phase === "countdown")) {
    const g2 = ctx.createRadialGradient(w * 0.5, h * 0.55, 40, w * 0.5, h * 0.5, h * 0.7);
    g2.addColorStop(0, "rgba(196,69,54,0)");
    g2.addColorStop(1, "rgba(80,12,16,0.55)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);
  }

  if (vm.telegraphLane && (vm.phase === "fight" || vm.phase === "countdown")) {
    drawCue(ctx, w, h, vm.telegraphLane, vm.time);
  }

  for (const p of vm.juice.particles) {
    const a = 1 - p.life / p.max;
    ctx.save();
    ctx.translate(p.x * (w / 360), p.y * (h / 640));
    ctx.rotate(p.rot);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }

  ctx.font = `700 ${Math.round(h * 0.032)}px Teko, sans-serif`;
  ctx.textAlign = "center";
  for (const f of vm.juice.floaters) {
    const a = 1 - f.life / f.max;
    ctx.globalAlpha = a;
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x * (w / 360), f.y * (h / 640));
  }
  ctx.globalAlpha = 1;

  if (vm.juice.flash > 0) {
    ctx.fillStyle = vm.juice.flashColor;
    ctx.globalAlpha = vm.juice.flash * 0.55;
    ctx.fillRect(-20, -20, w + 40, h + 40);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawCue(ctx: CanvasRenderingContext2D, w: number, h: number, lane: Lane, t: number) {
  const pulse = 0.65 + Math.sin(t * 18) * 0.35;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = "#f3ebe1";
  ctx.font = `700 ${Math.round(h * 0.07)}px Teko, sans-serif`;
  ctx.textAlign = "center";
  ctx.shadowColor = "#140e0c";
  ctx.shadowBlur = 12;
  const y = h * 0.16;
  if (lane === "high") {
    ctx.fillText("SWIPE DOWN", w / 2, y);
    ctx.beginPath();
    ctx.moveTo(w / 2 - 28, y + 18);
    ctx.lineTo(w / 2, y + 42);
    ctx.lineTo(w / 2 + 28, y + 18);
    ctx.fill();
  } else if (lane === "center") {
    ctx.fillText("MOVE", w / 2, y);
  } else {
    const dir = lane === "left" ? -1 : 1;
    ctx.fillText(lane === "left" ? "SWIPE LEFT" : "SWIPE RIGHT", w / 2 + dir * 20, y);
    const cx = w / 2 + dir * 120;
    ctx.beginPath();
    ctx.moveTo(cx, y + 8);
    ctx.lineTo(cx + dir * 36, y + 28);
    ctx.lineTo(cx, y + 48);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
