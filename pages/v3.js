import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Head from 'next/head'
import { ArrowRight, ArrowUpRight, Phone, MoveHorizontal } from 'lucide-react'

/* ============================================================================
   Startup Up — Cinematic single page   (เปิดที่ /v3)

   สร้างตาม docs/brief-cinematic.md
   ไม่แตะ pages/index.js และ styles/globals.css — CSS ทั้งหมดอยู่ในไฟล์นี้

   ► รูปและวิดีโอทั้งหมดรวมอยู่ที่ IMG ด้านล่างจุดเดียว
     เปลี่ยนเป็น '/images/xxx.jpg' หรือลิงก์ Cloudinary ของคุณได้เลย
   ========================================================================= */

const IMG = {
  // ก่อน–หลังรีโนเวท (Module A) — ใช้ภาพหลังเดียวกันมุมเดียวกันเท่านั้น
  before: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80',
  after: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',

  // แกลเลอรี editorial (Phase 4)
  galleryMain: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  galleryPip: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=700&q=80',
  gallerySide: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=900&q=80',

  // ภูเขาแบบภาพนิ่งสำหรับมือถือ (แทน WebGL)
  heroMobile: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',

  /* วิดีโอ scroll-scrub (Module C)
     CSP ของโปรเจกต์ตั้ง media-src ไว้แค่ 'self' กับ cloudinary คลิปจึงต้องอยู่ใน
     public/ หรือบน Cloudinary ของบริษัทเท่านั้น ลิงก์ภายนอกจะถูกเบราว์เซอร์บล็อก

     ► วางไฟล์ที่ public/video/walkthrough.mp4 แล้วโมดูลนี้ทำงานทันที
       ระหว่างที่ยังไม่มีไฟล์ จะถอยไปแสดงภาพนิ่งให้เองอัตโนมัติ
     ⚠ export ด้วย keyframe ถี่ ไม่งั้น seek จะกระตุก:
       ffmpeg -i in.mp4 -g 2 -keyint_min 2 -c:v libx264 -crf 23 -an walkthrough.mp4 */
  scrubVideo: '/video/walkthrough.mp4',
  scrubPoster: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80',
}

/* ---------- เนื้อหา ---------- */

const HERO_LINES = ['บ้านพร้อมอยู่', 'เชิงเขาเพชรบูรณ์']

const INTRO_LINES = [
  'เราคัดบ้านมือสองสภาพดีทีละหลัง',
  'ตรวจโฉนดและภาระผูกพันให้ครบก่อนเสนอ',
  'แล้วบอกข้อเสียตามจริงทุกหลัง',
]

const STATS = [
  { n: 98, suffix: '+', label: 'คะแนนความพอใจ' },
  { n: 1000, suffix: '+', label: 'ครอบครัวที่ได้บ้าน' },
  { n: 15, suffix: '+', label: 'ปีในวงการอสังหาฯ' },
]

const GALLERY_LINES = [
  'ทุกหลังผ่านการปรับปรุง',
  'ด้วยช่างชุดเดียวกับที่เราใช้เอง',
]

/* ============================ hooks ============================ */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

function useIsCoarse() {
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (max-width: 860px)')
    const on = () => setCoarse(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return coarse
}

/**
 * Loader ที่นับ asset จริง ไม่ใช่ timer ปลอม
 * นับทั้ง load และ error — รูปเสียใบเดียวต้องไม่ทำให้ค้างตลอดกาล
 */
function useAssetLoader(urls, extra) {
  const total = urls.length + 1 + extra // +1 = ฟอนต์ Prompt
  const [loaded, setLoaded] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  // ต้องเริ่มที่ null ไม่ใช่ '' เพราะลิสต์ว่าง (เดสก์ท็อปที่ไม่ต้องโหลดรูปเลย)
  // จะได้ key เป็น '' พอดี แล้วโดนมองว่าลงทะเบียนไปแล้ว
  const registered = useRef(null)

  const bump = useCallback(() => setLoaded((n) => n + 1), [])

  useEffect(() => {
    // ลงทะเบียนชุดเดิมซ้ำไม่ได้ ไม่งั้นตัวนับจะเดินเกินตอน use3D เปลี่ยนค่า
    const key = urls.join('|')
    if (registered.current === key) return
    registered.current = key

    let alive = true
    const tick = () => { if (alive) bump() }

    urls.forEach((src) => {
      const img = new Image()
      img.onload = tick
      img.onerror = tick   // รูปเสียต้องนับด้วย ไม่งั้นค้างที่ 99 ตลอดกาล
      img.src = src
    })

    if (document.fonts?.ready) document.fonts.ready.then(tick).catch(tick)
    else tick()

    // failsafe: ไม่ว่าจะเกิดอะไร 8 วินาทีต้องเปิดหน้า
    const t = setTimeout(() => alive && setTimedOut(true), 8000)
    return () => { alive = false; clearTimeout(t) }
  }, [bump, urls])

  const raw = Math.round((loaded / total) * 100)
  const done = timedOut || loaded >= total
  return { pct: done ? 100 : Math.min(99, raw), done, bump }
}

/** ใส่ .is-in ให้ .rv ที่เลื่อนมาถึง */
function useReveal(active) {
  useEffect(() => {
    if (!active) return
    const els = Array.from(document.querySelectorAll('.rv:not(.is-in)'))
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
      }),
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [active])
}

/* ============================ ชิ้นส่วน ============================ */

/** ข้อความเผยทีละบรรทัด — กล่องเผื่อความสูงให้สระบนไทยไม่โดนตัด */
function LineReveal({ lines, as: Tag = 'p', className = '', delayStep = 90 }) {
  return (
    <Tag className={`lr rv ${className}`}>
      {lines.map((line, i) => (
        <span className="lr-mask" key={i}>
          <span className="lr-line" style={{ '--d': `${i * delayStep}ms` }}>{line}</span>
        </span>
      ))}
    </Tag>
  )
}

