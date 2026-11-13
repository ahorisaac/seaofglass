/* ============================================================
   Shared lesson engine: progress store, training CLI, quiz,
   and automatic prev/next navigation from curriculum data.
   ============================================================ */
import { TRACKS } from "../data/curriculum.js";

const $ = (s, r = document) => r.querySelector(s);

/* ---------- Progress (shared key with paths page) ---------- */
export const readProgress = () => {
  try {
    return JSON.parse(localStorage.getItem("sog:progress")) || {};
  } catch {
    return {};
  }
};
export const writeProgress = (slug, patch) => {
  const all = readProgress();
  all[slug] = { ...(all[slug] || {}), ...patch };
  try {
    localStorage.setItem("sog:progress", JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
  return all[slug];
};

/* ---------- Lesson boot ---------- */
export function initLesson(cfg) {
  const {
    slug,
    flag,
    files,
    verify,
    questions,
    intro = [],
    passMark = 75,
  } = cfg;

  const refreshStates = () => {
    const p = readProgress()[slug] || {};
    const lab = $("#lab-state"),
      quiz = $("#quiz-state");
    if (lab && p.lab) {
      lab.classList.add("done");
      lab.innerHTML =
        '<svg class="ic"><use href="#i-check"/></svg> Lab: complete';
    }
    if (quiz && p.quiz >= passMark) {
      quiz.classList.add("done");
      quiz.innerHTML = `<svg class="ic"><use href="#i-check"/></svg> Quiz: ${p.quiz}%`;
    }
    const banner = $("#lesson-banner");
    if (banner)
      banner.classList.toggle("hidden", !(p.lab && p.quiz >= passMark));
  };

  /* ---------- Training CLI ---------- */
  const cli = $(".cli"),
    body = $("#cli-body"),
    form = $("#cli-form"),
    input = $("#cli-input");
  if (cli && body && form && input) {
    const history = [];
    let hIdx = -1;

    const print = (text, cls = "") => {
      const d = document.createElement("div");
      d.className = "t-line t-out " + cls;
      d.textContent = text;
      body.appendChild(d);
      while (body.children.length > 120) body.firstChild.remove();
      body.scrollTop = body.scrollHeight;
    };
    const echo = (cmd) => {
      const d = document.createElement("div");
      d.className = "t-line";
      d.innerHTML =
        '<span class="t-prompt">student@seaofglass</span><span class="t-path">:~$</span> <span class="t-cmd"></span>';
      d.querySelector(".t-cmd").textContent = cmd;
      body.appendChild(d);
    };

    function run(raw) {
      const cmd = raw.trim();
      if (!cmd) return;
      echo(cmd);
      history.unshift(cmd);
      hIdx = -1;
      const [name, ...args] = cmd.split(/\s+/);
      switch (name.toLowerCase()) {
        case "help":
          print(
            "commands: help · ls · cat <file> · whoami · hint · verify <answer> · clear",
            "ok",
          );
          break;
        case "ls": {
          const locked = readProgress()[slug]?.lab ? "" : "  (locked)";
          print(Object.keys(files).join("   ") + "   flag.txt" + locked, "dim");
          break;
        }
        case "whoami":
          print("student — soon: pentester", "ok");
          break;
        case "hint":
          print(verify.hint, "warn");
          break;
        case "cat": {
          const f = (args[0] || "").toLowerCase();
          if (f === "flag.txt") {
            if (readProgress()[slug]?.lab) print(flag, "flag");
            else
              print("cat: flag.txt: locked — finish the mission first", "warn");
          } else if (files[f]) {
            files[f].forEach((l) => print(l, "dim"));
          } else {
            print(`cat: ${f || "?"}: no such file — try 'ls'`, "bad");
          }
          break;
        }
        case "verify": {
          const ans = args
            .join(" ")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          if (!ans) {
            print("usage: " + verify.usage, "warn");
            break;
          }
          if (verify.answers.includes(ans)) {
            verify.success.forEach((l) => print(l, "ok"));
            print(flag, "flag");
            print("mission complete — lab progress saved ✓", "ok");
            writeProgress(slug, { lab: true });
            refreshStates();
          } else {
            print("[-] not quite. " + verify.hint, "bad");
          }
          break;
        }
        case "clear":
          body.innerHTML = "";
          return;
        default:
          print(`command not found: ${name} — try 'help'`, "bad");
      }
      body.scrollTop = body.scrollHeight;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      run(input.value);
      input.value = "";
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        hIdx = Math.min(hIdx + 1, history.length - 1);
        input.value = history[hIdx] || "";
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        hIdx = Math.max(hIdx - 1, -1);
        input.value = hIdx < 0 ? "" : history[hIdx];
      }
    });
    cli.addEventListener("click", () => input.focus());
    intro.forEach(([text, cls]) => print(text, cls));
  }

  /* ---------- Quiz ---------- */
  const qForm = $("#quiz-form");
  if (qForm && questions?.length) {
    questions.forEach((item, qi) => {
      const fs = document.createElement("fieldset");
      fs.className = "q";
      fs.innerHTML =
        `<legend class="q-title">${qi + 1}. ${item.q}</legend>` +
        item.opts
          .map(
            (o, oi) =>
              `<label><input type="radio" name="q${qi}" value="${oi}"><span>${o}</span></label>`,
          )
          .join("") +
        `<p class="why">${item.why}</p>`;
      qForm.appendChild(fs);
    });

    const submit = $("#quiz-submit"),
      retry = $("#quiz-retry");
    const scoreBox = $("#quiz-score"),
      scoreNum = $("#score-num"),
      scoreNote = $("#score-note"),
      ring = $("#score-ring");

    submit.addEventListener("click", () => {
      let correct = 0,
        answered = 0;
      document.querySelectorAll(".q").forEach((fs, qi) => {
        fs.classList.add("graded");
        const chosen = fs.querySelector("input:checked");
        fs.querySelectorAll("label").forEach((lb, oi) => {
          lb.classList.remove("right", "wrong");
          if (oi === questions[qi].a) lb.classList.add("right");
          else if (chosen && +chosen.value === oi) lb.classList.add("wrong");
        });
        if (chosen) {
          answered++;
          if (+chosen.value === questions[qi].a) correct++;
        }
      });
      if (answered < questions.length) {
        scoreBox.classList.remove("hidden", "fail");
        scoreNum.textContent = "—";
        scoreNote.textContent = `answer all ${questions.length} first`;
        return;
      }
      const pct = Math.round((correct / questions.length) * 100);
      const pass = pct >= passMark;
      scoreBox.classList.remove("hidden");
      scoreBox.classList.toggle("fail", !pass);
      scoreNum.textContent = pct + "%";
      scoreNote.textContent = pass
        ? "checkpoint passed ✓"
        : `need ${passMark}% — review & retry`;
      ring.style.strokeDashoffset = 163.4 * (1 - pct / 100);
      submit.classList.add("hidden");
      retry.classList.remove("hidden");
      writeProgress(slug, {
        quiz: Math.max(pct, readProgress()[slug]?.quiz || 0),
      });
      refreshStates();
    });

    retry.addEventListener("click", () => {
      document.querySelectorAll(".q").forEach((fs) => {
        fs.classList.remove("graded");
        fs.querySelectorAll("label").forEach((lb) =>
          lb.classList.remove("right", "wrong"),
        );
        fs.querySelectorAll("input").forEach((i) => (i.checked = false));
      });
      scoreBox.classList.add("hidden");
      retry.classList.add("hidden");
      submit.classList.remove("hidden");
    });
  }

  /* ---------- Auto prev/next across live lessons ---------- */
  const nav = $(".l-nav");
  if (nav) {
    const live = TRACKS.flatMap((t) =>
      t.modules.flatMap((m) => m.lessons),
    ).filter((l) => l.href && l.slug);
    const i = live.findIndex((l) => l.slug === slug);
    const prev = i > 0 ? live[i - 1] : null;
    const next = i >= 0 && i < live.length - 1 ? live[i + 1] : null;
    nav.innerHTML =
      (prev
        ? `<a class="btn ghost" href="../${prev.href}">← ${prev.title}</a>`
        : `<a class="btn ghost" href="../paths.html#fundamentals">← Back to Fundamentals</a>`) +
      (next
        ? `<a class="btn primary" href="../${next.href}">Next: ${next.title} <svg class="ic"><use href="#i-arrow"/></svg></a>`
        : `<a class="btn primary" href="../paths.html">All paths <svg class="ic"><use href="#i-arrow"/></svg></a>`);
  }

  /* ---------- Mark brief as read when the lab is reached ---------- */
  const mission = $("#mission"),
    read = $("#read-state");
  if (mission && read && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          read.classList.add("done");
          read.innerHTML =
            '<svg class="ic"><use href="#i-check"/></svg> Brief read';
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(mission);
  }

  refreshStates();
}
