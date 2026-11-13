/* ============================================================
   Curriculum hub: renders tracks from data, live search,
   tabs, progress rings and a syllabus export.
   ============================================================ */
import { TRACKS } from "../data/curriculum.js";

const $ = (s, r = document) => r.querySelector(s);
const KIND = {
  read: ["Lesson", "i-book"],
  lab: ["Lab", "i-terminal"],
  quiz: ["Quiz", "i-flag"],
};

/* ---------- Progress (shared localStorage key with lessons) ---------- */
const loadProgress = () => {
  try {
    return JSON.parse(localStorage.getItem("sog:progress")) || {};
  } catch {
    return {};
  }
};
const progress = loadProgress();
const isDone = (slug) => slug && progress[slug] && progress[slug].quiz >= 75;

/* ---------- Totals ---------- */
const all = TRACKS.flatMap((t) => t.modules.flatMap((m) => m.lessons));
$("#st-modules").textContent = TRACKS.reduce((n, t) => n + t.modules.length, 0);
$("#st-lessons").textContent = all.length;
$("#st-labs").textContent = all.filter((l) => l.kind === "lab").length;
$("#st-quizzes").textContent = all.filter((l) => l.kind === "quiz").length;

/* ---------- Render ---------- */
const icon = (id, cls = "ic") =>
  `<svg class="${cls}"><use href="#${id}"/></svg>`;
const trackEl = (t) => {
  const lessons = t.modules.flatMap((m) => m.lessons);
  const mins = lessons.reduce((n, l) => n + l.mins, 0);
  const live = lessons.filter((l) => l.href);
  const done = live.filter((l) => isDone(l.slug)).length;
  const pct = live.length ? done / live.length : 0;
  const off = 163.4 * (1 - pct);

  const modules = t.modules
    .map((m, mi) => {
      const rows = m.lessons
        .map((l) => {
          const [label, ic] = KIND[l.kind];
          const doneChip = isDone(l.slug)
            ? `<span class="done-chip">${icon("i-check")} done</span>`
            : "";
          const open = l.href
            ? `<a class="open-chip" href="${l.href}">Open ${icon("i-arrow")}</a>`
            : "";
          const title = l.href ? `<a href="${l.href}">${l.title}</a>` : l.title;
          return `<li class="lesson" data-q="${(l.title + " " + l.desc + " " + m.title).toLowerCase()}">
        <span class="kind ${l.kind}">${icon(ic)}${label}</span>
        <span class="l-main"><b>${title}</b><p>${l.desc}</p></span>
        <span class="l-right">${doneChip}<span class="mins">${l.mins} min</span>${open}</span></li>`;
        })
        .join("");
      const mmins = m.lessons.reduce((n, l) => n + l.mins, 0);
      return `<details class="module" ${mi === 0 ? "open" : ""}>
      <summary><span class="m-num">${String(mi + 1).padStart(2, "0")}</span>
        <span class="m-title"><h3>${m.title}</h3><p>${m.summary}</p></span>
        <span class="m-count">${m.lessons.length} lessons · ${mmins} min</span>
        <svg class="ic m-chev"><use href="#i-chev"/></svg></summary>
      <div class="m-body">
        <div class="m-tools">${m.tools.map((x) => `<span>${x}</span>`).join("")}</div>
        <ol>${rows}</ol></div></details>`;
    })
    .join("");

  const sec = document.createElement("section");
  sec.className = `track ${t.flavor}`;
  sec.id = t.id;
  sec.dataset.tracksec = t.id;
  sec.innerHTML = `
    <div class="track-head">
      <span class="track-ic">${icon(t.icon)}</span>
      <div><h2>${t.title}</h2><p class="t-desc">${t.summary}</p>
        <ul class="track-meta"><li>${t.level}</li><li>${t.modules.length} modules</li>
          <li>${lessons.length} lessons</li><li>${Math.round(mins / 60)} h guided</li>
          <li>${live.length} live now</li></ul></div>
      <div class="track-progress" title="Progress across live lessons">
        <svg viewBox="0 0 64 64"><circle class="bgc" cx="32" cy="32" r="26"/>
          <circle class="fgc" cx="32" cy="32" r="26" style="stroke-dashoffset:${off}"/></svg>
        <span>${live.length ? `${done}/${live.length} live done` : "in production"}</span></div>
    </div>${modules}`;
  return sec;
};
const tracksRoot = $("#tracks");
TRACKS.forEach((t) => tracksRoot.appendChild(trackEl(t)));

/* ---------- Tabs ---------- */
const tabBtns = [...document.querySelectorAll(".tabs button")];
const secs = [...document.querySelectorAll("[data-tracksec]")];
const setTab = (tab, scroll = false) => {
  tabBtns.forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", on);
  });
  secs.forEach((s) => {
    s.hidden = tab !== "all" && s.dataset.tracksec !== tab;
  });
  history.replaceState(null, "", tab === "all" ? location.pathname : "#" + tab);
  if (scroll && tab !== "all")
    document.getElementById(tab)?.scrollIntoView({ behavior: "smooth" });
};
tabBtns.forEach((b) =>
  b.addEventListener("click", () => setTab(b.dataset.tab, true)),
);
const initial = location.hash.slice(1);
if (["fundamentals", "pentest", "lab"].includes(initial)) {
  setTab(initial);
  requestAnimationFrame(() =>
    document.getElementById(initial)?.scrollIntoView(),
  );
}

/* ---------- Live search ---------- */
const search = $("#search"),
  count = $("#search-count"),
  empty = $("#empty");
let debounce;
search.addEventListener("input", () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    const q = search.value.trim().toLowerCase();
    let hits = 0;
    document.querySelectorAll(".module").forEach((mod) => {
      let modHits = 0;
      mod.querySelectorAll(".lesson").forEach((row) => {
        const match = !q || row.dataset.q.includes(q);
        row.hidden = !match;
        if (match) modHits++;
      });
      mod.hidden = q && modHits === 0;
      if (q && modHits > 0) mod.open = true;
      if (!q)
        mod.open =
          [...mod.parentElement.querySelectorAll(".module")].indexOf(mod) === 0;
      hits += modHits;
    });
    count.textContent = q
      ? `${hits} lesson${hits === 1 ? "" : "s"} match “${search.value.trim()}”`
      : "";
    empty.classList.toggle("hidden", !q || hits > 0);
  }, 120);
});

/* ---------- Syllabus export (.md) ---------- */
$("#dl-md").addEventListener("click", () => {
  let md = `# Sea of Glass — Curriculum\nBy Shidoon · generated ${new Date().toISOString().slice(0, 10)}\n\n`;
  TRACKS.forEach((t) => {
    md += `## ${t.title} (${t.level})\n${t.summary}\n\n`;
    t.modules.forEach((m, i) => {
      md += `### ${String(i + 1).padStart(2, "0")} · ${m.title}\n${m.summary}\nTools: ${m.tools.join(", ")}\n\n`;
      m.lessons.forEach((l) => {
        md += `- [${KIND[l.kind][0]}] **${l.title}** — ${l.desc} (${l.mins} min)\n`;
      });
      md += "\n";
    });
  });
  const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: "sea-of-glass-curriculum.md",
  });
  a.click();
  URL.revokeObjectURL(url);
});
