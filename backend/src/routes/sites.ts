import { Router } from "express";
import { relocationSites } from "../data/seed.js";

export const sitesRouter = Router();

sitesRouter.get("/", (req, res) => {
  const { minScore } = req.query;
  const min = minScore ? Number(minScore) : 0;
  const filtered = relocationSites.filter((s) => s.suitabilityScore >= min);

  res.json({
    type: "FeatureCollection",
    features: filtered.map((s) => ({
      type: "Feature",
      id: s.id,
      properties: {
        name: s.name,
        state: s.state,
        district: s.district,
        suitabilityScore: s.suitabilityScore,
        capacityPersons: s.capacityPersons,
        subScores: s.subScores,
      },
      geometry: s.geometry,
    })),
  });
});
