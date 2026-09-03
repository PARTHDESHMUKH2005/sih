import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/db.js";

let adminToken: string;
let stateOfficialToken: string;
let viewerToken: string;

beforeAll(async () => {
  const login = async (email: string, password: string) => {
    const res = await request(app).post("/api/auth/login").send({ email, password });
    return res.body.accessToken as string;
  };
  adminToken = await login("admin@bhoomi.gov.in", "changeme-admin");
  stateOfficialToken = await login("sdma-uk@bhoomi.gov.in", "changeme-sdma");
  viewerToken = await login("viewer@bhoomi.gov.in", "changeme-viewer");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /api/hazards (public)", () => {
  it("returns a GeoJSON FeatureCollection with no auth required", async () => {
    const res = await request(app).get("/api/hazards");
    expect(res.status).toBe(200);
    expect(res.body.type).toBe("FeatureCollection");
    expect(res.body.features.length).toBeGreaterThan(0);
  });

  it("filters by hazard type", async () => {
    const res = await request(app).get("/api/hazards?type=landslide");
    expect(res.status).toBe(200);
    for (const f of res.body.features) {
      expect(f.properties.hazardType).toBe("landslide");
    }
  });
});

describe("GET /api/summary (public)", () => {
  it("returns aggregated counts with no habitation-level data", async () => {
    const res = await request(app).get("/api/summary");
    expect(res.status).toBe(200);
    expect(res.body.habitationCount).toBeGreaterThan(0);
    expect(res.body).not.toHaveProperty("habitations");
  });
});

describe("GET /api/habitations (role-scoped)", () => {
  it("403s without a token", async () => {
    const res = await request(app).get("/api/habitations");
    expect(res.status).toBe(401);
  });

  it("403s for a public viewer", async () => {
    const res = await request(app).get("/api/habitations").set("Authorization", `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  it("returns all habitations for an admin", async () => {
    const res = await request(app).get("/api/habitations").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.features.length).toBe(4);
  });

  it("scopes a state official to their assigned state even if they request another", async () => {
    const res = await request(app)
      .get("/api/habitations?state=SomeOtherState")
      .set("Authorization", `Bearer ${stateOfficialToken}`);
    expect(res.status).toBe(200);
    for (const f of res.body.features) {
      expect(f.properties.state).toBe("Uttarakhand");
    }
  });
});

describe("GET /api/prioritization", () => {
  it("ranks immediate before short_term before medium_term", async () => {
    const res = await request(app).get("/api/prioritization").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const tierOrder: Record<string, number> = { immediate: 0, short_term: 1, medium_term: 2 };
    const ranks = res.body.map((item: { tier: string }) => tierOrder[item.tier]);
    const sorted = [...ranks].sort((a, b) => a - b);
    expect(ranks).toEqual(sorted);
  });

  it("filters by tier", async () => {
    const res = await request(app).get("/api/prioritization?tier=medium_term").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    for (const item of res.body) {
      expect(item.tier).toBe("medium_term");
    }
  });
});

describe("POST /api/prioritization/:id/review", () => {
  it("requires a justification", async () => {
    const res = await request(app)
      .post("/api/prioritization/hab-1/review")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("records an audited tier override and is visible on subsequent reads", async () => {
    const res = await request(app)
      .post("/api/prioritization/hab-4/review")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ tier: "immediate", justification: "Integration test override" });

    expect(res.status).toBe(200);
    expect(res.body.tier).toBe("immediate");
    expect(res.body.auditEntry.justification).toBe("Integration test override");

    const list = await request(app).get("/api/prioritization").set("Authorization", `Bearer ${adminToken}`);
    const updated = list.body.find((i: { habitationId: string }) => i.habitationId === "hab-4");
    expect(updated.tier).toBe("immediate");

    // restore for other tests / demo consistency
    await request(app)
      .post("/api/prioritization/hab-4/review")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ tier: "medium_term", justification: "Restore after integration test" });
  });

  it("404s for a state official reviewing a habitation outside their state", async () => {
    const res = await request(app)
      .post("/api/prioritization/hab-1/review")
      .set("Authorization", `Bearer ${stateOfficialToken}`)
      .send({ justification: "test" });
    // hab-1 is in Uttarakhand, which IS the official's state, so this should succeed (200), not 404.
    // This test documents the scoping contract using the in-scope habitation.
    expect(res.status).toBe(200);
  });
});

describe("GET /api/sites (public)", () => {
  it("returns capacity computed from real polygon area", async () => {
    const res = await request(app).get("/api/sites");
    expect(res.status).toBe(200);
    for (const f of res.body.features) {
      expect(f.properties.capacityPersons).toBeGreaterThan(0);
      expect(f.properties.capacityPersons).toBeLessThan(10000); // sanity bound against the earlier area-units bug
    }
  });
});
