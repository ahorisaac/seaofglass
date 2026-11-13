/* ============================================================
   LIVE GLOBE · simulated global attack telemetry
   Drag to orbit, wheel to zoom, console tunes the storm live.
   ============================================================ */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import {
  PALETTE,
  REDUCED,
  makeRenderer,
  fitRenderer,
  onResize,
  softDot,
  Loop,
  autoRun,
} from "../core/three-utils.js";

const R = 5; // globe radius

const CITIES = [
  ["New York", 40.7, -74],
  ["San Francisco", 37.8, -122.4],
  ["Toronto", 43.7, -79.4],
  ["São Paulo", -23.5, -46.6],
  ["London", 51.5, -0.1],
  ["Frankfurt", 50.1, 8.7],
  ["Amsterdam", 52.4, 4.9],
  ["Moscow", 55.8, 37.6],
  ["Lagos", 6.5, 3.4],
  ["Dubai", 25.2, 55.3],
  ["Mumbai", 19.1, 72.9],
  ["Singapore", 1.35, 103.8],
  ["Beijing", 39.9, 116.4],
  ["Seoul", 37.6, 127],
  ["Tokyo", 35.7, 139.7],
  ["Sydney", -33.9, 151.2],
];
const TYPES = [
  { name: "SQL Injection", hex: "#ff4d6d", sev: "critical" },
  { name: "DDoS Flood", hex: "#ff4d6d", sev: "critical" },
  { name: "Ransomware C2", hex: "#ff4d6d", sev: "critical" },
  { name: "SSH Brute-Force", hex: "#ffb454", sev: "high" },
  { name: "Phishing Relay", hex: "#ffb454", sev: "high" },
  { name: "XSS Probe", hex: "#8f7bff", sev: "medium" },
  { name: "Credential Stuffing", hex: "#8f7bff", sev: "medium" },
  { name: "Port Scan", hex: "#38e0ff", sev: "recon" },
  { name: "DNS Recon", hex: "#38e0ff", sev: "recon" },
];

const latLon = (lat, lon, r) => {
  const phi = ((90 - lat) * Math.PI) / 180,
    theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
};

/* ---------- Live parameters (wired to the console) ---------- */
const params = { rate: 1.2, alt: 1, mix: "mixed" };
const stats = { total: 0, blocked: 0 };
const feedEl = document.getElementById("g-feed");
const totalEl = document.getElementById("g-total");
const blockedEl = document.getElementById("g-blocked");
const liveEl = document.getElementById("g-live");

/* Commit an attack to the feed + counters */
function commit(entry) {
  stats.total++;
  if (entry.mitigated) stats.blocked++;
  totalEl.textContent = stats.total;
  blockedEl.textContent = stats.blocked;
  const li = document.createElement("li");
  li.innerHTML = `<time>${entry.time}</time><i class="fdot" style="--c:${entry.type.hex}"></i>
    <span class="fbody"><b>${entry.type.name}</b><span>${entry.src.name} → ${entry.dst.name}</span></span>
    <em class="chip ${entry.mitigated ? "ok" : "bad"}">${entry.mitigated ? "mitigated" : "landed"}</em>`;
  feedEl.prepend(li);
  while (feedEl.children.length > 9) feedEl.lastChild.remove();
}

function makeEntry(cities) {
  const pool =
    params.mix === "mixed" ? TYPES : TYPES.filter((t) => t.sev === params.mix);
  const type = pool[Math.floor(Math.random() * pool.length)];
  let a = Math.floor(Math.random() * cities.length),
    b;
  do {
    b = Math.floor(Math.random() * cities.length);
  } while (b === a);
  return {
    type,
    src: cities[a],
    dst: cities[b],
    mitigated: Math.random() < 0.62,
    time: new Date().toISOString().slice(11, 19) + "Z",
  };
}

