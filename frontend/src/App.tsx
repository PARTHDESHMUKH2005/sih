import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { getHazardZones, getHabitations, getPrioritization, getSites, getSummary } from "./api";
import { Filters } from "./components/Filters";
import { Legend } from "./components/Legend";
import { LoginScreen } from "./components/LoginScreen";
import { MapView } from "./components/MapView";
import { PrioritizationPanel } from "./components/PrioritizationPanel";
import { SiteDetail, type SiteFeatureProperties } from "./components/SiteDetail";
import { exportPrioritizationCsv, exportPrioritizationGeoJson } from "./lib/export";
import type { HazardType, PrioritizationItem, Session, Summary, Tier } from "./types";

const ALL_HAZARDS_VISIBLE: Record<HazardType, boolean> = {
  landslide: true,
  flood: true,
  coastal_erosion: true,
  cloudburst: true,
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [hazardZones, setHazardZones] = useState<GeoJSON.FeatureCollection | null>(null);
  const [habitations, setHabitations] = useState<GeoJSON.FeatureCollection | null>(null);
  const [sites, setSites] = useState<GeoJSON.FeatureCollection | null>(null);
  const [prioritization, setPrioritization] = useState<PrioritizationItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [districtFilter, setDistrictFilter] = useState("");
  const [tierFilter, setTierFilter] = useState<Tier | "">("");
  const [hazardVisibility, setHazardVisibility] = useState(ALL_HAZARDS_VISIBLE);
  const [hazardOpacity, setHazardOpacity] = useState(0.45);

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
          const filters = { district: districtFilter || undefined, tier: tierFilter || undefined };
          const [hab, prio] = await Promise.all([getHabitations(session, filters), getPrioritization(session, filters)]);
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
  }, [session, canSeeHabitationData, districtFilter, tierFilter]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setSelectedSiteId(null);
  }, []);

  const handleSelectSite = useCallback((id: string) => {
    setSelectedSiteId(id);
    setSelectedId(null);
  }, []);

  const handleToggleHazard = useCallback((type: HazardType) => {
    setHazardVisibility((prev) => ({ ...prev, [type]: !prev[type] }));
  }, []);

  if (!session) {
    return <LoginScreen onLogin={setSession} />;
  }

  const selectedSiteFeature = sites?.features.find((f) => String(f.id) === selectedSiteId);

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

      {canSeeHabitationData && (
        <Filters
          district={districtFilter}
          onDistrictChange={setDistrictFilter}
          tier={tierFilter}
          onTierChange={setTierFilter}
          hazardVisibility={hazardVisibility}
          onToggleHazard={handleToggleHazard}
          opacity={hazardOpacity}
          onOpacityChange={setHazardOpacity}
        />
      )}

      <div className="dashboard-body">
        <div className="map-column">
          <MapView
            hazardZones={hazardZones}
            habitations={canSeeHabitationData ? habitations : null}
            sites={sites}
            onSelectHabitation={handleSelect}
            onSelectSite={handleSelectSite}
            hazardVisibility={hazardVisibility}
            hazardOpacity={hazardOpacity}
          />
          <Legend />
          {selectedSiteFeature && (
            <div className="site-detail-overlay">
              <SiteDetail
                site={selectedSiteFeature.properties as unknown as SiteFeatureProperties}
                onClose={() => setSelectedSiteId(null)}
              />
            </div>
          )}
        </div>
        {canSeeHabitationData && (
          <div className="side-column">
            <div className="export-bar">
              <button onClick={() => exportPrioritizationCsv(prioritization)}>Export CSV</button>
              <button onClick={() => exportPrioritizationGeoJson(prioritization, habitations)}>Export GeoJSON</button>
            </div>
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
