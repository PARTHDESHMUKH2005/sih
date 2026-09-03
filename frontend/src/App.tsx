import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { getHazardZones, getHabitations, getPrioritization, getSites, getSummary } from "./api";
import { Legend } from "./components/Legend";
import { LoginScreen } from "./components/LoginScreen";
import { MapView } from "./components/MapView";
import { PrioritizationPanel } from "./components/PrioritizationPanel";
import type { PrioritizationItem, Session, Summary } from "./types";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [hazardZones, setHazardZones] = useState<GeoJSON.FeatureCollection | null>(null);
  const [habitations, setHabitations] = useState<GeoJSON.FeatureCollection | null>(null);
  const [sites, setSites] = useState<GeoJSON.FeatureCollection | null>(null);
  const [prioritization, setPrioritization] = useState<PrioritizationItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSeeHabitationData = session?.role === "admin" || session?.role === "state_official";

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function load() {
      try {
        const [hz, sum, siteData] = await Promise.all([getHazardZones(), getSummary(), getSites()]);
        if (cancelled) return;
        setHazardZones(hz);
        setSummary(sum);
        setSites(siteData);

        if (canSeeHabitationData && session) {
          const [hab, prio] = await Promise.all([getHabitations(session), getPrioritization(session)]);
          if (cancelled) return;
          setHabitations(hab);
          setPrioritization(prio);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load data");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [session, canSeeHabitationData]);

  const handleSelect = useCallback((id: string) => setSelectedId(id), []);

  if (!session) {
    return <LoginScreen onLogin={setSession} />;
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <h1>Bhoomi Suraksha</h1>
        <div className="topbar-right">
          <span className="role-badge">{session.role.replace("_", " ")}</span>
          {session.stateCode && <span className="state-badge">{session.stateCode}</span>}
          <button className="logout-button" onClick={() => setSession(null)}>
            Sign out
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {summary && (
        <div className="summary-bar">
          <span>
            {summary.district}, {summary.state}
          </span>
          <span>{summary.habitationCount} habitations</span>
          <span>{summary.totalPopulationExposed.toLocaleString()} people exposed</span>
          <span>{summary.hazardZoneCount} hazard zones</span>
        </div>
      )}

      <div className="dashboard-body">
        <div className="map-column">
          <MapView
            hazardZones={hazardZones}
            habitations={canSeeHabitationData ? habitations : null}
            sites={sites}
            onSelectHabitation={handleSelect}
          />
          <Legend />
        </div>
        {canSeeHabitationData && (
          <div className="side-column">
            <PrioritizationPanel items={prioritization} selectedId={selectedId} onSelect={handleSelect} />
          </div>
        )}
        {!canSeeHabitationData && (
          <div className="side-column">
            <div className="panel">
              <h3>Public view</h3>
              <p>
                Aggregated Red Zone map and district summary only. Habitation-level records and
                prioritization lists require a State DM Authority or NDRF/MHA login.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
