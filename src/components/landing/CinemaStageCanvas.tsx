"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 30fps lookup tables adapted from frame-measured cinema reels:
 * - DOOR_TABLE: slow-start then rapid outward split of the two center-seam doors (÷ 664)
 * - FAN_TABLE: shared fan-out easing curve for the 8 vertical amphitheatre slices
 * - PAN_TABLE: perspective camera-tilt curve driven by critically damped scroll spring
 */
const DOOR_TABLE = [
  0, 0, 1, 2, 3, 6, 10, 15, 22, 30, 40, 51, 64, 79, 95, 112, 129, 148, 166.5,
  185, 203.5, 222, 240.5, 259, 277.5, 296, 314.5, 333, 351.5,
].map((v) => v / 664);

const FAN_TABLE = [
  0, 0.005, 0.012, 0.019, 0.021, 0.03, 0.043, 0.061, 0.082, 0.109, 0.141, 0.176,
  0.216, 0.261, 0.308, 0.358, 0.41, 0.464, 0.518, 0.573, 0.626, 0.678, 0.727,
  0.773, 0.814, 0.852, 0.885, 0.915, 0.938, 0.958, 0.972, 0.983, 0.992, 0.996,
  0.999, 1,
];

const PAN_TABLE = [
  0, 0.25, 0.5, 1.25, 2.5, 4.25, 6.5, 9.5, 13.25, 17.5, 22.5, 28.25, 34.25,
  40.75, 47.75, 55.25, 62.75, 70.5, 78.5, 86.5, 94.25, 101.5, 108.5, 114.75,
  120.75, 125.75, 130.25, 133.75, 136.5, 138.5, 139.5, 139.75,
].map((v) => v / 139.75);

/** 8 vertical amphitheatre slices (outer drawn last so they lead in front during fan-out). */
const SLICES: { u0: number; u1: number; side: -1 | 0 | 1; order: number }[] = [
  { u0: -0.08, u1: 0.205, side: -1, order: 7 }, // outer left
  { u0: 0.205, u1: 0.325, side: -1, order: 5 },
  { u0: 0.325, u1: 0.36, side: -1, order: 3 },
  { u0: 0.36, u1: 0.39, side: -1, order: 1 },
  { u0: 0.39, u1: 0.61, side: 0, order: 0 },   // center vanishing arch (anchored)
  { u0: 0.61, u1: 0.64, side: 1, order: 2 },
  { u0: 0.64, u1: 0.795, side: 1, order: 4 },
  { u0: 0.795, u1: 1.08, side: 1, order: 6 },  // outer right
];

function sampleTable(tbl: number[], tSec: number): number {
  if (tSec <= 0) return tbl[0];
  const f = tSec * 30;
  const i = Math.floor(f);
  if (i >= tbl.length - 1) return tbl[tbl.length - 1];
  return tbl[i] + (tbl[i + 1] - tbl[i]) * (f - i);
}

const VERT_SRC = `#version 300 es
precision highp float;
in vec2 a_uv;
uniform vec2 u_res;
uniform vec2 u_plateSize;
uniform float u_plateX;
uniform float u_pieceOffset;
uniform float u_pan;
uniform vec2 u_mouse;
out vec2 v_uv;

void main() {
  float xf = u_plateX + a_uv.x * u_plateSize.x;
  float d = (xf - u_res.x * 0.5) / max(u_res.x, 1.0);
  // Smooth continuous perspective tilt: edges rise strongly while exact center stays anchored
  float rise = min(0.32, 0.022 + 1.02 * pow(abs(d), 1.5));
  float x = xf + u_pieceOffset + u_mouse.x * 10.0;
  float y = a_uv.y * u_plateSize.y - u_pan * rise * u_res.y + u_mouse.y * 6.0;

  vec2 clip = (vec2(x, y) / u_res) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_uv = a_uv;
}`;

const FRAG_SRC = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex1;
uniform sampler2D u_tex2;
uniform float u_mix;
out vec4 outColor;

vec2 mirrorUv(vec2 uv) {
  float u = uv.x;
  if (u < 0.0) u = -u;
  if (u > 1.0) u = 2.0 - u;
  return vec2(clamp(u, 0.0, 1.0), clamp(uv.y, 0.0, 1.0));
}

