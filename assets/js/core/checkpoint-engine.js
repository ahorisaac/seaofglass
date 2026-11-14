/* Shared module checkpoint: stepper quiz, timer, roster, module flag. */
import { readProgress, writeProgress } from "./lesson-engine.js";
import { TRACKS } from "../data/curriculum.js";

const $ = (id) => document.getElementById(id);

export function initCheckpoint(cfg) {
  const {
    slug,
    questions,
    flag,
    trackIndex = 0,
    moduleIndex,
    passMark = 75,
  } = cfg;
  const module = TRACKS[trackIndex].modules[moduleIndex];

  let idx = 0,
    chosen = null,
    locked = false,
    results = [];
  let t0 = null,
    timer = null;
  const dots = $("cp-dots");
  questions.forEach(() => dots.appendChild(document.createElement("i")));
  const dotEls = [...dots.children];

  const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    return (
      String(Math.floor(s / 60)).padStart(2, "0") +
      ":" +
      String(s % 60).padStart(2, "0")
    );
  };
  const startTimer = () => {
    if (timer) return;
    t0 = Date.now();
    timer = setInterval(() => {
      $("cp-timer").textContent = fmt(Date.now() - t0);
    }, 1000);
  };
  const stopTimer = () => {
    clearInterval(timer);
    timer = null;
  };

  function render() {
    chosen = null;
    locked = false;
    const q = questions[idx];
    $("cp-progress").textContent = `Question ${idx + 1} / ${questions.length}`;
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
    const q = questions[idx],
      ok = chosen === q.a;
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
      idx === questions.length - 1 ? "See results" : "Next question";
  }

  function burst() {
    const box = $("cp-burst"),
      colors = ["#38e0ff", "#3cf5b6", "#8f7bff", "#ffb454", "#ff4d6d"];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("i");
      p.style.setProperty("--c", colors[i % colors.length]);
      p.style.setProperty("--dx", Math.random() * 260 - 130 + "px");
      p.style.setProperty("--dy", -40 - Math.random() * 150 + "px");
      box.appendChild(p);
      p.addEventListener("animationend", () => p.remove());
    }
  }

  function finish() {
    stopTimer();
    const correct = results.filter((r) => r === "right").length;
    const pct = Math.round((correct / questions.length) * 100);
    const pass = pct >= passMark;
    const best = Math.max(pct, readProgress()[slug]?.quiz || 0);
    writeProgress(slug, { quiz: best });
    $("cp-card").classList.add("hidden");
    const res = $("cp-results");
    res.classList.remove("hidden");
    res.classList.toggle("fail", !pass);
    $("cp-score-num").textContent = pct + "%";
    $("cp-note").textContent = pass
      ? `passed · ${correct}/${questions.length} · ${$("cp-timer").textContent}`
      : `need ${passMark}% · review below`;
    $("cp-ring").style.strokeDashoffset = 163.4 * (1 - pct / 100);
    $("cp-review").innerHTML = questions
      .map(
        (q, i) =>
          `<li><span class="mark ${results[i] === "right" ? "ok" : "bad"}">${results[i] === "right" ? "✓" : "✗"}</span><span>${q.q}</span></li>`,
      )
      .join("");
    if (pass) burst();
    refreshRoster();
  }

  $("cp-lock").addEventListener("click", () => {
    if (!locked) lock();
    else if (idx < questions.length - 1) {
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

  function refreshRoster() {
    const p = readProgress(),
      roster = $("roster");
    roster.innerHTML = "";
    let allQuizzes = true;
    module.lessons.forEach((l, i) => {
      const prog = p[l.slug] || {};
      const quizOk = (prog.quiz || 0) >= passMark;
      if (l.kind !== "quiz" && !quizOk) allQuizzes = false;
      const chips = `<span class="${prog.lab ? "ok" : ""}">lab ${prog.lab ? "✓" : "—"}</span>
        <span class="${quizOk ? "ok" : ""}">quiz ${prog.quiz != null ? prog.quiz + "%" : "—"}</span>`;
      const inner = `<span class="r-num">${String(i + 1).padStart(2, "0")}</span>
        <span><b>${l.title}</b><small>${l.kind === "quiz" ? "checkpoint" : l.mins + " min lesson"}</small></span>
        <span class="r-state">${chips}</span>`;
      const row = l.href
        ? Object.assign(document.createElement("a"), {
            href: "../" + l.href,
            innerHTML: inner,
          })
        : Object.assign(document.createElement("div"), {
            className: "r-self",
            innerHTML: inner,
          });
      if (l.slug === slug) row.className = "r-self";
      roster.appendChild(row);
    });
    const checkpointOk = (p[slug]?.quiz || 0) >= passMark;
    const banner = $("module-banner");
    if (banner)
      banner.classList.toggle("hidden", !(allQuizzes && checkpointOk));
    const flagEl = $("module-flag");
    if (flagEl) flagEl.textContent = flag;
    $("cp-best").textContent =
      p[slug]?.quiz != null ? `Best: ${p[slug].quiz}%` : "Best: —";
  }

  render();
  refreshRoster();
}
