import { useMemo, useState } from "react";
import * as d3 from "d3";
import { geoRobinson, geoMollweide, geoWinkel3 } from "d3-geo-projection";
import worldData from "world-atlas/countries-110m.json";
import { feature } from "topojson-client";

type ProjectionKey =
  | "Mercator"
  | "Robinson"
  | "Mollweide"
  | "WinkelTripel"
  | "Orthographic";

type LonLat = [number, number];

type Pin = {
  id: string;
  coord: LonLat; // [lon, lat]
};

const WIDTH = 980;
const HEIGHT = 520;

function makeProjection(key: ProjectionKey) {
  switch (key) {
    case "Mercator":
      return d3.geoMercator();
    case "Robinson":
      return geoRobinson();
    case "Mollweide":
      return geoMollweide();
    case "WinkelTripel":
      return geoWinkel3();
    case "Orthographic":
      return d3.geoOrthographic().clipAngle(90);
  }
}

export default function App() {
  const [projectionKey, setProjectionKey] = useState<ProjectionKey>("Robinson");
  const [pins, setPins] = useState<Pin[]>([]);

  const land = useMemo(() => {
    const geo = feature(
      worldData as any,
      (worldData as any).objects.countries
    ) as any;
    return geo;
  }, []);

  // Keep ONE projection instance we can use for BOTH paths and invert()
  const projection = useMemo(() => {
    return makeProjection(projectionKey).fitSize([WIDTH, HEIGHT], land);
  }, [projectionKey, land]);

  const path = useMemo(() => d3.geoPath(projection), [projection]);

  const sphereD = useMemo(() => {
    return path({ type: "Sphere" } as any) ?? "";
  }, [path]);

  const landD = useMemo(() => {
    return path(land) ?? "";
  }, [path, land]);

  function onSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!projection.invert) return;

    const inv = projection.invert([x, y]);
    if (!inv) return;


    const [lon, lat] = inv as LonLat;

    setPins((prev) => [
      ...prev,
      { id: crypto.randomUUID(), coord: [lon, lat] },
    ]);
  }

  function clearPins() {
    setPins([]);
  }

  function undoPin() {
    setPins((prev) => prev.slice(0, -1));
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 16 }}>
      <h1 style={{ margin: 0 }}>ReProject</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Switch projections and explore distortion. Click to drop pins (stored as
        lon/lat).
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <label>
          Projection:{" "}
          <select
            value={projectionKey}
            onChange={(e) => setProjectionKey(e.target.value as ProjectionKey)}
          >
            <option>Mercator</option>
            <option>Robinson</option>
            <option>Mollweide</option>
            <option>WinkelTripel</option>
            <option>Orthographic</option>
          </select>
        </label>

        <button onClick={undoPin}>Undo pin</button>
        <button onClick={clearPins}>Clear pins</button>

        <span style={{ opacity: 0.7, fontSize: 12 }}>
          Pins: {pins.length}
        </span>
      </div>

      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        onClick={onSvgClick}
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          background: "white",
          cursor: "crosshair",
        }}
      >
        {/* Sphere outline */}
        <path d={sphereD} fill="#f7fbff" stroke="#cbd5e1" />

        {/* Land */}
        <path d={landD} fill="#94a3b8" stroke="#475569" strokeWidth={0.5} />

        {/* Pins */}
        {pins.map((p) => {
          const pt = projection(p.coord);
          if (!pt) return null; // e.g., far side of Orthographic
          const [cx, cy] = pt;
          return (
            <g key={p.id}>
              <circle cx={cx} cy={cy} r={4} fill="#ef4444" />
              <circle cx={cx} cy={cy} r={7} fill="transparent" stroke="#ef4444" strokeWidth={1} />
            </g>
          );
        })}
      </svg>

      <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
        Next: freehand polyline tool (store a LineString as lon/lat points while dragging).
      </p>
    </div>
  );
}
