export type ActionName =
  | "dodgeL"
  | "dodgeR"
  | "duck"
  | "punchL"
  | "punchR"
  | "grab"
  | "pause";

export type FrameInput = {
  dodgeL: boolean;
  dodgeR: boolean;
  duck: boolean;
  punchL: boolean;
  punchR: boolean;
  grab: boolean;
  mash: boolean;
  mashCount: number;
  pause: boolean;
  dodgeLPressed: boolean;
  dodgeRPressed: boolean;
  duckPressed: boolean;
  punchLPressed: boolean;
  punchRPressed: boolean;
  grabPressed: boolean;
  pausePressed: boolean;
};

export type GestureMode = "idle" | "fight" | "grab" | "mash";

const KEY_MAP: Record<string, ActionName> = {
  KeyA: "dodgeL",
  ArrowLeft: "dodgeL",
  KeyD: "dodgeR",
  ArrowRight: "dodgeR",
  KeyS: "duck",
  ArrowDown: "duck",
  KeyJ: "punchL",
  KeyZ: "punchL",
  Digit1: "punchL",
  Numpad1: "punchL",
  KeyK: "punchR",
  KeyX: "punchR",
  KeyF: "punchR",
  Digit2: "punchR",
  Numpad2: "punchR",
  KeyW: "grab",
  ArrowUp: "grab",
  KeyC: "grab",
  KeyG: "grab",
  Space: "grab",
  Enter: "punchR",
  NumpadEnter: "punchR",
  Escape: "pause",
  KeyP: "pause",
};

const SWIPE_PX = 36;

type Stroke = { x: number; y: number; t: number; action: ActionName | null };

export class GameInput {
  mode: GestureMode = "idle";
  private held = new Set<ActionName>();
  private pointers = new Map<number, ActionName>();
  private strokes = new Map<number, Stroke>();
  lastGesture: "swipeL" | "swipeR" | "swipeD" | "tapL" | "tapR" | "mash" | null = null;
  lastGestureAt = 0;
  private mashPulses = 0;
  private prev: Record<ActionName, boolean> = {
    dodgeL: false,
    dodgeR: false,
    duck: false,
    punchL: false,
    punchR: false,
    grab: false,
    pause: false,
  };
  private buffer: { action: ActionName; until: number }[] = [];
  private punchToggle = false;
  now = 0;

  attach() {
    window.addEventListener("keydown", this.onKeyDown, { capture: true });
    window.addEventListener("keyup", this.onKeyUp, { capture: true });
    window.addEventListener("blur", this.clear);
    document.addEventListener("visibilitychange", this.onVis);
  }

  detach() {
    window.removeEventListener("keydown", this.onKeyDown, true);
    window.removeEventListener("keyup", this.onKeyUp, true);
    window.removeEventListener("blur", this.clear);
    document.removeEventListener("visibilitychange", this.onVis);
    this.clear();
  }

  touchDown(action: ActionName, pointerId: number) {
    this.pointers.set(pointerId, action);
    this.held.add(action);
    this.buffer.push({ action, until: this.now + 0.16 });
  }

  touchUp(pointerId: number) {
    const action = this.pointers.get(pointerId);
    this.pointers.delete(pointerId);
    if (!action) return;
    let still = false;
    for (const a of this.pointers.values()) if (a === action) still = true;
    if (!still) this.held.delete(action);
  }

  gestureStart(id: number, x: number, y: number) {
    this.strokes.set(id, { x, y, t: this.now, action: null });
    if (this.mode === "mash") {
      this.mashPulses += 1;
      this.lastGesture = "mash";
      this.lastGestureAt = this.now;
    }
  }

