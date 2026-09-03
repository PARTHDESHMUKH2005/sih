import argon2 from "argon2";

export type Role = "admin" | "state_official" | "public_viewer";

export interface DemoUser {
  email: string;
  role: Role;
  stateCode: string | null;
  passwordHash: string;
}

interface DemoUserSeed {
  email: string;
  role: Role;
  stateCode: string | null;
  password: string;
}

const DEMO_USER_SEEDS: DemoUserSeed[] = [
  { email: "admin@bhoomi.gov.in", role: "admin", stateCode: null, password: "changeme-admin" },
  { email: "sdma-uk@bhoomi.gov.in", role: "state_official", stateCode: "Uttarakhand", password: "changeme-sdma" },
  { email: "viewer@bhoomi.gov.in", role: "public_viewer", stateCode: null, password: "changeme-viewer" },
];

let usersPromise: Promise<DemoUser[]> | null = null;

/**
 * Hardcoded demo users standing in for Phase 8's user table. Passwords are
 * hashed once, lazily, on first use rather than committed as plaintext.
 */
export function getDemoUsers(): Promise<DemoUser[]> {
  if (!usersPromise) {
    usersPromise = Promise.all(
      DEMO_USER_SEEDS.map(async (seed) => ({
        email: seed.email,
        role: seed.role,
        stateCode: seed.stateCode,
        passwordHash: await argon2.hash(seed.password),
      })),
    );
  }
  return usersPromise;
}
