/* ============================================================
   STARTUP UP — cinematic house scroll engine
   โครงเดียวกับหน้า "Mostar city" : สกอลล์หน่วง + พารัลแลกซ์เมาส์
   + segmentInOut ต่อฉาก + สไลเดอร์วนไม่รู้จบแบบโคลน 3 ชุด
   ============================================================ */

const section = document.querySelector(".cinema-scroll");
const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const gateLeft = document.getElementById("sc-gate-left");
const gateRight = document.getElementById("sc-gate-right");

const sightsSlider = document.querySelector(".sights-slider");
const sightsTrack = document.querySelector(".sights-track");
const sightsControls = document.querySelector(".sights-controls");
const sightPrev = document.querySelector(".sight-prev");
const sightNext = document.querySelector(".sight-next");

/* ---------- ระยะเลื่อนทั้งหมดของเรื่อง ---------- */
const STORY_LENGTH = 9000;

/* สเกลพื้นฐาน : เผื่อขอบไว้ให้พารัลแลกซ์เมาส์แค่พอดี ไม่ซูมเกินจำเป็น
   ภาพต้นฉบับกว้าง 1672px ทุกเปอร์เซ็นต์ที่ซูมเกินมาคือความคมที่หายไป */
const BASE_SCALE = 1.03;

/* สัดส่วนภาพต้นฉบับ ใช้คำนวณรอยต่อกลางประตู */
const IMG_RATIO = 1672 / 941;
const GATE_SEAM_IN_IMAGE = 0.516;

/* ---------- ลำดับฉาก ----------
   in     : ช่วงสกอลล์ที่ฉากค่อย ๆ ปรากฏ
   turnX  : เลี้ยวกล้องเข้ามาจากทางไหน (vw)
   ry     : องศาหมุนตอนเลี้ยว
   dolly  : ดอลลี่เดินหน้า (สเกลที่เพิ่มขึ้นตลอดช่วงชีวิตของฉาก)
   guard  : สเกลกันขอบตอนภาพยังเลื่อน/หมุนอยู่
   par    : ความแรงพารัลแลกซ์เมาส์ (px)
*/
const SCENES = [
  { id: "sc-gate-open", in: [560, 1400],  turnX: 0,  ry: 0,  dolly: 0.15, guard: 0.00, par: 10, alwaysOn: true },
  { id: "sc-garden-1",  in: [1760, 2280], turnX: 9,  ry: 7,  dolly: 0.09, guard: 0.24, par: 12 },
  { id: "sc-garden-2",  in: [3450, 3970], turnX: -8, ry: -6, dolly: 0.09, guard: 0.22, par: 12 },
  { id: "sc-room-1",    in: [4600, 5120], turnX: 0,  ry: 0,  dolly: 0.10, guard: 0.08, par: 14 },
  { id: "sc-room-2",    in: [5750, 6270], turnX: 6,  ry: 4,  dolly: 0.09, guard: 0.18, par: 14 },
  { id: "sc-room-3",    in: [6900, 7420], turnX: -5, ry: -3, dolly: 0.09, guard: 0.16, par: 14 },
  { id: "sc-room-4",    in: [7950, 8470], turnX: 0,  ry: 0,  dolly: 0.10, guard: 0.08, par: 16 },
];

SCENES.forEach((scene) => {
  scene.el = document.getElementById(scene.id);
});

/* ---------- แผ่นข้อความประจำฉาก ---------- */
const PANELS = [
  { id: "panel-1", seg: [560, 900, 1300, 1560] },
  { id: "panel-2", seg: [1900, 2250, 2900, 3150] },
  { id: "panel-3", seg: [3580, 3930, 4300, 4530] },
  { id: "panel-4", seg: [4730, 5080, 5480, 5710] },
  { id: "panel-5", seg: [5880, 6230, 6630, 6830] },
  { id: "panel-6", seg: [7030, 7380, 7680, 7900] },
  { id: "panel-7", seg: [8080, 8430, 1e9, 1e9 + 1] },
];

PANELS.forEach((panel) => {
  panel.el = document.getElementById(panel.id);
});

