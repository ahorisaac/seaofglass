/* IP, MAC & Ports lesson + simulated scanner. */
import { initLesson } from "../core/lesson-engine.js";

initLesson({
  slug: "ip-mac-ports",
  flag: "FLAG{d00rs_h4ve_numb3rs}",
  files: {
    "mission.txt": [
      "MISSION: verify the doors for remote shell, web, and secure web.",
      "Read ports.txt, then run: verify <ssh> <http> <https>",
    ],
    "ports.txt": [
      "SSH  — secure remote shell → port 22.",
      "HTTP — plaintext web      → port 80.",
      "HTTPS— web inside TLS     → port 443.",
      "MAC addresses are local; IP addresses are logical; ports identify services.",
    ],
  },
  verify: {
    answers: ["2280443"],
    usage: "verify 22 80 443",
    hint: "SSH first, then HTTP, then HTTPS.",
    success: ["[+] correct: SSH 22 · HTTP 80 · HTTPS 443"],
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
      q: "Which address is used for local delivery on the same LAN?",
      opts: ["IP", "MAC", "Port", "URL"],
      a: 1,
      why: "MAC addresses identify interfaces on the local link. Routers forward using IP, not MAC.",
    },
    {
      q: "Which is a private IPv4 range?",
      opts: ["8.8.8.8/32", "192.168.0.0/16", "1.1.1.1/32", "2001:db8::/32"],
      a: 1,
      why: "192.168.0.0/16 is reserved for private networks and is not routed on the public internet.",
    },
    {
      q: "What does a port identify?",
      opts: [
        "A country",
        "A service behind an IP address",
        "A CPU core",
        "A file type",
      ],
      a: 1,
      why: "Ports are service doors: one IP can host many services on different ports.",
    },
    {
      q: "Why is port 23 (Telnet) usually a finding?",
      opts: [
        "It is too fast",
        "It sends data, including credentials, in cleartext",
        "It only works on Windows",
        "It encrypts too strongly",
      ],
      a: 1,
      why: "Telnet lacks encryption. Anyone on-path can read the session. SSH replaced it.",
    },
  ],
});

const $ = (id) => document.getElementById(id);
const PORTS = [
  {
    p: 21,
    svc: "FTP",
    note: "Check anonymous login and cleartext credentials.",
    def: "Disable or replace with SFTP.",
    cmd: "nmap -sV -p21 10.10.14.2",
  },
  {
    p: 22,
    svc: "SSH",
    note: "Remote shell. Password auth invites brute force.",
    def: "Use keys, disable root login, rate-limit.",
    cmd: "ssh student@10.10.14.2",
  },
  {
    p: 23,
    svc: "TELNET",
    note: "Cleartext remote access — usually a finding.",
    def: "Replace with SSH.",
    cmd: "nmap -sV -p23 10.10.14.2",
  },
  {
    p: 25,
    svc: "SMTP",
    note: "Mail relay; check open relay behaviour.",
    def: "Require auth, restrict relay.",
    cmd: "nmap -sV -p25 10.10.14.2",
  },
  {
    p: 53,
    svc: "DNS",
    note: "Records and sometimes zone transfers leak structure.",
    def: "Restrict AXFR to authorised secondaries.",
    cmd: "dig @10.10.14.2 glasscorp.io AXFR",
  },
  {
    p: 80,
    svc: "HTTP",
    note: "Web attack surface; credentials can be readable on-path.",
    def: "Redirect to HTTPS, set HSTS.",
    cmd: "curl -I http://10.10.14.2/",
  },
  {
    p: 110,
    svc: "POP3",
    note: "Legacy mail retrieval, often cleartext.",
    def: "Use POP3S/IMAPS.",
    cmd: "nmap -sV -p110 10.10.14.2",
  },
  {
    p: 139,
    svc: "NETBIOS",
    note: "Legacy Windows naming/sharing.",
    def: "Disable if unused.",
    cmd: "nmap -sV -p139 10.10.14.2",
  },
  {
    p: 443,
    svc: "HTTPS",
    note: "Web inside TLS; still test the app logic.",
    def: "Use modern TLS, valid certs, HSTS.",
    cmd: "curl -I https://10.10.14.2/",
  },
  {
    p: 445,
    svc: "SMB",
    note: "Windows file sharing; historically dangerous when exposed.",
    def: "Block at perimeter, patch, segment.",
    cmd: "nmap -sV -p445 10.10.14.2",
  },
  {
    p: 3306,
    svc: "MYSQL",
    note: "Database exposure is high impact.",
    def: "Bind to localhost or internal net only.",
    cmd: "nmap -sV -p3306 10.10.14.2",
  },
  {
    p: 3389,
    svc: "RDP",
    note: "Remote desktop; brute force and exposure risk.",
    def: "VPN first, MFA, lockouts.",
    cmd: "nmap -sV -p3389 10.10.14.2",
  },
  {
    p: 5900,
    svc: "VNC",
    note: "Remote control; weak auth is common.",
    def: "Tunnel through VPN/SSH, strong auth.",
    cmd: "nmap -sV -p5900 10.10.14.2",
  },
  {
    p: 8080,
    svc: "HTTP-ALT",
    note: "Admin panels and dev servers love this port.",
    def: "Authenticate and patch admin interfaces.",
    cmd: "curl -I http://10.10.14.2:8080/",
  },
  {
    p: 8443,
    svc: "HTTPS-ALT",
    note: "Alternate TLS web interface.",
    def: "Same rules as 443.",
    cmd: "curl -I https://10.10.14.2:8443/",
  },
  {
    p: 9100,
    svc: "JETDIRECT",
    note: "Printer service; often forgotten.",
    def: "Segment printers, disable unused services.",
    cmd: "nmap -sV -p9100 10.10.14.99",
  },
];
const TARGETS = {
  web: {
    name: "10.10.14.2 · glasscorp-web",
    open: [21, 22, 80, 443, 8080],
    filtered: [3306],
  },
  dc: {
    name: "10.10.14.5 · glasscorp-dc",
    open: [22, 53, 80, 139, 443, 445, 3389],
    filtered: [3306],
  },
  iot: {
    name: "10.10.14.99 · glasscorp-printer",
    open: [80, 443, 9100],
    filtered: [22, 23],
  },
};
const PROFILES = {
  top: [21, 22, 23, 25, 53, 80, 110, 443, 445, 3389],
  web: [80, 443, 8080, 8443],
  full: PORTS.map((p) => p.p),
};
const doors = $("doors"),
  detail = $("port-detail");
