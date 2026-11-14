/* TCP vs UDP lesson + wire simulator (cancellable, no duplicate loops). */
import { initLesson } from "../core/lesson-engine.js";

initLesson({
  slug: "tcp-udp",
  flag: "FLAG{thr33_w4y_h4ndsh4k3}",
  files: {
    "mission.txt": [
      "MISSION: verify the TCP three-way handshake in order.",
      "Read handshake.txt, then run: verify <step1> <step2> <step3>",
    ],
    "handshake.txt": [
      "1) Client → Server: SYN       “I want to connect.”",
      "2) Server → Client: SYN-ACK   “I hear you and agree.”",
      "3) Client → Server: ACK       “Confirmed.”",
      "UDP skips the handshake and just sends datagrams.",
    ],
  },
  verify: {
    answers: ["synsynackack", "synsyn-ackack"],
    usage: "verify syn synack ack",
    hint: "Start, agree, confirm.",
    success: ["[+] correct: SYN → SYN-ACK → ACK"],
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
      q: "Which protocol is connection-oriented and reliable?",
      opts: ["UDP", "TCP", "ICMP", "ARP"],
      a: 1,
      why: "TCP establishes a connection, numbers bytes, acknowledges and retransmits.",
    },
    {
      q: "What is the correct three-way handshake?",
      opts: [
        "ACK → SYN → SYN-ACK",
        "SYN → SYN-ACK → ACK",
        "SYN → ACK → SYN-ACK",
        "FIN → ACK → SYN",
      ],
      a: 1,
      why: "SYN starts, SYN-ACK agrees, ACK confirms.",
    },
    {
      q: "Which is a typical UDP use case?",
      opts: ["SSH session", "DNS query", "File transfer", "Email delivery"],
      a: 1,
      why: "DNS queries are small and fast; UDP avoids handshake overhead. DNS can use TCP for large responses or zone transfers.",
    },
    {
      q: "In a SYN scan, what response suggests an open port?",
      opts: ["RST", "SYN-ACK", "FIN", "ICMP unreachable"],
      a: 1,
      why: "SYN-ACK means the service is willing to continue the handshake — the port is open.",
    },
  ],
});

const $ = (id) => document.getElementById(id);
const wire = $("wire"),
  note = $("wire-note");
let runId = 0,
  stepResolver = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dist = () =>
  Math.max(120, wire.clientWidth - (innerWidth < 640 ? 208 : 300));
const dur = () => 1500 - $("t-speed").value * 100;

async function waitStep(id) {
  if (!$("t-step").checked || id !== runId) return;
  $("t-next").classList.remove("hidden");
  await new Promise((r) => {
    stepResolver = r;
  });
  $("t-next").classList.add("hidden");
}
$("t-next").addEventListener("click", () => {
  if (stepResolver) {
    const r = stepResolver;
    stepResolver = null;
    r();
  }
});

async function send(label, dir, id, force = false) {
  if (id !== runId) return false;
  const el = document.createElement("div");
  el.className = "pkt" + (dir === "s2c" ? " rev" : "");
  el.textContent = $("t-flags").checked ? label : "segment";
  el.style.setProperty("--dist", dist() + "px");
  el.style.setProperty("--dur", dur() + "ms");
  wire.appendChild(el);
  await sleep(30);
  el.classList.add("fly");
  const lost = !force && Math.random() * 100 < +$("t-loss").value;
  await sleep(dur() / 2);
  if (id !== runId) {
    el.remove();
    return false;
  }
  if (lost) {
    el.classList.add("lost");
    note.innerHTML = `<b>${label} lost.</b> ${$("t-proto").value === "TCP" ? "TCP will retransmit." : "UDP moves on — the application must handle loss."}`;
    await sleep(500);
    el.remove();
    if ($("t-proto").value === "TCP") {
      const r = await send(label + " ↻", dir, id, true);
      return r;
    }
    return true;
  }
  await sleep(dur() / 2);
  if (id !== runId) {
    el.remove();
    return false;
  }
  el.remove();
  await waitStep(id);
  return id === runId;
}

async function play() {
  const id = ++runId;
  $("t-start").disabled = true;
  wire.querySelectorAll(".pkt").forEach((p) => p.remove());
  const tcp = $("t-proto").value === "TCP";
  $("client-state").textContent = tcp ? "SYN-SENT" : "UDP";
  $("server-state").textContent = tcp ? "LISTEN" : "UDP";
  note.innerHTML = tcp
    ? "<b>TCP.</b> Handshake begins."
    : "<b>UDP.</b> No handshake — datagrams just fly.";
  const steps = tcp
    ? [
        ["SYN", "c2s"],
        ["SYN-ACK", "s2c"],
        ["ACK", "c2s"],
        ["DATA", "c2s"],
        ["ACK", "s2c"],
        ["FIN", "c2s"],
        ["ACK", "s2c"],
      ]
    : [
        ["DATAGRAM", "c2s"],
        ["DATAGRAM", "c2s"],
        ["REPLY", "s2c"],
      ];
  for (const [label, dir] of steps) {
    const ok = await send(label, dir, id);
    if (!ok) return;
    if (tcp && label === "ACK") {
      $("client-state").textContent = "ESTABLISHED";
      $("server-state").textContent = "ESTABLISHED";
    }
    if (tcp && label === "FIN") {
      $("client-state").textContent = "FIN-WAIT";
    }
  }
  if (id === runId) {
    $("client-state").textContent = tcp ? "CLOSED" : "DONE";
    $("server-state").textContent = tcp ? "CLOSED" : "DONE";
    note.innerHTML = tcp
      ? "<b>Done.</b> Connection closed cleanly."
      : "<b>Done.</b> UDP sent datagrams without guarantees.";
    $("t-start").disabled = false;
  }
}
function reset() {
  runId++;
  if (stepResolver) {
    const r = stepResolver;
    stepResolver = null;
    r();
  }
  wire.querySelectorAll(".pkt").forEach((p) => p.remove());
  $("client-state").textContent = "CLOSED";
  $("server-state").textContent = "LISTEN";
  $("t-start").disabled = false;
  $("t-next").classList.add("hidden");
  note.innerHTML =
    $("t-proto").value === "TCP"
      ? "<b>TCP.</b> Three-way handshake first, then data."
      : "<b>UDP.</b> Fire-and-forget datagrams.";
}
$("t-start").addEventListener("click", play);
$("t-reset").addEventListener("click", reset);
$("t-proto").addEventListener("input", reset);
$("t-speed").addEventListener(
  "input",
  () => ($("t-speed-out").textContent = $("t-speed").value),
);
$("t-loss").addEventListener(
  "input",
  () => ($("t-loss-out").textContent = $("t-loss").value),
);
