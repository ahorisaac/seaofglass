/* Shared UI: nav, reveals, counters, tilt, cursor, terminal guard. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const COARSE = matchMedia("(pointer: coarse)").matches;

/* Terminal forms never reload the page, even if a lesson module fails. */
document.addEventListener(
  "submit",
  (e) => {
    if (e.target.id === "cli-form" || e.target.closest(".cli"))
      e.preventDefault();
  },
  true,
);

/* Nav */
const nav = $("#nav"),
  toggle = $("#nav-toggle"),
  menu = $("#nav-menu");
const onScrollNav = () => nav && nav.classList.toggle("scrolled", scrollY > 8);
addEventListener("scroll", onScrollNav, { passive: true });
onScrollNav();
if (toggle && menu) {
  const setMenu = (open) => {
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
    document.body.classList.toggle("menu-open", open);
  };
  toggle.addEventListener("click", () =>
    setMenu(!menu.classList.contains("open")),
  );
  menu.addEventListener(
    "click",
    (e) => e.target.closest("a") && setMenu(false),
  );
  addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));
}

/* Scroll progress + back-to-top */
const bar = $("#progress"),
  toTop = $("#to-top");
let ticking = false;
addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      if (toTop) toTop.classList.toggle("show", scrollY > 600);
      ticking = false;
    });
  },
  { passive: true },
);
toTop &&
  toTop.addEventListener("click", () =>
    scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" }),
  );

/* Active section */
const hashLinks = $$('#nav-menu a[href^="#"]');
if (hashLinks.length && "IntersectionObserver" in window) {
  const map = new Map(
    hashLinks.map((a) => [a.getAttribute("href").slice(1), a]),
  );
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const link = map.get(e.target.id);
        if (link && e.isIntersecting) {
          hashLinks.forEach((a) => a.classList.remove("active"));
          link.classList.add("active");
        }
      }),
    { rootMargin: "-40% 0px -55% 0px" },
  );
  $$("[data-section]").forEach((s) => io.observe(s));
}

/* Reveal */
const revealEls = $$(".reveal");
if ("IntersectionObserver" in window && !REDUCED) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.15 },
  );
  revealEls.forEach((el) => io.observe(el));
} else revealEls.forEach((el) => el.classList.add("in"));

/* Counters */
const runCounter = (el) => {
  const end = +el.dataset.count,
    suffix = el.dataset.suffix || "",
    plain = el.dataset.plain;
  if (REDUCED) {
    el.textContent = end + suffix;
    return;
  }
  const t0 = performance.now(),
    dur = plain ? 600 : 1400;
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          runCounter(e.target);
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.6 },
  );
  $$("[data-count]").forEach((el) => io.observe(el));
} else $$("[data-count]").forEach(runCounter);

/* Tilt + glow */
if (!COARSE && !REDUCED) {
  $$(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5,
        y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) translateY(-3px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
  $$(".glow-card").forEach((card) =>
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    }),
  );
}

/* Cursor */
const cursor = $("#cursor");
if (cursor && !COARSE && !REDUCED) {
  let cx = innerWidth / 2,
    cy = innerHeight / 2,
    tx = cx,
    ty = cy;
  addEventListener("pointermove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
    cursor.classList.add("on");
    cursor.classList.toggle(
      "big",
      !!e.target.closest("a,button,input,select,label,textarea"),
    );
  });
  document.addEventListener("mouseleave", () => cursor.classList.remove("on"));
  (function follow() {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    cursor.style.left = cx + "px";
    cursor.style.top = cy + "px";
    requestAnimationFrame(follow);
  })();
}

/* Copy + year */
$$("[data-copy]").forEach((btn) =>
  btn.addEventListener("click", async () => {
    const src = $(btn.dataset.copy);
    if (!src) return;
    try {
      await navigator.clipboard.writeText(src.textContent.trim());
    } catch {
      /* blocked */
    }
    const old = btn.textContent;
    btn.textContent = "Copied ✓";
    setTimeout(() => (btn.textContent = old), 1600);
  }),
);
$$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
