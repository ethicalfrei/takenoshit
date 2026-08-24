import { Pause } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createAudio, type GameAudio, type MusicScene } from "@/game/day-audio";
import { loadAssets, FATALITY_VID, type SpriteBook } from "@/game/assets";
import { FightSim, type HudState, type Phase } from "@/game/combat";
import { INTERLUDES, TITLE, HOW_TO, PAUSE, VICTORY, DEFEAT, ENDING, CREDITS_TAG, DAY_SONG_CAPTIONS, CONTROLS_HINT, type Interlude } from "@/game/content/story";
import { GameInput } from "@/game/input";
import { drawFrame } from "@/game/renderer";
import { loadSave, saveHigh } from "@/game/save";

function musicFor(phase: Phase, id: string): MusicScene {
  if (phase === "title" || phase === "howto") return "title";
  if (phase === "interlude") return `${id}V` as MusicScene;
  if (phase === "fight" || phase === "countdown" || phase === "finisher") return id as MusicScene;
  return "title";
}

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<FightSim | null>(null);
  const audioRef = useRef<GameAudio | null>(null);
  const assetsRef = useRef<SpriteBook | null>(null);
  const inputRef = useRef<GameInput | null>(null);
  const rafRef = useRef(0);
  const [assetsReady, setAssetsReady] = useState(false);
  const [hud, setHud] = useState<HudState>(() => ({
    phase: "title",
    bossIndex: 0,
    boss: null as any,
    playerHp: 100,
    bossHp: 100,
    stars: 0,
    score: 0,
    highScore: 0,
    walkT: 0,
    line: "",
    mash: null,
    time: 0,
  }));
  const [caption, setCaption] = useState("");
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let dead = false;
    (async () => {
      const assets = await loadAssets();
      if (dead) return;
      assetsRef.current = assets;
      setAssetsReady(true);
      const save = loadSave();
      const sim = new FightSim(save.highScore);
      simRef.current = sim;
      setHud(sim.hud());
      const audio = createAudio();
      audioRef.current = audio;
      const input = new GameInput(canvasRef.current!);
      inputRef.current = input;

      let last = performance.now();
      const loop = (now: number) => {
        if (dead) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const sim = simRef.current;
        const assets = assetsRef.current;
        const canvas = canvasRef.current;
        if (!sim || !assets || !canvas) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        if (!paused) {
          const next = sim.tick(dt, input.consume());
          if (next.phase === "interlude") {
            // keep walking
          }
          if (next.phase === "interlude" && next.walkT > 22) {
            sim.toFight();
          }
          setHud(sim.hud());
          const scene = musicFor(next.phase, next.boss?.id ?? "roommate");
          audio.setScene(scene);
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
          }
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          drawFrame(ctx, w, h, sim.view(), assets);
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    })();
    return () => {
      dead = true;
      cancelAnimationFrame(rafRef.current);
      audioRef.current?.dispose();
    };
  }, [paused]);

  const start = () => {
    simRef.current?.start();
    audioRef.current?.unlock();
  };
  const toFight = () => simRef.current?.toFight();
  const interlude: Interlude = INTERLUDES[hud.bossIndex] ?? INTERLUDES[0];

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-ink text-cream">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
      {hud.phase === "title" && <TitleOverlay highScore={hud.highScore} ready={assetsReady} onStart={start} caption={caption} />}
      {hud.phase === "howto" && <HowToOverlay onStart={start} />}
      {hud.phase === "interlude" && (
        <InterludeOverlay data={interlude} walkT={hud.walkT} onFight={toFight} />
      )}
      {(hud.phase === "fight" || hud.phase === "countdown") && <FightHud hud={hud} onPause={() => setPaused(true)} />}
      {hud.phase === "finisher" && hud.mash && (
        <FinisherOverlay mash={hud.mash} line={hud.line} />
      )}
      {hud.phase === "victory" && (
        <EndOverlay copy={VICTORY} score={hud.score} onCta={() => {
            simRef.current!.phase = "title";
            setHud(simRef.current!.hud());
          }} />
      )}
      {hud.phase === "defeat" && (
        <EndOverlay copy={DEFEAT} score={hud.score} onCta={() => {
            simRef.current!.retry();
            setHud(simRef.current!.hud());
          }} />
      )}
      {hud.phase === "ending" && (
        <EndOverlay copy={ENDING} score={hud.score} onCta={() => {
            simRef.current!.phase = "title";
            setHud(simRef.current!.hud());
          }} />
      )}
      {paused && (
        <PauseOverlay
          muted={muted}
          onResume={() => setPaused(false)}
          onMute={() => {
            setMuted((m) => !m);
            audioRef.current?.setMuted(!muted);
          }}
          onRetry={() => {
            simRef.current?.retry();
            setPaused(false);
            setHud(simRef.current!.hud());
          }}
          onQuit={() => {
            simRef.current!.phase = "title";
            setPaused(false);
            setHud(simRef.current!.hud());
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
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-16 pointer-events-none">
      <div className="pointer-events-auto flex w-full max-w-sm flex-col items-center px-6">
        <p className="font-sans text-xs tracking-[0.22em] text-cream-dim uppercase">A day of boss fights</p>
        <h1 className="mt-2 font-display text-6xl leading-none tracking-tight text-cream drop-shadow-[0_2px_12px_rgba(20,14,12,0.9)]">
          {TITLE.title}
        </h1>
        <p className="mt-3 text-center text-sm text-cream-dim">{TITLE.body}</p>
        {highScore > 0 && (
          <p className="mt-2 text-xs uppercase tracking-widest text-cream-dim">Best {highScore}</p>
        )}
        <button
          type="button"
          disabled={!ready}
          onClick={onStart}
          className="mt-8 h-14 w-full rounded-xl bg-cream text-lg font-semibold text-ink disabled:opacity-40"
        >
          {ready ? TITLE.cta : "Loading…"}
        </button>
      </div>
    </div>
  );
}

function HowToOverlay({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-ink/80 px-6">
      <h2 className="font-display text-5xl tracking-tight text-cream">{HOW_TO.title}</h2>
      <ul className="mt-6 w-full max-w-sm space-y-4">
        {HOW_TO.steps.map((s) => (
          <li key={s.label}>
            <p className="font-semibold text-cream">{s.label}</p>
            <p className="text-sm text-cream-dim">{s.detail}</p>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onStart} className="mt-10 h-12 w-full max-w-sm rounded-xl bg-cream font-semibold text-ink">
        Got it
      </button>
    </div>
  );
}

function InterludeOverlay({ data, walkT, onFight }: { data: Interlude; walkT: number; onFight: () => void }) {
  const shown = Math.min(data.narrator.length, 1 + Math.floor(walkT / 1.15));
  const showQ = walkT > data.narrator.length * 1.15 + 0.3;
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end pointer-events-none">
      <div className="bg-gradient-to-t from-ink via-ink/90 to-transparent px-5 pb-10 pt-24">
        <p className="text-xs uppercase tracking-[0.2em] text-cream-dim">{data.clock} · {data.place}</p>
        <div className="mt-3 space-y-2">
          {data.narrator.slice(0, shown).map((line) => (
            <p key={line} className="max-w-[22rem] text-pretty text-base leading-snug text-cream drop-shadow-[0_1px_6px_rgba(20,14,12,0.85)]">
              {line}
            </p>
          ))}
        </div>
        {showQ && (
          <div className="mt-5 pointer-events-auto">
            <p className="font-display text-2xl text-cream">{data.question}</p>
            <p className="mt-1 text-sm text-cream-dim">{data.answer}</p>
            <button type="button" onClick={onFight} className="mt-4 h-12 rounded-xl bg-cream px-6 font-semibold text-ink">
              {data.sting}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FightHud({ hud, onPause }: { hud: HudState; onPause: () => void }) {
  return (
    <div className="absolute inset-x-0 top-0 z-10 px-4 pt-4 pointer-events-none">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-cream-dim">{hud.boss?.clock}</p>
          <p className="font-display text-2xl leading-none text-cream">{hud.boss?.name}</p>
          <p className="mt-2 text-center font-display text-xl leading-none tracking-wide text-cream">{hud.boss?.subtitle}</p>
        </div>
        <button type="button" onClick={onPause} className="pointer-events-auto rounded-lg bg-ink/50 p-2 text-cream">
          <Pause className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Bar label="YOU" value={hud.playerHp} max={100} color="#f3ebe1" />
        <Bar label="THEM" value={hud.bossHp} max={hud.boss?.hp ?? 100} color={hud.boss?.palette.glow ?? "#c44536"} />
      </div>
      <div className="mt-2 flex justify-center gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${i < hud.stars ? "bg-cream" : "bg-cream/20"}`} />
        ))}
      </div>
      {hud.line && (
        <p className="mx-auto mt-3 max-w-[22rem] text-balance text-center text-sm text-cream-dim">{hud.line}</p>
      )}
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="flex-1">
      <p className="text-[10px] uppercase tracking-wider text-cream-dim">{label}</p>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/60">
        <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function FinisherOverlay({ mash, line }: { mash: { count: number; goal: number }; line: string }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-ink/40">
      <p className="font-display text-4xl text-cream drop-shadow">{line || "MASH"}</p>
      <p className="mt-2 text-sm text-cream-dim">{mash.count} / {mash.goal}</p>
    </div>
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
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-ink/90 px-6">
      <h2 className="font-display text-5xl text-cream">{PAUSE.title}</h2>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <button type="button" onClick={onResume} className="h-12 rounded-xl bg-cream font-semibold text-ink">{PAUSE.resume}</button>
        <button type="button" onClick={onMute} className="h-12 rounded-xl border border-cream/30 font-semibold text-cream">
          {muted ? PAUSE.unmute : PAUSE.mute}
        </button>
        <button type="button" onClick={onRetry} className="h-12 rounded-xl border border-cream/30 font-semibold text-cream">{PAUSE.retry}</button>
        <button type="button" onClick={onQuit} className="h-12 rounded-xl border border-cream/30 font-semibold text-cream">{PAUSE.quit}</button>
      </div>
    </div>
  );
}

function EndOverlay({
  copy,
  score,
  onCta,
}: {
  copy: { title: string; body: string; cta: string };
  score: number;
  onCta: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-ink/90 px-6">
      <h2 className="font-display text-6xl leading-[0.9] text-cream">{copy.title}</h2>
      <p className="mt-4 max-w-[22rem] text-pretty text-base text-cream-dim">{copy.body}</p>
      <p className="mt-6 font-display text-3xl text-cream">{score}</p>
      <button type="button" onClick={onCta} className="mt-8 h-14 w-full max-w-sm rounded-xl bg-cream text-lg font-semibold text-ink">
        {copy.cta}
      </button>
    </div>
  );
}
