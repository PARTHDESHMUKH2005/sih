import { Router } from "express";
import { hazardZones } from "../data/seed.js";

export const hazardsRouter = Router();

hazardsRouter.get("/", (req, res) => {
  const { type } = req.query;
  const filtered = type ? hazardZones.filter((h) => h.hazardType === type) : hazardZones;

  res.json({
    type: "FeatureCollection",
    features: filtered.map((h) => ({
      type: "Feature",
      id: h.id,
      properties: {
        hazardType: h.hazardType,
        severityScore: h.severityScore,
        state: h.state,
        district: h.district,
      },
      geometry: h.geometry,
    })),
  });
});
