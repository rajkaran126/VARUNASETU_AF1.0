'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

// Math constant: 180 / PI
const DEG_R = 57.29577951308232;

// Original Contourlines Shaders
const MESH_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aLonLat;
uniform vec2 uCenter;
uniform float uScale;
uniform float uMorph;
uniform vec2 uViewport;
uniform float uCopyOffset;
out vec2 vLonLat;
void main() {
  float lon = aLonLat.x + uCopyOffset;
  float lat = aLonLat.y;
  vLonLat = vec2(lon, lat);
  float dlon = lon - uCenter.x;
  vec2 flatPos = vec2(dlon, lat - uCenter.y) * uScale;
  float R = uScale * 57.29577951308232;
  float lam = radians(dlon);
  float phi = radians(lat);
  float phi0 = radians(uCenter.y);
  vec3 p = vec3(cos(phi) * sin(lam), sin(phi), cos(phi) * cos(lam));
  float y2 = p.y * cos(phi0) - p.z * sin(phi0);
  float z2 = p.y * sin(phi0) + p.z * cos(phi0);
  vec2 globePos = vec2(p.x, y2) * R;
  vec2 pos = mix(flatPos, globePos, uMorph);
  gl_Position = vec4(pos * 2.0 / uViewport, -z2 * uMorph * 0.5, 1.0);
}`;

const MESH_FS = `#version 300 es
precision highp float;
in vec2 vLonLat;
uniform sampler2D uTex;
uniform sampler2D uLUT;
uniform vec2 uTexSize;
uniform float uSeaLevel;
uniform float uInterval;
uniform float uAlpha;
uniform float uHillshade;
uniform float uGraticule;
uniform float uRefCoast;
uniform float uMetersPerPx;
out vec4 fragColor;

float decode(vec4 c) { return c.r * 65280.0 + c.g * 255.0 - 11000.0; }

float elevAt(vec2 ll) {
  float W = uTexSize.x, H = uTexSize.y;
  float fx = (ll.x + 180.0) / 360.0 * W;
  float fy = (90.0 - ll.y) / 180.0 * H;
  fx -= W * floor(fx / W);
  fy = clamp(fy, 0.0, H - 1.0001);
  float x0 = floor(fx), y0 = floor(fy);
  vec2 f = vec2(fx - x0, fy - y0);
  int ix0 = int(x0), iy0 = int(y0);
  int ix1 = ix0 + 1 == int(W) ? 0 : ix0 + 1;
  int iy1 = min(iy0 + 1, int(H) - 1);
  float e00 = decode(texelFetch(uTex, ivec2(ix0, iy0), 0));
  float e10 = decode(texelFetch(uTex, ivec2(ix1, iy0), 0));
  float e01 = decode(texelFetch(uTex, ivec2(ix0, iy1), 0));
  float e11 = decode(texelFetch(uTex, ivec2(ix1, iy1), 0));
  return mix(mix(e00, e10, f.x), mix(e01, e11, f.x), f.y);
}

float lineAA(float f, float w) {
  float d = abs(fract(f + 0.5) - 0.5) / max(fwidth(f), 1e-7);
  return 1.0 - smoothstep(0.0, w, d);
}

