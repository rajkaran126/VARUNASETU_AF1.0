import * as T from "three";

// Store the operator's angular offset independently of the scenario clock.
export function orbitInput(el: HTMLElement, invalidate: () => void) {
  let yaw = 0,
    pitch = 0,
    scale = 1,
    drag: number | null = null,
    lastX = 0,
    lastY = 0;
  const controller = new AbortController(),
    options = { signal: controller.signal };
  function move(dx: number, dy: number) {
    yaw -= dx * 0.009;
    pitch = T.MathUtils.clamp(pitch - dy * 0.008, -1.45, 1.45);
    invalidate();
  }
  function zoom(factor: number) {
    scale = T.MathUtils.clamp(scale * factor, 0.62, 2.4);
    invalidate();
  }
  el.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button !== 0 || drag !== null) return;
      drag = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture(drag);
      el.focus({ preventScroll: true });
    },
    options,
  );
  el.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerId !== drag) return;
      move(e.clientX - lastX, e.clientY - lastY);
      lastX = e.clientX;
      lastY = e.clientY;
    },
    options,
  );
  el.addEventListener(
    "lostpointercapture",
    () => {
      drag = null;
    },
    options,
  );
  el.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoom(Math.exp(T.MathUtils.clamp(e.deltaY, -180, 180) * 0.0015));
    },
    { ...options, passive: false },
  );
  el.addEventListener(
    "keydown",
    (e) => {
      switch (e.key) {
        case "ArrowLeft":
          move(-12, 0);
          break;
        case "ArrowRight":
          move(12, 0);
          break;
        case "ArrowUp":
          move(0, -12);
          break;
        case "ArrowDown":
          move(0, 12);
          break;
        case "+":
        case "=":
          zoom(0.9);
          break;
        case "-":
          zoom(1.1);
          break;
        case "Home":
          yaw = pitch = 0;
          scale = 1;
          invalidate();
          break;
        default:
          return;
      }
      e.preventDefault();
    },
    options,
  );
  return {
    apply(
      camera: T.PerspectiveCamera,
      focus: T.Vector3,
      min: number,
      weight: number,
    ) {
      const polar = new T.Spherical().setFromVector3(
        camera.position.clone().sub(focus),
      );
      polar.theta += yaw * weight;
      polar.phi = T.MathUtils.clamp(
        polar.phi + pitch * weight,
        0.05,
        Math.PI - 0.05,
      );
      polar.radius = Math.max(min, polar.radius * (1 + (scale - 1) * weight));
      camera.position.setFromSpherical(polar).add(focus);
    },
    dispose: () => controller.abort(),
  };
}
