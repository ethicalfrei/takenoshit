import { Pause } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createAudio, type GameAudio, type MusicScene } from "@/game/day-audio";
import { loadAssets, FATALITY_VID, type SpriteBook } from "@/game/assets";
import { FightSim, type HudState, type Phase } from "@/game/combat";
import { INTERLUDES, TITLE, HOW_TO, PAUSE, VICTORY, DEFEAT, CREDITS_TAG, DAY_SONG_CAPTIONS, CONTROLS_HINT, type Interlude } from "@/game/content/story";
import { GameInput } from "@/game/input";
import { drawFrame } from "@/game/renderer";
import { loadSave, writeSave } from "@/game/save";
import { PLAYER_MAX_HP } from "@/game/content/roster";

function sceneFor(phase: Phase, bossId: string): MusicScene {
  if (phase === "title" || phase === "howto") return "title";
  if (phase === "victory") return "victory";
  if (phase === "defeat") return "defeat";
  const bosses = ["roommate", "leaf", "baker", "barista", "manager", "gym", "boss"] as const;
  const id = bosses.find((b) => b === bossId);
  if (!id) return "walk";
  if (phase === "interlude") return `${id}V`;
  if (phase === "finisher") return `${id}F`;
  return id;
}

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef(new FightSim());
  const inputRef = useRef(new GameInput());
  const audioRef = useRef<GameAudio | null>(null);
  const assetsRef = useRef<SpriteBook | null>(null);
  const [hud, setHud] = useState<HudState>(() => simRef.current.hud());
  const [assetsReady, setAssetsReady] = useState(false);
  const [caption, setCaption] = useState(DAY_SONG_CAPTIONS[0].line);

  useEffect(() => {
    const save = loadSave();
    simRef.current.highScore = save.highScore;
    simRef.current.muted = save.muted;
    audioRef.current = createAudio();
    if (save.muted) audioRef.current.setMuted(true);
    const input = inputRef.current;
    input.attach();
    let alive = true;
    loadAssets()
      .then((a) => {
        if (!alive) return;
        assetsRef.current = a;
        setAssetsReady(true);
      })
      .catch(() => {
        if (alive) setAssetsReady(true);
      });
    return () => {
      alive = false;
      input.detach();
      audioRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sim = simRef.current;
    const input = inputRef.current;
    sim.onSfx = (name, opts) => audioRef.current?.sfx(name, opts);
    sim.onVibrate = (ms) => {
      try {
        navigator.vibrate?.(ms);
      } catch {
        /* ignore */
      }
    };

    let raf = 0;
    let acc = 0;
    let last = performance.now();
    let hudAcc = 0;
    let lastScene: MusicScene | null = null;
    const STEP = 1 / 60;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const raw = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += raw;
      hudAcc += raw;
      const ph = sim.phase;
      if (ph === "finisher" && !sim.cinematic) input.mode = "mash";
      else if (ph === "fight" && sim.cue === "GRAB") input.mode = "grab";
      else if (ph === "fight" || ph === "countdown") input.mode = "fight";
      else input.mode = "idle";
      const frame = input.sample(now / 1000);
      while (acc >= STEP) {
        sim.update(STEP, frame);
        acc -= STEP;
      }
      const ctx = canvas.getContext("2d");
      const assets = assetsRef.current;
      if (ctx) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const box = canvas.getBoundingClientRect();
        const w = Math.max(1, Math.floor(box.width || window.innerWidth));
        const h = Math.max(1, Math.floor(box.height || window.innerHeight));
        if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
          canvas.width = Math.floor(w * dpr);
          canvas.height = Math.floor(h * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        if (assets) {
          drawFrame(ctx, w, h, sim.view(), assets);
        } else {
          ctx.fillStyle = "#140e0c";
          ctx.fillRect(0, 0, w, h);
        }
      }
      if (hudAcc > 0.08) {
        hudAcc = 0;
        const next = sim.hud();
        setHud(next);
        const sc = sceneFor(next.phase, next.boss.id);
        if (sc !== lastScene) {
          lastScene = sc;
          audioRef.current?.setScene(sc);
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCaption((c) => {
        const i = DAY_SONG_CAPTIONS.findIndex((x) => x.line === c);
        return DAY_SONG_CAPTIONS[(i + 1) % DAY_SONG_CAPTIONS.length].line;
      });
    }, 5200);
    return () => window.clearInterval(id);
  }, []);

  const persist = (partial: { highScore?: number; muted?: boolean }) => {
    const cur = loadSave();
    writeSave({
      version: 1,
      highScore: partial.highScore ?? simRef.current.highScore,
      bestDay: Math.max(cur.bestDay, simRef.current.bossIndex),
      muted: partial.muted ?? simRef.current.muted,
    });
  };

  const unlock = () => {
    audioRef.current?.unlock();
  };

  const start = () => {
    unlock();
    audioRef.current?.sfx("ui");
    simRef.current.startDay();
    setHud(simRef.current.hud());
  };

  const toFight = () => {
    unlock();
    audioRef.current?.sfx("ui");
    simRef.current.beginFight();
    setHud(simRef.current.hud());
  };

  const afterHowTo = () => {
    audioRef.current?.sfx("ui");
    simRef.current.enterInterlude();
    setHud(simRef.current.hud());
  };

  const toggleMute = () => {
    const next = !simRef.current.muted;
    simRef.current.muted = next;
    audioRef.current?.setMuted(next);
    persist({ muted: next });
    setHud(simRef.current.hud());
  };

  const interlude: Interlude = INTERLUDES[hud.bossIndex] ?? INTERLUDES[0];
  const showFightUi = hud.phase === "fight" || hud.phase === "countdown" || hud.phase === "finisher" || hud.phase === "ko";

  return (
    <div className="relative mx-auto h-dvh w-full max-w-[430px] overflow-hidden bg-ink text-cream">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 h-full w-full touch-none bg-ink"
        aria-label="Take No Shit fight arena"
      />

      {hud.phase === "title" && <TitleOverlay highScore={hud.highScore} ready={assetsReady} onStart={start} caption={caption} />}
      {hud.phase === "howto" && <HowToOverlay onNext={afterHowTo} />}
      {hud.phase === "interlude" && (
        <InterludeOverlay data={interlude} walkT={hud.walkT} onFight={toFight} />
      )}
      {hud.phase === "defeat" && (
        <EndOverlay
          copy={DEFEAT}
          score={hud.score}
          onCta={() => {
            simRef.current.retryFight();
            setHud(simRef.current.hud());
          }}
        />
      )}
      {hud.phase === "victory" && (
        <EndOverlay
          copy={VICTORY}
          score={hud.score}
          tag={CREDITS_TAG}
          onCta={() => {
            persist({ highScore: simRef.current.highScore });
            simRef.current.phase = "title";
            simRef.current.bossIndex = 0;
            setHud(simRef.current.hud());
          }}
        />
      )}

      {showFightUi && (
        <Hud
          hud={hud}
          onPause={() => {
            simRef.current.paused = true;
            setHud(simRef.current.hud());
          }}
        />
      )}

      {hud.mash && <MashOverlay mash={hud.mash} />}

      {hud.phase === "finisher" && (
        <FatalityStage
          id={hud.boss.id}
          progress={hud.mash ? hud.mash.count / hud.mash.goal : 1}
          playing={hud.finisherPlay}
        />
      )}

      {showFightUi && !hud.paused && hud.phase !== "ko" && (
        <GestureSurface input={inputRef.current} telegraph={hud.telegraphLane} grab={hud.cue === "GRAB" || Boolean(hud.mash)} />
      )}

      {hud.paused && (
        <PauseOverlay
          muted={hud.muted}
          onResume={() => {
            simRef.current.paused = false;
            setHud(simRef.current.hud());
          }}
          onMute={toggleMute}
          onRetry={() => {
            simRef.current.paused = false;
            simRef.current.retryFight();
            setHud(simRef.current.hud());
          }}
          onQuit={() => {
            simRef.current.paused = false;
            simRef.current.phase = "title";
            setHud(simRef.current.hud());
          }}
        />
      )}
    </div>
  );
}

