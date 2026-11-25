"use client";
import * as T from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useEffect, useRef, useState } from "react";
import type { SimulationSnapshot } from "@/lib/theatre/engine";
import { GlobeScene, ShipScene, ROVScene } from "./scenes";
import { orbitInput } from "./orbit";
export type View = "Auto" | "Globe" | "Ship" | "ROV" | "Network";
const ramp = (n: number) => Math.max(0, Math.min(1, n));
export function CameraDirector({
  state,
  view,
  reduced,
}: {
  state: SimulationSnapshot;
  view: View;
  reduced: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef({ state, view, reduced }),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    latest.current = { state, view, reduced };
  }, [state, view, reduced]);
  useEffect(() => {
    const el = host.current!;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      setFailed(true);
      return;
    }
    el.appendChild(renderer.domElement);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const scene = new T.Scene(),
      camera = new T.PerspectiveCamera(41, 1, 0.05, 100);
    let dirty = true;
    const studio = new RoomEnvironment();
    const pmrem = new T.PMREMGenerator(renderer);
    const reflection = pmrem.fromScene(studio, 0.03);
    scene.environment = reflection.texture;
    scene.environmentIntensity = 0.55;
    studio.dispose();
    pmrem.dispose();
    const globe = GlobeScene(() => {
        dirty = true;
      }),
      sea = ShipScene(),
      sub = ROVScene();
    const orbit = orbitInput(el, () => {
      dirty = true;
    });
    scene.add(
      globe.group,
      sea.group,
      sub.group,
      new T.HemisphereLight(0xd6ffff, 0x567984, 2),
    );
    const sun = new T.DirectionalLight(0xffe2af, 3);
    sun.position.set(-4, 6, 4);
    scene.add(sun);
    const mist = new T.FogExp2(0x285566, 0);
    const deepWater = new T.FogExp2(0x073447, 0.093);
    const plungeTarget = new T.Vector3();
    let frame = 0,
      prior: typeof latest.current | undefined;
    const resize = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / Math.max(1, el.clientHeight);
      camera.updateProjectionMatrix();
      dirty = true;
    });
    resize.observe(el);
    let lastSurfaceFrame = -Infinity;
    const oceanStart = performance.now();
    function draw() {
      frame = requestAnimationFrame(draw);
      const data = latest.current;
      const now = performance.now();
      const animateSea =
        sea.group.visible &&
        !data.reduced &&
        now - lastSurfaceFrame >= 1000 / 30;
      if (!dirty && prior === data && !animateSea) return;
      dirty = false;
      prior = data;
      const { state: s, view, reduced } = data,
        t = s.presentationSeconds;
      const deck = t >= 73 && t < 89;
      const mode =
        view === "Auto"
          ? t < 29 || t >= 103
            ? "Globe"
            : t < 49 || deck
              ? "Ship"
              : "ROV"
          : view;
      globe.group.visible = mode === "Globe";
      sea.group.visible = mode === "Ship";
      sub.group.visible = mode === "ROV";
      renderer.domElement.hidden = mode === "Network";
      if (mode === "Network") return;
      const cutDistance = Math.min(
        ...[73, 89, 103].map((mark) => Math.abs(mark - t)),
      );
      renderer.domElement.style.opacity = String(
        view === "Auto" && !reduced
          ? 0.12 + 0.88 * ramp(cutDistance / 0.65)
          : 1,
      );
      if (mode === "Ship") lastSurfaceFrame = now;
      const oceanSeconds = reduced ? 0 : (now - oceanStart) / 1000;
      sea.water.material.uniforms.seconds.value = oceanSeconds;
      sun.color.setHex(mode === "ROV" ? 0x95dced : 0xffdfa8);
      sun.intensity = mode === "ROV" ? 1.35 : 2.4;
      const focus = new T.Vector3();
      if (mode === "Globe") {
        globe.group.rotation.y = reduced ? 0 : -0.32 + 0.35 * ramp(t / 12);
        globe.beacon.visible = s.physicalFault;
        globe.ring.scale.setScalar(reduced ? 1 : 1 + 0.22 * Math.sin(t * 5));
        globe.links.forEach((l) => {
          l.line.material.color.setHex(
            l.id === "AD" && s.physicalFault
              ? 0xf7a34d
              : s.network.flow[l.id]
                ? 0x60fff0
                : 0x4a737c,
          );
          l.bead.visible = s.network.flow[l.id] > 0;
          l.bead.position.copy(
            l.curve.getPointAt(reduced ? 0.5 : (t * 0.32) % 1),
          );
        });
        camera.position.set(
          0,
          0.3,
          Math.max(7.9, 6 / camera.aspect) -
            (reduced ? 0 : 1.5 * ramp((t - 9) / 9) * (1 - ramp((t - 101) / 9))),
        );
      } else if (mode === "Ship") {
        sea.ship.position.x = reduced ? 0 : -1.7 * (1 - ramp((t - 29) / 10));
        sea.water.material.uniforms.hullX.value = sea.ship.position.x;
        const wavePhase = 1.28 * sea.ship.position.x - 1.9 * oceanSeconds;
        sea.ship.position.y = reduced ? 0 : 0.085 * Math.sin(wavePhase);
        sea.ship.rotation.z = reduced ? 0 : 0.038 * Math.cos(wavePhase);
        sea.ship.rotation.x = reduced
          ? 0
          : 0.026 * Math.sin(oceanSeconds * 1.55);
        sea.joint.parent!.visible = t >= 73 && t < 89;
        sea.joint.visible = t >= 83;
        sea.winch.visible = t >= 73 && t < 89;
        const hookY = -0.75 + 1.42 * ramp((t - 73) / 6);
        sea.recovered.forEach((end) => {
          end.visible = t < 83;
          end.position.y = hookY;
          end.position.x = 0.85 * ramp((t - 78) / 3);
        });
        sea.sling.scale.y = (1.18 - hookY) / 1.8;
        sea.sling.position.y = (1.18 + hookY) / 2;
        sea.testLamp.visible = t >= 86 && t < 89;
        sea.testLamp.material.emissive.setHex(0x55ffaa);
        const close = deck ? ramp((t - 73) / 5) : 0;
        camera.position.set(
          3.35 - 4.3 * close,
          1.38 - 0.28 * close,
          4.45 - 3.52 * close,
        );
        focus.set(-0.7 * close, 0.68, 0);
      } else {
        const descent = ramp((t - 49) / 13);
        sub.rov.position.set(-0.7, 3.8 - 4.7 * descent, 0);
        const relaying = s.events.some((e) => e.phase === "Cable re-lay");
        const joined = !s.physicalFault || relaying;
        sub.intact.visible = joined;
        sub.sleeve.visible = relaying;
        sub.ends.forEach((end) => {
          end.visible = !joined;
        });
        sub.cable.position.y = s.events.some(
          (e) => e.phase === "Cable recovery",
        )
          ? 2 * ramp((t - 73) / 6) * (relaying ? 1 - ramp((t - 89) / 7) : 1)
          : 0;
        focus.copy(sub.rov.position);
        if (s.physicalFault && !relaying)
          focus.lerp(
            new T.Vector3(0, -1.84 + sub.cable.position.y, 0.4),
            0.56 * ramp((t - 62) / 4),
          );
        if (relaying)
          focus.lerp(
            new T.Vector3(0, -1.84 + sub.cable.position.y, 0.4),
            0.7 * ramp((t - 89) / 4),
          );
        camera.position.copy(focus).add(new T.Vector3(2.9, 0.75, 1.15));
      }
      // Match the accelerating exit to a high approach in the incoming scene.
      // Ocean mist masks the change of scale at the waterline.
      const boundary = t < 39 ? 29 : 49;
      const offset = t - boundary;
      const handoff =
        view === "Auto" && !reduced
          ? 1 - ramp((t - 26) / 2.6) * (1 - ramp((t - 29) / 2))
          : 1;
      orbit.apply(camera, focus, mode === "Globe" ? 2.9 : 0.4, handoff);
      if (mode === "Globe" && view === "Auto" && !reduced && t >= 9 && t < 29) {
        const spot = globe.beacon.getWorldPosition(plungeTarget);
        const lock = ramp((t - 9) / 5) * (0.58 + 0.42 * ramp((t - 25) / 2.5));
        const heading = camera.position.clone().normalize();
        const rotation = new T.Quaternion().setFromUnitVectors(
          heading,
          spot.clone().normalize(),
        );
        camera.position.applyQuaternion(
          new T.Quaternion().slerp(rotation, lock),
        );
        focus.lerp(spot, lock);
      }
      scene.fog = mode === "ROV" ? deepWater : null;
      scene.background = null;
      if (view === "Auto" && !reduced && offset >= -1.4 && offset <= 1.6) {
        const entering = offset >= 0;
        const progress = entering
          ? 1 - ramp(offset / 1.6)
          : ramp(1 + offset / 1.4);
        const push = progress * progress;
        if (entering) {
          camera.position.y += (mode === "Ship" ? 15 : 9) * push;
          camera.position.z += 2 * push;
        } else {
          if (mode === "Globe") globe.beacon.getWorldPosition(plungeTarget);
          else plungeTarget.set(-2.55, 0.02, 0.35);
          focus.lerp(plungeTarget, push);
          camera.position.lerp(plungeTarget, push * 0.98);
        }
        const veil = Math.pow(progress, 5);
        mist.density = veil * 1.8;
        scene.fog = mist;
        renderer.setClearColor(mist.color, veil);
      } else {
        renderer.setClearColor(
          mode === "ROV" ? deepWater.color : 0x000000,
          mode === "ROV" ? 1 : 0,
        );
      }
      camera.lookAt(focus);
      renderer.render(scene, camera);
    }
    const lost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(frame);
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    draw();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      orbit.dispose();
      globe.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse((o) => {
        if (o instanceof T.Mesh || o instanceof T.Points) {
          o.geometry.dispose();
          for (const m of [o.material].flat()) m.dispose();
        }
      });
      reflection.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div
      ref={host}
      className="camera"
      tabIndex={view === "Network" ? -1 : 0}
      role="group"
      aria-label="Interactive 3D scene. Drag or use arrow keys to orbit, scroll or use plus and minus to zoom. Home resets the view."
    >
      {failed && <span>3D unavailable · Follow the network map below</span>}
    </div>
  );
}
