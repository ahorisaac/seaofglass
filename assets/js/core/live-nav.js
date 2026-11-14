/* Progress-aware navigation + live count sync for every live lesson. */
import { TRACKS } from "../data/curriculum.js";
import { readProgress } from "./lesson-engine.js";

const PASS = 75;
const KIND = {
  read: ["Lesson", "i-book"],
  lab: ["Lab", "i-terminal"],
  quiz: ["Quiz", "i-flag"],
};
const icon = (id) => `<svg class="ic"><use href="#${id}"/></svg>`;

export const getLiveLessons = () => {
  const out = [];
  TRACKS.forEach((t) =>
    t.modules.forEach((m, mi) =>
      m.lessons.forEach((l, li) => {
        if (l.href && l.slug)
          out.push({
            ...l,
            track: t,
            module: m,
            moduleIndex: mi,
            lessonIndex: li,
          });
      }),
    ),
  );
  return out;
};
export const isComplete = (l, p = readProgress()) =>
  (p[l.slug]?.quiz || 0) >= PASS;
export const getNextLesson = () => {
  const p = readProgress();
  return getLiveLessons().find((l) => !isComplete(l, p)) || null;
};

/* Keep hardcoded marketing counts truthful without duplicating data. */
function syncLiveCounts(context) {
  const n = getLiveLessons().length;
  if (context === "index") {
    document.querySelectorAll(".hero-stats li").forEach((li) => {
      if (li.querySelector("span")?.textContent.trim() === "live lessons") {
        const b = li.querySelector("b");
        if (b) {
          b.dataset.count = n;
          b.textContent = n;
        }
      }
    });
    document.querySelectorAll(".t-card.def .t-meta li").forEach((li) => {
      if (/live/.test(li.textContent)) li.textContent = `${n} live now`;
    });
  } else {
    const b = document.querySelector(".p-hero .lead b");
    if (b && /live/.test(b.textContent))
      b.textContent = `${n} lessons are live now`;
  }
}

export function renderLiveNav(container, base = "", opts = {}) {
  const p = readProgress();
  const live = getLiveLessons();
  const done = live.filter((l) => isComplete(l, p)).length;
  const next = getNextLesson();
  const pct = live.length ? done / live.length : 0;

  const groups = [];
  live.forEach((l) => {
    let g = groups.find((x) => x.module === l.module && x.track === l.track);
    if (!g)
      groups.push(
        (g = {
          track: l.track,
          module: l.module,
          moduleIndex: l.moduleIndex,
          lessons: [],
        }),
      );
    g.lessons.push(l);
  });
  const newestIndex = groups.length
    ? Math.max(...groups.map((g) => g.moduleIndex))
    : -1;

  const head =
    opts.header === false
      ? ""
      : `
    <div class="live-head">
      <div class="live-ring" aria-label="${done} of ${live.length} live lessons complete">
        <svg viewBox="0 0 64 64"><circle class="bgc" cx="32" cy="32" r="26"/>
          <circle class="fgc" cx="32" cy="32" r="26" style="stroke-dashoffset:${163.4 * (1 - pct)}"/></svg><b>${Math.round(pct * 100)}%</b></div>
      <div><p class="eyebrow">00 // Mission control</p><h2>Your live lessons.</h2>
        <p class="lead">${done} of ${live.length} complete. ${next ? "Next up: <b>" + next.title + "</b>." : "All live lessons complete — the next module is in production."}</p></div>
      <div class="live-actions">
        <a class="btn primary" href="${base + (next ? next.href : "paths.html#fundamentals")}">${next ? "Continue: " + next.title : "Browse next module"} ${icon("i-arrow")}</a>
        <a class="btn ghost" href="${base}paths.html">Full curriculum</a>
      </div>
    </div>`;

  const modules = groups
    .map((g) => {
      const gd = g.lessons.filter((l) => isComplete(l, p)).length;
      const isNew = g.moduleIndex === newestIndex && groups.length > 1;
      const rows = g.lessons
        .map((l) => {
          const doneRow = isComplete(l, p),
            nextRow = next && l.slug === next.slug;
          const meta = doneRow
            ? "✓ done"
            : nextRow
              ? "▶ next"
              : l.kind === "quiz"
                ? "checkpoint"
                : l.mins + " min";
          return `<li><a class="lm-lesson ${doneRow ? "done" : ""} ${nextRow ? "next" : ""}" href="${base + l.href}">
        <span class="lm-kind">${icon(KIND[l.kind][1])}</span><span class="lm-title">${l.title}</span><span class="lm-meta">${meta}</span></a></li>`;
        })
        .join("");
      return `<section class="live-module ${isNew ? "new" : ""}">
      <header><span class="lm-num">${String(g.moduleIndex + 1).padStart(2, "0")}</span><h3>${g.module.title}</h3>
        <span class="lm-count">${gd}/${g.lessons.length} done</span>${isNew ? '<span class="lm-new">NEW</span>' : ""}</header>
      <ol class="lm-lessons">${rows}</ol></section>`;
    })
    .join("");

  container.innerHTML = `<div class="live-card">${head}<div class="live-modules">${modules}</div></div>`;
  syncLiveCounts(base === "" ? "paths" : "index");
}
