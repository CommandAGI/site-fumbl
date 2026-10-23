// Fumbl with real members. The rules are the charter's (companies/fumbl/charter.md in CommandAGI's Drive); the server
// keeps them (CommandAGI's api worker, src/data/fumbl.ts). This page signs a member in with their CommandAGI account
// (OAuth, Authorization Code + PKCE, the client "fumbl") and keeps the key in this tab's session storage only.

const view = document.getElementById("view");
const tabs = document.getElementById("tabs");
const LOCAL = ["127.0.0.1", "localhost"].includes(location.hostname) || location.hostname.endsWith(".localhost");
const DEV = location.hostname.includes("--dev") || LOCAL;
const params = new URLSearchParams(location.search);
const API = (LOCAL && params.get("api")) || (DEV ? "https://api-dev.commandagi.com" : "https://api.commandagi.com");
const WEB = DEV ? "https://dev.commandagi.com" : "https://commandagi.com";
const HERE = location.origin + location.pathname;
const UNDERAGE = "fumbl-underage";
const SCAM = /\b(money|cash|bank|gift ?cards?|crypto|bitcoin|usdt|wire|western union|paypal|venmo|cash ?app|invest\w*|telegram|whatsapp|signal|snapchat|kik)\b/i;
const NO_CHECKS = "FUMBL DOES NOT CONDUCT CRIMINAL BACKGROUND CHECKS OR IDENTITY SCREENING OF ITS MEMBERS.";
const LOOKING = { "long-term": "Something long-term", casual: "Something casual", "not-sure": "Not sure yet", friends: "New friends" };

const session = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* this page view only */ } },
  drop: (k) => { try { sessionStorage.removeItem(k); } catch { /* nothing kept */ } },
};
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const initial = (name) => esc((name || "?").trim().charAt(0).toUpperCase());
const avatar = (p, size = 120) => `<span class="initial" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.45)}px" aria-hidden="true">${initial(p.firstName)}</span>`;
let me = null;
let poll = null;

async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { authorization: `Bearer ${session.get("fumbl-token")}`, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    session.drop("fumbl-token");
    signedOut();
    throw new Error("signed out");
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, ...data };
}

function show(html, tab) {
  clearInterval(poll);
  view.innerHTML = html;
  tabs.classList.toggle("hidden", !tab);
  for (const b of tabs.querySelectorAll("button")) {
    if (b.dataset.tab === tab) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  }
  view.focus({ preventScroll: true });
  scrollTo(0, 0);
}
const on = (id, event, fn) => document.getElementById(id)?.addEventListener(event, fn);
const toast = (text) => `<p class="toast" role="status">${text}</p>`;

// ── signing in ────────────────────────────────────────────────────────────────────────────────────────────────
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function signIn() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const state = b64url(crypto.getRandomValues(new Uint8Array(16)));
  session.set("fumbl-pkce", JSON.stringify({ verifier, state }));
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const q = new URLSearchParams({ client_id: "fumbl", redirect_uri: HERE, response_type: "code", scope: "view", code_challenge: challenge, code_challenge_method: "S256", state });
  location.assign(`${WEB}/oauth/authorize?${q}`);
}

async function finishSignIn() {
  const code = params.get("code");
  if (!code) return;
  const pkce = JSON.parse(session.get("fumbl-pkce") || "{}");
  session.drop("fumbl-pkce");
  history.replaceState(null, "", HERE);
  if (!pkce.verifier || params.get("state") !== pkce.state) return;
  const res = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ grant_type: "authorization_code", code, redirect_uri: HERE, client_id: "fumbl", code_verifier: pkce.verifier }),
  });
  const data = await res.json().catch(() => ({}));
  if (data.access_token) session.set("fumbl-token", data.access_token);
}

function signedOut() {
  show(`<h1>Dating for adults, safety first</h1>
  <div class="panel">
    <p>Fumbl is free, for adults aged 18 and over in the United States. You sign in with a CommandAGI account (Fumbl is a company of CommandAGI). If you have none, the same button lets you make one.</p>
    <button class="btn primary" id="sign-in">Sign in with CommandAGI</button>
    <p class="muted">Before anyone sees you, we check your age with an ID and a selfie through Stripe. We keep only the result.</p>
    <p class="no-checks">${NO_CHECKS}</p>
    <p class="muted"><a href="../terms.html">Terms</a> · <a href="../privacy.html">Privacy</a> · <a href="../safety.html">Safety tips</a> · <a href="index.html">Try the demo first</a></p>
  </div>`);
  on("sign-in", "click", signIn);
}

