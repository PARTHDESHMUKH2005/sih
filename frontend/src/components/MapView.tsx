import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

const HAZARD_COLORS: Record<string, string> = {
  landslide: "#b0413e",
  flood: "#2b6cb0",
  coastal_erosion: "#805ad5",
  cloudburst: "#38a169",
};

interface MapViewProps {
  hazardZones: GeoJSON.FeatureCollection | null;
  habitations: GeoJSON.FeatureCollection | null;
  sites: GeoJSON.FeatureCollection | null;
  onSelectHabitation: (id: string) => void;
}

export function MapView({ hazardZones, habitations, sites, onSelectHabitation }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [78.46, 30.34],
      zoom: 10.5,
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hazardZones) return;

    const apply = () => {
      if (map.getSource("hazard-zones")) {
        (map.getSource("hazard-zones") as maplibregl.GeoJSONSource).setData(hazardZones);
        return;
      }
      map.addSource("hazard-zones", { type: "geojson", data: hazardZones });
      map.addLayer({
        id: "hazard-zones-fill",
        type: "fill",
        source: "hazard-zones",
        paint: {
          "fill-color": [
            "match",
            ["get", "hazardType"],
            "landslide", HAZARD_COLORS.landslide,
            "flood", HAZARD_COLORS.flood,
            "coastal_erosion", HAZARD_COLORS.coastal_erosion,
            "cloudburst", HAZARD_COLORS.cloudburst,
            "#999999",
          ],
          "fill-opacity": 0.45,
        },
      });
      map.addLayer({
        id: "hazard-zones-outline",
        type: "line",
        source: "hazard-zones",
        paint: { "line-color": "#222", "line-width": 1 },
      });
    };

    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [hazardZones]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sites) return;
    const apply = () => {
      if (map.getSource("sites")) {
        (map.getSource("sites") as maplibregl.GeoJSONSource).setData(sites);
        return;
      }
      map.addSource("sites", { type: "geojson", data: sites });
      map.addLayer({
        id: "sites-fill",
        type: "fill",
        source: "sites",
        paint: { "fill-color": "#2f855a", "fill-opacity": 0.35 },
      });
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [sites]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !habitations) return;

    const apply = () => {
      if (map.getSource("habitations")) {
        (map.getSource("habitations") as maplibregl.GeoJSONSource).setData(habitations);
        return;
      }
      map.addSource("habitations", { type: "geojson", data: habitations });
      map.addLayer({
        id: "habitations-points",
        type: "circle",
        source: "habitations",
        paint: {
          "circle-radius": 8,
          "circle-color": [
            "match",
            ["get", "tier"],
            "immediate", "#c53030",
            "short_term", "#dd6b20",
            "medium_term", "#d69e2e",
            "#718096",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
      map.on("click", "habitations-points", (e: maplibregl.MapLayerMouseEvent) => {
        const id = e.features?.[0]?.id;
        if (id) onSelectHabitation(String(id));
      });
      map.on("mouseenter", "habitations-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "habitations-points", () => {
        map.getCanvas().style.cursor = "";
      });
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [habitations, onSelectHabitation]);

  return <div ref={containerRef} className="map-container" />;
}