/* ---------- 3D view ---------- */
class GlobeView {
  constructor(canvas) {
    this.renderer = makeRenderer(canvas);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.bg);
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    this.camera.position.set(0, 4, 13);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.enablePan = false;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 20;
    this.controls.autoRotate = !REDUCED;
    this.controls.autoRotateSpeed = 0.6;
    this.controls.saveState();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(600, 500),
      0.8,
      0.5,
      0.2,
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.scene.add(new THREE.AmbientLight(0x30405f, 1.5));
    const key = new THREE.DirectionalLight(0x9fd8ff, 2);
    key.position.set(6, 8, 10);
    const rim = new THREE.DirectionalLight(PALETTE.violet, 0.9);
    rim.position.set(-8, -4, -6);
    this.scene.add(key, rim);

    // Planet + graticule
    this.planet = new THREE.Mesh(
      new THREE.SphereGeometry(R, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0x0c1628,
        roughness: 0.85,
        metalness: 0.35,
        emissive: 0x0a1a30,
        emissiveIntensity: 0.4,
      }),
    );
    this.graticule = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.004, 24, 16),
      new THREE.MeshBasicMaterial({
        color: PALETTE.cyan,
        wireframe: true,
        transparent: true,
        opacity: 0.06,
      }),
    );
    this.scene.add(this.planet, this.graticule);

    // Atmosphere rim glow (back-side shader)
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.11, 48, 48),
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(PALETTE.cyan) } },
        vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform vec3 uColor; varying vec3 vN;
          void main(){ float i = pow(max(0.0, 0.72 - dot(vN, vec3(0.0, 0.0, 1.0))), 3.0);
          gl_FragColor = vec4(uColor, 1.0) * i; }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    );
    this.scene.add(atmo);

    // City nodes
    this.dot = softDot();
    const cityGeo = new THREE.SphereGeometry(0.06, 8, 8);
    this.cities = CITIES.map(([name, lat, lon]) => {
      const pos = latLon(lat, lon, R * 1.01);
      const mat = new THREE.MeshBasicMaterial({ color: PALETTE.cyan });
      const mesh = new THREE.Mesh(cityGeo, mat);
      mesh.position.copy(pos);
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.dot,
          color: PALETTE.cyan,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          opacity: 0.8,
        }),
      );
      glow.scale.setScalar(0.5);
      mesh.add(glow);
      this.scene.add(mesh);
      return { name, pos, mesh, pulse: 0 };
    });

    // Starfield
    const n = 700,
      sp = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3()
        .randomDirection()
        .multiplyScalar(28 + Math.random() * 32);
      sp.set([v.x, v.y, v.z], i * 3);
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    this.stars = new THREE.Points(
      sGeo,
      new THREE.PointsMaterial({
        size: 0.09,
        map: this.dot,
        color: 0x9db0c9,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.scene.add(this.stars);

    this.arcs = [];
    this.rings = [];
    this.ringGeo = new THREE.RingGeometry(0.08, 0.12, 32);
    this.spawnAcc = 0;

    onResize(canvas, () =>
      fitRenderer(canvas, this.renderer, this.camera, this.composer),
    );
  }

  addArc(entry) {
    const a = entry.src.pos.clone().normalize(),
      b = entry.dst.pos.clone().normalize();
    const angle = a.angleTo(b);
    const lift = R * (1 + params.alt * (0.22 + angle * 0.5));
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      const dir = a.clone().lerp(b, t).normalize();
      pts.push(
        dir.multiplyScalar(R * 1.01 + Math.sin(Math.PI * t) * (lift - R)),
      );
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 64, 0.02, 6, false);
    geo.setDrawRange(0, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(entry.type.hex),
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
    this.arcs.push({
      mesh,
      geo,
      mat,
      entry,
      t: 0,
      dur: 2.4,
      hit: false,
      indexCount: geo.index.count,
    });
  }

  impact(entry) {
    const color = entry.mitigated
      ? PALETTE.teal
      : new THREE.Color(entry.type.hex).getHex();
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(this.ringGeo, mat);
    ring.position.copy(entry.dst.pos);
    ring.lookAt(entry.dst.pos.clone().multiplyScalar(2));
    this.scene.add(ring);
    this.rings.push({ m: ring, life: 0.8, max: 0.8 });
    entry.dst.pulse = 1;
    commit(entry);
  }

  storm(count) {
    for (let i = 0; i < count && this.arcs.length < 26; i++)
      this.addArc(makeEntry(this.cities));
  }

  update(dt) {
    this.controls.update();

    // Spawn attacks at the chosen rate
    this.spawnAcc += dt * params.rate;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      if (this.arcs.length < 18) this.addArc(makeEntry(this.cities));
    }

    // Arcs: reveal → impact → fade → dispose
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      const a = this.arcs[i];
      a.t += dt / a.dur;
      const reveal = Math.min(1, a.t / 0.6);
      a.geo.setDrawRange(0, Math.floor((a.indexCount * reveal) / 3) * 3);
      if (a.t >= 0.6 && !a.hit) {
        a.hit = true;
        this.impact(a.entry);
      }
      a.mat.opacity =
        a.t < 0.75 ? 0.95 : Math.max(0, 0.95 * (1 - (a.t - 0.75) / 0.25));
      if (a.t >= 1) {
        this.scene.remove(a.mesh);
        a.geo.dispose();
        a.mat.dispose();
        this.arcs.splice(i, 1);
      }
    }

    // Impact rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      const f = Math.max(0, r.life / r.max);
      r.m.scale.setScalar(0.4 + (1 - f) * 3);
      r.m.material.opacity = f * 0.9;
      if (r.life <= 0) {
        this.scene.remove(r.m);
        r.m.material.dispose();
        this.rings.splice(i, 1);
      }
    }

    // City hit flashes + starfield drift
    this.cities.forEach((c) => {
      c.pulse = Math.max(0, c.pulse - dt * 2.4);
      c.mesh.scale.setScalar(1 + c.pulse * 2);
    });
    this.stars.rotation.y += dt * 0.004;

    const live = this.arcs.length;
    if (liveEl.textContent !== String(live)) liveEl.textContent = live;

    this.composer.render();
  }
}