function CountUp({ to, suffix = '', run }) {
  const [val, setVal] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (!run || started.current) return
    started.current = true
    const t0 = performance.now()
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1500)
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [run, to])
  return <>{val.toLocaleString()}{suffix}</>
}

/* ---------- ภูเขา SVG สำหรับมือถือ / reduced-motion ---------- */

function MountainsSVG() {
  return (
    <svg className="v3-mtn-svg" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="m3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c5c3c" /><stop offset="100%" stopColor="#0b3d1b" />
        </linearGradient>
        <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b3d1b" /><stop offset="100%" stopColor="#061a0e" />
        </linearGradient>
      </defs>
      <path d="M0,300 L180,150 L300,240 L430,120 L560,250 L700,170 L860,270 L1000,190 L1200,300 L1200,420 L0,420 Z" fill="url(#m3)" opacity=".55" />
      <path d="M0,340 L150,230 L290,320 L420,210 L580,330 L740,250 L900,340 L1060,260 L1200,350 L1200,420 L0,420 Z" fill="#123f22" opacity=".8" />
      <path d="M0,380 L200,290 L360,370 L520,280 L680,380 L840,300 L1010,385 L1200,320 L1200,420 L0,420 Z" fill="url(#m1)" />
    </svg>
  )
}

/* ---------- Module A: ก่อน–หลังรีโนเวท ---------- */

/**
 * สไลเดอร์ก่อน–หลัง
 *
 * ทำไมไม่เก็บตำแหน่งไว้ใน state: ถ้า setState ทุก pointermove React จะ re-render
 * ทั้ง component ทุกเฟรมที่ลาก ซึ่งเป็นสาเหตุที่การลากรู้สึกสะดุด ที่นี่จึงเก็บค่า
 * ไว้ใน ref แล้วเขียนลง DOM ตรง ๆ ใน requestAnimationFrame เฟรมละครั้ง
 *
 * ภาพบนคือ "ก่อน" ถูก clip ไว้ทางซ้ายตามสูตร inset(0 (100-x)% 0 0)
 * ซ้ายของด้ามจับจึงเป็นก่อน ขวาเป็นหลัง ตรงกับป้ายที่ติดไว้
 */
function BeforeAfter() {
  const wrapRef = useRef(null)
  const topRef = useRef(null)
  const handleRef = useRef(null)
  const pctRef = useRef(50)
  const rafRef = useRef(0)
  const draggingRef = useRef(false)

  const paint = useCallback(() => {
    rafRef.current = 0
    const pct = pctRef.current
    // สูตรหลัก: ภาพบนถูกครอบให้เหลือเฉพาะช่วง 0 → pct
    if (topRef.current) topRef.current.style.clipPath = `inset(0 ${100 - pct}% 0 0)`
    if (handleRef.current) handleRef.current.style.left = `${pct}%`
    wrapRef.current?.setAttribute('aria-valuenow', String(Math.round(pct)))
  }, [])

  const schedule = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(paint)
  }, [paint])

  const setFromClientX = useCallback((clientX) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pointerX = clientX - rect.left
    const pct = (pointerX / rect.width) * 100
    pctRef.current = Math.max(0, Math.min(100, pct))
    schedule()
  }, [schedule])

  const nudge = useCallback((delta) => {
    pctRef.current = Math.max(0, Math.min(100, pctRef.current + delta))
    schedule()
  }, [schedule])

  // วาดครั้งแรกให้ตรงกับค่าเริ่มต้น
  useEffect(() => {
    paint()
    return () => cancelAnimationFrame(rafRef.current)
  }, [paint])

  const onPointerDown = (e) => {
    draggingRef.current = true
    // จับ pointer ไว้กับ element เอง ลากออกนอกกรอบก็ยังตามต่อ ไม่ต้องผูก listener ที่ window
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setFromClientX(e.clientX)
  }
  const onPointerMove = (e) => {
    if (!draggingRef.current) return
    setFromClientX(e.clientX)
  }
  const endDrag = (e) => {
    draggingRef.current = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 2
    if (e.key === 'ArrowLeft') { nudge(-step); e.preventDefault() }
    else if (e.key === 'ArrowRight') { nudge(step); e.preventDefault() }
    else if (e.key === 'Home') { pctRef.current = 0; schedule(); e.preventDefault() }
    else if (e.key === 'End') { pctRef.current = 100; schedule(); e.preventDefault() }
  }

  return (
    <div
      className="v3-ba rv"
      ref={wrapRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      role="slider"
      tabIndex={0}
      aria-label="เลื่อนเปรียบเทียบก่อนและหลังรีโนเวท"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={50}
      aria-orientation="horizontal"
    >
      {/* ภาพล่าง = หลัง เห็นเต็มผืนเสมอ */}
      <img src={IMG.after} alt="สภาพบ้านหลังรีโนเวท" className="v3-ba-img" draggable="false" loading="lazy" decoding="async" />
      {/* ภาพบน = ก่อน ถูก clip เป็นม่านเปิดจากซ้าย */}
      <img ref={topRef} src={IMG.before} alt="สภาพบ้านก่อนรีโนเวท" className="v3-ba-img v3-ba-top" draggable="false" loading="lazy" decoding="async" />

      <span className="v3-ba-tag v3-ba-tag-l">ก่อน</span>
      <span className="v3-ba-tag v3-ba-tag-r">หลัง</span>

      <div className="v3-ba-line" ref={handleRef} aria-hidden="true">
        <span className="v3-ba-knob"><MoveHorizontal size={16} /></span>
      </div>
    </div>
  )
}

/**
 * หัวเรื่องที่เป็นหน้าต่างวิดีโอ
 *
 * ไม่ใช้ background-clip: text เพราะพังในหลายเบราว์เซอร์ ใช้ SVG <mask> ที่มี
 * ตัวอักษรสีขาวบนพื้นดำแทน แล้วเอา <video> ใส่ไว้ใน <foreignObject> ที่ผูกกับ mask นั้น
 *
 * ใต้วิดีโอมี <image> โปสเตอร์อยู่ในกลุ่มที่ถูก mask เดียวกัน ถ้าวิดีโอยังไม่มีไฟล์
 * หรือเล่นไม่ได้ ตัวอักษรจะยังเป็นหน้าต่างที่เห็นภาพนิ่ง ไม่กลายเป็นช่องว่างดำ
 */
