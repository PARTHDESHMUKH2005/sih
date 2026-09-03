import { useState } from "react";
import { login } from "../api";
import type { Session } from "../types";
import { BrandMark } from "./BrandMark";

interface LoginScreenProps {
  onLogin: (session: Session) => void;
}

const DEMO_LOGINS = [
  { label: "NDRF / MHA Admin", hint: "Full national access", email: "admin@bhoomi.gov.in", password: "changeme-admin" },
  {
    label: "State DM Official",
    hint: "Uttarakhand — scoped access",
    email: "sdma-uk@bhoomi.gov.in",
    password: "changeme-sdma",
  },
];

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent, overrideEmail?: string, overridePassword?: string) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const session = await login(overrideEmail ?? email, overridePassword ?? password);
      onLogin(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-screen-inner">
        <div className="brand-lockup">
          <BrandMark size={44} />
          <div>
            <div className="brand-name">Bhoomi Suraksha</div>
            <div className="brand-tag">Smart India Hackathon 2026 &middot; PS 26191</div>
          </div>
        </div>

        <div className="login-card">
          <h1>Sign in</h1>
          <p className="subtitle">Hazard Red-Zone &amp; Relocation Decision Support</p>
          <form onSubmit={(e) => submit(e)}>
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@bhoomi.gov.in" required />
            </label>
            <label>
              Password
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" required />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="divider">
            <span>Demo access</span>
          </div>

          <div className="demo-logins">
            {DEMO_LOGINS.map((d) => (
              <button key={d.email} type="button" className="demo-login-button" onClick={(e) => submit(e, d.email, d.password)}>
                <span className="demo-login-label">{d.label}</span>
                <span className="demo-login-hint">{d.hint}</span>
              </button>
            ))}
            <button
              type="button"
              className="demo-login-button viewer"
              onClick={() => onLogin({ accessToken: "", refreshToken: "", role: "public_viewer", stateCode: null, email: "" })}
            >
              <span className="demo-login-label">Public Viewer</span>
              <span className="demo-login-hint">No login required — aggregated view only</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
