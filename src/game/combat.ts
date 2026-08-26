import { PLAYER_MAX_HP, ROSTER, STAR_HITS_FOR_STUN, type AttackPattern, type BossDef, type Guard, type Lane } from "./content/roster";
import { fatalityHold, introAt, introHold, verseDuration } from "./music-timing";
import type { FrameInput } from "./input";
import { Juice } from "./juice";
import type { SfxName } from "./day-audio";

export type Phase =
  | "title"
  | "howto"
  | "interlude"
  | "countdown"
  | "fight"
  | "finisher"
  | "ko"
  | "defeat"
  | "victory"
  | "ending";

export type PlayerPose = "idle" | "punch" | "dodgeL" | "dodgeR" | "duck" | "hurt" | "grab";
export type BossPose = "idle" | "attack" | "hurt" | "stun" | "ko";

export type Projectile = {
  kind: string;
  lane: Lane;
  t: number;
  life: number;
  damage: number;
};

export type Cinematic = { kind: "finisher"; t: number; id: BossDef["id"] };

export type HudState = {
  phase: Phase;
  paused: boolean;
  boss: BossDef;
  bossIndex: number;
  playerHp: number;
  bossHp: number;
  stun: number;
  stars: number;
  combo: number;
  score: number;
  highScore: number;
  line: string;
  cue: string;
  telegraphLane: Lane | null;
  countdown: number | null;
  mash: { count: number; goal: number; t: number; prompt: string } | null;
  muted: boolean;
  caption: string;
  walkT: number;
  punchSide: "L" | "R" | null;
  punchVariant: 0 | 1;
  finisherPlay: boolean;
  endingT: number;
  walkDuration: number;
  introAt: number;
  showIntro: boolean;
};

export type ViewModel = HudState & {
  playerPose: PlayerPose;
  bossPose: BossPose;
  playerX: number;
  playerSquash: number;
  bossX: number;
  bossRot: number;
  bossScaleX: number;
  bossScaleY: number;
  guard: Guard;
  projectiles: Projectile[];
  cinematic: Cinematic | null;
  time: number;
  juice: Juice;
  intro: string;
};

type BossAI =
  | { kind: "idle"; t: number }
  | { kind: "telegraph"; t: number; pattern: AttackPattern }
  | { kind: "attack"; t: number; pattern: AttackPattern; connected: boolean }
  | { kind: "recover"; t: number; pattern: AttackPattern }
  | { kind: "hurt"; t: number }
  | { kind: "stunned"; t: number };

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isSafe(lane: Lane, pose: PlayerPose) {
  if (pose === "hurt") return false;
  if (lane === "high") return pose === "duck";
  if (lane === "left") return pose === "dodgeL";
  if (lane === "right") return pose === "dodgeR";
  return pose === "dodgeL" || pose === "dodgeR" || pose === "duck";
}

export class FightSim {
  phase: Phase = "title";
  paused = false;
  bossIndex = 0;
  playerHp = PLAYER_MAX_HP;
  bossHp = ROSTER[0].hp;
  stun = 0;
  stars = 0;
  combo = 0;
  score = 0;
  highScore = 0;
  line = "";
  cue = "";
  caption = "";
  muted = false;
  time = 0;
  juice = new Juice();
  cinematic: Cinematic | null = null;
  mash = { count: 0, goal: 12, t: 0, prompt: "" };
  walkT = 0;
  verseEnded = false;

  playerPose: PlayerPose = "idle";
  playerPoseT = 0;
  playerX = 0;
  invuln = 0;
  punchSide: "L" | "R" | null = null;
  punchVariant: 0 | 1 = 0;
  starPunch = false;

  bossPose: BossPose = "idle";
  bossX = 0;
  bossRot = 0;
  bossScaleX = 1;
  bossScaleY = 1;
  guard: Guard = "left";
  guardT = 0;
  ai: BossAI = { kind: "idle", t: 0.4 };
  lastPattern = "";
  tauntT = 0;
  countdown = 3;
  countdownT = 0;
  koT = 0;
  projectiles: Projectile[] = [];
  perfectDodge = false;
  dodgedThisAttack = false;
  hitsThisWindow = 0;
  stunCycles = 0;
  beatT = 0;
  beatIndex = 0;

