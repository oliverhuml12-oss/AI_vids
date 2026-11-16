/* =========================================================
   CONFIG — swap in real files when they're ready
   ========================================================= */

// AI presenter video for the hero. Empty = placeholder photo.
const HERO_VIDEO = "assets/videos/presenter.mp4";               // 16:9 desktop version
const HERO_VIDEO_MOBILE = "assets/videos/presenter-mobile.mp4"; // 9:16 phone version
const HERO_POSTER = "assets/videos/presenter.jpg";
const HERO_POSTER_MOBILE = "assets/videos/presenter-mobile.jpg";

// Past ads shown in the moving strips (3:4 portrait, short muted loops).
//   src       – desktop file (e.g. 480×640)
//   srcMobile – smaller file for phones (e.g. 360×480); falls back to src
//   poster    – still image shown before the video plays (and on the back strip on phones)
// The current files are generated TEST loops, swap them for real ads.
const v = (n) => ({ src: `assets/videos/ad-0${n}.mp4`, srcMobile: `assets/videos/ad-0${n}-m.mp4`, poster: `assets/videos/ad-0${n}.jpg` });
const ADS = [
  { label: "Candle",         ...v(1) },
  { label: "Brewery",        ...v(2) },
  { label: "Café",           ...v(3) },
  { label: "Club night",     ...v(4) },
  { label: "Pet shop",       ...v(5) },
  { label: "Plumber",        ...v(6) },
  { label: "Driving school", ...v(2) },
  { label: "Coffee roaster", ...v(1) },
  { label: "Bakery",         ...v(5) },
  { label: "Festival",       ...v(3) },
];

/* ========================================================= */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmall = window.matchMedia("(max-width: 820px)").matches;
// "lite" = phones/tablets: set by the inline script in <head>
const isLite = document.documentElement.classList.contains("lite");

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
  v.preload = isLite ? "none" : "metadata";
  v.setAttribute("aria-label", "Intro video");
  const pickSource = () => {
    const src = (mobileQuery.matches ? HERO_VIDEO_MOBILE : HERO_VIDEO) || HERO_VIDEO || HERO_VIDEO_MOBILE;
    if (v.getAttribute("src") !== src) {
      v.poster = (mobileQuery.matches ? HERO_POSTER_MOBILE : HERO_POSTER) || "";
      v.src = src; btn.style.opacity = "1";
    }
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
const tracks = [...document.querySelectorAll(".track")];
const work = document.getElementById("work");

function makeTile(ad, { video, mobile }) {
  const el = document.createElement("div");
  el.className = "ad";
  if (video && ad.src) {
    const vid = document.createElement("video");
    // iOS needs these as attributes, set before src, for silent inline playback
    vid.setAttribute("muted", ""); vid.muted = true;
    vid.setAttribute("playsinline", ""); vid.playsInline = true;
    vid.loop = true;
    vid.preload = "none";
    vid.disablePictureInPicture = true;
    if (ad.poster) vid.poster = ad.poster;
    vid.dataset.src = (mobile && ad.srcMobile) || ad.src; // loaded only when on screen
    vid.setAttribute("aria-label", `${ad.label} ad`);
    el.appendChild(vid);
  } else {
    const img = document.createElement("img");
    img.src = ad.poster || "";
    img.alt = `${ad.label} ad`;
    img.width = 360; img.height = 480;
    img.loading = "lazy";
    img.decoding = "async";
    el.appendChild(img);
  }
  return el;
}

if (isLite) {
  /* PHONES: compromise for smoothness
     - strips loop on their own with a CSS animation (runs on the GPU compositor,
       no JavaScript per frame, no scroll handler at all)
     - 6 tiles per strip, duplicated once for a seamless loop
     - only the front strip plays video (small mobile files); back strip = still posters */
  const set = ADS.slice(0, 6);
  tracks.forEach((t, i) => {
    const front = t.dataset.dir === "1";
    const frag = document.createDocumentFragment();
    [0, 1].forEach(() => set.forEach((ad) => frag.appendChild(makeTile(ad, { video: front, mobile: true }))));
    t.appendChild(frag);
  });
} else {
  /* DESKTOP: scroll-driven strips, video in both */
  tracks.forEach((t) => {
    const frag = document.createDocumentFragment();
    for (let r = 0; r < 3; r++) ADS.forEach((ad) => frag.appendChild(makeTile(ad, { video: true, mobile: false })));
    t.appendChild(frag);
  });
}

// Load + play each ad video only while it's on screen; pause (and keep it light) otherwise
const videos = [...document.querySelectorAll(".ad video")];
if ("IntersectionObserver" in window) {
  const vio = new IntersectionObserver((entries) => {
    entries.forEach(({ target: vid, isIntersecting }) => {
      if (isIntersecting) {
        if (!vid.src) vid.src = vid.dataset.src;
        const p = vid.play(); if (p) p.catch(() => {});
      } else if (!vid.paused) vid.pause();
    });
  }, { threshold: 0.05 });
  videos.forEach((vid) => vio.observe(vid));
} else {
  videos.forEach((vid) => { vid.src = vid.dataset.src; vid.autoplay = true; });
}

// Strips section in view? (pauses the phone animation when off screen)
let workVisible = true, ticking = false;
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([e]) => {
    workVisible = e.isIntersecting;
    work.classList.toggle("in-view", workVisible);
    if (workVisible && !isLite) onScroll();
  }, { rootMargin: "100px 0px" }).observe(work);
} else work.classList.add("in-view");

// ---------- Scroll-driven movement (desktop only) ----------
// Front strip moves left→right, back strip right→left (slower), as you scroll.
// Measurements are cached; each frame only sets a transform (no layout reads).
let workTop = 0, workH = 0, vh = 0, trackW = [];

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

function onResize() { if (!isLite) { measure(); update(); } schedulePaint(); }

if (!isLite) {
  measure();
  update();
  if (!reduceMotion) window.addEventListener("scroll", onScroll, { passive: true });
}
window.addEventListener("resize", onResize);
window.addEventListener("orientationchange", onResize);
// paint lights after fonts/layout settle so section positions are right
const settle = () => { if (!isLite) { measure(); update(); } schedulePaint(); };
if (document.readyState === "complete") schedulePaint();
else window.addEventListener("load", settle);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
schedulePaint();