// ── who you are on Fumbl ──────────────────────────────────────────────────────────────────────────────────────
async function route() {
  if (session.get(UNDERAGE)) return underage();
  if (!session.get("fumbl-token")) return signedOut();
  me = await api("GET", "/fumbl/me");
  document.getElementById("review-tab").classList.toggle("hidden", !me.reviewer);
  if (location.hash === "#review" && me.reviewer) return review();
  const m = me.member;
  if (!m) return join();
  if (m.status === "refused_minor" || me.ageCheck === "minor") return underage();
  if (m.status === "removed") return ended();
  if (m.status === "suspended") return suspended();
  if (me.ageCheck !== "adult") return ageCheck();
  if (!me.profile) return editProfile();
  return location.hash === "#you" ? you() : discover();
}

function join() {
  show(`<h1>First, your date of birth</h1>
  <form class="panel" id="join" novalidate>
    <p class="muted">Fumbl is for adults aged 18 and over. We ask for your date of birth, not a tick box. We use it only to check this, and we do not keep it.</p>
    <label class="field">Date of birth<input type="date" id="dob" required autocomplete="bday"></label>
    <div class="notice-box">
      <h2>Before you join: staying safe</h2>
      <p class="no-checks">${NO_CHECKS}</p>
      <p>We check that every member is an adult with an ID and a selfie. We do not check criminal records, and an ID check cannot tell you who someone really is. Read our <a href="../safety.html" target="_blank" rel="noopener">safety tips</a> before you meet anyone.</p>
    </div>
    <label class="check"><input type="checkbox" id="agree" required><span>I have read the safety notice above, the <a href="../terms.html" target="_blank" rel="noopener">terms</a> and the <a href="../privacy.html" target="_blank" rel="noopener">privacy notice</a>, and I am in the United States.</span></label>
    <p class="error" id="join-error" role="alert"></p>
    <button class="btn primary" type="submit">Join Fumbl</button>
  </form>`);
  on("join", "submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("join-error");
    const dob = document.getElementById("dob").value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return (err.textContent = "Enter your date of birth.");
    if (!document.getElementById("agree").checked) return (err.textContent = "Tick the box to say you read the safety notice and the terms.");
    const r = await api("POST", "/fumbl/join", { dateOfBirth: dob });
    if (r.error === "minor") return (session.set(UNDERAGE, "1"), underage());
    if (r.error === "not_open_in_your_country") return (err.textContent = "Fumbl is open only in the United States for now.");
    if (r.error) return (err.textContent = "That date does not look right. Check it and try again.");
    route();
  });
}

function underage() {
  show(`<h1>Fumbl is for adults</h1>
  <div class="panel"><p>You need to be 18 or older to use Fumbl, so you cannot continue.</p>
  <p class="muted">If you want to talk to someone about relationships or staying safe online, a trusted adult, a school counsellor or a local helpline can help.</p>
  <a class="btn" href="../index.html">Back to the home page</a></div>`);
}

function ended() {
  show(`<h1>Your membership has ended</h1><div class="panel"><p>A person on our safety team removed your Fumbl membership after a report. You can download your data or delete it.</p>
  <p class="muted">If you think this is wrong, write to hello@fumbl.commandagi.com.</p><div class="btns"><button class="btn" id="export">Download my data</button><button class="btn" id="delete">Delete my Fumbl data</button></div></div>`);
  wireDataButtons();
}

function suspended() {
  show(`<h1>Your profile is on hold</h1><div class="panel"><p>Someone reported your account for a reason that a person must review first. Until then, no one sees you and you cannot send messages. We will tell you the decision.</p>
  <div class="btns"><button class="btn" id="export">Download my data</button></div></div>`);
  wireDataButtons();
}