  onSfx: (name: SfxName, opts?: { rate?: number }) => void = () => {};
  onVibrate: (ms: number) => void = () => {};

  get boss(): BossDef {
    return ROSTER[this.bossIndex];
  }

  startDay() {
    this.bossIndex = 0;
    this.score = 0;
    this.combo = 0;
    this.phase = "howto";
  }

  enterInterlude() {
    this.phase = "interlude";
    this.playerHp = PLAYER_MAX_HP;
    this.walkT = 0;
    this.verseEnded = false;
    this.resetFight();
  }

  beginFight() {
    this.resetFight();
    this.phase = "countdown";
    this.countdown = this.boss.id === "cops" ? 1 : 3;
    this.countdownT = 0;
    this.line = this.boss.introLine;
    this.onSfx("bell");
  }

  retryFight() {
    this.playerHp = PLAYER_MAX_HP;
    this.resetFight();
    this.beginFight();
  }

  private resetFight() {
    this.bossHp = this.boss.hp;
    this.stun = 0;
    this.stars = 0;
    this.combo = 0;
    this.playerPose = "idle";
    this.playerPoseT = 0;
    this.playerX = 0;
    this.invuln = 0;
    this.bossPose = "idle";
    this.bossX = 0;
    this.bossRot = 0;
    this.bossScaleX = 1;
    this.bossScaleY = 1;
    this.guard = "left";
    this.guardT = 0;
    this.ai = { kind: "idle", t: 0.55 };
    this.projectiles = [];
    this.cinematic = null;
    this.perfectDodge = false;
    this.dodgedThisAttack = false;
    this.starPunch = false;
    this.hitsThisWindow = 0;
    this.stunCycles = 0;
    this.beatT = 0;
    this.beatIndex = 0;
    this.cue = "";
    this.juice.trauma = 0;
    this.juice.hitstop = 0;
  }

  update(dt: number, input: FrameInput) {
    this.time += dt;
    if (input.pausePressed && (this.phase === "fight" || this.phase === "countdown" || this.phase === "finisher")) {
      this.paused = !this.paused;
    }
    if (this.paused) return;

    if (this.phase === "interlude") {
      this.walkT += dt;
      this.juice.update(dt);
      const ready = this.walkT >= introHold(this.boss.id);
      const verseDone = this.verseEnded || this.walkT >= verseDuration(this.boss.id);
      if (ready && verseDone) this.beginFight();
      return;
    }

    if (this.phase === "countdown") {
      this.animateIdle(dt);
      this.countdownT += dt;
      if (this.countdownT >= 0.7) {
        this.countdownT = 0;
        this.countdown -= 1;
        if (this.countdown < 0) {
          this.phase = "fight";
          this.line = this.boss.introLine;
        } else if (this.countdown === 0) {
          this.onSfx("bell");
        } else {
          this.onSfx("ui");
        }
      }
      return;
    }

    if (this.phase === "ko") {
      this.koT += dt;
      this.bossPose = "ko";
      this.playerPose = "idle";
      this.bossRot += dt * 0.4;
      this.bossScaleY = Math.max(0.22, this.bossScaleY - dt * 0.15);
      this.bossX += (0.4 - this.bossX) * 0.08;
      if (this.koT > 2.1) {
        if (this.bossIndex >= ROSTER.length - 1) {
          this.phase = "victory";
          if (this.score > this.highScore) this.highScore = this.score;
        } else {
          this.bossIndex += 1;
          this.enterInterlude();
        }
      }
      const freeze = this.juice.update(dt);
      if (freeze === "frozen") return;
      return;
    }

    if (this.phase === "finisher") {
      this.tickFinisher(dt, input);
      return;
    }

    if (this.phase === "ending") {
      this.koT += dt;
      this.playerPose = "hurt";
      this.bossPose = "attack";
      this.juice.update(dt);
      return;
    }

    if (this.phase !== "fight") {
      this.animateIdle(dt);
      this.juice.update(dt);
      return;
    }

    if (this.juice.update(dt) === "frozen") {
      this.playerPoseT += dt;
      return;
    }

    this.invuln = Math.max(0, this.invuln - dt);
    this.guardT += dt;
    if (this.guardT > this.boss.guardCycleMs / 1000) {
      this.guardT = 0;
      this.guard = this.guard === "left" ? "right" : this.guard === "right" ? "none" : "left";
    }

    this.tauntT += dt;
    if (this.tauntT > 4.5 && this.ai.kind === "idle") {
      this.tauntT = 0;
      this.line = pick(this.boss.tauntLines);
    }

    this.tickPlayer(dt, input);
    if (this.boss.id === "cops") {
      this.tickBeatdown(dt);
      this.juice.update(dt);
      this.spring(dt);
      return;
    }
    this.tickBoss(dt);
    this.tickProjectiles(dt);
    this.spring(dt);
  }

