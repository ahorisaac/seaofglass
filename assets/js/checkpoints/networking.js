/* Module 02 checkpoint — delegates to the shared engine. */
import { initCheckpoint } from "../core/checkpoint-engine.js";

initCheckpoint({
  slug: "networking-checkpoint",
  trackIndex: 0,
  moduleIndex: 1,
  flag: "FLAG{n3tw0rk_n4v1g4t0r}",
  questions: [
    {
      q: "A router forwards traffic mainly at which OSI layer?",
      opts: [
        "Layer 2 · Data Link",
        "Layer 3 · Network",
        "Layer 5 · Session",
        "Layer 7 · Application",
      ],
      a: 1,
      why: "Routers use IP addresses to move packets between networks — Layer 3.",
    },
    {
      q: "What is the correct encapsulation order as data moves down?",
      opts: [
        "Frame → packet → segment → data",
        "Data → segment → packet → frame → bits",
        "Bits → frame → data → packet",
        "Data → frame → packet → segment",
      ],
      a: 1,
      why: "Transport makes segments, Network makes packets, Data Link makes frames, Physical sends bits.",
    },
    {
      q: "Which address is reserved for private networks?",
      opts: ["8.8.8.8", "192.168.1.20", "1.1.1.1", "2001:db8::14"],
      a: 1,
      why: "192.168.0.0/16 is private. 8.8.8.8 and 1.1.1.1 are public DNS resolvers.",
    },
    {
      q: "Port 443 normally carries which service?",
      opts: ["SSH", "DNS", "HTTPS", "RDP"],
      a: 2,
      why: "443 is HTTP inside TLS — HTTPS. SSH is 22, DNS is 53, RDP is 3389.",
    },
    {
      q: "Which DNS record maps a name to an IPv6 address?",
      opts: ["A", "AAAA", "MX", "TXT"],
      a: 1,
      why: "A = IPv4, AAAA = IPv6, MX = mail servers, TXT = text clues.",
    },
    {
      q: "The TCP three-way handshake is…",
      opts: [
        "ACK → SYN → SYN-ACK",
        "SYN → SYN-ACK → ACK",
        "SYN → ACK → FIN",
        "HELLO → CERT → KEY",
      ],
      a: 1,
      why: "SYN starts, SYN-ACK agrees, ACK confirms. Only then is the connection established.",
    },
    {
      q: "HTTP 403 means…",
      opts: [
        "The resource does not exist",
        "The server knows you but refuses access",
        "Login is required",
        "The server crashed",
      ],
      a: 1,
      why: "403 Forbidden: understood and refused. 401 means authenticate first; 404 means not found.",
    },
    {
      q: "In Wireshark, what does “Follow TCP Stream” do?",
      opts: [
        "Captures new packets",
        "Reconstructs the conversation between two endpoints",
        "Encrypts the capture",
        "Scans for open ports",
      ],
      a: 1,
      why: "It reassembles the byte stream so you can read the whole exchange — including cleartext credentials on HTTP.",
    },
  ],
});