function TitleOverlay({
  highScore,
  ready,
  onStart,
  caption,
}: {
  highScore: number;
  ready: boolean;
  onStart: () => void;
  caption: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col">
      <div className="px-6 pt-16">
        <p className="font-sans text-xs tracking-[0.22em] text-cream-dim uppercase">A day of boss fights</p>
        <h1 className="mt-3 font-display text-7xl leading-[0.82] tracking-tight text-cream drop-shadow-[0_2px_12px_rgba(20,14,12,0.85)]">
          TAKE
          <br />
          NO SHIT
        </h1>
        <p className="mt-5 max-w-[16rem] text-pretty text-base leading-snug text-cream-dim">{TITLE.body}</p>
      </div>
      <div className="pointer-events-auto mt-auto bg-ink/90 px-6 pb-10 pt-5">
        <p className="mb-5 text-sm text-steel">{caption}</p>
        <p className="mb-3 font-display text-xl tabular-nums tracking-wide text-cream-dim">BEST {highScore}</p>
        <button
          type="button"
          disabled={!ready}
          onClick={onStart}
          className="h-14 w-full rounded-xl bg-cream text-lg font-semibold text-ink hover:bg-cream-dim disabled:opacity-50"
        >
          {ready ? TITLE.cta : "Lacing gloves…"}
        </button>
        <p className="mt-3 text-center text-xs text-steel">Swipe to dodge · Tap a half to punch</p>
      </div>
    </div>
  );
}

