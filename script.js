/* =========================================================
   CONFIG — swap in real files when they're ready
   ========================================================= */

// AI presenter video for the hero. Empty = placeholder photo.
const HERO_VIDEO = "";         // 16:9 desktop version, e.g. "assets/videos/presenter.mp4"
const HERO_VIDEO_MOBILE = "";  // 9:16 phone version, e.g. "assets/videos/presenter-mobile.mp4"

// Past ads shown in the moving strips (3:4 portrait). Leave `src` empty to show a placeholder photo.
const ADS = [
  { label: "Candle",         src: "" },
  { label: "Brewery",        src: "" },
  { label: "Café",           src: "" },
  { label: "Club night",     src: "" },
  { label: "Pet shop",       src: "" },
  { label: "Plumber",        src: "" },
  { label: "Driving school", src: "" },
  { label: "Coffee roaster", src: "" },
  { label: "Bakery",         src: "" },
  { label: "Festival",       src: "" },
];

/* ========================================================= */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmall = window.matchMedia("(max-width: 820px)").matches;

// Older Safari (< 14) only has addListener on media queries
const onMedia = (mq, fn) => (mq.addEventListener ? mq.addEventListener("change", fn) : mq.addListener(fn));

/* ---------- Grainy lights ----------
   Painted ONCE into a single canvas (radial gradients + baked-in grain),
   then it's just a static image while you scroll. Repainted only when the
   page width changes (rotation, resize). */
const page = document.querySelector(".page");
const lightsCanvas = document.querySelector(".lights");

function paintLights() {
  const W = page.clientWidth;
  const H = page.scrollHeight;
  // keep the canvas well under mobile GPU/canvas limits (iOS: ~16.7M px)
  const maxPx = isSmall ? 3e6 : 8e6;
  const scale = Math.min(1, Math.sqrt(maxPx / (W * H)));
  const cw = Math.round(W * scale), ch = Math.round(H * scale);
  lightsCanvas.width = cw;
  lightsCanvas.height = ch;
  lightsCanvas.style.height = H + "px";
  const ctx = lightsCanvas.getContext("2d");
  ctx.clearRect(0, 0, cw, ch);
  ctx.globalCompositeOperation = "lighter";

  const top = (id) => { const el = document.getElementById(id); return el ? el.offsetTop : 0; };
  const height = (id) => { const el = document.getElementById(id); return el ? el.offsetHeight : 0; };
  const R = Math.min(Math.max(W * 0.42, 300), 620);
  const lights = [
    // [x, y, radius, rgb, strength]
    [W * 0.06, top("top") + 40,                        R * 1.05, [31, 224, 122], 0.42],
    [W * 0.98, top("top") + height("top") * 0.62,      R,        [168, 255, 62], 0.2],
    [W * 0.86, top("work") + height("work") * 0.35,    R * 0.9,  [31, 224, 122], 0.32],
    [W * 0.14, top("work") + height("work") * 0.95,    R * 0.85, [11, 143, 85],  0.5],
    [W * 0.5,  top("contact") - 180,                   R * 0.8,  [31, 224, 122], 0.18],
    [W * 0.55, top("contact") + height("contact") * 0.4, R * 1.1, [31, 224, 122], 0.2],
  ];
  for (const [x, y, r, [cr, cg, cb], a] of lights) {
    const g = ctx.createRadialGradient(x * scale, y * scale, 0, x * scale, y * scale, r * scale);
    g.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`);
    g.addColorStop(0.35, `rgba(${cr},${cg},${cb},${a * 0.55})`);
    g.addColorStop(0.7, `rgba(${cr},${cg},${cb},${a * 0.15})`);
    g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
  }

  // bake in a subtle grain: scatter each pixel's brightness a little
  // (gentler on phones, where one canvas pixel covers 2-3 screen pixels)
  const amount = isSmall ? 0.22 : 0.32;
  const img = ctx.getImageData(0, 0, cw, ch);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const n = 1 - amount + Math.random() * amount * 2;
    d[i + 3] = Math.min(255, d[i + 3] * n);
  }
  ctx.putImageData(img, 0, 0);
}

let lastW = 0, lastH = 0, paintTimer;
function schedulePaint() {
  clearTimeout(paintTimer);
  paintTimer = setTimeout(() => {
    const W = page.clientWidth, H = page.scrollHeight;
    // ignore the small height changes from mobile URL bars appearing/disappearing
    if (W === lastW && Math.abs(H - lastH) < 150) return;
    lastW = W; lastH = H;
    paintLights();
  }, 150);
}

// ---------- Hero video ----------
const mobileQuery = window.matchMedia("(orientation: portrait) and (max-width: 820px)");
if (HERO_VIDEO || HERO_VIDEO_MOBILE) {
  const wrap = document.getElementById("heroVideo");
  const btn = wrap.querySelector(".play");
  const v = document.createElement("video");
  v.playsInline = true;
  v.setAttribute("playsinline", "");
  v.preload = "metadata";
  v.setAttribute("aria-label", "Intro video");
  const pickSource = () => {
    const src = (mobileQuery.matches ? HERO_VIDEO_MOBILE : HERO_VIDEO) || HERO_VIDEO || HERO_VIDEO_MOBILE;
    if (v.getAttribute("src") !== src) { v.src = src; btn.style.opacity = "1"; }
  };
  wrap.prepend(v);
  const ph = wrap.querySelector(".hero-photo-wrap");
  if (ph) ph.remove();
  pickSource();
  onMedia(mobileQuery, pickSource);
  btn.addEventListener("click", () => {
    if (v.paused) { v.play(); btn.style.opacity = "0"; }
    else { v.pause(); btn.style.opacity = "1"; }
  });
  v.addEventListener("click", () => btn.click());
}

// ---------- Build strips ----------
// Placeholder photos (picsum.photos) until real ad videos are added.
const placeholder = (label, n) =>
  `https://picsum.photos/seed/${encodeURIComponent(label.toLowerCase())}-${n}/${isSmall ? "240/320" : "360/480"}`;

function buildTrack(track, offset, repeats) {
  const frag = document.createDocumentFragment();
  for (let r = 0; r < repeats; r++) {
    ADS.forEach((ad) => {
      const el = document.createElement("div");
      el.className = "ad";
      if (ad.src) {
        const v = document.createElement("video");
        v.src = ad.src;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.setAttribute("muted", "");
        v.setAttribute("playsinline", "");
        v.preload = isSmall ? "none" : "metadata";
        v.setAttribute("aria-label", `${ad.label} ad`);
        el.appendChild(v);
      } else {
        const img = document.createElement("img");
        img.src = placeholder(ad.label, offset * 10 + r);
        img.alt = `${ad.label} ad (placeholder)`;
        img.width = 360; img.height = 480;
        img.loading = "lazy";
        img.decoding = "async";
        el.appendChild(img);
      }
      frag.appendChild(el);
    });
  }
  track.appendChild(frag);
}

const tracks = [...document.querySelectorAll(".track")];
// fewer tiles on phones: 2 rounds of ads already overfill a narrow screen
tracks.forEach((t, i) => buildTrack(t, i, isSmall ? 2 : 3));

// Play ad videos only while on screen (and load them only then)
if ("IntersectionObserver" in window) {
  const vio = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) { const p = target.play(); if (p) p.catch(() => {}); }
      else target.pause();
    });
  }, { threshold: 0.1 });
  document.querySelectorAll(".ad video").forEach((v) => vio.observe(v));
}

