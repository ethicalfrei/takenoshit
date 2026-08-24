export type MusicScene =
  | "title"
  | "walk"
  | "roommate"
  | "leaf"
  | "baker"
  | "barista"
  | "manager"
  | "gym"
  | "boss"
  | "roommateV"
  | "leafV"
  | "bakerV"
  | "baristaV"
  | "managerV"
  | "gymV"
  | "bossV"
  | "roommateF"
  | "leafF"
  | "bakerF"
  | "baristaF"
  | "managerF"
  | "gymF"
  | "bossF"
  | "victory"
  | "defeat"
  | "dawn"
  | "morning"
  | "midday"
  | "finale";

export type SfxName =
  | "punch"
  | "punchHit"
  | "block"
  | "dodge"
  | "hurt"
  | "whoosh"
  | "stun"
  | "ko"
  | "grab"
  | "mash"
  | "impact"
  | "projectile"
  | "ui"
  | "bell";

export type GameAudio = {
  unlock: () => void;
  resume: () => void;
  setScene: (scene: MusicScene) => void;
  prefetch: (scene: MusicScene) => void;
  onBedEnded: (cb: (() => void) | null) => void;
  sfx: (name: SfxName, opts?: { rate?: number }) => void;
  setMuted: (muted: boolean) => void;
  setVolumes: (master: number, music: number, sfx: number) => void;
  getMuted: () => boolean;
  dispose: () => void;
};

type Ctx = AudioContext;

const MOTIF = [57, 55, 52, 50];

