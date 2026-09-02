import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Head from 'next/head'
import {
  Phone, Menu, X, ChevronLeft, ChevronRight, MapPin, Maximize, Bed, Bath,
  ShieldCheck, HandCoins, MessageCircle, Sparkles, Quote, ArrowRight,
  CalendarCheck, Calculator, Landmark, Wrench, ThumbsUp,
} from 'lucide-react'

/* ============================================================================
   หน้าตัวอย่างดีไซน์ใหม่ — เปิดที่ /v2
   ไม่แตะ pages/index.js และ styles/globals.css ทุก style อยู่ในไฟล์นี้ไฟล์เดียว

   ► เปลี่ยนรูปทั้งหมดได้ที่ IMG ด้านล่างนี้จุดเดียว
     ใส่เป็น path ในโฟลเดอร์ public เช่น '/images/hero-1.jpg'
     หรือลิงก์ Cloudinary ของคุณก็ได้
   ========================================================================= */

const IMG = {
  hero: [
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80',
  ],
  band: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80',
  lifestyle: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=75',
  ],
  projects: [
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=75',
  ],
  avatars: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=75',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=75',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=75',
  ],
}

/* ---------- เนื้อหา แก้ข้อความได้ตรงนี้ ---------- */

const HERO = [
  { eyebrow: 'STARTUP UP PROPERTY', title: 'บ้านพร้อมอยู่ คัดมาแล้วทุกหลัง', sub: 'บ้านมือสองสภาพดีในเพชรบูรณ์และจังหวัดใกล้เคียง ตรวจโฉนดครบก่อนส่งถึงมือคุณ' },
  { eyebrow: 'ผ่อนสบาย', title: 'เริ่มต้นผ่อนหลักพัน เป็นเจ้าของได้จริง', sub: 'ทีมงานช่วยประเมินวงเงินและยื่นกู้กับหลายธนาคารให้ฟรี ไม่มีค่าใช้จ่ายแอบแฝง' },
  { eyebrow: 'ทำเลดี', title: 'เลือกทำเลที่ใช่ สำหรับทุกจังหวะชีวิต', sub: 'ใกล้โรงเรียน ตลาด และโรงพยาบาล พร้อมข้อมูลราคาตลาดจริงในย่านนั้น' },
]

const KPI = [
  { n: 98, suffix: '+', label: 'คะแนนความพอใจของลูกค้า' },
  { n: 1000, suffix: '+', label: 'ครอบครัวที่ได้บ้านกับเรา' },
  { n: 15, suffix: '+', label: 'ปีที่อยู่ในวงการอสังหาฯ' },
]

const LIFESTYLE = [
  { title: 'บ้านเดี่ยว', desc: 'พื้นที่ส่วนตัว มีสวนรอบบ้าน' },
  { title: 'ทาวน์โฮม', desc: 'คุ้มค่า ดูแลง่าย ใกล้เมือง' },
  { title: 'บ้านแฝด', desc: 'กว้างกว่าทาวน์โฮม ราคาจับต้องได้' },
  { title: 'ที่ดินเปล่า', desc: 'สร้างเองได้ตามใจ ทำเลดี' },
]

const PROJECTS = [
  { name: 'บ้านเดี่ยว ศุภาลัย ริเวอร์ วิลล์', loc: 'เมืองเพชรบูรณ์ - ในเมือง', price: '2.19', wah: 52, bed: 3, bath: 2, tag: 'แนะนำ' },
  { name: 'ทาวน์โฮม 2 ชั้น กลางเมือง', loc: 'หล่มสัก - ริมน้ำ', price: '1.69', wah: 24, bed: 3, bath: 2, tag: 'มาใหม่' },
  { name: 'บ้านแฝดพร้อมสวน', loc: 'วังชมภู - ท่าพล', price: '1.89', wah: 36, bed: 3, bath: 2 },
  { name: 'บ้านเดี่ยวชั้นเดียว หลังมุม', loc: 'หนองไผ่ - บ้านโภชน์', price: '1.45', wah: 48, bed: 2, bath: 1, tag: 'ลดพิเศษ' },
  { name: 'บ้านเดี่ยว 2 ชั้น ใกล้โรงเรียน', loc: 'เมืองเพชรบูรณ์ - สะเดียง', price: '2.55', wah: 60, bed: 4, bath: 3 },
  { name: 'ทาวน์โฮมใหม่ ใกล้ตลาด', loc: 'หล่มเก่า - นาแซง', price: '1.35', wah: 20, bed: 2, bath: 2 },
  { name: 'บ้านเดี่ยวพร้อมโอน', loc: 'ชนแดน - ดงขุย', price: '1.75', wah: 44, bed: 3, bath: 2, tag: 'พร้อมโอน' },
  { name: 'ที่ดินเปล่าติดถนนหลัก', loc: 'บึงสามพัน - ซับสมอทอด', price: '0.95', wah: 100, bed: 0, bath: 0 },
]

const BENEFITS = [
  { icon: Sparkles, title: 'เข้าอยู่ได้ทันที', desc: 'บ้านผ่านการตรวจสภาพและปรับปรุงเรียบร้อย ย้ายเข้าได้เลยไม่ต้องรอ' },
  { icon: HandCoins, title: 'ช่วยเรื่องสินเชื่อ', desc: 'ประเมินวงเงินและยื่นกู้กับหลายธนาคารให้ฟรี รู้ผลไวไม่ต้องวิ่งเอง' },
  { icon: MessageCircle, title: 'มีที่ปรึกษาส่วนตัว', desc: 'ทีมงานดูแลตั้งแต่เลือกบ้านจนถึงวันโอน ตอบทุกคำถามตลอดทาง' },
  { icon: ShieldCheck, title: 'เอกสารครบ ตรวจสอบได้', desc: 'ตรวจโฉนด ภาระผูกพัน และประวัติเจ้าของก่อนทุกดีล' },
]

