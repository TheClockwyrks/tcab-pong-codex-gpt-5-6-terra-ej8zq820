import type { Game, InitApi, UpdateApi } from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import {
  ACTIONS,
  AI_DEADZONE,
  AI_HOME_DEADZONE,
  AI_HOME_Y,
  AI_REACT,
  AI_SPEED,
  BALL_R,
  BINDINGS,
  CAROM_DEBUG_VERSION,
  CUES,
  FIELD_CX,
  FIELD_CY,
  FIELD_H,
  FIELD_W,
  HOLD_TIME,
  MATCHOVER_ITEMS,
  MAX_BOUNCE_ANGLE,
  MAX_SUBSTEP,
  NET_X,
  OBSTACLE_CENTERS,
  OBSTACLE_H,
  OBSTACLE_W,
  P1_X0,
  P1_X1,
  P2_X0,
  P2_X0 as P2FACE,
  PADDLE_HALF,
  PADDLE_MAX_CY,
  PADDLE_MIN_CY,
  PADDLE_SPEED,
  PADDLE_W,
  PAUSE_ITEMS,
  SERVE_ANGLE,
  SERVE_SPEED,
  SPEED_CAP,
  SPEED_MULT,
  SPIN_CLAMP,
  SPIN_FROM_PADDLE,
  SPIN_HALFLIFE,
  TITLE_ITEMS,
  TITLE_TEXT,
  TRAIL_TIME,
  WIN_LEAD,
  WIN_SCORE,
} from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
  readonly muted: boolean;
}
export interface MenuRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}
export interface Snapshot {
  readonly version: number;
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly muted: boolean;
  readonly paddles: CaromState["paddles"];
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: (BallState & { readonly speed: number }) | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
}
type Pose = (s: DeepReadonly<CaromState>) => CaromState;
export interface CaromDebugApi {
  readonly version: number;
  clearWorld: Pose;
  spawnBall: Pose;
  spawnObstacle(s: DeepReadonly<CaromState>, index: number): CaromState;
  reset: Pose;
  reconcile: Pose;
  setScreen(s: DeepReadonly<CaromState>, v: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, v: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    v: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, v: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, v: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleDriven(
    s: DeepReadonly<CaromState>,
    side: Side,
    v: boolean,
  ): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, v: 1 | -1): CaromState;
  drawBallServeSign: Pose;
  setAiTracking(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): Snapshot;
  menuItemRect(s: DeepReadonly<CaromState>, index: number): MenuRect | null;
}
export const BACKGROUND = "#07131e";
const [LEFT, RIGHT, GOLD, INK] = ["#5be7ff", "#ff6b9d", "#ffcc66", "#d9f6ff"];
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const serveSign = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const ball = (): BallState => ({
  x: FIELD_CX,
  y: FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: HOLD_TIME,
  serveSign: serveSign(),
  trail: [],
});
const obstacles = (): readonly ObstacleState[] =>
  OBSTACLE_CENTERS.map((p, index) => ({ index, cx: p.x, cy: p.y }));
const initial = (muted = false, titleIndex = 0, simTime = 0): CaromState => ({
  screen: "title",
  mode: "solo",
  menuIndex: titleIndex,
  titleIndex,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  paddles: {
    left: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    right: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
  },
  ai: { tracking: true, movement: true },
  receiver: "left",
  ball: ball(),
  obstacles: obstacles(),
  simTime,
  muted,
});
const items = (s: Screen): readonly string[] =>
  s === "title"
    ? TITLE_ITEMS
    : s === "paused"
      ? PAUSE_ITEMS
      : s === "matchover"
        ? MATCHOVER_ITEMS
        : s === "howto"
          ? ["BACK TO MENU"]
          : [];