/* ---------- สถานะ ---------- */
let targetMouseX = 0;
let targetMouseY = 0;
let mouseX = 0;
let mouseY = 0;
let targetScroll = 0;
let smoothScroll = 0;
let initialized = false;
let rafPending = false;

let sightCards = [];
let originalSightCards = Array.from(document.querySelectorAll(".sight-card"));
let originalSightCount = originalSightCards.length;
let activeSight = originalSightCount;

/* ---------- ตัวช่วยคณิต ---------- */
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const smoothstep = (edge0, edge1, value) => {
  const x = clamp((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
};

const lerp = (a, b, t) => a + (b - a) * t;

const segmentInOut = (s, a, b, c, d) => {
  const enter = smoothstep(a, b, s);
  const exit = smoothstep(c, d, s);
  return { enter, exit, active: enter * (1 - exit) };
};

const getScrollDistance = () =>
  clamp(-section.getBoundingClientRect().top, 0, section.offsetHeight - window.innerHeight);

/* ---------- รอยต่อกลางบานประตู (ขึ้นกับสัดส่วนจอ) ---------- */
function updateGateSeam() {
  const viewportRatio = window.innerWidth / window.innerHeight;
  let seam = GATE_SEAM_IN_IMAGE;

  if (viewportRatio < IMG_RATIO) {
    const visible = viewportRatio / IMG_RATIO;
    const left = 0.5 - visible / 2;
    seam = (GATE_SEAM_IN_IMAGE - left) / visible;
  }

  root.style.setProperty("--gate-seam", `${(clamp(seam, 0.15, 0.85) * 100).toFixed(2)}%`);
}

/* ---------- ลูปหลัก ---------- */
function update() {
  rafPending = false;

  targetScroll = getScrollDistance();

  if (!initialized || reduceMotion.matches) {
    smoothScroll = targetScroll;
    initialized = true;
  } else {
    smoothScroll = lerp(smoothScroll, targetScroll, 0.14);
  }

  if (Math.abs(smoothScroll - targetScroll) < 0.08) smoothScroll = targetScroll;

  mouseX = lerp(mouseX, targetMouseX, 0.12);
  mouseY = lerp(mouseY, targetMouseY, 0.12);

  const s = smoothScroll;
  const px = reduceMotion.matches ? 0 : mouseX;
  const py = reduceMotion.matches ? 0 : mouseY;

  const progress = clamp(s / STORY_LENGTH);
  const introExit = smoothstep(90, 650, s);
  const gatePart = smoothstep(560, 1400, s);
  const gateDrift = Math.pow(gatePart, 1.5);

  const sightsEnterRaw = smoothstep(1980, 2480, s);
  const sightsEnter = Math.pow(sightsEnterRaw, 1.55);
  const sightsExit = Math.pow(smoothstep(2950, 3320, s), 1.4);
  const sightsShown = sightsEnter * (1 - sightsExit);
  const sightsControlsEnter = smoothstep(2380, 2620, s) * (1 - smoothstep(2900, 3080, s));

  root.style.setProperty("--mx", px.toFixed(4));
  root.style.setProperty("--my", py.toFixed(4));

  /* --- ฉากต่อฉาก : จาง + ดอลลี่ + เลี้ยว --- */
  const allowBlur = window.innerWidth > 640;
  let heat = 0;

  for (let i = 0; i < SCENES.length; i += 1) {
    const scene = SCENES[i];
    const next = SCENES[i + 1];

    const enter = smoothstep(scene.in[0], scene.in[1], s);
    const nextEnter = next ? smoothstep(next.in[0], next.in[1], s) : 0;
    const inv = 1 - enter;
    const ease = Math.pow(inv, 1.6);

    const dollySpan = next ? next.in[1] - scene.in[0] : 1600;
    const dollyProgress = clamp((s - scene.in[0]) / dollySpan);

    const scale = BASE_SCALE + inv * scene.guard + dollyProgress * scene.dolly;

    /* จางแบบจุ่มมืด : ฉากเก่าหรี่ลงพร้อมกับที่ฉากใหม่ขึ้นมา ไม่ทับกันจนเละ */
    const opacity = (scene.alwaysOn ? 1 : enter) * (1 - nextEnter);

    const style = scene.el.style;
    style.setProperty("--op", opacity.toFixed(4));
    style.setProperty("--x", `calc(${(ease * scene.turnX).toFixed(3)}vw + ${(px * -scene.par).toFixed(2)}px)`);
    style.setProperty("--y", `${(py * -scene.par * 0.55 + ease * -18).toFixed(2)}px`);
    style.setProperty("--ry", `${(ease * scene.ry).toFixed(3)}deg`);
    style.setProperty("--sc", scale.toFixed(4));
    style.setProperty("--fx", nextEnter < 0.004
      ? "none"
      : `blur(${(allowBlur ? nextEnter * 16 : 0).toFixed(2)}px) brightness(${(1 - nextEnter * 0.18).toFixed(4)})`);

    if (!scene.alwaysOn) heat = Math.max(heat, 4 * enter * (1 - enter));
  }

  /* --- บานประตูหน้าบ้าน : แยกออกซ้าย/ขวาแล้วลอยพ้นเฟรม --- */
  const gateExit = smoothstep(1300, 1740, s);
  const gateFade = smoothstep(1280, 1620, s);
  const gateScale = 1 + gateDrift * 0.8 + gateExit * 0.9 + progress * 0.05;
  const gateY = py * 10 + gateDrift * -140 + gateExit * -90;

  [gateLeft, gateRight].forEach((half, index) => {
    const dir = index === 0 ? -1 : 1;
    const style = half.style;
    style.setProperty("--op", (1 - gateFade).toFixed(4));
    style.setProperty("--x", `calc(${(dir * (gateDrift * 52 + gateExit * 90)).toFixed(3)}vw + ${(px * 22).toFixed(2)}px)`);
    style.setProperty("--y", `${gateY.toFixed(2)}px`);
    style.setProperty("--sc", gateScale.toFixed(4));
    style.setProperty("--fx", gateExit < 0.004
      ? "none"
      : `blur(${(allowBlur ? gateExit * 16 : 0).toFixed(2)}px) brightness(${(1 - gateExit * 0.18).toFixed(4)})`);
  });


  /* --- ม่านสีระหว่างเปลี่ยนฉาก --- */
  root.style.setProperty("--shade-opacity", "1");
  root.style.setProperty("--shade-top-alpha", (heat * 0.62).toFixed(4));
  root.style.setProperty("--shade-mid-alpha", (heat * 0.58).toFixed(4));
  root.style.setProperty("--shade-bottom-alpha", (heat * 0.66).toFixed(4));

  /* --- หัวเรื่องกับข้อความเปิด --- */
  root.style.setProperty("--title-y", `${(introExit * -210 + py * 6).toFixed(2)}px`);
  root.style.setProperty("--title-scale", (1 - introExit * 0.08).toFixed(4));
  root.style.setProperty("--title-opacity", (1 - introExit).toFixed(4));
  root.style.setProperty("--intro-copy-y", `${(introExit * 90).toFixed(2)}px`);
  root.style.setProperty("--intro-copy-opacity", (1 - introExit).toFixed(4));

  /* --- แผ่นข้อความ --- */
  PANELS.forEach((panel) => {
    const seg = segmentInOut(s, panel.seg[0], panel.seg[1], panel.seg[2], panel.seg[3]);
    const opacity = seg.active * (1 - seg.exit);
    panel.el.style.setProperty("--op", opacity.toFixed(4));
    panel.el.style.setProperty("--ty", `${(-seg.exit * 86 + (1 - seg.enter) * 58).toFixed(2)}px`);
  });

  /* --- สไลเดอร์จุดเด่น --- */
  root.style.setProperty("--sights-opacity", sightsShown.toFixed(4));
  root.style.setProperty("--sights-controls-opacity", sightsControlsEnter.toFixed(4));
  sightsControls.classList.toggle("is-ready", sightsControlsEnter > 0.98);
  root.style.setProperty("--sights-visibility", sightsShown > 0.01 ? "visible" : "hidden");
  root.style.setProperty("--sights-y", "0px");
  root.style.setProperty("--sights-enter-x", `${((1 - sightsEnter) * 420 - sightsExit * 470).toFixed(3)}vw`);
  root.style.setProperty("--sights-scale", "1");
  sightsSlider.style.pointerEvents = sightsShown > 0.6 ? "auto" : "none";

  if (
    Math.abs(smoothScroll - targetScroll) > 0.08 ||
    Math.abs(mouseX - targetMouseX) > 0.001 ||
    Math.abs(mouseY - targetMouseY) > 0.001
  ) {
    requestTick();
  }
}

function requestTick() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(update);
}

/* ---------- สไลเดอร์วนไม่รู้จบ ---------- */
function setupSightSlider() {
  if (!sightsTrack || !originalSightCount) return;

  const clones = [];

  for (let setIndex = 0; setIndex < 3; setIndex += 1) {
    originalSightCards.forEach((card, cardIndex) => {
      const clone = card.cloneNode(true);
      clone.dataset.sightIndex = String(setIndex * originalSightCount + cardIndex);
      clones.push(clone);
    });
  }

  sightsTrack.replaceChildren(...clones);
  sightCards = Array.from(sightsTrack.querySelectorAll(".sight-card"));
  activeSight = originalSightCount;

  sightCards.forEach((card) => {
    card.addEventListener("click", () => selectSightCard(card));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectSightCard(card);
      }
    });
  });

  sightsTrack.addEventListener("transitionend", normalizeSightSlider);
  updateSightSlider();
}

