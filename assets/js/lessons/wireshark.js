/* Wireshark lesson + simulated capture analyzer. */
import { initLesson } from "../core/lesson-engine.js";

initLesson({
  slug: "wireshark",
  flag: "FLAG{p4ck3ts_n3v3r_l13}",
  files: {
    "mission.txt": [
      "MISSION: which display filter shows only DNS packets?",
      "Read capture.txt, then run: verify <filter>",
    ],
    "capture.txt": [
      "Capture filters decide what gets recorded.",
      "Display filters decide what you see from a capture.",
      "http → web requests/responses.",
      "dns  → name lookups.",
      "tcp.port == 80 → one service.",
      "ip.addr == 10.10.14.2 → one host.",
    ],
  },
  verify: {
    answers: ["dns"],
    usage: "verify <display filter>",
    hint: "The protocol that resolves names.",
    success: ["[+] correct: dns shows only DNS queries and responses."],
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
      q: "What is the difference between a capture filter and a display filter?",
      opts: [
        "They are identical",
        "Capture filters limit what is recorded; display filters limit what is shown",
        "Display filters encrypt traffic",
        "Capture filters only work on Wi-Fi",
      ],
      a: 1,
      why: "Capture filters act before storage. Display filters act on an existing capture.",
    },
    {
      q: "What does “Follow TCP Stream” reveal?",
      opts: [
        "The reconstructed conversation",
        "Only packet lengths",
        "The Wi-Fi password",
        "CPU temperature",
      ],
      a: 0,
      why: "It reassembles the byte stream so you can read the full exchange.",
    },
    {
      q: "Why can’t you read passwords inside a TLS stream?",
      opts: [
        "TLS compresses them away",
        "The payload is encrypted",
        "Wireshark is broken",
        "Passwords are deleted",
      ],
      a: 1,
      why: "TLS encrypts application data. You still see metadata, but not content.",
    },
    {
      q: "Which filter isolates SYN packets?",
      opts: ["tcp.flags.syn == 1", "http", "dns", "arp"],
      a: 0,
      why: "SYN flags show connection attempts — useful for spotting scans.",
    },
  ],
});

const $ = (id) => document.getElementById(id);
const CLIENT = "10.10.14.7",
  SERVER = "10.10.14.2";
