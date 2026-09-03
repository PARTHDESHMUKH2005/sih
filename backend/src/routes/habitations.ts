import { Router } from "express";
import { habitations } from "../data/seed.js";
import { authenticate, requireRole, resolveStateScope } from "../middleware/auth.js";

export const habitationsRouter = Router();

habitationsRouter.use(authenticate, requireRole("admin", "state_official"));

habitationsRouter.get("/", (req, res) => {
  const { district, tier } = req.query;
  const state = resolveStateScope(req.auth!, req.query.state as string | undefined);
  const filtered = habitations.filter(
    (h) =>
      (!state || h.state === state) &&
      (!district || h.district === district) &&
      (!tier || h.tier === tier),
  );

  res.json({
    type: "FeatureCollection",
    features: filtered.map((h) => ({
      type: "Feature",
      id: h.id,
      properties: {
        name: h.name,
        state: h.state,
        district: h.district,
        population: h.population,
        hazardScores: h.hazardScores,
        exposureScore: h.exposureScore,
        disasterHistoryScore: h.disasterHistoryScore,
        priorityScore: h.priorityScore,
        tier: h.tier,
        suggestedSiteIds: h.suggestedSiteIds,
      },
      geometry: h.geometry,
    })),
  });
});

habitationsRouter.get("/:id", (req, res) => {
  const habitation = habitations.find((h) => h.id === req.params.id);
  const allowedState = resolveStateScope(req.auth!, habitation?.state);
  if (!habitation || (req.auth!.role === "state_official" && habitation.state !== allowedState)) {
    return res.status(404).json({ error: "Habitation not found" });
  }
  res.json(habitation);
});
