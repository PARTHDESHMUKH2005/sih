import { useState } from "react";
import { login } from "../api";
import type { Session } from "../types";

interface LoginScreenProps {
  onLogin: (session: Session) => void;
}

const DEMO_LOGINS = [
  { label: "NDRF/MHA Admin", email: "admin@bhoomi.gov.in", password: "changeme-admin" },
  { label: "State DM Official (Uttarakhand)", email: "sdma-uk@bhoomi.gov.in", password: "changeme-sdma" },
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
      <div className="login-card">
        <h1>Bhoomi Suraksha</h1>
        <p className="subtitle">Hazard Red-Zone &amp; Relocation Decision Support</p>
        <form onSubmit={(e) => submit(e)}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="demo-logins">
          <p>Demo logins:</p>
          {DEMO_LOGINS.map((d) => (
            <button
              key={d.email}
              type="button"
              className="demo-login-button"
              onClick={(e) => submit(e, d.email, d.password)}
            >
              {d.label}
            </button>
          ))}
          <button
            type="button"
            className="demo-login-button"
            onClick={() =>
              onLogin({ accessToken: "", refreshToken: "", role: "public_viewer", stateCode: null, email: "" })
            }
          >
            Continue as Public Viewer (no login)
          </button>
        </div>
      </div>
    </div>
  );
}
