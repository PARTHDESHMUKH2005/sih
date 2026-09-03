const HAZARD_ITEMS: [string, string][] = [
  ["Landslide", "#b0413e"],
  ["Flood", "#2b6cb0"],
  ["Coastal erosion", "#805ad5"],
  ["Cloudburst", "#38a169"],
];

const TIER_ITEMS: [string, string][] = [
  ["Immediate", "#c53030"],
  ["Short-term", "#dd6b20"],
  ["Medium-term", "#d69e2e"],
];

export function Legend() {
  return (
    <div className="legend">
      <div className="legend-group">
        <h4>Hazard zones</h4>
        {HAZARD_ITEMS.map(([label, color]) => (
          <div className="legend-row" key={label}>
            <span className="swatch" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>
      <div className="legend-group">
        <h4>Priority tier</h4>
        {TIER_ITEMS.map(([label, color]) => (
          <div className="legend-row" key={label}>
            <span className="swatch round" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
