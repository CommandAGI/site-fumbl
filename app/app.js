// The Fumbl demo. Its rules are the charter's trust-and-safety rules (companies/fumbl/charter.md):
// adults only, consent before anything is shared, report and block one tap from anywhere, no dark patterns.
// State lives in this tab's session storage; nothing is sent (the page's policy forbids connections).
import { SAMPLE_PROFILES } from "./profiles.js";
import { avatarSvg } from "./avatar.js";

const KEY = "fumbl-demo";
const UNDERAGE = "fumbl-underage";
const view = document.getElementById("view");
const tabs = document.getElementById("tabs");

const store = {
  get(key) {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* the demo still works for this page view */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* nothing kept */
    }
  },
};

const fresh = () => ({ dob: null, profile: null, seen: [], liked: [], matches: [], blocked: [], chats: {}, photosOn: {}, reports: [], paused: false });
let state = (() => {
  try {
    return { ...fresh(), ...JSON.parse(store.get(KEY) || "{}") };
  } catch {
    return fresh();
  }
})();
const save = () => store.set(KEY, JSON.stringify(state));

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const byId = (id) => SAMPLE_PROFILES.find((p) => p.id === id);
const SAMPLE = `<span class="pill">Sample profile</span>`;
// Money, gift cards, crypto, or a quick move to another app: the usual first steps of a romance scam.
const SCAM = /\b(money|cash|bank|gift ?cards?|crypto|bitcoin|usdt|wire|western union|paypal|venmo|cash ?app|invest\w*|telegram|whatsapp|signal|snapchat|kik)\b/i;

function show(html, tab) {
  view.innerHTML = html;
  tabs.classList.toggle("hidden", !tab);
  for (const b of tabs.querySelectorAll("button")) {
    if (b.dataset.tab === tab) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  }
  view.focus({ preventScroll: true });
  scrollTo(0, 0);
}

function ageOn(dob, today = new Date()) {
  const [y, m, d] = dob.split("-").map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}

// ── the age gate ──────────────────────────────────────────────────────────────────────────────────────────────
function gate() {
  show(`<h1>First, your date of birth</h1>
  <form class="panel" id="gate" novalidate>
    <p class="muted">Fumbl is for adults aged 18 and over. We ask for your date of birth, not a tick box. To <a href="live.html">join for real</a>, you also pass an ID age check before anyone sees you.</p>
    <label class="field">Date of birth<input type="date" id="dob" required autocomplete="bday"></label>
    <p class="error" id="gate-error" role="alert"></p>
    <button class="btn primary" type="submit">Continue</button>
  </form>`);
  document.getElementById("gate").addEventListener("submit", (e) => {
    e.preventDefault();
    const dob = document.getElementById("dob").value;
    const err = document.getElementById("gate-error");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return (err.textContent = "Enter your date of birth.");
    const age = ageOn(dob);
    if (age < 0 || age > 120) return (err.textContent = "That date does not look right. Check it and try again.");
    if (age < 18) {
      store.set(UNDERAGE, "1");
      return underage();
    }
    state.dob = dob;
    save();
    setup();
  });
}

function underage() {
  show(`<h1>Fumbl is for adults</h1>
  <div class="panel"><p>You need to be 18 or older to use Fumbl, so you cannot continue.</p>
  <p class="muted">If you want to talk to someone about relationships or staying safe online, a trusted adult, a school counsellor or a local helpline can help.</p>
  <a class="btn" href="../index.html">Back to the home page</a></div>`);
}

