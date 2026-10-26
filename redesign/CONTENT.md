# Fumbl: the audit (2026-10-26, before the 2027 redesign)

## routes

| route | what it is | kept |
|---|---|---|
| `/index.html`, `/es/index.html`, `/zh/index.html` | the home page; English, and Spanish and Simplified Chinese written by hand | redesigned, all three |
| `/safety.html` (+ `es/`, `zh/`) | safety notice (bold capitals: Texas Bus. & Com. Code 106.004, N.J.S.A. 56:8-171), tips, help lines, rules | words unchanged, new type and colour |
| `/about.html`, `/terms.html`, `/privacy.html` (+ generated `es/`, `zh/`) | about, terms of use, privacy notice | words unchanged; `make-locales.mjs --check` still passes |
| `/team.html`, `/team-*.html` | the AI-agent team, made by CommandAGI's `scripts/seed/people/personas.mjs` | markup unchanged (the script owns it), restyled after its CSS block |
| `/app/` | the demo: age gate, fictional sample profiles, like and pass, chat, report, block, scam warning, all in session storage | working, restyled by tokens |
| `/app/live.html` | the live app: CommandAGI OAuth (PKCE, client `fumbl`), `/fumbl/*` api routes, appeals, holds, the message limit | working, restyled by tokens |
| A/文 | the language dialog on every page, without script (invoker commands) | kept, restyled |

## real workflows

- Join: `app/live.html` → sign in with CommandAGI → date of birth → ID and selfie age check (Stripe) → profile.
- Meet: one person at a time; like and pass; a chat opens only after both like.
- Safety: report (reasons) and block from every profile and chat; a scam warning when a new match asks for money or
  to move apps; a removed member appeals once, and a person decides.

## what is a demo, and what the redesign shows

- The demo's profiles are fictional samples, drawn, never photos. The home page's phone shows "Sam, 31", labeled
  "Sample profile", and a "Sample chat".
- The consent moon on the home page is illustrative: the visitor plays both people; it says so.
- The plan helper is a safety tip with a tool, not an app feature: it writes a message in the browser, and the
  visitor's phone (share sheet) or clipboard sends it. Fumbl sends nothing; the page's policy has `connect-src 'none'`.
  The date plan, check-in and "I'm home" of the brief's hero are therefore shown as what the visitor and a friend do,
  never as a feature Fumbl runs.
- Generated media: three stills and three clips (fal), each labeled "Generated still / footage, not a real …". No
  people in any of them.

## claims, checked

| claim | true? | where it stands |
|---|---|---|
| free, adults, United States | yes (charter, terms) | hero facts |
| ID and selfie age check, only the result kept | yes (privacy notice) | 6:40 pm step |
| no message before both like | yes (app) | 7:05 pm step, consent moon |
| report and block one tap, every report gets a decision and a reason | yes (app, rules) | 9:40 pm step |
| scam warning on a money request | yes (`app/live.js`, `app/app.js`) | 9:40 pm phone screen |
| like and pass the same size, no countdowns, no fake activity | yes (rule 6) | the window plate |
| no photos, never location or contacts | yes (rules, privacy notice) | the fine print |
| the team are AI agents | yes (team pages) | the fine print |
| background checks | Fumbl does none, said in bold capitals | the last plate, the safety page |

No testimonials, member counts, ratings, press or logos existed, and none were added.
