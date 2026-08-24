export type MusicScene = "title" | "dawn" | "morning" | "midday" | "finale" | "victory" | "defeat" | "walk";

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
  sfx: (name: SfxName, opts?: { rate?: number }) => void;
  setMuted: (muted: boolean) => void;
  setVolumes: (master: number, music: number, sfx: number) => void;
  getMuted: () => boolean;
  dispose: () => void;
};

const STEPS = 32;
const MAX_MUSIC = 12;
const MAX_SFX = 8;
const LOOKAHEAD = 0.2;
const SCHED_MS = 25;

const SIGH = [69, 67, 64, 62] as const;
const WIN = [69, 71, 73, 76] as const;
const FALL = [62, 60, 57, 55] as const;

type Pattern = {
  lead: Int8Array;
  bass: Int8Array;
  kick: Float32Array;
  snare: Float32Array;
  hat: Float32Array;
};

type Chart = {
  bpm: number;
  cutoff: number;
  drive: number;
  patterns: Pattern[];
};

function midiHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

function emptyI(): Int8Array {
  return new Int8Array(STEPS);
}

function emptyF(): Float32Array {
  return new Float32Array(STEPS);
}

function pat(
  lead: (row: Int8Array) => void,
  bass: (row: Int8Array) => void,
  kick: Float32Array,
  snare: Float32Array,
  hat: Float32Array,
): Pattern {
  const l = emptyI();
  const b = emptyI();
  lead(l);
  bass(b);
  return { lead: l, bass: b, kick, snare, hat };
}

function hits(steps: number[], vel = 1): Float32Array {
  const row = emptyF();
  for (const s of steps) row[s] = vel;
  return row;
}

function hats(every: number, accent: number, ghost: number): Float32Array {
  const row = emptyF();
  for (let i = 0; i < STEPS; i += every) {
    row[i] = i % 4 === 0 ? accent : ghost;
  }
  return row;
}

const NONE = emptyF();

const title0 = pat(
  (l) => {
    l[0] = SIGH[0];
    l[7] = SIGH[1];
    l[15] = SIGH[2];
    l[24] = SIGH[3];
  },
  (b) => {
    b[0] = 45;
    b[16] = 33;
  },
  NONE,
  NONE,
  NONE,
);

const title1 = pat(
  (l) => {
    l[4] = SIGH[0];
    l[11] = SIGH[1];
    l[19] = SIGH[2];
    l[28] = SIGH[3];
  },
  (b) => {
    b[0] = 33;
    b[16] = 38;
  },
  NONE,
  NONE,
  NONE,
);

const dawn0 = pat(
  (l) => {
    l[0] = SIGH[0];
    l[5] = SIGH[1];
    l[12] = SIGH[2];
    l[20] = SIGH[3];
  },
  (b) => {
    b[0] = 45;
    b[16] = 40;
  },
  NONE,
  NONE,
  NONE,
);

const dawn1 = pat(
  (l) => {
    l[2] = SIGH[0];
    l[8] = SIGH[1];
    l[14] = SIGH[2];
    l[24] = SIGH[3];
  },
  (b) => {
    b[0] = 38;
    b[16] = 45;
  },
  NONE,
  NONE,
  NONE,
);

const walk0 = pat(
  (l) => {
    l[0] = SIGH[0];
    l[5] = SIGH[1];
    l[12] = SIGH[2];
    l[20] = SIGH[3];
  },
  (b) => {
    b[0] = 45;
    b[8] = 45;
    b[16] = 43;
    b[24] = 40;
  },
  hits([0, 16], 0.28),
  NONE,
  NONE,
);

const walk1 = pat(
  (l) => {
    l[0] = SIGH[0];
    l[6] = SIGH[1];
    l[14] = SIGH[2];
    l[22] = SIGH[3];
  },
  (b) => {
    b[0] = 38;
    b[8] = 40;
    b[16] = 43;
    b[24] = 45;
  },
  hits([0, 16], 0.24),
  NONE,
  NONE,
);

