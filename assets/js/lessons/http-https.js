/* HTTP vs HTTPS lesson + request lab. */
import { initLesson } from "../core/lesson-engine.js";

initLesson({
  slug: "http-https",
  flag: "FLAG{th3_s_m34ns_tls}",
  files: {
    "mission.txt": [
      "MISSION: which status code means “I know who you are, but you may not enter”?",
      "Read http.txt, then run: verify <code>",
    ],
    "http.txt": [
      "200 OK             — here you go.",
      "301 Moved          — we moved, update your map.",
      "401 Unauthorized   — who are you? Log in.",
      "403 Forbidden      — I know you. No.",
      "404 Not Found      — no such door.",
      "500 Server Error   — the server broke, not you.",
    ],
  },
  verify: {
    answers: ["403", "forbidden"],
    usage: "verify 403",
    hint: "401 asks who you are; 403 says no.",
    success: ["[+] correct: 403 Forbidden."],
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
      q: "What does HTTPS add to HTTP?",
      opts: [
        "Faster CPU processing",
        "TLS: encryption, integrity and server authentication",
        "More status codes",
        "A different programming language",
      ],
      a: 1,
      why: "HTTPS is HTTP inside TLS. The semantics stay the same; the channel is protected.",
    },
    {
      q: "The padlock in the address bar means…",
      opts: [
        "The site is trustworthy",
        "The connection to this domain is encrypted",
        "The site has no vulnerabilities",
        "The site is government-approved",
      ],
      a: 1,
      why: "Phishing sites can have valid certificates. The padlock protects the pipe, not the site’s intentions.",
    },
    {
      q: "Which status code means “Not Found”?",
      opts: ["200", "301", "404", "500"],
      a: 2,
      why: "404 means the server could not find the requested resource.",
    },
    {
      q: "Which method is commonly used to submit a login form?",
      opts: ["GET", "POST", "TRACE", "HEAD"],
      a: 1,
      why: "POST sends data in the request body. GET puts parameters in the URL, which is a bad place for secrets.",
    },
  ],
});

const $ = (id) => document.getElementById(id);
const rawReq = $("raw-request"),
  rawRes = $("raw-response"),
  eve = $("eve-view"),
  eveBox = $("eve-box"),
  eveNote = $("eve-note"),
  status = $("status-chip");

function buildRequest() {
  const method = $("h-method").value,
    path = $("h-path").value,
    body = $("h-body").value.trim();
  const lines = [
    `${method} ${path} HTTP/1.1`,
    "Host: glasscorp.io",
    "User-Agent: SeaOfGlass/1.0",
    "Accept: */*",
  ];
  if ($("h-cookie").checked) lines.push("Cookie: session=lab-session-123");
  if ($("h-auth").checked) lines.push("Authorization: Bearer lab.token.abc");
  const hasBody = (method === "POST" || method === "PUT") && body;
  if (hasBody) {
    lines.push(
      "Content-Type: application/json",
      `Content-Length: ${body.length}`,
    );
  }
  return lines.join("\n") + (hasBody ? "\n\n" + body : "");
}
function cipherPreview(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let out = "";
  for (let i = 0; i < 96; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    out += ((h >>> 0) % 256).toString(16).padStart(2, "0");
    if (i % 16 === 15) out += "\n";
  }
  return "TLS 1.3 record (illustrative)\n" + out.trim();
}
function updateWire() {
  const req = buildRequest(),
    https = $("h-https").checked;
  rawReq.textContent = req;
  $("req-scheme").textContent = https ? "HTTPS · TLS" : "HTTP";
  eveBox.classList.toggle("safe", https);
  eve.textContent = https ? cipherPreview(req) : req;
  eveNote.textContent = https
    ? "On-path observer sees ciphertext. Headers and body are protected."
    : "On-path observer can read method, path, headers, cookies and body.";
  $("http-note").innerHTML = https
    ? "<b>HTTPS on.</b> The same request is wrapped in TLS."
    : "<b>HTTPS off.</b> Everything is readable on the wire.";
}
function route() {
  const method = $("h-method").value,
    path = $("h-path").value,
    auth = $("h-auth").checked,
    body = $("h-body").value.trim();
  if (path === "/old")
    return [301, "Moved Permanently", "Location: /\n\nMoved."];
  if (path === "/missing")
    return [
      404,
      "Not Found",
      'Content-Type: application/json\n\n{"error":"not_found"}',
    ];
  if (path === "/admin")
    return [
      403,
      "Forbidden",
      'Content-Type: application/json\n\n{"error":"forbidden","hint":"403 ≠ 401"}',
    ];
  if (path === "/api/me")
    return auth
      ? [
          200,
          "OK",
          'Content-Type: application/json\n\n{"user":"student","role":"user"}',
        ]
      : [
          401,
          "Unauthorized",
          'WWW-Authenticate: Bearer\n\n{"error":"login_required"}',
        ];
  if (path === "/login" && method === "POST")
    return body
      ? [200, "OK", 'Set-Cookie: session=lab-session-123\n\n{"ok":true}']
      : [400, "Bad Request", '\n{"error":"body_required"}'];
  if (path === "/" && method === "GET")
    return [
      200,
      "OK",
      "Content-Type: text/html\n\n<h1>Welcome to glasscorp.io</h1>",
    ];
  if (path === "/api/me" && method === "DELETE")
    return auth
      ? [200, "OK", '\n{"deleted":true}']
      : [401, "Unauthorized", '\n{"error":"login_required"}'];
  return [404, "Not Found", '\n{"error":"no_route_for_method_and_path"}'];
}
function send() {
  updateWire();
  const [code, msg, payload] = route();
  status.textContent = `${code} ${msg}`;
  status.className = "s" + Math.floor(code / 100);
  rawRes.textContent = `HTTP/1.1 ${code} ${msg}\nServer: SeaOfGlass-Lab\n${payload}`;
}
["h-method", "h-path", "h-https", "h-cookie", "h-auth", "h-body"].forEach(
  (id) => $(id).addEventListener("input", updateWire),
);
$("h-send").addEventListener("click", send);
$("h-reset").addEventListener("click", () => {
  $("h-method").value = "GET";
  $("h-path").value = "/";
  $("h-https").checked = true;
  $("h-cookie").checked = false;
  $("h-auth").checked = false;
  $("h-body").value = '{"user":"student","pass":"glass-pass"}';
  rawRes.textContent = "Press Send to receive a response.";
  status.textContent = "—";
  status.className = "";
  updateWire();
});
updateWire();