  private animateIdle(dt: number) {
    this.playerPoseT += dt;
    this.juice.update(dt);
  }

  private spring(dt: number) {
    this.playerX += (0 - this.playerX) * (1 - Math.exp(- (this.playerPose.startsWith("dodge") ? 2 : 10) * dt));
    this.bossX += (0 - this.bossX) * (1 - Math.exp(-8 * dt));
    this.bossRot += (0 - this.bossRot) * (1 - Math.exp(-6 * dt));
    this.bossScaleX += (1 - this.bossScaleX) * (1 - Math.exp(-10 * dt));
    this.bossScaleY += (1 - this.bossScaleY) * (1 - Math.exp(-10 * dt));
  }

  private setPlayer(pose: PlayerPose, dur: number) {
    this.playerPose = pose;
    this.playerPoseT = 0;
    if (pose === "dodgeL") this.playerX = -1;
    if (pose === "dodgeR") this.playerX = 1;
    if (pose === "idle") this.punchSide = null;
    void dur;
  }

  private tickPlayer(dt: number, input: FrameInput) {
    this.playerPoseT += dt;
    const busy = this.playerPose === "hurt";
    const cueUp = this.ai.kind === "telegraph" || this.ai.kind === "attack";
    const poseLock =
      !cueUp &&
      ((this.playerPose === "punch" && this.playerPoseT < 0.22) ||
        (this.playerPose === "dodgeL" && this.playerPoseT < 0.55) ||
        (this.playerPose === "dodgeR" && this.playerPoseT < 0.55) ||
        (this.playerPose === "duck" && this.playerPoseT < 0.55) ||
        (this.playerPose === "hurt" && this.playerPoseT < 0.42));

    if (!busy && !poseLock) {
      if (input.dodgeLPressed || input.dodgeRPressed || input.duckPressed) {
        if (input.dodgeLPressed) this.setPlayer("dodgeL", 0.55);
        else if (input.dodgeRPressed) this.setPlayer("dodgeR", 0.55);
        else this.setPlayer("duck", 0.55);
        this.invuln = 0.95;
        this.onSfx("dodge");
        if (cueUp) this.dodgedThisAttack = true;
        const lane = this.ai.kind === "telegraph" || this.ai.kind === "attack" ? this.ai.pattern.lane : null;
        if (lane === "left" && input.dodgeLPressed) this.perfectDodge = true;
        if (lane === "right" && input.dodgeRPressed) this.perfectDodge = true;
        if (lane === "high" && input.duckPressed) this.perfectDodge = true;
        if (lane === "center") this.perfectDodge = true;
      } else if (input.punchLPressed || input.punchRPressed) {
        this.tryPunch(input.punchLPressed ? "L" : "R");
      } else if (input.grabPressed && this.ai.kind === "stunned" && this.finishReady()) {
        this.startFinisher();
      } else if (input.grabPressed && this.ai.kind === "stunned") {
        this.juice.float(180, 240, "PUNISH", "#d4a574");
      } else if (this.playerPoseT > 0.55) {
        const holdDodge =
          cueUp &&
          this.dodgedThisAttack &&
          (this.playerPose === "dodgeL" || this.playerPose === "dodgeR" || this.playerPose === "duck");
        if (!holdDodge) this.playerPose = "idle";
      }
    } else if (this.playerPose === "hurt" && this.playerPoseT >= 0.42) {
      this.playerPose = "idle";
    }
    if (this.playerPose === "dodgeL" && input.dodgeL) this.invuln = Math.max(this.invuln, 0.12);
    if (this.playerPose === "dodgeR" && input.dodgeR) this.invuln = Math.max(this.invuln, 0.12);
    if (this.playerPose === "duck" && input.duck) this.invuln = Math.max(this.invuln, 0.12);

    if (this.ai.kind === "stunned" && this.playerPose !== "hurt") {
      this.cue = this.finishReady() ? "GRAB" : "PUNISH";
    }
  }