const REVIEWS = [
  { name: 'คุณสมชาย ว.', role: 'เจ้าของบ้าน หล่มสัก', text: 'บ้านสภาพดีกว่าที่คิดไว้เยอะ ทีมงานพาดูหลายหลังจนเจอหลังที่ถูกใจ เรื่องกู้ก็ช่วยจัดการให้หมด ไม่ต้องวิ่งเอกสารเองเลย' },
  { name: 'คุณนภา ส.', role: 'เจ้าของบ้าน เมืองเพชรบูรณ์', text: 'ประทับใจตรงที่บอกข้อเสียของบ้านตามจริง ไม่ได้เชียร์อย่างเดียว ทำให้ตัดสินใจได้สบายใจ ตอนนี้ย้ายเข้าอยู่ครบปีแล้วไม่มีปัญหา' },
  { name: 'คุณอรรถพล ก.', role: 'เจ้าของบ้าน วังชมภู', text: 'ติดต่อง่าย ตอบไว นัดดูบ้านวันหยุดก็ได้ ราคาที่ได้ถือว่าคุ้มมากเมื่อเทียบกับบ้านใหม่ในทำเลเดียวกัน' },
]

/* ============================================================================
   ข้อมูลจริงจากเว็บหลัก
   ดึงจาก /api/public-data ตัวเดียวกับที่ pages/index.js ใช้ (Firestore ผ่านแคช)
   ถ้าดึงไม่สำเร็จ หน้าจะถอยกลับไปใช้ข้อมูลตัวอย่างด้านบนโดยอัตโนมัติ
   ========================================================================= */

