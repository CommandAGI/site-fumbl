// The home page: the evening's clock, the phone that follows the steps, the two-sided yes, the plan you send
// yourself, and the clips that play only on screen. Everything here works offline and sends nothing.
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const still = matchMedia('(prefers-reduced-motion: reduce)');

// The clock in the status bar reads the time of the section in view; after 7 pm the bar turns to night.
const clock = $('#clock');
const timed = $$('[data-time]');
const hourOf = t => { const [h, rest] = t.split(':'); return (Number(h) % 12) + (/pm/.test(rest) ? 12 : 0); };
const seen = new IntersectionObserver(entries => {
    for (const e of entries) {
        if (!e.isIntersecting) continue;
        const t = e.target.dataset.time;
        if (clock) clock.textContent = t;
        document.documentElement.dataset.hour = hourOf(t) >= 19 ? 'night' : 'day';
    }
}, { rootMargin: '-45% 0px -50% 0px' });
timed.forEach(el => seen.observe(el));

// The phone shows the screen of the step in view. Under 900 px each step carries its own copy of the screen.
const phone = $('.phone');
if (phone) {
    const screens = Object.fromEntries($$('.screen', phone).map(s => [s.dataset.screen, s]));
    phone.classList.add('ready');
    for (const step of $$('.steps > li')) {
        const copy = screens[step.dataset.step]?.cloneNode(true);
        if (!copy) continue;
        copy.classList.add('step-screen');
        copy.setAttribute('aria-hidden', 'true');
        step.prepend(copy);
    }
    const show = name => Object.entries(screens).forEach(([k, s]) => s.classList.toggle('on', k === name));
    show('verified');
    const steps = new IntersectionObserver(entries => {
        for (const e of entries) if (e.isIntersecting) show(e.target.dataset.step);
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('.steps > li').forEach(li => steps.observe(li));
}

// The signature: one yes changes nothing anyone else can see; two close the moon.
const consent = $('.consent');
if (consent) {
    const state = $('.consent-state', consent);
    const moon = $('.moon', consent);
    const yes = { you: false, them: false };
    for (const button of $$('.side', consent)) {
        button.addEventListener('click', () => {
            const side = button.dataset.side;
            yes[side] = !yes[side];
            button.setAttribute('aria-pressed', String(yes[side]));
            $(`.half.${side}`, moon).classList.toggle('yes', yes[side]);
            const both = yes.you && yes.them;
            moon.classList.toggle('both', both);
            state.textContent = both ? state.dataset.both : yes.you || yes.them ? state.dataset.one : state.dataset.none;
        });
    }
}

// The plan: written here, sent by the visitor's own phone (the share sheet) or the clipboard. Fumbl sends nothing.
const plan = $('#plan');
if (plan) {
    const out = plan.elements.text;
    const said = $('#plan-said');
    const lang = document.documentElement.lang;
    const words = {
        en: (who, where, by) => `Meeting ${who || 'someone'} at ${where || 'a public place'}. Text me at 9:40? If you don’t hear “I’m home” by ${by}, call me.`,
        es: (who, where, by) => `Quedé con ${who || 'alguien'} en ${where || 'un lugar público'}. ¿Me escribes a las 21:40? Si a las ${by} no te digo «ya estoy en casa», llámame.`,
        'zh-Hans': (who, where, by) => `我和${who || '一个人'}在${where || '公共场所'}见面。21:40 给我发个消息好吗？如果 ${by} 前没收到“我到家了”，就给我打电话。`,
    }[lang] ?? null;
    const time = value => {
        if (!value) return '11:30';
        if (lang !== 'en') return value;
        const [h, m] = value.split(':').map(Number);
        return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
    };
    const text = () => words(plan.elements.who.value.trim(), plan.elements.where.value.trim(), time(plan.elements.by.value));
    const render = () => { out.value = text(); };
    plan.addEventListener('input', render);
    plan.addEventListener('submit', e => e.preventDefault());
    render();
    const say = msg => { said.textContent = msg; };
    $('#plan-share').addEventListener('click', async () => {
        if (!navigator.share) return say(said.dataset.noshare || 'This browser cannot share. Copy it instead.');
        try { await navigator.share({ text: text() }); say(said.dataset.shared || 'Shared from your phone. Fumbl sent nothing.'); }
        catch { say(''); }
    });
    $('#plan-copy').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(text()); say(said.dataset.copied || 'Copied. Paste it to a friend.'); }
        catch { say(said.dataset.nocopy || 'Copy did not work here. Select the text and copy it.'); }
    });
}

// Clips load when they are about to be seen and play only while on screen. Reduced motion keeps the posters.
const clips = $$('video.loop[data-src]');
if (!still.matches && clips.length) {
    const canAv1 = document.createElement('video').canPlayType('video/webm; codecs="av01.0.05M.08"') === 'probably';
    const play = new IntersectionObserver(entries => {
        for (const { target: v, isIntersecting } of entries) {
            if (isIntersecting) {
                if (!v.src) {
                    v.src = `${v.dataset.src}.${canAv1 ? 'webm' : 'mp4'}`;
                    v.addEventListener('playing', () => v.classList.add('playing'), { once: true });
                }
                v.play().catch(() => {});
            } else v.pause();
        }
    }, { rootMargin: '200px 0px' });
    // The hero's clip waits for the visitor's first scroll, tap or key: its first frame would otherwise replace the
    // still as the largest paint, late, on a slow link.
    const [hero, ...rest] = clips;
    rest.forEach(v => play.observe(v));
    const wake = () => { play.observe(hero); for (const e of ['scroll', 'pointerdown', 'keydown']) removeEventListener(e, wake); };
    for (const e of ['scroll', 'pointerdown', 'keydown']) addEventListener(e, wake, { once: true, passive: true });
}