// ── your profile ──────────────────────────────────────────────────────────────────────────────────────────────
function setup() {
  show(`<h1>A little about you</h1>
  <form class="panel" id="setup">
    <label class="field">First name<input id="name" required maxlength="30" autocomplete="given-name"></label>
    <label class="field">Pronouns <small>(optional)</small><input id="pronouns" maxlength="20"></label>
    <label class="field">Who do you want to meet?
      <select id="meet"><option value="everyone">Everyone</option><option value="woman">Women</option><option value="man">Men</option><option value="nonbinary">Non-binary people</option></select></label>
    <label class="field">What are you looking for?
      <select id="looking"><option>Something long-term</option><option>Something casual</option><option>Not sure yet</option><option>New friends</option></select></label>
    <p class="muted">Only what you write here is on your profile. We never add your location or contacts.</p>
    <button class="btn primary" type="submit">Start meeting people</button>
  </form>`);
  document.getElementById("setup").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    if (!name) return;
    state.profile = { name, pronouns: document.getElementById("pronouns").value.trim(), meet: document.getElementById("meet").value, looking: document.getElementById("looking").value };
    save();
    discover();
  });
}

// ── discover ──────────────────────────────────────────────────────────────────────────────────────────────────
function candidates() {
  const meet = state.profile?.meet ?? "everyone";
  return SAMPLE_PROFILES.filter((p) => !state.seen.includes(p.id) && !state.blocked.includes(p.id) && (meet === "everyone" || p.gender === meet));
}

function discover(note = "") {
  if (state.paused)
    return show(`<h1>Your profile is paused</h1><div class="panel"><p>No one sees you, and you see no one, until you resume.</p><button class="btn primary" id="resume">Resume</button></div>`, "discover"), document.getElementById("resume").addEventListener("click", () => ((state.paused = false), save(), discover()));
  const p = candidates()[0];
  if (!p)
    return show(`${note}<h1>You have seen everyone for now</h1><div class="panel"><p>That is everyone in the demo. In the live app, new people appear as they join. There is nothing to buy to see more.</p><button class="btn" id="go-matches">See your matches</button></div>`, "discover"), document.getElementById("go-matches").addEventListener("click", matches);
  show(`${note}<article class="profile" aria-labelledby="p-name">
    <div class="pic">${SAMPLE}${avatarSvg(p, 240)}</div>
    <div class="body">
      <h2 id="p-name">${esc(p.name)}, ${p.age}</h2>
      <p class="meta">${esc(p.pronouns)} · ${esc(p.place)} · ${esc(p.looking)}</p>
      ${p.prompts.map(([q, a]) => `<div class="prompt"><b>${esc(q)}</b>${esc(a)}</div>`).join("")}
      <div class="decide">
        <button class="btn" id="pass" aria-label="Pass on ${esc(p.name)}">Pass</button>
        <button class="btn primary" id="like" aria-label="Like ${esc(p.name)}">Like</button>
      </div>
      <div class="safety-row">
        <button class="linkish" id="report">Report</button>
        <button class="linkish" id="block">Block</button>
      </div>
    </div>
  </article>`, "discover");
  document.getElementById("pass").addEventListener("click", () => {
    state.seen.push(p.id);
    save();
    discover();
  });
  document.getElementById("like").addEventListener("click", () => {
    state.seen.push(p.id);
    state.liked.push(p.id);
    if (p.likesBack) state.matches.push(p.id);
    save();
    if (p.likesBack) matched(p);
    else discover();
  });
  document.getElementById("report").addEventListener("click", () => report(p, discover));
  document.getElementById("block").addEventListener("click", () => block(p, discover));
}

function matched(p) {
  show(`<div class="panel" style="text-align:center">
    <div style="display:flex;justify-content:center">${avatarSvg(p, 140)}</div>
    <h1>You and ${esc(p.name)} liked each other</h1>
    <p class="muted">Demo: a sample profile's like is set in its data. ${SAMPLE}</p>
    <div class="btns" style="justify-content:center"><button class="btn primary" id="hello">Say hello</button><button class="btn" id="later">Keep looking</button></div>
  </div>`, "discover");
  document.getElementById("hello").addEventListener("click", () => chat(p.id));
  document.getElementById("later").addEventListener("click", () => discover());
}

