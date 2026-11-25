import * as T from "three";
import { scenario } from "@/lib/theatre/scenario";
const teal = 0x78efdf,
  white = 0xd4e0dc,
  amber = 0xf4ad55;
const v = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
function mesh(
  parent: T.Object3D,
  geo: T.BufferGeometry,
  color: number,
  x = 0,
  y = 0,
  z = 0,
) {
  const m = new T.Mesh(
    geo,
    new T.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.2 }),
  );
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function box(
  p: T.Object3D,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  c: number,
) {
  return mesh(p, new T.BoxGeometry(w, h, d), c, x, y, z);
}
function pipe(p: T.Object3D, a: T.Vector3, b: T.Vector3, r: number, c: number) {
  const mid = a.clone().lerp(b, 0.5);
  const m = mesh(
    p,
    new T.CylinderGeometry(r, r, a.distanceTo(b), 10),
    c,
    mid.x,
    mid.y,
    mid.z,
  );
  m.quaternion.setFromUnitVectors(v(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}
function globePoint([lon, lat]: number[], r: number) {
  const a = (lon * Math.PI) / 180,
    b = (lat * Math.PI) / 180;
  return v(
    r * Math.sin(a) * Math.cos(b),
    r * Math.sin(b),
    r * Math.cos(a) * Math.cos(b),
  );
}
export function GlobeScene() {
  const group = new T.Group();
  mesh(group, new T.SphereGeometry(2.5, 64, 48), 0x17445a);
  const grid = new T.Mesh(
    new T.SphereGeometry(2.504, 36, 18),
    new T.MeshBasicMaterial({
      color: 0x397287,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    }),
  );
  group.add(grid);
  // Original coarse continental silhouettes, decorative and independent of topology.
  const lands = [
    [
      [-165, 60],
      [-130, 70],
      [-58, 56],
      [-76, 27],
      [-98, 18],
      [-117, 33],
    ],
    [
      [-81, 11],
      [-48, 1],
      [-36, -12],
      [-68, -56],
      [-76, -16],
    ],
    [
      [-17, 32],
      [9, 37],
      [34, 30],
      [49, 11],
      [32, -28],
      [18, -35],
      [6, 1],
      [-15, 14],
    ],
    [
      [-10, 38],
      [3, 60],
      [55, 70],
      [143, 57],
      [130, 24],
      [97, 10],
      [79, 8],
      [54, 27],
      [31, 39],
    ],
    [
      [113, -23],
      [134, -12],
      [153, -27],
      [140, -39],
      [116, -34],
    ],
  ];
  function inside(x: number, y: number, poly: number[][]) {
    let hit = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [a, b] = poly[i],
        [c, d] = poly[j];
      if (b > y !== d > y && x < ((c - a) * (y - b)) / (d - b) + a) hit = !hit;
    }
    return hit;
  }
  const dots = [];
  for (let lat = -60; lat < 74; lat += 2.3)
    for (let lon = -178; lon < 179; lon += 2.6)
      if (lands.some((p) => inside(lon, lat, p)))
        dots.push(globePoint([lon, lat], 2.515));
  group.add(
    new T.Points(
      new T.BufferGeometry().setFromPoints(dots),
      new T.PointsMaterial({ color: 0x83acaa, size: 0.055 }),
    ),
  );
  const links = scenario.edges.map((e) => {
    const a = globePoint(e.polyline[0], 2.55),
      b = globePoint(e.polyline[1], 2.55);
    const curve = new T.CatmullRomCurve3(
      Array.from({ length: 25 }, (_, i) =>
        a
          .clone()
          .lerp(b, i / 24)
          .normalize()
          .multiplyScalar(2.55 + 0.12 * Math.sin((Math.PI * i) / 24)),
      ),
    );
    const line = mesh(
      group,
      new T.TubeGeometry(curve, 32, 0.015, 6, false),
      teal,
    );
    const bead = mesh(group, new T.SphereGeometry(0.055, 8, 8), white);
    return { id: e.id, line, bead, curve };
  });
  scenario.nodes.forEach((n) => {
    const p = globePoint(n.point, 2.57);
    mesh(group, new T.SphereGeometry(0.065, 12, 12), amber, p.x, p.y, p.z);
  });
  return { group, links };
}
export function DeckRepairScene(ship: T.Group) {
  const g = new T.Group();
  ship.add(g);
  g.position.set(-0.7, 0.36, 0);
  box(g, 0, 0.14, 0, 1, 0.25, 0.56, 0x23414a);
  for (const sign of [-1, 1])
    pipe(g, v(sign * 0.65, 0.32, 0), v(sign * 0.12, 0.32, 0), 0.057, amber);
  const joint = mesh(
    g,
    new T.CylinderGeometry(0.092, 0.092, 0.31, 16),
    teal,
    0,
    0.32,
    0,
  );
  joint.rotation.z = Math.PI / 2;
  return joint;
}
export function ShipScene() {
  const group = new T.Group(),
    ship = new T.Group();
  group.add(ship);
  const hull = new T.Shape();
  hull.moveTo(-2, -0.55);
  hull.lineTo(1.45, -0.55);
  hull.quadraticCurveTo(2.1, -0.4, 2.45, 0);
  hull.quadraticCurveTo(1.95, 0.5, 1.45, 0.55);
  hull.lineTo(-2, 0.55);
  hull.closePath();
  const body = mesh(
    ship,
    new T.ExtrudeGeometry(hull, {
      depth: 0.42,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.07,
    }),
    0x266071,
  );
  body.rotation.x = -Math.PI / 2;
  body.position.y = -0.18;
  box(ship, 1, 0.52, 0, 1.15, 0.55, 0.85, white);
  box(ship, 0.98, 0.87, 0, 1.04, 0.25, 0.91, 0x264451);
  box(ship, 1, 1.04, 0, 1.15, 0.08, 0.98, white);
  pipe(ship, v(1, 1.06, 0), v(1, 1.7, 0), 0.035, amber);
  for (const sign of [-1, 1])
    pipe(
      ship,
      v(-1.65, 0.3, sign * 0.48),
      v(-2.04, 1.18, sign * 0.42),
      0.05,
      amber,
    );
  pipe(ship, v(-2.04, 1.18, -0.42), v(-2.04, 1.18, 0.42), 0.06, amber);
  const joint = DeckRepairScene(ship);
  const winch = new T.Group();
  ship.add(winch);
  winch.position.set(-2.05, 0, 0);
  const sling = pipe(winch, v(0, -1.8, 0), v(0, 0, 0), 0.027, white);
  const recovered = [-1, 1].map((sign) =>
    pipe(
      winch,
      v(-0.22, 0, sign * 0.14),
      v(0.24, 0, sign * 0.14),
      0.065,
      amber,
    ),
  );
  const drum = mesh(
    ship,
    new T.CylinderGeometry(0.24, 0.24, 0.63, 16),
    amber,
    -1.48,
    0.55,
    0,
  );
  drum.rotation.x = Math.PI / 2;
  const testLamp = mesh(
    ship,
    new T.SphereGeometry(0.075, 12, 8),
    teal,
    -0.36,
    0.76,
    -0.17,
  );
  const water = mesh(group, new T.PlaneGeometry(70, 70, 100, 100), 0x155362);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.12;
  const pos = water.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++)
    pos.setZ(
      i,
      0.09 * Math.sin(pos.getX(i) * 2 + pos.getY(i)) +
        0.04 * Math.cos(pos.getY(i) * 3),
    );
  water.geometry.computeVertexNormals();
  return { group, ship, joint, winch, sling, recovered, testLamp };
}
export function ROVScene() {
  const group = new T.Group(),
    rov = new T.Group();
  group.add(rov);
  box(rov, 0, 0, 0, 1.15, 0.48, 0.66, amber);
  for (const z of [-0.39, 0.39]) {
    pipe(rov, v(-0.66, -0.37, z), v(0.67, -0.37, z), 0.052, white);
    for (const x of [-0.44, 0.44])
      pipe(rov, v(x, -0.36, z), v(x, 0.22, z), 0.04, white);
    mesh(rov, new T.SphereGeometry(0.11, 12, 8), teal, 0.57, 0, z * 0.7);
  }
  pipe(rov, v(0.5, -0.1, 0), v(0.83, -0.4, 0), 0.04, white);
  pipe(rov, v(0.83, -0.4, 0), v(1, -0.4, 0.12), 0.035, amber);
  const tether = pipe(rov, v(-0.2, 0.2, 0), v(-0.7, 10, 0), 0.024, amber);
  const floor = mesh(group, new T.PlaneGeometry(55, 55, 60, 60), 0x365652);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  const pos = floor.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++)
    pos.setZ(i, 0.12 * Math.cos(pos.getX(i)) * 0.8 * Math.sin(pos.getY(i)));
  floor.geometry.computeVertexNormals();
  const ends = [-1, 1].map((sign) =>
    pipe(
      group,
      v(sign * 0.22, -1.84, 0.4),
      v(sign * 7, -1.84, 0.4),
      0.08,
      amber,
    ),
  );
  return { group, rov, tether, ends };
}
