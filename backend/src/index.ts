import "./env.js";

import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { habitationsRouter } from "./routes/habitations.js";
import { hazardsRouter } from "./routes/hazards.js";
import { prioritizationRouter } from "./routes/prioritization.js";
import { sitesRouter } from "./routes/sites.js";
import { summaryRouter } from "./routes/summary.js";

const app = express();
const port = Number(process.env.BACKEND_PORT ?? 8000);

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/hazards", hazardsRouter);
app.use("/api/habitations", habitationsRouter);
app.use("/api/prioritization", prioritizationRouter);
app.use("/api/sites", sitesRouter);
app.use("/api/summary", summaryRouter);

app.listen(port, () => {
  console.log(`Bhoomi Suraksha backend listening on http://localhost:${port}`);
  console.log("Serving in-memory demo seed data (Phase 7 DB wiring not yet connected).");
});