function ageCheck() {
  show(`<h1>Check your age</h1>
  <div class="panel">
    <p>Before anyone sees you, we make sure you are an adult. Stripe, our identity provider, asks for a photo of your ID and a selfie, and checks that they match.</p>
    <ul class="muted">
      <li>Stripe compares your selfie with your ID photo. This uses your face geometry, which some state laws call biometric data.</li>
      <li>Fumbl keeps only the result: adult or not, and when. We never get or keep your ID photo, your selfie or your date of birth from the ID.</li>
      <li>When the result is in, we ask Stripe to delete your ID images, your selfie and what it read from them. Stripe deletes biometric data within one year in any case.</li>
    </ul>
    <label class="check"><input type="checkbox" id="consent"><span>I agree that Stripe collects my ID and selfie, and compares my face with my ID photo, to check my age for Fumbl, as the <a href="../privacy.html#age" target="_blank" rel="noopener">privacy notice</a> says.</span></label>
    <p class="error" id="age-error" role="alert"></p>
    <div class="btns"><button class="btn primary" id="start">Check my age</button><button class="btn" id="again">I finished: look again</button></div>
  </div>`);
  on("start", "click", async () => {
    if (!document.getElementById("consent").checked) return (document.getElementById("age-error").textContent = "Tick the box to agree first.");
    const r = await api("POST", "/fumbl/age-check", { returnUrl: HERE });
    if (r.url) location.assign(r.url);
    else document.getElementById("age-error").textContent = "The age check could not start. Try again later.";
  });
  on("again", "click", route);
}

function editProfile() {
  const p = me.profile ?? {};
  const prompts = p.prompts ?? [];
  const opt = (list, cur) => list.map(([v, t]) => `<option value="${v}"${v === cur ? " selected" : ""}>${t}</option>`).join("");
  show(`<h1>${me.profile ? "Your profile" : "A little about you"}</h1>
  <form class="panel" id="profile">
    <label class="field">First name<input id="firstName" required maxlength="30" autocomplete="given-name" value="${esc(p.firstName)}"></label>
    <label class="field">Pronouns <small>(optional)</small><input id="pronouns" maxlength="20" value="${esc(p.pronouns)}"></label>
    <label class="field">I am<select id="gender">${opt([["woman", "A woman"], ["man", "A man"], ["nonbinary", "Non-binary"]], p.gender)}</select></label>
    <label class="field">I want to meet<select id="meet">${opt([["everyone", "Everyone"], ["woman", "Women"], ["man", "Men"], ["nonbinary", "Non-binary people"]], p.meet)}</select></label>
    <label class="field">I am looking for<select id="looking">${opt(Object.entries(LOOKING), p.looking)}</select></label>
    ${[0, 1, 2].map((i) => `<label class="field">A question you answer <small>(optional)</small><input id="q${i}" maxlength="80" value="${esc(prompts[i]?.q ?? ["A perfect Sunday", "I am learning", "Ask me about"][i])}"></label><label class="field"><span class="sr">Your answer</span><textarea id="a${i}" rows="2" maxlength="300" placeholder="Your answer">${esc(prompts[i]?.a)}</textarea></label>`).join("")}
    <p class="muted">Other members see your first name, pronouns, what you are looking for and your answers. They never see your gender, who you want to meet, your last name, your contacts or your location. Do not write health details, your address or your phone number here.</p>
    <label class="check"><input type="checkbox" id="consent"${me.profile ? " checked" : ""}><span>I agree that Fumbl uses who I am and who I want to meet to choose whom to show me and whom to show me to, and for nothing else.</span></label>
    <p class="error" id="profile-error" role="alert"></p>
    <button class="btn primary" type="submit">Save</button>
  </form>`, me.profile ? "you" : undefined);
  on("profile", "submit", async (e) => {
    e.preventDefault();
    const v = (id) => document.getElementById(id).value;
    const r = await api("PUT", "/fumbl/me/profile", {
      firstName: v("firstName"), pronouns: v("pronouns"), gender: v("gender"), meet: v("meet"), looking: v("looking"),
      prompts: [0, 1, 2].map((i) => ({ q: v(`q${i}`), a: v(`a${i}`) })).filter((x) => x.q.trim() && x.a.trim()),
      consentToMatching: document.getElementById("consent").checked,
    });
    if (r.error === "consent_required") return (document.getElementById("profile-error").textContent = "Tick the box to agree, or Fumbl cannot match you.");
    if (r.error) return (document.getElementById("profile-error").textContent = "Fill in your first name.");
    me.profile = r.profile;
    discover();
  });
}

