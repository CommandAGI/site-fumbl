// The site's own test: the static locale mechanism holds for every page it publishes.
//   node --test locale.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generatedPages, languageDialog, renderFallback } from './make-locales.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const all = JSON.parse(readFileSync(path.join(here, 'locales.json'), 'utf8'));
const read = file => readFileSync(path.join(here, file), 'utf8');
const shipped = all.locales.map(l => l.tag);
const byTag = tag => all.locales.find(l => l.tag === tag);
const hrefs = html => [...html.matchAll(/\s(?:href|src)="([^"]*)"/g)].map(m => m[1]);

test('the locales are English, Spanish and Simplified Chinese, each with its prefix and words', () => {
    assert.deepEqual(shipped, ['en', 'es', 'zh-Hans']);
    assert.equal(byTag('en').prefix, '', 'English is the site root');
    for (const l of all.locales) {
        assert.match(l.prefix, /^(|[a-z]{2}\/)$/);
        for (const key of ['name', 'dialog', 'close', 'language', 'notice', 'home']) assert.ok(l[key], `${l.tag} has no ${key}`);
    }
    assert.deepEqual(all.translated.en, undefined, 'English is not a translation of anything');
});

test('every page of the site exists in every locale', () => {
    for (const locale of all.locales)
        for (const page of all.pages) {
            const file = `${locale.prefix}${page}`;
            assert.ok(existsSync(path.join(here, file)), `${file} is missing`);
        }
});

test('a page a locale does not translate is the English page, generated and not hand-drifted', () => {
    for (const locale of all.locales) {
        const translated = new Set(all.translated?.[locale.tag] ?? []);
        for (const page of all.pages) {
            if (!locale.prefix || translated.has(page)) continue;
            const file = `${locale.prefix}${page}`;
            assert.equal(read(file), renderFallback(read(page), page, locale, all), `${file} is stale: run node make-locales.mjs`);
            const html = read(file);
            assert.match(html, new RegExp(`<html lang="${locale.tag}">`), `${file} is not in ${locale.tag}`);
            assert.match(html, /<main[^>]* lang="en">/, `${file} does not say its words are English`);
            assert.match(html, /class="locale-note"/, `${file} does not tell the reader it is English`);
            assert.ok(!/hreflang="es"/.test(html), `${file} claims a Spanish alternate for English words`);
        }
    }
    assert.equal(generatedPages(all, read).length, (all.locales.length - 1) * all.pages.length - Object.values(all.translated).flat().length);
});

test('a translated page names itself canonical and lists every language', () => {
    for (const [tag, pages] of Object.entries(all.translated))
        for (const page of pages) {
            const locale = byTag(tag);
            const html = read(`${locale.prefix}${page}`);
            assert.match(html, new RegExp(`<html lang="${locale.tag}">`));
            assert.match(html, new RegExp(`<link rel="canonical" href="${all.primary}/${locale.prefix}${page}">`));
            for (const l of all.locales)
                assert.ok(html.includes(`<link rel="alternate" hreflang="${l.tag}" href="${all.primary}/${l.prefix}${page}">`), `${locale.prefix}${page} has no ${l.tag} alternate`);
            assert.ok(html.includes(`<link rel="alternate" hreflang="x-default" href="${all.primary}/${page}">`), `${locale.prefix}${page} has no x-default`);
            assert.ok(!/<main[^>]* lang="en">/.test(html), `${locale.prefix}${page} is translated: it is not English`);
        }
});

test('every page has the A/文 button, a dialog with every language, and the current one checked', () => {
    const dialogOf = file => {
        const html = read(file);
        const block = /<dialog id="lang-dialog"[\s\S]*?<\/dialog>/.exec(html)?.[0];
        assert.ok(block, `${file} has no language dialog`);
        const rows = [...block.matchAll(/<a href="([^"]*)" lang="([^"]*)"([^>]*)>([^<]*)<\/a>/g)].map(m => ({
            target: path.posix.normalize(path.posix.join(path.posix.dirname(file), m[1])),
            tag: m[2],
            current: /aria-current="true"/.test(m[3]),
            name: m[4],
        }));
        return {
            title: /<h2 id="lang-title">([^<]*)<\/h2>/.exec(block)?.[1],
            close: /id="lang-close"[^>]*>([^<]*)<\/button>/.exec(block)?.[1],
            rows,
            button: /id="lang-btn"[^>]*aria-label="([^"]*)"/.exec(html)?.[1],
            loadsScript: /<script src="(?:\.\.\/)?locale\.js"><\/script>/.test(html),
        };
    };
    for (const locale of all.locales)
        for (const page of all.pages) {
            const file = `${locale.prefix}${page}`;
            const got = dialogOf(file);
            assert.equal(got.title, locale.dialog, `${file}'s dialog title is not in ${locale.tag}`);
            assert.equal(got.close, locale.close, `${file}'s close button is not in ${locale.tag}`);
            assert.equal(got.button, locale.language, `${file}'s button is not named in ${locale.tag}`);
            assert.ok(/A\/文/.test(read(file)), `${file} has no A/文 glyph`);
            assert.ok(got.loadsScript, `${file} does not load locale.js`);
            assert.deepEqual(got.rows.map(r => [r.tag, r.target]), all.locales.map(l => [l.tag, `${l.prefix}${page}`]), `${file}'s dialog does not offer every language of this page`);
            assert.deepEqual(got.rows.filter(r => r.current).map(r => r.tag), [locale.tag], `${file} does not check ${locale.tag}`);
            assert.deepEqual(got.rows.map(r => r.name), all.locales.map(l => l.name), `${file} names a language in another's words`);
        }
    assert.match(read('index.html'), /href="zh\/index.html"/, 'the English home does not lead to the Chinese one');
});

test('the language hint matches a browser language, never a Chinese script it does not ship', () => {
    const js = read('locale.js');
    assert.match(js, /zh-hans/, 'the hint does not name zh-Hans');
    assert.match(js, /zh-\(hant|hant/, 'the hint would send Traditional Chinese to the Simplified pages');
    assert.match(js, /fumbl\.lang/, 'the choice is not remembered');
});

test('a page requests nothing outside the site, and every link it offers exists', () => {
    for (const locale of all.locales)
        for (const page of all.pages) {
            const file = `${locale.prefix}${page}`;
            const html = read(file);
            for (const value of hrefs(html)) {
                if (/^(https?:|mailto:|#)/.test(value)) continue;
                const target = path.join(path.dirname(path.join(here, file)), value.split('#')[0].split('?')[0]);
                assert.ok(existsSync(target), `${file} links to ${value}, which is not here`);
            }
            for (const m of html.matchAll(/<(script|img) [^>]*src="([^"]*)"|<link rel="(?:stylesheet|icon)" href="([^"]*)"/g))
                assert.ok(!/^https?:/.test(m[2] ?? m[3]), `${file} loads ${m[2] ?? m[3]} from outside the site`);
        }
});

test('a country code or a generic TLD maps to a locale that ships', () => {
    for (const [code, tag] of Object.entries(all.domains.byCountryCode)) {
        assert.match(code, /^[a-z]{2}$/);
        assert.ok(shipped.includes(tag), `.${code} maps to ${tag}, which the site does not ship`);
    }
    for (const tld of all.domains.genericTlds) assert.ok(!(tld in all.domains.byCountryCode), `.${tld} is both a country code and a generic TLD`);
});