/* ---------- Boot + console wiring ---------- */
const section = document.getElementById("globe");
const canvas = document.getElementById("globe-canvas");
if (section && canvas) {
  let view = null;
  const fallbackCities = CITIES.map(([name]) => ({ name }));
  try {
    view = new GlobeView(canvas);
  } catch {
    document.getElementById("globe-fallback").classList.add("show");
    canvas.style.display = "none";
    liveEl.textContent = "—";
  }

  // Without WebGL the feed still lives on a plain timer
  let fbAcc = 0;
  const loop = new Loop((dt) => {
    if (view) view.update(dt);
    else {
      fbAcc += dt * params.rate;
      while (fbAcc >= 1) {
        fbAcc -= 1;
        commit(makeEntry(fallbackCities));
      }
    }
  });
  autoRun(section, loop);

  const bind = (id, fn) => {
    const el = document.getElementById(id);
    el && el.addEventListener("input", () => fn(el));
  };
  const out = (id, v) => {
    const o = document.getElementById(id);
    if (o) o.textContent = v;
  };

  bind("g-rotate", (el) => {
    if (view) view.controls.autoRotate = el.checked;
  });
  bind("g-speed", (el) => {
    out("g-speed-out", (+el.value).toFixed(1));
    if (view) view.controls.autoRotateSpeed = +el.value;
  });
  bind("g-rate", (el) => {
    out("g-rate-out", (+el.value).toFixed(1));
    params.rate = +el.value;
  });
  bind("g-alt", (el) => {
    out("g-alt-out", (+el.value).toFixed(2));
    params.alt = +el.value;
  });
  bind("g-glow", (el) => {
    out("g-glow-out", (+el.value).toFixed(2));
    if (view) view.bloom.strength = +el.value;
  });
  bind("g-grid", (el) => {
    if (view) view.graticule.visible = el.checked;
  });
  bind("g-mix", (el) => {
    params.mix = el.value;
  });
  document
    .getElementById("g-reset")
    .addEventListener("click", () => view && view.controls.reset());
  document.getElementById("g-storm").addEventListener("click", () => {
    if (view) view.storm(12);
    else for (let i = 0; i < 12; i++) commit(makeEntry(fallbackCities));
  });
  if (REDUCED) {
    const r = document.getElementById("g-rotate");
    r.checked = false;
  }
}