function MaskedVideoHeadline({ lines, video, poster, maskId = 'workTextMask' }) {
  const W = 1200
  const FS = 132
  /**
   * ระยะบรรทัดคิดจากกล่องอักษรไทยจริง ไม่ใช่ขนาดฟอนต์
   * วัดจากเบราว์เซอร์: ที่ font-size 132 กล่องสูงราว 199 (ขึ้นเหนือเส้นฐาน ~1.10em
   * เพราะวรรณยุกต์สองชั้น และลงใต้เส้นฐาน ~0.42em เพราะสระล่าง)
   * ถ้าใช้ระยะบรรทัดน้อยกว่านี้ วรรณยุกต์ของบรรทัดล่างจะทับบรรทัดบน
   */
  const ASC = Math.round(FS * 1.10)
  const DESC = Math.round(FS * 0.42)
  const LINE_H = Math.round(FS * 1.63)
  const PAD = 16
  const H = PAD * 2 + ASC + DESC + LINE_H * (lines.length - 1)
  const baselineOf = (i) => PAD + ASC + i * LINE_H

  return (
    <div className="v3-mv rv">
      <svg
        className="v3-mv-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={lines.join(' ')}
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            <rect x="0" y="0" width={W} height={H} fill="#000" />
            {lines.map((line, i) => (
              <text
                key={i}
                x={W / 2}
                y={baselineOf(i)}
                fill="#fff"
                textAnchor="middle"
                fontFamily="Prompt, sans-serif"
                fontWeight="700"
                fontSize={FS}
              >
                {line}
              </text>
            ))}
          </mask>
        </defs>

        <g mask={`url(#${maskId})`}>
          {/* ชั้นสำรอง อยู่หลังวิดีโอ */}
          <image
            href={poster}
            x="0" y="0" width={W} height={H}
            preserveAspectRatio="xMidYMid slice"
          />
          <foreignObject x="0" y="0" width={W} height={H}>
            <video
              xmlns="http://www.w3.org/1999/xhtml"
              className="v3-mv-video"
              src={video}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              tabIndex={-1}
              aria-hidden="true"
            />
          </foreignObject>
        </g>
      </svg>
    </div>
  )
}

/* ---------- Module B: ไฟฉายส่องแปลนบ้าน ---------- */

const PLAN_PATHS = [
  'M60,60 L540,60 L540,360 L60,360 Z',
  'M60,200 L330,200', 'M330,60 L330,360', 'M330,250 L540,250',
  'M180,200 L180,360', 'M430,60 L430,250',
]
const PLAN_NODES = [[60,60],[330,60],[430,60],[540,60],[60,200],[180,200],[330,200],[330,250],[430,250],[540,250],[60,360],[180,360],[330,360],[540,360]]
const PLAN_LABELS = [
  { x: 195, y: 135, t: 'ห้องนอนใหญ่' }, { x: 385, y: 160, t: 'ห้องนั่งเล่น' },
  { x: 120, y: 285, t: 'ห้องนอน 2' }, { x: 255, y: 285, t: 'ห้องนอน 3' },
  { x: 435, y: 310, t: 'ครัว' }, { x: 487, y: 160, t: 'ห้องน้ำ' },
]

function Spotlight() {
  const ref = useRef(null)
  const coarse = useIsCoarse()

  useEffect(() => {
    if (coarse) return
    const el = ref.current
    if (!el) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mouse-x', `${e.clientX - r.left}px`)
      el.style.setProperty('--mouse-y', `${e.clientY - r.top}px`)
    }
    el.addEventListener('mousemove', move)
    return () => el.removeEventListener('mousemove', move)
  }, [coarse])

  return (
    <div className={`v3-spot rv ${coarse ? 'is-coarse' : ''}`} ref={ref}>
      <div className="v3-spot-base"><PlanSVG dim /></div>
      <div className="v3-spot-lit"><PlanSVG /></div>
      <div className="v3-spot-copy">
        <p className="v3-eyebrow">FLOOR PLAN</p>
        <h3>เห็นผังจริงก่อนไปดูบ้าน</h3>
        <p className="v3-spot-note">
          {coarse ? 'ทุกหลังมีแปลนพร้อมขนาดห้องจริง' : 'เลื่อนเมาส์เพื่อส่องดูผัง'}
        </p>
      </div>
    </div>
  )
}

function PlanSVG({ dim = false }) {
  return (
    <svg className="v3-plan" viewBox="0 0 600 420" aria-hidden="true">
      {PLAN_PATHS.map((d, i) => (
        <path key={i} d={d} pathLength="1" className="v3-plan-line rv" style={{ '--d': `${i * 120}ms` }}
          stroke={dim ? 'rgba(245,242,235,.14)' : '#C8A24A'} />
      ))}
      {PLAN_NODES.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill={dim ? 'rgba(245,242,235,.18)' : '#C8A24A'} />
      ))}
      {PLAN_LABELS.map((l, i) => (
        <text key={i} x={l.x} y={l.y} className="v3-plan-label"
          fill={dim ? 'rgba(245,242,235,.22)' : 'rgba(245,242,235,.85)'}>{l.t}</text>
      ))}
    </svg>
  )
}

/* ---------- Module C: วิดีโอ scrub ตาม scroll ---------- */

