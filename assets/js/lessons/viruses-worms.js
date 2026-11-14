/* Viruses vs Worms lesson + network spread simulator. */
import { initLesson } from "../core/lesson-engine.js";

initLesson({
  slug: "viruses-worms",
  flag: "FLAG{s3lf_pr0p4g4t10n}",
  files: {
    "mission.txt": [
      "MISSION: which malware type spreads without human action?",
      "Read spread.txt, then run: verify <type>",
    ],
    "spread.txt": [
      "Virus — infects a host file; usually needs a human to move/run it.",
      "Worm  — standalone; scans and spreads across networks by itself.",
      "Memory hook: virus rides, worm roams.",
    ],
  },
  verify: {
    answers: ["worm", "worms"],
    usage: "verify <virus|worm>",
    hint: "It roams the network on its own.",
    success: ["[+] correct: worms self-propagate without user action."],
  },
  intro: [
    [
      "Sea of Glass training shell — Enter runs commands; the page never reloads.",
      "dim",
    ],
    ["start here: cat mission.txt", "ok"],
  ],
  questions: [
    {
      q: "A virus typically needs…",
      opts: [
        "A host file and user action",
        "A public IP address",
        "A TLS certificate",
        "A cloud account",
      ],
      a: 0,
      why: "Viruses ride host files and spread when humans move or execute them.",
    },
    {
      q: "A worm is dangerous because it…",
      opts: [
        "Only shows ads",
        "Self-propagates across networks",
        "Cannot run on Linux",
        "Never uses the network",
      ],
      a: 1,
      why: "Every infected host becomes a new launcher, causing exponential growth.",
    },
    {
      q: "Which pair is the strongest worm defence?",
      opts: [
        "Bigger monitors and faster CPUs",
        "Patching and segmentation",
        "Longer domain names",
        "Disabling cookies",
      ],
      a: 1,
      why: "Patching removes the vulnerability; segmentation limits blast radius.",
    },
    {
      q: "The Morris Worm is famous because…",
      opts: [
        "It was early self-spreading malware",
        "It was a browser theme",
        "It only infected phones",
        "It was ransomware in 2017",
      ],
      a: 0,
      why: "Morris (1988) was a landmark internet worm and helped inspire CERT.",
    },
  ],
});

const $ = (id) => document.getElementById(id);
const COLS = 12,
  ROWS = 10,
  TOTAL = COLS * ROWS;
const grid = $("vw-grid");
let state = [],
  timer = null,
  tick = 0,
  history = [];

const quadrant = (i) =>
  (i % COLS < COLS / 2 ? 0 : 1) + (Math.floor(i / COLS) < ROWS / 2 ? 0 : 2);
const infectedCount = () => state.filter((s) => s === 1).length;
const neighbors = (i) => {
  const x = i % COLS,
    y = Math.floor(i / COLS),
    out = [];
  if (x > 0) out.push(i - 1);
  if (x < COLS - 1) out.push(i + 1);
  if (y > 0) out.push(i - COLS);
  if (y < ROWS - 1) out.push(i + COLS);
  return out;
};
function render() {
  [...grid.children].forEach((el, i) => {
    el.className =
      "vw-node" +
      (state[i] === 1 ? " infected" : state[i] === 2 ? " patched" : "");
  });
  $("vw-count").textContent = infectedCount();
  $("vw-tick").textContent = tick;
  const pts = history
    .map(
      (v, i) =>
        `${(i / Math.max(1, history.length - 1)) * 300},${70 - (v / TOTAL) * 66}`,
    )
    .join(" ");
  $("vw-line").setAttribute("points", pts);
}
function seed() {
  const patchPct = +$("vw-patch").value / 100;
  state = Array.from({ length: TOTAL }, () =>
    Math.random() < patchPct ? 2 : 0,
  );
  tick = 0;
  history = [0];
  render();
}
function patientZero() {
  const candidates = state
    .map((s, i) => (s === 0 ? i : -1))
    .filter((i) => i >= 0);
  if (!candidates.length) return;
  const i = candidates[Math.floor(Math.random() * candidates.length)];
  state[i] = 1;
  history.push(infectedCount());
  tick++;
  render();
}
function step() {
  const mode = $("vw-select").value;
  const next = [...state];
  const infected = state
    .map((s, i) => (s === 1 ? i : -1))
    .filter((i) => i >= 0);
  if (!infected.length) {
    patientZero();
    return;
  }
  if (mode === "virus") {
    const chance = ((100 - +$("vw-caution").value) / 100) * 0.55;
    infected.forEach((i) =>
      neighbors(i).forEach((n) => {
        if (state[n] === 0 && Math.random() < chance) next[n] = 1;
      }),
    );
  } else {
    const seg = $("vw-seg").checked;
    infected.forEach((i) => {
      for (let k = 0; k < 2; k++) {
        const target = Math.floor(Math.random() * TOTAL);
        if (state[target] !== 0) continue;
        const cross = quadrant(i) !== quadrant(target);
        if (seg && cross && Math.random() > 0.035) continue;
        if (Math.random() < 0.72) next[target] = 1;
      }
    });
  }
  const before = infectedCount();
  state = next;
  tick++;
  history.push(infectedCount());
  if (history.length > 60) history.shift();
  render();
  if (
    infectedCount() === before ||
    infectedCount() + state.filter((s) => s === 2).length === TOTAL
  )
    stop();
}
function interval() {
  return 1150 - $("vw-speed").value * 95;
}
function stop() {
  clearInterval(timer);
  timer = null;
  $("vw-play").textContent = "Play";
}
function play() {
  if (timer) {
    stop();
    return;
  }
  if (!infectedCount()) patientZero();
  $("vw-play").textContent = "Pause";
  timer = setInterval(step, interval());
}
function reset() {
  stop();
  seed();
  $("vw-mode").textContent = $("vw-select").value.toUpperCase() + " MODE";
  $("vw-note").innerHTML =
    $("vw-select").value === "virus"
      ? "<b>Virus.</b> Neighbour-limited spread, gated by user caution. Raise caution to flatten the curve."
      : "<b>Worm.</b> Machine-paced random scanning. Patching creates immune hosts; segmentation confines outbreaks.";
}
grid.innerHTML = Array.from(
  { length: TOTAL },
  () => '<div class="vw-node"></div>',
).join("");
grid.classList.toggle("segmented", $("vw-seg").checked);
$("vw-select").addEventListener("input", reset);
$("vw-patch").addEventListener("input", () => {
  $("vw-patch-out").textContent = $("vw-patch").value;
  reset();
});
$("vw-caution").addEventListener("input", () => {
  $("vw-caution-out").textContent = $("vw-caution").value;
});
$("vw-speed").addEventListener("input", () => {
  $("vw-speed-out").textContent = $("vw-speed").value;
  if (timer) {
    clearInterval(timer);
    timer = setInterval(step, interval());
  }
});
$("vw-seg").addEventListener("input", (e) => {
  grid.classList.toggle("segmented", e.target.checked);
});
$("vw-zero").addEventListener("click", patientZero);
$("vw-play").addEventListener("click", play);
$("vw-reset").addEventListener("click", reset);
reset();