// ---------- Scroll-driven movement ----------
// Front strip moves left→right, back strip right→left (slower), as you scroll.
// Measurements are cached; each frame only sets a transform (no layout reads).
const work = document.getElementById("work");
let workTop = 0, workH = 0, vh = 0, trackW = [];
let workVisible = true, ticking = false;

function measure() {
  vh = window.innerHeight;
  workTop = work.getBoundingClientRect().top + window.scrollY;
  workH = work.offsetHeight;
  trackW = tracks.map((t) => t.scrollWidth);
}

function update() {
  ticking = false;
  const rectTop = workTop - window.scrollY;
  const p = Math.min(Math.max((vh - rectTop) / (vh + workH), 0), 1);
  tracks.forEach((t, i) => {
    const dir = +t.dataset.dir;
    const speed = +t.dataset.speed;
    const w = trackW[i];
    const x = -w * 0.25 + dir * (p - 0.5) * w * 0.66 * speed;
    t.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
  });
}

function onScroll() {
  if (workVisible && !ticking) { ticking = true; requestAnimationFrame(update); }
}

if ("IntersectionObserver" in window) {
  // stop animating while the strips are off screen
  new IntersectionObserver(([e]) => { workVisible = e.isIntersecting; if (workVisible) onScroll(); },
    { rootMargin: "200px 0px" }).observe(work);
}

function onResize() { measure(); update(); schedulePaint(); }

measure();
update();
if (!reduceMotion) window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onResize);
window.addEventListener("orientationchange", onResize);
// paint lights after fonts/layout settle so section positions are right
if (document.readyState === "complete") schedulePaint();
else window.addEventListener("load", () => { measure(); update(); schedulePaint(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); schedulePaint(); });
schedulePaint();
