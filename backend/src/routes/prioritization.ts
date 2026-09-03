import { Router } from "express";
import { recordAuditEntry } from "../data/auditLog.js";
import { habitations, relocationSites } from "../data/seed.js";
import { authenticate, requireRole, resolveStateScope } from "../middleware/auth.js";
import type { Tier } from "../types.js";

const VALID_TIERS: Tier[] = ["immediate", "short_term", "medium_term"];

export const prioritizationRouter = Router();

prioritizationRouter.use(authenticate, requireRole("admin", "state_official"));

const tierOrder: Record<string, number> = { immediate: 0, short_term: 1, medium_term: 2 };

prioritizationRouter.get("/", (req, res) => {
  const { tier } = req.query;
  const state = resolveStateScope(req.auth!, req.query.state as string | undefined);
  const filtered = habitations
    .filter((h) => (!state || h.state === state) && (!tier || h.tier === tier))
    .sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier] || b.priorityScore - a.priorityScore);

  res.json(
    filtered.map((h) => ({
      habitationId: h.id,
      name: h.name,
      state: h.state,
      district: h.district,
      population: h.population,
      tier: h.tier,
      priorityScore: h.priorityScore,
      componentScores: {
        exposureScore: h.exposureScore,
        disasterHistoryScore: h.disasterHistoryScore,
        hazardScores: h.hazardScores,
      },
      suggestedSites: relocationSites.filter((s) => h.suggestedSiteIds.includes(s.id)),
    })),
  );
});

prioritizationRouter.post("/:id/review", (req, res) => {
  const habitation = habitations.find((h) => h.id === req.params.id);
  const allowedState = resolveStateScope(req.auth!, habitation?.state);
  if (!habitation || (req.auth!.role === "state_official" && habitation.state !== allowedState)) {
    return res.status(404).json({ error: "Habitation not found" });
  }

  const { tier, justification } = req.body ?? {};
  if (typeof justification !== "string" || justification.trim().length === 0) {
    return res.status(400).json({ error: "justification is required for any prioritization action" });
  }
  if (tier !== undefined && !VALID_TIERS.includes(tier)) {
    return res.status(400).json({ error: `tier must be one of ${VALID_TIERS.join(", ")}` });
  }

  const previousTier = habitation.tier;
  if (tier) {
    habitation.tier = tier;
  }

  const entry = recordAuditEntry({
    actorEmail: req.auth!.email,
    action: tier ? "tier_adjusted" : "reviewed",
    habitationId: habitation.id,
    previousTier,
    newTier: habitation.tier,
    justification,
  });

  res.json({ habitationId: habitation.id, tier: habitation.tier, auditEntry: entry });
});