  private finishReady() {
    return this.stunCycles >= 2 || this.bossHp <= this.boss.hp * 0.4;
  }

  private tryPunch(side: "L" | "R") {
    this.punchSide = side;
    this.punchVariant = ((this.punchVariant + 1) % 2) as 0 | 1;
    this.setPlayer("punch", 0.22);
    this.onSfx("punch");
    if (this.boss.id === "cops") {
      this.juice.float(180, 240, "NOPE", "#cfc4b6");
      this.combo = 0;
      return;
    }
    if (this.ai.kind === "telegraph" || this.ai.kind === "attack") {
      this.juice.float(180, 240, "DODGE FIRST", "#cfc4b6");
      this.combo = 0;
      return;
    }
    if (this.ai.kind !== "stunned" && this.hitsThisWindow >= 2) {
      this.juice.float(180, 240, "DODGE", "#cfc4b6");
      return;
    }
    const guarded = (side === "L" && this.guard === "left") || (side === "R" && this.guard === "right");
    const windowOpen =
      this.ai.kind === "idle" ||
      this.ai.kind === "recover" ||
      this.ai.kind === "hurt" ||
      this.ai.kind === "stunned";

    if (!windowOpen) {
      this.juice.float(180, 240, "WHIFF", "#cfc4b6");
      return;
    }
    if (guarded && this.ai.kind !== "stunned") {
      this.onSfx("block");
      this.juice.burst(180, 260, 8, "#cfc4b6", 90);
      this.juice.float(200, 250, "CLANG", "#9a938c");
      this.combo = 0;
      this.line = "DENIED.";
      return;
    }
    const perfect = this.perfectDodge;
    this.perfectDodge = false;
    if (perfect) this.stars = Math.min(3, this.stars + 1);
    const star = this.stars >= STAR_HITS_FOR_STUN || this.starPunch;
    const dmg = this.ai.kind === "stunned" ? (star ? 12 : 7) : star ? 14 : perfect ? 9 : 6;
    if (this.ai.kind !== "stunned") this.hitsThisWindow += 1;
    this.hitBoss(dmg, star);
    if (star) {
      this.stars = 0;
      this.starPunch = false;
    }
  }

  private hitBoss(dmg: number, star: boolean) {
    const wasStunned = this.ai.kind === "stunned";
    this.bossHp = Math.max(0, this.bossHp - dmg);
    if (!wasStunned) this.stun += dmg;
    this.combo += 1;
    this.score += dmg * (1 + this.combo * 0.15) * (star ? 2 : 1);
    this.bossPose = "hurt";
    this.bossX = 0.18;
    this.bossScaleX = 1.12;
    this.bossScaleY = 0.9;
    this.juice.freeze(star ? 0.09 : 0.05);
    this.juice.addTrauma(star ? 0.55 : 0.32);
    this.juice.burst(180, 250, star ? 22 : 12, this.boss.palette.glow, star ? 260 : 160);
    this.juice.float(200, 230, star ? "STAR" : `${Math.round(dmg)}`, star ? "#d4a574" : "#f3ebe1");
    this.juice.screenFlash("#ffffff", star ? 0.4 : 0.18);
    this.onSfx("punchHit", { rate: 1 + Math.min(0.2, this.combo * 0.02) });
    this.onVibrate(star ? 40 : 18);
    this.line = pick(this.boss.hurtLines);

    if (this.bossHp <= 0) {
      this.bossHp = 1;
      this.stunBoss();
      return;
    }
    if (wasStunned) {
      this.bossPose = "stun";
      this.cue = this.finishReady() ? "GRAB" : "PUNISH";
      return;
    }
    this.ai = { kind: "hurt", t: star ? 0.28 : 0.16 };
    if (this.stun >= this.boss.stunThreshold || this.stars >= STAR_HITS_FOR_STUN) {
      this.stunBoss();
    }
  }

  private stunBoss() {
    this.stun = this.boss.stunThreshold;
    this.stunCycles += 1;
    this.hitsThisWindow = 0;
    const ready = this.finishReady();
    this.ai = { kind: "stunned", t: ready ? 3.4 : 1.7 };
    this.bossPose = "stun";
    this.cue = ready ? "GRAB" : "PUNISH";
    this.line = ready ? "WOBBLING. Grab them." : "They're wobbly. Hit them.";
    this.onSfx("stun");
    this.juice.addTrauma(0.4);
    this.juice.burst(180, 240, 18, "#d4a574", 120);
    this.onVibrate(30);
  }