// ── matches and chat ──────────────────────────────────────────────────────────────────────────────────────────
function matches() {
  const list = state.matches.map(byId).filter(Boolean);
  show(`<h1>Your matches</h1>${
    list.length
      ? `<ul class="list">${list
          .map((p) => {
            const last = (state.chats[p.id] ?? []).at(-1);
            return `<li><button data-id="${p.id}">${avatarSvg(p, 52)}<span><strong>${esc(p.name)}</strong> ${SAMPLE}<small>${last ? esc(last.text).slice(0, 60) : "Say hello"}</small></span></button></li>`;
          })
          .join("")}</ul>`
      : `<div class="panel"><p>No matches yet. When you and someone both like each other, they appear here.</p></div>`
  }`, "matches");
  for (const b of view.querySelectorAll("[data-id]")) b.addEventListener("click", () => chat(b.dataset.id));
}

function chat(id) {
  const p = byId(id);
  if (!p || !state.matches.includes(id)) return matches();
  const msgs = state.chats[id] ?? [];
  const scam = msgs.some((m) => m.from === "them" && SCAM.test(m.text));
  const mine = !!state.photosOn[id];
  show(`<div class="chat-head">
      ${avatarSvg(p, 44)}
      <div class="who"><strong>${esc(p.name)}</strong> ${SAMPLE}</div>
      <div class="chat-tools"><button class="linkish" id="report">Report</button><button class="linkish" id="block">Block</button><button class="linkish" id="unmatch">Unmatch</button></div>
    </div>
    <div class="consent"><span>${mine ? `You turned photos on. They stay off until ${esc(p.name)} turns them on too. Sample profiles never do, in this demo.` : "Photos are off. Both of you must turn them on for this chat."}</span>
      <button class="btn quiet" id="photos">${mine ? "Turn off for me" : "Turn on for me"}</button></div>
    <ul class="messages" aria-live="polite">${msgs
      .map((m) => `<li class="${m.from === "me" ? "mine" : ""}">${m.from === "them" ? "<small>Sample reply</small>" : ""}${esc(m.text)}</li>`)
      .join("")}</ul>
    ${scam ? `<p class="warn" role="alert"><strong>Be careful.</strong> This message asks for money or to move to another app. People who do this soon after a match are often running a scam. Never send money to someone you have not met. <button class="linkish" id="report-scam">Report it</button></p>` : ""}
    <form class="compose" id="compose"><label class="sr" for="msg">Message</label><input id="msg" maxlength="500" autocomplete="off" placeholder="Write a message"><button class="btn primary" type="submit">Send</button></form>
    <p><button class="linkish" id="back">← Matches</button></p>`, "matches");
  document.getElementById("photos").addEventListener("click", () => ((state.photosOn[id] = !mine), save(), chat(id)));
  document.getElementById("report").addEventListener("click", () => report(p, () => chat(id)));
  document.getElementById("report-scam")?.addEventListener("click", () => report(p, () => chat(id), "scam"));
  document.getElementById("block").addEventListener("click", () => block(p, matches));
  document.getElementById("unmatch").addEventListener("click", async () => {
    if (!(await confirmDialog(`Unmatch ${p.name}?`, "The chat closes for both of you.", "Unmatch"))) return;
    state.matches = state.matches.filter((x) => x !== id);
    delete state.chats[id];
    save();
    matches();
  });
  document.getElementById("back").addEventListener("click", matches);
  document.getElementById("compose").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = document.getElementById("msg").value.trim();
    if (!text) return;
    const first = !(state.chats[id] ?? []).some((m) => m.from === "me");
    (state.chats[id] ??= []).push({ from: "me", text });
    save();
    chat(id);
    document.getElementById("msg").focus();
    if (first && p.reply)
      setTimeout(() => {
        if (!state.matches.includes(id)) return;
        state.chats[id].push({ from: "them", text: p.reply });
        save();
        if (view.querySelector("#compose")) chat(id);
      }, 900);
  });
}

// ── safety: report, block ─────────────────────────────────────────────────────────────────────────────────────
const URGENT = new Set(["minor", "threat", "intimate-image"]);