  gestureMove(id: number, x: number, y: number) {
    const s = this.strokes.get(id);
    if (!s || s.action || this.mode === "mash") return;
    const dx = x - s.x;
    const dy = y - s.y;
    if (Math.hypot(dx, dy) < SWIPE_PX) return;
    if (Math.abs(dx) > Math.abs(dy) * 0.85) {
      s.action = dx < 0 ? "dodgeL" : "dodgeR";
      this.lastGesture = dx < 0 ? "swipeL" : "swipeR";
    } else if (dy > 0) {
      s.action = "duck";
      this.lastGesture = "swipeD";
    } else {
      s.action = "grab";
    }
    this.lastGestureAt = this.now;
    this.touchDown(s.action, id);
  }

  gestureEnd(id: number, x: number, width: number) {
    const s = this.strokes.get(id);
    this.strokes.delete(id);
    if (!s) {
      this.touchUp(id);
      return;
    }
    if (s.action) {
      this.touchUp(id);
      return;
    }
    if (this.mode === "mash") {
      this.touchUp(id);
      return;
    }
    const dt = this.now - s.t;
    if (dt > 0.42) {
      this.touchUp(id);
      return;
    }
    if (this.mode === "grab") {
      this.fire("grab");
      this.lastGesture = "mash";
    } else {
      const left = x < width * 0.5;
      this.fire(left ? "punchL" : "punchR");
      this.lastGesture = left ? "tapL" : "tapR";
    }
    this.lastGestureAt = this.now;
    this.touchUp(id);
  }

  sample(now: number): FrameInput {
    this.now = now;
    this.buffer = this.buffer.filter((b) => b.until >= now);
    const live = (a: ActionName) => this.held.has(a) || this.buffer.some((b) => b.action === a);
    const pressed = (a: ActionName) => live(a) && !this.prev[a];
    const mashCount = this.mashPulses;
    this.mashPulses = 0;
    const frame: FrameInput = {
      dodgeL: live("dodgeL"),
      dodgeR: live("dodgeR"),
      duck: live("duck"),
      punchL: live("punchL"),
      punchR: live("punchR"),
      grab: live("grab"),
      mash: mashCount > 0 || pressed("grab") || pressed("punchL") || pressed("punchR"),
      mashCount,
      pause: live("pause"),
      dodgeLPressed: pressed("dodgeL"),
      dodgeRPressed: pressed("dodgeR"),
      duckPressed: pressed("duck"),
      punchLPressed: pressed("punchL"),
      punchRPressed: pressed("punchR"),
      grabPressed: pressed("grab"),
      pausePressed: pressed("pause"),
    };
    this.prev = {
      dodgeL: frame.dodgeL,
      dodgeR: frame.dodgeR,
      duck: frame.duck,
      punchL: frame.punchL,
      punchR: frame.punchR,
      grab: frame.grab,
      pause: frame.pause,
    };
    return frame;
  }

  private fire(action: ActionName) {
    this.held.add(action);
    this.buffer.push({ action, until: this.now + 0.16 });
    window.setTimeout(() => this.held.delete(action), 90);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    let action = KEY_MAP[e.code];
    if (e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter") {
      if (this.mode === "mash") action = "grab";
      else if (this.mode === "grab") action = "grab";
      else if (this.mode === "fight") {
        this.punchToggle = !this.punchToggle;
        action = this.punchToggle ? "punchL" : "punchR";
      } else {
        return;
      }
    }
    if (!action) return;
    e.preventDefault();
    e.stopPropagation();
    if (this.mode === "mash") {
      this.mashPulses += 1;
      this.lastGesture = "mash";
      this.lastGestureAt = this.now;
      return;
    }
    if (e.repeat) return;
    this.held.add(action);
    this.buffer.push({ action, until: this.now + 0.18 });
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter") {
      this.held.delete("punchL");
      this.held.delete("punchR");
      this.held.delete("grab");
      return;
    }
    const action = KEY_MAP[e.code];
    if (!action) return;
    this.held.delete(action);
  };

  private onVis = () => {
    if (document.visibilityState !== "visible") this.clear();
  };

  private clear = () => {
    this.held.clear();
    this.pointers.clear();
    this.strokes.clear();
  };
}