  private startFinisher() {
    this.phase = "finisher";
    this.playerPose = "grab";
    this.mash = {
      count: 0,
      goal: this.boss.finisher.mashGoal,
      t: 0,
      prompt: this.boss.finisher.prompt,
    };
    this.line = this.boss.finisher.prompt;
    this.cue = "";
    this.onSfx("grab");
    this.juice.addTrauma(0.3);
  }

  markVerseEnded() {
    this.verseEnded = true;
  }

  private tickFinisher(dt: number, input: FrameInput) {
    if (this.cinematic) {
      this.cinematic.t += dt;
      this.runCinematic(dt);
      if (this.cinematic.t > fatalityHold(this.boss.id)) {
        this.cinematic = null;
        this.knockout();
      }
      this.juice.update(dt);
      return;
    }
    this.mash.t += dt;
    const taps = Math.max(input.mashCount, input.mash ? 1 : 0);
    if (taps > 0) {
      this.mash.count += taps;
      this.onSfx("mash", { rate: 1 + this.mash.count * 0.03 });
      this.juice.addTrauma(0.12);
      this.juice.burst(180, 280, 6, "#c44536", 140);
      this.bossYPulse();
      this.onVibrate(12);
    }
    if (this.mash.count >= this.mash.goal) {
      this.score += 500 + this.bossIndex * 250;
      this.line = this.boss.finisher.successLine;
      this.cinematic = { kind: "finisher", t: 0, id: this.boss.id };
      this.onSfx("impact");
      this.juice.freeze(0.12);
      this.juice.addTrauma(0.85);
      this.juice.screenFlash("#c44536", 0.5);
      return;
    }
    if (this.mash.t > this.boss.finisher.windowMs / 1000) {
      this.phase = "fight";
      this.ai = { kind: "idle", t: 0.3 };
      this.stun = 0;
      this.stars = 0;
      this.bossPose = "idle";
      this.playerPose = "hurt";
      this.playerPoseT = 0;
      this.playerHp = Math.max(1, this.playerHp - 10);
      this.line = "They wriggled out.";
      this.onSfx("hurt");
    }
    this.juice.update(dt);
  }

  private bossYPulse() {
    this.bossScaleY = 0.78;
    this.bossScaleX = 1.18;
    this.bossRot = (Math.random() - 0.5) * 0.4;
  }

  private runCinematic(dt: number) {
    const t = this.cinematic?.t ?? 0;
    const id = this.cinematic?.id;
    this.playerPose = "grab";
    if (id === "boss") {
      this.bossRot = t * 6.2;
      this.bossScaleY = Math.max(0.08, 1 - t * 0.7);
      this.bossScaleX = 1 + Math.sin(t * 14) * 0.2;
      if (t > 1.2) {
        this.bossScaleX *= Math.max(0, 1 - (t - 1.2) * 2);
        this.bossScaleY *= Math.max(0, 1 - (t - 1.2) * 2);
      }
    } else {
      this.bossYPulse();
      this.bossX = Math.sin(t * 28) * 0.25;
      this.bossRot = Math.sin(t * 22) * 0.5;
      this.bossScaleY = 0.7 + Math.sin(t * 30) * 0.12;
    }
    if (Math.random() < 0.4) this.juice.burst(180, 260, 4, "#c44536", 200);
    void dt;
  }

  private knockout() {
    this.phase = "ko";
    this.koT = 0;
    this.bossHp = 0;
    this.bossPose = "ko";
    this.playerPose = "idle";
    this.bossScaleY = 0.45;
    this.bossRot = 1.15;
    this.bossX = 0.35;
    this.line = this.boss.koLine;
    this.cue = "";
    this.onSfx("ko");
    this.juice.addTrauma(0.7);
    this.juice.burst(180, 260, 28, this.boss.palette.glow, 280);
    this.score += 200 + Math.floor(this.playerHp * 2);
    if (this.score > this.highScore) this.highScore = this.score;
  }

