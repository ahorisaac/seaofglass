/* Lesson 02 · content + live risk dial. */
import { initLesson } from "../core/lesson-engine.js";

initLesson({
  slug: "threat-vuln-risk",
  flag: "FLAG{st0rm_w1nd0w_l0ss}",
  files: {
    "mission.txt": [
      "MISSION: name the three words behind the window picture.",
      "Read scenario.txt, then run: verify <initials or full words>",
      "Order: storm → window → loss.",
    ],
    "scenario.txt": [
      "A storm is coming. A window is open. A laptop sits beside it.",
      "The storm could damage the laptop. The open window lets it happen.",
      "The possible damage is what you might lose.",
      "Name the three security words in that order.",
    ],
  },
  verify: {
    answers: ["tvr", "threatvulnerabilityrisk"],
    usage: "verify <tvr | threat vulnerability risk>",
    hint: "Storm = Threat, Window = Vulnerability, Loss = Risk.",
    success: ["[+] correct: Threat → Vulnerability → Risk"],
  },
  intro: [
    ['Sea of Glass training shell — type "help" to begin.', "dim"],
    ["start here: cat mission.txt", "ok"],
  ],
  questions: [
    {
      q: "An unpatched public web server is a…",
      opts: ["Threat", "Vulnerability", "Risk treatment", "Impact"],
      a: 1,
      why: "The missing patch is the weakness — the open window. The attacker is the threat; the possible loss is the risk.",
    },
    {
      q: "A ransomware crew running active campaigns is a…",
      opts: ["Vulnerability", "Control", "Threat", "Asset"],
      a: 2,
      why: "The crew is a potential cause of harm — the storm. You reduce how often it succeeds; you cannot delete it from the world.",
    },
    {
      q: "Buying cyber insurance is which risk treatment?",
      opts: ["Avoid", "Mitigate", "Transfer", "Accept"],
      a: 2,
      why: "Insurance shifts some financial loss to another party. It does not remove the bug or stop the attacker.",
    },
    {
      q: "Which control most directly reduces the Impact of ransomware?",
      opts: [
        "Tested backups",
        "A nicer login page",
        "A longer domain name",
        "A bigger monitor",
      ],
      a: 0,
      why: "Backups shrink the loss: you can restore instead of paying. They reduce impact, not the existence of the threat.",
    },
  ],
});

/* ---------- Risk dial ---------- */
const $ = (id) => document.getElementById(id);
const root = $("risk-lab-root");
const SCENARIOS = {
  clinic: {
    t: 7,
    v: 8,
    i: 9,
    sentence: "patient records could leak through staff inboxes",
  },
  server: {
    t: 6,
    v: 9,
    i: 7,
    sentence: "an internet-facing server could be taken over",
  },
  laptop: {
    t: 5,
    v: 6,
    i: 6,
    sentence: "company data could walk out of the building",
  },
};
const ARC = 251.3;
const sliders = { t: $("r-t"), v: $("r-v"), i: $("r-i") };
const outs = { t: $("r-t-out"), v: $("r-v-out"), i: $("r-i-out") };
const toggles = {
  training: $("r-training"),
  patch: $("r-patch"),
  mfa: $("r-mfa"),
  backups: $("r-backups"),
};

function compute() {
  const t0 = +sliders.t.value,
    v0 = +sliders.v.value,
    i0 = +sliders.i.value;
  const t = Math.max(0, t0 - (toggles.training.checked ? 2 : 0));
  const v = Math.max(
    0,
    v0 - (toggles.patch.checked ? 3 : 0) - (toggles.mfa.checked ? 2 : 0),
  );
  const i = Math.max(0, i0 - (toggles.backups.checked ? 3 : 0));
  const score = Math.round((t * v * i) / 10);
  const band =
    score <= 15
      ? "low"
      : score <= 40
        ? "guarded"
        : score <= 70
          ? "high"
          : "critical";
  const label = {
    low: "Low",
    guarded: "Guarded",
    high: "High",
    critical: "Critical",
  }[band];
  root.dataset.band = band;
  outs.t.textContent = t0;
  outs.v.textContent = v0;
  outs.i.textContent = i0;
  $("risk-score").textContent = score;
  $("risk-chip").textContent = label;
  $("risk-formula").textContent = `R = ${t} × ${v} × ${i} ÷ 10 → ${score}`;
  $("risk-arc").style.strokeDashoffset = ARC * (1 - score / 100);
  $("risk-needle").setAttribute(
    "transform",
    `rotate(${-90 + score * 1.8} 100 110)`,
  );
  const scenario = SCENARIOS[$("r-scenario").value];
  let tip = "";
  const factors = [
    { n: "Threat", v: t, c: "training" },
    { n: "Exposure", v: v, c: "patching or MFA" },
    { n: "Impact", v: i, c: "backups" },
  ];
  const top = factors.sort((a, b) => b.v - a.v)[0];
  if (score > 15)
    tip = ` Biggest lever: ${top.n.toLowerCase()} — ${top.c} would cut it.`;
  $("risk-sentence").textContent =
    `A ${label.toLowerCase()} risk: ${scenario.sentence}.${tip}`;
}
function applyScenario(key) {
  const s = SCENARIOS[key];
  sliders.t.value = s.t;
  sliders.v.value = s.v;
  sliders.i.value = s.i;
  Object.values(toggles).forEach((t) => (t.checked = false));
  compute();
}
Object.values(sliders).forEach((s) => s.addEventListener("input", compute));
Object.values(toggles).forEach((t) => t.addEventListener("input", compute));
$("r-scenario").addEventListener("input", (e) => applyScenario(e.target.value));
$("r-reset").addEventListener("click", () =>
  applyScenario($("r-scenario").value),
);
$("r-random").addEventListener("click", () => {
  Object.values(sliders).forEach(
    (s) => (s.value = 1 + Math.floor(Math.random() * 10)),
  );
  Object.values(toggles).forEach((t) => (t.checked = Math.random() < 0.5));
  compute();
});
applyScenario("clinic");
