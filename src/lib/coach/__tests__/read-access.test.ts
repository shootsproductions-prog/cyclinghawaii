// Who reaches the model through /api/coach/read.
//
// Every AI read is billed to the site's Anthropic key, so the route
// stays off until COACH_AI switches it on, and "owner" must really
// mean the owner alone. Identity, the model call and the summary
// check are stubbed; the gating in the route is what is under test.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CoachIdentity } from "@/lib/coach/access";

const state = vi.hoisted(() => ({ who: null as unknown }));

vi.mock("@/lib/coach/access", () => ({
  identify: vi.fn(async () => state.who),
}));

vi.mock("@/lib/coach/claude", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/coach/claude")>()),
  claudeRead: vi.fn(async () => ({ ok: true, read: { headline: "stub" } })),
}));

vi.mock("@/lib/coach/summary", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/coach/summary")>()),
  sanitizeSummary: vi.fn(() => ({ stub: true })),
}));

import { GET, POST } from "@/app/api/coach/read/route";
import { claudeRead, coachAiAudience } from "@/lib/coach/claude";

const OWNER: CoachIdentity = { kind: "owner", key: "owner" };
let caller = 0;
/** A fresh key each time so one test never trips another's hourly limit. */
const member = (): CoachIdentity => ({ kind: "member", key: `user:m${++caller}` });
const rider = (): CoachIdentity => ({ kind: "rider", key: `user:r${++caller}`, athleteId: 42 });

function post() {
  return POST(
    new Request("http://localhost/api/coach/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: {} }),
    })
  );
}

beforeEach(() => {
  state.who = null;
  vi.mocked(claudeRead).mockClear();
  vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  vi.stubEnv("COACH_AI", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("coachAiAudience", () => {
  it("is off when the key exists but COACH_AI is not set", () => {
    expect(coachAiAudience()).toBe("off");
  });

  it("is off for values it does not know", () => {
    for (const value of ["yes", "true", "1", "everyone", "on"]) {
      vi.stubEnv("COACH_AI", value);
      expect(coachAiAudience()).toBe("off");
    }
  });

  it("reads owner and signed-in, ignoring case and spaces", () => {
    vi.stubEnv("COACH_AI", " Owner ");
    expect(coachAiAudience()).toBe("owner");
    vi.stubEnv("COACH_AI", "SIGNED-IN");
    expect(coachAiAudience()).toBe("signed-in");
  });

  it("is off without an API key whatever COACH_AI says", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("COACH_AI", "signed-in");
    expect(coachAiAudience()).toBe("off");
  });
});

describe("/api/coach/read with COACH_AI unset", () => {
  it("reports itself as off and never calls the model", async () => {
    expect(await (await GET()).json()).toEqual({ configured: false, audience: "off", owner: false });

    state.who = OWNER;
    const res = await post();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "not-configured" });
    expect(claudeRead).not.toHaveBeenCalled();
  });
});

describe("/api/coach/read with COACH_AI=owner", () => {
  beforeEach(() => vi.stubEnv("COACH_AI", "owner"));

  it("tells the page whether the session is the owner's", async () => {
    expect(await (await GET()).json()).toEqual({ configured: true, audience: "owner", owner: false });
    state.who = member();
    expect(await (await GET()).json()).toEqual({ configured: true, audience: "owner", owner: false });
    state.who = OWNER;
    expect(await (await GET()).json()).toEqual({ configured: true, audience: "owner", owner: true });
  });

  it("refuses anonymous callers", async () => {
    const res = await post();
    expect(res.status).toBe(401);
    expect(claudeRead).not.toHaveBeenCalled();
  });

  it("refuses signed-in visitors and riders without calling the model", async () => {
    for (const who of [member(), rider()]) {
      state.who = who;
      const res = await post();
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "owner-only" });
    }
    expect(claudeRead).not.toHaveBeenCalled();
  });

  it("lets the owner through", async () => {
    state.who = OWNER;
    const res = await post();
    expect(res.status).toBe(200);
    expect(claudeRead).toHaveBeenCalledTimes(1);
  });
});

describe("/api/coach/read with COACH_AI=signed-in", () => {
  beforeEach(() => vi.stubEnv("COACH_AI", "signed-in"));

  it("still refuses anonymous callers", async () => {
    const res = await post();
    expect(res.status).toBe(401);
    expect(claudeRead).not.toHaveBeenCalled();
  });

  it("lets signed-in visitors, riders and the owner through", async () => {
    for (const who of [member(), rider(), OWNER]) {
      state.who = who;
      expect((await post()).status).toBe(200);
    }
    expect(claudeRead).toHaveBeenCalledTimes(3);
  });
});
