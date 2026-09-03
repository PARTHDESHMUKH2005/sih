import type { PrioritizationItem, Session, Summary } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export async function login(email: string, password: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Login failed");
  }
  const data = await res.json();
  return { ...data, email };
}

async function authedFetch(path: string, session: Session | null) {
  const headers: Record<string, string> = {};
  if (session) headers.Authorization = `Bearer ${session.accessToken}`;
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function getHazardZones() {
  return authedFetch("/hazards", null) as Promise<GeoJSON.FeatureCollection>;
}

export function getSummary() {
  return authedFetch("/summary", null) as Promise<Summary>;
}

export function getPrioritization(session: Session) {
  return authedFetch("/prioritization", session) as Promise<PrioritizationItem[]>;
}

export function getHabitations(session: Session) {
  return authedFetch("/habitations", session) as Promise<GeoJSON.FeatureCollection>;
}

export function getSites() {
  return authedFetch("/sites", null) as Promise<GeoJSON.FeatureCollection>;
}
