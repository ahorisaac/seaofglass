/* OSI Model lesson + 3D stack / encapsulation lab. */
import { initLesson } from "../core/lesson-engine.js";

initLesson({
  slug: "osi-model",
  flag: "FLAG{7_l4y3rs_0n3_wr4p}",
  files: {
    "mission.txt": [
      "MISSION: prove the OSI order.",
      "Read layers.txt, then run: verify <initials top-to-bottom>",
      "Mnemonic: All People Seem To Need Data Processing.",
    ],
    "layers.txt": [
      "7 Application   — what the user touches (HTTP, DNS).",
      "6 Presentation  — format & encryption (TLS, JPEG).",
      "5 Session       — starts/stops conversations.",
      "4 Transport     — ports & reliability (TCP, UDP).",
      "3 Network       — IP & routing.",
      "2 Data Link     — MAC & local delivery.",
      "1 Physical      — bits on cable/radio.",
      "Initials: A P S T N D P.",
    ],
  },
  verify: {
    answers: [
      "apstndp",
      "applicationpresentationsessiontransportnetworkdatalinkphysical",
    ],
    usage: "verify <7 initials top-to-bottom>",
    hint: "All People Seem To Need Data Processing.",
    success: [
      "[+] correct: Application → Presentation → Session → Transport → Network → Data Link → Physical",
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
      q: "Which layer does a router mainly work at?",
      opts: ["Layer 2", "Layer 3", "Layer 5", "Layer 7"],
      a: 1,
      why: "Routers forward packets using IP addresses — Layer 3, Network.",
    },
    {
      q: "TCP and UDP live at which layer?",
      opts: [
        "Transport · Layer 4",
        "Network · Layer 3",
        "Application · Layer 7",
        "Physical · Layer 1",
      ],
      a: 0,
      why: "Transport handles ports, reliability and ordering: TCP or UDP.",
    },
    {
      q: "What is encapsulation?",
      opts: [
        "Encrypting everything",
        "Adding headers as data moves down the layers",
        "Deleting headers at the receiver",
        "Compressing files",
      ],
      a: 1,
      why: "Each lower layer wraps the payload with its own header (and sometimes trailer) before delivery.",
    },
    {
      q: "ARP spoofing is mainly an attack on which layer?",
      opts: ["Application", "Presentation", "Data Link", "Session"],
      a: 2,
      why: "ARP maps IP to MAC on a local network — Layer 2, Data Link.",
    },
  ],
});

const L = [
  {
    name: "Application",
    desc: "What the user and app directly use: HTTP, DNS, SMTP. Most web vulnerabilities live here.",
  },
  {
    name: "Presentation",
    desc: "Translates formats and handles encryption/decryption. TLS lives here conceptually.",
  },
  {
    name: "Session",
    desc: "Manages conversations: start, maintain, end. Session hijacking attacks this idea.",
  },
  {
    name: "Transport",
    desc: "TCP/UDP, ports, reliability and ordering. nmap lives here.",
  },
  {
    name: "Network",
    desc: "IP addresses and routing. Ping, traceroute and IP spoofing live here.",
  },
  {
    name: "Data Link",
    desc: "MAC addresses and local delivery: Ethernet/Wi-Fi frames. ARP spoofing lives here.",
  },
  {
    name: "Physical",
    desc: "Bits on the medium: copper, fibre, radio. Jamming and wiretaps live here.",
  },
];
const $ = (id) => document.getElementById(id);
const stack = $("osi-stack"),
  spin = $("osi-spin"),
  note = $("layer-note"),
  preview = $("packet-preview"),
  pNote = $("packet-note");
const layers = [...document.querySelectorAll(".osi-layer")],
  focus = $("o-focus");
let wrap = 0;

function setFocus(i) {
  layers.forEach((b) => b.classList.toggle("focus", +b.dataset.layer === i));
  focus.value = i;
  note.innerHTML = `<b>L${7 - i} · ${L[i].name}.</b> ${L[i].desc}`;
}
function renderPacket() {
  const chips = [];
  if (wrap >= 3) chips.push(["ETH", "#ff4d6d"]);
  if (wrap >= 2) chips.push(["IP", "#ffb454"]);
  if (wrap >= 1) chips.push(["TCP", "#8f7bff"]);
  chips.push(["DATA", "#38e0ff"]);
  if (wrap >= 3) chips.push(["FCS", "#ff4d6d"]);
  if (wrap >= 4) {
    preview.innerHTML =
      '<span class="p-chip" style="--pc:#9db0c9">01010100110…</span>';
    pNote.textContent = "Bits on the wire. The frame becomes signals.";
    return;
  }
  preview.innerHTML = chips
    .map(([t, c]) => `<span class="p-chip" style="--pc:${c}">${t}</span>`)
    .join("");
  pNote.textContent = [
    "Application data ready.",
    "Transport adds TCP header → segment.",
    "Network adds IP header → packet.",
    "Data Link adds frame header/trailer → frame.",
    "",
  ][wrap];
}
function setWrap(v) {
  wrap = Math.max(0, Math.min(4, v));
  renderPacket();
  if (wrap > 0) setFocus([0, 3, 4, 5, 6][wrap]);
}
layers.forEach((b) =>
  b.addEventListener("click", () => setFocus(+b.dataset.layer)),
);
focus.addEventListener("input", () => setFocus(+focus.value));
$("o-wrap").addEventListener("click", () => setWrap(wrap + 1));
$("o-unwrap").addEventListener("click", () => setWrap(wrap - 1));
const bindRange = (id, out, prop, unit) => {
  const el = $(id),
    o = $(out);
  el.addEventListener("input", () => {
    o.textContent = el.value;
    stack.style.setProperty(prop, el.value + unit);
  });
};
bindRange("o-spread", "o-spread-out", "--spread", "px");
bindRange("o-tilt", "o-tilt-out", "--tilt", "deg");
bindRange("o-angle", "o-angle-out", "--angle", "deg");
$("o-spin").addEventListener("input", (e) =>
  spin.classList.toggle("spinning", e.target.checked),
);
$("o-ghost").addEventListener("input", (e) =>
  stack.classList.toggle("ghost", e.target.checked),
);
$("o-reset").addEventListener("click", () => {
  [
    ["o-spread", 30],
    ["o-tilt", 58],
    ["o-angle", -32],
  ].forEach(([id, v]) => {
    $(id).value = v;
    $(id).dispatchEvent(new Event("input"));
  });
  $("o-spin").checked = true;
  spin.classList.add("spinning");
  $("o-ghost").checked = false;
  stack.classList.remove("ghost");
  setWrap(0);
  setFocus(0);
});
if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  $("o-spin").checked = false;
  spin.classList.remove("spinning");
}
setFocus(0);
renderPacket();
