/* DNS & Whois lesson + resolver journey. */
import { initLesson } from "../core/lesson-engine.js";

initLesson({
  slug: "dns-whois",
  flag: "FLAG{ph0n3b00k_0f_th3_n3t}",
  files: {
    "mission.txt": [
      "MISSION: which DNS record tells the world where to deliver mail?",
      "Read dns.txt, then run: verify <record type>",
    ],
    "dns.txt": [
      "A     — name to IPv4.",
      "AAAA  — name to IPv6.",
      "CNAME — alias to another name.",
      "MX    — mail exchange servers.",
      "TXT   — text clues (SPF, DKIM, DMARC).",
      "NS    — authoritative name servers.",
    ],
  },
  verify: {
    answers: ["mx", "mailexchange", "mailexchanger"],
    usage: "verify <record type>",
    hint: "Mail eXchange.",
    success: ["[+] correct: MX records point to mail servers."],
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
      q: "Which record maps a name to an IPv6 address?",
      opts: ["A", "AAAA", "MX", "TXT"],
      a: 1,
      why: "A = IPv4, AAAA = IPv6. Four times the address family, four times the A.",
    },
    {
      q: "What does a CNAME reveal?",
      opts: [
        "The mail server",
        "An alias to another hostname",
        "The registrar",
        "The CPU architecture",
      ],
      a: 1,
      why: "CNAME points one name at another name — often a CDN or hosting provider.",
    },
    {
      q: "Whois commonly reveals…",
      opts: [
        "Registrar, dates and name servers",
        "User passwords",
        "Live CPU usage",
        "The contents of a database",
      ],
      a: 0,
      why: "Whois is registration metadata. It does not reveal secrets like passwords or database contents.",
    },
    {
      q: "Which record helps you find mail infrastructure?",
      opts: ["NS", "MX", "AAAA", "SOA"],
      a: 1,
      why: "MX records list the mail servers for a domain.",
    },
  ],
});

const $ = (id) => document.getElementById(id);
const ZONES = {
  "glasscorp.io": {
    A: "10.10.14.2",
    AAAA: "2001:db8::14",
    MX: "10 mail.glasscorp.io",
    TXT: '"v=spf1 mx ~all"',
    NS: "ns1.glasscorp.io / ns2.glasscorp.io",
    whois: {
      Registrar: "Example Registrar, Inc.",
      Created: "2019-03-14",
      Expires: "2027-03-14",
      "Name servers": "ns1.glasscorp.io, ns2.glasscorp.io",
      Status: "clientTransferProhibited",
    },
  },
  "shop.glasscorp.io": {
    A: "10.10.14.80",
    CNAME: "shops.example-cdn.net",
    TXT: '"shop-verification=abc123"',
    NS: "ns1.glasscorp.io",
    whois: {
      Registrar: "Example Registrar, Inc.",
      Created: "2020-06-02",
      Expires: "2027-03-14",
      "Name servers": "ns1.glasscorp.io, ns2.glasscorp.io",
      Status: "active",
    },
  },
  "mail.glasscorp.io": {
    A: "10.10.14.25",
    AAAA: "2001:db8::25",
    MX: "10 mail.glasscorp.io",
    TXT: '"v=spf1 ip4:10.10.14.25 ~all"',
    NS: "ns1.glasscorp.io",
    whois: {
      Registrar: "Example Registrar, Inc.",
      Created: "2019-03-14",
      Expires: "2027-03-14",
      "Name servers": "ns1.glasscorp.io, ns2.glasscorp.io",
      Status: "active",
    },
  },
};
const hopEls = [...document.querySelectorAll(".hop")],
  token = $("dns-token"),
  answer = $("answer-card"),
  whois = $("whois-card");
let timers = [];

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}
function updateQuestion() {
  $("dns-question").textContent =
    `${$("d-domain").value} · ${$("d-record").value}`;
}
function renderWhois() {
  const w = ZONES[$("d-domain").value].whois;
  whois.innerHTML =
    "<h4>Whois registration card</h4><table>" +
    Object.entries(w)
      .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
      .join("") +
    "</table>";
  whois.classList.toggle("hidden", !$("d-whois").checked);
}
function reset() {
  clearTimers();
  hopEls.forEach((h) => h.classList.remove("active"));
  token.style.opacity = 0;
  answer.innerHTML = "<span>Answer</span><b>Press Resolve to begin.</b>";
  updateQuestion();
  renderWhois();
}
function resolve() {
  clearTimers();
  hopEls.forEach((h) => h.classList.remove("active"));
  const delay = 1200 - $("d-speed").value * 90;
  token.style.transitionDuration = delay + "ms";
  token.style.opacity = 1;
  hopEls.forEach((h, i) => {
    timers.push(
      setTimeout(() => {
        hopEls.forEach((x) => x.classList.remove("active"));
        h.classList.add("active");
        token.style.left = `calc(${(i / (hopEls.length - 1)) * 100}% - 6px)`;
        if (i === hopEls.length - 1) {
          const z = ZONES[$("d-domain").value],
            rec = $("d-record").value,
            val = z[rec];
          answer.innerHTML = `<span>Answer · ${rec}</span><b>${val || "NOERROR / no data for this record type"}</b>`;
          $("dns-note").innerHTML =
            `<b>${rec}:</b> ${val ? "This is the seeded lab answer. In a real assessment, record it as recon evidence." : "The name exists, but this record type does not. That is still useful information."}`;
        }
      }, i * delay),
    );
  });
}
$("d-resolve").addEventListener("click", resolve);
$("d-reset").addEventListener("click", reset);
$("d-domain").addEventListener("input", reset);
$("d-record").addEventListener("input", reset);
$("d-speed").addEventListener("input", () => {
  $("d-speed-out").textContent = $("d-speed").value;
  if (token.style.opacity === "1") resolve();
});
$("d-trace").addEventListener("input", (e) =>
  document
    .getElementById("hops")
    .classList.toggle("hide-trace", !e.target.checked),
);
$("d-whois").addEventListener("input", renderWhois);
reset();
