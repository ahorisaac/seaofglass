/* Lesson 05 · content + timeline filters & accordions. */
import { initLesson } from "../core/lesson-engine.js";

initLesson({
  slug: "famous-breaches",
  flag: "FLAG{h1st0ry_rhym3s}",
  files: {
    "mission.txt": [
      "MISSION: order the four anchor events.",
      "Read timeline.txt, then run: verify <initials in order>",
      'Memory hook: "Morris Sent Worms Skyward."',
    ],
    "timeline.txt": [
      "1988 — Morris Worm      : the first internet wake-up call.",
      "2010 — Stuxnet          : cyber causes physical damage.",
      "2017 — WannaCry         : unpatched systems fall at internet speed.",
      "2020 — SolarWinds       : trusted updates can be poisoned.",
      "Initials, in order: M S W S.",
    ],
  },
  verify: {
    answers: ["msws", "morrisstuxnetwannacrysolarwinds"],
    usage: "verify <four initials in chronological order>",
    hint: "Morris → Stuxnet → WannaCry → SolarWinds.",
    success: ["[+] correct: 1988 → 2010 → 2017 → 2020"],
  },
  intro: [
    ['Sea of Glass training shell — type "help" to begin.', "dim"],
    ["start here: cat mission.txt", "ok"],
  ],
  questions: [
    {
      q: "Why is the Morris Worm historically important?",
      opts: [
        "It was the first ransomware payment",
        "It was the first major internet worm and helped inspire CERT",
        "It encrypted hospitals",
        "It stole payment cards",
      ],
      a: 1,
      why: "Morris (1988) was the internet’s first mass self-spreading wake-up call and helped drive coordinated incident response (CERT).",
    },
    {
      q: "What made Stuxnet different from ordinary malware?",
      opts: [
        "It only showed ads",
        "It caused physical effects in industrial systems",
        "It was written in Python",
        "It was a phishing email",
      ],
      a: 1,
      why: "Stuxnet crossed from code into machinery: it changed centrifuge behaviour while reporting normal values. Integrity became a physical-safety issue.",
    },
    {
      q: "Equifax is a classic example of…",
      opts: [
        "A zero-day with no available fix",
        "A known vulnerability left unpatched",
        "A DDoS flood",
        "A lost laptop",
      ],
      a: 1,
      why: "A fix for the exploited Struts bug existed. The failure was vulnerability management: finding and patching the affected asset in time.",
    },
    {
      q: "SolarWinds is best described as a…",
      opts: [
        "Supply-chain attack",
        "Insider trading scheme",
        "Physical break-in",
        "Password spray only",
      ],
      a: 0,
      why: "Attackers poisoned a trusted software update pipeline. Victims installed signed updates from a vendor they trusted.",
    },
  ],
});

/* ---------- Timeline ---------- */
const events = [...document.querySelectorAll(".evt")];
const chips = [...document.querySelectorAll(".tl-filters button")];
const count = document.getElementById("tl-count");
const expand = document.getElementById("tl-expand");
let filter = "all";

function applyFilter() {
  let shown = 0;
  events.forEach((e) => {
    const show = filter === "all" || e.dataset.cat === filter;
    e.hidden = !show;
    if (show) shown++;
  });
  count.textContent = `${shown} event${shown === 1 ? "" : "s"} · ${filter === "all" ? "all families" : filter}`;
  expand.textContent = events.some(
    (e) => !e.hidden && e.classList.contains("open"),
  )
    ? "Collapse all"
    : "Expand all";
}
chips.forEach((c) =>
  c.addEventListener("click", () => {
    filter = c.dataset.f;
    chips.forEach((x) => x.classList.toggle("active", x === c));
    applyFilter();
  }),
);
events.forEach((e) => {
  const head = e.querySelector(".evt-head");
  head.addEventListener("click", () => {
    const open = e.classList.toggle("open");
    head.setAttribute("aria-expanded", open);
    applyFilter();
  });
});
expand.addEventListener("click", () => {
  const visible = events.filter((e) => !e.hidden);
  const shouldOpen = !visible.every((e) => e.classList.contains("open"));
  visible.forEach((e) => {
    e.classList.toggle("open", shouldOpen);
    e.querySelector(".evt-head").setAttribute("aria-expanded", shouldOpen);
  });
  applyFilter();
});
applyFilter();