const rect = (i: number): MenuRect => ({
  x: 440,
  y: 365 + i * 62,
  w: 400,
  h: 48,
});
const hit = (r: MenuRect, x: number, y: number) =>
  x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const needBall = (s: DeepReadonly<CaromState>): BallState => {
  if (!s.ball) throw new Error("Carom: no ball is present");
  return s.ball;
};
const paddle = (
  s: DeepReadonly<CaromState>,
  side: Side,
  p: PaddleState,
): CaromState => ({ ...s, paddles: { ...s.paddles, [side]: p } });
function move(p: PaddleState, vy: number, dt: number): PaddleState {
  const cy = clamp(p.cy + vy * dt, PADDLE_MIN_CY, PADDLE_MAX_CY);
  return {
    ...p,
    cy,
    vy: dt > 0 && cy !== p.cy + vy * dt ? (cy - p.cy) / dt : vy,
  };
}
function start(s: DeepReadonly<CaromState>, mode = s.mode): CaromState {
  return {
    ...s,
    mode,
    screen: "countdown",
    resumeScreen: "playing",
    menuIndex: 0,
    score: { p1: 0, p2: 0 },
    winner: null,
    receiver: "left",
    ball: ball(),
    paddles: {
      left: { ...s.paddles.left, cy: FIELD_CY, vy: 0 },
      right: { ...s.paddles.right, cy: FIELD_CY, vy: 0 },
    },
  };
}
function title(s: DeepReadonly<CaromState>): CaromState {
  return {
    ...initial(s.muted, s.titleIndex, s.simTime),
    menuIndex: s.titleIndex,
  };
}
function activate(s: DeepReadonly<CaromState>): CaromState {
  if (s.screen === "title") {
    if (s.menuIndex === 0) return { ...start(s, "solo"), titleIndex: 0 };
    if (s.menuIndex === 1) return { ...start(s, "versus"), titleIndex: 1 };
    return { ...s, screen: "howto", menuIndex: 0, titleIndex: 2 };
  }
  if (s.screen === "howto") return title(s);
  if (s.screen === "paused")
    return s.menuIndex === 0
      ? { ...s, screen: s.resumeScreen }
      : s.menuIndex === 1
        ? start(s)
        : title(s);
  if (s.screen === "matchover") return s.menuIndex === 0 ? start(s) : title(s);
  return s as CaromState;
}
function menus(s: DeepReadonly<CaromState>, api: UpdateApi): CaromState {
  const list = items(s.screen);
  if (!list.length) return s as CaromState;
  let n = s as CaromState;
  const up = api.input.pressed("p1-up") || api.input.pressed("p2-up"),
    down = api.input.pressed("p1-down") || api.input.pressed("p2-down"),
    confirm = api.input.pressed("confirm");
  if (up)
    n = { ...n, menuIndex: (n.menuIndex + list.length - 1) % list.length };
  else if (down) n = { ...n, menuIndex: (n.menuIndex + 1) % list.length };
  const pointer = api.input.pointer();
  for (const p of api.input.pointerSamples()) {
    const i = list.findIndex((_, j) => hit(rect(j), p.x, p.y));
    if (i >= 0) n = { ...n, menuIndex: i };
  }
  const i = list.findIndex((_, j) => hit(rect(j), pointer.x, pointer.y));
  if (i >= 0) n = { ...n, menuIndex: i };
  if (up || down) return n;
  if (confirm) return activate(n);
  return api.input.pointerReleased() && i >= 0 ? activate(n) : n;
}
type Face = "left" | "right" | "top" | "bottom";
function face(
  b: BallState,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): Face | null {
  if (!(
    b.x > x0 - BALL_R &&
    b.x < x1 + BALL_R &&
    b.y > y0 - BALL_R &&
    b.y < y1 + BALL_R
  ))
    return null;
  const d: [Face, number][] = [
    ["left", b.x - (x0 - BALL_R)],
    ["right", x1 + BALL_R - b.x],
    ["top", b.y - (y0 - BALL_R)],
    ["bottom", y1 + BALL_R - b.y],
  ];
  return d.reduce((a, v) => (v[1] < a[1] ? v : a))[0];
}
function obstacle(b: BallState, o: ObstacleState): BallState {
  const x0 = o.cx - OBSTACLE_W / 2,
    x1 = o.cx + OBSTACLE_W / 2,
    y0 = o.cy - OBSTACLE_H / 2,
    y1 = o.cy + OBSTACLE_H / 2,
    f = face(b, x0, x1, y0, y1);
  if (!f) return b;
  if (f === "left")
    return { ...b, x: x0 - BALL_R, vx: b.vx > 0 ? -b.vx : b.vx };
  if (f === "right")
    return { ...b, x: x1 + BALL_R, vx: b.vx < 0 ? -b.vx : b.vx };
  if (f === "top") return { ...b, y: y0 - BALL_R, vy: b.vy > 0 ? -b.vy : b.vy };
  return { ...b, y: y1 + BALL_R, vy: b.vy < 0 ? -b.vy : b.vy };
}
const trail = (b: BallState, t: number): BallState => ({
  ...b,
  trail: [...b.trail, { x: b.x, y: b.y, t }].filter(
    (p) => p.t >= t - TRAIL_TIME,
  ),
});
function step(
  s: DeepReadonly<CaromState>,
  api: UpdateApi,
  dt: number,
): CaromState {
  let l = s.paddles.left,
    r = s.paddles.right;
  const human = (u: string, d: string) =>
    (api.input.value(d) - api.input.value(u)) * PADDLE_SPEED;
  l = move(l, l.driven ? l.drivenVy : human("p1-up", "p1-down"), dt);
  if (r.driven) r = move(r, r.drivenVy, dt);
  else if (s.mode === "versus") r = move(r, human("p2-up", "p2-down"), dt);
  else {
    let target = AI_HOME_Y,
      dz = AI_HOME_DEADZONE;
    if (s.ai.tracking && s.screen === "playing" && s.ball && s.ball.vx > 0) {
      target = s.ball.y - s.ball.vy * AI_REACT;
      dz = AI_DEADZONE;
    }
    const diff = target - r.cy,
      vy =
        !s.ai.movement || Math.abs(diff) <= dz
          ? 0
          : Math.sign(diff) *
            Math.min(AI_SPEED, Math.abs(diff) / Math.max(dt, Number.EPSILON));
    r = move(r, vy, dt);
  }
  const b = s.ball;
  if (!b) return { ...s, paddles: { left: l, right: r } };
  if (s.screen === "countdown") {
    const timer = b.holdTimer - dt;
    if (timer <= 0) {
      const dir = s.receiver === "left" ? -1 : 1;
      return {
        ...s,
        screen: "playing",
        paddles: { left: l, right: r },
        ball: {
          ...b,
          held: false,
          holdTimer: 0,
          vx: dir * SERVE_SPEED * Math.cos(SERVE_ANGLE),
          vy: b.serveSign * SERVE_SPEED * Math.sin(SERVE_ANGLE),
          trail: [],
        },
      };
    }
    return {
      ...s,
      paddles: { left: l, right: r },
      ball: trail({ ...b, holdTimer: timer }, s.simTime + dt),
    };
  }
  if (b.held)
    return {
      ...s,
      paddles: { left: l, right: r },
      ball: trail(b, s.simTime + dt),
    };
  let pHit = false,
    wHit = false,
    oHit = false;
  let w = b;
  const n = Math.max(1, Math.ceil((Math.hypot(w.vx, w.vy) * dt) / MAX_SUBSTEP));
  for (let i = 0; i < n; i++) {
    const h = dt / n,
      sp = Math.hypot(w.vx, w.vy);
    if (sp) {
      const a = (w.spin / sp) * h,
        c = Math.cos(a),
        q = Math.sin(a);
      w = { ...w, vx: w.vx * c - w.vy * q, vy: w.vx * q + w.vy * c };
    }
    w = {
      ...w,
      spin: w.spin * Math.pow(0.5, h / SPIN_HALFLIFE),
      x: w.x + w.vx * h,
      y: w.y + w.vy * h,
    };
    if (w.y - BALL_R < 0 && w.vy < 0) {
      w = { ...w, y: BALL_R, vy: -w.vy };
      wHit = true;
    } else if (w.y + BALL_R > FIELD_H && w.vy > 0) {
      w = { ...w, y: FIELD_H - BALL_R, vy: -w.vy };
      wHit = true;
    }
    for (const [side, pd] of [
      ["left", l],
      ["right", r],
    ] as const) {
      const x0 = side === "left" ? P1_X0 : P2_X0,
        x1 = side === "left" ? P1_X1 : P2_X0 + PADDLE_W,
        f = face(w, x0, x1, pd.cy - PADDLE_HALF, pd.cy + PADDLE_HALF);
      if (!f) continue;
      if (f === "left" || f === "right") {
        const theta =
            clamp((w.y - pd.cy) / PADDLE_HALF, -1, 1) * MAX_BOUNCE_ANGLE,
          ns = Math.min(Math.hypot(w.vx, w.vy) * SPEED_MULT, SPEED_CAP),
          dir = side === "left" ? 1 : -1;
        w = {
          ...w,
          x: side === "left" ? P1_X1 + BALL_R : P2FACE - BALL_R,
          vx: dir * ns * Math.cos(theta),
          vy: ns * Math.sin(theta),
          spin: clamp(
            w.spin + pd.vy * SPIN_FROM_PADDLE,
            -SPIN_CLAMP,
            SPIN_CLAMP,
          ),
        };
        pHit = true;
      } else if (f === "top") {
        w = {
          ...w,
          y: pd.cy - PADDLE_HALF - BALL_R,
          vy: w.vy > 0 ? -w.vy : w.vy,
        };
        wHit = true;
      } else {
        w = {
          ...w,
          y: pd.cy + PADDLE_HALF + BALL_R,
          vy: w.vy < 0 ? -w.vy : w.vy,
        };
        wHit = true;
      }
    }
    for (const o of s.obstacles) {
      const before = w;
      w = obstacle(w, o);
      if (before !== w) oHit = true;
    }
  }
  if (pHit) api.audio.play(CUES.paddleHit);
  if (wHit) api.audio.play(CUES.wallBounce);
  if (oHit) api.audio.play(CUES.obstacleBounce);
  if (w.x - BALL_R > FIELD_W || w.x + BALL_R < 0) {
    const who: Side = w.x - BALL_R > FIELD_W ? "left" : "right",
      score =
        who === "left"
          ? { p1: s.score.p1 + 1, p2: s.score.p2 }
          : { p1: s.score.p1, p2: s.score.p2 + 1 },
      won =
        who === "left"
          ? score.p1 >= WIN_SCORE && score.p1 - score.p2 >= WIN_LEAD
          : score.p2 >= WIN_SCORE && score.p2 - score.p1 >= WIN_LEAD;
    api.audio.play(CUES.score);
    if (won)
      return {
        ...s,
        paddles: { left: l, right: r },
        ball: trail(w, s.simTime + dt),
        score,
        winner: who,
        screen: "matchover",
        menuIndex: 0,
      };
    return {
      ...s,
      paddles: { left: l, right: r },
      score,
      receiver: who === "left" ? "right" : "left",
      ball: ball(),
      screen: "countdown",
    };
  }
  return {
    ...s,
    paddles: { left: l, right: r },
    ball: trail(w, s.simTime + dt),
  };
}
function debug(setMuted: (v: boolean) => void): CaromDebugApi {
  const bp = (
    s: DeepReadonly<CaromState>,
    v: Partial<BallState>,
  ): CaromState => ({ ...s, ball: { ...needBall(s), ...v } });
  return {
    version: CAROM_DEBUG_VERSION,
    clearWorld: (s) => ({ ...s, ball: null, obstacles: [] }),
    spawnBall: (s) => ({ ...s, ball: ball() }),
    spawnObstacle: (s, index) => {
      const p = OBSTACLE_CENTERS[index];
      if (!p) throw new Error("Carom: invalid obstacle index");
      return {
        ...s,
        obstacles: [
          ...s.obstacles.filter((o) => o.index !== index),
          { index, cx: p.x, cy: p.y },
        ].sort((a, b) => a.index - b.index),
      };
    },
    reset: (s) => initial(s.muted),
    reconcile: (s) => ({ ...s }),
    setScreen: (s, v) => ({ ...s, screen: v }),
    setMode: (s, v) => ({ ...s, mode: v }),
    setMenuIndex: (s, v) => ({ ...s, menuIndex: v }),
    setTitleIndex: (s, v) => ({ ...s, titleIndex: v }),
    setResumeScreen: (s, v) => ({ ...s, resumeScreen: v }),
    setScore: (s, p1, p2) => ({ ...s, score: { p1, p2 } }),
    setWinner: (s, winner) => ({ ...s, winner }),
    setReceiver: (s, receiver) => ({ ...s, receiver }),
    setPaddleCy: (s, side, cy) => paddle(s, side, { ...s.paddles[side], cy }),
    setPaddleVy: (s, side, drivenVy) =>
      paddle(s, side, { ...s.paddles[side], drivenVy }),
    setPaddleDriven: (s, side, driven) =>
      paddle(s, side, { ...s.paddles[side], driven }),
    setBallPosition: (s, x, y) => bp(s, { x, y }),
    setBallVelocity: (s, vx, vy) => bp(s, { vx, vy }),
    setBallSpin: (s, spin) => bp(s, { spin }),
    setBallHeld: (s, held) => bp(s, { held }),
    setBallHoldTimer: (s, holdTimer) => bp(s, { holdTimer }),
    setBallServeSign: (s, serveSign) => bp(s, { serveSign }),
    drawBallServeSign: (s) => bp(s, { serveSign: serveSign() }),
    setAiTracking: (s, tracking) => ({ ...s, ai: { ...s.ai, tracking } }),
    setAiMovement: (s, movement) => ({ ...s, ai: { ...s.ai, movement } }),
    setMuted: (s, muted) => {
      setMuted(muted);
      return { ...s, muted };
    },
    snapshot: (s) => ({
      version: CAROM_DEBUG_VERSION,
      screen: s.screen,
      mode: s.mode,
      menuIndex: s.menuIndex,
      titleIndex: s.titleIndex,
      resumeScreen: s.resumeScreen,
      score: { ...s.score },
      winner: s.winner,
      muted: s.muted,
      paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
      ai: { ...s.ai },
      receiver: s.receiver,
      ball: s.ball
        ? {
            ...s.ball,
            speed: Math.hypot(s.ball.vx, s.ball.vy),
            trail: s.ball.trail.map((p) => ({ ...p })),
          }
        : null,
      obstacles: s.obstacles.map((o) => ({ ...o })),
      simTime: s.simTime,
    }),
    menuItemRect: (s, index) =>
      index >= 0 && index < items(s.screen).length ? rect(index) : null,
  };
}
export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>) {
    for (const a of ACTIONS) api.input.register(a, { keys: [...BINDINGS[a]] });
    api.audio.define(CUES.paddleHit, {
      wave: "square",
      freq: 330,
      freqTo: 700,
      gain: 0.11,
      durationMs: 55,
    });
    api.audio.define(CUES.wallBounce, {
      wave: "triangle",
      freq: 210,
      freqTo: 150,
      gain: 0.09,
      durationMs: 48,
    });
    api.audio.define(CUES.obstacleBounce, {
      wave: "sawtooth",
      freq: 180,
      freqTo: 420,
      gain: 0.08,
      durationMs: 58,
    });
    api.audio.define(CUES.score, {
      wave: "sine",
      freq: 440,
      freqTo: 880,
      gain: 0.14,
      durationMs: 160,
    });
    const d = (
      n: string,
      f: (s: DeepReadonly<CaromState>) => string | number,
    ) => api.diagnostics.register(n, f);
    d("screen", (s) => s.screen);
    d("mode", (s) => s.mode);
    d("score", (s) => `${s.score.p1} – ${s.score.p2}`);
    d("ball position", (s) =>
      s.ball ? `${s.ball.x.toFixed(1)}, ${s.ball.y.toFixed(1)}` : "none",
    );
    d("ball velocity", (s) =>
      s.ball ? `${s.ball.vx.toFixed(1)}, ${s.ball.vy.toFixed(1)}` : "none",
    );
    d("ball speed", (s) =>
      s.ball ? Math.hypot(s.ball.vx, s.ball.vy).toFixed(1) : "0",
    );
    d("spin", (s) => s.ball?.spin.toFixed(1) ?? "0");
    d(
      "left paddle",
      (s) =>
        `${s.paddles.left.cy.toFixed(1)} / ${s.paddles.left.vy.toFixed(1)}`,
    );
    d(
      "right paddle",
      (s) =>
        `${s.paddles.right.cy.toFixed(1)} / ${s.paddles.right.vy.toFixed(1)}`,
    );
    return [initial(), debug(() => undefined)];
  },
  update(s, api, dt) {
    // A debug pose can set the mirrored mute bit between frames. Reconcile it
    // with the engine before this frame can emit a cue.
    if (s.muted !== api.audio.muted()) api.audio.setMuted(s.muted);
    if (api.input.pressed("mute")) api.audio.setMuted(!api.audio.muted());
    let n: CaromState = {
      ...s,
      simTime: s.simTime + dt,
      muted: api.audio.muted(),
    };
    if (s.screen === "countdown" || s.screen === "playing") {
      n = api.input.pressed("pause")
        ? { ...n, screen: "paused", resumeScreen: s.screen, menuIndex: 0 }
        : step(n, api, dt);
    } else if (s.screen === "paused") {
      n =
        api.input.pressed("pause") || api.input.pressed("back")
          ? { ...n, screen: s.resumeScreen }
          : menus(n, api);
    } else if (s.screen === "howto") {
      n =
        api.input.pressed("confirm") || api.input.pressed("back")
          ? title(n)
          : menus(n, api);
    } else if (s.screen === "matchover") {
      n = api.input.pressed("back") ? title(n) : menus(n, api);
    } else n = menus(n, api);
    return { ...n, muted: api.audio.muted() };
  },
  render(s, api) {
    const c = api.ctx;
    c.fillStyle = BACKGROUND;
    c.fillRect(0, 0, FIELD_W, FIELD_H);
    c.fillStyle = "#0d2633";
    c.fillRect(24, 24, FIELD_W - 48, FIELD_H - 48);
    c.setLineDash([10, 15]);
    c.strokeStyle = "#2e5665";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(NET_X, 48);
    c.lineTo(NET_X, FIELD_H - 48);
    c.stroke();
    c.setLineDash([]);
    for (const o of s.obstacles) {
      c.fillStyle = GOLD;
      rr(
        c,
        o.cx - OBSTACLE_W / 2,
        o.cy - OBSTACLE_H / 2,
        OBSTACLE_W,
        OBSTACLE_H,
        10,
      );
      c.fill();
    }
    for (const [side, color, x] of [
      ["left", LEFT, P1_X0],
      ["right", RIGHT, P2_X0],
    ] as const) {
      c.fillStyle = color;
      rr(c, x, s.paddles[side].cy - PADDLE_HALF, PADDLE_W, PADDLE_HALF * 2, 8);
      c.fill();
    }
    if (s.ball) {
      c.lineCap = "round";
      c.lineWidth = BALL_R * 1.1;
      c.strokeStyle = "rgba(217,246,255,.25)";
      c.beginPath();
      s.ball.trail.forEach((p, i) =>
        i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y),
      );
      c.stroke();
      c.shadowColor = INK;
      c.shadowBlur = 16;
      c.fillStyle = INK;
      c.beginPath();
      c.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
    }
    if (["playing", "countdown", "paused", "matchover"].includes(s.screen)) {
      tx(c, String(s.score.p1), FIELD_CX - 120, 92, 48, LEFT, "center");
      tx(c, String(s.score.p2), FIELD_CX + 120, 92, 48, RIGHT, "center");
      tx(
        c,
        s.mode === "solo" ? "SOLO // VECTOR AI" : "VERSUS // LOCAL DUEL",
        FIELD_CX,
        130,
        14,
        "#7fa8b5",
        "center",
      );
      if (s.screen === "countdown")
        tx(c, "READY", FIELD_CX, 250, 22, GOLD, "center");
    }
    if (s.screen === "title") {
      veil(c, 0.45);
      tx(c, TITLE_TEXT, FIELD_CX, 215, 92, INK, "center");
      tx(c, "SPIN THE RALLY", FIELD_CX, 260, 17, GOLD, "center");
      drawMenu(c, s, TITLE_ITEMS);
    }
    if (s.screen === "howto") {
      veil(c, 0.72);
      tx(c, "HOW TO PLAY", FIELD_CX, 150, 42, INK, "center");
      tx(
        c,
        "W / S move cyan     ↑ / ↓ move pink",
        FIELD_CX,
        235,
        20,
        INK,
        "center",
      );
      tx(
        c,
        "Move through a hit to add spin. Curve around the gold banks.",
        FIELD_CX,
        280,
        20,
        GOLD,
        "center",
      );
      tx(
        c,
        "First to 11, win by 2. P pauses. M toggles sound.",
        FIELD_CX,
        320,
        18,
        "#9ec1cb",
        "center",
      );
      drawMenu(c, s, ["BACK TO MENU"]);
    }
    if (s.screen === "paused") {
      veil(c, 0.62);
      tx(c, "PAUSED", FIELD_CX, 270, 48, INK, "center");
      drawMenu(c, s, PAUSE_ITEMS);
    }
    if (s.screen === "matchover") {
      veil(c, 0.68);
      tx(
        c,
        s.winner === "left" ? "CYAN WINS" : "PINK WINS",
        FIELD_CX,
        245,
        48,
        s.winner === "left" ? LEFT : RIGHT,
        "center",
      );
      tx(c, `${s.score.p1} — ${s.score.p2}`, FIELD_CX, 292, 25, INK, "center");
      drawMenu(c, s, MATCHOVER_ITEMS);
    }
    tx(c, s.muted ? "MUTE" : "M SOUND", 1235, 690, 13, "#62838e", "right");
  },
};
function rr(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}
function tx(
  c: CanvasRenderingContext2D,
  v: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign,
) {
  c.font = `700 ${size}px system-ui, sans-serif`;
  c.textAlign = align;
  c.textBaseline = "middle";
  c.fillStyle = color;
  c.fillText(v, x, y);
}
function veil(c: CanvasRenderingContext2D, a: number) {
  c.fillStyle = `rgba(3,11,18,${a})`;
  c.fillRect(0, 0, FIELD_W, FIELD_H);
}
function drawMenu(
  c: CanvasRenderingContext2D,
  s: DeepReadonly<CaromState>,
  list: readonly string[],
) {
  list.forEach((v, i) => {
    const r = rect(i),
      on = i === s.menuIndex;
    c.fillStyle = on ? "#173d4c" : "rgba(11,38,49,.72)";
    rr(c, r.x, r.y, r.w, r.h, 7);
    c.fill();
    c.strokeStyle = on ? GOLD : "#315967";
    c.lineWidth = on ? 2 : 1;
    c.stroke();
    tx(c, v, FIELD_CX, r.y + r.h / 2, 19, on ? GOLD : INK, "center");
  });
}