function asset(path: string) {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base}${path}`;
}

const V = "v=rhyme1";

const BED_URL: Record<MusicScene, string> = {
  title: asset(`/music/title.mp3?${V}`),
  walk: asset(`/music/walk.mp3?${V}`),
  dawn: asset(`/music/walk.mp3?${V}`),
  roommate: asset(`/music/roommate-chorus.mp3?${V}`),
  leaf: asset(`/music/leaf-chorus.mp3?${V}`),
  baker: asset(`/music/baker-chorus.mp3?${V}`),
  barista: asset(`/music/barista-chorus.mp3?${V}`),
  manager: asset(`/music/manager-chorus.mp3?${V}`),
  gym: asset(`/music/gym-chorus.mp3?${V}`),
  boss: asset(`/music/boss-chorus.mp3?${V}`),
  roommateV: asset(`/music/roommate-verse.mp3?${V}`),
  leafV: asset(`/music/leaf-verse.mp3?${V}`),
  bakerV: asset(`/music/baker-verse.mp3?${V}`),
  baristaV: asset(`/music/barista-verse.mp3?${V}`),
  managerV: asset(`/music/manager-verse.mp3?${V}`),
  gymV: asset(`/music/gym-verse.mp3?${V}`),
  bossV: asset(`/music/boss-verse.mp3?${V}`),
  roommateF: asset(`/music/roommate-fatality.mp3?${V}`),
  leafF: asset(`/music/leaf-fatality.mp3?${V}`),
  bakerF: asset(`/music/baker-fatality.mp3?${V}`),
  baristaF: asset(`/music/barista-fatality.mp3?${V}`),
  managerF: asset(`/music/manager-fatality.mp3?${V}`),
  gymF: asset(`/music/gym-fatality.mp3?${V}`),
  bossF: asset(`/music/boss-fatality.mp3?${V}`),
  morning: asset(`/music/roommate-chorus.mp3?${V}`),
  midday: asset(`/music/manager-chorus.mp3?${V}`),
  finale: asset(`/music/boss-chorus.mp3?${V}`),
  victory: asset(`/music/victory.mp3?${V}`),
  defeat: asset(`/music/defeat.mp3?${V}`),
};

type BedVoice = {
  el: HTMLAudioElement;
  gain: GainNode;
};

function midi(n: number) {
  return 440 * Math.pow(2, (n - 69) / 12);
}

function noiseBuffer(ctx: Ctx, seconds = 0.4) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export function createAudio(): GameAudio {
  let ctx: Ctx | null = null;
  let master: GainNode | null = null;
  let musicBus: GainNode | null = null;
  let sfxBus: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let scene: MusicScene = "title";
  let muted = false;
  let masterV = 0.85;
  let musicV = 0.55;
  let sfxV = 0.8;
  let stepTimer: number | null = null;
  let step = 0;
  let voices = 0;
  const MAX_SFX = 8;
  const beds = new Map<string, BedVoice>();
  let currentBed = "";
  let bedsOn = true;
  let endedCb: (() => void) | null = null;

  function ensureBed(url: string): BedVoice | null {
    const c = ctx;
    const bus = musicBus;
    if (!c || !bus) return null;
    let b = beds.get(url);
    if (b) return b;
    const el = new Audio(url);
    el.loop = !url.includes("-verse") && !url.includes("-fatality") && !url.includes("victory") && !url.includes("defeat");
    el.preload = "auto";
    const src = c.createMediaElementSource(el);
    const gain = c.createGain();
    gain.gain.value = 0;
    src.connect(gain);
    gain.connect(bus);
    b = { el, gain };
    beds.set(url, b);
    el.addEventListener("ended", () => {
      if (currentBed === url) endedCb?.();
    });
    el.addEventListener("error", () => {
      const fb = url.replace("-chorus.mp3", ".mp3").replace("-verse.mp3", ".mp3").replace("-fatality.mp3", ".mp3");
      if (fb !== url) fadeToBed(fb);
    });
    return b;
  }

  function fadeToBed(url: string) {
    if (!ctx || !musicBus) return;
    const now = ctx.currentTime;
    for (const [u, b] of beds) {
      if (u === url) continue;
      b.gain.gain.cancelScheduledValues(now);
      b.gain.gain.setValueAtTime(b.gain.gain.value, now);
      b.gain.gain.linearRampToValueAtTime(0, now + 0.4);
      window.setTimeout(() => {
        if (currentBed !== u) b.el.pause();
      }, 450);
    }
    const next = ensureBed(url);
    if (!next) return;
    next.el.currentTime = 0;
    void next.el.play().catch(() => {});
    next.gain.gain.cancelScheduledValues(now);
    next.gain.gain.setValueAtTime(next.gain.gain.value, now);
    next.gain.gain.linearRampToValueAtTime(0.82, now + 0.38);
    currentBed = url;
  }

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus = ctx.createGain();
    musicBus.connect(master);
    sfxBus.connect(master);
    master.connect(ctx.destination);
    noise = noiseBuffer(ctx);
    applyGains();
    return ctx;
  }

  function applyGains() {
    if (!ctx || !master || !musicBus || !sfxBus) return;
    const m = muted ? 0 : masterV * masterV;
    master.gain.setTargetAtTime(m, ctx.currentTime, 0.03);
    musicBus.gain.setTargetAtTime(musicV * musicV, ctx.currentTime, 0.04);
    sfxBus.gain.setTargetAtTime(sfxV * sfxV, ctx.currentTime, 0.02);
  }

  function sceneSpec(s: MusicScene) {
    switch (s) {
      case "title":
        return { bpm: 86, drums: 0.2, drive: 0.15, bright: 0.25 };
      case "dawn":
      case "walk":
      case "leaf":
        return { bpm: 92, drums: 0.35, drive: 0.18, bright: 0.28 };
      case "morning":
      case "roommate":
      case "baker":
      case "barista":
        return { bpm: 100, drums: 0.55, drive: 0.25, bright: 0.35 };
      case "midday":
      case "manager":
      case "gym":
        return { bpm: 110, drums: 0.7, drive: 0.32, bright: 0.4 };
      case "finale":
      case "boss":
        return { bpm: 120, drums: 0.95, drive: 0.55, bright: 0.5 };
      case "victory":
        return { bpm: 96, drums: 0.45, drive: 0.2, bright: 0.55 };
      case "defeat":
        return { bpm: 70, drums: 0.15, drive: 0.08, bright: 0.12 };
      default:
        return { bpm: 108, drums: 0.7, drive: 0.3, bright: 0.4 };
    }
  }

  function beep(
    freq: number,
    type: OscillatorType,
    dur: number,
    gain: number,
    bus: GainNode,
    at: number,
    extra?: { detune?: number; filter?: number },
  ) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (extra?.detune) osc.detune.setValueAtTime(extra.detune, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    if (extra?.filter) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(extra.filter, at);
      osc.connect(f);
      f.connect(g);
    } else {
      osc.connect(g);
    }
    g.connect(bus);
    osc.start(at);
    osc.stop(at + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }

  function kick(at: number, amt: number) {
    if (!ctx || !musicBus) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, at);
    osc.frequency.exponentialRampToValueAtTime(42, at + 0.12);
    g.gain.setValueAtTime(Math.max(0.0002, amt * 0.7), at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
    osc.connect(g);
    g.connect(musicBus);
    osc.start(at);
    osc.stop(at + 0.2);
  }

  function hat(at: number, amt: number) {
    if (!ctx || !musicBus || !noise) return;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 6000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(Math.max(0.0002, amt * 0.12), at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
    src.connect(f);
    f.connect(g);
    g.connect(musicBus);
    src.start(at);
    src.stop(at + 0.05);
  }

  function tick() {
    if (!ctx || !musicBus) return;
    if (bedsOn && currentBed) return;
    const spec = sceneSpec(scene);
    const sixteenth = 60 / spec.bpm / 4;
    const now = ctx.currentTime;
    const look = 0.25;
    while (true) {
      const t = (stepTimer ?? now) as number;
      if (t > now + look) break;
      const beat = step % 16;
      const bar = Math.floor(step / 16);
      const motifNote = MOTIF[bar % MOTIF.length];
      const victoryLift = scene === "victory" ? 12 : scene === "defeat" ? -7 : 0;
      const bass = midi(motifNote - 12 + victoryLift);
      const lead = midi(motifNote + victoryLift + (beat === 4 ? 3 : beat === 12 ? 2 : 0));

      if (beat === 0 || beat === 8) {
        beep(bass, "triangle", 0.22, 0.18, musicBus, t, { filter: 420 });
        if (spec.drums > 0.2) kick(t, spec.drums);
      }
      if (beat === 0) {
        beep(lead, "square", 0.28, 0.07 + spec.bright * 0.08, musicBus, t, {
          detune: spec.drive * 18,
          filter: 900 + spec.bright * 1400,
        });
      }
      if (beat === 6 && scene !== "title") {
        beep(midi(motifNote + 7 + victoryLift), "square", 0.12, 0.045, musicBus, t, { filter: 1200 });
      }
      if (spec.drums > 0.1 && beat % 2 === 0) hat(t, spec.drums * (beat % 4 === 2 ? 0.7 : 0.4));
      if (spec.drums > 0.6 && beat === 4) kick(t, spec.drums * 0.55);

      step += 1;
      stepTimer = t + sixteenth;
      if (stepTimer > now + look) break;
    }
  }

  let raf = 0;
  function loop() {
    tick();
    raf = requestAnimationFrame(loop);
  }

  function startClock() {
    if (!ctx) return;
    if (!stepTimer) stepTimer = ctx.currentTime + 0.05;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function burst(name: SfxName, rate = 1) {
    if (!ctx || !sfxBus || !noise) return;
    if (voices >= MAX_SFX) return;
    voices += 1;
    const at = ctx.currentTime;
    const jitter = 1 + (Math.random() * 2 - 1) * 0.08;
    const r = rate * jitter;
    const done = (ms: number) => {
      window.setTimeout(() => {
        voices = Math.max(0, voices - 1);
      }, ms);
    };

    const thump = (freq: number, dur: number, g: number) => {
      beep(freq * r, "sine", dur, g, sfxBus!, at, { filter: freq * 2 });
    };
    const crack = (g: number, dur: number, hp: number) => {
      const src = ctx!.createBufferSource();
      src.buffer = noise;
      src.playbackRate.value = r;
      const f = ctx!.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = hp;
      f.Q.value = 0.8;
      const gn = ctx!.createGain();
      gn.gain.setValueAtTime(Math.max(0.0002, g), at);
      gn.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      src.connect(f);
      f.connect(gn);
      gn.connect(sfxBus!);
      src.start(at);
      src.stop(at + dur);
    };

    switch (name) {
      case "punch":
        thump(140, 0.08, 0.35);
        crack(0.2, 0.06, 1800);
        done(120);
        break;
      case "punchHit":
        thump(90, 0.12, 0.55);
        crack(0.45, 0.1, 900);
        beep(420 * r, "square", 0.07, 0.12, sfxBus, at);
        done(160);
        break;
      case "block":
        beep(240 * r, "square", 0.06, 0.2, sfxBus, at);
        crack(0.25, 0.08, 2400);
        done(120);
        break;
      case "dodge":
        beep(520 * r, "sine", 0.07, 0.12, sfxBus, at);
        crack(0.08, 0.05, 4000);
        done(100);
        break;
      case "hurt":
        thump(70, 0.16, 0.5);
        crack(0.4, 0.14, 500);
        done(180);
        break;
      case "whoosh":
        crack(0.18, 0.12, 1200);
        done(140);
        break;
      case "stun":
        beep(midi(76), "square", 0.18, 0.16, sfxBus, at);
        beep(midi(80), "square", 0.18, 0.12, sfxBus, at + 0.08);
        done(280);
        break;
      case "ko":
        thump(55, 0.35, 0.7);
        beep(midi(52), "sawtooth", 0.4, 0.1, sfxBus, at, { filter: 400 });
        done(420);
        break;
      case "grab":
        thump(100, 0.14, 0.4);
        beep(180 * r, "triangle", 0.12, 0.18, sfxBus, at);
        done(180);
        break;
      case "mash":
        beep(660 * r + voices * 20, "square", 0.05, 0.14, sfxBus, at, { filter: 2200 });
        done(80);
        break;
      case "impact":
        thump(80, 0.18, 0.6);
        crack(0.5, 0.12, 700);
        done(200);
        break;
      case "projectile":
        beep(300 * r, "sawtooth", 0.1, 0.1, sfxBus, at, { filter: 800 });
        done(140);
        break;
      case "ui":
        beep(midi(72), "square", 0.05, 0.1, sfxBus, at);
        done(80);
        break;
      case "bell":
        beep(midi(76), "sine", 0.6, 0.22, sfxBus, at);
        beep(midi(83), "sine", 0.5, 0.12, sfxBus, at + 0.02);
        done(650);
        break;
    }
  }

  const onVis = () => {
    if (!ctx) return;
    if (document.visibilityState === "visible" && ctx.state === "suspended") {
      void ctx.resume();
    }
  };

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVis);
  }

  return {
    unlock() {
      const c = ensure();
      if (c.state === "suspended") void c.resume();
      startClock();
      fadeToBed(BED_URL[scene]);
    },
    resume() {
      if (ctx?.state === "suspended") void ctx.resume();
      const b = beds.get(currentBed);
      if (b && b.el.paused) void b.el.play().catch(() => {});
    },
    setScene(next) {
      scene = next;
      step = 0;
      if (ctx) stepTimer = ctx.currentTime + 0.02;
      fadeToBed(BED_URL[next]);
    },
    prefetch(next) {
      ensure();
      ensureBed(BED_URL[next]);
    },
    onBedEnded(cb) {
      endedCb = cb;
    },
    sfx(name, opts) {
      if (muted) return;
      ensure();
      burst(name, opts?.rate ?? 1);
    },
    setMuted(v) {
      muted = v;
      applyGains();
    },
    setVolumes(m, mu, s) {
      masterV = m;
      musicV = mu;
      sfxV = s;
      applyGains();
    },
    getMuted() {
      return muted;
    },
    dispose() {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      for (const b of beds.values()) {
        b.el.pause();
        b.el.src = "";
      }
      beds.clear();
      void ctx?.close();
      ctx = null;
    },
  };
}