function HowToOverlay({ onNext }: { onNext: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-ink/80 px-6 py-10">
      <h2 className="font-display text-5xl tracking-tight text-cream">{HOW_TO.title}</h2>
      <ol className="mt-8 flex flex-col gap-5">
        {HOW_TO.steps.map((s) => (
          <li key={s.label} className="grid grid-cols-[5.5rem_1fr] gap-3">
            <span className="font-display text-2xl leading-none text-brick">{s.label}</span>
            <span className="text-sm leading-snug text-cream-dim">{s.detail}</span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={onNext}
        className="mt-auto h-14 w-full rounded-xl bg-cream text-lg font-semibold text-ink"
      >
        Clock in
      </button>
    </div>
  );
}

function InterludeOverlay({ data, walkT, onFight }: { data: Interlude; walkT: number; onFight: () => void }) {
  const shown = Math.min(data.narrator.length, 1 + Math.floor(walkT / 1.35));
  const showQ = walkT > data.narrator.length * 1.35 + 0.4;
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end px-6 pb-10 pt-14">
      <p className="font-display text-4xl tabular-nums leading-none text-cream drop-shadow-[0_2px_8px_rgba(20,14,12,0.9)]">
        {data.clock}
      </p>
      <p className="mt-1 text-sm uppercase tracking-[0.18em] text-steel">{data.place}</p>
      <p className="mt-2 text-xs text-cream-dim">
        {data.from} → {data.to}
      </p>
      <div className="mt-6 flex flex-col gap-2.5">
        {data.narrator.slice(0, shown).map((line) => (
          <p key={line} className="max-w-[22rem] text-pretty text-base leading-snug text-cream drop-shadow-[0_1px_6px_rgba(20,14,12,0.85)]">
            {line}
          </p>
        ))}
      </div>
      {showQ && (
        <div className="mt-6">
          <p className="text-base text-cream-dim">{data.question}</p>
          <p className="mt-1 font-display text-3xl text-cream">{data.answer}</p>
          <p className="font-display text-4xl leading-none text-brick">{data.sting}</p>
        </div>
      )}
      <p className="mt-5 text-sm text-steel">{data.walkLine}</p>
      <button
        type="button"
        onClick={onFight}
        className="pointer-events-auto mt-6 h-14 w-full rounded-xl bg-brick text-lg font-semibold text-cream"
      >
        Take the fight
      </button>
    </div>
  );
}

function Hud({ hud, onPause }: { hud: HudState; onPause: () => void }) {
  const p = Math.max(0, hud.playerHp / PLAYER_MAX_HP);
  const b = Math.max(0, hud.bossHp / hud.boss.hp);
  const s = Math.min(1, Math.max(0, hud.stun));
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-lg leading-none text-cream">YOU</span>
            <span className="font-display text-lg tabular-nums leading-none text-cream-dim">{Math.ceil(hud.playerHp)}</span>
          </div>
          <Bar value={p} color="bg-hp" />
        </div>
        <button
          type="button"
          onClick={onPause}
          aria-label="Pause"
          className="pointer-events-auto mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-cream/15 bg-ink-2 text-cream"
        >
          <Pause className="size-4" strokeWidth={2.2} />
        </button>
        <div className="min-w-0 flex-1 text-right">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-lg tabular-nums leading-none text-cream-dim">{Math.ceil(hud.bossHp)}</span>
            <span className="truncate font-display text-lg leading-none text-cream">{hud.boss.name}</span>
          </div>
          <Bar value={b} color="bg-brick" flip />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="font-display text-sm tracking-[0.2em] text-stun">
          STARS {hud.stars}/3
        </p>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-3">
          <div className="h-full bg-stun" style={{ width: `${s * 100}%` }} />
        </div>
        <p className="font-display text-lg tabular-nums text-cream">
          {hud.combo > 1 ? `${hud.combo}x` : ""} {hud.score}
        </p>
      </div>
      <p className="mt-2 text-center font-display text-xl leading-none tracking-wide text-cream">{hud.boss.subtitle}</p>
      {hud.countdown !== null && (
        <p className="mt-6 text-center font-display text-7xl leading-none text-cream">
          {hud.countdown <= 0 ? "FIGHT" : hud.countdown}
        </p>
      )}
      {hud.line && hud.phase !== "finisher" && (
        <p className="mx-auto mt-3 max-w-[22rem] text-balance text-center text-sm text-cream-dim">{hud.line}</p>
      )}
      {hud.cue && hud.cue !== "GRAB" && (
        <p className="mt-1 text-center text-xs uppercase tracking-[0.2em] text-steel">{hud.cue}</p>
      )}
    </div>
  );
}

function Bar({ value, color, flip }: { value: number; color: string; flip?: boolean }) {
  return (
    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-ink-3">
      <div
        className={`h-full ${color} ${flip ? "ml-auto" : ""}`}
        style={{ width: `${Math.max(0.04, value) * 100}%` }}
      />
    </div>
  );
}

function MashOverlay({ mash }: { mash: NonNullable<HudState["mash"]> }) {
  const pct = Math.min(1, mash.count / mash.goal);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[12%] px-6 text-center">
      <p className="font-display text-4xl leading-[0.9] tracking-tight text-cream drop-shadow-[0_2px_10px_rgba(20,14,12,0.9)]">
        {mash.prompt}
      </p>
      <div className="mx-auto mt-4 h-3 w-full max-w-xs overflow-hidden rounded-full bg-ink-3">
        <div className="h-full bg-brick" style={{ width: `${pct * 100}%` }} />
      </div>
      <p className="mt-3 font-display text-5xl tracking-wide text-cream">TAP</p>
    </div>
  );
}

