"use client";
import { useEffect, useRef, useState } from "react";
import { CameraDirector, type View } from "./CameraDirector";
import {
  buildDecisionRecord,
  snapshot,
  type SimulationSnapshot,
} from "@/lib/theatre/engine";
import { duration, seek } from "@/lib/theatre/clock";
import { scenario } from "@/lib/theatre/scenario";
import "./theatre.css";

const baseline = snapshot(scenario, 0).network.services[0];
type Props = { state: SimulationSnapshot };
const point = (coords: number[]) => [
  200 + coords[0] * 2.9,
  101 - coords[1] * 1.7,
];
function RouteOverlay({
  state,
  selected,
  reduced,
}: { selected: string; reduced: boolean } & Props) {
  const active = state.network.services[0].routes.find(
    (r) => r.id === selected,
  );
  return (
    <svg
      className="routeMap"
      viewBox="0 0 400 184"
      role="img"
      aria-label="Synthetic network with direct and alternate routes"
    >
      {scenario.edges.map((e) => {
        const [a, b] = e.polyline.map(point),
          broken = e.id === scenario.broken && state.physicalFault;
        const flow = state.network.flow[e.id],
          t = reduced
            ? 0.5
            : (state.presentationSeconds * 0.34 + (e.from === "A" ? 0 : 0.5)) %
              1;
        const color = broken ? "#ffae69" : flow ? "#83e8d2" : "#557786";
        return (
          <g
            key={e.id}
            opacity={selected && !active?.edges.includes(e.id) ? 0.42 : 1}
          >
            <line
              x1={a[0]}
              y1={a[1]}
              x2={b[0]}
              y2={b[1]}
              stroke={color}
              strokeWidth={flow ? 3 : 2}
              strokeDasharray={broken ? "5 6" : undefined}
            />
            {flow > 0 && (
              <circle
                cx={a[0] + (b[0] - a[0]) * t}
                cy={a[1] + (b[1] - a[1]) * t}
                r="4"
                fill="#e5fff7"
              />
            )}
          </g>
        );
      })}
      {scenario.nodes.map((n) => {
        const [x, y] = point(n.point);
        return (
          <g key={n.id}>
            <circle cx={x} cy={y} r="11" fill="#102630" stroke="#77bbae" />
            <text
              x={x}
              y={y + 4}
              textAnchor="middle"
              fill="white"
              fontSize="11"
            >
              {n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
function OperationsHUD({
  state,
  selected,
  select,
}: { selected: string; select: (id: string) => void } & Props) {
  const d = state.network.services[0],
    r = scenario.repair;
  return (
    <aside className="theatrePanel">
      <small>SIMULATED OPERATIONS</small>
      <h2>Service continuity</h2>
      <p>
        {d.from} → {d.to} · {d.offered} Tbps offered
      </p>
      <div className="metrics">
        <div>
          <strong>{d.served}</strong> Tbps
          <br />
          Served
        </div>
        <div>
          <strong>{d.unserved}</strong> Tbps
          <br />
          Unserved
        </div>
      </div>
      <p>
        Weighted one-way delay <b>{d.latency ?? "—"} ms</b>
        {d.latency !== null && (
          <small>
            Baseline {baseline.latency} ms · Change{" "}
            {(d.latency - (baseline.latency ?? 0)).toFixed(1)} ms
          </small>
        )}
      </p>
      <h3>Candidate routes</h3>
      {d.routes.map((r) => (
        <button
          key={r.id}
          aria-pressed={r.id === selected}
          onClick={() => select(selected === r.id ? "" : r.id)}
          className="routeButton"
        >
          <b>{r.id}</b>
          <span>{r.allocated} Tbps</span>
          <small>
            {r.status} · limit {r.bottleneck ?? "unknown"} Tbps · {r.latency} ±{" "}
            {r.uncertaintyMs} ms
          </small>
        </button>
      ))}
      <h3>{state.phase}</h3>
      <p>
        {state.physicalFault ? "Primary cable damaged" : "Primary cable intact"}
      </p>
      <h3>{r.vessel}</h3>
      <p>
        {state.repair.hold ??
          (state.presentationSeconds < 29
            ? "On standby"
            : state.presentationSeconds < 39
              ? "In transit"
              : "On station")}{" "}
        · waves {r.wavesM} m · {r.weatherWindowHours} h working window
        <br />
        Assumed repair ETA {state.repair.etaHours} h from dispatch
      </p>
    </aside>
  );
}
function ScenarioSummary({ state }: Props) {
  function download() {
    const blob = new Blob(
      [
        JSON.stringify(
          buildDecisionRecord(scenario, state.presentationSeconds),
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "pelagic-passage-decision.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="theatreFoot">
      <details>
        <summary>Model assumptions &amp; provenance</summary>
        <p>
          All positions, capacities, delays, vessel ratings and timings are
          synthetic or assumed. The fictional links carry zero background load.
          Delay represents fixed one-way propagation. Weather is held constant.
          Permissions, optical tests and survey results are scenario inputs.
        </p>
      </details>
      <button onClick={download}>Download decision JSON ↓</button>
    </div>
  );
}
function TimelineControls({
  t,
  set,
  playing,
  toggle,
  speed,
  rate,
}: {
  t: number;
  set: (n: number) => void;
  playing: boolean;
  toggle: () => void;
  speed: number;
  rate: (n: number) => void;
}) {
  return (
    <div className="transport">
      <label>
        Presentation <b>{t.toFixed(1)} / 115 s</b>
        <input
          type="range"
          min="0"
          max="115"
          step=".1"
          value={t}
          onChange={(e) => set(+e.target.value)}
          aria-label="Presentation time"
        />
      </label>
      <div>
        <button onClick={toggle}>
          {playing
            ? "Pause"
            : t === 0
              ? "Start Scenario"
              : t === 115
                ? "Replay"
                : "Play"}
        </button>
        <button onClick={() => set(t - 1)} aria-label="Step backward">
          −1 s
        </button>
        <button onClick={() => set(t + 1)} aria-label="Step forward">
          +1 s
        </button>
        <button onClick={() => set(0)}>Reset</button>
        <select
          aria-label="Playback speed"
          value={speed}
          onChange={(e) => rate(+e.target.value)}
        >
          {[0.5, 1, 2, 4].map((n) => (
            <option key={n} value={n}>
              {n}×
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
export default function Theatre({workspaceHref}:{workspaceHref?:string}) {
  const shell=useRef<HTMLElement>(null);
  const [panel,setPanel]=useState(false),[fullscreen,setFullscreen]=useState(false),[canFullscreen,setCanFullscreen]=useState(false);
  useEffect(()=>{
    setCanFullscreen(!!document.fullscreenEnabled);
    const sync=()=>setFullscreen(document.fullscreenElement===shell.current);
    document.addEventListener("fullscreenchange",sync);
    return ()=>document.removeEventListener("fullscreenchange",sync);
  },[]);
  const [t, setT] = useState(0),
    [playing, play] = useState(false),
    [speed, rate] = useState(1),
    [view, setView] = useState<View>("Auto"),
    [selected, select] = useState(""),
    [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)"),
      sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const timer = setInterval(
      () => {
        const now = performance.now(),
          elapsed = (now - last) / 1000;
        last = now;
        setT((prev) => seek(prev + elapsed * speed));
      },
      reduced ? 250 : 50,
    );
    return () => clearInterval(timer);
  }, [playing, speed, reduced]);
  useEffect(() => {
    if (t === duration) play(false);
  }, [t]);
  const state = snapshot(scenario, t);
  const move = (n: number) => {
    play(false);
    setT(seek(n));
  };
  return (
    <section ref={shell} className="theatre" aria-label="Synthetic resilience simulation">
      <header>
        {workspaceHref && <a href={workspaceHref} className="workspaceReturn">← Workspace</a>}
        <h1>Pelagic Passage</h1>
        <button aria-controls="simulation-details" aria-expanded={panel} onClick={()=>setPanel(!panel)}>Details</button>
        {canFullscreen && <button onClick={async()=>{
          try {if(document.fullscreenElement) await document.exitFullscreen();else await shell.current?.requestFullscreen();}
          catch {setCanFullscreen(false);}
        }}>{fullscreen?"Exit fullscreen":"Fullscreen"}</button>}
      </header>
      <div className="sceneArea">
          <div className="stage">
            <CameraDirector state={state} view={view} reduced={reduced} />
            {view === "Network" && (
              <div className="mapStage">
                <RouteOverlay {...{ state, selected, reduced }} />
              </div>
            )}
            <div className="stageTop">
              <small>SYNTHETIC / SIMULATED</small>
              <select
                aria-label="Camera view"
                value={view}
                onChange={(e) => setView(e.target.value as View)}
              >
                {["Auto", "Globe", "Ship", "ROV", "Network"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="caption">
              {view !== "Network" && (
                <small className="orbitTip">
                  Drag to orbit · Scroll to zoom
                </small>
              )}
              <small>
                ENGINEERING CLOCK · {state.engineeringHours.toFixed(1)} h
                ASSUMED
              </small>
              <h2>{state.phase}</h2>
              {t >= 49 && t < 73 && (
                <p>
                  ROV depth ·{" "}
                  {Math.round(
                    scenario.repair.depthM * Math.min(1, (t - 49) / 13),
                  )}{" "}
                  m assumed
                </p>
              )}
            </div>
          </div>
          <div id="simulation-details" className="detailsDrawer" hidden={!panel}>
            <OperationsHUD {...{ state, selected, select }} />
            <details open className="network">
              <summary>Logical routes &amp; physical links</summary>
              <RouteOverlay {...{ state, selected, reduced }} />
            </details>
            <ScenarioSummary state={state} />
          </div>
      </div>
          <TimelineControls
            {...{ t, playing, speed, rate }}
            set={move}
            toggle={() => {
              if (t === duration) setT(0);
              play(!playing);
            }}
          />
    </section>
  );
}
