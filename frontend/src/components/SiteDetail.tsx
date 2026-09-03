export interface SiteFeatureProperties {
  name: string;
  suitabilityScore: number;
  capacityPersons: number;
  subScores: {
    slope: number;
    landUse: number;
    waterAccess: number;
    infrastructureDistance: number;
    ownHazardExposure: number;
  };
}

interface SiteDetailProps {
  site: SiteFeatureProperties | null;
  onClose: () => void;
}

const SUB_SCORE_LABELS: [keyof SiteFeatureProperties["subScores"], string][] = [
  ["slope", "Slope"],
  ["landUse", "Land use"],
  ["waterAccess", "Water access"],
  ["infrastructureDistance", "Infrastructure distance"],
  ["ownHazardExposure", "Own hazard exposure"],
];

export function SiteDetail({ site, onClose }: SiteDetailProps) {
  if (!site) return null;

  return (
    <div className="panel site-detail">
      <div className="site-detail-header">
        <h3>{site.name}</h3>
        <button className="close-button" onClick={onClose} aria-label="Close">
          &times;
        </button>
      </div>
      <p>
        Suitability <strong>{site.suitabilityScore}</strong> · Capacity{" "}
        <strong>{site.capacityPersons.toLocaleString()}</strong> persons
      </p>
      <ul className="sub-score-list">
        {SUB_SCORE_LABELS.map(([key, label]) => (
          <li key={key}>
            <span>{label}</span>
            <span>{site.subScores[key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