// ── discover ──────────────────────────────────────────────────────────────────────────────────────────────────
function card(p) {
  return `<article class="profile" aria-labelledby="p-name">
    <div class="pic"><span class="pill">Verified adult</span>${avatar(p, 160)}</div>
    <div class="body">
      <h2 id="p-name">${esc(p.firstName)}</h2>
      <p class="meta">${p.pronouns ? `${esc(p.pronouns)} · ` : ""}${esc(LOOKING[p.looking] ?? "")}</p>
      ${p.prompts.map((x) => `<div class="prompt"><b>${esc(x.q)}</b>${esc(x.a)}</div>`).join("")}
      <div class="decide">
        <button class="btn" id="pass" aria-label="Pass on ${esc(p.firstName)}">Pass</button>
        <button class="btn primary" id="like" aria-label="Like ${esc(p.firstName)}">Like</button>
      </div>
      <div class="safety-row"><button class="linkish" id="report">Report</button><button class="linkish" id="block">Block</button></div>
      <p class="no-checks small">${NO_CHECKS}</p>
    </div>
  </article>`;
}

async function discover(note = "") {
  if (me?.member?.paused)
    return show(`<h1>Your profile is paused</h1><div class="panel"><p>No one sees you, and you see no one, until you resume.</p><button class="btn primary" id="resume">Resume</button></div>`, "discover"), on("resume", "click", () => setPaused(false).then(() => discover()));
  const r = await api("GET", "/fumbl/discover");
  if (r.error) return route();
  const p = r.profile;
  if (!p)
    return show(`${note}<h1>You have seen everyone for now</h1><div class="panel"><p>New people appear as they join. There is nothing to buy to see more.</p><button class="btn" id="go-matches">See your matches</button></div>`, "discover"), on("go-matches", "click", matches);
  show(`${note}${card(p)}`, "discover");
  const decide = (like) => async () => {
    const d = await api("POST", "/fumbl/likes", { to: p.id, like });
    if (d.matched) matched(p);
    else discover();
  };
  on("pass", "click", decide(false));
  on("like", "click", decide(true));
  on("report", "click", () => report(p, false, () => discover()));
  on("block", "click", () => block(p, () => discover(toast(`Blocked. You will not see ${esc(p.firstName)} again.`))));
}

function matched(p) {
  show(`<div class="panel" style="text-align:center">
    <div style="display:flex;justify-content:center">${avatar(p, 110)}</div>
    <h1>You and ${esc(p.firstName)} liked each other</h1>
    <p class="muted">You can talk now. Keep the chat on Fumbl until you trust each other.</p>
    <div class="btns" style="justify-content:center"><button class="btn primary" id="hello">Say hello</button><button class="btn" id="later">Keep looking</button></div>
  </div>`, "discover");
  on("hello", "click", () => chat(p));
  on("later", "click", () => discover());
}

// ── matches and chat ──────────────────────────────────────────────────────────────────────────────────────────
async function matches(note = "") {
  const r = await api("GET", "/fumbl/matches");
  if (r.error) return route();
  show(`${note}<h1>Your matches</h1>${
    r.matches.length
      ? `<ul class="list">${r.matches.map((p, i) => `<li><button data-i="${i}">${avatar(p, 52)}<span><strong>${esc(p.firstName)}</strong><small>${p.last ? esc(p.last.body).slice(0, 60) : "Say hello"}</small></span></button></li>`).join("")}</ul>`
      : `<div class="panel"><p>No matches yet. When you and someone both like each other, they appear here.</p></div>`
  }`, "matches");
  for (const b of view.querySelectorAll("[data-i]")) b.addEventListener("click", () => chat(r.matches[Number(b.dataset.i)]));
}