  private tickBoss(dt: number) {
    const ai = this.ai;
    ai.t -= dt;

    if (ai.kind === "idle") {
      this.bossPose = "idle";
      this.cue = this.hitsThisWindow > 0 && this.hitsThisWindow < 2 ? "NOW" : "";
      if (ai.t <= 0) this.windUp();
      return;
    }
    if (ai.kind === "telegraph") {
      this.bossPose = "idle";
      this.bossScaleX = 1.06;
      this.cue = ai.pattern.telegraphCue;
      if (ai.t <= 0) this.launch(ai.pattern);
      return;
    }
    if (ai.kind === "attack") {
      this.bossPose = "attack";
      if (!ai.connected && ai.t < ai.pattern.activeMs / 1000 * 0.55) {
        this.tryConnect(ai.pattern, ai);
      }
      if (ai.t <= 0) {
        this.ai = { kind: "recover", t: ai.pattern.recoverMs / 1000 + 0.22, pattern: ai.pattern };
      }
      return;
    }
    if (ai.kind === "recover") {
      this.bossPose = "idle";
      this.cue = "NOW";
      if (ai.t <= 0) this.ai = { kind: "idle", t: 0.28 };
      return;
    }
    if (ai.kind === "hurt") {
      this.bossPose = "hurt";
      if (ai.t <= 0) {
        if (this.hitsThisWindow >= 2) this.windUp();
        else this.ai = { kind: "idle", t: 0.4 };
      }
      return;
    }
    if (ai.kind === "stunned") {
      this.bossPose = "stun";
      this.bossRot = Math.sin(this.time * 8) * 0.12;
      this.cue = this.finishReady() ? "GRAB" : "PUNISH";
      if (ai.t <= 0) {
        this.stun = 0;
        this.stars = 0;
        this.hitsThisWindow = 0;
        this.cue = "";
        this.ai = { kind: "idle", t: 0.2 };
      }
    }
  }

  private tickBeatdown(dt: number) {
    this.invuln = 0;
    this.beatT += dt;
    this.guard = "none";
    this.cue = "";
    const clubs: { at: number; line: string }[] = [
      { at: 0.55, line: "On the ground. Now." },
      { at: 1.5, line: "Don't resist." },
      { at: 2.45, line: "Hands." },
      { at: 3.4, line: "That's a club." },
    ];
    if (this.beatIndex < clubs.length && this.beatT >= clubs[this.beatIndex].at) {
      this.line = clubs[this.beatIndex].line;
      this.clubHit();
      this.beatIndex += 1;
    }
    if (this.beatIndex >= clubs.length && this.beatT >= 4.15) {
      this.phase = "ending";
      this.koT = 0;
      this.playerPose = "hurt";
      this.bossPose = "attack";
      this.onSfx("ko");
      this.line = this.boss.koLine;
    }
  }

  private clubHit() {
    this.setPlayer("hurt", 0.55);
    this.bossPose = "attack";
    this.bossScaleY = 1.22;
    this.bossScaleX = 1.08;
    this.bossX = (Math.random() - 0.5) * 0.35;
    this.juice.freeze(0.1);
    this.juice.addTrauma(0.95);
    this.juice.screenFlash("#c44536", 0.5);
    this.juice.burst(180, 460, 22, "#c44536", 240);
    this.onSfx("hurt");
    this.onVibrate(55);
    this.playerHp = Math.max(1, this.playerHp - 18);
  }

  private windUp() {
    const pool = this.boss.patterns.filter((p) => p.id !== this.lastPattern);
    const pattern = pick(pool.length ? pool : this.boss.patterns);
    this.lastPattern = pattern.id;
    this.hitsThisWindow = 0;
    this.dodgedThisAttack = false;
    this.ai = { kind: "telegraph", t: pattern.telegraphMs / 1000 + 0.38, pattern };
    this.cue = pattern.telegraphCue;
    this.onSfx("whoosh", { rate: 0.85 });
  }

  private launch(pattern: AttackPattern) {
    this.hitsThisWindow = 0;
    this.ai = { kind: "attack", t: pattern.activeMs / 1000, pattern, connected: false };
    this.bossPose = "attack";
    this.bossScaleY = 1.12;
    this.onSfx(pattern.kind === "projectile" ? "projectile" : "whoosh");
    if (pattern.kind === "projectile" && pattern.projectile) {
      this.projectiles.push({
        kind: pattern.projectile,
        lane: pattern.lane,
        t: 0,
        life: 0.55 + this.bossIndex * 0.04,
        damage: pattern.damage,
      });
    }
  }

