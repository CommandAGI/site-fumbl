#!/usr/bin/env node
/**
 * The static locale mechanism of fumbl.commandagi.app, as on our public sites (docs/sites.md § locales, in CommandAGI):
 * English at `/`, every other locale under its prefix (`es/`, `zh/`). A page that a locale lists in `translated` is
 * written by hand. A page it does not translate yet is generated from the English page: the English content, its links
 * lifted to the site root, a note saying it is English, and a canonical to the English page (so no search engine sees a
 * second copy). The generated files are committed: the site stays a plain static folder that site hosting serves as is.
 *
 *   node make-locales.mjs           write the pages a locale does not translate yet
 *   node make-locales.mjs --check   compare instead: exit 1 when a generated page is not what the English page makes
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const manifest = () => JSON.parse(readFileSync(path.join(here, 'locales.json'), 'utf8'));

/** The A/文 dialog: one row per locale, each in its own name, the current one checked. `hrefFor` gives the page. */
export function languageDialog(current, all, hrefFor) {
    const rows = all.locales.map(l => `<li><a href="${hrefFor(l)}" lang="${l.tag}"${l.tag === current.tag ? ' aria-current="true"' : ''}>${l.name}</a></li>`);
    return `<dialog id="lang-dialog" class="lang-dialog" aria-labelledby="lang-title">
  <h2 id="lang-title">${current.dialog}</h2>
  <ul class="lang-list">
    ${rows.join('\n    ')}
  </ul>
  <button type="button" class="btn" id="lang-close" commandfor="lang-dialog" command="close">${current.close}</button>
</dialog>`;
}

/** One page a locale does not translate yet: the English page, under the locale's prefix. */
export function renderFallback(english, page, locale, all) {
    const up = value => (/^([a-z]+:|\/|#|\.\.?\/)/i.test(value) || !value ? value : `../${value}`);
    let html = english.replace(/(\s(?:href|src)=")([^"]*)(")/g, (_, a, v, b) => a + up(v) + b);
    // The site's own pages lead to this locale's edition of them; the demo, the team pages and the assets stay at the root.
    for (const p of all.pages) html = html.split(`href="../${p}"`).join(`href="../${locale.prefix}${p}"`);
    // The English page's other languages are not this page's: it is English, canonical to English (the translating gate).
    html = html.replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>\s*\n?/g, '');
    html = html.replace(/<p class="lang-hint"[^>]*><\/p>\s*\n?/g, '');
    html = html.replace(/(id="lang-btn"[^>]*aria-label=")[^"]*(")/, `$1${locale.language}$2`);
    html = html.replace(
        /<dialog id="lang-dialog"[\s\S]*?<\/dialog>/,
        languageDialog(locale, all, other => `../${other.prefix}${page}`),
    );
    // The chrome is this locale's; the content is English, as the note says and `<main lang>` holds.
    html = html.replace('<html lang="en">', `<html lang="${locale.tag}">`);
    return html.replace(
        /<main([^>]*)>/,
        `<main$1 lang="en">\n  <p class="locale-note">${locale.notice} <a href="index.html">${locale.home}</a></p>`,
    );
}

/** Every page a locale does not translate: `[{ path, html }]`, and only those. */
export function generatedPages(all = manifest(), read = p => readFileSync(path.join(here, p), 'utf8')) {
    const out = [];
    for (const locale of all.locales) {
        const translated = new Set(all.translated?.[locale.tag] ?? []);
        for (const page of all.pages) {
            if (!locale.prefix || translated.has(page)) continue;
            out.push({ path: `${locale.prefix}${page}`, html: renderFallback(read(page), page, locale, all) });
        }
    }
    return out;
}

function main() {
    const check = process.argv.includes('--check');
    let drift = 0;
    for (const { path: file, html } of generatedPages()) {
        const full = path.join(here, file);
        let before = null;
        try { before = readFileSync(full, 'utf8'); } catch { /* a page a locale has not had yet */ }
        if (before === html) continue;
        if (check) {
            drift++;
            console.error(`${file}: not what the English page makes (run node make-locales.mjs)`);
        } else
            writeFileSync(full, html);
    }
    if (drift) process.exitCode = 1;
    else if (!check) console.log(`wrote ${generatedPages().length} pages`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
