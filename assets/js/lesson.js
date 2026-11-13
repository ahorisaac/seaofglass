/* ============================================================
   Lesson engine (CIA Triad sample): training CLI + quiz.
   Copy this file per lesson and swap FILES / QUESTIONS / SLUG.
   Progress key shared with the paths page: sog:progress.
   ============================================================ */

const SLUG = "cia-triad";
const $ = (s) => document.querySelector(s);

/* ---------- Progress store ---------- */
const load = () => {
  try {
    return JSON.parse(localStorage.getItem("sog:progress")) || {};
  } catch {
    return {};
  }
};
const save = (patch) => {
  const all = load();
  all[SLUG] = { ...(all[SLUG] || {}), ...patch };
  try {
    localStorage.setItem("sog:progress", JSON.stringify(all));
  } catch {
    /* private mode */
  }
  refreshStates();
};
function refreshStates() {
  const p = load()[SLUG] || {};
  const lab = $("#lab-state"),
    quiz = $("#quiz-state");
  if (p.lab) {
    lab.classList.add("done");
    lab.innerHTML =
      '<svg class="ic"><use href="#i-check"/></svg> Lab: complete';
  }
  if (p.quiz >= 75) {
    quiz.classList.add("done");
    quiz.innerHTML = `<svg class="ic"><use href="#i-check"/></svg> Quiz: ${p.quiz}%`;
  }
  $("#lesson-banner").classList.toggle("hidden", !(p.lab && p.quiz >= 75));
}

/* ---------- Training CLI ---------- */
const body = $("#cli-body"),
  form = $("#cli-form"),
  input = $("#cli-input");
const history = [];
let hIdx = -1;

const FILES = {
  "mission.txt": [
    "MISSION: prove you know the three promises.",
    "1) read triad.txt   2) run: verify <letters in order>",
    "Order hint: secrecy first, truth second, uptime third.",
  ],
  "triad.txt": [
    "C — Confidentiality : only the right eyes see the data.",
    "I — Integrity       : the data is correct and unaltered.",
    "A — Availability    : the system works when needed.",
    'Memory hook: "Secrets, Truth, Uptime."',
  ],
};
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
        "commands: help · ls · cat <file> · whoami · verify <letters> · clear",
        "ok",
      );
      break;
    case "ls":
      print(
        "mission.txt   triad.txt   flag.txt" +
          (load()[SLUG]?.lab ? "" : "  (locked)"),
        "dim",
      );
      break;
    case "whoami":
      print("student — soon: pentester", "ok");
      break;
    case "cat": {
      const f = (args[0] || "").toLowerCase();
      if (f === "flag.txt") {
        if (load()[SLUG]?.lab) print("FLAG{thr33_pr0m1s3s}", "flag");
        else print("cat: flag.txt: locked — finish the mission first", "warn");
      } else if (FILES[f]) FILES[f].forEach((l) => print(l, "dim"));
      else print(`cat: ${f || "?"}: no such file — try 'ls'`, "bad");
      break;
    }
    case "verify": {
      const ans = (args[0] || "").toLowerCase().replace(/[^a-z]/g, "");
      if (ans === "cia") {
        print("[+] correct: Confidentiality → Integrity → Availability", "ok");
        print("FLAG{thr33_pr0m1s3s}", "flag");
        print("mission complete — lab progress saved ✓", "ok");
        save({ lab: true });
      } else if (!ans) print("usage: verify <three letters in order>", "warn");
      else
        print(
          "[-] not quite. Which promise is about secrecy? Start there.",
          "bad",
        );
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
$(".cli").addEventListener("click", () => input.focus());
print('Sea of Glass training shell — type "help" to begin.', "dim");
print("start here: cat mission.txt", "ok");

/* ---------- Quiz ---------- */
const QUESTIONS = [
  {
    q: "Ransomware encrypts a hospital’s patient database so doctors can’t open files. Which promise is broken first?",
    opts: [
      "Confidentiality",
      "Integrity",
      "Availability",
      "None — it’s just software",
    ],
    a: 2,
    why: "Doctors can’t use the system: Availability. (Encryption also alters data — Integrity — and modern gangs steal data too, breaking C. But the headline impact is uptime.)",
  },
  {
    q: "An attacker intercepts a bank transfer and changes the amount in transit. Which promise is broken?",
    opts: [
      "Availability",
      "Integrity",
      "Confidentiality only",
      "Authentication",
    ],
    a: 1,
    why: "The data no longer tells the truth — Integrity. Reading it also broke Confidentiality, but the alteration itself is an integrity failure.",
  },
  {
    q: "A leaked password dump exposes millions of user emails and hashes. Which promise is broken?",
    opts: ["Confidentiality", "Integrity", "Availability", "All three equally"],
    a: 0,
    why: "Secrets were exposed to the wrong eyes — Confidentiality. Nothing was altered or taken offline.",
  },
  {
    q: "Which control most directly protects Confidentiality?",
    opts: [
      "A RAID array",
      "AES-256 encryption",
      "A load balancer",
      "An uptime monitor",
    ],
    a: 1,
    why: "Encryption keeps data unreadable to the wrong eyes. RAID, load balancers and uptime monitors all protect Availability instead.",
  },
];

const qForm = $("#quiz-form");
QUESTIONS.forEach((item, qi) => {
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
      if (oi === QUESTIONS[qi].a) lb.classList.add("right");
      else if (chosen && +chosen.value === oi) lb.classList.add("wrong");
    });
    if (chosen) {
      answered++;
      if (+chosen.value === QUESTIONS[qi].a) correct++;
    }
  });
  if (answered < QUESTIONS.length) {
    scoreBox.classList.remove("hidden", "fail");
    scoreNum.textContent = "—";
    scoreNote.textContent = "answer all 4 first";
    return;
  }
  const pct = Math.round((correct / QUESTIONS.length) * 100);
  const pass = pct >= 75;
  scoreBox.classList.remove("hidden");
  scoreBox.classList.toggle("fail", !pass);
  scoreNum.textContent = pct + "%";
  scoreNote.textContent = pass
    ? "checkpoint passed ✓"
    : "need 75% — review & retry";
  ring.style.strokeDashoffset = 163.4 * (1 - pct / 100);
  submit.classList.add("hidden");
  retry.classList.remove("hidden");
  const best = Math.max(pct, load()[SLUG]?.quiz || 0);
  save({ quiz: best });
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

refreshStates();
