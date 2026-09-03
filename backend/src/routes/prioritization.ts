import { Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../db.js";
import { parsePagination } from "../gis.js";
import { authenticate, requireRole, resolveStateScope } from "../middleware/auth.js";
import type { Tier } from "../types.js";

const VALID_TIERS: Tier[] = ["immediate", "short_term", "medium_term"];

export const prioritizationRouter = Router();

prioritizationRouter.use(authenticate, requireRole("admin", "state_official"));

interface PrioritizationRow {
  habitationId: string;
  name: string;
  stateCode: string;
  districtCode: string;
  population: number;
  tier: Tier;
  priorityScore: number;
  componentScores: unknown;
  suggestedSiteIds: string[];
}

/**
 * @openapi
 * /prioritization:
 *   get:
 *     summary: Ranked relocation priorities
 *     tags: [Prioritization]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: state
 *         schema: { type: string }
 *       - in: query
 *         name: tier
 *         schema: { type: string, enum: [immediate, short_term, medium_term] }
 *     responses:
 *       200: { description: Ranked list of habitations with component scores and suggested sites }
 */
prioritizationRouter.get("/", async (req, res) => {
  const { tier } = req.query;
  const state = resolveStateScope(req.auth!, req.query.state as string | undefined);
  const { limit, offset } = parsePagination(req.query);

  const conditions: Prisma.Sql[] = [];
  if (state) conditions.push(Prisma.sql`h."stateCode" = ${state}`);
  if (typeof tier === "string") conditions.push(Prisma.sql`pr.tier = ${tier}::"Tier"`);
  const whereClause = conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}` : Prisma.empty;

  const rows = await prisma.$queryRaw<PrioritizationRow[]>`
    SELECT
      pr."habitationId", h.name, h."stateCode", h."districtCode", h.population,
      pr.tier, pr."priorityScore", pr."componentScores", pr."suggestedSiteIds"
    FROM prioritization_results pr
    JOIN habitations h ON h.id = pr."habitationId"
    ${whereClause}
    ORDER BY CASE pr.tier WHEN 'immediate' THEN 0 WHEN 'short_term' THEN 1 ELSE 2 END, pr."priorityScore" DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const siteIds = [...new Set(rows.flatMap((r) => r.suggestedSiteIds))];
  const sites = siteIds.length
    ? await prisma.$queryRaw<{ id: string; name: string; suitabilityScore: number; capacityPersons: number }[]>`
        SELECT id, name, "suitabilityScore", "capacityPersons" FROM relocation_sites WHERE id IN (${Prisma.join(siteIds)})
      `
    : [];
  const siteById = new Map(sites.map((s) => [s.id, s]));

  res.json(
    rows.map((r) => ({
      habitationId: r.habitationId,
      name: r.name,
      state: r.stateCode,
      district: r.districtCode,
      population: r.population,
      tier: r.tier,
      priorityScore: r.priorityScore,
      componentScores: r.componentScores,
      suggestedSites: r.suggestedSiteIds.map((id) => siteById.get(id)).filter(Boolean),
    })),
  );
});

/**
 * @openapi
 * /prioritization/{id}/review:
 *   post:
 *     summary: Record a review action on a habitation's prioritization (audited)
 *     tags: [Prioritization]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [justification]
 *             properties:
 *               tier: { type: string, enum: [immediate, short_term, medium_term] }
 *               justification: { type: string }
 *     responses:
 *       200: { description: Updated tier and the audit log entry it created }
 *       400: { description: Missing justification or invalid tier }
 *       404: { description: Habitation not found or outside the caller's state scope }
 */
prioritizationRouter.post("/:id/review", async (req, res) => {
  const [habitation] = await prisma.$queryRaw<{ id: string; stateCode: string }[]>`
    SELECT id, "stateCode" FROM habitations WHERE id = ${req.params.id}
  `;
  const allowedState = resolveStateScope(req.auth!, habitation?.stateCode);
  if (!habitation || (req.auth!.role === "state_official" && habitation.stateCode !== allowedState)) {
    return res.status(404).json({ error: "Habitation not found" });
  }

  const { tier, justification } = req.body ?? {};
  if (typeof justification !== "string" || justification.trim().length === 0) {
    return res.status(400).json({ error: "justification is required for any prioritization action" });
  }
  if (tier !== undefined && !VALID_TIERS.includes(tier)) {
    return res.status(400).json({ error: `tier must be one of ${VALID_TIERS.join(", ")}` });
  }

  const [current] = await prisma.$queryRaw<{ tier: Tier }[]>`
    SELECT tier FROM prioritization_results WHERE "habitationId" = ${habitation.id}
  `;
  const previousTier = current?.tier;
  const newTier: Tier | undefined = tier ?? previousTier;

  if (tier) {
    await prisma.$executeRaw`
      UPDATE prioritization_results SET tier = ${tier}::"Tier" WHERE "habitationId" = ${habitation.id}
    `;
  }

  const auditEntry = await prisma.auditLog.create({
    data: {
      actorEmail: req.auth!.email,
      action: tier ? "tier_adjusted" : "reviewed",
      habitationId: habitation.id,
      previousTier,
      newTier,
      justification,
    },
  });

  res.json({ habitationId: habitation.id, tier: newTier, auditEntry });
});