function FatalityStage({ id, progress, playing }: { id: string; progress: number; playing: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const src = FATALITY_VID[id];
  useEffect(() => {
    const v = ref.current;
    if (!v || !src) return;
    const kick = () => {
      void v.play().catch(() => {});
    };
    v.addEventListener("loadeddata", kick, { once: true });
    kick();
    return () => v.removeEventListener("loadeddata", kick);
  }, [src]);
  useEffect(() => {
    const v = ref.current;
    if (!v || !playing) return;
    try {
      v.currentTime = 0;
    } catch {
      /* ignore */
    }
    v.playbackRate = 1;
    void v.play().catch(() => {});
  }, [playing]);
  if (!src) return null;
  return (
    <video
      ref={ref}
      src={`${src}?v=fists3`}
      muted
      playsInline
      preload="auto"
      autoPlay
      className={
        "pointer-events-none absolute inset-0 z-[8] h-full w-full object-cover transition-opacity duration-200 " +
        (playing ? "opacity-100" : "opacity-0")
      }
    />
  );
}

function GestureSurface({
  input,
  telegraph,
  grab,
}: {
  input: GameInput;
  telegraph: HudState["telegraphLane"];
  grab: boolean;
}) {
  return (
    <div
      className="absolute inset-0 z-[5] touch-none"
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const r = e.currentTarget.getBoundingClientRect();
        input.gestureStart(e.pointerId, e.clientX - r.left, e.clientY - r.top);
        if (input.mode === "mash") {
          const v = document.querySelector("video");
          if (v) void (v as HTMLVideoElement).play().catch(() => {});
        }
      }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        input.gestureMove(e.pointerId, e.clientX - r.left, e.clientY - r.top);
      }}
      onPointerUp={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        input.gestureEnd(e.pointerId, e.clientX - r.left, r.width);
      }}
      onPointerCancel={(e) => input.gestureEnd(e.pointerId, 0, 1)}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-[max(0.6rem,env(safe-area-inset-bottom))] flex items-end justify-between px-5 text-cream/55">
        <Hint active={telegraph === "left"} label="← swipe" />
        <Hint active={telegraph === "high"} label="↓ duck" />
        <Hint active={telegraph === "right"} label="swipe →" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-14 flex justify-between px-8 text-[11px] font-semibold tracking-wide text-cream/40">
        <span className={grab ? "text-brick" : ""}>{grab ? "TAP TO GRAB" : "tap L"}</span>
        <span className="text-center text-cream/30">{CONTROLS_HINT.swipe}</span>
        <span className={grab ? "text-brick" : ""}>{grab ? "TAP TO GRAB" : "tap R"}</span>
      </div>
    </div>
  );
}