function report(p, then, reason = "") {
  const dialog = document.getElementById("report-dialog");
  const form = document.getElementById("report-form");
  form.reset();
  if (reason) form.querySelector(`input[value="${reason}"]`).checked = true;
  document.getElementById("report-name").textContent = p.name;
  dialog.onclose = () => {
    if (dialog.returnValue !== "send") return;
    const data = new FormData(form);
    const r = { id: p.id, name: p.name, reason: data.get("reason"), note: String(data.get("note") || ""), at: new Date().toISOString() };
    if (!r.reason) return;
    state.reports.push(r);
    const blockToo = data.get("block") === "on";
    if (blockToo) doBlock(p.id);
    save();
    const note = `<p class="toast" role="status"><strong>Report received.</strong> ${
      URGENT.has(r.reason) ? "A report like this goes first, and the account is suspended until a person reviews it. " : ""
    }In the live app our safety team decides with one rule and a plain reason, and tells you the outcome. In this demo the report stays in your browser.${blockToo ? ` You also blocked ${esc(p.name)}.` : ""}</p>`;
    if (blockToo) discover(note);
    else then === discover ? discover(note) : then();
  };
  dialog.showModal();
}

function doBlock(id) {
  if (!state.blocked.includes(id)) state.blocked.push(id);
  if (!state.seen.includes(id)) state.seen.push(id);
  state.matches = state.matches.filter((x) => x !== id);
  delete state.chats[id];
}

async function block(p, then) {
  if (!(await confirmDialog(`Block ${p.name}?`, `You will not see each other again, and any chat closes. ${p.name} is not told.`, "Block"))) return;
  doBlock(p.id);
  save();
  then === discover ? discover(`<p class="toast" role="status">Blocked. You will not see ${esc(p.name)} again.</p>`) : then();
}

function confirmDialog(title, text, ok) {
  const dialog = document.getElementById("confirm-dialog");
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-text").textContent = text;
  document.getElementById("confirm-ok").textContent = ok;
  return new Promise((resolve) => {
    dialog.onclose = () => resolve(dialog.returnValue === "ok");
    dialog.returnValue = "";
    dialog.showModal();
  });
}

// ── you ───────────────────────────────────────────────────────────────────────────────────────────────────────
function settings() {
  const p = state.profile ?? {};
  show(`<h1>You</h1>
  <div class="panel">
    <p><strong>${esc(p.name)}</strong>${p.pronouns ? ` (${esc(p.pronouns)})` : ""}<br><span class="muted">Looking for: ${esc(p.looking)}</span></p>
    <label class="check"><input type="checkbox" id="pause" ${state.paused ? "checked" : ""}> Pause my profile: no one sees me, and I see no one</label>
  </div>
  <h2>Your reports</h2>
  ${state.reports.length ? `<ul class="list">${state.reports.map((r) => `<li class="panel">${esc(r.name)}: ${esc(r.reason)}<br><small class="muted">In the demo, kept in this browser.</small></li>`).join("")}</ul>` : `<p class="muted">You have not reported anyone.</p>`}
  <h2>Blocked</h2>
  <p class="muted">${state.blocked.length ? state.blocked.map((id) => esc(byId(id)?.name)).join(", ") : "No one."}</p>
  <h2>Delete everything</h2>
  <p class="muted">Your profile, likes, matches, chats and reports are removed from this browser at once.</p>
  <button class="btn" id="delete">Delete everything</button>`, "settings");
  document.getElementById("pause").addEventListener("change", (e) => ((state.paused = e.target.checked), save()));
  document.getElementById("delete").addEventListener("click", async () => {
    if (!(await confirmDialog("Delete everything?", "This removes your profile, likes, matches, chats and reports from this browser.", "Delete"))) return;
    store.clear();
    state = fresh();
    gate();
  });
}

for (const b of tabs.querySelectorAll("button")) b.addEventListener("click", () => ({ discover, matches, settings })[b.dataset.tab]());

if (store.get(UNDERAGE)) underage();
else if (!state.dob) gate();
else if (!state.profile) setup();
else discover();