/** ย่อรูปผ่าน Cloudinary/Unsplash — สูตรเดียวกับ getOptimizedImg ในเว็บหลัก */
const optImg = (url, width = 800) => {
  if (!url || typeof url !== 'string') return url
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`)
  }
  return url
}

/** 0624782426 → 062-478-2426 */
const fmtPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '')
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : String(p || '')
}

/** 3490000 → "3.49" (หน่วย ลบ.) */
const fmtPrice = (n) => {
  const v = Number(String(n).replace(/,/g, ''))
  if (!Number.isFinite(v) || v <= 0) return '-'
  return (v / 1e6).toFixed(2).replace(/\.?0+$/, '')
}

/** ไอคอนประจำ whyUs 1-6 ของเว็บหลัก (เรียงตามลำดับจริง) */
const BENEFIT_ICONS = [Sparkles, CalendarCheck, HandCoins, Calculator, Landmark, Wrench]

function useSiteData() {
  const [raw, setRaw] = useState(null)

  useEffect(() => {
    let alive = true
    fetch('/api/public-data')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => { if (alive && Array.isArray(d?.properties) && d.properties.length) setRaw(d) })
      .catch(() => { /* เงียบไว้ — ใช้ข้อมูลตัวอย่างต่อ */ })
    return () => { alive = false }
  }, [])

  return useMemo(() => {
    if (!raw) return null
    const props = raw.properties
    const company = raw.company || {}
    const visual = raw.visual || {}

    const availables = props.filter((p) => p.badge !== 'Sold Out')
    const soldCount = props.length - availables.length
    const locations = [...new Set(props.map((p) => p.main_location || p.district).filter(Boolean))]

    // จัดกลุ่มตามประเภทจริง แล้วใช้รูปแรกของประเภทนั้นเป็นหน้าปก
    const byCat = {}
    props.forEach((p) => { (byCat[p.category] = byCat[p.category] || []).push(p) })
    const lifestyle = Object.entries(byCat)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 4)
      .map(([cat, list]) => ({
        title: cat,
        desc: `${list.length} หลังในระบบ`,
        img: optImg(list.find((p) => p.images?.[0])?.images?.[0], 800),
      }))

    // บ้านโชว์ 8 หลัง: มาใหม่ก่อน แล้วโปรโมชั่น แล้วที่เหลือ (ข้ามหลังที่ขายแล้ว)
    const showcase = [
      ...availables.filter((p) => p.badge === 'New'),
      ...availables.filter((p) => p.badge === 'Promotion'),
      ...availables.filter((p) => !p.badge),
    ].filter((p) => p.images?.[0]).slice(0, 8)

    const projects = showcase.map((p) => ({
      name: p.project_name,
      loc: [p.main_location || p.district, p.sub_location || p.subdistrict].filter(Boolean).join(' · '),
      price: fmtPrice(p.price),
      wah: p.area_wah,
      bed: Number(p.bedrooms) || 0,
      bath: Number(p.bathrooms) || 0,
      tag: p.badge === 'New' ? 'มาใหม่' : p.badge === 'Promotion' ? 'โปรโมชั่น' : '',
      img: optImg(p.images[0], 800),
    }))

    // สไลด์ hero: ภาพจริงจากหลังบ้าน + ข้อความจริงจาก site_settings/visual
    const bgs = (Array.isArray(visual.heroBgs) && visual.heroBgs.length ? visual.heroBgs : projects.map((p) => p.img)).slice(0, 3)
    const hero = [
      {
        eyebrow: visual.heroTitle || company.name || 'STARTUP UP',
        title: visual.heroSubtitle || company.description || 'จุดเริ่มต้นของคนอยากมีบ้าน',
        sub: `${visual.homeTitle || 'ค้นหาบ้านที่ใช่สำหรับคุณ'} — บ้านมือสองคัดคุณภาพ ${availables.length} หลังพร้อมขายในปทุมธานีและใกล้เคียง`,
      },
      { eyebrow: 'ONE-STOP SERVICE', title: visual.whyUs1Title || 'One-Stop-Service', sub: visual.whyUs1Desc || '' },
      { eyebrow: 'AFTER SALE', title: visual.whyUs6Title || 'ดูแลหลังการขาย', sub: visual.whyUs6Desc || '' },
    ].map((h, i) => ({ ...h, img: optImg(bgs[i % bgs.length], 1920) }))

    const kpi = [
      { n: props.length, suffix: '', label: 'บ้านในระบบทั้งหมด (หลัง)' },
      { n: soldCount, suffix: '', label: 'ส่งมอบแล้ว (หลัง)' },
      { n: locations.length, suffix: '', label: 'ทำเลที่ครอบคลุม' },
    ]

    const benefits = []
    for (let i = 1; i <= 6; i++) {
      const title = visual[`whyUs${i}Title`]
      if (title) benefits.push({ title, desc: visual[`whyUs${i}Desc`] || '' })
    }

    const portfolio = {
      title: visual.portfolioTitle || 'ผลงานของเรา',
      years: (Array.isArray(company.portfolio_years) ? company.portfolio_years : [])
        .map((y) => ({ year: y.year || '', images: (y.images || []).slice(0, 6).map((u) => optImg(u, 700)) }))
        .filter((y) => y.images.length),
    }

    return {
      hero,
      kpi,
      lifestyle,
      band: {
        img: optImg(bgs[2] || bgs[0], 1920),
        title: company.description || 'จุดเริ่มต้นของคนอยากมีบ้าน',
        text: `ทีมงาน ${company.name || 'Startup Up'} ดูแลครบทุกขั้นตอน ตั้งแต่นัดชมบ้าน เรื่องสินเชื่อ ไปจนถึงวันโอนกรรมสิทธิ์ — สำนักงานตั้งอยู่ที่ ${company.address || ''}`,
      },
      projects,
      benefits,
      whyUsTitle: visual.whyUsTitle || 'ซื้อบ้านกับเราดีอย่างไร?',
      portfolio,
      contact: {
        name: company.name || 'Startup Up',
        desc: company.description || '',
        phone: String(company.phone || ''),
        phoneFmt: fmtPhone(company.phone),
        line: company.line || '',
        facebook: company.facebook || '',
        address: company.address || '',
        email: company.email || '',
      },
      categories: Object.keys(byCat),
      locations,
      updatedAt: raw.updatedAt,
    }
  }, [raw])
}

/* ---------- ตัวช่วย animation ---------- */

/** ใส่ class .is-in ให้ทุก .rv ที่เลื่อนมาถึง (แทน WOW.js แบบไม่ต้องลงไลบรารี)
 *  รับ dep ไว้สแกนซ้ำเมื่อข้อมูลจริงมาถึง — ไม่งั้น element ที่เพิ่งเกิดจะไม่ถูก observe */
function useReveal(dep) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.rv:not(.is-in)'))
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [dep])
}

/** นับเลขขึ้นเมื่อเลื่อนถึง */
function CountUp({ to, suffix = '', duration = 1600 }) {
  const ref = useRef(null)
  const [val, setVal] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVal(to)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        const t0 = performance.now()
        const step = (t) => {
          const p = Math.min(1, (t - t0) / duration)
          const eased = 1 - Math.pow(1 - p, 3)
          setVal(Math.round(to * eased))
          if (p < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

/* ============================ หน้า ============================ */

/** ข้อมูลตัวอย่างเดิม จัดรูปให้เหมือน view-model ของข้อมูลจริง (ใช้ระหว่างรอ/ล้มเหลว) */
const FALLBACK = {
  hero: HERO.map((h, i) => ({ ...h, img: IMG.hero[i] })),
  kpi: KPI,
  lifestyle: LIFESTYLE.map((l, i) => ({ ...l, img: IMG.lifestyle[i] })),
  band: {
    img: IMG.band,
    title: 'เลือกบ้านที่เหมาะกับทุกจังหวะชีวิต',
    text: 'เราคัดบ้านมือสองสภาพดี ตรวจเอกสารครบ และบอกข้อเสียตามจริงทุกหลัง เพราะบ้านหลังหนึ่งต้องอยู่กันไปอีกนาน',
  },
  projects: PROJECTS.map((p, i) => ({ ...p, img: IMG.projects[i] })),
  benefits: BENEFITS.map(({ title, desc }) => ({ title, desc })),
  whyUsTitle: 'เริ่มต้นความสุขได้ทันที',
  portfolio: { title: 'ผลงานของเรา', years: [] },
  contact: {
    name: 'Startup Up', desc: 'อสังหาริมทรัพย์', phone: '0800000000', phoneFmt: '080-000-0000',
    line: '', facebook: '', address: '', email: '',
  },
  categories: LIFESTYLE.map((l) => l.title),
  locations: [],
}

export default function V2() {
  const site = useSiteData()
  const vm = site || FALLBACK
  useReveal(vm)

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [slide, setSlide] = useState(0)
  const [review, setReview] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const heroLen = vm.hero.length
  const go = useCallback((d) => setSlide((s) => (s + d + heroLen) % heroLen), [heroLen])

  useEffect(() => {
    const t = setInterval(() => go(1), 6000)
    return () => clearInterval(t)
  }, [go])

  const heroNow = vm.hero[slide % heroLen]
  const years = vm.portfolio.years
  const yearNow = years.length ? years[review % years.length] : null

  return (
    <>
      <Head>
        <title>ตัวอย่างดีไซน์ใหม่ | Startup Up</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="v2">
        {/* ---------------- HEADER ---------------- */}
        <header className={`v2-header ${scrolled ? 'is-solid' : ''}`}>
          <div className="v2-wrap v2-header-inner">
            <a href="#home" className="v2-brand">
              <span className="v2-brand-mark">SU</span>
              <span className="v2-brand-text">
                <strong>{vm.contact.name}</strong>
                <em>{vm.contact.desc || 'อสังหาริมทรัพย์'}</em>
              </span>
            </a>

            <nav className={`v2-nav ${menuOpen ? 'is-open' : ''}`}>
              {[['บ้านพร้อมอยู่', '#projects'], ['ประเภทบ้าน', '#lifestyle'], ['ผลงานของเรา', '#portfolio'], ['ทำไมต้องเรา', '#whyus'], ['ปรึกษาฟรี', '#contact']].map(([m, href]) => (
                <a key={m} href={href} onClick={() => setMenuOpen(false)}>{m}</a>
              ))}
            </nav>

            <div className="v2-header-actions">
              <a href={`tel:${vm.contact.phone}`} className="v2-call">
                <Phone size={16} /> <span>{vm.contact.phoneFmt}</span>
              </a>
              <button className="v2-burger" onClick={() => setMenuOpen((o) => !o)} aria-label="เมนู">
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </header>

        {/* ---------------- HERO ---------------- */}
        <section id="home" className="v2-hero">
          {vm.hero.map((h, i) => (
            <div key={h.img || i} className={`v2-hero-slide ${i === slide % heroLen ? 'is-active' : ''}`}>
              <img src={h.img} alt="" className="v2-hero-img" />
              <div className="v2-hero-shade" />
            </div>
          ))}

          <div className="v2-wrap v2-hero-content" key={`${slide}-${site ? 'live' : 'mock'}`}>
            <p className="v2-eyebrow a1">{heroNow.eyebrow}</p>
            <h1 className="a2">{heroNow.title}</h1>
            <p className="v2-hero-sub a3">{heroNow.sub}</p>
            <div className="v2-hero-cta a4">
              <a href="#projects" className="v2-btn">ดูบ้านทั้งหมด <ArrowRight size={16} /></a>
              <a href="#contact" className="v2-btn v2-btn-ghost">ปรึกษาฟรี</a>
            </div>
          </div>

          <button className="v2-hero-arrow v2-prev" onClick={() => go(-1)} aria-label="ก่อนหน้า"><ChevronLeft size={22} /></button>
          <button className="v2-hero-arrow v2-next" onClick={() => go(1)} aria-label="ถัดไป"><ChevronRight size={22} /></button>

          <div className="v2-hero-dots">
            {vm.hero.map((_, i) => (
              <button key={i} className={i === slide % heroLen ? 'is-active' : ''} onClick={() => setSlide(i)} aria-label={`สไลด์ ${i + 1}`} />
            ))}
          </div>
        </section>

        {/* ---------------- KPI ---------------- */}
        <section className="v2-kpi">
          <div className="v2-wrap v2-kpi-grid">
            {vm.kpi.map((k, i) => (
              <div key={k.label} className="v2-kpi-item rv rv-up" style={{ '--d': `${i * 110}ms` }}>
                <strong><CountUp to={k.n} suffix={k.suffix} /></strong>
                <span>{k.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- LIFESTYLE ---------------- */}
        <section id="lifestyle" className="v2-section">
          <div className="v2-wrap">
            <header className="v2-head rv rv-up">
              <p className="v2-eyebrow">LIFESTYLE</p>
              <h2>เลือกบ้านในไลฟ์สไตล์ที่ชอบ</h2>
              <p className="v2-lead">เลือกจากประเภทบ้านที่ตรงกับจังหวะชีวิตของคุณ</p>
            </header>

            <div className="v2-life-grid">
              {vm.lifestyle.map((l, i) => (
                <a key={l.title} href="#projects" className="v2-life rv rv-zoom" style={{ '--d': `${i * 110}ms` }}>
                  <img src={l.img} alt={l.title} loading="lazy" />
                  <div className="v2-life-shade" />
                  <div className="v2-life-copy">
                    <h3>{l.title}</h3>
                    <p>{l.desc}</p>
                    <span className="v2-life-link">ดูบ้าน <ArrowRight size={14} /></span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- BAND ---------------- */}
        <section className="v2-band">
          <img src={vm.band.img} alt="" className="v2-band-bg" loading="lazy" />
          <div className="v2-band-shade" />
          <div className="v2-wrap v2-band-copy rv rv-up">
            <p className="v2-eyebrow v2-eyebrow-light">OUR PROMISE</p>
            <h2>{vm.band.title}</h2>
            <p>{vm.band.text}</p>
            <a href="#contact" className="v2-btn v2-btn-light">คุยกับทีมงาน <ArrowRight size={16} /></a>
          </div>
        </section>

        {/* ---------------- PROJECTS ---------------- */}
        <section id="projects" className="v2-section v2-section-alt">
          <div className="v2-wrap">
            <header className="v2-head rv rv-up">
              <p className="v2-eyebrow">PROJECTS</p>
              <h2>บ้านแนะนำประจำเดือนนี้</h2>
              <p className="v2-lead">อัปเดตล่าสุด พร้อมนัดชมได้ทันที</p>
            </header>

            <div className="v2-proj-grid">
              {vm.projects.map((p, i) => (
                <a key={`${p.name}-${i}`} href="#contact" className="v2-card rv rv-up" style={{ '--d': `${(i % 4) * 90}ms` }}>
                  <div className="v2-card-media">
                    <img src={p.img} alt={p.name} loading="lazy" />
                    {p.tag && <span className="v2-card-tag">{p.tag}</span>}
                  </div>
                  <div className="v2-card-body">
                    <h3>{p.name}</h3>
                    <p className="v2-card-loc"><MapPin size={14} /> {p.loc}</p>
                    <div className="v2-card-foot">
                      <span className="v2-price">฿{p.price} <em>ลบ.</em></span>
                      <span className="v2-specs">
                        <i><Maximize size={14} /> {p.wah}</i>
                        {p.bed > 0 && <i><Bed size={14} /> {p.bed}</i>}
                        {p.bath > 0 && <i><Bath size={14} /> {p.bath}</i>}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <div className="v2-center rv rv-up">
              <a href="#contact" className="v2-btn">ดูบ้านทั้งหมด <ArrowRight size={16} /></a>
            </div>
          </div>
        </section>

        {/* ---------------- BENEFITS ---------------- */}
        <section className="v2-section" id="whyus">
          <div className="v2-wrap">
            <header className="v2-head rv rv-up">
              <p className="v2-eyebrow">WHY US</p>
              <h2>{vm.whyUsTitle}</h2>
            </header>
            <div className={`v2-ben-grid ${vm.benefits.length > 4 ? 'is-six' : ''}`}>
              {vm.benefits.map((b, i) => {
                const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length]
                return (
                  <div key={b.title} className="v2-ben rv rv-up" style={{ '--d': `${(i % 3) * 110}ms` }}>
                    <div className="v2-ben-icon"><Icon size={24} /></div>
                    <h3>{b.title}</h3>
                    <p>{b.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ---------------- PORTFOLIO (ข้อมูลจริง) / REVIEWS (ตัวอย่าง) ---------------- */}
        {yearNow ? (
          <section className="v2-section v2-section-alt" id="portfolio">
            <div className="v2-wrap">
              <header className="v2-head rv rv-up">
                <p className="v2-eyebrow">PORTFOLIO</p>
                <h2>{vm.portfolio.title}</h2>
                <p className="v2-lead">บ้านที่ส่งมอบให้ลูกค้าจริง แยกตามปี</p>
              </header>

              <div className="v2-port rv rv-up">
                <div className="v2-port-head">
                  <span className="v2-port-year">{yearNow.year ? `ปี ${yearNow.year}` : 'ผลงานที่ผ่านมา'}</span>
                  <div className="v2-rev-nav" style={{ marginTop: 0 }}>
                    <span className="v2-rev-count">{String((review % years.length) + 1).padStart(2, '0')} / {String(years.length).padStart(2, '0')}</span>
                    <button onClick={() => setReview((r) => (r - 1 + years.length) % years.length)} aria-label="ปีก่อนหน้า"><ChevronLeft size={18} /></button>
                    <button onClick={() => setReview((r) => (r + 1) % years.length)} aria-label="ปีถัดไป"><ChevronRight size={18} /></button>
                  </div>
                </div>
                <div className="v2-port-grid" key={review}>
                  {yearNow.images.map((img, i) => (
                    <img key={img} src={img} alt={`ผลงาน${yearNow.year ? `ปี ${yearNow.year}` : ''} รูปที่ ${i + 1}`} loading="lazy" />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="v2-section v2-section-alt" id="portfolio">
            <div className="v2-wrap">
              <header className="v2-head rv rv-up">
                <p className="v2-eyebrow">REVIEWS</p>
                <h2>เสียงจากเจ้าของบ้าน</h2>
              </header>

              <div className="v2-rev rv rv-up">
                <Quote size={40} className="v2-rev-quote" />
                <p className="v2-rev-text" key={review}>{REVIEWS[review % REVIEWS.length].text}</p>
                <div className="v2-rev-who">
                  <img src={IMG.avatars[review % REVIEWS.length]} alt={REVIEWS[review % REVIEWS.length].name} />
                  <div>
                    <strong>{REVIEWS[review % REVIEWS.length].name}</strong>
                    <span>{REVIEWS[review % REVIEWS.length].role}</span>
                  </div>
                </div>
                <div className="v2-rev-nav">
                  <span className="v2-rev-count">{String((review % REVIEWS.length) + 1).padStart(2, '0')} / {String(REVIEWS.length).padStart(2, '0')}</span>
                  <button onClick={() => setReview((r) => (r - 1 + REVIEWS.length) % REVIEWS.length)} aria-label="ก่อนหน้า"><ChevronLeft size={18} /></button>
                  <button onClick={() => setReview((r) => (r + 1) % REVIEWS.length)} aria-label="ถัดไป"><ChevronRight size={18} /></button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ---------------- FORM ---------------- */}
        <section id="contact" className="v2-section">
          <div className="v2-wrap v2-form-wrap rv rv-up">
            <div className="v2-form-copy">
              <p className="v2-eyebrow">FREE CONSULT</p>
              <h2>กรอกข้อมูล ปรึกษาเรื่องบ้าน ฟรี!</h2>
              <p>ทีมงานจะติดต่อกลับภายใน 1 วันทำการ พร้อมบ้านที่ตรงกับงบและทำเลที่คุณต้องการ</p>
              <a href={`tel:${vm.contact.phone}`} className="v2-form-call"><Phone size={18} /> {vm.contact.phoneFmt}</a>
              {(vm.contact.line || vm.contact.facebook) && (
                <div className="v2-form-social">
                  {vm.contact.line && <a href={vm.contact.line} target="_blank" rel="noopener noreferrer" className="v2-btn v2-btn-line"><MessageCircle size={16} /> แชทผ่าน LINE</a>}
                  {vm.contact.facebook && <a href={vm.contact.facebook} target="_blank" rel="noopener noreferrer" className="v2-btn v2-btn-fb"><ThumbsUp size={16} /> Facebook</a>}
                </div>
              )}
            </div>

            <form className="v2-form" onSubmit={(e) => { e.preventDefault(); alert('หน้าตัวอย่าง ยังไม่ได้ต่อระบบส่งข้อมูล') }}>
              <div className="v2-row">
                <label>สนใจบ้านประเภท
                  <select defaultValue=""><option value="" disabled>เลือกประเภท</option>{vm.categories.map((c) => <option key={c}>{c}</option>)}</select>
                </label>
                <label>ทำเลที่สนใจ
                  {vm.locations.length ? (
                    <select defaultValue=""><option value="" disabled>เลือกทำเล</option>{vm.locations.map((l) => <option key={l}>{l}</option>)}</select>
                  ) : (
                    <input placeholder="เช่น คลองหลวง, ลำลูกกา" />
                  )}
                </label>
              </div>
              <div className="v2-row">
                <label>ชื่อ - นามสกุล
                  <input placeholder="ชื่อของคุณ" />
                </label>
                <label>เบอร์โทรศัพท์
                  <input inputMode="tel" placeholder="08X-XXX-XXXX" />
                </label>
              </div>
              <label>สะดวกเข้าชมช่วงไหน
                <select defaultValue=""><option value="" disabled>เลือกช่วงเวลา</option><option>วันธรรมดา</option><option>วันหยุด</option></select>
              </label>
              <label className="v2-check">
                <input type="checkbox" defaultChecked />
                <span>ยินยอมให้ติดต่อกลับเพื่อแนะนำบ้านที่ตรงความต้องการ</span>
              </label>
              <button type="submit" className="v2-btn v2-btn-block">ส่งข้อมูล <ArrowRight size={16} /></button>
            </form>
          </div>
        </section>

        {/* ---------------- FOOTER ---------------- */}
        <footer className="v2-footer">
          <div className="v2-wrap v2-footer-grid">
            <div>
              <a href="#home" className="v2-brand v2-brand-light">
                <span className="v2-brand-mark">SU</span>
                <span className="v2-brand-text"><strong>{vm.contact.name}</strong><em>{vm.contact.desc || 'อสังหาริมทรัพย์'}</em></span>
              </a>
              <p className="v2-footer-about">{vm.contact.address || 'บ้านมือสองคัดคุณภาพ ตรวจเอกสารครบก่อนทุกดีล'}</p>
            </div>
            <div>
              <h4>เมนู</h4>
              <a href="#projects">บ้านพร้อมอยู่</a><a href="#lifestyle">ประเภทบ้าน</a><a href="#portfolio">ผลงานของเรา</a><a href="#contact">ปรึกษาฟรี</a>
            </div>
            <div>
              <h4>ประเภทบ้าน</h4>
              {vm.lifestyle.map((l) => <a key={l.title} href="#projects">{l.title}</a>)}
            </div>
            <div>
              <h4>ติดต่อ</h4>
              <a href={`tel:${vm.contact.phone}`}>{vm.contact.phoneFmt}</a>
              {vm.contact.line && <a href={vm.contact.line} target="_blank" rel="noopener noreferrer">LINE Official</a>}
              {vm.contact.facebook && <a href={vm.contact.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>}
              {vm.contact.email && <a href={`mailto:${vm.contact.email}`}>{vm.contact.email}</a>}
            </div>
          </div>
          <div className="v2-footer-bottom"><div className="v2-wrap">© {new Date().getFullYear()} {vm.contact.name} · หน้าตัวอย่างดีไซน์{site ? ' · ข้อมูลจริงจากเว็บหลัก' : ''}</div></div>
        </footer>
      </div>

      <style jsx global>{`
        /* ===== ตัวแปรและพื้นฐาน (จำกัดอยู่ในหน้านี้เท่านั้น) ===== */
        .v2 {
          --g: #0b3d1b;
          --g-soft: #eef3f0;
          --ink: #16202a;
          --muted: #6b7580;
          --line: #e8ecea;
          font-family: 'Prompt', sans-serif;
          color: var(--ink);
          background: #fff;
          overflow-x: hidden;
        }
        .v2 * { box-sizing: border-box; }
        .v2 h1, .v2 h2, .v2 h3, .v2 h4 { margin: 0; line-height: 1.25; }
        .v2 p { margin: 0; }
        .v2 a { text-decoration: none; color: inherit; }
        .v2-wrap { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .v2-center { text-align: center; margin-top: 44px; }

        /* ===== reveal ===== */
        .v2 .rv { opacity: 0; transition: opacity .75s ease, transform .75s cubic-bezier(.16,1,.3,1); transition-delay: var(--d, 0ms); will-change: opacity, transform; }
        .v2 .rv-up { transform: translateY(34px); }
        .v2 .rv-zoom { transform: scale(.94); }
        .v2 .rv.is-in { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) {
          .v2 .rv { opacity: 1; transform: none; transition: none; }
        }

        /* ===== ปุ่ม ===== */
        .v2 .v2-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--g); color: #fff; font-weight: 500; font-size: 15px;
          padding: 13px 30px; border-radius: 999px; border: 1px solid var(--g); cursor: pointer;
          transition: background .3s, color .3s, transform .3s, box-shadow .3s;
        }
        .v2 .v2-btn:hover { background: transparent; color: var(--g); transform: translateY(-2px); box-shadow: 0 10px 24px -12px rgba(11,61,27,.55); }
        .v2 .v2-btn-ghost { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.6); color: #fff; backdrop-filter: blur(6px); }
        .v2 .v2-btn-ghost:hover { background: #fff; color: var(--g); border-color: #fff; }
        .v2 .v2-btn-light { background: #fff; color: var(--g); border-color: #fff; }
        .v2 .v2-btn-light:hover { background: transparent; color: #fff; border-color: #fff; }
        .v2 .v2-btn-block { width: 100%; }

        /* ===== header ===== */
        .v2-header { position: fixed; inset: 0 0 auto 0; z-index: 60; transition: background .35s, box-shadow .35s, padding .35s; padding: 18px 0; }
        .v2-header.is-solid { background: rgba(255,255,255,.94); backdrop-filter: blur(10px); box-shadow: 0 6px 24px -18px rgba(0,0,0,.5); padding: 10px 0; }
        .v2-header-inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
        .v2-brand { display: inline-flex; align-items: center; gap: 10px; }
        .v2-brand-mark { width: 40px; height: 40px; border-radius: 12px; background: var(--g); color: #fff; display: grid; place-items: center; font-weight: 700; letter-spacing: .5px; flex: none; }
        .v2-brand-text { display: flex; flex-direction: column; line-height: 1.15; }
        .v2-brand-text strong { font-size: 16px; font-weight: 600; color: #fff; }
        /* tagline จริง "จุดเริ่มต้นของคนอยากมีบ้าน" ยาวกว่าเดิม — ลด tracking ไม่ให้ล้น */
        .v2-brand-text em { font-style: normal; font-size: 11px; letter-spacing: .06em; color: rgba(255,255,255,.75); }
        .v2-header.is-solid .v2-brand-text strong { color: var(--g); }
        .v2-header.is-solid .v2-brand-text em { color: var(--muted); }

        .v2-nav { display: flex; align-items: center; gap: 30px; }
        .v2-nav a { font-size: 14px; font-weight: 300; color: rgba(255,255,255,.9); position: relative; padding: 6px 0; transition: color .25s; }
        .v2-nav a::after { content: ''; position: absolute; left: 0; bottom: 0; height: 2px; width: 0; background: currentColor; transition: width .3s cubic-bezier(.16,1,.3,1); }
        .v2-nav a:hover::after { width: 100%; }
        .v2-header.is-solid .v2-nav a { color: var(--ink); }
        .v2-header.is-solid .v2-nav a:hover { color: var(--g); }

        .v2-header-actions { display: flex; align-items: center; gap: 12px; }
        .v2-call { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: #fff; border: 1px solid rgba(255,255,255,.5); padding: 9px 18px; border-radius: 999px; transition: all .3s; }
        .v2-call:hover { background: #fff; color: var(--g); }
        .v2-header.is-solid .v2-call { color: var(--g); border-color: var(--g); }
        .v2-header.is-solid .v2-call:hover { background: var(--g); color: #fff; }
        .v2-burger { display: none; background: none; border: 0; color: #fff; cursor: pointer; padding: 6px; }
        .v2-header.is-solid .v2-burger { color: var(--ink); }

        /* ===== hero ===== */
        .v2-hero { position: relative; height: 100vh; min-height: 620px; display: flex; align-items: center; overflow: hidden; }
        .v2-hero-slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1.1s ease; }
        .v2-hero-slide.is-active { opacity: 1; }
        .v2-hero-img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.02); }
        .v2-hero-slide.is-active .v2-hero-img { animation: v2ken 7s linear forwards; }
        @keyframes v2ken { from { transform: scale(1.02); } to { transform: scale(1.12); } }
        .v2-hero-shade { position: absolute; inset: 0; background: linear-gradient(100deg, rgba(6,26,14,.82) 0%, rgba(6,26,14,.55) 45%, rgba(6,26,14,.2) 100%); }
        .v2-hero-content { position: relative; z-index: 2; color: #fff; max-width: 1200px; }
        .v2-hero-content > * { max-width: 660px; }
        .v2-hero-content h1 { font-size: clamp(30px, 5vw, 54px); font-weight: 600; letter-spacing: -.5px; margin-bottom: 18px; }
        .v2-hero-sub { font-size: clamp(15px, 1.6vw, 18px); font-weight: 300; color: rgba(255,255,255,.86); line-height: 1.8; margin-bottom: 34px; }
        .v2-hero-cta { display: flex; flex-wrap: wrap; gap: 14px; }
        .v2-eyebrow { font-size: 12px; letter-spacing: .28em; text-transform: uppercase; color: var(--g); font-weight: 500; margin-bottom: 14px; }
        .v2-eyebrow-light, .v2-hero-content .v2-eyebrow { color: rgba(255,255,255,.8); }

        .v2-hero-content .a1 { animation: v2up .8s .05s both cubic-bezier(.16,1,.3,1); }
        .v2-hero-content .a2 { animation: v2up .8s .18s both cubic-bezier(.16,1,.3,1); }
        .v2-hero-content .a3 { animation: v2up .8s .31s both cubic-bezier(.16,1,.3,1); }
        .v2-hero-content .a4 { animation: v2up .8s .44s both cubic-bezier(.16,1,.3,1); }
        @keyframes v2up { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }

        .v2-hero-arrow { position: absolute; top: 50%; z-index: 3; transform: translateY(-50%); width: 46px; height: 46px; border-radius: 50%; border: 1px solid rgba(255,255,255,.45); background: rgba(255,255,255,.1); color: #fff; display: grid; place-items: center; cursor: pointer; backdrop-filter: blur(6px); transition: background .3s, color .3s; }
        .v2-hero-arrow:hover { background: #fff; color: var(--g); }
        .v2-prev { left: 24px; } .v2-next { right: 24px; }
        .v2-hero-dots { position: absolute; z-index: 3; bottom: 34px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; }
        .v2-hero-dots button { width: 32px; height: 4px; border: 0; border-radius: 999px; background: rgba(255,255,255,.4); cursor: pointer; transition: background .3s, width .3s; }
        .v2-hero-dots button.is-active { background: #fff; width: 54px; }

        /* ===== kpi ===== */
        .v2-kpi { background: var(--g); color: #fff; padding: 46px 0; }
        .v2-kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; text-align: center; }
        .v2-kpi-item strong { display: block; font-size: clamp(30px, 4vw, 46px); font-weight: 600; line-height: 1.1; }
        .v2-kpi-item span { font-size: 14px; font-weight: 300; color: rgba(255,255,255,.78); }

        /* ===== section ===== */
        .v2-section { padding: 92px 0; }
        .v2-section-alt { background: #f7f9f8; }
        .v2-head { text-align: center; margin-bottom: 52px; }
        .v2-head h2 { font-size: clamp(24px, 3.2vw, 36px); font-weight: 600; color: var(--g); }
        .v2-lead { margin-top: 12px; color: var(--muted); font-weight: 300; }

        /* ===== lifestyle ===== */
        .v2-life-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; }
        .v2-life { position: relative; height: 380px; border-radius: 22px; overflow: hidden; display: block; }
        .v2-life img { width: 100%; height: 100%; object-fit: cover; transition: transform .9s cubic-bezier(.16,1,.3,1); }
        .v2-life:hover img { transform: scale(1.09); }
        .v2-life-shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(6,26,14,.9) 8%, rgba(6,26,14,.25) 55%, rgba(6,26,14,0) 85%); transition: background .4s; }
        .v2-life:hover .v2-life-shade { background: linear-gradient(to top, rgba(6,26,14,.95) 12%, rgba(6,26,14,.45) 60%, rgba(6,26,14,.1) 90%); }
        .v2-life-copy { position: absolute; inset: auto 0 0 0; padding: 26px; color: #fff; }
        .v2-life-copy h3 { font-size: 21px; font-weight: 600; }
        .v2-life-copy p { margin-top: 6px; font-size: 13px; font-weight: 300; color: rgba(255,255,255,.8); }
        .v2-life-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 14px; font-size: 13px; opacity: 0; transform: translateY(10px); transition: opacity .4s, transform .4s; }
        .v2-life:hover .v2-life-link { opacity: 1; transform: none; }

        /* ===== band ===== */
        .v2-band { position: relative; padding: 118px 0; overflow: hidden; }
        .v2-band-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .v2-band-shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(6,26,14,.9), rgba(6,26,14,.55)); }
        .v2-band-copy { position: relative; z-index: 2; color: #fff; max-width: 660px; }
        .v2-band-copy h2 { font-size: clamp(24px, 3.4vw, 38px); font-weight: 600; margin-bottom: 16px; }
        .v2-band-copy p { font-weight: 300; line-height: 1.9; color: rgba(255,255,255,.85); margin-bottom: 30px; }

        /* ===== project cards ===== */
        .v2-proj-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .v2-card { background: #fff; border: 1px solid var(--line); border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; transition: transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s; }
        .v2-card:hover { transform: translateY(-8px); box-shadow: 0 26px 44px -28px rgba(11,61,27,.45); }
        .v2-card-media { position: relative; height: 210px; overflow: hidden; background: #eef1ef; }
        .v2-card-media img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(.16,1,.3,1); }
        .v2-card:hover .v2-card-media img { transform: scale(1.08); }
        .v2-card-tag { position: absolute; top: 14px; left: 14px; background: var(--g); color: #fff; font-size: 11px; font-weight: 500; padding: 6px 14px; border-radius: 999px; }
        .v2-card-body { padding: 20px; display: flex; flex-direction: column; flex: 1; }
        .v2-card-body h3 { font-size: 16px; font-weight: 600; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .v2-card-loc { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 12.5px; font-weight: 300; color: var(--muted); }
        .v2-card-foot { margin-top: auto; padding-top: 16px; border-top: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .v2-price { font-size: 19px; font-weight: 600; color: var(--g); white-space: nowrap; }
        .v2-price em { font-style: normal; font-size: 12px; font-weight: 400; }
        .v2-specs { display: flex; gap: 10px; color: var(--muted); font-size: 12.5px; }
        .v2-specs i { display: inline-flex; align-items: center; gap: 4px; font-style: normal; }

        /* ===== benefits ===== */
        .v2-ben-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .v2-ben { background: #fff; border: 1px solid var(--line); border-radius: 22px; padding: 32px 26px; transition: transform .4s, box-shadow .4s; }
        .v2-ben:hover { transform: translateY(-6px); box-shadow: 0 22px 40px -30px rgba(11,61,27,.45); }
        .v2-ben-icon { width: 56px; height: 56px; border-radius: 18px; background: var(--g-soft); color: var(--g); display: grid; place-items: center; margin-bottom: 22px; }
        .v2-ben h3 { font-size: 17px; font-weight: 600; margin-bottom: 10px; }
        .v2-ben p { font-size: 14px; font-weight: 300; line-height: 1.85; color: var(--muted); }

        /* whyUs ของเว็บหลักมี 6 ข้อ — เรียง 3 คอลัมน์ 2 แถวพอดี */
        .v2-ben-grid.is-six { grid-template-columns: repeat(3, 1fr); }

        /* ===== portfolio (ข้อมูลจริง) ===== */
        .v2-port { max-width: 1000px; margin: 0 auto; }
        .v2-port-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 22px; }
        .v2-port-year { font-size: 20px; font-weight: 600; color: var(--g); }
        .v2-port-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .v2-port-grid img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 18px; border: 1px solid var(--line); animation: v2fade .5s both; }

        /* ===== ปุ่มโซเชียลใต้เบอร์โทร ===== */
        .v2-form-social { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
        .v2 .v2-btn-line { background: #06c755; border-color: #06c755; padding: 11px 22px; font-size: 14px; }
        .v2 .v2-btn-line:hover { background: transparent; color: #069944; border-color: #06c755; box-shadow: none; }
        .v2 .v2-btn-fb { background: #1877f2; border-color: #1877f2; padding: 11px 22px; font-size: 14px; }
        .v2 .v2-btn-fb:hover { background: transparent; color: #1877f2; border-color: #1877f2; box-shadow: none; }

        /* ===== reviews ===== */
        .v2-rev { position: relative; max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid var(--line); border-radius: 26px; padding: 46px; }
        .v2-rev-quote { color: var(--g-soft); position: absolute; top: 30px; right: 34px; }
        .v2-rev-text { font-size: 17px; font-weight: 300; line-height: 2; color: var(--ink); animation: v2fade .5s both; }
        @keyframes v2fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .v2-rev-who { display: flex; align-items: center; gap: 14px; margin-top: 28px; }
        .v2-rev-who img { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; }
        .v2-rev-who strong { display: block; font-size: 15px; font-weight: 600; }
        .v2-rev-who span { font-size: 12.5px; font-weight: 300; color: var(--muted); }
        .v2-rev-nav { display: flex; align-items: center; gap: 10px; margin-top: 26px; }
        .v2-rev-count { font-size: 13px; color: var(--muted); margin-right: auto; letter-spacing: .1em; }
        .v2-rev-nav button { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--line); background: #fff; color: var(--ink); display: grid; place-items: center; cursor: pointer; transition: all .3s; }
        .v2-rev-nav button:hover { border-color: var(--g); color: var(--g); }

        /* ===== form ===== */
        .v2-form-wrap { display: grid; grid-template-columns: 1fr 1.1fr; gap: 56px; align-items: center; }
        .v2-form-copy h2 { font-size: clamp(24px, 3vw, 34px); font-weight: 600; color: var(--g); margin-bottom: 14px; }
        .v2-form-copy p { color: var(--muted); font-weight: 300; line-height: 1.9; }
        .v2-form-call { display: inline-flex; align-items: center; gap: 10px; margin-top: 24px; font-size: 20px; font-weight: 600; color: var(--g); }
        .v2-form { background: #fff; border: 1px solid var(--line); border-radius: 26px; padding: 34px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 24px 50px -40px rgba(11,61,27,.5); }
        .v2-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .v2-form label { display: flex; flex-direction: column; gap: 7px; font-size: 13.5px; font-weight: 300; color: var(--muted); }
        .v2-form input, .v2-form select { font-family: inherit; font-size: 14.5px; color: var(--ink); padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; outline: none; background: #fff; transition: border-color .25s, box-shadow .25s; }
        .v2-form input:focus, .v2-form select:focus { border-color: var(--g); box-shadow: 0 0 0 3px rgba(11,61,27,.1); }
        .v2-check { flex-direction: row !important; align-items: flex-start; gap: 10px !important; font-size: 12.5px; line-height: 1.6; }
        .v2-check input { width: 17px; height: 17px; flex: none; margin-top: 1px; accent-color: var(--g); }

        /* ===== footer ===== */
        .v2-footer { background: #0a2313; color: rgba(255,255,255,.72); padding-top: 68px; }
        .v2-footer-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 40px; padding-bottom: 52px; }
        .v2-footer h4 { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 18px; }
        .v2-footer-grid a { display: block; font-size: 13.5px; font-weight: 300; padding: 5px 0; transition: color .25s; }
        .v2-footer-grid > div > a:hover { color: #fff; }
        .v2-brand-light .v2-brand-text strong { color: #fff; }
        .v2-footer-about { margin-top: 16px; font-size: 13.5px; font-weight: 300; line-height: 1.9; }
        .v2-footer-bottom { border-top: 1px solid rgba(255,255,255,.1); padding: 22px 0; font-size: 12.5px; font-weight: 300; }

        /* ===== responsive ===== */
        @media (max-width: 1024px) {
          .v2-life-grid, .v2-proj-grid, .v2-ben-grid, .v2-ben-grid.is-six { grid-template-columns: repeat(2, 1fr); }
          .v2-port-grid { grid-template-columns: repeat(2, 1fr); }
          .v2-form-wrap { grid-template-columns: 1fr; gap: 34px; }
          .v2-footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 780px) {
          .v2-burger { display: block; }
          .v2-nav { position: fixed; inset: 64px 0 auto 0; flex-direction: column; align-items: stretch; gap: 0; background: #fff; padding: 12px 24px 20px; box-shadow: 0 18px 30px -22px rgba(0,0,0,.5); transform: translateY(-130%); transition: transform .4s cubic-bezier(.16,1,.3,1); }
          .v2-nav.is-open { transform: none; }
          .v2-nav a { color: var(--ink) !important; padding: 13px 0; border-bottom: 1px solid var(--line); }
          .v2-call span { display: none; }
          .v2-call { padding: 9px 12px; }
          .v2-section { padding: 66px 0; }
          .v2-hero { height: auto; min-height: 0; padding: 150px 0 90px; }
          .v2-hero-arrow { display: none; }
          .v2-kpi-grid { grid-template-columns: 1fr; gap: 26px; }
          .v2-row { grid-template-columns: 1fr; }
          .v2-life { height: 300px; }
          .v2-rev { padding: 30px 24px; }
        }
        @media (max-width: 520px) {
          .v2-life-grid, .v2-proj-grid, .v2-ben-grid, .v2-ben-grid.is-six { grid-template-columns: 1fr; }
          .v2-port-grid { grid-template-columns: 1fr; }
          .v2-footer-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  )
}
