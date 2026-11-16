# AI_vids — thinkerlab landing page (placeholder name)

Static one-page site (HTML + CSS + JS, no build step). Open `index.html` in a browser, or host it on GitHub Pages / Netlify / Vercel.

## Swap in real content
Everything lives at the top of `script.js`:

- `HERO_VIDEO` (16:9, desktop) and `HERO_VIDEO_MOBILE` (9:16, phones in portrait): the AI presenter video. The page picks the right one automatically. While they're empty, the hero shows a placeholder photo (picsum.photos).
- `ADS`: the past ads in the two moving strips. Add a `src` such as `assets/videos/candle.mp4` to each one. Use 3:4 portrait MP4s and keep them short and small (under ~3 MB). They play muted on a loop, and only while they're on screen.

Put the video files in `assets/videos/`. The files there now are placeholder loops made from Unsplash photos (credits in `assets/videos/CREDITS.md`). Replace them with real ads (each ad: a desktop file, a smaller `-m` phone file and a `.jpg` poster).

## Look
- Black background with grainy green lights, painted once into a canvas (see `paintLights()` in `script.js` for positions, colours and grain). No live blur or SVG filters, so it scrolls smoothly on phones.
- Glass elements: nav, hero frame, info cards.
- The info section is still placeholder blocks.

## Note
Under EU AI Act Art. 50, an AI presenter needs a visible "AI generated" label from the first frame. Burn it into the presenter videos themselves.