function ScrubVideo({ onLoaded, coarse }) {
  const secRef = useRef(null)
  const vidRef = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (coarse || failed) return
    const sec = secRef.current
    const vid = vidRef.current
    if (!sec || !vid) return

    let raf = 0
    let want = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!vid.duration || Number.isNaN(vid.duration)) return
      const r = sec.getBoundingClientRect()
      const max = r.height - window.innerHeight
      if (max <= 0) return
      const f = Math.max(0, Math.min(1, -r.top / max))
      want = f * vid.duration
      // ขยับทีละน้อยแทนการกระโดด ทำให้ seek ลื่นกว่า
      if (Math.abs(vid.currentTime - want) > 0.02) {
        vid.currentTime += (want - vid.currentTime) * 0.28
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [coarse, failed])

  return (
    <section className={`v3-scrub ${coarse ? 'is-coarse' : ''}`} ref={secRef}>
      <div className="v3-scrub-sticky">
        <div className="v3-scrub-bg" />
        <h2 className="v3-scrub-type">เปิดประตู<br />สู่บ้านหลังใหม่</h2>
        {!failed ? (
          <video
            ref={vidRef} className="v3-scrub-vid" src={IMG.scrubVideo} poster={IMG.scrubPoster}
            muted playsInline preload="metadata" tabIndex={-1}
            controls={coarse}
            onLoadedData={onLoaded}
            onError={() => { setFailed(true); onLoaded?.() }}
          />
        ) : (
          <img className="v3-scrub-vid" src={IMG.scrubPoster} alt="ภายในบ้าน" />
        )}
        <p className="v3-scrub-hint">{coarse ? 'กดเพื่อเล่น' : 'เลื่อนลงเพื่อเดินเข้าบ้าน'}</p>
      </div>
    </section>
  )
}

/* ---------- props ลอย + parallax ---------- */

function FloatingProps({ px, py, enabled }) {
  if (!enabled) return null
  const layers = [
    { d: 30, top: '18%', left: '7%', dur: '5.2s', delay: '0s', size: 74, kind: 'house' },
    { d: 18, top: '64%', left: '12%', dur: '4.4s', delay: '.7s', size: 52, kind: 'key' },
    { d: 8, top: '26%', left: '86%', dur: '6s', delay: '.3s', size: 58, kind: 'pin' },
    { d: 24, top: '72%', left: '81%', dur: '4.8s', delay: '1.1s', size: 46, kind: 'house' },
  ]
  return (
    <div className="v3-props" aria-hidden="true">
      {layers.map((l, i) => (
        <div key={i} className="v3-prop" style={{
          top: l.top, left: l.left,
          transform: `translate3d(${px * l.d}px, ${py * l.d * 0.5}px, 0)`,
        }}>
          <div className="v3-prop-float" style={{ animationDuration: l.dur, animationDelay: l.delay }}>
            <PropGlyph kind={l.kind} size={l.size} />
          </div>
        </div>
      ))}
    </div>
  )
}

function PropGlyph({ kind, size }) {
  const c = { width: size, height: size, display: 'block' }
  if (kind === 'house') return (
    <svg style={c} viewBox="0 0 64 64"><path d="M32 8 L58 30 H50 V56 H38 V40 H26 V56 H14 V30 H6 Z" fill="#C8A24A" /><path d="M32 8 L58 30 H50 V56 H32 Z" fill="#a8842f" /></svg>
  )
  if (kind === 'key') return (
    <svg style={c} viewBox="0 0 64 64"><circle cx="20" cy="20" r="13" fill="none" stroke="#F5F2EB" strokeWidth="6" /><path d="M28 28 L54 54 M44 44 L52 36 M38 38 L46 30" stroke="#F5F2EB" strokeWidth="6" strokeLinecap="round" fill="none" /></svg>
  )
  return (
    <svg style={c} viewBox="0 0 64 64"><path d="M32 4c-10 0-18 8-18 18 0 13 18 38 18 38s18-25 18-38c0-10-8-18-18-18z" fill="#C8A24A" /><circle cx="32" cy="22" r="7" fill="#061a0e" /></svg>
  )
}

/* ---------- มุมจอ: อากาศ + เวลา ---------- */

