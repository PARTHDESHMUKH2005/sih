import { Router } from "express";
import { habitations, hazardZones } from "../data/seed.js";

export const summaryRouter = Router();

summaryRouter.get("/", (req, res) => {
  const { level = "district" } = req.query;

  const totalPopulation = habitations.reduce((sum, h) => sum + h.population, 0);
  const tierCounts = habitations.reduce<Record<string, number>>((acc, h) => {
    acc[h.tier] = (acc[h.tier] ?? 0) + 1;
    return acc;
  }, {});

  res.json({
    level,
    state: habitations[0]?.state,
    district: habitations[0]?.district,
    habitationCount: habitations.length,
    totalPopulationExposed: totalPopulation,
    tierCounts,
    hazardZoneCount: hazardZones.length,
    hazardTypesPresent: [...new Set(hazardZones.map((h) => h.hazardType))],
  });
});
