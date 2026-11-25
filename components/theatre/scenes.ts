import * as T from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { scenario } from "@/lib/theatre/scenario";
import { earthSurface, oceanSurface, surfaceSky } from "./environment";
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
export function GlobeScene(onLoad: () => void) {
  const group = new T.Group();
  const fallback = earthSurface(onLoad);
  group.add(fallback);
  let disposed = false;
  const releaseTexture = (mat: T.Material) => {
    if (mat instanceof T.MeshStandardMaterial) mat.map?.dispose();
  };
  // Same Z-up Earth mesh, embedded map and coloured cable ribbons as Network Overview.
  new GLTFLoader().load(
    "/models/model1/globe_ribbons.gltf",
    ({ scene: model }) => {
      model.traverse((obj) => {
        if (!(obj instanceof T.Mesh)) return;
        for (const mat of [obj.material].flat()) {
          if (disposed) {
            releaseTexture(mat);
            mat.dispose();
            continue;
          }
          if (mat instanceof T.MeshStandardMaterial) {
            mat.side = T.DoubleSide;
            mat.roughness = obj.geometry.attributes.color ? 0.25 : 0.72;
            mat.metalness = obj.geometry.attributes.color ? 0.45 : 0.06;
          }
        }
        if (disposed) obj.geometry.dispose();
      });
      if (disposed) return;
      model.rotation.order = "YXZ";
      model.rotation.set(-Math.PI / 2, -Math.PI / 2, 0, "YXZ");
      model.scale.setScalar(2.5 / 2950);
      group.add(model);
      fallback.visible = false;
      onLoad();
    },
    undefined,
    () => onLoad(),
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
  const broken = links.find((l) => l.id === scenario.broken)!;
  const beacon = new T.Group();
  beacon.position.copy(broken.curve.getPointAt(0.24));
  beacon.quaternion.setFromUnitVectors(
    v(0, 0, 1),
    beacon.position.clone().normalize(),
  );
  const core = mesh(beacon, new T.SphereGeometry(0.048, 16, 10), 0xff532b);
  core.material.emissive.setHex(0xff3311);
  const ring = mesh(beacon, new T.TorusGeometry(0.096, 0.009, 8, 36), 0xff9b4e);
  group.add(beacon);
  return {
    group,
    links,
    beacon,
    ring,
    dispose() {
      disposed = true;
      group.traverse((o) => {
        if (o instanceof T.Mesh)
          for (const m of [o.material].flat()) releaseTexture(m);
      });
    },
  };
}
// Transverse sections narrow below the waterline and rise into the bow.
function platedHull(ship: T.Group) {
  const stations = [
    [-2.08, 0.47, 0.31],
    [-1.88, 0.58, 0.32],
    [-1.2, 0.63, 0.32],
    [0.35, 0.64, 0.34],
    [1.25, 0.59, 0.4],
    [1.85, 0.39, 0.48],
    [2.24, 0.17, 0.56],
    [2.48, 0.012, 0.61],
  ];
  const rings = stations.map(([x, w, h]) => [
    v(x, h, -w),
    v(x - 0.025, -0.03, -w * 0.97),
    v(x - 0.06, -0.18, -w * 0.86),
    v(x - 0.19, -0.37, -w * 0.42),
    v(x - 0.19, -0.37, w * 0.42),
    v(x - 0.06, -0.18, w * 0.86),
    v(x - 0.025, -0.03, w * 0.97),
    v(x, h, w),
  ]);
  const geometry = new T.BufferGeometry(),
    vertices: number[] = [],
    colors: number[] = [];
  function tri(a: T.Vector3, b: T.Vector3, c: T.Vector3, color: number) {
    const paint = new T.Color(color);
    for (const p of [a, b, c]) {
      vertices.push(p.x, p.y, p.z);
      colors.push(paint.r, paint.g, paint.b);
    }
  }
  for (let i = 1; i < rings.length; i++)
    for (let k = 0; k < 8; k++) {
      const j = (k + 1) % 8,
        paint =
          k === 7
            ? 0x58646a
            : k === 1 || k === 5
              ? 0x982f24
              : k >= 2 && k <= 4
                ? 0x622b25
                : 0x192f41;
      tri(rings[i - 1][k], rings[i][k], rings[i][j], paint);
      tri(rings[i - 1][k], rings[i][j], rings[i - 1][j], paint);
    }
  for (const ring of [rings[0], rings[rings.length - 1]])
    for (let j = 1; j < 7; j++) tri(ring[0], ring[j], ring[j + 1], 0x243b47);
  geometry.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  ship.add(
    new T.Mesh(
      geometry,
      new T.MeshStandardMaterial({
        vertexColors: true,
        side: T.DoubleSide,
        roughness: 0.67,
      }),
    ),
  );
  for (const sign of [-1, 1]) {
    for (let i = 1; i < stations.length; i++) {
      const [x, w, h] = stations[i],
        [px, pw, ph] = stations[i - 1];
      for (const level of [0.09, 0.17])
        pipe(
          ship,
          v(px, ph + level, sign * pw),
          v(x, h + level, sign * w),
          0.009,
          white,
        );
      pipe(ship, v(x, h, sign * w), v(x, h + 0.17, sign * w), 0.012, white);
    }
  }
}
function curvedTube(
  parent: T.Object3D,
  points: T.Vector3[],
  radius: number,
  color: number,
) {
  return mesh(
    parent,
    new T.TubeGeometry(new T.CatmullRomCurve3(points), 32, radius, 8, false),
    color,
  );
}
export function DeckRepairScene(ship: T.Group) {
  const g = new T.Group();
  ship.add(g);
  g.position.set(-0.7, 0.36, 0);
  box(g, 0, 0.14, 0, 1, 0.25, 0.56, 0x23414a);
  for (const sign of [-1, 1])
    pipe(g, v(sign * 0.65, 0.32, 0), v(sign * 0.12, 0.32, 0), 0.057, 0x252c2c);
  const joint = mesh(
    g,
    new T.CylinderGeometry(0.092, 0.092, 0.31, 16),
    teal,
    0,
    0.32,
    0,
  );
  joint.rotation.z = Math.PI / 2;
  joint.material.color.setHex(0x71818a);
  joint.material.metalness = 0.72;
  for (const side of [-1, 1]) {
    const clamp = pipe(
      g,
      v(side * 0.13, 0.32, 0),
      v(side * 0.17, 0.32, 0),
      0.1,
      0x81888a,
    );
    clamp.material.metalness = 0.78;
    clamp.material.roughness = 0.27;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      pipe(
        g,
        v(side * 0.17, 0.32 + 0.082 * Math.cos(a), 0.082 * Math.sin(a)),
        v(side * 0.18, 0.32 + 0.082 * Math.cos(a), 0.082 * Math.sin(a)),
        0.012,
        0x333c40,
      );
    }
  }
  // Armoured sleeves, clamping flanges and exposed fibre tray on deck.
  for (const sign of [-1, 1]) {
    for (let i = 0; i < 6; i++)
      pipe(
        g,
        v(sign * (0.2 + i * 0.057), 0.32, 0),
        v(sign * (0.22 + i * 0.057), 0.32, 0),
        0.068,
        0x2a3132,
      );
    for (const x of [0.15, 0.19])
      pipe(
        g,
        v(sign * x, 0.32, 0),
        v(sign * (x + 0.016), 0.32, 0),
        0.095,
        0xb1bab5,
      );
    box(g, sign * 0.33, 0.25, 0, 0.07, 0.16, 0.18, 0x697785);
  }
  for (let i = 0; i < 5; i++)
    curvedTube(
      g,
      [
        v(-0.19, 0.32, (i - 2) * 0.015),
        v(-0.07, 0.355, (i - 2) * 0.018),
        v(0.12, 0.34, (i - 2) * 0.014),
        v(0.19, 0.32, 0),
      ],
      0.006,
      [0xedb745, 0x76acbb, 0xe29473, 0xe1d9bc, 0x82be92][i],
    );
  // Portable optical test set and a coiled service lead on the aft workbench.
  box(g, -0.16, 0.31, -0.2, 0.27, 0.1, 0.15, 0x424849);
  box(g, -0.16, 0.363, -0.2, 0.17, 0.01, 0.095, 0xb5bdba);
  curvedTube(
    g,
    [
      v(-0.04, 0.32, -0.19),
      v(0.11, 0.28, -0.22),
      v(0.28, 0.28, -0.13),
      v(0.21, 0.32, -0.05),
    ],
    0.009,
    0x25282c,
  );
  return joint;
}
export function ShipScene() {
  const group = new T.Group(),
    ship = new T.Group();
  group.add(ship);
  platedHull(ship);
  for (const side of [-1, 1]) {
    const raft = mesh(
      ship,
      new T.CapsuleGeometry(0.07, 0.24, 4, 12),
      0xe6e5da,
      0.03,
      0.49,
      side * 0.48,
    );
    raft.rotation.z = Math.PI / 2;
    for (const x of [-0.065, 0.125])
      pipe(
        ship,
        v(x, 0.49, side * 0.48),
        v(x + 0.018, 0.49, side * 0.48),
        0.074,
        0x5a6163,
      );
    for (const x of [-1.85, 1.62]) {
      pipe(
        ship,
        v(x, 0.42, side * 0.35),
        v(x, 0.5, side * 0.35),
        0.031,
        0x384147,
      );
      pipe(
        ship,
        v(x, 0.49, side * 0.35),
        v(x, 0.51, side * 0.35),
        0.045,
        0x495054,
      );
    }
  }
  const lettering = document.createElement("canvas");
  lettering.width = 512;
  lettering.height = 96;
  const ink = lettering.getContext("2d")!;
  ink.fillStyle = "#d2d9cf";
  ink.font = "500 51px sans-serif";
  ink.textAlign = "center";
  ink.fillText("RV PELAGIA", 256, 66);
  const decal = new T.CanvasTexture(lettering);
  decal.colorSpace = T.SRGBColorSpace;
  const marking = new T.MeshBasicMaterial({
    map: decal,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  marking.addEventListener("dispose", () => decal.dispose());
  for (const side of [-1, 1]) {
    const label = new T.Mesh(new T.PlaneGeometry(0.68, 0.129), marking);
    label.position.set(0.58, 0.16, side * 0.64);
    label.rotation.y = side === 1 ? 0.055 : Math.PI - 0.055;
    ship.add(label);
    for (let i = 0; i < 5; i++) {
      const port = mesh(
        ship,
        new T.CylinderGeometry(0.029, 0.029, 0.016, 12),
        0x111f29,
        -0.91 + i * 0.22,
        0.21,
        side * 0.635,
      );
      port.rotation.x = Math.PI / 2;
    }
  }
  // Stacked accommodation decks, divided bridge glazing and navigation fittings.
  box(ship, 0.73, 0.53, 0, 1.6, 0.4, 0.94, 0xd6d6ca);
  box(ship, 0.76, 0.76, 0, 1.7, 0.06, 1.05, 0x657780);
  box(ship, 0.83, 0.88, 0, 1.32, 0.22, 0.84, white);
  box(ship, 0.9, 1.03, 0, 1.38, 0.09, 0.98, 0xe3ded1);
  box(ship, 0.91, 1.15, 0, 1.27, 0.18, 0.93, 0x234355);
  box(ship, 0.9, 1.27, 0, 1.43, 0.07, 1.05, 0xd7d5c9);
  for (const sign of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const x = 0.02 + i * 0.19;
      box(ship, x, 0.56, sign * 0.473, 0.096, 0.09, 0.012, 0x203b49);
      if (i < 7)
        box(
          ship,
          0.31 + i * 0.2,
          1.15,
          sign * 0.468,
          0.022,
          0.18,
          0.012,
          white,
        );
    }
    for (let j = 0; j < 4; j++)
      box(ship, 1.55, 1.15, (j - 1.5) * 0.22, 0.018, 0.18, 0.02, white);
    pipe(ship, v(0.24, 1.28, sign * 0.37), v(0.6, 1.86, 0), 0.015, 0x8b9799);
  }
  pipe(ship, v(0.6, 1.28, 0), v(0.6, 2.03, 0), 0.029, white);
  pipe(ship, v(0.59, 1.73, -0.36), v(0.59, 1.73, 0.36), 0.018, white);
  box(ship, 0.6, 1.98, 0, 0.07, 0.045, 0.57, 0xd3d8cf);
  mesh(ship, new T.SphereGeometry(0.116, 16, 12), white, 1.27, 1.4, 0.18);
  box(ship, 0.01, 0.99, -0.25, 0.26, 0.38, 0.27, 0xe2a147);
  box(ship, 0.01, 1.18, -0.25, 0.28, 0.09, 0.29, 0x313b3e);
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
  for (let i = 0; i < 14; i++)
    pipe(
      ship,
      v(-1.48, 0.55, -0.29 + i * 0.043),
      v(-1.48, 0.55, -0.27 + i * 0.043),
      0.245,
      0x343b3e,
    );
  for (const z of [-0.34, 0.34])
    pipe(ship, v(-1.48, 0.55, z), v(-1.48, 0.55, z + 0.028), 0.29, 0xcb842c);
  const testLamp = mesh(
    ship,
    new T.SphereGeometry(0.075, 12, 8),
    teal,
    -0.36,
    0.76,
    -0.17,
  );
  const water = oceanSurface();
  group.add(water, surfaceSky());
  return {
    group,
    ship,
    water,
    joint,
    winch,
    sling,
    recovered,
    testLamp,
  };
}
export function ROVScene() {
  const group = new T.Group(),
    rov = new T.Group();
  group.add(rov);
  const steel = 0x3f5059,
    rubber = 0x1a2428,
    yellow = 0xecad22;
  const shell = mesh(rov, new T.CapsuleGeometry(0.245, 0.72, 10, 40), yellow);
  shell.rotation.z = Math.PI / 2;
  for (const x of [-0.37, -0.25, 0.16, 0.36]) {
    pipe(rov, v(x - 0.021, 0, 0), v(x + 0.021, 0, 0), 0.251, rubber);
  }
  // Forward-facing optical port, inner camera barrel and transparent hemispherical dome.
  pipe(rov, v(0.37, 0, 0), v(0.52, 0, 0), 0.236, rubber);
  pipe(rov, v(0.515, 0, 0), v(0.542, 0, 0), 0.231, steel);
  pipe(rov, v(0.535, 0, 0), v(0.59, 0, 0), 0.142, 0x162329);
  const lens = mesh(
    rov,
    new T.SphereGeometry(0.098, 32, 18),
    0x102c39,
    0.586,
    0,
    0,
  );
  lens.scale.x = 0.42;
  lens.material.roughness = 0.09;
  lens.material.metalness = 0.85;
  const dome = mesh(
    rov,
    new T.SphereGeometry(0.218, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    0x96cedd,
    0.542,
    0,
    0,
  );
  dome.rotation.z = -Math.PI / 2;
  dome.material.transparent = true;
  dome.material.opacity = 0.25;
  dome.material.depthWrite = false;
  dome.material.roughness = 0.085;
  dome.material.metalness = 0.5;
  pipe(rov, v(-0.12, 0.21, 0), v(-0.12, 0.34, 0), 0.037, steel);
  for (const side of [-1, 1]) {
    const z = side * 0.32;
    for (const y of [-0.17, 0.17]) {
      const duct = mesh(
        rov,
        new T.CylinderGeometry(0.103, 0.103, 0.56, 24, 1, true),
        steel,
        -0.02,
        y,
        z,
      );
      duct.rotation.z = Math.PI / 2;
      duct.material.side = T.DoubleSide;
      const ring = mesh(
        rov,
        new T.TorusGeometry(0.098, 0.017, 10, 28),
        rubber,
        0.269,
        y,
        z,
      );
      ring.rotation.y = Math.PI / 2;
      for (let n = 0; n < 4; n++) {
        const a = (n * Math.PI) / 2;
        box(
          ring,
          0.048 * Math.cos(a),
          0.048 * Math.sin(a),
          -0.025,
          0.085,
          0.025,
          0.014,
          0x60696b,
        ).rotation.z = a + 0.23;
      }
      mesh(ring, new T.SphereGeometry(0.025, 12, 8), steel, 0, 0, -0.018);
      pipe(rov, v(-0.2, 0, side * 0.18), v(-0.2, y, z), 0.029, steel);
    }
    const housing = box(rov, 0.37, 0, side * 0.34, 0.19, 0.145, 0.15, rubber);
    const lamp = box(
      rov,
      housing.position.x + 0.1,
      0,
      side * 0.34,
      0.015,
      0.101,
      0.109,
      0xf6f7ee,
    );
    lamp.material.emissive.setHex(0xaaffff);
    lamp.material.emissiveIntensity = 2.4;
    const light = new T.SpotLight(0xafffff, 9, 6, 0.36, 0.7, 1);
    light.position.copy(lamp.position);
    light.target.position.set(2, -1, z);
    rov.add(light, light.target);
    const beam = new T.Mesh(
      new T.ConeGeometry(0.34, 1.6, 20, 1, true),
      new T.MeshBasicMaterial({
        color: 0x98e9fb,
        transparent: true,
        opacity: 0.042,
        depthWrite: false,
        blending: T.AdditiveBlending,
      }),
    );
    const dir = v(1, -0.47, side * 0.07).normalize();
    beam.position.copy(lamp.position).addScaledVector(dir, 0.8);
    beam.quaternion.setFromUnitVectors(v(0, -1, 0), dir);
    rov.add(beam);
  }
  const tether = curvedTube(
    rov,
    [
      v(-0.12, 0.34, 0),
      v(-0.76, 1, -0.16),
      v(-0.38, 2.3, -0.36),
      v(-1.5, 5.4, -0.65),
      v(-1.9, 11, -0.9),
    ],
    0.025,
    0x252b2c,
  );
  const floor = mesh(group, new T.PlaneGeometry(55, 55, 60, 60), 0x365652);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  const pos = floor.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++)
    pos.setZ(i, 0.12 * Math.cos(pos.getX(i)) * 0.8 * Math.sin(pos.getY(i)));
  floor.geometry.computeVertexNormals();
  floor.material.onBeforeCompile = (shader) => {
    shader.vertexShader =
      "varying vec2 sediment;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nsediment=position.xy;",
      );
    shader.fragmentShader =
      "varying vec2 sediment;\n" +
      shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
      float grain=fract(sin(dot(floor(sediment*81.),vec2(12.9898,78.233)))*43758.5453);
      float ripple=sin(sediment.x*19.+2.8*sin(sediment.y*1.4)+sin(sediment.x*.9));
      diffuseColor.rgb*=.74+.20*ripple+.32*grain;`,
      );
  };
  const cable = new T.Group();
  group.add(cable);
  const ends = [-1, 1].map((sign) =>
    pipe(
      cable,
      v(sign * 0.22, -1.84, 0.4),
      v(sign * 7, -1.84, 0.4),
      0.08,
      amber,
    ),
  );
  for (const end of ends) {
    end.material.color.setHex(0x242d2f);
    for (let i = -16; i <= 16; i++) {
      const collar = mesh(
        end,
        new T.CylinderGeometry(0.086, 0.086, 0.023, 12),
        i % 5 === 0 ? 0x988056 : 0x434e4d,
        0,
        i * 0.198,
        0,
      );
      collar.material.roughness = 0.83;
    }
  }
  const stones = new T.InstancedMesh(
    new T.IcosahedronGeometry(1, 0),
    new T.MeshStandardMaterial({ color: 0x66756d, roughness: 1 }),
    260,
  );
  const pose = new T.Object3D();
  const rand = (n: number) =>
    T.MathUtils.euclideanModulo(Math.sin(n * 78.233 + 2.7) * 43758.54, 1);
  for (let i = 0; i < stones.count; i++) {
    pose.position.set(
      (rand(i * 4) - 0.5) * 17,
      -1.96,
      (rand(i * 4 + 1) - 0.5) * 16,
    );
    const r = 0.035 + 0.24 * Math.pow(rand(i * 4 + 2), 2);
    pose.scale.set(r * 1.8, r * 0.65, r);
    pose.rotation.y = rand(i * 4 + 3) * 6.28;
    pose.updateMatrix();
    stones.setMatrixAt(i, pose.matrix);
  }
  group.add(stones);
  // One uninterrupted jacket spans the entire run after jointing. Its moulded
  // sleeve overlaps the jacket on both sides and travels with it during re-lay.
  const intact = pipe(
    cable,
    v(-7, -1.84, 0.4),
    v(7, -1.84, 0.4),
    0.08,
    0x292e30,
  );
  const sleeve = pipe(
    cable,
    v(-0.31, -1.84, 0.4),
    v(0.31, -1.84, 0.4),
    0.121,
    0xa4adae,
  );
  for (const y of [-0.27, -0.21, 0.21, 0.27]) {
    mesh(
      sleeve,
      new T.CylinderGeometry(0.134, 0.134, 0.027, 24),
      0x4a5356,
      0,
      y,
      0,
    );
  }
  return { group, rov, tether, ends, cable, intact, sleeve };
}