function CornerWidgets() {
  const [temp, setTemp] = useState(null)
  const [time, setTime] = useState('--:--')

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false,
    })
    const tick = () => setTime(fmt.format(new Date()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let alive = true
    const PHETCHABUN = { lat: 16.4193, lon: 101.1591 }

    const fetchWx = async ({ lat, lon }) => {
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`)
        const j = await r.json()
        const t = j?.current?.temperature_2m
        if (alive && typeof t === 'number') setTemp(Math.round(t))
      } catch { /* ปล่อยให้ค้างที่ --° ตาม failsafe */ }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => fetchWx({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => fetchWx(PHETCHABUN),
        { timeout: 5000, maximumAge: 600000 }
      )
    } else fetchWx(PHETCHABUN)

    return () => { alive = false }
  }, [])

  return (
    <>
      <div className="v3-corner v3-corner-bl">เพชรบูรณ์ · {temp === null ? '--' : temp}°C</div>
      <div className="v3-corner v3-corner-br">{time} ICT</div>
    </>
  )
}

/* ============================ หน้า ============================ */

export default function V3() {
  const reduced = usePrefersReducedMotion()
  const coarse = useIsCoarse()

  const use3D = !coarse && !reduced

  /**
   * นับเฉพาะของที่จำเป็นต่อการวาดจอแรกจริง ๆ
   * ภาพก่อน/หลังและแกลเลอรีอยู่ใต้จอแรก เอามานับด้วยจะหน่วงการเปิดหน้าเปล่า ๆ
   * เดสก์ท็อป: ฟอนต์ + ฉาก 3D (hero ไม่ใช้รูปเลย เป็น WebGL + gradient)
   * มือถือ: ฟอนต์ + ภาพภูเขาที่ใช้แทน WebGL
   */
  const preload = useMemo(() => (use3D ? [] : [IMG.heroMobile]), [use3D])
  const { pct, done, bump } = useAssetLoader(preload, use3D ? 1 : 0)

  const [revealed, setRevealed] = useState(false)
  const [statsRun, setStatsRun] = useState(false)
  const [ptr, setPtr] = useState({ x: 0, y: 0 })

  const heroRef = useRef(null)
  const canvasRef = useRef(null)
  const terrainRef = useRef(null)
  const statsRef = useRef(null)

  /* เผยหน้าเมื่อ asset ครบ */
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setRevealed(true), 260)
    return () => clearTimeout(t)
  }, [done])

  useReveal(revealed)

  /* Lenis — เฉพาะเดสก์ท็อปและเมื่อไม่ได้ขอ reduced motion */
  useEffect(() => {
    if (!revealed || coarse || reduced) return
    let lenis
    let raf = 0
    let alive = true
    import('lenis').then(({ default: Lenis }) => {
      if (!alive) return
      lenis = new Lenis({ duration: 1.1, smoothWheel: true, syncTouch: false })
      const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop) }
      raf = requestAnimationFrame(loop)
    }).catch(() => {})
    return () => { alive = false; cancelAnimationFrame(raf); lenis?.destroy() }
  }, [revealed, coarse, reduced])

  /* ทิวเขา 3D — โหลดเฉพาะเดสก์ท็อป */
  useEffect(() => {
    if (!use3D || !canvasRef.current) return
    let alive = true
    import('../lib/v3Terrain').then(({ initTerrain }) => {
      if (!alive) return
      return initTerrain(canvasRef.current, { onReady: bump })
    }).then((t) => {
      if (!alive) { t?.dispose(); return }
      terrainRef.current = t
    }).catch(() => bump())
    return () => { alive = false; terrainRef.current?.dispose(); terrainRef.current = null }
  }, [use3D, bump])

  /* parallax ตามเมาส์ */
  useEffect(() => {
    if (coarse || reduced) return
    const move = (e) => {
      const x = e.clientX / window.innerWidth - 0.5
      const y = e.clientY / window.innerHeight - 0.5
      setPtr({ x, y })
      terrainRef.current?.setPointer(x, y)
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [coarse, reduced])

  /* ตัวเลขนับเมื่อเลื่อนถึง */
  useEffect(() => {
    if (!revealed || !statsRef.current) return
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { setStatsRun(true); io.disconnect() }
    }, { threshold: 0.4 })
    io.observe(statsRef.current)
    return () => io.disconnect()
  }, [revealed])

  return (
    <>
      <Head>
        <title>Startup Up — บ้านพร้อมอยู่ เชิงเขาเพชรบูรณ์</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://api.open-meteo.com" />
      </Head>

      <div className={`v3 ${revealed ? 'is-revealed' : ''}`}>

        {/* ---------------- LOADER ---------------- */}
        <div className={`v3-loader ${done ? 'is-done' : ''}`} aria-hidden={done}>
          <div className="v3-loader-inner">
            <span className="v3-loader-mark">SU</span>
            <div className="v3-loader-bar"><i style={{ width: `${pct}%` }} /></div>
            <span className="v3-loader-pct">{String(pct).padStart(3, '0')}</span>
          </div>
        </div>

        {/* ---------------- ป้ายข้าง + มุมจอ ---------------- */}
        <span className="v3-side">STARTUP UP — PHETCHABUN</span>
        <CornerWidgets />

        {/* ---------------- HERO ---------------- */}
        <section className="v3-hero" ref={heroRef}>
          <div className="v3-sun" />
          {!use3D && <img src={IMG.heroMobile} alt="" className="v3-hero-photo" />}

          <div className="v3-hero-type">
            <p className="v3-eyebrow v3-hero-eyebrow">STARTUP UP PROPERTY</p>
            <h1>{HERO_LINES.map((l, i) => <span key={i}>{l}</span>)}</h1>
          </div>

          {use3D
            ? <canvas ref={canvasRef} className="v3-canvas" />
            : <MountainsSVG />}

          <FloatingProps px={ptr.x} py={ptr.y} enabled={use3D} />

          <div className="v3-hero-foot">
            <a href="#work" className="v3-btn">ดูบ้านที่คัดไว้ <ArrowRight size={16} /></a>
            <a href="tel:0800000000" className="v3-link"><Phone size={14} /> 080-000-0000</a>
          </div>
        </section>

        {/* ---------------- INTRO + STATS ---------------- */}
        <section className="v3-intro">
          <div className="v3-wrap">
            <LineReveal lines={INTRO_LINES} as="h2" className="v3-intro-type" />
            <div className="v3-stats" ref={statsRef}>
              {STATS.map((s, i) => (
                <div className="v3-stat rv" key={s.label} style={{ '--d': `${i * 110}ms` }}>
                  <strong><CountUp to={s.n} suffix={s.suffix} run={statsRun} /></strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- MODULE A ---------------- */}
        <section className="v3-work" id="work">
          <div className="v3-wrap">
            <p className="v3-work-eyebrow rv">RENOVATION</p>

            <MaskedVideoHeadline
              lines={['เปิดประตู', 'สู่บ้านหลังใหม่']}
              video={IMG.scrubVideo}
              poster={IMG.scrubPoster}
            />

            <p className="v3-work-lead rv">ลากเพื่อดูสภาพจริงก่อนเราเข้าไปปรับปรุง</p>

            <BeforeAfter />

            <p className="v3-work-note rv">
              ภาพตัวอย่างชั่วคราว (คนละหลัง) — เปลี่ยนเป็นภาพบ้านหลังเดียวกันมุมเดียวกันได้ที่ IMG.before / IMG.after
            </p>
          </div>
        </section>

        {/* ---------------- MODULE B ---------------- */}
        <section className="v3-section v3-section-dark">
          <div className="v3-wrap"><Spotlight /></div>
        </section>

        {/* ---------------- MODULE C ---------------- */}
        <ScrubVideo onLoaded={() => {}} coarse={coarse} />

        {/* ---------------- GALLERY ---------------- */}
        <section className="v3-section">
          <div className="v3-wrap">
            <header className="v3-head rv">
              <p className="v3-eyebrow">CRAFT</p>
              <LineReveal lines={GALLERY_LINES} as="h2" />
            </header>

            <div className="v3-gal">
              <div className="v3-gal-col rv">
                <img src={IMG.gallerySide} alt="รายละเอียดงานไม้ภายในบ้าน" className="v3-gal-side v3-gray" loading="lazy" decoding="async" />
                <p className="v3-gal-cap">งานไม้ทำใหม่ทั้งหลัง · หล่มสัก</p>
              </div>
              <div className="v3-gal-main rv" style={{ '--d': '120ms' }}>
                <img src={IMG.galleryMain} alt="ห้องนั่งเล่นหลังปรับปรุง" loading="lazy" decoding="async" />
                <div className="v3-gal-pip">
                  <img src={IMG.galleryPip} alt="รายละเอียดมุมครัว" loading="lazy" decoding="async" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="v3-cta">
          <div className="v3-wrap">
            <LineReveal lines={['พร้อมดูบ้านจริง', 'เมื่อไหร่ก็บอกได้']} as="h2" className="v3-cta-type" />
            <a href="tel:0800000000" className="v3-btn v3-btn-lg rv">
              นัดเข้าชม <ArrowUpRight size={18} />
            </a>
          </div>
          <footer className="v3-footer">
            <span>© {new Date().getFullYear()} Startup Up</span>
            <span>เพชรบูรณ์ · ประเทศไทย</span>
          </footer>
        </section>
      </div>

      <style jsx global>{`
        /* ================= tokens ================= */
        .v3 {
          --ink: #0B3D1B;
          --deep: #061A0E;
          --paper: #F5F2EB;
          --accent: #C8A24A;
          --mono: ui-monospace, "JetBrains Mono", "IBM Plex Mono", Menlo, monospace;

          font-family: 'Prompt', sans-serif;
          background: var(--deep);
          color: var(--paper);
          overflow-x: hidden;
          opacity: 0;
          transition: opacity .6s ease;
        }
        .v3.is-revealed { opacity: 1; }
        .v3 * { box-sizing: border-box; }
        .v3 h1, .v3 h2, .v3 h3 { margin: 0; }
        .v3 p { margin: 0; }
        .v3 a { text-decoration: none; color: inherit; }
        .v3-wrap { width: 100%; max-width: 1240px; margin: 0 auto; padding: 0 clamp(20px, 4vw, 48px); }

        /* ================= reveal ================= */
        .v3 .rv { opacity: 0; transform: translateY(30px); transition: opacity .8s ease, transform .8s cubic-bezier(.16,1,.3,1); transition-delay: var(--d, 0ms); }
        .v3 .rv.is-in { opacity: 1; transform: none; }

        /* ข้อความเผยทีละบรรทัด — เผื่อความสูงให้สระบน/วรรณยุกต์ไทยไม่โดนตัด */
        .v3 .lr { display: block; }
        .v3 .lr-mask { display: block; overflow: hidden; padding-top: .18em; margin-top: -.18em; }
        /* กล่องนอกเป็นตัวกระตุ้นอย่างเดียว — ถ้าใส่ .rv ที่ตัวบรรทัด IntersectionObserver
           จะมองไม่เห็นเลย เพราะบรรทัดถูก .lr-mask (overflow:hidden) บังไว้ 100% */
        .v3 .lr.rv { opacity: 1; transform: none; }
        .v3 .lr-line { display: block; line-height: 1.5; transform: translateY(105%); opacity: 1; transition: transform .9s cubic-bezier(.16,1,.3,1); transition-delay: var(--d, 0ms); }
        .v3 .lr.is-in .lr-line { transform: translateY(0); }

        @media (prefers-reduced-motion: reduce) {
          .v3 .rv, .v3 .lr-line { opacity: 1 !important; transform: none !important; transition: none !important; }
        }

        /* ================= loader ================= */
        .v3-loader { position: fixed; inset: 0; z-index: 200; background: var(--deep); display: grid; place-items: center; transition: opacity .7s ease, visibility .7s; }
        .v3-loader.is-done { opacity: 0; visibility: hidden; }
        .v3-loader-inner { display: flex; flex-direction: column; align-items: center; gap: 22px; }
        .v3-loader-mark { font-size: 13px; letter-spacing: .5em; color: var(--accent); font-weight: 600; }
        .v3-loader-bar { width: min(46vw, 320px); height: 2px; background: rgba(245,242,235,.16); overflow: hidden; }
        .v3-loader-bar i { display: block; height: 100%; background: var(--accent); transition: width .35s ease; }
        .v3-loader-pct { font-family: var(--mono); font-size: 11px; letter-spacing: .1em; color: rgba(245,242,235,.6); }

        /* ================= ป้ายข้าง + มุมจอ ================= */
        .v3-side { position: fixed; right: 16px; top: 50%; transform: translateY(-50%); writing-mode: vertical-rl; z-index: 40; font-family: var(--mono); font-size: 11px; letter-spacing: .2em; color: rgba(245,242,235,.42); pointer-events: none; }
        .v3-corner { position: fixed; bottom: 18px; z-index: 40; font-family: var(--mono); font-size: 11px; letter-spacing: .1em; color: rgba(245,242,235,.5); pointer-events: none; }
        .v3-corner-bl { left: 20px; }
        .v3-corner-br { right: 20px; }

        /* ================= hero ================= */
        .v3-hero { position: relative; min-height: 100svh; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
        .v3-sun { position: absolute; inset: 0; z-index: 1; background: radial-gradient(72% 54% at 50% 40%, rgba(232,196,110,1) 0%, rgba(200,162,74,.8) 18%, rgba(140,110,48,.45) 38%, rgba(11,61,27,.5) 62%, rgba(6,26,14,1) 86%); }
        .v3-hero-photo { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; object-fit: cover; opacity: .32; mix-blend-mode: luminosity; }

        .v3-hero-type { position: relative; z-index: 2; text-align: center; padding: 0 20px; margin-bottom: 4vh; }
        .v3-hero-type h1 { font-size: clamp(2.6rem, 11vw, 9rem); font-weight: 700; line-height: 1.05; letter-spacing: -0.01em; }
        .v3-hero-type h1 span { display: block; }
        .v3-hero-eyebrow { margin-bottom: clamp(14px, 2vw, 26px); }
        .v3-eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: .28em; color: var(--accent); text-transform: uppercase; }

        /* canvas ทับหน้าตัวอักษร -> ยอดเขาบังตัวอักษรส่วนล่าง */
        .v3-canvas, .v3-mtn-svg { position: absolute; inset: 0; z-index: 3; width: 100%; height: 100%; pointer-events: none; }
        .v3-mtn-svg { top: auto; bottom: 0; height: 58%; }

        .v3-hero-foot { position: relative; z-index: 4; margin-top: auto; padding: 0 clamp(20px, 4vw, 48px) clamp(56px, 8vh, 90px); display: flex; flex-wrap: wrap; align-items: center; gap: 18px; justify-content: center; }
        .v3-link { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 12px; letter-spacing: .08em; color: rgba(245,242,235,.65); transition: color .3s; }
        .v3-link:hover { color: var(--accent); }

        /* ================= props ลอย ================= */
        .v3-props { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
        .v3-prop { position: absolute; filter: drop-shadow(0 20px 30px rgba(6,26,14,.55)); will-change: transform; }
        .v3-prop-float { animation-name: v3float; animation-timing-function: ease-in-out; animation-iteration-count: infinite; animation-direction: alternate; }
        @keyframes v3float { from { transform: translateY(0); } to { transform: translateY(-6px); } }

        /* ================= ปุ่ม ================= */
        .v3 .v3-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; background: var(--accent); color: var(--deep); font-weight: 600; font-size: 15px; padding: 14px 30px; border-radius: 999px; border: 1px solid var(--accent); transition: background .3s, color .3s, transform .3s; }
        .v3 .v3-btn:hover { background: transparent; color: var(--accent); transform: translateY(-2px); }
        .v3 .v3-btn-lg { font-size: 17px; padding: 18px 42px; margin-top: 36px; }

        /* ================= intro ================= */
        .v3-intro { padding: clamp(80px, 14vh, 170px) 0; background: var(--deep); }
        .v3-intro-type { font-size: clamp(1.4rem, 3.4vw, 2.9rem); font-weight: 500; line-height: 1.5; max-width: min(100%, 32ch); }
        .v3-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; margin-top: clamp(48px, 8vh, 90px); border-top: 1px solid rgba(245,242,235,.12); padding-top: 36px; }
        .v3-stat strong { display: block; font-size: clamp(2rem, 4.6vw, 3.6rem); font-weight: 700; color: var(--accent); line-height: 1.1; }
        .v3-stat span { font-size: 13px; font-weight: 300; color: rgba(245,242,235,.6); }

        /* ================= section ================= */
        .v3-section { padding: clamp(70px, 12vh, 150px) 0; background: var(--paper); color: var(--ink); }
        .v3-section-dark { background: var(--deep); color: var(--paper); }
        .v3-head { margin-bottom: clamp(34px, 6vh, 64px); }
        .v3-head h2 { font-size: clamp(1.9rem, 5vw, 3.6rem); font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; margin-top: 12px; }
        .v3-lead { margin-top: 14px; font-weight: 300; opacity: .65; }
        .v3-section .v3-eyebrow { color: #8a7330; }

        /* ================= before / after ================= */
        /* ================= #work — สองสีเท่านั้น ================= */
        /* พาเลตต์ของ section นี้ถูกล็อกไว้ที่ near-black + warm cream
           ไม่มีสีทอง ไม่มีเขียว ตามข้อกำหนด two-color constraint */
        .v3-work {
          --work-bg: #0D0D0D;
          --work-fg: #F5F2EB;
          background: var(--work-bg);
          color: var(--work-fg);
          padding: clamp(70px, 12vh, 150px) 0;
        }
        /* ต้องนำหน้าด้วย .v3 ให้ชนะ ".v3 p { margin: 0 }" ที่ specificity สูงกว่า
           ไม่งั้น margin ถูกกลืนหมดและข้อความจะไปติดขอบสไลเดอร์ */
        .v3 .v3-work-eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: .28em; text-transform: uppercase; color: var(--work-fg); opacity: .55; text-align: center; margin: 0; }
        .v3 .v3-work-lead { margin: clamp(26px, 5vh, 48px) 0 clamp(20px, 3vh, 34px); text-align: center; font-weight: 300; color: var(--work-fg); opacity: .62; }
        .v3 .v3-work-note { margin: 20px 0 0; font-family: var(--mono); font-size: 11px; letter-spacing: .06em; color: var(--work-fg); opacity: .38; }

        /* ---- หัวเรื่องหน้าต่างวิดีโอ ---- */
        .v3-mv { margin-top: clamp(18px, 3vh, 34px); }
        .v3-mv-svg { display: block; width: 100%; height: auto; }
        .v3-mv-video { width: 100%; height: 100%; object-fit: cover; display: block; border: 0; }

        /* ---- สไลเดอร์ก่อน–หลัง ---- */
        .v3-ba { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: 20px; overflow: hidden; cursor: ew-resize; touch-action: none; background: var(--work-bg); user-select: none; }
        .v3-ba:focus-visible { outline: 2px solid var(--work-fg); outline-offset: 4px; }
        .v3-ba-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; user-select: none; -webkit-user-drag: none; }
        /* ค่าเริ่มต้น 50% — JS เขียนทับด้วย clip-path/left ตรง ๆ ทุกเฟรมที่ลาก */
        .v3-ba-top { clip-path: inset(0 50% 0 0); }
        .v3-ba-line { position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; background: var(--work-fg); transform: translateX(-1px); pointer-events: none; }
        .v3-ba-knob { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 44px; height: 44px; border-radius: 50%; background: var(--work-fg); color: var(--work-bg); display: grid; place-items: center; box-shadow: 0 6px 20px rgba(0,0,0,.45); }
        .v3-ba-tag { position: absolute; top: 16px; font-family: var(--mono); font-size: 11px; letter-spacing: .14em; padding: 6px 12px; border-radius: 999px; background: rgba(13,13,13,.68); color: var(--work-fg); pointer-events: none; }
        .v3-ba-tag-l { left: 16px; } .v3-ba-tag-r { right: 16px; }

        /* ================= spotlight + แปลนบ้าน ================= */
        .v3-spot { position: relative; border-radius: 22px; overflow: hidden; background: var(--deep); border: 1px solid rgba(245,242,235,.1); min-height: clamp(420px, 62vh, 620px); display: grid; }
        .v3-spot-base, .v3-spot-lit { grid-area: 1 / 1; display: grid; place-items: center; padding: 40px; }
        .v3-spot-lit { -webkit-mask-image: radial-gradient(circle 190px at var(--mouse-x, -999px) var(--mouse-y, -999px), #000 0%, #000 42%, transparent 72%); mask-image: radial-gradient(circle 190px at var(--mouse-x, -999px) var(--mouse-y, -999px), #000 0%, #000 42%, transparent 72%); }
        .v3-spot.is-coarse .v3-spot-lit { -webkit-mask-image: none; mask-image: none; }
        .v3-plan { width: min(100%, 620px); height: auto; }
        .v3-plan-line { fill: none; stroke-width: 1.6; stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1); transition-delay: var(--d, 0ms); opacity: 1; transform: none; }
        .v3-plan-line.is-in { stroke-dashoffset: 0; }
        .v3-plan-label { font-family: 'Prompt', sans-serif; font-size: 13px; text-anchor: middle; }
        .v3-spot-copy { grid-area: 1 / 1; align-self: end; padding: 30px; pointer-events: none; }
        .v3-spot-copy h3 { font-size: clamp(1.3rem, 2.6vw, 2rem); font-weight: 600; margin-top: 10px; }
        .v3-spot-note { margin-top: 8px; font-family: var(--mono); font-size: 11px; letter-spacing: .1em; color: rgba(245,242,235,.45); }

        /* ================= scrub video ================= */
        .v3-scrub { position: relative; height: 300vh; background: var(--deep); }
        .v3-scrub.is-coarse { height: auto; }
        .v3-scrub-sticky { position: sticky; top: 0; height: 100svh; overflow: hidden; display: grid; place-items: center; }
        .v3-scrub.is-coarse .v3-scrub-sticky { position: static; height: auto; padding: 70px 0; }
        .v3-scrub-bg { position: absolute; inset: 0; background: radial-gradient(70% 55% at 50% 55%, rgba(200,162,74,.2), rgba(6,26,14,1) 70%); }
        .v3-scrub-type { position: relative; z-index: 2; font-size: clamp(1.8rem, 6vw, 5rem); font-weight: 700; line-height: 1.15; text-align: center; }
        .v3-scrub-vid { position: absolute; z-index: 3; width: min(74vw, 900px); aspect-ratio: 16/9; object-fit: cover; border-radius: 18px; box-shadow: 0 40px 80px -40px rgba(0,0,0,.9); }
        .v3-scrub.is-coarse .v3-scrub-vid { position: relative; width: min(92vw, 900px); margin: 24px auto 0; display: block; }
        .v3-scrub-hint { position: absolute; z-index: 4; bottom: 42px; font-family: var(--mono); font-size: 11px; letter-spacing: .14em; color: rgba(245,242,235,.5); }
        .v3-scrub.is-coarse .v3-scrub-hint { position: static; text-align: center; margin-top: 16px; }

        /* ================= gallery แบบไม่สมมาตร ================= */
        .v3-gal { display: grid; grid-template-columns: 1fr 1.4fr; gap: clamp(20px, 4vw, 56px); align-items: end; }
        .v3-gal-col { padding-bottom: clamp(20px, 6vh, 70px); }
        .v3-gal-side { width: 100%; border-radius: 16px; aspect-ratio: 3/4; object-fit: cover; }
        .v3-gal-cap { margin-top: 14px; font-family: var(--mono); font-size: 11px; letter-spacing: .1em; opacity: .55; }
        .v3-gal-main { position: relative; transform: translateY(-24px); }
        .v3-gal-main img { width: 100%; border-radius: 20px; aspect-ratio: 4/3; object-fit: cover; }
        .v3-gal-pip { position: absolute; right: -6%; bottom: -12%; width: 42%; border-radius: 16px; border: 8px solid var(--paper); overflow: hidden; box-shadow: 0 30px 60px -30px rgba(6,26,14,.55); }
        .v3-gal-pip img { border-radius: 8px; aspect-ratio: 1/1; display: block; }
        /* ขาวดำใช้ได้เฉพาะภาพ editorial — ห้ามใช้กับรูปประกาศขายบ้าน */
        .v3-gray { filter: grayscale(1); transition: filter .7s ease; }
        .v3-gray:hover { filter: grayscale(0); }

        /* ================= cta ================= */
        .v3-cta { background: var(--deep); padding: clamp(90px, 16vh, 190px) 0 0; text-align: center; }
        .v3-cta-type { font-size: clamp(2rem, 6vw, 4.4rem); font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; }
        .v3-cta .lr { display: inline-block; }
        .v3-footer { margin-top: clamp(70px, 12vh, 130px); border-top: 1px solid rgba(245,242,235,.1); padding: 24px clamp(20px, 4vw, 48px); display: flex; justify-content: space-between; gap: 16px; font-family: var(--mono); font-size: 11px; letter-spacing: .1em; color: rgba(245,242,235,.42); }

        /* ================= responsive ================= */
        @media (max-width: 860px) {
          .v3-side { display: none; }
          .v3-gal { grid-template-columns: 1fr; }
          .v3-gal-main { transform: none; }
          .v3-gal-pip { right: 4%; bottom: -8%; width: 38%; border-width: 6px; }
          .v3-gal-col { padding-bottom: 0; }
          .v3-stats { grid-template-columns: 1fr; gap: 22px; }
          .v3-hero-foot { justify-content: flex-start; }
          .v3-spot-copy { padding: 20px; }
        }
        @media (max-width: 520px) {
          .v3-corner { font-size: 10px; }
          .v3-ba { aspect-ratio: 4/3; }
        }
      `}</style>
    </>
  )
}