let timer = null,
  queue = [],
  idx = 0;

function stateFor(port) {
  const t = TARGETS[$("p-target").value];
  return t.open.includes(port)
    ? "open"
    : t.filtered.includes(port)
      ? "filtered"
      : "closed";
}
function build() {
  const list = PROFILES[$("p-profile").value].map((p) =>
    PORTS.find((x) => x.p === p),
  );
  doors.innerHTML = list
    .map(
      (x) =>
        `<button type="button" class="door" data-port="${x.p}"><b>${x.p}</b><small>?</small></button>`,
    )
    .join("");
  doors
    .querySelectorAll(".door")
    .forEach((d) =>
      d.addEventListener("click", () => showDetail(+d.dataset.port, d)),
    );
  $("scan-target").textContent = TARGETS[$("p-target").value].name;
}
function showDetail(port, el) {
  if (!el.classList.contains("revealed")) return;
  const x = PORTS.find((p) => p.p === port),
    st = stateFor(port);
  detail.innerHTML = `<b>${port} · ${x.svc} <span class="tag">${st}</span></b><p><b>Attacker:</b> ${x.note}</p><p><b>Defender:</b> ${x.def}</p><code>${x.cmd}</code>`;
}
function stop() {
  clearInterval(timer);
  timer = null;
  $("p-scan").innerHTML = '<svg class="ic"><use href="#i-search"/></svg> Scan';
}
function tick() {
  if (idx >= queue.length) {
    stop();
    return;
  }
  const port = queue[idx++],
    el = doors.querySelector(`[data-port="${port}"]`);
  const st = stateFor(port);
  el.classList.add("revealed", st);
  el.querySelector("small").textContent =
    st === "open" ? PORTS.find((p) => p.p === port).svc : st;
}
function start() {
  if (timer) {
    stop();
    return;
  }
  if (idx >= queue.length) {
    build();
    queue = PROFILES[$("p-profile").value];
    idx = 0;
  }
  $("p-scan").innerHTML = '<svg class="ic"><use href="#i-replay"/></svg> Pause';
  timer = setInterval(tick, 1100 - $("p-speed").value * 90);
}
$("p-scan").addEventListener("click", start);
$("p-reset").addEventListener("click", () => {
  stop();
  queue = PROFILES[$("p-profile").value];
  idx = 0;
  build();
  detail.innerHTML =
    "<b>Select a door</b><p>Run a scan, then click a revealed port.</p>";
});
$("p-target").addEventListener("input", () => $("p-reset").click());
$("p-profile").addEventListener("input", () => $("p-reset").click());
$("p-speed").addEventListener("input", () => {
  $("p-speed-out").textContent = $("p-speed").value;
  if (timer) {
    clearInterval(timer);
    timer = setInterval(tick, 1100 - $("p-speed").value * 90);
  }
});
$("p-closed").addEventListener("input", (e) =>
  doors.classList.toggle("hide-closed", !e.target.checked),
);
$("p-random").addEventListener("click", () => {
  const keys = Object.keys(TARGETS);
  $("p-target").value = keys[Math.floor(Math.random() * keys.length)];
  $("p-reset").click();
});
queue = PROFILES.top;
build();