const morning0 = pat(
  (l) => {
    l[0] = SIGH[0];
    l[4] = SIGH[1];
    l[8] = SIGH[2];
    l[14] = SIGH[3];
    l[16] = 57;
    l[24] = SIGH[2];
  },
  (b) => {
    b[0] = 45;
    b[4] = 45;
    b[8] = 43;
    b[12] = 40;
    b[16] = 38;
    b[20] = 40;
    b[24] = 43;
    b[28] = 45;
  },
  hits([0, 6, 16, 22], 0.85),
  hits([8, 24], 0.7),
  hats(2, 0.28, 0.12),
);

const morning1 = pat(
  (l) => {
    l[2] = SIGH[0];
    l[6] = SIGH[1];
    l[10] = SIGH[2];
    l[16] = SIGH[3];
    l[20] = 67;
    l[26] = 64;
  },
  (b) => {
    b[0] = 43;
    b[4] = 45;
    b[8] = 48;
    b[12] = 45;
    b[16] = 40;
    b[20] = 38;
    b[24] = 40;
    b[28] = 43;
  },
  hits([0, 4, 10, 16, 22], 0.8),
  hits([8, 24], 0.72),
  hats(2, 0.3, 0.14),
);

const midday0 = pat(
  (l) => {
    l[0] = SIGH[0];
    l[2] = SIGH[0];
    l[6] = SIGH[1];
    l[10] = SIGH[2];
    l[14] = SIGH[3];
    l[18] = 79;
    l[22] = 76;
    l[26] = 74;
    l[30] = 69;
  },
  (b) => {
    b[0] = 45;
    b[2] = 45;
    b[4] = 43;
    b[6] = 45;
    b[8] = 48;
    b[10] = 45;
    b[12] = 43;
    b[14] = 40;
    b[16] = 38;
    b[18] = 38;
    b[20] = 40;
    b[22] = 43;
    b[24] = 45;
    b[26] = 43;
    b[28] = 40;
    b[30] = 38;
  },
  hits([0, 4, 7, 10, 16, 20, 23, 26], 0.88),
  hits([8, 24], 0.75),
  hats(1, 0.22, 0.1),
);

const midday1 = pat(
  (l) => {
    l[0] = SIGH[1];
    l[4] = SIGH[2];
    l[8] = SIGH[3];
    l[12] = SIGH[0];
    l[16] = SIGH[0];
    l[20] = SIGH[1];
    l[24] = SIGH[2];
    l[28] = SIGH[3];
  },
  (b) => {
    b[0] = 33;
    b[4] = 45;
    b[8] = 43;
    b[10] = 45;
    b[12] = 48;
    b[16] = 40;
    b[18] = 38;
    b[20] = 40;
    b[24] = 43;
    b[26] = 45;
    b[28] = 46;
    b[30] = 43;
  },
  hits([0, 3, 8, 12, 16, 19, 24, 28], 0.86),
  hits([8, 14, 24, 30], 0.62),
  hats(1, 0.24, 0.11),
);

const finale0 = pat(
  (l) => {
    l[0] = SIGH[0];
    l[2] = SIGH[0];
    l[4] = SIGH[1];
    l[6] = SIGH[1];
    l[8] = SIGH[2];
    l[12] = SIGH[3];
    l[16] = SIGH[0];
    l[18] = SIGH[1];
    l[20] = SIGH[2];
    l[22] = SIGH[3];
    l[24] = SIGH[0];
    l[28] = SIGH[3];
  },
  (b) => {
    b[0] = 33;
    b[2] = 45;
    b[4] = 45;
    b[6] = 46;
    b[8] = 43;
    b[10] = 43;
    b[12] = 40;
    b[14] = 38;
    b[16] = 33;
    b[18] = 45;
    b[20] = 43;
    b[22] = 40;
    b[24] = 38;
    b[26] = 40;
    b[28] = 43;
    b[30] = 45;
  },
  hits([0, 2, 4, 8, 12, 14, 16, 18, 20, 24, 26, 28], 0.95),
  hits([8, 24, 26], 0.82),
  hats(1, 0.3, 0.14),
);