  private tryConnect(pattern: AttackPattern, ai: Extract<BossAI, { kind: "attack" }>) {
    if (pattern.kind === "projectile") return;
    ai.connected = true;
    if (this.avoided(pattern.lane)) {
      this.juice.float(90, 400, "MISS", "#d4a574");
      this.combo += 1;
      this.score += 20;
      this.line = "A WHIFF.";
      return;
    }
    this.hitPlayer(Math.max(5, Math.round(pattern.damage * 0.6)));
  }

  private avoided(lane: Lane) {
    if (this.dodgedThisAttack) return true;
    if (this.invuln > 0 && isSafe(lane, this.playerPose)) return true;
    return false;
  }

  private tickProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.t += dt;
      if (p.t >= p.life) {
        this.projectiles.splice(i, 1);
        if (this.avoided(p.lane)) {
          this.juice.float(90, 400, "MISS", "#d4a574");
          this.combo += 1;
          this.score += 20;
        } else if (this.phase === "fight") {
          this.hitPlayer(Math.max(5, Math.round(p.damage * 0.6)));
        }
      }
    }
  }

  private hitPlayer(dmg: number) {
    if (this.invuln > 0 && this.playerPose !== "hurt") return;
    this.playerHp = Math.max(0, this.playerHp - dmg);
    this.combo = 0;
    this.stun = Math.max(0, this.stun - 6);
    this.stars = 0;
    this.setPlayer("hurt", 0.42);
    this.invuln = 0.45;
    this.juice.freeze(0.06);
    this.juice.addTrauma(0.5);
    this.juice.screenFlash("#c44536", 0.35);
    this.juice.burst(180, 480, 14, "#c44536", 180);
    this.onSfx("hurt");
    this.onVibrate(35);
    this.line = "That one landed.";
    if (this.playerHp <= 0) {
      if (this.boss.id === "cops") {
        this.phase = "ending";
        this.koT = 0;
        this.playerPose = "hurt";
        this.bossPose = "attack";
        this.onSfx("ko");
        this.line = this.boss.koLine;
        return;
      }
      this.phase = "defeat";
      this.onSfx("ko");
    }
  }

  hud(): HudState {
    return {
      phase: this.phase,
      paused: this.paused,
      boss: this.boss,
      bossIndex: this.bossIndex,
      playerHp: this.playerHp,
      bossHp: this.bossHp,
      stun: this.boss.stunThreshold ? this.stun / this.boss.stunThreshold : 0,
      stars: this.stars,
      combo: this.combo,
      score: Math.floor(this.score),
      highScore: Math.floor(this.highScore),
      line: this.line,
      cue: this.cue,
      telegraphLane: this.ai.kind === "telegraph" ? this.ai.pattern.lane : this.ai.kind === "attack" ? this.ai.pattern.lane : null,
      countdown: this.phase === "countdown" ? this.countdown : null,
      mash: this.phase === "finisher" && !this.cinematic ? this.mash : null,
      muted: this.muted,
      caption: this.caption,
      walkT: this.walkT,
      punchSide: this.punchSide,
      punchVariant: this.punchVariant,
      finisherPlay: this.phase === "finisher" && Boolean(this.cinematic),
      endingT: this.phase === "ending" ? this.koT : 0,
      walkDuration: verseDuration(this.boss.id),
      introAt: introAt(this.boss.id),
      showIntro: this.phase === "interlude" && this.walkT >= introAt(this.boss.id),
    };
  }

  view(): ViewModel {
    return {
      ...this.hud(),
      playerPose: this.playerPose,
      bossPose: this.bossPose,
      playerX: this.playerX,
      playerSquash: this.playerPose === "duck" ? 0.78 : this.playerPose === "hurt" ? 0.92 : 1,
      bossX: this.bossX,
      bossRot: this.bossRot,
      bossScaleX: this.bossScaleX,
      bossScaleY: this.bossScaleY,
      guard: this.guard,
      projectiles: this.projectiles,
      cinematic: this.cinematic,
      time: this.time,
      juice: this.juice,
      intro: this.boss.introLine,
    };
  }
}
