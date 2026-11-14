/* Module 01 checkpoint — delegates to the shared engine. */
import { initCheckpoint } from "../core/checkpoint-engine.js";

initCheckpoint({
  slug: "first-principles-checkpoint",
  trackIndex: 0,
  moduleIndex: 0,
  flag: "FLAG{f1rst_pr1nc1pl3s}",
  questions: [
    {
      q: "Security is best described as…",
      opts: [
        "A product you install once",
        "A continuous process of keeping promises under attack",
        "A firewall rule set",
        "An antivirus subscription",
      ],
      a: 1,
      why: "Attackers adapt and controls decay. Security is ongoing work: patch, review, train, detect, rehearse.",
    },
    {
      q: "Which trio names the three promises every system makes?",
      opts: [
        "TCP, UDP, IP",
        "CIA: Confidentiality, Integrity, Availability",
        "HTTP, HTTPS, TLS",
        "RAM, CPU, SSD",
      ],
      a: 1,
      why: "CIA = secrets stay secret, data stays true, systems stay usable. Every attack breaks at least one.",
    },
    {
      q: "“The storm, the open window, what you might lose” maps to…",
      opts: [
        "Threat, Vulnerability, Risk",
        "Risk, Threat, Control",
        "Vulnerability, Threat, Impact",
        "Threat, Risk, Asset",
      ],
      a: 0,
      why: "Storm = threat. Window = vulnerability. Loss = risk. Controls close windows and shrink losses.",
    },
    {
      q: "Ransomware locks a hospital’s files so doctors cannot open them. Which promise breaks first?",
      opts: ["Confidentiality", "Integrity", "Availability", "Non-repudiation"],
      a: 2,
      why: "The system is unusable when needed: Availability. Encryption also alters data, and modern gangs steal it too — but uptime is the headline.",
    },
    {
      q: "A tester hired under contract, working in scope and reporting findings, wears a…",
      opts: ["Black hat", "Grey hat", "White hat", "Red hat only"],
      a: 2,
      why: "Written permission + scope + report = white hat. Permission is the legal line, not skill or motive.",
    },
    {
      q: "Someone breaks in without permission, then reports the bug “to help”. They are a…",
      opts: [
        "White hat",
        "Grey hat — and likely still unlawful",
        "Blue teamer",
        "Auditor",
      ],
      a: 1,
      why: "Good intent does not authorise access. Reporting afterwards does not erase the unauthorised intrusion.",
    },
    {
      q: "What made Stuxnet historically significant?",
      opts: [
        "It was the first phishing email",
        "It caused physical effects in industrial systems",
        "It was a browser hijacker",
        "It only stole cookies",
      ],
      a: 1,
      why: "Stuxnet changed machine behaviour while reporting “normal” — cyber crossed into physical damage.",
    },
    {
      q: "SolarWinds taught defenders that…",
      opts: [
        "Trusted software updates can be poisoned",
        "DDoS is always the biggest risk",
        "Passwords never matter",
        "Air gaps are impossible",
      ],
      a: 0,
      why: "Attackers compromised a trusted update pipeline. Supply-chain trust must be verified and monitored.",
    },
  ],
});
