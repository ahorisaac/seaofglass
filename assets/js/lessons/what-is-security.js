/* Lesson 01 · content + defense-in-depth stack controls. */
import { initLesson } from "../core/lesson-engine.js";

initLesson({
  slug: "what-is-security",
  flag: "FLAG{k33p_th3_pr0m1s3s}",
  files: {
    "mission.txt": [
      "MISSION: complete the sentence.",
      '"Security is a ______, not a product."',
      "Read goals.txt, then run: verify <word>",
    ],
    "goals.txt": [
      "Primary promises : Confidentiality, Integrity, Availability.",
      "Supporting ones  : authentication, authorization, non-repudiation, privacy.",
      "Defender’s job   : make attacks costly, and detect them fast.",
      "Key truth        : attackers adapt, so defence must keep moving.",
    ],
  },
  verify: {
    answers: ["process"],
    usage: "verify <product|process>",
    hint: "You buy a firewall once. You patch, review and rehearse forever.",
    success: ["[+] correct: security is a process — you keep doing it."],
  },
  intro: [
    ['Sea of Glass training shell — type "help" to begin.', "dim"],
    ["start here: cat mission.txt", "ok"],
  ],
  questions: [
    {
      q: "Security is best described as…",
      opts: [
        "A product you install once",
        "A continuous process",
        "A firewall rule set",
        "An antivirus subscription",
      ],
      a: 1,
      why: "Attackers adapt. Controls decay. New bugs appear. Security is ongoing work: patch, review, train, rehearse.",
    },
    {
      q: "Why does security assume an adversary, not just accidents?",
      opts: [
        "Because accidents are rare",
        "Because attackers adapt and target weaknesses",
        "Because users are careless",
        "Because insurance requires it",
      ],
      a: 1,
      why: "Reliability handles random failure. Security handles a thinking opponent who searches for the weakest path.",
    },
    {
      q: "Which idea says “one control will fail, so use several”?",
      opts: [
        "Least privilege",
        "Defense in depth",
        "Non-repudiation",
        "Security through obscurity",
      ],
      a: 1,
      why: "Defense in depth stacks independent layers so a single failure does not become a full breach.",
    },
    {
      q: "A company encrypts its database and keeps tested backups. Which layer is it strengthening?",
      opts: ["Perimeter", "People", "Data", "Physical building"],
      a: 2,
      why: "Encryption and backups protect the data itself — the innermost layer, and the last line of defence.",
    },
  ],
});

/* ---------- Stack lab ---------- */
const LAYERS = [
  {
    name: "Data",
    desc: "The crown jewels: encryption, access rules and tested backups. If every other layer fails, encrypted and backed-up data still keeps its promises.",
  },
  {
    name: "Application",
    desc: "Input validation, authentication and secure defaults. This layer stops SQL injection, XSS and broken access control before they reach the data.",
  },
  {
    name: "Host / OS",
    desc: "Patching, hardening and endpoint monitoring. It limits malware execution and privilege escalation on each machine.",
  },
  {
    name: "Network",
    desc: "Segmentation, firewalls and traffic monitoring. It slows lateral movement — the attacker’s second move after a foothold.",
  },
  {
    name: "Perimeter",
    desc: "Email filtering, VPN access and web application firewalls. It filters the obvious noise before it reaches users and servers.",
  },
  {
    name: "People",
    desc: "Training, MFA and a blame-free reporting culture. Attackers target this layer first because humans are the fastest route in.",
  },
];
const stack = document.getElementById("stack");
const spinWrap = document.getElementById("stack-spin");
const desc = document.getElementById("layer-desc");
const focusSelect = document.getElementById("st-focus");
const layerButtons = [...document.querySelectorAll(".layer")];
const listButtons = [...document.querySelectorAll("#layer-list button")];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

function setFocus(i) {
  layerButtons.forEach((b) =>
    b.classList.toggle("focus", +b.dataset.layer === i),
  );
  listButtons.forEach((b) => {
    const on = +b.dataset.layer === i;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", on);
  });
  focusSelect.value = i;
  desc.innerHTML = `<b>${LAYERS[i].name}.</b> ${LAYERS[i].desc}`;
}
layerButtons.forEach((b) =>
  b.addEventListener("click", () => setFocus(+b.dataset.layer)),
);
listButtons.forEach((b) =>
  b.addEventListener("click", () => setFocus(+b.dataset.layer)),
);
focusSelect.addEventListener("input", () => setFocus(+focusSelect.value));

const bindRange = (id, out, prop, unit) => {
  const el = document.getElementById(id),
    o = document.getElementById(out);
  el.addEventListener("input", () => {
    o.textContent = el.value;
    stack.style.setProperty(prop, el.value + unit);
  });
};
bindRange("st-spread", "st-spread-out", "--spread", "px");
bindRange("st-tilt", "st-tilt-out", "--tilt", "deg");
bindRange("st-angle", "st-angle-out", "--angle", "deg");
document
  .getElementById("st-spin")
  .addEventListener("input", (e) =>
    spinWrap.classList.toggle("spinning", e.target.checked),
  );
document
  .getElementById("st-ghost")
  .addEventListener("input", (e) =>
    stack.classList.toggle("ghost", e.target.checked),
  );
document.getElementById("st-reset").addEventListener("click", () => {
  const defaults = { "st-spread": 38, "st-tilt": 58, "st-angle": -35 };
  Object.entries(defaults).forEach(([id, v]) => {
    const el = document.getElementById(id);
    el.value = v;
    el.dispatchEvent(new Event("input"));
  });
  document.getElementById("st-spin").checked = !reduced;
  spinWrap.classList.toggle("spinning", !reduced);
  document.getElementById("st-ghost").checked = false;
  stack.classList.remove("ghost");
  setFocus(0);
});
if (reduced) {
  document.getElementById("st-spin").checked = false;
  spinWrap.classList.remove("spinning");
}
setFocus(0);
