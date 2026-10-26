// The language button and the language hint (docs/sites.md § the language button, in CommandAGI).
// Without this file the page still switches language: the button opens the dialog by `commandfor` and its form closes it.
(() => {
    const button = document.getElementById('lang-btn');
    const dialog = document.getElementById('lang-dialog');
    const hint = document.getElementById('lang-hint');
    const here = document.documentElement.lang;
    const STORE = 'fumbl.lang';

    if (button && dialog && !('commandForElement' in HTMLButtonElement.prototype) && dialog.showModal)
        button.addEventListener('click', () => dialog.showModal());
    // Escape closes a modal dialog natively; the close button needs its command, which old browsers lack.
    const close = document.getElementById('lang-close');
    if (close && dialog && !('commandForElement' in HTMLButtonElement.prototype))
        close.addEventListener('click', () => dialog.close());

    const remember = locale => {
        try { localStorage.setItem(STORE, locale); } catch { /* private mode: the choice lasts this visit */ }
    };
    for (const a of dialog ? dialog.querySelectorAll('a[lang]') : [])
        a.addEventListener('click', () => remember(a.getAttribute('lang')));

    // The hint: a visitor whose browser reads this page's other language is offered it, once.
    // `zh` without the Hans script or a simplified-Chinese region never picks zh-Hans (docs/sites.md § locales).
    if (!hint)
        return;
    let chosen = null;
    try { chosen = localStorage.getItem(STORE); } catch { /* no storage: the hint may show */ }
    if (chosen)
        return;
    const alternates = [...document.querySelectorAll('link[rel="alternate"][hreflang]')]
        .filter(l => l.hreflang !== 'x-default' && l.hreflang !== here);
    const prefers = navigator.languages || [navigator.language || ''];
    const match = preferred => alternates.find(l => {
        const tag = l.hreflang.toLowerCase();
        if (tag === 'zh-hans')
            return /^(zh(-hans|-cn|-sg|-my)?)(-|$)/i.test(preferred) && !/^zh-(hant|tw|hk|mo)/i.test(preferred);
        return preferred.toLowerCase() === tag || (tag.length === 2 && preferred.toLowerCase().startsWith(tag + '-'));
    });
    const found = prefers.map(match).find(Boolean);
    if (!found)
        return;
    const named = dialog ? dialog.querySelector(`a[lang="${found.hreflang}"]`) : null;
    const link = document.createElement('a');
    link.href = found.getAttribute('href');
    link.hreflang = found.hreflang;
    link.textContent = named ? named.textContent : found.hreflang;
    hint.textContent = (hint.dataset.prefix || 'Read this page in') + ' ';
    hint.appendChild(link);
    hint.hidden = false;
})();