async function chat(p) {
  const r = await api("GET", `/fumbl/matches/${encodeURIComponent(p.id)}/messages`);
  if (r.error) return matches();
  const scam = r.messages.some((m) => !m.mine && SCAM.test(m.body));
  show(`<div class="chat-head">
      ${avatar(p, 44)}
      <div class="who"><strong>${esc(p.firstName)}</strong></div>
      <div class="chat-tools"><button class="linkish" id="report">Report</button><button class="linkish" id="block">Block</button><button class="linkish" id="unmatch">Unmatch</button></div>
    </div>
    <p class="consent">Only the two of you read this chat. Photos are not part of Fumbl yet.</p>
    <ul class="messages" aria-live="polite">${r.messages.map((m) => `<li class="${m.mine ? "mine" : ""}">${esc(m.body)}</li>`).join("")}</ul>
    ${scam ? `<p class="warn" role="alert"><strong>Be careful.</strong> This message asks for money or to move to another app. People who do this soon after a match are often running a scam. Never send money to someone you have not met. <button class="linkish" id="report-scam">Report it</button></p>` : ""}
    <form class="compose" id="compose"><label class="sr" for="msg">Message</label><input id="msg" maxlength="1000" autocomplete="off" placeholder="Write a message"><button class="btn primary" type="submit">Send</button></form>
    <p><button class="linkish" id="back">← Matches</button></p>`, "matches");
  on("report", "click", () => report(p, true, () => chat(p)));
  on("report-scam", "click", () => report(p, true, () => chat(p), "scam"));
  on("block", "click", () => block(p, () => matches(toast(`Blocked. You will not see ${esc(p.firstName)} again.`))));
  on("unmatch", "click", async () => {
    if (!(await confirmDialog(`Unmatch ${p.firstName}?`, "The chat closes for both of you.", "Unmatch"))) return;
    await api("DELETE", `/fumbl/matches/${encodeURIComponent(p.id)}`);
    matches();
  });
  on("back", "click", () => matches());
  on("compose", "submit", async (e) => {
    e.preventDefault();
    const text = document.getElementById("msg").value.trim();
    if (!text) return;
    const s = await api("POST", `/fumbl/matches/${encodeURIComponent(p.id)}/messages`, { body: text });
    if (s.error) return matches();
    await chat(p);
    document.getElementById("msg")?.focus();
  });
  const seen = r.messages.length;
  poll = setInterval(async () => {
    const n = await api("GET", `/fumbl/matches/${encodeURIComponent(p.id)}/messages`).catch(() => null);
    if (!n || n.error) return clearInterval(poll), matches();
    if (n.messages.length !== seen && !document.getElementById("msg")?.value) chat(p);
  }, 5000);
}

// ── safety: report, block ─────────────────────────────────────────────────────────────────────────────────────
const URGENT = new Set(["minor", "threat", "intimate-image", "sexual-exploitation"]);

function report(p, fromChat, then, reason = "") {
  const dialog = document.getElementById("report-dialog");
  const form = document.getElementById("report-form");
  form.reset();
  document.getElementById("include-row").classList.toggle("hidden", !fromChat);
  if (reason) form.querySelector(`input[value="${reason}"]`).checked = true;
  document.getElementById("report-name").textContent = p.firstName;
  dialog.onclose = async () => {
    if (dialog.returnValue !== "send") return;
    const data = new FormData(form);
    if (!data.get("reason")) return;
    const blockToo = data.get("block") === "on";
    const r = await api("POST", "/fumbl/reports", { subject: p.id, reason: data.get("reason"), note: String(data.get("note") || ""), includeMessages: fromChat && data.get("include") === "on", block: blockToo });
    if (r.error) return then();
    const note = toast(`<strong>Report received.</strong> ${URGENT.has(r.report.reason) ? "A report like this goes first: the account is on hold until a person on our safety team decides. " : ""}Every report gets a decision with the rule it rests on and a plain reason, and we tell you the outcome under You.${blockToo ? ` You also blocked ${esc(p.firstName)}.` : ""}`);
    if (blockToo) fromChat ? matches(note) : discover(note);
    else fromChat ? then() : discover(note);
  };
  dialog.returnValue = "";
  dialog.showModal();
}

async function block(p, then) {
  if (!(await confirmDialog(`Block ${p.firstName}?`, `You will not see each other again, and any chat closes. ${p.firstName} is not told.`, "Block"))) return;
  await api("POST", "/fumbl/blocks", { user: p.id });
  then();
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
async function setPaused(paused) {
  await api("PUT", "/fumbl/me/paused", { paused });
  me.member.paused = paused;
}

function wireDataButtons() {
  on("export", "click", async () => {
    const r = await api("GET", "/fumbl/me/export");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(r, null, 2)], { type: "application/json" }));
    a.download = "fumbl-export.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  on("delete", "click", async () => {
    if (!(await confirmDialog("Delete your Fumbl data?", "This removes your profile, likes, matches and every chat you are in, at once. It cannot be undone.", "Delete"))) return;
    await api("DELETE", "/fumbl/me");
    show(`<h1>Deleted</h1><div class="panel"><p>Your Fumbl profile, likes, matches and chats are gone. Your CommandAGI account stays; you can delete it in your CommandAGI account settings.</p><button class="btn" id="out">Sign out</button></div>`);
    on("out", "click", signOut);
  });
}

function signOut() {
  session.drop("fumbl-token");
  signedOut();
}

