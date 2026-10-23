// An illustrated avatar for a sample profile: flat shapes drawn as SVG, never a photograph and never a real person.
const HAIR = {
  bob: (c) => `<path d="M58 92c-6-34 14-58 42-58s48 24 42 58c-6-6-10-20-10-30-18 8-46 8-64 0 0 10-4 24-10 30z" fill="${c}"/>`,
  short: (c) => `<path d="M62 78c0-26 16-42 38-42s38 16 38 42c-10-12-26-18-38-18s-28 6-38 18z" fill="${c}"/>`,
  curls: (c) => `<g fill="${c}">${[[66, 62], [80, 46], [100, 40], [120, 46], [134, 62], [140, 80], [60, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16"/>`).join("")}</g>`,
  buzz: (c) => `<path d="M66 76c2-22 16-36 34-36s32 14 34 36c-10-8-22-12-34-12s-24 4-34 12z" fill="${c}" opacity="0.85"/>`,
  long: (c) => `<path d="M56 140c-8-60 6-104 44-104s52 44 44 104c-8-4-12-30-12-50-14 6-50 6-64 0 0 20-4 46-12 50z" fill="${c}"/>`,
  bun: (c) => `<g fill="${c}"><circle cx="100" cy="30" r="16"/><path d="M62 80c0-26 16-42 38-42s38 16 38 42c-10-12-26-18-38-18s-28 6-38 18z"/></g>`,
};

export function avatarSvg(profile, size = 200) {
  const { bg, skin, hair, style, top } = profile.look;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="${profile.name}: an illustrated sample avatar">
  <rect width="200" height="200" rx="28" fill="${bg}"/>
  <path d="M40 200c0-44 26-66 60-66s60 22 60 66z" fill="${top}"/>
  <rect x="88" y="112" width="24" height="26" rx="10" fill="${skin}"/>
  ${style === "long" ? HAIR.long(hair) : ""}
  <circle cx="100" cy="86" r="38" fill="${skin}"/>
  ${style === "long" ? "" : HAIR[style](hair)}
  <circle cx="86" cy="90" r="4" fill="#2a1530"/>
  <circle cx="114" cy="90" r="4" fill="#2a1530"/>
  <path d="M88 104q12 9 24 0" stroke="#2a1530" stroke-width="3.5" fill="none" stroke-linecap="round"/>
</svg>`;
}
