/* Module 01 checkpoint: stepper quiz + module completion. */
import { readProgress, writeProgress } from "../core/lesson-engine.js";
import { TRACKS } from "../../data/curriculum.js";

const SLUG = "first-principles-checkpoint";
const PASS = 75;
const $ = (id) => document.getElementById(id);

const QUESTIONS = [
  {
    q: "Security is best described as…",
    opts: [
      "A product you install once",
      "A continuous process of keeping promises under attack",
      "A firewall rule set",
      "An antivirus subscription",
    ],
    a: 1,
    why: "Attackers adapt and controls decay. Security is ongoing work: patch, review, train, detect, rehearse.",
  },
  {
    q: "Which trio names the three promises every system makes?",
    opts: [
      "TCP, UDP, IP",
      "CIA: Confidentiality, Integrity, Availability",
      "HTTP, HTTPS, TLS",
      "RAM, CPU, SSD",
    ],
    a: 1,
    why: "CIA = secrets stay secret, data stays true, systems stay usable. Every attack breaks at least one.",
  },
  {
    q: "“The storm, the open window, what you might lose” maps to…",
    opts: [
      "Threat, Vulnerability, Risk",
      "Risk, Threat, Control",
      "Vulnerability, Threat, Impact",
      "Threat, Risk, Asset",
    ],
    a: 0,
    why: "Storm = threat. Window = vulnerability. Loss = risk. Controls close windows and shrink losses.",
  },
  {
    q: "Ransomware locks a hospital’s files so doctors cannot open them. Which promise breaks first?",
    opts: ["Confidentiality", "Integrity", "Availability", "Non-repudiation"],
    a: 2,
    why: "The system is unusable when needed: Availability. Encryption also alters data, and modern gangs steal it too — but uptime is the headline.",
  },
  {
    q: "A tester hired under contract, working in scope and reporting findings, wears a…",
    opts: ["Black hat", "Grey hat", "White hat", "Red hat only"],
    a: 2,
    why: "Written permission + scope + report = white hat. Permission is the legal line, not skill or motive.",
  },
  {
    q: "Someone breaks in without permission, then reports the bug “to help”. They are a…",
    opts: [
      "White hat",
      "Grey hat — and likely still unlawful",
      "Blue teamer",
      "Auditor",
    ],
    a: 1,
    why: "Good intent does not authorise access. Reporting afterwards does not erase the unauthorised intrusion.",
  },
  {
    q: "What made Stuxnet historically significant?",
    opts: [
      "It was the first phishing email",
      "It caused physical effects in industrial systems",
      "It was a browser hijacker",
      "It only stole cookies",
    ],
    a: 1,
    why: "Stuxnet changed machine behaviour while reporting “normal” — cyber crossed into physical damage.",
  },
  {
    q: "SolarWinds taught defenders that…",
    opts: [
      "Trusted software updates can be poisoned",
      "DDoS is always the biggest risk",
      "Passwords never matter",
      "Air gaps are impossible",
    ],
    a: 0,
    why: "Attackers compromised a trusted update pipeline. Supply-chain trust must be verified and monitored.",
  },
];

/* ---------- Stepper state ---------- */
let idx = 0,
  chosen = null,
  locked = false,
  results = [];
let t0 = null,
  timer = null;
const dots = $("cp-dots");
QUESTIONS.forEach(() => dots.appendChild(document.createElement("i")));
const dotEls = [...dots.children];

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  return (
    String(Math.floor(s / 60)).padStart(2, "0") +
    ":" +
    String(s % 60).padStart(2, "0")
  );
}
function startTimer() {
  if (timer) return;
  t0 = Date.now();
  timer = setInterval(() => {
    $("cp-timer").textContent = fmt(Date.now() - t0);
  }, 1000);
}
function stopTimer() {
  clearInterval(timer);
  timer = null;
}

function render() {
  chosen = null;
  locked = false;
  const q = QUESTIONS[idx];
  $("cp-progress").textContent = `Question ${idx + 1} / ${QUESTIONS.length}`;
  $("cp-q").textContent = `${idx + 1}. ${q.q}`;
  $("cp-why").className = "cp-why hidden";
  $("cp-lock").disabled = true;
  $("cp-lock").textContent = "Lock answer";
  const opts = $("cp-opts");
  opts.innerHTML = "";
  q.opts.forEach((text, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = text;
    b.addEventListener("click", () => {
      if (locked) return;
      chosen = i;
      [...opts.children].forEach((x, j) =>
        x.classList.toggle("selected", j === i),
      );
      $("cp-lock").disabled = false;
    });
    opts.appendChild(b);
  });
  dotEls.forEach((d, i) => {
    d.className = i === idx ? "current" : results[i] || "";
  });
}

