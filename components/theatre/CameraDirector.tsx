"use client";
import * as T from "three";
import { useEffect, useRef, useState } from "react";
import type { SimulationSnapshot } from "@/lib/theatre/engine";
import { GlobeScene, ShipScene, ROVScene } from "./scenes";
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
    const globe = GlobeScene(),
      sea = ShipScene(),
      sub = ROVScene();
    scene.add(
      globe.group,
      sea.group,
      sub.group,
      new T.HemisphereLight(0xd6ffff, 0x567984, 2),
    );
    const sun = new T.DirectionalLight(0xffe2af, 3);
    sun.position.set(-4, 6, 4);
    scene.add(sun);
    let frame = 0,
      dirty = true,
      prior: typeof latest.current | undefined;
    const resize = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / Math.max(1, el.clientHeight);
      camera.updateProjectionMatrix();
      dirty = true;
    });
    resize.observe(el);
    function draw() {
      frame = requestAnimationFrame(draw);
      const data = latest.current;
      if (!dirty && prior === data) return;
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
        ...[29, 49, 73, 89, 103].map((mark) => Math.abs(mark - t)),
      );
      renderer.domElement.style.opacity = String(
        view === "Auto" && !reduced
          ? 0.12 + 0.88 * ramp(cutDistance / 0.65)
          : 1,
      );
      const focus = new T.Vector3();
      if (mode === "Globe") {
        globe.group.rotation.y = reduced ? 0 : -0.32 + 0.35 * ramp(t / 12);
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
        sea.ship.rotation.z = reduced ? 0 : 0.018 * Math.sin(t * 2);
        sea.joint.visible = t >= 83 && t < 89;
        sea.winch.visible = t >= 73 && t < 89;
        const hookY = -0.75 + 1.42 * ramp((t - 73) / 6);
        sea.recovered.forEach((end) => {
          end.position.y = hookY;
          end.position.x = 0.85 * ramp((t - 78) / 3);
        });
        sea.sling.scale.y = (1.18 - hookY) / 1.8;
        sea.sling.position.y = (1.18 + hookY) / 2;
        sea.testLamp.visible = t >= 86 && t < 89;
        sea.testLamp.material.emissive.setHex(0x55ffaa);
        const close = deck ? ramp((t - 73) / 5) : 0;
        camera.position.set(-4 + 2.5 * close, 2.2 - close, 4.6 - 3.1 * close);
        focus.set(-0.65 * close, 0.4, 0);
      } else {
        const descent = ramp((t - 49) / 13);
        sub.rov.position.set(-0.7, 3.8 - 4.7 * descent, 0);
        const lift = ramp((t - 73) / 6) * (1 - ramp((t - 89) / 7));
        sub.ends.forEach((m, i) => {
          m.position.y = -1.84 + lift * 2;
          m.position.x = (i ? 1 : -1) * (3.61 - (t >= 96 ? 0.22 : 0));
        });
        focus.copy(sub.rov.position);
        camera.position.copy(focus).add(new T.Vector3(3, 1.6, 4.1));
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
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse((o) => {
        if (o instanceof T.Mesh || o instanceof T.Points) {
          o.geometry.dispose();
          for (const m of [o.material].flat()) m.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div ref={host} className="camera" aria-hidden="true">
      {failed && <span>3D unavailable · Follow the network map below</span>}
    </div>
  );
}
