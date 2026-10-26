# Fumbl redesign: notes

## generated media (fal)

Made by `redesign/fal.mjs` on the build machine (`COMMANDAGI_ENV_ROOT=<checkout> node redesign/fal.mjs stills|videos`),
the key read from the env cascade (`SVC__FAL__MAIN__API_KEY`) and never printed or shipped. The full-size sources stay
on the build machine (`.gitignore`); the log of every call is `redesign/media/log.jsonl`. Prices from fal's pricing API
on 2026-10-26: $0.06 per image (flux-pro 1.1 ultra), $0.056 per second (Kling 2.1 standard, image to video).

| scene | model | shape | prompt | cost |
|---|---|---|---|---|
| window | `fal-ai/flux-pro/v1.1-ultra` | 16:9 | View from a second-floor apartment window at blue hour onto a quiet city street, warm lit windows across the street, a single streetlamp, the window sill with a small plant in the foreground, shot on 35mm film, fine grain, soft halation, warm apricot practical light against deep mulberry-purple shadows, muted almond highlights, quiet still-life, no people, no hands, no faces, no text, no logos | $0.06 |
| home | `fal-ai/flux-pro/v1.1-ultra` | 16:9 | A hallway table at night, a set of house keys just dropped into a ceramic bowl, a small lamp switched on glowing apricot, a coat on a hook, deep mulberry night shadows, shot on 35mm film, fine grain, soft halation, warm apricot practical light against deep mulberry-purple shadows, muted almond highlights, quiet still-life, no people, no hands, no faces, no text, no logos | $0.06 |
| dusk | `fal-ai/flux-pro/v1.1-ultra` | 16:9 | A small corner café table at golden hour, two empty ceramic cups and a folded paper napkin, long apricot sunlight raking across the tabletop, window frame shadow, shot on 35mm film, fine grain, soft halation, warm apricot practical light against deep mulberry-purple shadows, muted almond highlights, quiet still-life, no people, no hands, no faces, no text, no logos | $0.06 |
| window | `fal-ai/kling-video/v2.1/standard/image-to-video` | 5 s from window.png | static camera, lights in windows across the street slowly turn on one by one, a faint breeze moves the plant leaves | $0.28 |
| home | `fal-ai/kling-video/v2.1/standard/image-to-video` | 5 s from home.png | static camera, the lamp light gently breathes, the keys settle in the bowl, very slow subtle motion | $0.28 |
| dusk | `fal-ai/kling-video/v2.1/standard/image-to-video` | 5 s from dusk.png | very slow drift of sunlight and window shadows across the table, steam-free, static camera, gentle | $0.28 |
| **total** | | | 3 stills, 3 clips, no retries | **$1.02** of $15 |

The still prompts end with one art direction: "shot on 35mm film, fine grain, soft halation, warm apricot practical
light against deep mulberry-purple shadows, muted almond highlights, quiet still-life, no people, no hands, no faces,
no text, no logos". The clips' negative prompt: "people, person, hands, face, text, blur, distort, camera shake".

Encoding (ffmpeg 7, libaom and libx264): each 5 s clip played forward then back (a 10 s loop with no cut), no audio;
the dusk clip cropped 4 : 5 for the arch at 720 × 900, the plates 1280 × 712. AV1 WebM 91–182 KB, H.264 MP4 166–380 KB.
Posters: AVIF and JPEG from the stills, with the same crop.

The share card (`og.png`, 1200 × 630) and the touch icon are rendered from `redesign/og.html` and `mark.svg` by
`redesign/render-og.py`. The wordmark (`wordmark.svg`) is Bricolage Grotesque's outlines at wght 800, wdth 75, opsz 96,
kerned by hand (f −40, u −18, m −22, b −6 units).

## looked at, and fixed

Playwright screenshots at 1440, 768, 390 and 320, at eight scroll positions, with and without reduced motion, light
and dark, English, Spanish and Chinese. What the screenshots showed, and what changed:

1. Body text was italic: the italic file had been saved as the upright one. Swapped.
2. The squeezed "fumble." collided: its tracking opened to −0.012 em.
3. The plates' words never reached full opacity at the foot of the page: the reveal range now ends on entry.
4. The window plate showed the almond page around its arch: the clip-path moved to a media layer over night.
5. The clock ran backwards (11:52 → 9:40): the steps end at 9:40, the plates go on to 10:15, 10:50, 11:52.
6. The setting sun covered the hero's words: smaller, lower, and the hero's foot made room for it.
7. The phone's copied screens were unreadable under 900 px (the steps' paragraph colour): scoped to the steps' own text.
8. The Chinese headline's lines touched: CJK headings get no negative tracking and 1.08 line height.
9. The demo's main panel wore the focus halo after its script focused it: removed there only.

## measured (Chromium, Lighthouse's mobile throttling: 1.6 Mbps, 150 ms RTT, CPU ×4, cache off)

| where | page | width | LCP | CLS | JS (transferred) |
|---|---|---|---|---|---|
| local | `/index.html` | 390 / 1440 | 1.39 / 1.46 s | 0.003 / 0.020 | 9.6 KB |
| local | `/zh/index.html` | 390 / 1440 | 1.12 / 1.80 s | 0 / 0 | 9.1 KB |
| live, 3 runs | `/index.html` | 390 | 1.09, 2.76, 1.10 s | 0–0.003 | 4.6 KB |
| live, 3 runs | `/index.html` | 1440 | 1.05, 1.60, 1.06 s | 0.020–0.031 | 4.6 KB |
| live | `/es/index.html` | 390 / 1440 | 1.15 / 0.95 s | 0.005 / 0.006 | 4.6 KB |

The LCP element is the hero's still (`media/dusk.avif`, 10.6 KB, preloaded). One live run of eight took 2.76 s, with
fewer bytes fetched than the others: a cold edge, not the page. Before the hero clip waited for the first scroll, its
first frame became the largest paint on a slow link (2.8 s); it now starts on the first scroll, tap or key. The site
host injects Cloudflare's analytics beacon, which the page's own policy (`script-src 'self'`) blocks: the one console
error, not the site's.

CLS was 0.086 before the display fallback was metric-matched (Arial at size-adjust 85%, measured against Bricolage's
headline width). No horizontal scroll at any width. Keyboard: the consent buttons (Enter, Space), the plan fields and
buttons, every link; `aria-pressed` on the yes buttons, `aria-live` on the consent state and the plan's message.
Contrast pairs in DESIGN.md (lowest 5.2 : 1).

## scores (my own, after the last pass)

| art direction | brand specificity | product expression | interaction | technical quality | craft | average |
|---|---|---|---|---|---|---|
| 8 | 9 | 8 | 8 | 8 | 7 | 8.0 |

Craft stays at 7: the phone's screens leave empty space under short content, and the hero's arch is a still until the
first scroll.

## distinct from the set (checked live, 2026-10-26)

None of the other company sites had shipped its 2027 design when Fumbl chose; the brief fixes their fonts. Fumbl's own:
light-to-night by scroll (no other site changes mode within the page), the speech-bubble radius (one tail corner), the
arched-window picture frame, the status-bar header with a clock, and the two-sided consent moon. VibeMatch, the other
dating site, is dark only with generated auras and no photos of places; Fumbl is almond by day with filmed still lifes.