const RAW = [
  [
    1,
    0.0,
    CLIENT,
    "Broadcast",
    "ARP",
    42,
    "Who has 10.10.14.1? Tell 10.10.14.7",
    0,
    0,
    0,
  ],
  [
    2,
    0.002,
    "10.10.14.1",
    CLIENT,
    "ARP",
    42,
    "10.10.14.1 is at 02:42:ac:11:00:01",
    0,
    0,
    0,
  ],
  [
    3,
    0.12,
    CLIENT,
    "10.10.14.1",
    "DNS",
    74,
    "Standard query A glasscorp.io",
    0,
    0,
    0,
  ],
  [
    4,
    0.145,
    "10.10.14.1",
    CLIENT,
    "DNS",
    90,
    "Standard query response A 10.10.14.2",
    0,
    0,
    0,
  ],
  [5, 0.201, CLIENT, SERVER, "TCP", 74, "51514 → 80 [SYN]", 51514, 80, 1],
  [6, 0.203, SERVER, CLIENT, "TCP", 74, "80 → 51514 [SYN, ACK]", 80, 51514, 1],
  [7, 0.204, CLIENT, SERVER, "TCP", 66, "51514 → 80 [ACK]", 51514, 80, 1],
  [8, 0.21, CLIENT, SERVER, "HTTP", 420, "GET /login HTTP/1.1", 51514, 80, 1],
  [9, 0.228, SERVER, CLIENT, "TCP", 66, "80 → 51514 [ACK]", 80, 51514, 1],
  [
    10,
    0.24,
    SERVER,
    CLIENT,
    "HTTP",
    380,
    "HTTP/1.1 200 OK (text/html)",
    80,
    51514,
    1,
  ],
  [
    11,
    0.4,
    CLIENT,
    SERVER,
    "HTTP",
    510,
    "POST /login HTTP/1.1 (form)",
    51514,
    80,
    1,
  ],
  [12, 0.42, SERVER, CLIENT, "TCP", 66, "80 → 51514 [ACK]", 80, 51514, 1],
  [
    13,
    0.455,
    SERVER,
    CLIENT,
    "HTTP",
    460,
    "HTTP/1.1 302 Found → /dashboard",
    80,
    51514,
    1,
  ],
  [14, 0.5, CLIENT, SERVER, "TCP", 66, "51514 → 80 [FIN, ACK]", 51514, 80, 1],
  [15, 0.502, SERVER, CLIENT, "TCP", 66, "80 → 51514 [FIN, ACK]", 80, 51514, 1],
  [16, 1.02, CLIENT, SERVER, "TCP", 74, "51520 → 443 [SYN]", 51520, 443, 2],
  [
    17,
    1.022,
    SERVER,
    CLIENT,
    "TCP",
    74,
    "443 → 51520 [SYN, ACK]",
    443,
    51520,
    2,
  ],
  [18, 1.023, CLIENT, SERVER, "TCP", 66, "51520 → 443 [ACK]", 51520, 443, 2],
  [19, 1.03, CLIENT, SERVER, "TLSv1.3", 583, "Client Hello", 51520, 443, 2],
  [
    20,
    1.045,
    SERVER,
    CLIENT,
    "TLSv1.3",
    1400,
    "Server Hello, Certificate, Certificate Verify, Finished",
    443,
    51520,
    2,
  ],
  [21, 1.08, CLIENT, SERVER, "TLSv1.3", 220, "Application Data", 51520, 443, 2],
  [
    22,
    1.095,
    SERVER,
    CLIENT,
    "TLSv1.3",
    240,
    "Application Data",
    443,
    51520,
    2,
  ],
];
const PACKETS = RAW.map((r) => ({
  no: r[0],
  t: r[1],
  src: r[2],
  dst: r[3],
  proto: r[4],
  len: r[5],
  info: r[6],
  sport: r[7],
  dport: r[8],
  stream: r[9],
}));
const PAYLOADS = {
  8: [
    "GET /login HTTP/1.1",
    "Host: glasscorp.io",
    "User-Agent: SeaOfGlass/1.0",
    "Accept: text/html",
  ],
  10: [
    "HTTP/1.1 200 OK",
    "Content-Type: text/html",
    "",
    '<form method="POST" action="/login">…</form>',
  ],
  11: [
    "POST /login HTTP/1.1",
    "Host: glasscorp.io",
    "Content-Type: application/x-www-form-urlencoded",
    "",
    "username=student&password=glass-pass-2026",
  ],
  13: [
    "HTTP/1.1 302 Found",
    "Location: /dashboard",
    "Set-Cookie: session=lab-session-123",
  ],
};
let selected = 11,
  replayTimer = null,
  replayList = [];

const transport = (p) =>
  ["TCP", "HTTP", "TLSv1.3"].includes(p.proto)
    ? "tcp"
    : p.proto === "DNS"
      ? "udp"
      : "";
const cls = (p) =>
  "p-" + (p.proto.startsWith("TLS") ? "tls" : p.proto.toLowerCase());
const payloadText = (p) => (PAYLOADS[p.no] || []).join("\n");
const timeText = (p) =>
  $("w-time").value === "abs"
    ? new Date(Date.UTC(2026, 10, 14, 14, 2, 11) + p.t * 1000)
        .toISOString()
        .slice(11, 23)
    : p.t.toFixed(3);

