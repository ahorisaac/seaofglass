/* Lesson 04 · content + hat sorter game. */
import { initLesson } from "../core/lesson-engine.js";

initLesson({
  slug: "hacker-types",
  flag: "FLAG{h4ts_0ff_t3st3d}",
  files: {
    "mission.txt": [
      "MISSION: sort three scenarios by hat colour.",
      "A) Hired by a bank, signs a contract, tests and reports.",
      "B) Encrypts a hospital and demands bitcoin.",
      "C) Breaks in without permission, then emails a helpful bug report.",
      "Run: verify <colour> <colour> <colour>",
    ],
    "hats.txt": [
      "White hat : written permission + scope + report.",
      'Grey hat  : no permission, often "good" intent — still unlawful.',
      "Black hat : no permission + harm (steal, extort, disrupt, spy).",
      "The line  : authorisation, not skill or motive.",
    ],
  },
  verify: {
    answers: ["whiteblackgrey", "wbg"],
    usage: "verify <white|grey|black> ×3 in scenario order",
    hint: "A has a contract. B extorts. C “helps” without permission.",
    success: ["[+] correct: white → black → grey"],
  },
  intro: [
    ['Sea of Glass training shell — type "help" to begin.', "dim"],
    ["start here: cat mission.txt", "ok"],
  ],
  questions: [
    {
      q: "A tester is hired by a bank, signs a contract, tests within scope and reports flaws. They are a…",
      opts: ["Grey hat", "Black hat", "White hat", "Insider threat"],
      a: 2,
      why: "Written permission + agreed scope + a report = white hat. This is professional security work.",
    },
    {
      q: "Someone finds a flaw without permission, pokes around, then emails the company. Label them.",
      opts: [
        "White hat — they helped",
        "Grey hat — and likely still unlawful",
        "Blue team",
        "APT",
      ],
      a: 1,
      why: "Good intent does not authorise access. Reporting afterwards does not erase the unauthorised intrusion.",
    },
    {
      q: "A “script kiddie” running borrowed exploit tools against random sites is…",
      opts: [
        "Harmless, because they don’t understand the tools",
        "A white hat if they learn fast",
        "Still breaking the law without permission",
        "A penetration tester",
      ],
      a: 2,
      why: "Skill level does not legalise access. Unauthorised use of exploit tools is still unauthorised attack activity.",
    },
    {
      q: "What is a purple team?",
      opts: [
        "A ransomware gang",
        "Red + blue working in a feedback loop",
        "A state-sponsored group",
        "A bug bounty platform",
      ],
      a: 1,
      why: "Purple teaming connects attackers and defenders: simulate → detect → tune → repeat.",
    },
  ],
});

/* ---------- Hat sorter ---------- */
const SCENARIOS = [
  {
    text: "A security firm is hired by a bank. The tester signs a contract, stays in scope, and writes a report.",
    hat: "white",
    why: "Written permission + scope + report: this is professional white-hat work.",
  },
  {
    text: "A crew encrypts a hospital’s files, then demands bitcoin to unlock them.",
    hat: "black",
    why: "No permission and clear harm: extortion. Classic black-hat crime.",
  },
  {
    text: "A researcher breaks into a startup’s admin panel without permission, then emails them the bug details.",
    hat: "grey",
    why: "“Helpful” intent, but no authorisation. Reporting later does not legalise the intrusion.",
  },
  {
    text: "A student downloads an exploit kit and tries it on random public websites “to see what happens”.",
    hat: "black",
    why: "No permission + real targets = unlawful, even with borrowed tools and low skill.",
  },
  {
    text: "A group defaces a government website to protest a new law. They had no permission.",
    hat: "black",
    why: "Hacktivism is a motive, not a permission slip. Without authorisation it is still an attack.",
  },
  {
    text: "A hunter reads a company’s bug-bounty policy, tests only listed assets, and submits an IDOR through the programme.",
    hat: "white",
    why: "A bounty policy is standing written permission with rules. Staying in scope keeps it white hat.",
  },
  {
    text: "Someone scans the whole internet “for research”, opens a few exposed databases to prove the point, and publishes statistics.",
    hat: "grey",
    why: "Curiosity and research claims do not authorise reading other people’s data. Boundary crossed.",
  },
];
const dots = document.getElementById("s-dots");
const text = document.getElementById("s-text");
const count = document.getElementById("s-count");
const scoreEl = document.getElementById("s-score");
const feedback = document.getElementById("s-feedback");
const next = document.getElementById("s-next");
const card = document.getElementById("s-card");
const summary = document.getElementById("s-summary");
const hatButtons = [...document.querySelectorAll(".hat-btns button")];
let idx = 0,
  score = 0,
  locked = false,
  results = [];

SCENARIOS.forEach(() => dots.appendChild(document.createElement("i")));
const dotEls = [...dots.children];

function render() {
  locked = false;
  const s = SCENARIOS[idx];
  count.textContent = `Scenario ${idx + 1} / ${SCENARIOS.length}`;
  scoreEl.textContent = `Score ${score}`;
  text.textContent = s.text;
  feedback.className = "s-feedback hidden";
  next.classList.add("hidden");
  hatButtons.forEach((b) => {
    b.disabled = false;
    b.classList.remove("right", "wrong");
  });
  dotEls.forEach((d, i) => {
    d.className = i === idx ? "current" : results[i] || "";
  });
}
function answer(hat, btn) {
  if (locked) return;
  locked = true;
  const s = SCENARIOS[idx];
  const ok = hat === s.hat;
  if (ok) score++;
  results[idx] = ok ? "right" : "wrong";
  hatButtons.forEach((b) => {
    b.disabled = true;
    if (b.dataset.hat === s.hat) b.classList.add("right");
    else if (b === btn) b.classList.add("wrong");
  });
  feedback.textContent = (ok ? "Correct. " : "Not quite. ") + s.why;
  feedback.className = "s-feedback " + (ok ? "ok" : "bad");
  next.textContent =
    idx === SCENARIOS.length - 1 ? "See results" : "Next scenario";
  next.classList.remove("hidden");
  scoreEl.textContent = `Score ${score}`;
  dotEls[idx].className = results[idx];
}
function finish() {
  card.classList.add("hidden");
  summary.classList.remove("hidden");
  document.getElementById("s-final").textContent =
    `${score} / ${SCENARIOS.length}`;
  document.getElementById("s-note").textContent =
    score === SCENARIOS.length
      ? "Perfect. You sorted every scenario by the only line that matters: permission."
      : "Review the misses above, then run it again. Permission — not motive or skill — is the line.";
}
hatButtons.forEach((b) =>
  b.addEventListener("click", () => answer(b.dataset.hat, b)),
);
next.addEventListener("click", () => {
  if (idx < SCENARIOS.length - 1) {
    idx++;
    render();
  } else finish();
});
document.getElementById("s-restart").addEventListener("click", () => {
  idx = 0;
  score = 0;
  results = [];
  summary.classList.add("hidden");
  card.classList.remove("hidden");
  render();
});
render();
