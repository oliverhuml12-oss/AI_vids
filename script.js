/* =========================================================
   CONFIG — swap in real files when they're ready
   ========================================================= */

// AI presenter video for the hero. Empty = placeholder photo.
const HERO_VIDEO = "";         // 16:9 desktop version, e.g. "assets/videos/presenter.mp4"
const HERO_VIDEO_MOBILE = "";  // 9:16 phone version, e.g. "assets/videos/presenter-mobile.mp4"

// Past ads shown in the moving strips (4:3). Leave `src` empty to show a placeholder photo.
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

// ---------- Film grain texture ----------
(function makeGrain() {
  const size = 180;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  document.querySelector(".grain").style.backgroundImage = `url(${c.toDataURL()})`;
})();

// ---------- Hero video ----------
const mobileQuery = window.matchMedia("(orientation: portrait) and (max-width: 820px)");
if (HERO_VIDEO || HERO_VIDEO_MOBILE) {
  const wrap = document.getElementById("heroVideo");
  const btn = wrap.querySelector(".play");
  const v = document.createElement("video");
  v.playsInline = true;
  v.preload = "metadata";
  v.setAttribute("aria-label", "Intro video");
  const pickSource = () => {
    const src = (mobileQuery.matches ? HERO_VIDEO_MOBILE : HERO_VIDEO) || HERO_VIDEO || HERO_VIDEO_MOBILE;
    if (v.getAttribute("src") !== src) { v.src = src; btn.style.opacity = "1"; }
  };
  wrap.prepend(v);
  wrap.querySelector(".hero-photo-wrap")?.remove();
  pickSource();
  mobileQuery.addEventListener("change", pickSource);
  btn.addEventListener("click", () => {
    if (v.paused) { v.play(); btn.style.opacity = "0"; }
    else { v.pause(); btn.style.opacity = "1"; }
  });
  v.addEventListener("click", () => btn.click());
}

// ---------- Build strips ----------
// Placeholder photos (picsum.photos) until real ad videos are added.
const placeholder = (label, n) =>
  `https://picsum.photos/seed/${encodeURIComponent(label.toLowerCase())}-${n}/480/360`;

function buildTrack(track, offset, repeats) {
  const list = [];
  for (let r = 0; r < repeats; r++) list.push(...ADS);
  list.forEach((ad, i) => {
    const el = document.createElement("div");
    el.className = "ad";
    if (ad.src) {
      const v = document.createElement("video");
      v.src = ad.src;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = "metadata";
      v.setAttribute("aria-label", `${ad.label} ad`);
      el.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.src = placeholder(ad.label, offset * 10 + Math.floor(i / ADS.length));
      img.alt = `${ad.label} ad (placeholder)`;
      img.loading = "lazy";
      img.decoding = "async";
      el.appendChild(img);
    }
    track.appendChild(el);
  });
}

const tracks = [...document.querySelectorAll(".track")];
tracks.forEach((t, i) => buildTrack(t, i, 3));

// Play videos only while visible
const io = new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) target.play().catch(() => {});
    else target.pause();
  });
}, { threshold: 0.1 });
document.querySelectorAll(".ad video").forEach((v) => io.observe(v));

// ---------- Scroll-driven movement ----------
// Front strip moves left→right, back strip right→left (slower), as you scroll.
const work = document.getElementById("work");
let ticking = false;

function update() {
  ticking = false;
  const rect = work.getBoundingClientRect();
  const vh = window.innerHeight;
  // 0 when the section enters from the bottom, 1 when it leaves at the top
  const progress = (vh - rect.top) / (vh + rect.height);
  const p = Math.min(Math.max(progress, 0), 1);
  tracks.forEach((t) => {
    const dir = Number(t.dataset.dir);
    const speed = Number(t.dataset.speed);
    const travel = t.scrollWidth * 0.33 * speed * 2;
    // start shifted so there's room to move either way
    const x = -t.scrollWidth * 0.25 + dir * (p - 0.5) * travel;
    t.style.transform = `translate3d(${x}px, 0, 0)`;
  });
}

function onScroll() {
  if (!ticking) { ticking = true; requestAnimationFrame(update); }
}

if (!reduceMotion) {
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}
update();