function match(p, f) {
  f = f.trim().toLowerCase();
  if (!f) return true;
  if (f === "tcp") return transport(p) === "tcp";
  if (f === "udp") return transport(p) === "udp";
  if (f === "dns") return p.proto === "DNS";
  if (f === "http") return p.proto === "HTTP";
  if (f === "tls") return p.proto.startsWith("TLS");
  if (f === "arp") return p.proto === "ARP";
  let m = f.match(/^ip\.(addr|src|dst)\s*==\s*([0-9.]+)$/);
  if (m)
    return m[1] === "src"
      ? p.src === m[2]
      : m[1] === "dst"
        ? p.dst === m[2]
        : p.src === m[2] || p.dst === m[2];
  m = f.match(/^tcp\.(port|srcport|dstport)\s*==\s*(\d+)$/);
  if (m)
    return m[1] === "srcport"
      ? p.sport === +m[2]
      : m[1] === "dstport"
        ? p.dport === +m[2]
        : p.sport === +m[2] || p.dport === +m[2];
  if (f === "tcp.flags.syn == 1")
    return transport(p) === "tcp" && p.info.includes("SYN");
  const q = f.replace(/^frame contains\s*/, "").replace(/"/g, "");
  return (
    p.info +
    " " +
    p.src +
    " " +
    p.dst +
    " " +
    p.proto +
    " " +
    payloadText(p)
  )
    .toLowerCase()
    .includes(q);
}
const filtered = () => PACKETS.filter((p) => match(p, $("w-filter").value));

function renderTable(list = filtered()) {
  const rows = list
    .map(
      (
        p,
      ) => `<div class="ws-row ${cls(p)} ${p.no === selected ? "selected" : ""}" data-no="${p.no}" role="row">
    <span>${p.no}</span><span>${timeText(p)}</span><span>${p.src}</span><span>${p.dst}</span><span>${p.proto}</span><span>${p.len}</span><span>${p.info}</span></div>`,
    )
    .join("");
  $("ws-table").innerHTML =
    `<div class="ws-row head" role="row"><span>No.</span><span>Time</span><span>Source</span><span>Destination</span><span>Protocol</span><span>Len</span><span>Info</span></div>${rows}`;
  $("ws-count").textContent = `${list.length} / ${PACKETS.length}`;
  $("filter-chip").textContent = $("w-filter").value.trim() || "all packets";
  $("ws-table").classList.toggle("color", $("w-color").checked);
  $("ws-table")
    .querySelectorAll(".ws-row:not(.head)")
    .forEach((r) =>
      r.addEventListener("click", () => {
        selected = +r.dataset.no;
        renderTable();
        renderDetail();
      }),
    );
}
function layersFor(p) {
  const L = [
    [
      "Frame",
      [
        ["Packet number", p.no],
        ["Length", p.len + " bytes"],
        ["Arrival time", timeText(p)],
      ],
    ],
    [
      "Ethernet II",
      [
        ["Source MAC", "02:42:ac:11:00:07"],
        [
          "Destination MAC",
          p.dst === "Broadcast" ? "ff:ff:ff:ff:ff:ff" : "02:42:ac:11:00:02",
        ],
      ],
    ],
  ];
  if (p.proto === "ARP") {
    L.push([
      "Address Resolution Protocol",
      [
        ["Operation", p.info.includes("Who") ? "request (1)" : "reply (2)"],
        ["Sender IP", p.src],
        ["Target IP", p.dst],
      ],
    ]);
    return L;
  }
  L.push([
    "Internet Protocol Version 4",
    [
      ["Source", p.src],
      ["Destination", p.dst],
      ["TTL", "64"],
      ["Protocol", p.proto === "DNS" ? "UDP (17)" : "TCP (6)"],
    ],
  ]);
  if (p.proto === "DNS")
    L.push([
      "Domain Name System",
      [
        ["Summary", p.info],
        ["Transaction ID", "0x1a2b"],
        [
          "Flags",
          p.info.includes("response") ? "0x8180 response" : "0x0100 query",
        ],
      ],
    ]);
  else {
    L.push([
      "Transmission Control Protocol",
      [
        ["Source port", p.sport],
        ["Destination port", p.dport],
        ["Flags", p.info.match(/\[(.*?)\]/)?.[1] || "ACK"],
        ["Stream ID", p.stream],
      ],
    ]);
    if (p.proto === "HTTP")
      L.push([
        "Hypertext Transfer Protocol",
        (PAYLOADS[p.no] || [p.info]).map((x) => ["Line", x]),
      ]);
    if (p.proto.startsWith("TLS"))
      L.push([
        "Transport Layer Security 1.3",
        [
          ["Record", p.info],
          ["Content", "encrypted — unreadable without session keys"],
        ],
      ]);
  }
  return L;
}
function hexFor(p) {
  const text = p.info + " " + payloadText(p);
  let out = "";
  for (let i = 0; i < Math.min(text.length, 160); i += 16) {
    const slice = text.slice(i, i + 16);
    const hex = [...slice]
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(" ");
    out +=
      i.toString(16).padStart(4, "0") +
      "  " +
      hex.padEnd(47, " ") +
      "  " +
      slice.replace(/[^\x20-\x7e]/g, ".") +
      "\n";
  }
  return out || "0000  (no payload)";
}
function renderDetail() {
  const p = PACKETS.find((x) => x.no === selected) || PACKETS[0];
  const open = $("w-expand").checked ? " open" : "";
  $("ws-tree").innerHTML = layersFor(p)
    .map(
      ([name, fields]) =>
        `<details${open}><summary>${name}</summary>${fields.map(([k, v]) => `<div class="field"><span>${k}</span><b>${v}</b></div>`).join("")}</details>`,
    )
    .join("");
  $("ws-hex").textContent = hexFor(p);
  $("ws-hex").classList.toggle("hidden", !$("w-hex").checked);
  document
    .querySelector(".ws-bottom")
    .classList.toggle("split", $("w-hex").checked);
}
function followStream() {
  const p = PACKETS.find((x) => x.no === selected);
  if (!p || !p.stream) {
    $("ws-note").innerHTML =
      "<b>No TCP stream here.</b> Select a TCP/HTTP/TLS packet first.";
    return;
  }
  const stream = PACKETS.filter(
    (x) =>
      x.stream === p.stream &&
      (x.proto === "HTTP" || x.proto.startsWith("TLS")),
  );
  const body =
    p.stream === 1
      ? stream
          .map(
            (x) =>
              `<span class="${x.src === CLIENT ? "c" : "s"}">${payloadText(x) || x.info}\n</span>`,
          )
          .join("")
      : '<span class="dim">TLS 1.3 stream — application data is encrypted.\nYou can see endpoints, ports, timing and certificate metadata, but not the password or page content.</span>';
  $("ws-stream").innerHTML =
    `<header>FOLLOW TCP STREAM · #${p.stream}<button type="button" class="btn tiny ghost" id="close-stream">Close</button></header><pre>${body}</pre>`;
  $("ws-stream").classList.remove("hidden");
  $("close-stream").addEventListener("click", () =>
    $("ws-stream").classList.add("hidden"),
  );
  $("ws-note").innerHTML =
    p.stream === 1
      ? "<b>Plaintext exposed.</b> Packet 11 carries <code>username=student&amp;password=glass-pass-2026</code>. This is why HTTPS matters."
      : "<b>TLS stream.</b> Same site, same login idea — but the payload is ciphertext.";
}
function stopReplay() {
  clearInterval(replayTimer);
  replayTimer = null;
}
function replay() {
  stopReplay();
  replayList = [];
  const list = filtered();
  replayTimer = setInterval(() => {
    if (replayList.length >= list.length) {
      stopReplay();
      return;
    }
    replayList.push(list[replayList.length]);
    renderTable(replayList);
  }, 110);
}
function reset() {
  stopReplay();
  $("w-filter").value = "";
  $("w-proto").value = "";
  $("w-time").value = "rel";
  $("w-color").checked = true;
  $("w-expand").checked = true;
  $("w-hex").checked = false;
  selected = 11;
  $("ws-stream").classList.add("hidden");
  renderTable();
  renderDetail();
  $("ws-note").innerHTML =
    "<b>Try this:</b> filter <code>http</code>, select packet 11, then Follow TCP Stream.";
}
$("w-filter").addEventListener("input", () => {
  stopReplay();
  renderTable();
});
$("w-proto").addEventListener("input", (e) => {
  $("w-filter").value = e.target.value;
  renderTable();
});
$("w-time").addEventListener("input", () => {
  renderTable();
  renderDetail();
});
$("w-color").addEventListener("input", () => renderTable());
$("w-expand").addEventListener("input", renderDetail);
$("w-hex").addEventListener("input", renderDetail);
$("w-follow").addEventListener("click", followStream);
$("w-replay").addEventListener("click", replay);
$("w-reset").addEventListener("click", reset);
reset();
