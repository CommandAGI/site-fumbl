# Fumbl, 2027: the design

*By Fumbl's designer: trust and safety for consumers; frank, warm, a little funny.*

## the idea

Intimacy without anxiety. Safety is not a settings page; it is the whole date. The page is **one evening**: it opens
at 6:40 pm in almond daylight and ends at 11:52 pm with "I'm home." The status bar's clock moves with the reader, and
the bar turns to night at 7 pm. Mutual consent is the interaction: two halves of a moon, one per person, close only
when both say yes.

## type

- **Bricolage Grotesque** (display; `wdth` 75–100, `opsz` 12–96, `wght` 200–800). The width axis is the joke: the word
  "fumble." is set at `wdth` 75, squeezed, and each word of the headline drops in a little crooked and rights itself.
  In the fine print the lines open from 75 to 100 as they arrive. Headings `text-wrap: balance`.
- **Figtree** (reading; `wght` 300–900, an italic). Body 17 px / 1.55, `text-wrap: pretty`; tabular numerals in the clock.
- Scale: a perfect fourth (1.333) between steps, clamped: hero 3.4 → 10.5 rem, plates 3 → 10 rem ("I'm home." to
  17 rem), steps 2 → 3.9 rem.
- Self-hosted Latin subsets (`fonts/`, OFL), with metric-matched fallbacks (`size-adjust`, ascent and descent
  overrides) so the swap moves nothing. Chinese falls back to the system's CJK face.

## colour (OKLCH, sRGB fallbacks first)

| token | OKLCH | hex | use |
|---|---|---|---|
| almond | 96.6% 0.019 62 | #fff2e7 | dusk paper |
| plum ink | 24.5% 0.055 342 | #2e1629 | text on almond |
| mulberry | 33.5% 0.07 342 | #4b2943 | headlines, "you" bubbles, primary |
| apricot | 78.5% 0.106 48 | #f2a27c | the sun, times, the "you" half |
| rose | 72.5% 0.09 4 | #dc8b9b | the moon, the "them" half |
| night | 17.5% 0.035 335 | #1d0f1b | the evening sections |
| verified | 49% 0.12 152 | #1b7546 | "Verified adult" and "ID age check" only |

Measured contrast (WCAG 2.2): plum ink on almond 15.1; mulberry on almond 11.3; almond on night 16.8; apricot on night
9.0; rose on night 7.2; white on verified 5.7; verified on almond 5.2; warning text 9.4. Dark mode
(`prefers-color-scheme`) runs the whole page at night, apricot taking mulberry's place.

## shape: the radius language

Every corner is a speech bubble with one tail: `--bubble-you` (tail bottom right) for what you say and commit to,
`--bubble-them` (tail bottom left) for answers. Buttons swap their tail on hover with a settling spring
(`linear()` easing). Pictures are arched windows. Nothing else is rounded; there are no cards.

## layout

- **1440 / 2560**: hero 7 : 5, the headline left, the café in an arch right; the night section's phone is sticky on
  the left and its screen follows the step in view on the right; content caps at 1240 px, plates go full bleed.
- **768**: one column; the arch above the headline; each step carries its own copy of the phone screen.
- **390**: the nav is a scrolling row under the status bar; the arch is 5 : 4 at 40 vh; the consent buttons share a
  row; the plan's time field takes its own row.
- **320**: the same as 390, with the hero headline at its 3.4 rem floor; nothing scrolls sideways (checked).

## motion (each explains a state change)

| motion | how | reduced motion |
|---|---|---|
| the headline fumbles and settles | CSS keyframes, once | still |
| the sun sets behind the night section's edge | `animation-timeline: view()` | a still half sun |
| the clock and the bar turning to night | IntersectionObserver | the same (not motion) |
| the phone's screen follows the steps | IntersectionObserver, crossfade and rise | instant swap |
| the consent moon closes on two yeses | transition, a spring, a glow | instant |
| each plate opens from an arched window to full bleed | `view()` clip-path | full bleed |
| the fine print stretches open | `view()` on `font-stretch` | set at 100 |
| clips | play only on screen | never loaded; the stills stay |

Nothing flashes. Without `animation-timeline` everything is at its end state.

## media (fal; prompts, model and cost in NOTES.md)

Objects and places, never people: 35 mm film grain, apricot practical light against mulberry shadow. Three scenes for
three times: a café table at golden hour (6:40, the hero, cropped 4 : 5 into the arch), a street at blue hour from a
window (10:15, "Like and pass are the same size"), keys in a bowl under a lamp (11:52, "I'm home."). Each clip is a
5 s image-to-video, played forward then back so it loops without a cut, AV1 (WebM) with an H.264 fallback, under
400 KB; the AVIF and JPEG stills are the posters. Each is labeled generated.

## the signature

The consent moon at 7:05 pm: "You: yes" and "Sam: yes", two bubble buttons with opposite tails. One yes fills one half
and says "Nothing is sent, and nobody is told." Two close the moon and open the chat. It is keyboard-operable,
`aria-pressed`, and its state is read out (`aria-live`).

## sections

1. 6:40 pm, the hero: "It's fine to fumble. It's not fine to feel unsafe."; Join, Try the demo; the facts.
2. One evening, five taps: verified adult; the vibe check takes two; tell a friend the plan (the helper); report and
   block, one tap.
3. 10:15 pm, plate: "Like and pass are the same size."
4. 10:50 pm, the fine print in big print: five promises, one line each.
5. 11:52 pm, plate: "I'm home."; Join, Try the demo; the background-check notice in bold capitals.

## don'ts

No photos of people, real or generated. No hearts, no flames, no gradients on text, no cards, no glass. Green never
decorates. No fake members, counts or quotes. No feature drawn that the app does not have: the date plan and "I'm
home" are what you and a friend do, and the page says Fumbl sends nothing.