async function you() {
  const p = me.profile ?? {};
  const mine = await api("GET", "/fumbl/me/reports");
  show(`<h1>You</h1>
  <div class="panel">
    <p><strong>${esc(p.firstName)}</strong>${p.pronouns ? ` (${esc(p.pronouns)})` : ""}<br><span class="muted">Looking for: ${esc(LOOKING[p.looking] ?? "")}</span></p>
    <div class="btns"><button class="btn quiet" id="edit">Edit profile</button></div>
    <label class="check"><input type="checkbox" id="pause" ${me.member.paused ? "checked" : ""}><span>Pause my profile: no one sees me, and I see no one</span></label>
  </div>
  <h2>Your reports</h2>
  ${mine.reports?.length ? `<ul class="list">${mine.reports.map((r) => `<li class="panel">${esc(r.reason)}: ${r.status === "decided" ? `decided (${esc(r.action)}, rule ${esc(r.rule)}). ${esc(r.reason_given)}` : "waiting for a decision"}</li>`).join("")}</ul>` : `<p class="muted">You have not reported anyone.</p>`}
  <h2>Your data</h2>
  <p class="muted">Download everything Fumbl holds about you, or delete it at once.</p>
  <div class="btns"><button class="btn" id="export">Download my data</button><button class="btn" id="delete">Delete my Fumbl data</button><button class="btn" id="sign-out">Sign out</button></div>
  <p class="muted"><a href="../terms.html">Terms</a> · <a href="../privacy.html">Privacy</a> · <a href="../safety.html">Safety tips</a></p>`, "you");
  on("edit", "click", editProfile);
  on("pause", "change", (e) => setPaused(e.target.checked));
  on("sign-out", "click", signOut);
  wireDataButtons();
}

// ── review (the safety team) ──────────────────────────────────────────────────────────────────────────────────
async function review() {
  const q = await api("GET", "/fumbl/reports");
  if (q.error) return discover();
  const rules = ["1 adults only", "2 consent", "3 report and block", "4 no real people's data", "5 private messages", "6 no dark patterns", "7 agents do not date", "8 scams"];
  show(`<h1>Reports to decide</h1>${
    q.reports.length
      ? q.reports.map((r, i) => `<form class="panel review" data-i="${i}">
      <p>${r.urgent ? `<span class="pill urgent">Urgent</span> ` : ""}<strong>${esc(r.reason)}</strong> about ${esc(r.subjectProfile?.firstName ?? r.subjectUser)} <small class="muted">${new Date(r.createdAt).toLocaleString()}</small></p>
      ${r.note ? `<p>Note: ${esc(r.note)}</p>` : ""}
      ${r.excerpt ? `<ul class="messages">${r.excerpt.map((m) => `<li class="${m.from === "reporter" ? "mine" : ""}"><small>${m.from}</small>${esc(m.body)}</li>`).join("")}</ul>` : ""}
      ${r.triage ? `<p class="muted">Triage (${esc(r.triagedBy)}): ${esc(r.triage)}</p>` : ""}
      <label class="field">Action<select name="action" required><option value="">Choose</option><option value="remove">Remove from Fumbl</option><option value="warn">Warn</option><option value="no-action">No action</option><option value="restore">Restore</option></select></label>
      <label class="field">Rule<select name="rule" required><option value="">Choose</option>${rules.map((x) => `<option value="${x[0]}">${x}</option>`).join("")}</select></label>
      <label class="field">Reason, in plain words (the reporter reads it)<textarea name="reason" rows="2" required maxlength="1000"></textarea></label>
      <label class="field">Send it on<select name="authority"><option value="">No</option><option value="ncmec">NCMEC CyberTipline (child sexual exploitation)</option><option value="law-enforcement">Police (a threat to life)</option></select></label>
      <button class="btn primary" type="submit">Decide</button>
    </form>`).join("")
      : `<div class="panel"><p>No open reports.</p></div>`
  }`, "review");
  for (const f of view.querySelectorAll("form.review"))
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = new FormData(f);
      const r = q.reports[Number(f.dataset.i)];
      await api("POST", `/fumbl/reports/${r.id}/decision`, { action: d.get("action"), rule: d.get("rule"), reason: d.get("reason"), authority: d.get("authority") || null });
      review();
    });
}

for (const b of tabs.querySelectorAll("button")) b.addEventListener("click", () => ({ discover: () => discover(), matches: () => matches(), you, review })[b.dataset.tab]());

addEventListener("hashchange", () => route());
finishSignIn().then(route, () => signedOut());