function lock() {
  if (chosen === null) return;
  startTimer();
  locked = true;
  const q = QUESTIONS[idx];
  const ok = chosen === q.a;
  results[idx] = ok ? "right" : "wrong";
  [...$("cp-opts").children].forEach((b, i) => {
    b.disabled = true;
    if (i === q.a) b.classList.add("right");
    else if (i === chosen) b.classList.add("wrong");
    b.classList.remove("selected");
  });
  const why = $("cp-why");
  why.textContent = (ok ? "Correct. " : "Not quite. ") + q.why;
  why.className = "cp-why " + (ok ? "ok" : "bad");
  dotEls[idx].className = results[idx];
  $("cp-lock").textContent =
    idx === QUESTIONS.length - 1 ? "See results" : "Next question";
}

function finish() {
  stopTimer();
  const correct = results.filter((r) => r === "right").length;
  const pct = Math.round((correct / QUESTIONS.length) * 100);
  const pass = pct >= PASS;
  const best = Math.max(pct, readProgress()[SLUG]?.quiz || 0);
  writeProgress(SLUG, { quiz: best });
  $("cp-card").classList.add("hidden");
  const res = $("cp-results");
  res.classList.remove("hidden");
  res.classList.toggle("fail", !pass);
  $("cp-score-num").textContent = pct + "%";
  $("cp-note").textContent = pass
    ? `passed · ${correct}/${QUESTIONS.length} · ${$("cp-timer").textContent}`
    : `need ${PASS}% · review below`;
  $("cp-ring").style.strokeDashoffset = 163.4 * (1 - pct / 100);
  $("cp-review").innerHTML = QUESTIONS.map(
    (q, i) =>
      `<li><span class="mark ${results[i] === "right" ? "ok" : "bad"}">${results[i] === "right" ? "✓" : "✗"}</span><span>${q.q}</span></li>`,
  ).join("");
  $("cp-best").textContent = `Best: ${best}%`;
  if (pass) burst();
  refreshRoster();
}

function burst() {
  const box = $("cp-burst");
  const colors = ["#38e0ff", "#3cf5b6", "#8f7bff", "#ffb454", "#ff4d6d"];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("i");
    p.style.setProperty("--c", colors[i % colors.length]);
    p.style.setProperty("--dx", Math.random() * 260 - 130 + "px");
    p.style.setProperty("--dy", -40 - Math.random() * 150 + "px");
    box.appendChild(p);
    p.addEventListener("animationend", () => p.remove());
  }
}

$("cp-lock").addEventListener("click", () => {
  if (!locked) lock();
  else if (idx < QUESTIONS.length - 1) {
    idx++;
    render();
  } else finish();
});
$("cp-retry").addEventListener("click", () => {
  idx = 0;
  results = [];
  stopTimer();
  $("cp-timer").textContent = "00:00";
  $("cp-results").classList.add("hidden");
  $("cp-card").classList.remove("hidden");
  render();
});

/* ---------- Module roster + flag ---------- */
function refreshRoster() {
  const p = readProgress();
  const module = TRACKS[0].modules[0];
  const roster = $("roster");
  roster.innerHTML = "";
  let allQuizzes = true;

  module.lessons.forEach((l, i) => {
    const prog = p[l.slug] || {};
    const quizOk = (prog.quiz || 0) >= PASS;
    if (l.kind !== "quiz" && !quizOk) allQuizzes = false;
    const chips = `<span class="${prog.lab ? "ok" : ""}">lab ${prog.lab ? "✓" : "—"}</span>
      <span class="${quizOk ? "ok" : ""}">quiz ${prog.quiz != null ? prog.quiz + "%" : "—"}</span>`;
    const inner = `<span class="r-num">${String(i + 1).padStart(2, "0")}</span>
      <span><b>${l.title}</b><small>${l.kind === "quiz" ? "checkpoint" : l.mins + " min lesson"}</small></span>
      <span class="r-state">${chips}</span>`;
    const row =
      l.slug === SLUG
        ? Object.assign(document.createElement("div"), {
            className: "r-self",
            innerHTML: inner,
          })
        : Object.assign(document.createElement("a"), {
            href: "../" + l.href,
            innerHTML: inner,
          });
    roster.appendChild(row);
  });

  const checkpointOk = (p[SLUG]?.quiz || 0) >= PASS;
  $("module-banner").classList.toggle("hidden", !(allQuizzes && checkpointOk));
  $("cp-best").textContent =
    p[SLUG]?.quiz != null ? `Best: ${p[SLUG].quiz}%` : "Best: —";
}

render();
refreshRoster();
