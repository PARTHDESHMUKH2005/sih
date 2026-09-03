import type { HazardZone, Habitation, RelocationSite, Tier } from "../types.js";

/**
 * Synthetic "Demo District" seed data (a fictional Himalayan district loosely
 * shaped like Uttarakhand terrain, NOT real government hazard/population data).
 * Stands in for Phases 1-5 (ingestion + scoring) until that pipeline exists,
 * so the API and dashboard have something real to render.
 */

export const DEMO_STATE = "Uttarakhand";
export const DEMO_DISTRICT = "Demo District";

export function deriveTier(priorityScore: number): Tier {
  if (priorityScore >= 75) return "immediate";
  if (priorityScore >= 50) return "short_term";
  return "medium_term";
}

export const hazardZones: HazardZone[] = [
  {
    id: "hz-landslide-1",
    hazardType: "landslide",
    severityScore: 88,
    state: DEMO_STATE,
    district: DEMO_DISTRICT,
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [78.42, 30.32],
          [78.46, 30.32],
          [78.46, 30.35],
          [78.42, 30.35],
          [78.42, 30.32],
        ],
      ],
    },
  },
  {
    id: "hz-flood-1",
    hazardType: "flood",
    severityScore: 71,
    state: DEMO_STATE,
    district: DEMO_DISTRICT,
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [78.5, 30.28],
          [78.55, 30.28],
          [78.55, 30.31],
          [78.5, 30.31],
          [78.5, 30.28],
        ],
      ],
    },
  },
  {
    id: "hz-cloudburst-1",
    hazardType: "cloudburst",
    severityScore: 63,
    state: DEMO_STATE,
    district: DEMO_DISTRICT,
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [78.38, 30.36],
          [78.41, 30.36],
          [78.41, 30.39],
          [78.38, 30.39],
          [78.38, 30.36],
        ],
      ],
    },
  },
];

export const relocationSites: RelocationSite[] = [
  {
    id: "site-1",
    name: "Rampur Bench Site",
    state: DEMO_STATE,
    district: DEMO_DISTRICT,
    suitabilityScore: 82,
    capacityPersons: 600,
    subScores: {
      slope: 85,
      landUse: 80,
      waterAccess: 75,
      infrastructureDistance: 70,
      ownHazardExposure: 95,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [78.48, 30.4],
          [78.5, 30.4],
          [78.5, 30.42],
          [78.48, 30.42],
          [78.48, 30.4],
        ],
      ],
    },
  },
  {
    id: "site-2",
    name: "Kotwal Plateau Site",
    state: DEMO_STATE,
    district: DEMO_DISTRICT,
    suitabilityScore: 64,
    capacityPersons: 350,
    subScores: {
      slope: 60,
      landUse: 70,
      waterAccess: 55,
      infrastructureDistance: 65,
      ownHazardExposure: 90,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [78.44, 30.41],
          [78.46, 30.41],
          [78.46, 30.43],
          [78.44, 30.43],
          [78.44, 30.41],
        ],
      ],
    },
  },
];

interface HabitationSeed {
  id: string;
  name: string;
  population: number;
  hazardScores: Habitation["hazardScores"];
  disasterHistoryScore: number;
  suggestedSiteIds: string[];
  lon: number;
  lat: number;
}

const habitationSeeds: HabitationSeed[] = [
  {
    id: "hab-1",
    name: "Chandpur Basti",
    population: 420,
    hazardScores: { landslide: 90, flood: 20, coastal_erosion: 0, cloudburst: 55 },
    disasterHistoryScore: 85,
    suggestedSiteIds: ["site-1"],
    lon: 78.435,
    lat: 30.333,
  },
  {
    id: "hab-2",
    name: "Nauti Gaon",
    population: 260,
    hazardScores: { landslide: 30, flood: 78, coastal_erosion: 0, cloudburst: 40 },
    disasterHistoryScore: 60,
    suggestedSiteIds: ["site-1", "site-2"],
    lon: 78.52,
    lat: 30.295,
  },
  {
    id: "hab-3",
    name: "Kilbury Tok",
    population: 150,
    hazardScores: { landslide: 25, flood: 15, coastal_erosion: 0, cloudburst: 68 },
    disasterHistoryScore: 35,
    suggestedSiteIds: ["site-2"],
    lon: 78.395,
    lat: 30.375,
  },
  {
    id: "hab-4",
    name: "Barkot Mohalla",
    population: 90,
    hazardScores: { landslide: 15, flood: 10, coastal_erosion: 0, cloudburst: 20 },
    disasterHistoryScore: 10,
    suggestedSiteIds: [],
    lon: 78.47,
    lat: 30.31,
  },
];

function computeExposureScore(hazardScores: Habitation["hazardScores"]): number {
  const values = Object.values(hazardScores);
  return Math.round(Math.max(...values) * 0.6 + (values.reduce((a, b) => a + b, 0) / values.length) * 0.4);
}

function computePriorityScore(exposureScore: number, disasterHistoryScore: number): number {
  // Deterministic weighted combination (Phase 5 placeholder): 55% exposure, 45% history.
  return Math.round(exposureScore * 0.55 + disasterHistoryScore * 0.45);
}

export const habitations: Habitation[] = habitationSeeds.map((seed) => {
  const exposureScore = computeExposureScore(seed.hazardScores);
  const priorityScore = computePriorityScore(exposureScore, seed.disasterHistoryScore);
  return {
    id: seed.id,
    name: seed.name,
    state: DEMO_STATE,
    district: DEMO_DISTRICT,
    population: seed.population,
    hazardScores: seed.hazardScores,
    exposureScore,
    disasterHistoryScore: seed.disasterHistoryScore,
    priorityScore,
    tier: deriveTier(priorityScore),
    suggestedSiteIds: seed.suggestedSiteIds,
    geometry: { type: "Point", coordinates: [seed.lon, seed.lat] },
  };
});
