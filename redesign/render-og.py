# Renders the share card (og.png, 1200×630) and the touch icon (touch-icon.png, 180×180) with Chromium.
#   python3 redesign/render-og.py   (from the site folder, with Playwright installed)
import pathlib
from playwright.sync_api import sync_playwright
here = pathlib.Path(__file__).resolve().parent
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1200, 'height': 630}, color_scheme='light')
    pg.goto((here / 'og.html').as_uri()); pg.wait_for_timeout(500)
    pg.screenshot(path=str(here.parent / 'og.png'))
    pg = b.new_page(viewport={'width': 180, 'height': 180})
    pg.set_content(f'<body style="margin:0;background:#4b2943"><img src="{(here.parent / "mark.svg").as_uri()}" style="width:180px;height:180px;display:block"></body>')
    pg.wait_for_timeout(200)
    pg.screenshot(path=str(here.parent / 'touch-icon.png'))
    b.close()
