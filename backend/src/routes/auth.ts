import argon2 from "argon2";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { getDemoUsers } from "../data/users.js";
import type { AuthClaims } from "../middleware/auth.js";

export const authRouter = Router();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "dev-only-insecure-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "dev-only-insecure-refresh-secret";
const ACCESS_TTL = Number(process.env.JWT_ACCESS_TTL ?? 900);
const REFRESH_TTL = Number(process.env.JWT_REFRESH_TTL ?? 1209600);

function issueTokens(claims: AuthClaims) {
  return {
    accessToken: jwt.sign(claims, ACCESS_SECRET, { expiresIn: ACCESS_TTL }),
    refreshToken: jwt.sign(claims, REFRESH_SECRET, { expiresIn: REFRESH_TTL }),
  };
}

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "email and password are required" });
  }

  const users = await getDemoUsers();
  const user = users.find((u) => u.email === email);
  const passwordValid = user ? await argon2.verify(user.passwordHash, password) : false;

  if (!user || !passwordValid) {
    // Generic message on failed auth (README section 4) — don't reveal which field was wrong.
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const claims: AuthClaims = { email: user.email, role: user.role, stateCode: user.stateCode };
  res.json({ ...issueTokens(claims), role: user.role, stateCode: user.stateCode });
});

authRouter.post("/refresh", (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (typeof refreshToken !== "string") {
    return res.status(400).json({ error: "refreshToken is required" });
  }

  try {
    const claims = jwt.verify(refreshToken, REFRESH_SECRET) as AuthClaims;
    // NOTE: this demo does not persist/rotate refresh tokens server-side yet —
    // Phase 8 adds the DB-backed rotation + revocation table described in the README.
    res.json(issueTokens({ email: claims.email, role: claims.role, stateCode: claims.stateCode }));
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

authRouter.post("/logout", (_req, res) => {
  // Stateless for now; real revocation lands with the Phase 8 refresh-token store.
  res.status(204).send();
});