function Hint({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={
        "font-display text-2xl tracking-wide " + (active ? "scale-110 text-cream" : "text-cream/40")
      }
    >
      {label}
    </span>
  );
}

function PauseOverlay({
  muted,
  onResume,
  onMute,
  onRetry,
  onQuit,
}: {
  muted: boolean;
  onResume: () => void;
  onMute: () => void;
  onRetry: () => void;
  onQuit: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-end bg-ink/75 px-6 pb-10">
      <div className="w-full rounded-xl border border-cream/10 bg-ink-2 p-6">
        <h2 className="font-display text-5xl text-cream">{PAUSE.title}</h2>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" className="h-12 rounded-md bg-cream font-semibold text-ink" onClick={onResume}>
            {PAUSE.resume}
          </button>
          <button type="button" className="h-12 rounded-md border border-cream/15 text-cream" onClick={onMute}>
            {muted ? PAUSE.unmute : PAUSE.mute}
          </button>
          <button type="button" className="h-12 rounded-md border border-cream/15 text-cream" onClick={onRetry}>
            {PAUSE.retry}
          </button>
          <button type="button" className="h-12 rounded-md text-cream-dim" onClick={onQuit}>
            {PAUSE.quit}
          </button>
        </div>
      </div>
    </div>
  );
}

function EndOverlay({
  copy,
  score,
  tag,
  onCta,
}: {
  copy: { title: string; body: string; cta: string };
  score: number;
  tag?: string;
  onCta: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-ink/70 px-6 pb-10">
      <h2 className="font-display text-6xl leading-[0.9] text-cream">{copy.title}</h2>
      <p className="mt-4 max-w-[22rem] text-pretty text-base text-cream-dim">{copy.body}</p>
      {tag && <p className="mt-3 text-sm text-steel">{tag}</p>}
      <p className="mt-6 font-display text-3xl tabular-nums text-cream">{score}</p>
      <button type="button" onClick={onCta} className="mt-8 h-14 w-full rounded-xl bg-cream text-lg font-semibold text-ink">
        {copy.cta}
      </button>
    </div>
  );
}
