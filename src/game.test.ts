import { describe, expect, it } from "vitest";
import {
  BALL_R,
  FIELD_CX,
  FIELD_CY,
  HOLD_TIME,
  SERVE_SPEED,
} from "./constants";
import { game, type CaromDebugApi, type CaromState } from "./game";

const setup = () => {
  const muted = { value: false };
  const api = {
    input: { register: () => undefined },
    audio: { define: () => undefined },
    diagnostics: { register: () => undefined },
  };
  const [state, debug] = game.initialize(api as never) as [
    CaromState,
    CaromDebugApi,
  ];
  const frame = {
    input: {
      pressed: () => false,
      value: () => 0,
      pointer: () => ({
        x: 0,
        y: 0,
        down: false,
        device: "mouse",
        buttons: [],
      }),
      pointerSamples: () => [],
      pointerReleased: () => false,
    },
    audio: {
      muted: () => muted.value,
      setMuted: (value: boolean) => {
        muted.value = value;
      },
      play: () => undefined,
    },
  };
  return { state, debug, frame };
};

describe("Carom simulation", () => {
  it("serves from the center toward the receiver after its hold", () => {
    const { state, debug, frame } = setup();
    const ready = debug.setScreen(state, "countdown");
    const elapsed = debug.setBallHoldTimer(ready, 0);
    const next = game.update(elapsed, frame as never, 1 / 60);
    expect(next.screen).toBe("playing");
    expect(next.ball?.held).toBe(false);
    expect(next.ball?.x).toBe(FIELD_CX);
    expect(next.ball?.y).toBe(FIELD_CY);
    expect(Math.hypot(next.ball?.vx ?? 0, next.ball?.vy ?? 0)).toBeCloseTo(
      SERVE_SPEED,
    );
  });

  it("parks and awards a point after the ball passes a goal", () => {
    const { state, debug, frame } = setup();
    let next = debug.setScreen(state, "playing");
    next = debug.setBallHeld(next, false);
    next = debug.setBallPosition(next, -BALL_R - 10, FIELD_CY);
    next = debug.setBallVelocity(next, -1, 0);
    next = game.update(next, frame as never, 1 / 60);
    expect(next.score.p2).toBe(1);
    expect(next.screen).toBe("countdown");
    expect(next.ball?.held).toBe(true);
    expect(next.ball?.holdTimer).toBe(HOLD_TIME);
  });

  it("keeps debug poses immutable and reports derived ball speed", () => {
    const { state, debug } = setup();
    const posed = debug.setBallVelocity(state, 3, 4);
    expect(state.ball?.vx).toBe(0);
    expect(debug.snapshot(posed).ball?.speed).toBe(5);
    const clear = debug.clearWorld(posed);
    expect(debug.snapshot(clear).ball).toBeNull();
    expect(debug.snapshot(clear).obstacles).toEqual([]);
  });
});
