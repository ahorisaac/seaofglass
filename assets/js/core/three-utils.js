/* ============================================================
   Shared three.js helpers: renderer, sizing, loops, visibility.
   One rAF loop per scene; loops pause off-screen / hidden tab.
   ============================================================ */
import * as THREE from "three";

export const PALETTE = {
  bg: 0x070b13,
  cyan: 0x38e0ff,
  teal: 0x3cf5b6,
  violet: 0x8f7bff,
  red: 0xff4d6d,
  amber: 0xffb454,
  blue: 0x4da3ff,
  tube: 0x1b3a55,
};
export const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const COARSE = matchMedia("(pointer: coarse)").matches;

/* Renderer with capped pixel ratio + filmic tone mapping */
export function makeRenderer(canvas) {
  if (!window.WebGLRenderingContext) throw new Error("WebGL unsupported");
  const r = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, COARSE ? 1.4 : 1.75));
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.1;
  return r;
}

/* Match renderer/camera/composer to the canvas CSS box */
export function fitRenderer(canvas, renderer, camera, composer) {
  const w = canvas.clientWidth || 1,
    h = canvas.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  composer && composer.setSize(w, h);
}
export function onResize(canvas, fn) {
  new ResizeObserver(fn).observe(canvas);
  fn();
}

/* Soft round particle texture, generated once per scene */
export function softDot() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,.5)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/* Single guarded requestAnimationFrame loop */
export class Loop {
  constructor(fn) {
    this.fn = fn;
    this.running = false;
    this.raf = 0;
    this.last = 0;
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now) => {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, 0.05);
      this.last = now;
      this.fn(dt, now / 1000);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
}

/* Run a loop only while its element is on-screen and tab visible */
export function autoRun(el, loop) {
  let inView = false;
  const update = () =>
    inView && !document.hidden ? loop.start() : loop.stop();
  new IntersectionObserver(
    ([e]) => {
      inView = e.isIntersecting;
      update();
    },
    { rootMargin: "120px" },
  ).observe(el);
  document.addEventListener("visibilitychange", update);
}

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