void main() {
  vec2 uv1 = mirrorUv(v_uv);
  // Subtle horizontal arc shift on Plate 2 as the camera swings into three-quarter angle
  vec2 uv2 = mirrorUv(vec2(v_uv.x + (1.0 - u_mix) * 0.04, v_uv.y));
  vec4 c1 = texture(u_tex1, uv1);
  vec4 c2 = texture(u_tex2, uv2);

  // Subtle warm golden-dusk lift in Act 1 -> deep crimson-lavender neon contrast in Act 2
  vec3 warmLift = c1.rgb * vec3(1.06, 1.02, 0.96);
  vec3 neonNight = c2.rgb * vec3(1.04, 0.96, 1.08);
  vec3 col = mix(warmLift, neonNight, u_mix);
  outColor = vec4(col, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function loadTexture(gl: WebGL2RenderingContext, img: HTMLImageElement) {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  return tex;
}

/**
 * Real WebGL2 8-slice fan-out + continuous r(d) perspective camera-tilt stage.
 * Pairs with split-open center-seam architectural doors on initial load, then
 * responds to scroll via a critically damped spring (omega = 9) for buttery reversibility.
 */
export function CinemaStageCanvas({
  scrollProgressRef,
  mouseRef,
  reduced,
  onDoorFrame,
  onIntroReady,
}: {
  scrollProgressRef: React.MutableRefObject<number>;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
  reduced: boolean;
  onDoorFrame: (doorOffsetRatio: number, clipInsetPx: number, doorsGone: boolean) => void;
  onIntroReady?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      powerPreference: "high-performance",
    });
    if (!gl) {
      setFallback(true);
      onDoorFrame(1, 0, true);
      onIntroReady?.();
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) {
      setFallback(true);
      onDoorFrame(1, 0, true);
      onIntroReady?.();
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFallback(true);
      onDoorFrame(1, 0, true);
      onIntroReady?.();
      return;
    }

    gl.useProgram(prog);

    // Build 48-column x 2-row triangle strips for each of the 8 slices
    const COLS = 48;
    const locUv = gl.getAttribLocation(prog, "a_uv");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uPlateSize = gl.getUniformLocation(prog, "u_plateSize");
    const uPlateX = gl.getUniformLocation(prog, "u_plateX");
    const uPieceOffset = gl.getUniformLocation(prog, "u_pieceOffset");
    const uPan = gl.getUniformLocation(prog, "u_pan");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uTex1 = gl.getUniformLocation(prog, "u_tex1");
    const uTex2 = gl.getUniformLocation(prog, "u_tex2");
    const uMix = gl.getUniformLocation(prog, "u_mix");

    const drawOrder = [...SLICES].sort((a, b) => a.order - b.order);
    const meshes = drawOrder.map((sl) => {
      const verts = new Float32Array((COLS + 1) * 2 * 2);
      let ptr = 0;
      for (let c = 0; c <= COLS; c++) {
        const u = sl.u0 + (sl.u1 - sl.u0) * (c / COLS);
        verts[ptr++] = u;
        verts[ptr++] = 0;
        verts[ptr++] = u;
        verts[ptr++] = 1;
      }
      const vao = gl.createVertexArray();
      const vbo = gl.createBuffer();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(locUv);
      gl.vertexAttribPointer(locUv, 2, gl.FLOAT, false, 0, 0);
      return { sl, vao, vbo, count: (COLS + 1) * 2 };
    });

    let tex1: WebGLTexture | null = null;
    let tex2: WebGLTexture | null = null;
    let dead = false;
    let raf = 0;
    let startTime = 0;
    let lastTime = 0;

    // Critically damped spring (omega = 9) matching Noche Viva's scroll feel
    let sCur = 0;
    let sVel = 0;

    let cssW = 1440;
    let cssH = 900;
    let pw = 1440;
    let ph = 900;
    let px = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = canvas.clientWidth || window.innerWidth;
      cssH = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.floor(cssW * dpr));
      canvas.height = Math.max(1, Math.floor(cssH * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      // 1.26 height cover factor ensures outer tilted columns never expose background edge
      const aspect = 16 / 9;
      ph = Math.max(cssW / aspect, 1.26 * cssH);
      pw = aspect * ph;
      px = (cssW - pw) / 2;
    };
    resize();
    window.addEventListener("resize", resize);

    const loadImg = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.decoding = "async";
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = src;
      });

    Promise.all([
      loadImg("/images/cinematic/hero-plate.jpg"),
      loadImg("/images/cinematic/scene2-plate.jpg"),
    ])
      .then(([im1, im2]) => {
        if (dead) return;
        tex1 = loadTexture(gl, im1);
        tex2 = loadTexture(gl, im2);
        startTime = performance.now();
        lastTime = startTime;
        onIntroReady?.();

        const render = (now: number) => {
          if (dead) return;
          const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
          lastTime = now;

          const elapsed = (now - startTime) / 1000;
          // 0.34s hold on the split center seam, then doors part + 8 slices fan outward
          const T = reduced ? 10 : elapsed - 0.34;
          const doorS = reduced ? 1 : sampleTable(DOOR_TABLE, T);
          const doorsGone = reduced || doorS * cssW > cssW * 0.5 + 4;
          const halfWindow = (8.5 / 664 + doorS - 7.5 / 664) * cssW;
          const clipInset = doorsGone ? 0 : Math.max(0, cssW * 0.5 - halfWindow);
          onDoorFrame(doorS, clipInset, doorsGone);

          // Map hero scroll progress (0 -> 0.54) into the tilt + twilight night crossfade
          const rawTarget = T < 1.15 && !reduced ? 0 : Math.min(1, Math.max(0, scrollProgressRef.current / 0.54));
          if (reduced) {
            sCur = rawTarget;
            sVel = 0;
          } else {
            const omega = 9;
            const acc = omega * omega * (rawTarget - sCur) - 2 * omega * sVel;
            sVel += acc * dt;
            sCur += sVel * dt;
            if (Math.abs(rawTarget - sCur) < 1e-4 && Math.abs(sVel) < 1e-4) {
              sCur = rawTarget;
              sVel = 0;
            }
          }

          const panVal = sampleTable(PAN_TABLE, (sCur * 31) / 30);
          const mixVal = Math.min(1, Math.max(0, (sCur - 0.12) / 0.72));

          gl.clearColor(0.071, 0.067, 0.063, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.useProgram(prog);
          gl.uniform2f(uRes, cssW, cssH);
          gl.uniform2f(uPlateSize, pw, ph);
          gl.uniform1f(uPlateX, px);
          gl.uniform1f(uPan, panVal);
          gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
          gl.uniform1f(uMix, mixVal);

          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, tex1);
          gl.uniform1i(uTex1, 0);

          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, tex2);
          gl.uniform1i(uTex2, 1);

          for (const mesh of meshes) {
            const { u0, u1, side } = mesh.sl;
            let offset = 0;
            if (!reduced && side !== 0 && T < 1.45) {
              const x0 = Math.max(0, px + u0 * pw);
              const x1 = Math.min(cssW, px + u1 * pw);
              const mid = ((x0 + x1) * 0.5) / Math.max(cssW, 1);
              const travel = 0.93 * Math.abs(mid - 0.5) * cssW;
              const lead = Math.max(0, 0.25 * (0.41 - travel / Math.max(cssW, 1)));
              const fanP = sampleTable(FAN_TABLE, T + lead);
              offset = -side * (1 - fanP) * travel;
            }
            gl.uniform1f(uPieceOffset, offset);
            gl.bindVertexArray(mesh.vao);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, mesh.count);
          }

          raf = requestAnimationFrame(render);
        };

        raf = requestAnimationFrame(render);
      })
      .catch(() => {
        if (dead) return;
        setFallback(true);
        onDoorFrame(1, 0, true);
        onIntroReady?.();
      });

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      for (const mesh of meshes) {
        gl.deleteVertexArray(mesh.vao);
        gl.deleteBuffer(mesh.vbo);
      }
      if (tex1) gl.deleteTexture(tex1);
      if (tex2) gl.deleteTexture(tex2);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [mouseRef, onDoorFrame, onIntroReady, reduced, scrollProgressRef]);

  if (fallback) {
    return (
      <img
        src="/images/cinematic/hero-plate.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