const finale1 = pat(
  (l) => {
    l[0] = SIGH[0];
    l[4] = SIGH[1];
    l[8] = SIGH[2];
    l[10] = SIGH[3];
    l[12] = SIGH[2];
    l[16] = 81;
    l[18] = 79;
    l[20] = 76;
    l[22] = 74;
    l[24] = 69;
    l[28] = 62;
  },
  (b) => {
    b[0] = 45;
    b[2] = 45;
    b[4] = 43;
    b[6] = 45;
    b[8] = 38;
    b[10] = 38;
    b[12] = 40;
    b[14] = 43;
    b[16] = 33;
    b[18] = 33;
    b[20] = 45;
    b[22] = 46;
    b[24] = 43;
    b[26] = 40;
    b[28] = 38;
    b[30] = 33;
  },
  hits([0, 4, 6, 8, 12, 16, 20, 22, 24, 28], 0.95),
  hits([8, 14, 24, 30], 0.8),
  hats(1, 0.32, 0.16),
);

const victory0 = pat(
  (l) => {
    l[0] = WIN[0];
    l[7] = WIN[1];
    l[15] = WIN[2];
    l[24] = WIN[3];
  },
  (b) => {
    b[0] = 45;
    b[8] = 49;
    b[16] = 52;
    b[24] = 45;
  },
  hits([0, 16], 0.4),
  hits([8, 24], 0.28),
  hats(2, 0.14, 0.06),
);

const victory1 = pat(
  (l) => {
    l[0] = WIN[3];
    l[8] = 81;
    l[16] = WIN[2];
    l[24] = WIN[0];
    l[28] = WIN[3];
  },
  (b) => {
    b[0] = 57;
    b[8] = 52;
    b[16] = 49;
    b[24] = 45;
  },
  hits([0, 16], 0.38),
  hits([8, 24], 0.26),
  hats(2, 0.12, 0.05),
);

const defeat0 = pat(
  (l) => {
    l[0] = FALL[0];
    l[10] = FALL[1];
    l[22] = FALL[2];
  },
  (b) => {
    b[0] = 38;
  },
  hits([0], 0.4),
  NONE,
  NONE,
);

const defeat1 = pat(
  (l) => {
    l[4] = FALL[0];
    l[16] = FALL[2];
    l[30] = FALL[3];
  },
  (b) => {
    b[16] = 33;
  },
  NONE,
  NONE,
  NONE,
);

const defeat2 = pat(
  (l) => {
    l[8] = FALL[3];
  },
  (b) => {
    b[0] = 26;
  },
  hits([0], 0.22),
  NONE,
  NONE,
);

const CHARTS: Record<MusicScene, Chart> = {
  title: { bpm: 64, cutoff: 1500, drive: 0, patterns: [title0, title1] },
  dawn: { bpm: 78, cutoff: 1900, drive: 0.05, patterns: [dawn0, dawn1] },
  walk: { bpm: 78, cutoff: 2100, drive: 0.08, patterns: [walk0, walk1] },
  morning: { bpm: 96, cutoff: 2800, drive: 0.18, patterns: [morning0, morning1] },
  midday: { bpm: 110, cutoff: 3600, drive: 0.38, patterns: [midday0, midday1] },
  finale: { bpm: 128, cutoff: 5400, drive: 0.86, patterns: [finale0, finale1] },
  victory: { bpm: 90, cutoff: 3200, drive: 0.04, patterns: [victory0, victory1] },
  defeat: { bpm: 56, cutoff: 880, drive: 0.12, patterns: [defeat0, defeat1, defeat2] },
};

function makeNoise(ctx: AudioContext, seconds: number): AudioBuffer {
  const n = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function driveCurve(amount: number): Float32Array {
  const n = 256;
  const out = new Float32Array(n);
  const k = amount * 14;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    out[i] = k <= 0 ? x : ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return out;
}

function createCtx(): AudioContext | null {
  const g = globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext };
  const Ctor = g.AudioContext ?? g.webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor({ latencyHint: "interactive" });
  } catch {
    try {
      return new Ctor();
    } catch {
      return null;
    }
  }
}

type OscOpts = {
  detune?: number;
  freqEnd?: number;
  attack?: number;
  release?: number;
};

