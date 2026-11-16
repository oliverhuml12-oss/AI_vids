/* =========================================================
   CONFIG — swap in real files when they're ready
   ========================================================= */

// AI presenter video for the hero (e.g. "assets/videos/presenter.mp4"). Empty = placeholder.
const HERO_VIDEO = "";

// Past ads shown in the moving strips. Leave `src` empty to show a placeholder tile.
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
if (HERO_VIDEO) {
  const wrap = document.getElementById("heroVideo");
  const v = document.createElement("video");
  v.src = HERO_VIDEO;
  v.playsInline = true;
  v.preload = "metadata";
  v.setAttribute("aria-label", "Intro video");
  wrap.prepend(v);
  wrap.querySelector(".silhouette")?.remove();
  wrap.querySelector(".badge-placeholder")?.remove();
  const btn = wrap.querySelector(".play");
  btn.addEventListener("click", () => {
    if (v.paused) { v.play(); btn.style.opacity = "0"; }
    else { v.pause(); btn.style.opacity = "1"; }
  });
  v.addEventListener("click", () => btn.click());
}

// ---------- Build strips ----------
const tint = (i) => {
  const colors = ["#1fe07a88", "#a8ff3e66", "#ffffff22", "#0b8f5599"];
  const c = colors[i % colors.length];
  const x = 20 + ((i * 37) % 60);
  return `radial-gradient(120% 70% at ${x}% 15%, ${c} 0%, transparent 60%), linear-gradient(165deg, #18201b 0%, #090c0a 100%)`;
};

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
      el.style.background = tint(i + offset);
      const label = document.createElement("span");
      label.className = "ad-label";
      label.textContent = ad.label;
      el.appendChild(label);
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