function updateSightSlider() {
  if (!sightCards.length) return;

  const cardWidth = sightCards[0].offsetWidth;
  const gap = parseFloat(getComputedStyle(sightsTrack).columnGap || "0") || 0;

  root.style.setProperty("--sights-shift", `${-(cardWidth + gap) * activeSight}px`);

  sightCards.forEach((card, index) => {
    card.classList.toggle("is-active", index === activeSight);
  });
}

function moveSightSlider(direction) {
  activeSight += direction;
  updateSightSlider();
}

function selectSightCard(card) {
  const index = Number(card.dataset.sightIndex);
  if (Number.isFinite(index)) activeSight = index;
  updateSightSlider();
}

function jumpSightSlider(index) {
  sightsTrack.classList.add("is-jumping");
  activeSight = index;
  updateSightSlider();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => sightsTrack.classList.remove("is-jumping"));
  });
}

function normalizeSightSlider() {
  if (activeSight >= originalSightCount * 2) {
    jumpSightSlider(activeSight - originalSightCount);
  } else if (activeSight < originalSightCount) {
    jumpSightSlider(activeSight + originalSightCount);
  }
}

/* ---------- เมนูกระโดดไปแต่ละฉาก ---------- */
function setupNavJumps() {
  document.querySelectorAll("[data-at]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const at = Number(link.dataset.at) || 0;
      window.scrollTo({
        top: section.offsetTop + at,
        behavior: reduceMotion.matches ? "auto" : "smooth",
      });
    });
  });
}

/* ---------- ผูกอีเวนต์ ---------- */
window.addEventListener("scroll", requestTick, { passive: true });

window.addEventListener("resize", () => {
  updateGateSeam();
  updateSightSlider();
  requestTick();
});

window.addEventListener(
  "pointermove",
  (event) => {
    targetMouseX = event.clientX / window.innerWidth - 0.5;
    targetMouseY = event.clientY / window.innerHeight - 0.5;
    requestTick();
  },
  { passive: true }
);

if (sightPrev) sightPrev.addEventListener("click", () => moveSightSlider(-1));
if (sightNext) sightNext.addEventListener("click", () => moveSightSlider(1));

const noteButton = document.querySelector(".note-button");
if (noteButton) noteButton.addEventListener("click", () => { window.location.href = "/"; });

updateGateSeam();
setupSightSlider();
setupNavJumps();
requestTick();

/* ---------- ลิงก์ตรงไปยังจังหวะที่ต้องการ เช่น ?at=2150 ---------- */
const deepLinkAt = Number(new URLSearchParams(window.location.search).get("at"));
if (Number.isFinite(deepLinkAt) && deepLinkAt > 0) {
  window.scrollTo({ top: section.offsetTop + deepLinkAt, behavior: "instant" });
  requestTick();
}
