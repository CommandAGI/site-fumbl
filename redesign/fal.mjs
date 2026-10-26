// The site's generated media, made once on a build machine: fal is called here, never from a page.
//   COMMANDAGI_ENV_ROOT=<checkout> node redesign/fal.mjs <job> [...]
// The key is read from the env cascade (SVC__FAL__MAIN__API_KEY) and never printed. Every request and its cost
// estimate goes to redesign/media/log.jsonl; NOTES.md is written from that log.
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'media');

function key() {
    if (process.env.SVC__FAL__MAIN__API_KEY) return process.env.SVC__FAL__MAIN__API_KEY;
    const root = process.env.COMMANDAGI_ENV_ROOT;
    for (const f of ['.env', '.env.api', '.env.local']) {
        const file = root && path.join(root, f);
        if (!file || !existsSync(file)) continue;
        const m = /^(?:export\s+)?SVC__FAL__MAIN__API_KEY=["']?([^"'\n]+)/m.exec(readFileSync(file, 'utf8'));
        if (m) return m[1].trim();
    }
    throw new Error('no SVC__FAL__MAIN__API_KEY in the env cascade');
}
const auth = { Authorization: `Key ${key()}` };

async function run(model, input) {
    const r = await fetch(`https://queue.fal.run/${model}`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify(input) });
    if (!r.ok) throw new Error(`${model}: ${r.status} ${await r.text()}`);
    const job = await r.json();
    for (;;) {
        await new Promise(res => setTimeout(res, 4000));
        const s = await (await fetch(job.status_url, { headers: auth })).json();
        if (s.status === 'COMPLETED') break;
        if (s.status && !['IN_QUEUE', 'IN_PROGRESS'].includes(s.status)) throw new Error(`${model}: ${JSON.stringify(s)}`);
    }
    return (await fetch(job.response_url, { headers: auth })).json();
}

async function save(url, name) {
    const r = await fetch(url);
    writeFileSync(path.join(out, name), Buffer.from(await r.arrayBuffer()));
    return name;
}

// Art direction, every prompt: objects and places only, never a person; 35 mm film, fine grain, warm apricot
// practical light against mulberry shadow; still, quiet, a little funny.
const LOOK = 'shot on 35mm film, fine grain, soft halation, warm apricot practical light against deep mulberry-purple shadows, muted almond highlights, quiet still-life, no people, no hands, no faces, no text, no logos';
const STILLS = {
    dusk: { aspect_ratio: '16:9', prompt: `A small corner café table at golden hour, two empty ceramic cups and a folded paper napkin, long apricot sunlight raking across the tabletop, window frame shadow, ${LOOK}` },
    window: { aspect_ratio: '16:9', prompt: `View from a second-floor apartment window at blue hour onto a quiet city street, warm lit windows across the street, a single streetlamp, the window sill with a small plant in the foreground, ${LOOK}` },
    home: { aspect_ratio: '16:9', prompt: `A hallway table at night, a set of house keys just dropped into a ceramic bowl, a small lamp switched on glowing apricot, a coat on a hook, deep mulberry night shadows, ${LOOK}` },
};
const MOTION = {
    dusk: 'very slow drift of sunlight and window shadows across the table, steam-free, static camera, gentle',
    window: 'static camera, lights in windows across the street slowly turn on one by one, a faint breeze moves the plant leaves',
    home: 'static camera, the lamp light gently breathes, the keys settle in the bowl, very slow subtle motion',
};

const log = entry => appendFileSync(path.join(out, 'log.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n');

const IMAGE = 'fal-ai/flux-pro/v1.1-ultra';
const VIDEO = 'fal-ai/kling-video/v2.1/standard/image-to-video';

const [job, ...names] = process.argv.slice(2);
if (job === 'stills') {
    await Promise.all((names.length ? names : Object.keys(STILLS)).map(async name => {
        const input = { ...STILLS[name], raw: true, output_format: 'png', safety_tolerance: '2' };
        const res = await run(IMAGE, input);
        await save(res.images[0].url, `${name}.png`);
        log({ model: IMAGE, name, prompt: input.prompt, aspect_ratio: input.aspect_ratio, seed: res.seed, usd: 0.06 });
        console.log(`${name}.png`);
    }));
} else if (job === 'videos') {
    await Promise.all((names.length ? names : Object.keys(MOTION)).map(async name => {
        // The still goes up as a data URI: nothing of the site is published before it ships.
        const image_url = `data:image/png;base64,${readFileSync(path.join(out, `${name}.png`)).toString('base64')}`;
        const input = { prompt: MOTION[name], duration: '5', negative_prompt: 'people, person, hands, face, text, blur, distort, camera shake' };
        const res = await run(VIDEO, { ...input, image_url });
        await save(res.video.url, `${name}.mp4`);
        log({ model: VIDEO, name, prompt: input.prompt, from: `${name}.png`, duration_s: 5, usd: 0.28 });
        console.log(`${name}.mp4`);
    }));
} else {
    console.error('usage: node redesign/fal.mjs stills|videos [name ...]');
    process.exit(2);
}
