# AI_vids — agency landing page

Static one-page site (HTML + CSS + JS, no build step). Open `index.html` in a browser, or host it on GitHub Pages / Netlify / Vercel.

## Swap in real content
Everything lives at the top of `script.js`:

- `HERO_VIDEO`: path to the AI presenter video, e.g. `assets/videos/presenter.mp4`. While it's empty, the hero shows a placeholder.
- `ADS`: the past ads in the two moving strips. Add a `src` such as `assets/videos/candle.mp4` to each one. Use 9:16 MP4s and keep them short and small (under ~3 MB). They play muted on a loop, and only while they're on screen.

Put the video files in `assets/videos/`.

## Look
- Black background with grainy green lights (an SVG noise displacement plus a film-grain overlay). The colours are CSS variables at the top of `styles.css` (`--green`, `--lime`, `--deep`).
- Glass elements: nav, hero frame, info cards.
- The info section is still placeholder blocks.

## Note
Keep the "AI generated" badge on the presenter video. It's there for the EU AI Act Art. 50 visible-disclosure rule.
