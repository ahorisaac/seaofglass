/* Trojans & RATs lesson + inert defender-focused simulator. */
import { initLesson } from "../core/lesson-engine.js";

initLesson({
  slug: "trojans-rats",
  flag: "FLAG{b3w4r3_th3_g1ft}",
  files: {
    "mission.txt": [
      "MISSION: trojans pretend to be what kind of software?",
      "Read trojan.txt, then run: verify <word>",
    ],
    "trojan.txt": [
      "Trojan — malware disguised as useful or legitimate software.",
      "RAT — Remote Access Trojan: gives the attacker remote control.",
      "Remote admin tools are legitimate with consent; RATs are not.",
      "Memory hook: looks useful → runs hidden → attacker in control.",
    ],
  },
  verify: {
    answers: ["legitimate", "legit", "useful", "trusted"],
    usage: "verify <word>",
    hint: "It looks safe, helpful and normal.",
    success: [
      "[+] correct: trojans disguise themselves as legitimate software.",
    ],
  },
  intro: [
    [
      "Sea of Glass training shell — Enter runs commands; the page never reloads.",
      "dim",
    ],
    ["start here: cat mission.txt", "ok"],
  ],
  questions: [
    {
      q: "How do trojans usually spread?",
      opts: [
        "By self-replicating across subnets",
        "By disguising themselves as useful software",
        "By infecting RAM only",
        "By increasing screen brightness",
      ],
      a: 1,
      why: "Trojans rely on deception and user execution, not self-propagation.",
    },
    {
      q: "What does RAT stand for?",
      opts: [
        "Random Access Tool",
        "Remote Access Trojan",
        "Rapid Audit Terminal",
        "Root Authority Token",
      ],
      a: 1,
      why: "Remote Access Trojan: malware that gives an attacker interactive control.",
    },
    {
      q: "What separates a legitimate remote admin tool from a RAT?",
      opts: [
        "The programming language",
        "Consent, visibility and intent",
        "The file size",
        "The operating system",
      ],
      a: 1,
      why: "Same category of capability; the difference is permission and transparency.",
    },
    {
      q: "Which is a strong defence against cracked-software trojans?",
      opts: [
        "Install from trusted sources only",
        "Use a wallpaper engine",
        "Disable the monitor",
        "Reboot once a month",
      ],
      a: 0,
      why: "Cracks and cheats are common trojan delivery. Trusted sources and allowlisting reduce the risk.",
    },
  ],
});

const $ = (id) => document.getElementById(id);
const consoleEl = $("r-console"),
  alerts = $("r-alert-list"),
  note = $("r-note");
let keylog = false,
  webcam = false,
  persisted = false,
  prevNote = note.value,
  shots = 0;

