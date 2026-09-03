import type { PrioritizationItem, Tier } from "../types";

const TIER_LABELS: Record<Tier, string> = {
  immediate: "Immediate",
  short_term: "Short-term",
  medium_term: "Medium-term",
};

interface PrioritizationPanelProps {
  items: PrioritizationItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PrioritizationPanel({ items, selectedId, onSelect }: PrioritizationPanelProps) {
  if (items.length === 0) {
    return <div className="panel">No prioritization results for this filter.</div>;
  }

  return (
    <div className="panel">
      <h3>Relocation priorities</h3>
      <ul className="priority-list">
        {items.map((item) => (
          <li
            key={item.habitationId}
            className={`priority-item tier-${item.tier} ${item.habitationId === selectedId ? "selected" : ""}`}
            onClick={() => onSelect(item.habitationId)}
          >
            <div className="priority-item-header">
              <span className="tier-badge">{TIER_LABELS[item.tier]}</span>
              <strong>{item.name}</strong>
              <span className="score">score {item.priorityScore}</span>
            </div>
            <div className="priority-item-detail">
              {item.district}, {item.state} · population {item.population}
            </div>
            {item.habitationId === selectedId && (
              <div className="priority-item-expanded">
                <p>
                  Exposure {item.componentScores.exposureScore} · Disaster history{" "}
                  {item.componentScores.disasterHistoryScore}
                </p>
                <ul className="hazard-score-list">
                  {Object.entries(item.componentScores.hazardScores).map(([hazardType, score]) => (
                    <li key={hazardType}>
                      <span>{hazardType.replace("_", " ")}</span>
                      <span>{score}</span>
                    </li>
                  ))}
                </ul>
                {item.suggestedSites.length > 0 && (
                  <p>
                    Suggested site:{" "}
                    {item.suggestedSites
                      .map((s) => `${s.name} (suitability ${s.suitabilityScore}, capacity ${s.capacityPersons})`)
                      .join("; ")}
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