void main() {
  float e = elevAt(vLonLat);
  float rel = e - uSeaLevel;
  bool water = rel < 0.0;

  vec3 col;
  if (water) {
    col = texture(uLUT, vec2(sqrt(clamp(-rel / 11000.0, 0.0, 1.0)), 0.25)).rgb;
  } else {
    col = texture(uLUT, vec2(sqrt(clamp(rel / 19850.0, 0.0, 1.0)), 0.75)).rgb;
  }

  if (uHillshade > 0.5) {
    vec2 g = vec2(dFdx(e), dFdy(e)) / max(uMetersPerPx, 1.0);
    vec3 n = normalize(vec3(-g.x, -g.y, 1.8));
    float lit = clamp(dot(n, normalize(vec3(-0.55, 0.62, 0.72))), 0.0, 1.0);
    float amt = water ? 0.20 : 0.52;
    col *= (1.0 - amt) + amt * (0.35 + 1.15 * lit);
  }

  float f = rel / uInterval;
  float fadeMinor = 1.0 - smoothstep(0.30, 0.65, fwidth(f));
  float fadeMajor = 1.0 - smoothstep(0.30, 0.65, fwidth(f) / 5.0);
  vec3 lineCol = water ? vec3(0.16, 0.32, 0.50) : vec3(0.35, 0.27, 0.17);
  col = mix(col, lineCol, lineAA(f, 1.0) * (water ? 0.24 : 0.26) * fadeMinor);
  col = mix(col, lineCol, lineAA(f / 5.0, 1.25) * (water ? 0.40 : 0.45) * fadeMajor);

  float coast = 1.0 - smoothstep(0.0, 1.5, abs(rel) / max(fwidth(rel), 1e-7));
  col = mix(col, vec3(0.05, 0.23, 0.42), coast * 0.75);

  if (uRefCoast > 0.5) {
    float refc = 1.0 - smoothstep(0.0, 1.25, abs(e) / max(fwidth(e), 1e-7));
    col = mix(col, vec3(0.80, 0.22, 0.14), refc * 0.78);
  }

  if (uGraticule > 0.5) {
    vec2 gf = vLonLat / 15.0;
    vec2 gg = abs(fract(gf + 0.5) - 0.5) / max(fwidth(gf), vec2(1e-7));
    float grat = 1.0 - smoothstep(0.6, 1.6, min(gg.x, gg.y));
    col = mix(col, vec3(0.15, 0.3, 0.45), grat * 0.30);
  }

  fragColor = vec4(col, uAlpha);
}`;

const BG_VS = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const BG_FS = `#version 300 es
precision highp float;
uniform vec2 uViewport;
uniform float uR;
uniform float uMorph;
uniform float uTime;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = rot * p * 2.0 + vec2(100.0);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uViewport;
  vec2 p = (gl_FragCoord.xy - uViewport * 0.5) / min(uViewport.x, uViewport.y);

  // Clean, neutral deep space canvas ready for user-provided space asset
  vec3 col = vec3(0.012, 0.014, 0.018);

  // 3D Atmospheric Rayleigh Limb Glow around Earth Sphere
  if (uMorph > 0.01) {
    vec2 c = gl_FragCoord.xy - uViewport * 0.5;
    float d = length(c);
    float edge = d - uR;

    // Atmospheric halo corona
    float atmoGlow = exp(-max(edge, 0.0) / (uR * 0.14)) * uMorph;
    vec3 atmoCol = vec3(0.16, 0.55, 0.95);

    // Sunlit horizon limb illumination
    vec2 sunDir = normalize(vec2(0.65, 0.75));
    float sunFacing = dot(normalize(c), sunDir) * 0.5 + 0.5;
    atmoCol += vec3(0.35, 0.45, 0.55) * pow(sunFacing, 3.5);

    col += atmoCol * (atmoGlow * 0.7);
  }

  fragColor = vec4(col, 1.0);
}`;

// Palettes
function evalStops(stops: [number, number[]][], v: number) {
  if (v <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i][0]) {
      const [v0, c0] = stops[i - 1], [v1, c1] = stops[i];
      const t = (v - v0) / (v1 - v0);
      return [0, 1, 2].map((k) => c0[k] + (c1[k] - c0[k]) * t);
    }
  }
  return stops[stops.length - 1][1];
}

const OCEAN_STOPS: [number, number[]][] = [
  [0, [216, 242, 250]], [50, [198, 236, 255]], [200, [185, 227, 255]],
  [1000, [172, 219, 251]], [2000, [161, 210, 247]], [3000, [150, 201, 240]],
  [4000, [141, 193, 234]], [5000, [132, 185, 227]], [6000, [121, 178, 222]],
  [8000, [104, 163, 210]], [11000, [86, 146, 197]],
];

const LAND_MAX = 19850;
const LAND_STOPS: [number, number[]][] = [
  [0, [172, 208, 165]], [50, [148, 191, 139]], [200, [168, 198, 143]],
  [500, [189, 204, 150]], [1000, [209, 215, 171]], [1500, [225, 228, 181]],
  [2000, [239, 235, 192]], [2500, [232, 225, 182]], [3000, [222, 214, 163]],
  [3500, [211, 202, 157]], [4000, [202, 185, 130]], [4500, [195, 167, 107]],
  [5000, [185, 152, 90]], [5500, [170, 135, 83]], [6500, [158, 118, 76]],
  [7500, [148, 103, 68]], [8500, [143, 94, 72]], [9500, [149, 100, 90]],
  [11000, [161, 120, 110]], [12500, [173, 141, 130]], [14000, [186, 161, 150]],
  [15500, [201, 181, 170]], [17000, [221, 206, 196]], [18500, [239, 233, 227]],
  [19850, [250, 249, 247]],
];

export interface GlobeViewState {
  lon: number;
  lat: number;
  scale: number;
  morph: number;
  seaLevel: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface ContourlinesGlobeHandle {
  flyTo: (targetLon: number, targetLat: number, targetScale: number, durationMs?: number, onComplete?: () => void) => void;
  project: (lon: number, lat: number) => { x: number; y: number; visible: boolean; z: number };
  getViewState: () => GlobeViewState;
  setSeaLevel: (level: number) => void;
  setMorph: (m: number) => void;
  getCanvas: () => HTMLCanvasElement | null;
}

interface ContourlinesGlobeProps {
  initialLon?: number;
  initialLat?: number;
  initialScale?: number;
  onViewChange?: (view: GlobeViewState) => void;
  onReady?: () => void;
}

export const ContourlinesGlobe = forwardRef<ContourlinesGlobeHandle, ContourlinesGlobeProps>(function ContourlinesGlobe(
  {
    initialLon = 43.3, // Bab el-Mandeb longitude
    initialLat = 12.3, // Bab el-Mandeb latitude
    initialScale = 2.4,
    onViewChange,
    onReady
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);

  // View state tracking
  const viewRef = useRef<GlobeViewState>({
    lon: initialLon,
    lat: initialLat,
    scale: initialScale,
    morph: 1.0, // Globe by default
    seaLevel: 0.0,
    viewportWidth: 800,
    viewportHeight: 600,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  // Animation and interaction state
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);
  const flyAnimationRef = useRef<{
    startLon: number;
    startLat: number;
    startScale: number;
    targetLon: number;
    targetLat: number;
    targetScale: number;
    startTime: number;
    duration: number;
    onComplete?: () => void;
  } | null>(null);

  // Project longitude/latitude to current canvas pixel coordinates
  const project = useCallback((lon: number, lat: number) => {
    const v = viewRef.current;
    const dlon = ((((lon - v.lon) + 180) % 360) + 360) % 360 - 180;
    const flatX = dlon * v.scale;
    const flatY = (lat - v.lat) * v.scale;

    const R = v.scale * DEG_R;
    const lam = dlon * (Math.PI / 180.0);
    const phi = lat * (Math.PI / 180.0);
    const phi0 = v.lat * (Math.PI / 180.0);

    const pX = Math.cos(phi) * Math.sin(lam);
    const pY = Math.sin(phi);
    const pZ = Math.cos(phi) * Math.cos(lam);

    const y2 = pY * Math.cos(phi0) - pZ * Math.sin(phi0);
    const z2 = pY * Math.sin(phi0) + pZ * Math.cos(phi0);

    const globeX = pX * R;
    const globeY = y2 * R;

    const posX = (1 - v.morph) * flatX + v.morph * globeX;
    const posY = (1 - v.morph) * flatY + v.morph * globeY;

    const screenX = v.viewportWidth / 2 + posX;
    const screenY = v.viewportHeight / 2 - posY;

    const visible = v.morph > 0.05 ? z2 > -0.05 : Math.abs(dlon) <= 180;

    return { x: screenX, y: screenY, visible, z: z2 };
  }, []);

  // Expose imperative handle methods
  useImperativeHandle(ref, () => ({
    flyTo(targetLon, targetLat, targetScale, durationMs = 2000, onComplete) {
      const v = viewRef.current;
      flyAnimationRef.current = {
        startLon: v.lon,
        startLat: v.lat,
        startScale: v.scale,
        targetLon,
        targetLat,
        targetScale,
        startTime: performance.now(),
        duration: durationMs,
        onComplete,
      };
    },
    project,
    getViewState: () => ({ ...viewRef.current }),
    setSeaLevel(level: number) {
      viewRef.current.seaLevel = level;
    },
    setMorph(m: number) {
      viewRef.current.morph = Math.max(0, Math.min(1, m));
    },
    getCanvas: () => canvasRef.current,
  }), [project]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      antialias: true,
      depth: true,
      alpha: false,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      console.error('WebGL2 not supported for Contourlines Earth');
      return;
    }
    glRef.current = gl;

    // Shader compilation utility
    function compile(type: number, src: string) {
      const sh = gl!.createShader(type)!;
      gl!.shaderSource(sh, src);
      gl!.compileShader(sh);
      if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) {
        throw new Error('Shader compile: ' + gl!.getShaderInfoLog(sh));
      }
      return sh;
    }

    function makeProgram(vs: string, fs: string) {
      const p = gl!.createProgram()!;
      gl!.attachShader(p, compile(gl!.VERTEX_SHADER, vs));
      gl!.attachShader(p, compile(gl!.FRAGMENT_SHADER, fs));
      gl!.linkProgram(p);
      if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) {
        throw new Error('Link error: ' + gl!.getProgramInfoLog(p));
      }
      const uniforms: Record<string, WebGLUniformLocation | null> = {};
      const n = gl!.getProgramParameter(p, gl!.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const name = gl!.getActiveUniform(p, i)!.name;
        uniforms[name] = gl!.getUniformLocation(p, name);
      }
      return { prog: p, u: uniforms };
    }

    const meshProg = makeProgram(MESH_VS, MESH_FS);
    const bgProg = makeProgram(BG_VS, BG_FS);

    // Build LUT Texture
    const W_LUT = 1024;
    const lutData = new Uint8Array(W_LUT * 2 * 4);
    for (let i = 0; i < W_LUT; i++) {
      const t = i / (W_LUT - 1);
      const oc = evalStops(OCEAN_STOPS, t * t * 11000);
      const lc = evalStops(LAND_STOPS, t * t * LAND_MAX);
      lutData.set([oc[0], oc[1], oc[2], 255], i * 4);
      lutData.set([lc[0], lc[1], lc[2], 255], (W_LUT + i) * 4);
    }
    const lutTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, lutTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W_LUT, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, lutData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Generate Lon/Lat grid mesh (192 x 96)
    const SEG_X = 192, SEG_Y = 96;
    const verts = new Float32Array((SEG_X + 1) * (SEG_Y + 1) * 2);
    let vi = 0;
    for (let y = 0; y <= SEG_Y; y++) {
      for (let x = 0; x <= SEG_X; x++) {
        verts[vi++] = -180 + (360 * x) / SEG_X;
        verts[vi++] = 90 - (180 * y) / SEG_Y;
      }
    }
    const idx = new Uint32Array(SEG_X * SEG_Y * 6);
    let ii = 0;
    for (let y = 0; y < SEG_Y; y++) {
      for (let x = 0; x < SEG_X; x++) {
        const a = y * (SEG_X + 1) + x, b = a + 1, c = a + SEG_X + 1, d = c + 1;
        idx[ii++] = a; idx[ii++] = c; idx[ii++] = b;
        idx[ii++] = b; idx[ii++] = c; idx[ii++] = d;
      }
    }
    const meshVao = gl.createVertexArray();
    gl.bindVertexArray(meshVao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    const MESH_COUNT = SEG_X * SEG_Y * 6;

    const bgVao = gl.createVertexArray();

    // Elevation Texture
    const elevTex = gl.createTexture();
    let elevLoaded = false;
    let texW = 1080, texH = 540;

    // Load NOAA Elevation image
    const elevImg = new Image();
    elevImg.src = '/contourlines/data/elev-1080.png';
    elevImg.onload = () => {
      texW = elevImg.width;
      texH = elevImg.height;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, elevTex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, elevImg);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      elevLoaded = true;
      setIsLoading(false);
      if (onReady) onReady();
    };

    // Resize handler
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        viewRef.current.viewportWidth = rect.width;
        viewRef.current.viewportHeight = rect.height;
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Main Render Loop
    let running = true;
    const render = () => {
      if (!running) return;

      // Handle Camera Flight
      if (flyAnimationRef.current) {
        const anim = flyAnimationRef.current;
        const now = performance.now();
        const elapsed = now - anim.startTime;
        const progress = Math.min(1.0, elapsed / anim.duration);
        // Cubic ease in-out
        const t = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        viewRef.current.lon = anim.startLon + (anim.targetLon - anim.startLon) * t;
        viewRef.current.lat = anim.startLat + (anim.targetLat - anim.startLat) * t;
        viewRef.current.scale = anim.startScale + (anim.targetScale - anim.startScale) * t;

        if (progress >= 1.0) {
          flyAnimationRef.current = null;
          if (anim.onComplete) anim.onComplete();
        }
      }

      const v = viewRef.current;
      updateSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.enable(gl.DEPTH_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Render Starry Background & Atmosphere Glow
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(bgProg.prog);
      gl.bindVertexArray(bgVao);
      gl.uniform2f(bgProg.u.uViewport, v.viewportWidth, v.viewportHeight);
      gl.uniform1f(bgProg.u.uR, v.scale * DEG_R);
      gl.uniform1f(bgProg.u.uMorph, v.morph);
      if (bgProg.u.uTime) gl.uniform1f(bgProg.u.uTime, performance.now() * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Render Earth Topo Mesh
      if (elevLoaded) {
        gl.enable(gl.DEPTH_TEST);
        gl.useProgram(meshProg.prog);
        gl.bindVertexArray(meshVao);

        gl.uniform2f(meshProg.u.uCenter, v.lon, v.lat);
        gl.uniform1f(meshProg.u.uScale, v.scale);
        gl.uniform1f(meshProg.u.uMorph, v.morph);
        gl.uniform2f(meshProg.u.uViewport, v.viewportWidth, v.viewportHeight);
        gl.uniform2f(meshProg.u.uTexSize, texW, texH);
        gl.uniform1f(meshProg.u.uSeaLevel, v.seaLevel);
        gl.uniform1f(meshProg.u.uInterval, 100.0);
        gl.uniform1f(meshProg.u.uAlpha, 1.0);
        gl.uniform1f(meshProg.u.uHillshade, 1.0);
        gl.uniform1f(meshProg.u.uGraticule, 1.0);
        gl.uniform1f(meshProg.u.uRefCoast, 0.0);
        gl.uniform1f(meshProg.u.uMetersPerPx, Math.max(1.0, 111000 / v.scale));

        gl.uniform1i(meshProg.u.uTex, 0);
        gl.uniform1i(meshProg.u.uLUT, 1);

        // Center copy
        gl.uniform1f(meshProg.u.uCopyOffset, 0.0);
        gl.drawElements(gl.TRIANGLES, MESH_COUNT, gl.UNSIGNED_INT, 0);

        // Wrapping copy left
        gl.uniform1f(meshProg.u.uCopyOffset, -360.0);
        gl.drawElements(gl.TRIANGLES, MESH_COUNT, gl.UNSIGNED_INT, 0);

        // Wrapping copy right
        gl.uniform1f(meshProg.u.uCopyOffset, 360.0);
        gl.drawElements(gl.TRIANGLES, MESH_COUNT, gl.UNSIGNED_INT, 0);
      }

      if (onViewChange) {
        onViewChange({ ...v });
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      window.removeEventListener('resize', updateSize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [onReady, onViewChange]);

  // Pointer interaction: drag to rotate, wheel to zoom
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    const v = viewRef.current;
    const sensitivity = 0.4 / Math.max(0.2, v.scale);
    v.lon = ((((v.lon - dx * sensitivity) + 180) % 360) + 360) % 360 - 180;
    v.lat = Math.max(-85, Math.min(85, v.lat + dy * sensitivity));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const v = viewRef.current;
    const factor = e.deltaY > 0 ? 0.9 : 1.11;
    v.scale = Math.max(1.2, Math.min(45.0, v.scale * factor));
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#030914]">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#071322]/80 backdrop-blur-xs flex flex-col items-center justify-center text-white z-30 font-mono text-xs">
          <div className="w-8 h-8 rounded-full border-2 border-[#C87954] border-t-transparent animate-spin mb-3" />
          <p className="tracking-widest uppercase text-[#454640] font-semibold">Streaming NOAA Bathymetry</p>
          <p className="text-[10px] text-white/50 mt-1">Decoding 16-bit elevation heightmap...</p>
        </div>
      )}

      {/* Earth Controls Pill in Official VARUNASETU Styling */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-[#F7F3EA]/95 backdrop-blur-md p-1.5 rounded-xl border border-[#D4C4A8] shadow-md text-xs font-sans">
        <button
          onClick={() => {
            const v = viewRef.current;
            v.morph = v.morph > 0.5 ? 0.0 : 1.0;
          }}
          className="px-2.5 py-1 rounded-lg bg-[#83B9A9] hover:bg-[#687B59] text-[#454640] hover:text-white border border-[#D4C4A8] transition-all font-semibold"
          title="Toggle Globe / Flat Equirectangular Projection"
        >
          Globe / 2D
        </button>
        <button
          onClick={() => {
            viewRef.current.scale = Math.min(45.0, viewRef.current.scale * 1.3);
          }}
          className="p-1.5 rounded-lg bg-[#E8D9BF] hover:bg-[#D4C4A8] text-[#454640] border border-[#D4C4A8] transition-all"
          title="Zoom In"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={() => {
            viewRef.current.scale = Math.max(1.2, viewRef.current.scale * 0.77);
          }}
          className="p-1.5 rounded-lg bg-[#E8D9BF] hover:bg-[#D4C4A8] text-[#454640] border border-[#D4C4A8] transition-all"
          title="Zoom Out"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={() => {
            viewRef.current.lon = initialLon;
            viewRef.current.lat = initialLat;
            viewRef.current.scale = initialScale;
          }}
          className="px-2.5 py-1 rounded-lg bg-[#E8D9BF] hover:bg-[#D4C4A8] text-[#454640] border border-[#D4C4A8] transition-all font-medium"
          title="Reset to Incident Epicenter"
        >
          Reset
        </button>
      </div>
    </div>
  );
});