function cprint(text, cls = "") {
  const d = document.createElement("div");
  d.className = cls;
  d.textContent = text;
  consoleEl.appendChild(d);
  while (consoleEl.children.length > 80) consoleEl.firstChild.remove();
  consoleEl.scrollTop = consoleEl.scrollHeight;
}
function alert(text, sev = "medium") {
  const li = document.createElement("li");
  li.innerHTML = `<b>${sev.toUpperCase()}</b> · ${text}`;
  alerts.prepend(li);
  while (alerts.children.length > 12) alerts.lastChild.remove();
}
function connected() {
  return $("r-c2").checked;
}
function updateConn() {
  const on = connected();
  $("r-conn").textContent = on ? "C2: connected" : "C2: blocked";
  $("r-conn").classList.toggle("off", !on);
  cprint(
    on
      ? "[+] C2 channel restored (simulated)."
      : "[-] C2 channel blocked by egress control.",
    on ? "ok" : "bad",
  );
  alert(
    on
      ? "Outbound C2 allowed — risk restored."
      : "Egress policy blocked outbound C2.",
    on ? "high" : "info",
  );
}
function run(cmd) {
  if (!connected()) {
    cprint("[-] no route to agent — C2 blocked.", "bad");
    alert("Egress block held: command could not reach the agent.", "info");
    return;
  }
  switch (cmd) {
    case "screenshot":
      shots++;
      $("r-desktop").classList.add("flash");
      setTimeout(() => $("r-desktop").classList.remove("flash"), 360);
      cprint(
        `[+] screenshot_${String(shots).padStart(3, "0")}.png captured (simulated).`,
        "ok",
      );
      alert("Suspicious process called display-capture API.", "medium");
      break;
    case "files":
      cprint(
        "[+] notes.txt · projects/ · photo.png · passwords.kdbx (simulated listing).",
        "ok",
      );
      alert("File enumeration from an unsigned process.", "medium");
      break;
    case "keylog":
      keylog = !keylog;
      cprint(
        `[*] keylog ${keylog ? "enabled" : "disabled"} (simulated).`,
        "warn",
      );
      if (keylog) alert("Keyboard hook installed by unsigned process.", "high");
      break;
    case "webcam":
      webcam = !webcam;
      $("r-cam").classList.toggle("on", webcam);
      cprint(
        `[*] webcam ${webcam ? "enabled" : "disabled"} (simulated).`,
        "warn",
      );
      if (webcam) alert("Camera accessed without user consent.", "critical");
      break;
    case "download":
      cprint("[*] transferring loot.zip (simulated)…", "dim");
      $("r-progress").style.width = "0";
      requestAnimationFrame(() => {
        $("r-progress").style.width = "100%";
      });
      setTimeout(() => {
        cprint("[+] loot.zip transferred (simulated).", "ok");
        alert("Outbound data spike to unknown external host.", "high");
      }, 1150);
      break;
    case "persist":
      if (!persisted) {
        persisted = true;
        const li = document.createElement("li");
        li.className = "bad";
        li.textContent = "GlassUpdate — unsigned · autostart";
        $("r-startup").appendChild(li);
        cprint(
          "[+] persistence added: GlassUpdate autostart (simulated).",
          "ok",
        );
        alert("New autostart entry: unsigned GlassUpdate.", "high");
      } else cprint("[*] persistence already present (simulated).", "dim");
      break;
  }
}
document
  .querySelectorAll("[data-cmd]")
  .forEach((b) => b.addEventListener("click", () => run(b.dataset.cmd)));
$("r-defender").addEventListener("input", (e) => {
  $("r-alerts").classList.toggle("hidden", !e.target.checked);
  $("r-mode").textContent = e.target.checked
    ? "Defender view · artifacts"
    : "Simulated controller";
  $("rat-note").innerHTML = e.target.checked
    ? "<b>Defender view on.</b> Every simulated action writes an alert. Read the artifact, not just the action."
    : "<b>Controller view.</b> Now toggle Defender view and repeat an action to see the detection side.";
});
$("r-c2").addEventListener("input", updateConn);
$("r-clean").addEventListener("click", () => {
  keylog = false;
  webcam = false;
  persisted = false;
  shots = 0;
  $("r-cam").classList.remove("on");
  $("r-progress").style.width = "0";
  $("r-startup").innerHTML = "<li>BrowserUpdater — trusted publisher</li>";
  $("r-keylog").textContent = "—";
  alerts.innerHTML = "";
  consoleEl.innerHTML = "";
  note.value = "remember: change the admin password on Friday";
  prevNote = note.value;
  $("r-c2").checked = true;
  updateConn();
  cprint("[*] system restored to clean baseline (simulated).", "ok");
});
note.addEventListener("input", () => {
  if (keylog && connected()) {
    const added =
      note.value.length > prevNote.length
        ? note.value.slice(prevNote.length)
        : "⌫";
    $("r-keylog").textContent =
      ($("r-keylog").textContent === "—" ? "" : $("r-keylog").textContent) +
      added;
  }
  prevNote = note.value;
});
cprint("Sea of Glass inert RAT awareness lab.", "dim");
cprint(
  "Trigger an action, then toggle Defender view to see the artifact.",
  "ok",
);