export function createAudio(): GameAudio {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let musicBus: GainNode | null = null;
  let sfxBus: GainNode | null = null;
  let musicIn: GainNode | null = null;
  let musicFilter: BiquadFilterNode | null = null;
  let musicShaper: WaveShaperNode | null = null;
  let noise: AudioBuffer | null = null;

  let disposed = false;
  let muted = false;
  let masterVol = 1;
  let musicVol = 0.62;
  let sfxVol = 0.88;

  let scene: MusicScene = "title";
  let pending: MusicScene | null = null;
  let step = 0;
  let patternIndex = 0;
  let nextStepTime = 0;
  let running = false;
  let sched: ReturnType<typeof setTimeout> | undefined;

  let musicAlive = 0;
  const sfxGroups: AudioScheduledSourceNode[][] = [];

  const listeners: Array<[string, EventListener]> = [];

  function on(target: EventTarget, type: string, fn: EventListener) {
    target.addEventListener(type, fn);
    listeners.push([type, fn]);
  }

  function curve(x: number): number {
    return clamp01(x) * clamp01(x);
  }

  function applyMaster(now?: number) {
    if (!ctx || !master) return;
    const t = now ?? ctx.currentTime;
    master.gain.setTargetAtTime(muted ? 0 : curve(masterVol), t, 0.03);
  }

  function applyMix(now?: number) {
    if (!ctx || !musicBus || !sfxBus) return;
    const t = now ?? ctx.currentTime;
    musicBus.gain.setTargetAtTime(curve(musicVol), t, 0.03);
    sfxBus.gain.setTargetAtTime(curve(sfxVol), t, 0.03);
  }

  function applyTone(next: MusicScene, now?: number) {
    if (!ctx || !musicFilter || !musicShaper) return;
    const t = now ?? ctx.currentTime;
    const chart = CHARTS[next];
    musicFilter.frequency.setTargetAtTime(chart.cutoff, t, 0.08);
    musicFilter.Q.setTargetAtTime(next === "finale" ? 0.45 : 0.7, t, 0.08);
    musicShaper.curve = driveCurve(chart.drive) as WaveShaperNode["curve"];
  }

  function wireGraph(ac: AudioContext) {
    master = ac.createGain();
    musicBus = ac.createGain();
    sfxBus = ac.createGain();
    musicIn = ac.createGain();
    musicFilter = ac.createBiquadFilter();
    musicShaper = ac.createWaveShaper();

    master.gain.setValueAtTime(0.0001, ac.currentTime);
    musicBus.gain.setValueAtTime(curve(musicVol), ac.currentTime);
    sfxBus.gain.setValueAtTime(curve(sfxVol), ac.currentTime);
    musicIn.gain.setValueAtTime(1, ac.currentTime);

    musicFilter.type = "lowpass";
    musicFilter.frequency.setValueAtTime(CHARTS[scene].cutoff, ac.currentTime);
    musicFilter.Q.setValueAtTime(0.7, ac.currentTime);
    musicShaper.curve = driveCurve(CHARTS[scene].drive) as WaveShaperNode["curve"];
    musicShaper.oversample = "none";

    musicIn.connect(musicFilter);
    musicFilter.connect(musicShaper);
    musicShaper.connect(musicBus);
    musicBus.connect(master);
    sfxBus.connect(master);
    master.connect(ac.destination);

    noise = makeNoise(ac, 1.2);
    applyMaster(ac.currentTime);
    applyMix(ac.currentTime);
  }

  function ensure(): AudioContext | null {
    if (disposed) return null;
    if (ctx) return ctx;
    const ac = createCtx();
    if (!ac) return null;
    ctx = ac;
    wireGraph(ac);
    return ac;
  }

  function disconnectNode(node: AudioNode) {
    try {
      node.disconnect();
    } catch {
      /* already disconnected */
    }
  }

  function arm(
    source: AudioScheduledSourceNode,
    chain: AudioNode[],
    dest: AudioNode,
    when: number,
    dur: number,
    kind: "music" | "sfx",
  ) {
    if (!ctx) return;
    let prev: AudioNode = source;
    for (const node of chain) {
      prev.connect(node);
      prev = node;
    }
    prev.connect(dest);
    source.start(when);
    source.stop(when + dur);
    if (kind === "music") musicAlive += 1;
    source.onended = () => {
      disconnectNode(source);
      for (const node of chain) disconnectNode(node);
      if (kind === "music") musicAlive = Math.max(0, musicAlive - 1);
    };
    return source;
  }

  function startOsc(
    type: OscillatorType,
    freq: number,
    when: number,
    dur: number,
    peak: number,
    dest: AudioNode,
    kind: "music" | "sfx",
    opts: OscOpts = {},
  ): OscillatorNode | null {
    if (!ctx) return null;
    if (kind === "music" && musicAlive >= MAX_MUSIC) return null;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    const f0 = Math.max(20, freq);
    osc.frequency.setValueAtTime(f0, when);
    if (opts.freqEnd != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freqEnd), when + dur * 0.92);
    }
    if (opts.detune) osc.detune.setValueAtTime(opts.detune, when);
    const atk = opts.attack ?? 0.006;
    const rel = opts.release ?? Math.max(0.02, dur * 0.45);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), when + atk);
    g.gain.setTargetAtTime(0.0001, when + atk + 0.001, rel);
    arm(osc, [g], dest, when, dur + rel * 4, kind);
    return osc;
  }

  function startNoise(
    when: number,
    dur: number,
    peak: number,
    dest: AudioNode,
    kind: "music" | "sfx",
    filterType: BiquadFilterType,
    freq: number,
    q = 1,
    freqEnd?: number,
    playback = 1,
  ): AudioBufferSourceNode | null {
    if (!ctx || !noise) return null;
    if (kind === "music" && musicAlive >= MAX_MUSIC) return null;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.playbackRate.setValueAtTime(Math.max(0.4, playback), when);
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.setValueAtTime(Math.max(40, freq), when);
    f.Q.setValueAtTime(q, when);
    if (freqEnd != null) {
      f.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), when + dur);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), when + 0.004);
    g.gain.setTargetAtTime(0.0001, when + 0.004, Math.max(0.012, dur * 0.35));
    arm(src, [f, g], dest, when, dur + 0.04, kind);
    return src;
  }

  function playLead(midi: number, when: number) {
    if (!musicIn) return;
    const f = midiHz(midi);
    if (scene === "finale") {
      startOsc("sawtooth", f, when, 0.2, 0.07, musicIn, "music", { detune: -8, attack: 0.004, release: 0.05 });
      startOsc("sawtooth", f, when, 0.2, 0.07, musicIn, "music", { detune: 9, attack: 0.004, release: 0.05 });
      startOsc("square", midiHz(midi - 7), when, 0.16, 0.03, musicIn, "music", { attack: 0.005, release: 0.04 });
      return;
    }
    if (scene === "victory") {
      startOsc("sine", f, when, 0.72, 0.1, musicIn, "music", { attack: 0.01, release: 0.22 });
      startOsc("triangle", f, when, 0.5, 0.045, musicIn, "music", { attack: 0.012, release: 0.18 });
      startOsc("sine", midiHz(midi + 4), when, 0.42, 0.035, musicIn, "music", { attack: 0.02, release: 0.16 });
      return;
    }
    if (scene === "defeat") {
      startOsc("triangle", f, when, 1.05, 0.07, musicIn, "music", { attack: 0.02, release: 0.35 });
      startOsc("square", f, when, 0.7, 0.012, musicIn, "music", { attack: 0.03, release: 0.28 });
      return;
    }
    const long = scene === "title" || scene === "dawn";
    const dur = long ? 0.88 : scene === "walk" ? 0.58 : 0.36;
    const peak = scene === "midday" ? 0.08 : 0.075;
    startOsc("triangle", f, when, dur, peak, musicIn, "music", { attack: 0.01, release: long ? 0.28 : 0.12 });
    startOsc("square", f, when, dur * 0.7, peak * 0.42, musicIn, "music", { attack: 0.008, release: long ? 0.2 : 0.1 });
    if (long && musicAlive < MAX_MUSIC - 2) {
      startOsc("sine", f * 5.05, when, 0.045, 0.016, musicIn, "music", { attack: 0.001, release: 0.012 });
      startNoise(when, 0.028, 0.018, musicIn, "music", "bandpass", 1800, 0.9);
    }
  }

  function playBass(midi: number, when: number) {
    if (!musicIn) return;
    const f = midiHz(midi);
    if (scene === "finale" || scene === "midday") {
      startOsc("sawtooth", f, when, 0.16, 0.11, musicIn, "music", { attack: 0.005, release: 0.04 });
      startOsc("sine", f, when, 0.2, 0.08, musicIn, "music", { attack: 0.004, release: 0.05 });
      return;
    }
    if (scene === "morning") {
      startOsc("triangle", f, when, 0.2, 0.1, musicIn, "music", { attack: 0.006, release: 0.055 });
      startOsc("sine", f, when, 0.24, 0.07, musicIn, "music", { attack: 0.005, release: 0.06 });
      return;
    }
    if (scene === "victory") {
      startOsc("sine", f, when, 0.45, 0.09, musicIn, "music", { attack: 0.012, release: 0.16 });
      startOsc("triangle", f, when, 0.35, 0.04, musicIn, "music", { attack: 0.014, release: 0.14 });
      return;
    }
    startOsc("sine", f, when, 0.48, 0.08, musicIn, "music", { attack: 0.012, release: 0.16 });
    startOsc("triangle", f, when, 0.36, 0.035, musicIn, "music", { attack: 0.014, release: 0.14 });
  }

  function playKick(when: number, vel: number) {
    if (!musicBus) return;
    startOsc("sine", 148, when, 0.16, 0.52 * vel, musicBus, "music", {
      freqEnd: 36,
      attack: 0.002,
      release: 0.045,
    });
    startOsc("sine", 62, when, 0.07, 0.22 * vel, musicBus, "music", { attack: 0.001, release: 0.02 });
    startNoise(when, 0.018, 0.06 * vel, musicBus, "music", "lowpass", 420, 0.6);
  }

  function playSnare(when: number, vel: number) {
    if (!musicBus) return;
    startNoise(when, 0.09, 0.28 * vel, musicBus, "music", "bandpass", 1800, 0.85);
    startNoise(when, 0.05, 0.12 * vel, musicBus, "music", "highpass", 4200, 0.5);
    startOsc("triangle", 196, when, 0.07, 0.1 * vel, musicBus, "music", { freqEnd: 120, attack: 0.002, release: 0.025 });
  }

  function playHat(when: number, vel: number) {
    if (!musicBus) return;
    const open = vel > 0.26;
    startNoise(
      when,
      open ? 0.09 : 0.028,
      (open ? 0.1 : 0.07) * vel,
      musicBus,
      "music",
      "highpass",
      open ? 6500 : 8000,
      0.5,
    );
  }

  function commitScene(next: MusicScene) {
    scene = next;
    step = 0;
    patternIndex = 0;
    applyTone(next);
  }

  function playStep(when: number) {
    if (pending) {
      commitScene(pending);
      pending = null;
    }
    if (muted || !ctx) return;
    const chart = CHARTS[scene];
    const p = chart.patterns[patternIndex];
    const lead = p.lead[step];
    const bass = p.bass[step];
    const kick = p.kick[step];
    const snare = p.snare[step];
    const hat = p.hat[step];
    if (lead) playLead(lead, when);
    if (bass && musicAlive < MAX_MUSIC) playBass(bass, when);
    if (kick && musicAlive < MAX_MUSIC) playKick(when, kick);
    if (snare && musicAlive < MAX_MUSIC - 1) playSnare(when, snare);
    if (hat && musicAlive < MAX_MUSIC - 3) playHat(when, hat);
    if (scene === "finale" && step === 0 && musicIn) {
      startOsc("sine", midiHz(33), when, 1.7, 0.05, musicIn, "music", { attack: 0.02, release: 0.4 });
    }
  }

  function advance() {
    const chart = CHARTS[scene];
    nextStepTime += 60 / chart.bpm / 4;
    step += 1;
    if (step >= STEPS) {
      step = 0;
      patternIndex = (patternIndex + 1) % chart.patterns.length;
    }
  }

  function scheduler() {
    if (disposed || !running || !ctx) return;
    const now = ctx.currentTime;
    if (nextStepTime < now - 0.08) nextStepTime = now;
    while (nextStepTime < now + LOOKAHEAD) {
      playStep(nextStepTime);
      advance();
    }
    sched = setTimeout(scheduler, SCHED_MS);
  }

  function startTracker() {
    if (!ctx || running || disposed) return;
    running = true;
    nextStepTime = ctx.currentTime + 0.05;
    scheduler();
  }

  function stopTracker() {
    running = false;
    if (sched !== undefined) {
      clearTimeout(sched);
      sched = undefined;
    }
  }

  function resume() {
    if (disposed || !ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    if (running) nextStepTime = ctx.currentTime + 0.04;
    else startTracker();
  }

  function unlock() {
    if (disposed) return;
    ensure();
    resume();
  }

  function sfxPush(sources: AudioScheduledSourceNode[]) {
    if (sources.length === 0) return;
    sfxGroups.push(sources);
    while (sfxGroups.length > MAX_SFX) {
      const old = sfxGroups.shift();
      if (!old) break;
      for (const s of old) {
        try {
          s.stop();
        } catch {
          /* already stopped */
        }
      }
    }
  }

  function sfx(name: SfxName, opts?: { rate?: number }) {
    if (disposed || muted) return;
    const ac = ctx;
    if (!ac || !sfxBus) return;
    const when = ac.currentTime + 0.002;
    const rate = (opts?.rate ?? 1) * (1 + (Math.random() * 2 - 1) * 0.08);
    const dest = sfxBus;
    const group: AudioScheduledSourceNode[] = [];
    const grab = (node: AudioScheduledSourceNode | null) => {
      if (node) group.push(node);
    };

    if (name === "punch") {
      grab(startOsc("sine", 118 * rate, when, 0.09, 0.42, dest, "sfx", { freqEnd: 48 * rate, attack: 0.002, release: 0.03 }));
      grab(startOsc("square", 920 * rate, when, 0.018, 0.09, dest, "sfx", { attack: 0.001, release: 0.006 }));
      grab(startNoise(when, 0.02, 0.08, dest, "sfx", "bandpass", 1400 * rate, 1.1, undefined, rate));
    } else if (name === "punchHit") {
      grab(startNoise(when, 0.06, 0.32, dest, "sfx", "highpass", 900 * rate, 0.7, 2400 * rate, rate));
      grab(startOsc("triangle", 240 * rate, when, 0.09, 0.22, dest, "sfx", { freqEnd: 90 * rate, attack: 0.002, release: 0.03 }));
      grab(startOsc("sine", 84 * rate, when, 0.12, 0.28, dest, "sfx", { freqEnd: 42 * rate, attack: 0.002, release: 0.04 }));
    } else if (name === "block") {
      grab(startOsc("square", 1480 * rate, when, 0.05, 0.12, dest, "sfx", { attack: 0.001, release: 0.016 }));
      grab(startOsc("square", 2210 * rate, when + 0.006, 0.04, 0.08, dest, "sfx", { attack: 0.001, release: 0.014 }));
      grab(startNoise(when, 0.04, 0.12, dest, "sfx", "bandpass", 2600 * rate, 1.4, undefined, rate));
    } else if (name === "dodge") {
      grab(startNoise(when, 0.09, 0.16, dest, "sfx", "bandpass", 420 * rate, 0.8, 2200 * rate, rate));
    } else if (name === "hurt") {
      grab(startOsc("sawtooth", 190 * rate, when, 0.16, 0.16, dest, "sfx", { freqEnd: 70 * rate, attack: 0.003, release: 0.05 }));
      grab(startNoise(when, 0.12, 0.22, dest, "sfx", "lowpass", 900 * rate, 0.7, 300 * rate, rate));
      grab(startOsc("sine", 70 * rate, when, 0.14, 0.28, dest, "sfx", { freqEnd: 36 * rate, attack: 0.002, release: 0.045 }));
    } else if (name === "whoosh") {
      grab(startNoise(when, 0.13, 0.18, dest, "sfx", "bandpass", 280 * rate, 0.9, 1900 * rate, rate));
    } else if (name === "stun") {
      grab(startOsc("sine", 392 * rate, when, 0.38, 0.14, dest, "sfx", { attack: 0.004, release: 0.12 }));
      grab(startOsc("sine", 311 * rate, when, 0.42, 0.11, dest, "sfx", { detune: 18, attack: 0.006, release: 0.14 }));
      grab(startOsc("triangle", 523 * rate, when, 0.22, 0.06, dest, "sfx", { freqEnd: 262 * rate, attack: 0.008, release: 0.08 }));
    } else if (name === "ko") {
      grab(startOsc("sine", 90 * rate, when, 0.42, 0.55, dest, "sfx", { freqEnd: 28 * rate, attack: 0.003, release: 0.12 }));
      grab(startOsc("square", 48 * rate, when, 0.22, 0.12, dest, "sfx", { attack: 0.002, release: 0.07 }));
      grab(startNoise(when, 0.28, 0.3, dest, "sfx", "lowpass", 1400 * rate, 0.6, 220 * rate, rate));
    } else if (name === "grab") {
      grab(startOsc("sine", 96 * rate, when, 0.12, 0.32, dest, "sfx", { freqEnd: 50 * rate, attack: 0.003, release: 0.04 }));
      grab(startNoise(when, 0.1, 0.16, dest, "sfx", "bandpass", 700 * rate, 1.1, 400 * rate, rate));
    } else if (name === "mash") {
      grab(startOsc("square", 520 * rate, when, 0.05, 0.1, dest, "sfx", { freqEnd: 820 * rate, attack: 0.002, release: 0.016 }));
      grab(startOsc("sine", 780 * rate, when, 0.04, 0.06, dest, "sfx", { freqEnd: 1100 * rate, attack: 0.002, release: 0.012 }));
    } else if (name === "impact") {
      grab(startOsc("sine", 70 * rate, when, 0.28, 0.5, dest, "sfx", { freqEnd: 32 * rate, attack: 0.002, release: 0.08 }));
      grab(startOsc("triangle", 140 * rate, when, 0.14, 0.16, dest, "sfx", { freqEnd: 60 * rate, attack: 0.002, release: 0.04 }));
      grab(startNoise(when, 0.16, 0.28, dest, "sfx", "bandpass", 1100 * rate, 0.8, 400 * rate, rate));
    } else if (name === "projectile") {
      grab(startOsc("sine", 1280 * rate, when, 0.12, 0.1, dest, "sfx", { freqEnd: 420 * rate, attack: 0.004, release: 0.04 }));
      grab(startNoise(when, 0.08, 0.08, dest, "sfx", "bandpass", 1800 * rate, 1.2, 600 * rate, rate));
    } else if (name === "ui") {
      grab(startOsc("triangle", 880 * rate, when, 0.06, 0.08, dest, "sfx", { attack: 0.002, release: 0.02 }));
      grab(startOsc("sine", 1320 * rate, when + 0.03, 0.05, 0.05, dest, "sfx", { attack: 0.002, release: 0.018 }));
    } else if (name === "bell") {
      grab(startOsc("sine", 1568 * rate, when, 1.35, 0.18, dest, "sfx", { attack: 0.002, release: 0.32 }));
      grab(startOsc("sine", 2349 * rate, when, 1.15, 0.11, dest, "sfx", { attack: 0.002, release: 0.28 }));
    }

    sfxPush(group);
  }

  function setScene(next: MusicScene) {
    if (disposed) return;
    if (next === scene && pending === null) return;
    pending = next;
    if (!ctx) scene = next;
  }

  function setMuted(next: boolean) {
    muted = next;
    applyMaster();
  }

  function setVolumes(masterV: number, musicV: number, sfxV: number) {
    masterVol = clamp01(masterV);
    musicVol = clamp01(musicV);
    sfxVol = clamp01(sfxV);
    applyMaster();
    applyMix();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    stopTracker();
    for (const group of sfxGroups) {
      for (const s of group) {
        try {
          s.stop();
        } catch {
          /* already stopped */
        }
      }
    }
    sfxGroups.length = 0;
    if (typeof document !== "undefined") {
      for (const [type, fn] of listeners) {
        document.removeEventListener(type, fn);
        window.removeEventListener(type, fn);
      }
    }
    listeners.length = 0;
    if (ctx) {
      const ac = ctx;
      ctx = null;
      try {
        musicIn?.disconnect();
        musicFilter?.disconnect();
        musicShaper?.disconnect();
        musicBus?.disconnect();
        sfxBus?.disconnect();
        master?.disconnect();
      } catch {
        /* graph already torn down */
      }
      void ac.close();
    }
    master = null;
    musicBus = null;
    sfxBus = null;
    musicIn = null;
    musicFilter = null;
    musicShaper = null;
    noise = null;
  }

  if (typeof document !== "undefined") {
    const onVis = () => {
      if (document.visibilityState === "visible") resume();
    };
    on(document, "visibilitychange", onVis);
    on(window, "focus", () => resume());
    on(window, "pageshow", () => resume());
  }

  return {
    unlock,
    resume,
    setScene,
    sfx,
    setMuted,
    setVolumes,
    getMuted: () => muted,
    dispose,
  };
}
