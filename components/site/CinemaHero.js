/**
 * CinemaHero — ฉากเปิดเว็บแบบภาพยนตร์
 *
 * เอนจินเดียวกับหน้า public/house-story แต่ยกมาเป็น React component
 * และเปลี่ยนการ์ดสไลด์จากข้อมูลสมมติ เป็นบ้านจริงจาก Firestore
 *
 * เดิมฉากเป็นรูปนิ่ง 8 รูปจางสลับกัน ตอนนี้เป็นวิดีโอ single-take ตัวเดียว
 * ที่เดินหน้า-ถอยหลังตามการเลื่อนหน้าจอ (ดู VIDEO_MAP / PANEL_RANGES ด้านล่าง)
 *
 * ลำดับเรื่องตามเวลาในวิดีโอ
 *   0-2.5 วิ ประตูไม้เปิดออก → 3-4.5 วิ เดินเข้าสวนหน้าบ้าน (+ การ์ดทำเลจริง)
 *   → 5-6 วิ บานเลื่อนเปิดสู่สวน → 6.5-10 วิ ห้องนั่งเล่นกับครอบครัว
 *   → 11-12.5 วิ บันได → 13 วิ+ มองออกไปสวนหลังบ้าน
 *
 * รูปนิ่งชุดเดิมยังอยู่ที่ public/house-story/img/ (หน้าเดโมแยกยังใช้อยู่) กู้กลับได้ทุกเมื่อ
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import LocationCarousel from './LocationCarousel';
import FeaturedHomes from './FeaturedHomes';
import {
  EditableText, getOptimizedImg, PropertyMap, DEFAULT_VISUAL_CONTENT,
  normalizeLocations, visibleLocations, matchesMainArea, searchResultHref,
} from './SiteApp';

/**
 * ระยะเลื่อนทั้งเรื่อง
 * 0-6400 คือช่วงวิดีโอเดิน ส่วน 6400-7600 คือช่วงท้ายที่ค้างภาพสวนหลังบ้านไว้
 * แล้วเปิดแผนที่หมุดโครงการขึ้นมาให้กดเลือกทำเล
 */
const STORY_LENGTH = 7600;
const VIDEO_END_AT = 6400;

/**
 * ไฟล์วิดีโอ 2 ขนาด + ภาพนิ่งสำรอง
 *   scrub   — 1920x904 keyframe ถี่ทุก 12 เฟรม (0.5 วิ) จอคอมใช้ตัวนี้
 *             ไม่ได้ย่อสักพิกเซล คมเท่าต้นฉบับ แต่ตัดขอบบนทิ้ง 176px
 *             เพราะ AI เรนเดอร์ UI ปลอมติดมา (ปุ่มเมนูมุมซ้าย กับคำว่า EN มุมขวา)
 *             ลองใช้ delogo เกลี่ยสีแล้วเหลือรอยเบลอเป็นแถบ ตัดทิ้งสะอาดกว่า
 *   scrubSm — 1530x720 keyframe ถี่เท่ากัน มือถือใช้ตัวนี้ ลากตามนิ้วได้เหมือนกัน
 *   poster — เฟรมแรกของไฟล์ scrub เป๊ะ ๆ วางรองใต้วิดีโอตลอดเวลา กันจอดำ
 *
 * เวลาแปลงไฟล์ใหม่ ให้ขึ้นเลข -v2 อย่าทับไฟล์เดิม ไม่งั้น CDN จะจ่ายของเก่าชนกับจังหวะใหม่
 */
/**
 * ย้ายขึ้น Cloudinary แล้ว ไม่เก็บใน git อีกต่อไป (รวม 25 MB)
 * ไฟล์ต้นฉบับยังอยู่ใน public/video/ ของเครื่อง แต่ถูก .gitignore ไว้
 *
 * ห้ามใส่พารามิเตอร์แปลงไฟล์ต่อท้าย URL เด็ดขาด
 * เพราะ Cloudinary จะเข้ารหัสใหม่แล้ว keyframe ที่ถี่ทุก 12 เฟรมจะหาย
 * ฉากจะกระตุกตอนลากเลื่อน ต้องเสิร์ฟไฟล์ดิบเท่านั้น
 */
const CDN = 'https://res.cloudinary.com/dm2wr55r5';
const MEDIA = {
  scrub:   `${CDN}/video/upload/v1788335283/house/house-scrub-v3.mp4`,      // 1920x904  13.4MB  จอคอม
  scrubSm: `${CDN}/video/upload/v1788335275/house/house-scrub-sm-v3.mp4`,   // 1530x720   6.3MB  มือถือ/แท็บเล็ต
  poster:  `${CDN}/image/upload/v1788335287/house/house-scrub-poster-v3.jpg`,
};

/** ความยาวไฟล์ scrub ตามที่ ffprobe รายงาน — ต้องตรงเป๊ะ ไม่ใช่ความยาวไฟล์ต้นฉบับ */
const VIDEO_DURATION = 15.0417;

/**
 * รูปประจำทำเลของแถบทำเลในฉากเปิด — ไฟล์อยู่ใน public/locations (768x1024 ตรงกับสัดส่วนการ์ด 3:4)
 *
 * ทำไมทับไว้ในโค้ดแทนที่จะอัปขึ้น Firestore :
 * ข้อมูลทำเลอยู่ที่ site_settings/visual ซึ่ง "เว็บจริงกับ /v4 ใช้ก้อนเดียวกัน"
 * ถ้าไปแก้ที่นั่น เว็บจริงจะเปลี่ยนรูปทันทีทั้งที่ยังไม่อนุญาตให้ขึ้น live
 * การทับตรงนี้จึงมีผลเฉพาะแถบทำเลในฉากเปิดของ /v4 เท่านั้น
 *
 * ผลข้างเคียงที่ต้องรู้ : ตราบใดที่ตารางนี้ยังอยู่ การเปลี่ยนรูปทำเลจากโหมดแก้ไขหลังบ้าน
 * จะไม่มีผลกับแถบนี้ (ยังมีผลกับเว็บจริงตามปกติ) วันที่พร้อมขึ้น live แล้วอยากให้
 * หลังบ้านคุมรูปได้เหมือนเดิม ให้อัปรูปพวกนี้ขึ้น Cloudinary ผ่านหลังบ้าน แล้วลบตารางนี้ทิ้ง
 *
 * ชื่อคีย์ต้องตรงกับ area ใน Firestore เป๊ะ ๆ ทำเลไหนไม่มีในตารางจะใช้รูปเดิมจาก Firestore ต่อ
 */
const LOCATION_IMG = {
  'กรุงเทพมหานคร': '/locations/bangkok.jpg',
  'นนทบุรี':       '/locations/nonthaburi.jpg',
  'ลำลูกกา':       '/locations/lam-luk-ka.jpg',
  'คลองหลวง':      '/locations/khlong-luang.jpg',
  'ธัญบุรี':        '/locations/thanyaburi.jpg',
  'เมืองปทุมธานี':  '/locations/mueang-pathum-thani.jpg',
  'อยุธยา':        '/locations/ayutthaya.jpg',
};

/**
 * ภาพวางแบบ cover (เต็มจอเสมอ) สเกลจึงต้องไม่ต่ำกว่า 1.0 เด็ดขาด
 * ไม่งั้นจะเห็นขอบว่างโผล่ — 1.02 คือเผื่อไว้ให้พารัลแลกซ์เมาส์ขยับได้พอดี
 * ตั้งไว้ต่ำที่สุดเท่าที่ปลอดภัย เพื่อให้ถูกตัดขอบน้อยที่สุด
 */
const BASE_SCALE = 1.02;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const smoothstep = (edge0, edge1, value) => {
  const x = clamp((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
};

const lerp = (a, b, t) => a + (b - a) * t;

/**
 * เลื่อนเกินกี่พิกเซลในเฟรมเดียวถึงจะถือว่า "ดีด" ไม่ใช่ "ปัดนิ้ว"
 * ปัดนิ้วแรงที่สุดยังไม่ถึง 300px ต่อเฟรม เกิน 600 จึงมาจากการกระโดดเท่านั้น
 * เช่น เบราว์เซอร์กู้ตำแหน่งสกอลล์เดิมให้หลังกดรีเฟรช
 */
const JUMP_PX = 600;

/**
 * ค่าคงที่เวลาของการหน่วงภาพ (มิลลิวินาที) — ยิ่งมากภาพยิ่งไหลนุ่มแต่ตามมือช้าลง
 * 150ms ให้ความรู้สึกลื่นกว่าเดิมเล็กน้อย โดยยังไม่รู้สึกว่าภาพตามหลังนิ้ว
 */
const EASE_TAU = 150;

/**
 * "สถานี" — จุดที่มีของให้ลูกค้าใช้งานจริง ไม่ใช่แค่ภาพผ่าน ๆ
 * ตัวเลขคือกึ่งกลางของช่วงที่แผ่นนั้นแสดงเต็มและกดได้ (op > 0.6)
 * พอเลื่อนแล้วหยุดใกล้จุดพวกนี้ หน้าจะค่อย ๆ ดูดเข้าที่ให้เอง
 * จะได้ไม่เลยไปครึ่ง ๆ กลาง ๆ แล้วต้องเลื่อนย้อนกลับมาเอง
 */
const STATIONS = [
  { key: 'locations', at: 2050 },  // แถบทำเล — sightsShown เต็มช่วง 1880-2230
  { key: 'featured',  at: 3740 },  // แถบประเภทบ้าน — แผ่น room1 เต็มช่วง 3610-3900
  { key: 'map',       at: 6480 },  // แผนที่หมุดโครงการ — mapIn เต็มหลัง 6376
];
const SNAP_CATCH = 480;   // เลื่อนผ่านมาแล้วหยุดใกล้กว่านี้ = ดูดเข้าสถานี
/**
 * ระยะยึดตอน "กำลังจอดอยู่ที่สถานีนั้น" — กว้างกว่าปกติเกือบเท่าตัว
 * เพราะออกจากสถานีต้องยากกว่าเข้า ไม่งั้นสะบัดทีเดียวก็หลุดไปค้างกลางทาง
 *
 * ต้องน้อยกว่าครึ่งหนึ่งของระยะห่างสถานีที่ใกล้กันที่สุด (2050->3740 = 1690 ครึ่งคือ 845)
 * ไม่งั้นสองสถานีจะแย่งกันดูด
 */
const SNAP_HOLD = 820;
const SNAP_MIN = 14;      // ใกล้กว่านี้ถือว่าถึงแล้ว ไม่ต้องขยับ
const SNAP_IDLE = 150;    // หยุดเลื่อนนานเท่านี้ถึงเริ่มดูด (ms)
const SNAP_MS = 520;      // ใช้เวลาเลื่อนเข้าที่
const SNAP_TAKEOVER = 6;  // ถ้าตำแหน่งจริงเพี้ยนจากที่เราเขียนเกินนี้ = ผู้ใช้เข้ามาแทรก ให้ปล่อยมือ

const segmentInOut = (s, a, b, c, d) => {
  const enter = smoothstep(a, b, s);
  const exit = smoothstep(c, d, s);
  return { enter, exit, active: enter * (1 - exit) };
};

/**
 * แผนที่จังหวะ : "เลื่อนมากี่พิกเซล = ต้องเห็นวิดีโอวินาทีที่เท่าไร"
 * ต่อจุดเป็นเส้นตรงทีละช่วง
 *
 * คู่ที่ค่าวินาทีซ้ำกัน = วิดีโอ "ค้างภาพ" ไว้ ให้คนอ่านข้อความทัน
 * ตอนนี้ค้างที่วินาที 4.30 (ภาพเดินผ่านประตูเข้าสวน มองเห็นตัวบ้านอยู่ข้างหน้า)
 * ยาว 700px เพื่อเปิดพื้นที่ให้การ์ดทำเลเลื่อนผ่านจนครบ
 *
 * นี่คือปุ่มปรับจังหวะทั้งเรื่อง แก้ที่นี่ที่เดียว
 */
const VIDEO_MAP = [
  [0, 0],
  [1830, 4.30],
  [2530, 4.30],
  [VIDEO_END_AT, VIDEO_DURATION],
  // ค้างเฟรมสุดท้าย (สวนหลังบ้าน) ไว้เป็นฉากหลังของแผนที่
  [STORY_LENGTH, VIDEO_DURATION],
];

/** เดินตามจุดในตารางแบบเส้นตรง — from/to คือ index ของคอลัมน์ (0 = พิกเซล, 1 = วินาที) */
const mapPairs = (pairs, value, from, to) => {
  if (value <= pairs[0][from]) return pairs[0][to];
  for (let i = 1; i < pairs.length; i += 1) {
    const a = pairs[i - 1];
    const b = pairs[i];
    if (value <= b[from]) {
      const span = b[from] - a[from];
      return span <= 0 ? b[to] : lerp(a[to], b[to], (value - a[from]) / span);
    }
  }
  return pairs[pairs.length - 1][to];
};

const timeForScroll = (px) => mapPairs(VIDEO_MAP, px, 0, 1);
const scrollForTime = (sec) => mapPairs(VIDEO_MAP, sec, 1, 0);

/**
 * พารามิเตอร์ใน URL — ต้องอ่านตั้งแต่ตอนโหลดโมดูล
 * เพราะ useSiteData จะเขียน URL ทับทันทีที่หน้าเริ่มทำงาน
 *
 *   ?at=2700   กระโดดไปที่ระยะเลื่อน 2700px
 *   ?t=7.4     กระโดดไปที่ตำแหน่งที่โชว์วิดีโอวินาทีที่ 7.4 (ใช้ตอนจูนจังหวะ)
 *   ?debug=1   โชว์ตัวเลข px / วินาที มุมล่างซ้าย
 */
const QUERY = (() => {
  const empty = { at: 0, t: 0, debug: false };
  if (typeof window === 'undefined') return empty;
  try {
    const q = new URLSearchParams(window.location.search);
    const at = Number(q.get('at'));
    const t = Number(q.get('t'));
    return {
      at: Number.isFinite(at) && at > 0 ? at : 0,
      t: Number.isFinite(t) && t > 0 ? t : 0,
      debug: q.get('debug') === '1',
    };
  } catch (e) {
    return empty;
  }
})();

const DEEP_LINK_AT = QUERY.t ? scrollForTime(QUERY.t) : QUERY.at;

/**
 * แผ่นข้อความ : บอกแค่ "โผล่ที่พิกเซลไหน - เริ่มหายที่พิกเซลไหน"
 * ระยะจางเข้า/ออกเป็นค่าคงที่ ไม่ต้องนั่งคิดสี่ตัวเลขต่อแผ่น
 *
 * ตัวเลขชุดนี้จับคู่กับเนื้อวิดีโอไว้แล้ว (ดูวินาทีกำกับ)
 * วิธีปรับ : เปิด /v4?debug=1 เลื่อนช้า ๆ เจอเฟรมที่ชอบก็อ่านเลข px จากจอมาใส่ตรงนี้
 */
const PANEL_FADE = { in: 260, out: 190 };
const PANEL_RANGES = {
  gate:    [470, 1120],   // 1.1-2.6 วิ  ประตูไม้กำลังเปิดออก
  offer:   [1350, 2190],  // 3.2-4.3 วิ  ผ่านประตูเข้ามา เห็นทางเดินกับตัวบ้าน (ค้างภาพช่วงนี้)
  garden2: [2600, 3100],  // 4.5-5.9 วิ  สวนข้างบ้าน บานเลื่อนเปิดกว้าง
  room1:   [3350, 3900],  // 6.6-8.1 วิ  ก้าวเข้าห้องนั่งเล่น
  room2:   [4150, 4700],  // 8.8-10.3 วิ โซฟากับครอบครัว
  room3:   [4950, 5500],  // 11.0-12.5 วิ บันไดกับพื้นที่โล่ง
  closing: [5900, Infinity], // 13.6 วิ+ มองออกไปทางสวนหลังบ้าน — หัวเรื่องของแผนที่
};

/** แผนที่หมุดโครงการโผล่ตอนท้าย : [เริ่มเข้า, เข้าสุด] แล้วค้างไว้จนจบเรื่อง */
const MAP_RANGE = [6150, 6550];

/** แปลงกลับเป็นรูป [เริ่มเข้า, เข้าสุด, เริ่มออก, ออกสุด] ที่ลูปอนิเมชันใช้อยู่เดิม */
const PANEL_SEGMENTS = Object.fromEntries(
  Object.entries(PANEL_RANGES).map(([key, [from, to]]) => [
    key,
    to === Infinity
      ? [from, from + PANEL_FADE.in, 1e9, 1e9 + 1]
      : [from, from + PANEL_FADE.in, to, to + PANEL_FADE.out],
  ])
);

/**
 * ข้อความทุกบรรทัดในฉาก — เก็บค่าเริ่มต้นไว้ที่นี่ ไม่ไปแตะ DEFAULT_VISUAL_CONTENT ใน SiteApp
 * เวลาเข้าโหมดแก้ไขหน้าเว็บ ค่าที่แก้จะถูกเขียนลง site_settings/visual เหมือนข้อความอื่นทั้งเว็บ
 */
const CINE_TEXT = {
  cineTagline: 'เลื่อนลงเพื่อเดินเข้าบ้านหลังนี้ไปด้วยกัน',
  /* ตัวเลขเล่าแบรนด์บนจอแรก — เป็นข้อความล้วน ไม่ได้นับจากคลังบ้านแล้ว แก้ได้จากหลังบ้าน */
  cineStat1Num: '300+',
  cineStat1Label: 'บ้านรอให้คุณเลือก',
  cineStat2Num: '1,000+',
  cineStat2Label: 'ครอบครัวที่ไว้ใจเรา',
  cineStat3Num: '7 ปี',
  cineStat3Label: 'ที่อยู่เคียงข้างคุณ',
  cineTag1: 'บ้านพร้อมอยู่',
  cineTag2: 'ดำเนินการสินเชื่อให้ฟรี',
  cineTag3: 'ดูแลถึงวันโอน',
  cineGateTitle: 'ประตูบานนี้ เปิดรอคุณอยู่',
  cineGateDesc: 'จากหน้าบ้านที่เงียบสงบ สู่พื้นที่ที่เป็นของครอบครัวคุณจริง ๆ',
  cineGarden2Title: 'เปิดบานเลื่อน สวนก็คือห้องนั่งเล่น',
  cineGarden2Desc: 'แสงเข้าเต็มบ้าน ลมผ่านตลอดวัน ในบ้านกับสวนต่อเนื่องเป็นผืนเดียวกัน',
  cineRoom1Title: 'บ้านเด่นที่เราคัดสรร',
  cineRoom1Desc: 'สำรวจบ้านคุณภาพในหลากหลายทำเล ที่ได้รับการคัดสรรเพื่อการอยู่อาศัยและการเริ่มต้นบทใหม่ของคุณ',
  cineRoom2Title: 'มุมที่ไม่อยากลุกไปไหน',
  cineRoom2Desc: 'โซฟา พรม แสงบ่าย และเพื่อนตัวโปรด — ความสบายที่วัดกันไม่ได้ด้วยตารางเมตร',
  cineRoom3Title: 'พื้นที่ว่างก็มีค่า',
  cineRoom3Desc: 'บางวันไม่ต้องทำอะไรเลยก็ได้ นั่นแหละคือเหตุผลที่ต้องมีบ้านเป็นของตัวเอง',
  cineClosingTitle: 'ค้นหาทำเลจากแผนที่',
  cineClosingDesc: 'คลิกที่ป้ายจำนวนโครงการ เพื่อดูรายละเอียดบ้านในทำเลนั้นๆ',
};

/**
 * เลือกว่าเครื่องนี้จะเล่นฉากแบบไหน
 *
 *   scrub  วิดีโอเดินหน้า-ถอยหลังตามการเลื่อนหน้าจอ (ทั้งคอมและมือถือ)
 *   poster ผู้ที่ขอลดการเคลื่อนไหว หรือเปิดโหมดประหยัดเน็ต — ภาพนิ่งล้วน ไม่โหลดวิดีโอ
 *
 * เดิมมือถือใช้โหมด "เล่นวนเอง" เพราะกลัว iOS ซีคไม่ไหว แต่กลายเป็นว่าบนเครื่องจริง
 * iOS ไม่ยอมเล่นเองเลย ภาพค้างอยู่เฟรมแรกตลอด (ประตูไม่เปิดสักที)
 * จึงเปลี่ยนมาให้มือถือ scrub เหมือนคอม ซึ่งคุมได้แน่นอนกว่าเพราะไม่ต้องพึ่ง autoplay
 *
 * ต้องเริ่มที่ 'poster' เสมอแล้วค่อยพลิกใน effect ไม่งั้น HTML ฝั่งเซิร์ฟเวอร์กับฝั่งเบราว์เซอร์
 * จะไม่ตรงกัน (reactStrictMode เปิดอยู่)
 */
function useVideoMode() {
  const [mode, setMode] = useState('poster');
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const touch = window.matchMedia('(hover: none)');
    const small = window.matchMedia('(max-width: 860px)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    const pick = () => {
      const conn = typeof navigator !== 'undefined' ? navigator.connection : null;
      setCoarse(touch.matches);
      if (reduce.matches || (conn && conn.saveData)) { setMode('poster'); return; }
      setMode('scrub');
    };

    pick();
    touch.addEventListener('change', pick);
    small.addEventListener('change', pick);
    reduce.addEventListener('change', pick);
    return () => {
      touch.removeEventListener('change', pick);
      small.removeEventListener('change', pick);
      reduce.removeEventListener('change', pick);
    };
  }, []);

  return { mode, coarse };
}

/** จอเล็กใช้ไฟล์ย่อ จะได้ไม่ต้องโหลด 13MB บนเน็ตมือถือ */
function useScrubSrc() {
  const [src, setSrc] = useState(MEDIA.scrubSm);
  useEffect(() => {
    const big = window.matchMedia('(min-width: 861px)');
    const pick = () => setSrc(big.matches ? MEDIA.scrub : MEDIA.scrubSm);
    pick();
    big.addEventListener('change', pick);
    return () => big.removeEventListener('change', pick);
  }, []);
  return src;
}

/** ข้อความในฉากที่คลิกแก้ได้ตอนเปิดโหมดแก้ไขหน้าเว็บ */
function CineText({ tag = 'p', field, copy, onChange, isEditMode }) {
  return (
    <EditableText
      tag={tag}
      fieldKey={field}
      content={copy}
      updateContent={onChange}
      isEditMode={isEditMode}
      className=""
    />
  );
}

export default function CinemaHero({
  properties = [],
  onSelectProp,
  onSelectLocation,
  onSelectCategory,
  onSearch,
  companyName = 'STARTUP UP',
  tagline = 'จุดเริ่มต้นของคนอยากมีบ้าน',
  visualContent,
  updateVisualContent,
  isEditMode = false,
}) {
  /**
   * ข้อความในฉาก : ค่าที่หลังบ้านแก้ไว้มาก่อน ถ้ายังไม่เคยแก้ก็ใช้ค่าเริ่มต้น
   * ดึง homeTitle กับ searchPlaceholder จากชุดของหน้าเว็บหลักมาด้วย
   * เพราะช่องค้นหาในฉากใช้ฟิลด์เดียวกัน แก้ที่หลังบ้านครั้งเดียวเปลี่ยนทั้งสองที่
   */
  const copy = useMemo(() => ({
    homeTitle: DEFAULT_VISUAL_CONTENT.homeTitle,
    searchPlaceholder: DEFAULT_VISUAL_CONTENT.searchPlaceholder,
    ...CINE_TEXT,
    ...(visualContent || {}),
  }), [visualContent]);

  /* ช่องค้นหาในฉาก — ส่งต่อให้หน้าเว็บจัดการเหมือนช่องค้นหาปกติ */
  const [searchQuery, setSearchQuery] = useState('');
  const submitSearch = useCallback((event) => {
    event.preventDefault();
    if (isEditMode) return;
    if (onSearch) onSearch(searchQuery.trim());
  }, [isEditMode, onSearch, searchQuery]);

  /* ฉากพื้นหลัง : scrub / loop / poster ตามอุปกรณ์ */
  const { mode, coarse } = useVideoMode();
  const scrubSrc = useScrubSrc();
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  /**
   * HUD จูนจังหวะ — ฝั่งเซิร์ฟเวอร์อ่าน query ไม่ได้ ถ้า render ตรง ๆ จาก QUERY.debug
   * HTML สองฝั่งจะไม่ตรงกันแล้ว React ทิ้งทั้งต้นไม้ไป render ใหม่
   */
  const [showHud, setShowHud] = useState(false);
  useEffect(() => { setShowHud(QUERY.debug); }, []);

  const sectionRef = useRef(null);
  const worldRef = useRef(null);
  const videoRef = useRef(null);
  const videoLayerRef = useRef(null);
  const hudRef = useRef(null);
  const mapWrapRef = useRef(null);
  const searchRef = useRef(null);
  const featuredRef = useRef(null);
  const panelRefs = useRef({});
  const sliderRef = useRef(null);
  /* เอนจินอนิเมชันผูกครั้งเดียว จึงต้องอ่านสถานะโหมดแก้ไขผ่าน ref ไม่งั้นจะค้างค่าเก่า */
  const editModeRef = useRef(isEditMode);
  editModeRef.current = isEditMode;
  const progressRef = useRef(null);

  /* บ้านที่ยังขายอยู่ สำหรับปักหมุดบนแผนที่ตอนจบเรื่อง (ชุดเดียวกับที่หน้าเว็บหลักใช้) */
  const mapProps = useMemo(
    () => properties.filter(p => p && p.badge !== 'Sold Out'),
    [properties]
  );

  /* ---------- แถบทำเลเลื่อนอัตโนมัติ (ชุดเดียวกับหน้าเว็บหลัก) ---------- */
  const locationCards = useMemo(() => {
    const list = visibleLocations(normalizeLocations(visualContent?.locations));
    return list.map(loc => ({
      ...loc,
      img: LOCATION_IMG[loc.area] || loc.img,
      count: properties.filter(p => matchesMainArea(p, loc.area)).length,
    }));
  }, [visualContent, properties]);

  const openLocation = useCallback((event, area) => {
    if (event.ctrlKey || event.metaKey || event.button) return;
    event.preventDefault();
    if (isEditMode) return;
    if (onSelectLocation) onSelectLocation('main_location', area);
  }, [isEditMode, onSelectLocation]);

  /* ---------- เอนจินอนิเมชัน ---------- */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let targetMouseX = 0, targetMouseY = 0;
    let mouseX = 0, mouseY = 0;
    let targetScroll = 0, smoothScroll = 0;
    let initialized = false, rafPending = false, disposed = false;
    let lastFrameAt = 0;

    /* --- สถานะการเลื่อนหัวอ่านวิดีโอ --- */
    const SEEK_EPS = 0.016;          // ครึ่งเฟรม ต่ำกว่านี้ตาไม่เห็นความต่าง
    let seekPending = false;         // มีคำสั่ง seek ค้างอยู่ ห้ามสั่งซ้ำจนกว่าจะเสร็จ
    let videoDead = false;           // โหลดวิดีโอไม่ขึ้น เลิกยุ่งกับมันถาวร
    let seekWatchdog = null;

    const clearSeek = () => {
      if (seekWatchdog) clearTimeout(seekWatchdog);
      seekWatchdog = null;
      seekPending = false;
    };

    /* ซาฟารีบางรุ่นกลืน event seeked เงียบ ๆ ถ้าไม่มีตัวนี้คอยปลด วิดีโอจะค้างถาวร */
    const armSeekWatchdog = () => {
      if (seekWatchdog) clearTimeout(seekWatchdog);
      seekWatchdog = setTimeout(() => { clearSeek(); requestTick(); }, 350);
    };

    const getScrollDistance = () => clamp(
      -section.getBoundingClientRect().top,
      0,
      section.offsetHeight - window.innerHeight
    );

    const update = () => {
      rafPending = false;
      if (disposed) return;

      targetScroll = getScrollDistance();

      /**
       * ปกติหน่วงภาพด้วย lerp ให้ไหลตามนิ้วอย่างนุ่มนวล
       * แต่ถ้าตำแหน่งเป้าหมายกระโดดไกลเกินกว่าที่นิ้วคนจะปัดได้ในเฟรมเดียว
       * แปลว่าไม่ใช่การเลื่อน — เป็นการ "ดีด" เช่น เบราว์เซอร์กู้ตำแหน่งเดิมหลังรีเฟรช
       * หรือกดลิงก์ข้ามฉาก กรณีแบบนี้ต้องเข้าที่ทันที
       *
       * ถ้าปล่อยให้ lerp ไล่ หัวอ่านวิดีโอจะกวาดจากต้นเรื่องไปจนถึงจุดนั้นกินเวลาเป็นวินาที
       * ผู้ใช้จะเห็นเป็น "วิดีโอเล่นเอง" ทั้งที่ยังไม่ได้แตะจอเลย
       */
      if (!initialized || reduceMotion.matches || Math.abs(targetScroll - smoothScroll) > JUMP_PX) {
        smoothScroll = targetScroll;
        initialized = true;
        lastFrameAt = performance.now();
      } else {
        /**
         * หน่วงตาม "เวลาที่ผ่านไปจริง" ไม่ใช่ตามจำนวนเฟรม
         *
         * ของเดิมคูณ 0.14 ทุกเฟรม ซึ่งแปลว่าจอ 120Hz จะหน่วงแรงแค่ครึ่งเดียวของจอ 60Hz
         * (ภาพกระตุกกว่า) และเฟรมไหนที่เครื่องตกเฟรม ภาพจะกระโดดผิดจังหวะ
         * สูตรนี้ให้ผลเท่ากันทุกอัตราเฟรม จอไหนก็ไหลเท่ากัน
         */
        const now = performance.now();
        const dt = clamp(now - lastFrameAt, 1, 64);   // เพดาน 64ms กันแท็บที่เพิ่งกลับมาโฟกัสกระชาก
        lastFrameAt = now;
        smoothScroll = lerp(smoothScroll, targetScroll, 1 - Math.exp(-dt / EASE_TAU));
      }
      if (Math.abs(smoothScroll - targetScroll) < 0.08) smoothScroll = targetScroll;

      mouseX = lerp(mouseX, targetMouseX, 0.12);
      mouseY = lerp(mouseY, targetMouseY, 0.12);

      const s = smoothScroll;
      const px = reduceMotion.matches ? 0 : mouseX;
      const py = reduceMotion.matches ? 0 : mouseY;

      const progress = clamp(s / STORY_LENGTH);
      const introExit = smoothstep(70, 480, s);

      const sightsEnter = Math.pow(smoothstep(1480, 1880, s), 1.55);
      const sightsExit = Math.pow(smoothstep(2230, 2520, s), 1.4);
      const sightsShown = sightsEnter * (1 - sightsExit);
      const mapIn = smoothstep(MAP_RANGE[0], MAP_RANGE[1], s);

      /**
       * --- ชั้นวิดีโอ ---
       * ใช้ CSS ชุด .scene เดิม เลยได้พารัลแลกซ์เมาส์กับดอลลี่ช้า ๆ มาฟรี
       * ไม่ตั้ง --ry กับ --fx เพราะการหมุนหรือเบลอ <video> ทำให้หลุด compositor แล้วภาพกระตุก
       */
      const layer = videoLayerRef.current;
      if (layer) {
        layer.style.setProperty('--op', '1');
        layer.style.setProperty('--x', `${(px * -14).toFixed(2)}px`);
        layer.style.setProperty('--y', `${(py * -8).toFixed(2)}px`);
        layer.style.setProperty('--sc', (BASE_SCALE + progress * 0.04).toFixed(4));
      }

      /* --- หัวเรื่องกับข้อความเปิด --- */
      section.style.setProperty('--title-y', `${(introExit * -210 + py * 6).toFixed(2)}px`);
      section.style.setProperty('--title-scale', (1 - introExit * 0.08).toFixed(4));
      section.style.setProperty('--title-opacity', (1 - introExit).toFixed(4));
      section.style.setProperty('--intro-copy-y', `${(introExit * 90).toFixed(2)}px`);
      section.style.setProperty('--intro-copy-opacity', (1 - introExit).toFixed(4));

      /* --- แผ่นข้อความ --- */
      let panelHeat = 0;
      Object.entries(PANEL_SEGMENTS).forEach(([key, seg]) => {
        const el = panelRefs.current[key];
        if (!el) return;
        const part = segmentInOut(s, seg[0], seg[1], seg[2], seg[3]);
        const op = part.active * (1 - part.exit);
        el.style.setProperty('--op', op.toFixed(4));
        el.style.setProperty('--ty', `${(-part.exit * 86 + (1 - part.enter) * 58).toFixed(2)}px`);
        panelHeat = Math.max(panelHeat, op);
      });

      /**
       * ช่องค้นหาจะกดได้เฉพาะตอนที่มันโผล่มาจริง ๆ
       * inert ตัดออกจากลำดับ Tab ด้วย ไม่งั้นกดแท็บแล้วเคอร์เซอร์ไปโผล่ในช่องที่มองไม่เห็น
       */
      if (searchRef.current) {
        const shown = Number(panelRefs.current.offer?.style.getPropertyValue('--op') || 0) > 0.6;
        searchRef.current.style.pointerEvents = shown ? 'auto' : 'none';
        searchRef.current.inert = !shown;
      }
      if (featuredRef.current) {
        const shown = Number(panelRefs.current.room1?.style.getPropertyValue('--op') || 0) > 0.6;
        featuredRef.current.style.pointerEvents = shown ? 'auto' : 'none';
        featuredRef.current.inert = !shown;
      }

      /**
       * --- ม่านมืด ---
       * เดิมม่านนี้มาจากจังหวะจางสลับฉาก แต่พอเหลือวิดีโอเดียวก็ไม่มีการสลับแล้ว
       * เลยเปลี่ยนมาผูกกับ "ตอนนี้มีตัวหนังสืออยู่บนจอไหม" แทน
       * เพราะเฟรมไหนของวิดีโอจะสว่างแค่ไหนเราคุมไม่ได้ วิธีเดียวที่การันตีว่าอ่านออก
       * คือมืดลงทุกครั้งที่มีข้อความ
       *
       * introShade คือช่วงจอแรกที่มีชื่อบริษัทกับตัวเลขคลังบ้าน — ถ้าไม่ถ่วงไว้
       * ตัวอักษรขาวจะจมหายไปกับกำแพงปูนสว่าง ๆ ในเฟรมแรกของวิดีโอ
       */
      const introShade = (1 - introExit) * 0.55;
      // ช่วงแผนที่ต้องมืดกว่าปกติ เพราะเฟรมสวนหลังบ้านสว่างมาก ถ้าไม่ถ่วง
      // ทั้งหัวเรื่องและกรอบแผนที่จะกลืนไปกับพื้นหลัง
      const mapShade = mapIn * 0.5;
      section.style.setProperty('--shade-top-alpha', Math.max(panelHeat * 0.34, introShade, mapShade).toFixed(4));
      section.style.setProperty('--shade-mid-alpha', Math.max(panelHeat * 0.30, introShade * 0.34, mapShade).toFixed(4));
      section.style.setProperty('--shade-bottom-alpha', Math.max(panelHeat * 0.38, introShade * 0.62, mapShade).toFixed(4));

      /**
       * --- แผนที่หมุดโครงการตอนจบ ---
       * ต้องปิด pointerEvents ตอนยังจางอยู่ ไม่งั้นแผนที่ที่มองไม่เห็นจะดักคลิกไว้
       * (ใช้กติกาเดียวกับสไลเดอร์บ้านด้านบน)
       */
      if (mapWrapRef.current) {
        mapWrapRef.current.style.setProperty('--map-op', mapIn.toFixed(4));
        mapWrapRef.current.style.setProperty('--map-y', `${((1 - mapIn) * 54).toFixed(2)}px`);
        mapWrapRef.current.style.visibility = mapIn > 0.01 ? 'visible' : 'hidden';
        mapWrapRef.current.style.pointerEvents = mapIn > 0.6 ? 'auto' : 'none';
      }

      /* --- แถบความคืบหน้า กับ ปุ่มข้ามฉาก --- */
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
      }

      /* --- สไลเดอร์บ้าน --- */
      if (sliderRef.current) {
        sliderRef.current.style.setProperty('--sights-visibility', sightsShown > 0.01 ? 'visible' : 'hidden');
        sliderRef.current.style.setProperty(
          '--sights-enter-x',
          `${((1 - sightsEnter) * 420 - sightsExit * 470).toFixed(3)}vw`
        );
        sliderRef.current.style.pointerEvents = sightsShown > 0.6 ? 'auto' : 'none';
      }

      /**
       * --- ไล่หัวอ่านวิดีโอไปยังจุดที่การเลื่อนชี้ ---
       * เขียน currentTime ตรง ๆ ไม่หน่วงซ้ำ เพราะ s ผ่าน lerp 0.14 มาแล้ว
       * ถ้าหน่วงอีกชั้นภาพจะตามหลังมือจนรู้สึกได้
       *
       * ระหว่างที่ยังซีคไม่เสร็จจะไม่สั่งซ้ำ และไม่ขอเฟรมใหม่ด้วย
       * ปล่อยให้ event seeked เป็นคนปลุก — rAF จะได้ไม่หมุนฟรีตอนรอ
       */
      let videoChasing = false;
      const vid = videoRef.current;
      if (mode === 'scrub' && vid && !videoDead && vid.readyState >= 1
          && Number.isFinite(vid.duration) && vid.duration > 0) {
        // ไม่วิ่งไปสุดพอดี บางเบราว์เซอร์จะยิง ended แล้วดับภาพ
        const want = clamp(timeForScroll(s), 0, vid.duration - 1 / 24);
        const gap = want - vid.currentTime;
        if (Math.abs(gap) > SEEK_EPS) {
          if (!seekPending) {
            seekPending = true;
            vid.currentTime = want;
            armSeekWatchdog();
          }
          videoChasing = !seekPending;
        }
      }

      if (hudRef.current) {
        const vt = vid ? vid.currentTime : 0;
        const rs = vid ? vid.readyState : -1;      // 0 = ยังไม่มีข้อมูลเลย ซีคไม่ได้
        const ns = vid ? vid.networkState : -1;    // 3 = ไม่มีแหล่งวิดีโอ
        const buf = vid && vid.buffered.length ? vid.buffered.end(vid.buffered.length - 1) : 0;
        hudRef.current.textContent =
          `px ${Math.round(s)} | t ${vt.toFixed(2)}/${VIDEO_DURATION} | ${mode}`
          + ` | ready ${rs} net ${ns} buf ${buf.toFixed(1)}s`
          + ` | ${videoDead ? 'DEAD' : 'ok'}${seekPending ? ' seeking' : ''}`;
      }

      if (
        Math.abs(smoothScroll - targetScroll) > 0.08 ||
        Math.abs(mouseX - targetMouseX) > 0.001 ||
        Math.abs(mouseY - targetMouseY) > 0.001 ||
        videoChasing
      ) {
        requestTick();
      }
    };

    function requestTick() {
      if (rafPending || disposed) return;
      rafPending = true;
      requestAnimationFrame(update);
    }

    /**
     * ---------- ดูดเข้าสถานี ----------
     * ปัญหาเดิม : สะบัดนิ้วทีเดียวมักเลยแผ่นที่มีของให้กด (ทำเล / ประเภทบ้าน / แผนที่)
     * ไปค้างครึ่ง ๆ กลาง ๆ แล้วต้องเลื่อนย้อนกลับมาเอง
     *
     * กติกาที่ยึด — ห้ามแย่งการควบคุมจากผู้ใช้เด็ดขาด
     *   • เริ่มดูดก็ต่อเมื่อ "หยุดเลื่อนแล้วจริง ๆ" (เงียบครบ SNAP_IDLE) และนิ้วไม่ได้แตะจออยู่
     *   • ดูดเฉพาะเมื่อหยุดใกล้สถานีไม่เกิน SNAP_CATCH — ถ้าตั้งใจเลื่อนผ่านไปไกล ปล่อยไป
     *   • ระหว่างดูด ถ้าผู้ใช้ขยับล้อ/นิ้ว/ปุ่มลูกศร เลิกทันที ไม่ดึงกลับ
     *   • ผู้ที่ขอลดการเคลื่อนไหว หรืออยู่ในโหมดแก้ไขหลังบ้าน ไม่ดูดเลย
     *   • ยังไม่เคยเลื่อนเองสักครั้ง ไม่ดูด (กันไปชนกับการกู้ตำแหน่งตอนรีเฟรช)
     */
    let snapTimer = null;
    let snapRaf = null;
    let snapSuppressUntil = 0;   // ช่วงที่ห้ามดูด เพราะมีการกระโดดตำแหน่งโดยเจตนาอยู่
    let snapWroteY = -1;       // ค่าที่เราเขียนล่าสุด ใช้จับว่าผู้ใช้แทรกเข้ามาไหม
    let touching = false;
    /**
     * ผู้ใช้ลงมือเลื่อนเองแล้วหรือยัง
     * ต้องนับจาก "อินพุตจริง" (ล้อ นิ้ว ปุ่ม ลากแถบเลื่อน) เท่านั้น ห้ามนับจาก event scroll เฉย ๆ
     * เพราะการกู้ตำแหน่งหลังรีเฟรชก็ยิง scroll เหมือนกัน ถ้านับด้วยจะโดนดูดตั้งแต่เพิ่งเปิดหน้า
     * แล้วเห็นภาพขยับเองทั้งที่ยังไม่ได้แตะอะไร
     */
    let userInput = false;
    let heldAt = null;      // สถานีที่กำลังจอดอยู่ (ยึดแน่นกว่าสถานีอื่น)
    let pullBacks = 0;      // ดึงกลับสถานีนี้ไปแล้วกี่ครั้งติด — ครั้งที่สองปล่อยให้ออกได้

    const cancelSnap = () => {
      if (snapTimer) { clearTimeout(snapTimer); snapTimer = null; }
      if (snapRaf) { cancelAnimationFrame(snapRaf); snapRaf = null; }
      snapWroteY = -1;
    };

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const runSnap = (toY) => {
      const fromY = window.scrollY;
      const dist = toY - fromY;
      if (Math.abs(dist) < SNAP_MIN) return;
      const t0 = performance.now();
      const step = () => {
        snapRaf = null;
        if (disposed) return;
        /* ผู้ใช้ขยับเองระหว่างทาง — ปล่อยมือทันที */
        if (snapWroteY >= 0 && Math.abs(window.scrollY - snapWroteY) > SNAP_TAKEOVER) { cancelSnap(); return; }
        const k = clamp((performance.now() - t0) / SNAP_MS, 0, 1);
        const y = Math.round(fromY + dist * easeOutCubic(k));
        snapWroteY = y;
        window.scrollTo({ top: y, left: 0, behavior: 'instant' });
        requestTick();
        if (k < 1) snapRaf = requestAnimationFrame(step);
        else { snapRaf = null; snapWroteY = -1; }
      };
      snapRaf = requestAnimationFrame(step);
    };

    const armSnap = () => {
      if (snapTimer) clearTimeout(snapTimer);
      /**
       * จอสัมผัสปล่อยให้ CSS scroll-snap จัดการแทน
       * เพราะ JS ต้องรอให้โมเมนตัมหยุดสนิทก่อนถึงจะเริ่มดูด แต่การสะบัดนิ้วแรง ๆ
       * บน iOS ไหลไปได้เป็นพันพิกเซล พอหยุดก็เลย SNAP_CATCH ไปแล้ว ไม่มีอะไรดึงกลับ
       * ส่วนเบราว์เซอร์รู้จุดจอดตั้งแต่ตอนกำลังหน่วงความเร็ว จึงจอดตรงได้
       */
      if (coarse) return;
      if (editModeRef.current || reduceMotion.matches || !userInput) return;
      if (performance.now() < snapSuppressUntil) return;
      snapTimer = setTimeout(() => {
        snapTimer = null;
        if (disposed || touching || editModeRef.current) return;
        const here = getScrollDistance();
        /* อยู่นอกฉาก (ยังไม่เข้า หรือเลื่อนพ้นไปอ่านเนื้อหาข้างล่างแล้ว) ไม่ยุ่ง */
        if (here <= 0 || here >= section.offsetHeight - window.innerHeight) return;
        /**
         * สถานีที่กำลังจอดอยู่ยึดแน่นกว่าสถานีที่แค่เลื่อนผ่าน — ออกยากกว่าเข้า
         *
         * แต่ต้องไม่กลายเป็นกรงขัง : ถ้าดึงกลับไปแล้วผู้ใช้ยังยืนยันจะออกอีก
         * ครั้งที่สองให้ใช้ระยะปกติ เลื่อนพ้น SNAP_CATCH เมื่อไหร่ก็ไปได้เลย
         */
        let best = null;
        for (const st of STATIONS) {
          const home = heldAt === st.at;
          const radius = (home && pullBacks === 0) ? SNAP_HOLD : SNAP_CATCH;
          const d = Math.abs(st.at - here);
          if (d <= radius && (!best || d < best.d)) best = { d, at: st.at, home };
        }
        if (!best) { heldAt = null; pullBacks = 0; return; }
        if (best.d < SNAP_MIN) { heldAt = best.at; pullBacks = 0; return; }
        if (best.home) pullBacks += 1;
        else { heldAt = best.at; pullBacks = 0; }
        runSnap(section.offsetTop + best.at);
      }, SNAP_IDLE);
    };

    const onScroll = () => {
      requestTick();
      /* ถ้าการเลื่อนนี้คือฝีมือเราเอง อย่าไปยกเลิกตัวเอง */
      if (snapRaf !== null && snapWroteY >= 0 && Math.abs(window.scrollY - snapWroteY) <= SNAP_TAKEOVER) return;
      cancelSnap();
      armSnap();
    };
    const onResize = () => { cancelSnap(); requestTick(); };
    /* สัญญาณว่าผู้ใช้กำลังลงมือเอง — หยุดดูดทันทีทุกกรณี */
    const onUserTakeOver = () => { userInput = true; cancelSnap(); };
    const onTouchStart = () => { userInput = true; touching = true; cancelSnap(); };
    const onTouchEnd = () => { touching = false; armSnap(); };
    const onPointerMove = (event) => {
      targetMouseX = event.clientX / window.innerWidth - 0.5;
      targetMouseY = event.clientY / window.innerHeight - 0.5;
      requestTick();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('wheel', onUserTakeOver, { passive: true });
    window.addEventListener('keydown', onUserTakeOver);
    /* ลากแถบเลื่อน หรือกดปุ่มบนหน้า ก็นับว่าผู้ใช้ลงมือเอง */
    window.addEventListener('pointerdown', onUserTakeOver, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    /* บนมือถือ pointermove ยิงตอนแตะจอ ทำให้ภาพกระตุกทุกครั้งที่จิ้ม เลยเปิดเฉพาะเครื่องที่มีเมาส์ */
    if (mode === 'scrub' && !coarse) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }

    /**
     * --- ปลดล็อกวิดีโอบน iOS ---
     * Safari บนมือถือจะไม่ถอดรหัสภาพเลยจนกว่าวิดีโอจะเคยถูกสั่ง play() มาก่อน
     * ต่อให้เราสั่ง currentTime ไปเรื่อย ๆ ภาพก็จะค้างอยู่เฟรมแรก (ประตูไม่เปิดสักที)
     * จึงสั่ง play() แล้ว pause() ทันทีหนึ่งครั้ง เพื่อ "เปิดสวิตช์" ให้ซีคได้
     * ลองตั้งแต่โหลดเสร็จก่อน ถ้าถูกบล็อกค่อยรอจังหวะที่ผู้ใช้แตะจอครั้งแรก
     */
    const vidEl = videoRef.current;
    /**
     * React ใส่ muted เป็น property เท่านั้น ไม่ยอมใส่เป็นแอตทริบิวต์ลง HTML
     * (ลอง defaultMuted แล้วก็ยังไม่ขึ้น) แต่ Safari บน iOS ดูที่ "แอตทริบิวต์"
     * ถ้าไม่มีจะถือว่าวิดีโอมีเสียง แล้วบล็อกไม่ให้เล่น — ต้องยัดเองตรงนี้
     */
    if (vidEl) { vidEl.setAttribute('muted', ''); vidEl.muted = true; }
    let unlocked = false;
    /**
     * กันวิดีโอเล่นเอง — ทันทีที่มันเริ่มเล่นด้วยเหตุใดก็ตาม ให้หยุดแล้วดึงหัวอ่าน
     * กลับไปยังตำแหน่งที่การเลื่อนหน้าจอชี้อยู่
     * เป็นตาข่ายชั้นสุดท้าย ต่อให้เบราว์เซอร์รุ่นไหนแอบสั่งเล่นเองก็ไม่หลุด
     */
    const onVideoPlay = () => {
      unlocked = true;                      // ได้ event play = ตัวถอดรหัสปลดล็อกแล้ว
      const v = videoRef.current;
      if (!v || disposed) return;
      try { v.pause(); } catch (e) { /* ไม่เป็นไร */ }
      requestTick();                        // ซีคกลับไปวินาทีที่ควรจะเป็น
    };
    const unlock = () => {
      const v = videoRef.current;
      if (!v || unlocked || disposed) return;
      v.muted = true;
      /* iOS มักเมิน preload="auto" จนกว่าจะมี user gesture ทำให้ readyState ค้างที่ 0
         แล้วเงื่อนไข readyState >= 1 ในลูปซีคไม่มีวันเป็นจริง ประตูจึงไม่เปิดสักที */
      if (v.readyState === 0) { try { v.load(); } catch (e) { /* ไม่เป็นไร */ } }
      let p;
      try { p = v.play(); } catch (e) { return; }
      /**
       * หยุดทันทีในจังหวะเดียวกัน ห้ามรอ promise
       * promise ของ play() จะ resolve ก็ต่อเมื่อ "ภาพเริ่มวิ่งไปแล้ว" ซึ่งบนมือถือ
       * กินเวลาหลายร้อยมิลลิวินาที ผู้ใช้จะเห็นวิดีโอเล่นเองตอนเพิ่งเปิดหน้า
       * สั่ง pause() ตรงนี้จะทำให้ promise ปฏิเสธด้วย AbortError ซึ่งเป็นเรื่องปกติ ไม่ใช่ error จริง
       * สวิตช์ที่ iOS ปลดให้ ถูกปลดตั้งแต่ตอนเรียก play() แล้ว การหยุดทันทีไม่ทำให้ล็อกกลับ
       */
      try { v.pause(); } catch (e) { /* ไม่เป็นไร */ }
      if (p && typeof p.then === 'function') p.catch(() => { /* ถูกบล็อกหรือ AbortError — รอแตะจอ */ });
    };
    const unlockOnGesture = () => { unlock(); };
    if (mode === 'scrub') {
      unlock();
      window.addEventListener('touchstart', unlockOnGesture, { passive: true });
      window.addEventListener('pointerdown', unlockOnGesture, { passive: true });
    }

    const onSeeked = () => { clearSeek(); requestTick(); };
    const onVideoReadyEvent = () => { requestTick(); };
    const onVideoError = () => { videoDead = true; clearSeek(); setVideoFailed(true); };
    if (vidEl) {
      if (mode === 'scrub') vidEl.addEventListener('play', onVideoPlay);
      vidEl.addEventListener('seeked', onSeeked);
      vidEl.addEventListener('loadedmetadata', onVideoReadyEvent);
      vidEl.addEventListener('loadeddata', onVideoReadyEvent);
      vidEl.addEventListener('canplaythrough', onVideoReadyEvent);
      vidEl.addEventListener('error', onVideoError);
    }

    requestTick();

    /* เบราว์เซอร์อาจกู้ตำแหน่งสกอลล์ทับทีหลัง เลยยิงซ้ำอีกสองจังหวะให้แน่ใจ */
    let deepLinkTimer = null;
    if (DEEP_LINK_AT) {
      const jump = () => {
        if (disposed) return;
        /* ลิงก์นี้ระบุตำแหน่งมาเป๊ะ ๆ ห้ามให้ระบบดูดสถานีลากออกไปจากจุดที่สั่ง */
        snapSuppressUntil = performance.now() + 900;
        cancelSnap();
        window.scrollTo({ top: section.offsetTop + DEEP_LINK_AT, behavior: 'instant' });
        requestTick();
      };
      jump();
      requestAnimationFrame(jump);
      deepLinkTimer = setTimeout(jump, 400);
    }

    return () => {
      disposed = true;
      clearSeek();
      cancelSnap();
      if (deepLinkTimer) clearTimeout(deepLinkTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('wheel', onUserTakeOver);
      window.removeEventListener('keydown', onUserTakeOver);
      window.removeEventListener('pointerdown', onUserTakeOver);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchstart', unlockOnGesture);
      window.removeEventListener('pointerdown', unlockOnGesture);
      if (vidEl) {
        vidEl.removeEventListener('play', onVideoPlay);
        vidEl.removeEventListener('seeked', onSeeked);
        vidEl.removeEventListener('loadedmetadata', onVideoReadyEvent);
        vidEl.removeEventListener('loadeddata', onVideoReadyEvent);
        vidEl.removeEventListener('canplaythrough', onVideoReadyEvent);
        vidEl.removeEventListener('error', onVideoError);
      }
    };
    // ต้องผูกใหม่เมื่อโหมดพลิก ไม่งั้น ref ที่จับไว้จะเป็นของ element เก่าที่ถูกถอดไปแล้ว
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, coarse, scrubSrc]);

  return (
    <>
      <style>{cinemaCss}</style>

      <section className={`cinema-scroll${isEditMode ? ' is-editing' : ''}`} ref={sectionRef} aria-label={`เรื่องเล่าบ้าน ${companyName} แบบเลื่อนหน้าจอ`}>
        {/**
          * จุดจอดสำหรับ CSS scroll-snap — ใช้เฉพาะจอสัมผัส
          * วางที่ระยะ scroll ของแต่ละสถานีพอดี พอ scroll-snap-align: start
          * เบราว์เซอร์จะจัดให้ขอบบนจอตรงกับจุดนี้ = ระยะเลื่อนเท่ากับ at พอดี
          */}
        {STATIONS.map((st) => (
          <i key={st.key} className="cine-snap" style={{ top: `${st.at}px` }} aria-hidden="true" />
        ))}

        <div className="stage">
          <div className="world" ref={worldRef}>

            {/* ฉากทั้งเรื่องเป็นวิดีโอตัวเดียว เดินหน้า-ถอยหลังตามการเลื่อน */}
            <div className="scene cine-layer" ref={videoLayerRef} style={{ '--op': 1 }}>
              {/* ภาพนิ่งรองอยู่ใต้ตลอด : ยังโหลดไม่เสร็จ ซีคไปช่วงที่ยังไม่บัฟเฟอร์ หรือโหลดไม่ขึ้น ก็ไม่มีทางเห็นจอดำ */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={`scene-main cine-poster${videoReady && !videoFailed ? ' is-hidden' : ''}`}
                src={MEDIA.poster}
                alt=""
              />

              {mode !== 'poster' && !videoFailed && (
                <video
                  ref={videoRef}
                  className={`scene-main cine-video${videoReady ? ' is-ready' : ''}`}
                  src={scrubSrc}
                  /* วิดีโออยู่บน Cloudinary = คนละโดเมน ต้องขอแบบ CORS ให้ชัด
                     ปลายทางส่ง Access-Control-Allow-Origin: * มาอยู่แล้ว
                     ถ้าไม่ใส่ Safari จะถือว่าเป็นสื่อปนเปื้อนแล้วซีคได้ไม่เต็มที่ */
                  crossOrigin="anonymous"
                  /* พอวิดีโอพร้อมแล้วต้องถอด poster ทิ้ง ไม่งั้นบางเบราว์เซอร์บนมือถือ
                     จะวาดภาพ poster (เฟรมแรก = ประตูปิด) แทรกขึ้นมาระหว่างที่กำลังซีค
                     เห็นเป็นภาพกระพริบกลับไปต้นเรื่องเป็นระยะ เหมือนหน้าเว็บรีเฟรชเอง */
                  poster={videoReady ? undefined : MEDIA.poster}
                  preload="auto"
                  /* defaultMuted ใส่ "แอตทริบิวต์" muted ลง HTML จริง
                     ถ้าใส่แค่ muted อย่างเดียว React จะตั้งเป็น property เท่านั้น
                     แล้ว Safari บน iOS จะถือว่าวิดีโอมีเสียง เลยบล็อกไม่ให้เล่นและไม่ยอมถอดรหัสภาพ */
                  defaultMuted
                  muted
                  playsInline
                  disablePictureInPicture
                  disableRemotePlayback
                  tabIndex={-1}
                  aria-hidden="true"
                  onLoadedData={() => setVideoReady(true)}
                  onError={() => setVideoFailed(true)}
                />
              )}
            </div>

            <div className="shade" />

            {/*
              หัวเรื่องกับก้อนข้อความอยู่ในกล่องเดียวกัน แล้วให้กล่องจัดกึ่งกลางแนวตั้งทั้งจอ
              ของเดิมแยกกันคนละตัว ตัวบนยึดขอบบน ตัวล่างยึดขอบล่าง ด้วยสูตรคนละสูตร
              พอความสูงจอเปลี่ยน ระยะบน-ล่างจึงไม่เท่ากัน กลุ่มข้อความเลยลอยสูงกว่ากลางจอ
            */}
            <div className="hero-stack">
              <h1 className="hero-title">
                <span className="hero-title-main">{companyName}</span>
                <span className="hero-title-sub">Real Estate</span>
              </h1>

              <div className="intro-copy">
                <p className="intro-lead">
                  {tagline} — <CineText tag="span" field="cineTagline" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
                </p>

                {/*
                  ตัวเลขเล่าแบรนด์ — เป็นข้อความล้วน กดไม่ได้ เพราะไม่มีปลายทางให้ไป
                  เดิมเป็นปุ่มที่นับจำนวนจากคลังบ้านสด ๆ แล้วกดข้ามไปหน้ารวมบ้าน
                  พอเปลี่ยนเป็นตัวเลขภาพรวมของบริษัท การกดได้จะทำให้ลูกค้าคาดหวังผิด
                */}
                <div className="hero-stats">
                  {[1, 2, 3].map(i => (
                    <div className="hero-stat" key={i}>
                      <CineText tag="strong" field={`cineStat${i}Num`} copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
                      <CineText tag="span" field={`cineStat${i}Label`} copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
                    </div>
                  ))}
                </div>

                <div className="hero-tags">
                  <CineText tag="span" field="cineTag1" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
                  <CineText tag="span" field="cineTag2" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
                  <CineText tag="span" field="cineTag3" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
                </div>
                <div className="scroll-hint" aria-hidden="true"><span /></div>
              </div>
            </div>

            <section className="story-panel panel-lo" ref={el => { panelRefs.current.gate = el; }}>
              <CineText tag="h2" field="cineGateTitle" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
              <CineText tag="p" field="cineGateDesc" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
            </section>

            {/* ช่องค้นหา — ชุดเดียวกับที่หน้าเว็บหลักใช้ ทั้งหัวเรื่องและ placeholder แก้จากหลังบ้านได้ */}
            <section className="story-panel panel-top panel-search" ref={el => { panelRefs.current.offer = el; }}>
              <EditableText
                tag="h2"
                fieldKey="homeTitle"
                content={visualContent}
                updateContent={updateVisualContent}
                isEditMode={isEditMode}
                className=""
              />
              <form className="cine-search" ref={searchRef} onSubmit={submitSearch}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={copy.searchPlaceholder}
                  aria-label="ค้นหาบ้าน"
                  disabled={isEditMode}
                />
                <button type="submit" disabled={isEditMode} aria-label="ค้นหา">
                  <Search size={20} />
                </button>
              </form>
            </section>

            <section className="story-panel panel-lo" ref={el => { panelRefs.current.garden2 = el; }}>
              <CineText tag="h2" field="cineGarden2Title" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
              <CineText tag="p" field="cineGarden2Desc" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
            </section>

            <section className="story-panel panel-featured" ref={el => { panelRefs.current.room1 = el; }}>
              <CineText tag="h2" field="cineRoom1Title" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
              <CineText tag="p" field="cineRoom1Desc" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
              <div className="fh-wrap" ref={featuredRef}>
                <FeaturedHomes
                  isEditMode={isEditMode}
                  hrefFor={(cat) => searchResultHref('category', cat)}
                  onSelectCategory={(e, cat) => {
                    if (e.ctrlKey || e.metaKey || e.button) return;
                    e.preventDefault();
                    if (onSelectCategory) onSelectCategory('category', cat);
                  }}
                />
              </div>
            </section>

            <section className="story-panel panel-lo" ref={el => { panelRefs.current.room2 = el; }}>
              <CineText tag="h2" field="cineRoom2Title" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
              <CineText tag="p" field="cineRoom2Desc" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
            </section>

            <section className="story-panel panel-hi" ref={el => { panelRefs.current.room3 = el; }}>
              <CineText tag="h2" field="cineRoom3Title" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
              <CineText tag="p" field="cineRoom3Desc" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
            </section>

            {/* หัวเรื่องของแผนที่ — ต้องอยู่สูงกว่าแผ่นอื่น เพราะแผนที่กินพื้นที่ครึ่งล่าง */}
            <section className="story-panel panel-map" ref={el => { panelRefs.current.closing = el; }}>
              <CineText tag="h2" field="cineClosingTitle" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
              <CineText tag="p" field="cineClosingDesc" copy={copy} onChange={updateVisualContent} isEditMode={isEditMode} />
            </section>

            {/* แกลเลอรีทำเล — คอมโพเนนต์แยก ข้อมูลมาจาก Firestore ชุดเดียว */}
            <div className="sights-slider" ref={sliderRef}>
              <LocationCarousel
                items={locationCards}
                isEditMode={isEditMode}
                hrefFor={(area) => searchResultHref('main_location', area)}
                onSelect={openLocation}
                imageUrl={(loc) => getOptimizedImg(loc?.img, 900)}
              />
            </div>

            {/* บอกว่าเลื่อนมาถึงไหนแล้วของฉาก */}
            <div className="cine-progress" aria-hidden="true"><i ref={progressRef} /></div>

            {/* เครื่องมือจูนจังหวะ เปิดด้วย ?debug=1 — เขียนผ่าน ref ห้ามใช้ state จะ re-render 60 ครั้ง/วิ */}
            {showHud && <div className="cine-hud" ref={hudRef} aria-hidden="true" />}

          </div>

          {/*
            แผนที่หมุดโครงการ — ปิดท้ายเรื่อง
            วางไว้นอก .world ตั้งใจ เพราะ .world ตั้ง perspective ไว้
            ถ้าเอาแผนที่ไปอยู่ข้างใน Leaflet จะคำนวณตำแหน่งคลิกเพี้ยน
          */}
          <div className="cine-map" ref={mapWrapRef} aria-label="แผนที่ทำเลที่มีบ้าน">
            <PropertyMap properties={mapProps} onSelectProp={onSelectProp} variant="story" />
          </div>
        </div>
      </section>
    </>
  );
}

const cinemaCss = `
/* จุดจอดของ scroll-snap สูงศูนย์ มองไม่เห็น ไม่กินพื้นที่ ไม่รับการกด */
.cinema-scroll .cine-snap {
  position: absolute; left: 0; width: 1px; height: 1px;
  pointer-events: none; visibility: hidden;
}
/**
 * เปิด scroll-snap เฉพาะเครื่องที่ไม่มีเมาส์
 * ใช้ proximity ไม่ใช่ mandatory — จอดให้เมื่อหยุดใกล้จุดเท่านั้น
 * ถ้าตั้งใจสะบัดยาวผ่านไปเลย ก็ยังไปได้ ไม่ถูกบังคับให้จอดทุกจุด
 * หน้าอื่นไม่มีจุดจอด จึงเลื่อนอิสระเหมือนเดิม
 */
@media (hover: none) {
  html { scroll-snap-type: y proximity; }
  .cinema-scroll .cine-snap { scroll-snap-align: start; }
}
@media (hover: none) and (prefers-reduced-motion: reduce) {
  html { scroll-snap-type: none; }
}

.cinema-scroll {
  --shade-top-alpha: 0; --shade-mid-alpha: 0; --shade-bottom-alpha: 0;
  --blur-tint: 7, 18, 11;
  --title-y: 0px; --title-scale: 1; --title-opacity: 1;
  --intro-copy-y: 0px; --intro-copy-opacity: 1;
  --sights-top: clamp(250px, 36vh, 400px);
  --map-top: clamp(232px, 33vh, 330px);
  --map-height: clamp(300px, 56vh, 540px);
  position: relative;
  height: calc(100vh + ${STORY_LENGTH}px);
  color: #fdf1e1;
}
.cinema-scroll .stage {
  position: sticky; top: 0; height: 100vh; min-height: 620px;
  overflow: hidden; isolation: isolate; background: #0b1f12;
}
.cinema-scroll .world {
  position: absolute; inset: 0; overflow: hidden;
  background: #0b1f12; perspective: 2000px;
}
.cinema-scroll .scene {
  position: absolute; inset: 0; overflow: hidden; transform-origin: 50% 50%;
  opacity: var(--op, 0);
  transform: translate3d(var(--x, 0px), var(--y, 0px), 0) rotateY(var(--ry, 0deg)) scale(var(--sc, 1));
  filter: var(--fx, none);
  will-change: transform, opacity;
  pointer-events: none; user-select: none;
}
/**
 * ภาพเต็มจอเสมอ ส่วนที่ล้นกรอบจะถูกตัดทิ้ง
 *
 * ประตูไม่ได้อยู่กลางเฟรมพอดี — รอยต่อที่บานสองข้างมาชนกันอยู่ที่คอลัมน์ 979 จาก 1920
 * คือเยื้องขวาจากกึ่งกลางเฟรม 19px (1% ของความกว้าง) วัดจากการซูมดูรอยต่อโดยตรง
 * ถ้าปล่อยให้ครอบตรงกลางเป๊ะ (50%) ประตูจะเบี้ยวไปทางขวา
 * บนคอมแทบไม่เห็นเพราะเห็นภาพกว้างถึง 75% แต่บนมือถือเห็นแค่ 27% ตรงกลาง
 * ความเยื้อง 2% จึงถูกขยายเป็น 7% ของความกว้างจอ ตาจับได้ทันที
 *
 * ค่า % ของ object-position คิดจาก "ส่วนที่ล้นกรอบ" ซึ่งมากน้อยต่างกันตามอัตราส่วนจอ
 * เลขเดียวจึงใช้ไม่ได้ทุกจอ ต้องแยกค่าให้จอกว้างกับจอแคบ
 */
.cinema-scroll .scene-main {
  position: absolute; inset: 0; width: 100%; height: 100%; display: block;
  object-fit: cover; object-position: 55% 50%;
  -webkit-user-drag: none;
}
@media (max-width: 860px) {
  .cinema-scroll .scene-main { object-position: 51.3% 50%; }
}
/* ภาพนิ่งอยู่ล่าง วิดีโอทับข้างบน แล้วค่อยจางเข้ามาเมื่อพร้อม — จะได้ไม่มีวินาทีไหนที่จอว่าง */
.cinema-scroll .cine-layer, .cinema-scroll .cine-poster { z-index: 0; }
/* วิดีโอพร้อมแล้วก็ไม่ต้องมีภาพนิ่งรออยู่ข้างใต้ กันไม่ให้มันโผล่แทรกตอนซีค */
.cinema-scroll .cine-poster.is-hidden { visibility: hidden; }
.cinema-scroll .cine-video {
  z-index: 1; opacity: 0; background: #0b1f12;
  transition: opacity 420ms ease;
  pointer-events: none;
}
.cinema-scroll .cine-video.is-ready { opacity: 1; }
.cinema-scroll .cine-hud {
  position: absolute; z-index: 60; left: 14px; bottom: 14px;
  padding: 6px 12px; border-radius: 8px; pointer-events: none;
  background: rgba(0,0,0,0.66); color: #9fe6b4;
  font: 12px/1.4 ui-monospace, Menlo, Consolas, monospace; letter-spacing: 0.04em;
}
.cinema-scroll .shade {
  position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background: linear-gradient(180deg,
    rgba(var(--blur-tint), var(--shade-top-alpha)) 0%,
    rgba(var(--blur-tint), var(--shade-mid-alpha)) 48%,
    rgba(var(--blur-tint), var(--shade-bottom-alpha)) 100%);
}
/**
 * กล่องรวมหัวเรื่องกับก้อนข้อความ กินเต็มจอแล้วจัดกึ่งกลางแนวตั้งให้เอง
 * ระยะเหนือหัวเรื่องกับใต้ปุ่มเลื่อนลงจึงเท่ากันเสมอ ไม่ว่าจอจะสูงเท่าไร
 *
 * ปิดรับคลิกไว้ เพราะข้อความในนี้กดไม่ได้อยู่แล้ว (ยกเว้นตอนแก้ข้อความจากหลังบ้าน)
 * ถ้าไม่ปิด กล่องเปล่า ๆ นี้จะดักคลิกทับของที่อยู่ข้างหลังตอนมันจางหายไปแล้ว
 */
.cinema-scroll .hero-stack {
  position: absolute; inset: 0; z-index: 20;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: clamp(22px, 4vh, 52px); padding: 0 16px;
  pointer-events: none;
}
.cinema-scroll.is-editing .hero-stack { pointer-events: auto; }
.cinema-scroll .hero-title {
  max-width: 100%; margin: 0; color: #fdf1e1;
  font-family: Prompt, system-ui, sans-serif;
  font-size: 6.6rem; font-weight: 200; line-height: 1.06;
  text-transform: uppercase;
  text-align: center; text-shadow: 0 22px 60px rgba(0,0,0,0.42);
  display: flex; flex-direction: column; align-items: center;
  opacity: var(--title-opacity);
  transform: translate3d(0, var(--title-y), 0) scale(var(--title-scale));
  will-change: transform, opacity;
}
/**
 * โลโก้สองบรรทัด : ชื่อบริษัทตัวใหญ่ ตามด้วย Real Estate ตัวเล็กกว่า
 * แล้วขีดยาวใต้สุดแบบเดียวกับเส้นใต้ในโลโก้บริษัท
 * ความยาวขีดผูกกับความกว้างของบรรทัดบน (ตัว h1 เป็น flex คอลัมน์ที่จัดกลาง
 * ลูกทุกตัวจึงกว้างเท่าที่เนื้อหาต้องการ) จึงยืดหดตามขนาดจอเองโดยไม่ต้องกำหนดค่า
 */
.cinema-scroll .hero-title-main { display: block; letter-spacing: 0.2em; }
.cinema-scroll .hero-title-sub {
  display: block;
  margin-top: 0.28em;
  font-size: 0.34em;          /* อิงจากขนาดบรรทัดบน จึงย่อขยายตามกันทุกจอ */
  letter-spacing: 0.46em;
  /* ห้ามหรี่ opacity ที่นี่ ตัวหนังสือจะขาวไม่เท่าบรรทัดบนทันที
     ถ้าอยากให้ขีดจางกว่าตัวหนังสือ ให้ไปหรี่ที่ ::after อย่างเดียว */
}
/* ขีดยาวเท่าบรรทัด "Real Estate" ไม่ใช่เท่าชื่อบริษัท
   วางไว้ที่บรรทัดล่างแทนที่จะเป็นตัว h1 เพราะ h1 เป็น flex คอลัมน์
   ความกว้างจึงเท่าบรรทัดที่ยาวที่สุด ซึ่งยาวเกินไป */
.cinema-scroll .hero-title-sub::after {
  content: "";
  display: block;
  width: 100%;
  height: 1px;
  margin-top: 0.44em;
  background: currentColor;
  opacity: 0.72;
}

.cinema-scroll .intro-copy {
  /* ระยะห่างจากหัวเรื่องมาจาก gap ของ .hero-stack ไม่ต้องคำนวณจากขอบจออีก
     isolation กันเงาวงรี (::before ที่ z-index -1) ไม่ให้หลุดไปอยู่หลังหัวเรื่อง */
  position: relative; isolation: isolate;
  width: min(620px, calc(100vw - 40px)); max-width: 100%; text-align: center;
  opacity: var(--intro-copy-opacity);
  transform: translate3d(0, var(--intro-copy-y), 0);
  will-change: transform, opacity;
}
.cinema-scroll .intro-copy::before {
  content: ""; position: absolute; z-index: -1; left: 50%; top: 50%;
  width: 170%; height: 230%; transform: translate(-50%, -50%); pointer-events: none;
  background: radial-gradient(ellipse at center,
    rgba(6,20,10,0.5) 0%, rgba(6,20,10,0.3) 42%, rgba(6,20,10,0) 72%);
}
.cinema-scroll .intro-copy p {
  margin: 0 auto; max-width: 600px; color: #fdf1e1;
  font-size: 1.18rem; font-weight: 500; line-height: 1.5; text-wrap: balance;
  text-shadow: 0 2px 18px rgba(0,0,0,0.55);
}
.cinema-scroll .hero-tags {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
  gap: 10px; margin-top: 26px;
}
.cinema-scroll .hero-tags span {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 42px; padding: 0 25px; color: #111411; border-radius: 999px;
  background: #fdf1e1; font-size: 0.98rem; font-weight: 500;
  box-shadow: 0 12px 30px rgba(0,0,0,0.22);
}
.cinema-scroll .intro-lead { display: block; }

/* ตัวเลขเล่าแบรนด์ โชว์ตั้งแต่หน้าจอแรก */
.cinema-scroll .hero-stats {
  display: flex; flex-wrap: wrap; align-items: stretch; justify-content: center;
  gap: 12px; margin-top: 24px;
}
.cinema-scroll .hero-stats .hero-stat {
  display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; min-width: 168px; padding: 24px 20px;
  border-radius: 20px; font: inherit; color: #fdf1e1;
  background: rgba(253, 241, 225, 0.13);
  border: 1px solid rgba(253, 241, 225, 0.3);
  backdrop-filter: blur(6px);
}
.cinema-scroll .hero-stats strong {
  font-family: Prompt, system-ui, sans-serif;
  font-size: 2.5rem; font-weight: 600; line-height: 1.1;
}
.cinema-scroll .hero-stats span { font-size: 0.98rem; opacity: 0.88; }

/* แถบบอกว่าเลื่อนฉากมาถึงไหน */
.cinema-scroll .cine-progress {
  position: absolute; z-index: 40; left: 0; right: 0; bottom: 0; height: 3px;
  background: rgba(253, 241, 225, 0.16); pointer-events: none;
}
.cinema-scroll .cine-progress i {
  display: block; height: 100%; width: 100%; transform-origin: 0 50%;
  transform: scaleX(0); background: #fdf1e1;
}

.cinema-scroll .scroll-hint {
  width: 24px; height: 40px; margin: 32px auto 0;
  border: 1px solid rgba(253,241,225,0.55); border-radius: 999px;
}
.cinema-scroll .scroll-hint span {
  display: block; width: 3px; height: 8px; margin: 8px auto 0;
  border-radius: 999px; background: rgba(253,241,225,0.9);
  animation: cinemaScrollHint 1.8s ease-in-out infinite;
}
@keyframes cinemaScrollHint {
  0%, 100% { transform: translateY(0); opacity: 1; }
  60% { transform: translateY(14px); opacity: 0; }
}
.cinema-scroll .story-panel {
  position: absolute; z-index: 30; left: 50%; top: 45%;
  width: min(760px, calc(100vw - 42px)); text-align: center; pointer-events: none;
  opacity: var(--op, 0);
  transform: translate3d(-50%, calc(-50% + var(--ty, 58px)), 0);
  will-change: transform, opacity;
}
.cinema-scroll .story-panel::before {
  content: ""; position: absolute; z-index: -1; left: 50%; top: 50%;
  width: 160%; height: 240%; transform: translate(-50%, -50%); pointer-events: none;
  background: radial-gradient(ellipse at center,
    rgba(6,20,10,0.62) 0%, rgba(6,20,10,0.44) 40%, rgba(6,20,10,0) 72%);
}
.cinema-scroll.is-editing .story-panel { pointer-events: auto; }
.cinema-scroll .panel-hi  { top: 29%; }
.cinema-scroll .panel-lo  { top: 60%; }
.cinema-scroll .panel-top { top: 26%; }
/* ต้องต่ำพอที่จะพ้นแถบเมนูด้านบน (แผ่นข้อความจัดกึ่งกลางแนวตั้ง ครึ่งบนจึงยื่นขึ้นไป) */
.cinema-scroll .panel-map { top: clamp(158px, 22vh, 215px); }
/* แผ่นบ้านเด่น : กว้างกว่าแผ่นอื่นเพราะมีการ์ดหีบเพลงอยู่ข้างใน */
.cinema-scroll .panel-featured {
  top: clamp(300px, 42vh, 460px);
  width: min(940px, calc(100vw - 32px));
}
.cinema-scroll .fh-wrap {
  margin-top: 26px;
  pointer-events: none;   /* เปิด-ปิดจาก JS ตามความจางของแผ่น */
}

/* --- แผนที่หมุดโครงการ ปิดท้ายเรื่อง --- */
.cinema-scroll .cine-map {
  position: absolute; z-index: 30;
  left: 50%; top: var(--map-top);
  width: min(1100px, calc(100vw - 48px));
  height: var(--map-height);
  opacity: var(--map-op, 0);
  transform: translate3d(-50%, var(--map-y, 54px), 0);
  transition: opacity 260ms ease;
  visibility: hidden;
  will-change: transform, opacity;
}
/**
 * การ์ดแผนที่ — แบบ "ขอบบางโปร่ง"
 * ไม่มีกรอบหนา ปล่อยให้ภาพสวนหลังบ้านเป็นพระเอก แผนที่ลอยอยู่บนนั้นเหมือนกระจกใส
 * เส้นครีมบางรอบนอกคือสิ่งเดียวที่บอกขอบเขต ส่วนเส้นเขียวด้านในช่วยตัดกับพื้นหลังสว่าง
 */
.cinema-scroll .cine-map-card {
  width: 100%; height: 100%; position: relative; z-index: 0;
  border-radius: 22px; overflow: hidden;
  border: 1px solid rgba(253,241,225,0.42);
  box-shadow: 0 30px 70px -20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(11,31,18,0.25);
  background: #eee9df;
}
.cinema-scroll .cine-map-canvas {
  width: 100%; height: 100%; z-index: 0;
}

/* ป้าย "N โครงการ" บนแผนที่ ให้ใช้ฟอนต์เดียวกับทั้งเว็บ */
.cinema-scroll .cine-map .custom-map-marker {
  font-family: Prompt, system-ui, sans-serif; font-weight: 500;
}
/* ปุ่มซูมกับแถบเครดิต ปรับให้เข้าชุดครีม-เขียว แทนสีเทาเริ่มต้นของ Leaflet */
.cinema-scroll .cine-map .leaflet-control-zoom {
  border: 0; border-radius: 12px; overflow: hidden;
  box-shadow: 0 6px 18px rgba(0,0,0,0.3);
}
.cinema-scroll .cine-map .leaflet-control-zoom a {
  background: rgba(253,241,225,0.96); color: #0f3d24; border: 0; font-weight: 400;
}
.cinema-scroll .cine-map .leaflet-control-zoom a:hover { background: #fff; }
.cinema-scroll .cine-map .leaflet-control-attribution {
  background: rgba(253,241,225,0.72);
  font-family: Prompt, system-ui, sans-serif; font-size: 9.5px; color: #4b5a50;
}
.cinema-scroll .cine-map .leaflet-control-attribution a { color: #2f6b45; }
.cinema-scroll .story-panel h2 {
  margin: 0; color: #fdf1e1;
  font-family: Prompt, system-ui, sans-serif;
  font-size: 3.5rem; font-weight: 500; line-height: 1.35; text-wrap: balance;
  text-shadow: 0 16px 38px rgba(0,0,0,0.32), 0 2px 12px rgba(0,0,0,0.5);
}
.cinema-scroll .story-panel p {
  width: min(600px, 100%); margin: 26px auto 0; color: #fdf1e1;
  font-size: 1.14rem; font-weight: 500; line-height: 1.5; text-wrap: balance;
  text-shadow: 0 2px 18px rgba(0,0,0,0.55);
}

/* --- ช่องค้นหาในฉาก : หน้าตาเดียวกับของหน้าเว็บหลัก --- */
/* วางให้พ้นแถบเมนูด้านบน และจบก่อนแกลเลอรีทำเลเริ่ม จะได้ไม่ทับกัน */
.cinema-scroll .panel-search { top: clamp(132px, 22vh, 210px); }
.cinema-scroll .panel-search h2 { margin-bottom: 26px; }
.cinema-scroll .cine-search {
  position: relative; display: flex; align-items: center;
  width: min(640px, calc(100vw - 40px)); margin: 0 auto;
  /* เปิด-ปิดการกดจาก JS ตามความจางของแผ่น กันไม่ให้ช่องที่มองไม่เห็นดักคลิก */
  pointer-events: none;
}
.cinema-scroll .cine-search input {
  width: 100%; padding: 17px 62px 17px 26px;
  border: 1px solid rgba(255,255,255,0.7); border-radius: 999px;
  background: #fff; color: #3f4a43;
  font-family: inherit; font-size: 1rem; font-weight: 300;
  box-shadow: 0 18px 44px rgba(0,0,0,0.32);
  outline: none; transition: box-shadow 200ms ease;
}
.cinema-scroll .cine-search input::placeholder { color: #9aa39c; }
.cinema-scroll .cine-search input:focus {
  box-shadow: 0 18px 44px rgba(0,0,0,0.32), 0 0 0 4px rgba(27,94,32,0.28);
}
.cinema-scroll .cine-search button {
  position: absolute; right: 7px;
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; padding: 0; border: 0; border-radius: 50%;
  background: #1b5e20; color: #fff; cursor: pointer;
  transition: background 180ms ease;
}
.cinema-scroll .cine-search button:hover { background: #135c2a; }
.cinema-scroll .cine-search button:disabled { opacity: 0.5; cursor: default; }
.cinema-scroll .sights-slider {
  position: absolute; z-index: 25; left: 0; right: 0; top: var(--sights-top);
  visibility: var(--sights-visibility, hidden);
  transform: translate3d(var(--sights-enter-x, 420vw), 0, 0);
  transform-origin: 0 0; will-change: transform;
}
/* แถบทำเล : เลื่อนด้วย scrollLeft จริง ไม่ใช่ transform จะได้ลากด้วยนิ้วได้ */
/**
 * ขอบซ้าย-ขวาให้การ์ดค่อย ๆ จางหาย แทนที่จะโดนกรอบจอตัดกลางใบ
 * ใส่ mask ที่ตัวสไลเดอร์ ไม่ใช่ที่แถบเลื่อน เพราะแถบเลื่อนต้องเลื่อนได้อิสระ
 */
.cinema-scroll .sights-slider {
  -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 96px, #000 calc(100% - 96px), transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0, #000 96px, #000 calc(100% - 96px), transparent 100%);
}
@media (max-width: 1500px) {
  .cinema-scroll .hero-title { font-size: 5.4rem; }
  .cinema-scroll .story-panel h2 { font-size: 3rem; }
}
@media (max-width: 1100px) {
  .cinema-scroll .hero-title { font-size: 3.8rem; letter-spacing: 0.16em; }
  .cinema-scroll .story-panel h2 { font-size: 2.4rem; }
}
@media (max-width: 640px) {
  .cinema-scroll {
    --sights-top: clamp(300px, 44vh, 420px);
    --map-top: clamp(212px, 33vh, 300px);
    --map-height: clamp(270px, 52vh, 440px);
  }
  .cinema-scroll .stage { min-height: 640px; }
  .cinema-scroll .scene { filter: none; will-change: transform, opacity; }
  .cinema-scroll .hero-title { font-size: 1.9rem; letter-spacing: 0.12em; }
  .cinema-scroll .intro-copy p, .cinema-scroll .story-panel p { font-size: 1rem; }
  .cinema-scroll .intro-lead { display: block; }

/* ตัวเลขเล่าแบรนด์ โชว์ตั้งแต่หน้าจอแรก */
.cinema-scroll .hero-stats {
  display: flex; flex-wrap: wrap; align-items: stretch; justify-content: center;
  gap: 12px; margin-top: 24px;
}
.cinema-scroll .hero-stats .hero-stat {
  display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; min-width: 168px; padding: 24px 20px;
  border-radius: 20px; font: inherit; color: #fdf1e1;
  background: rgba(253, 241, 225, 0.13);
  border: 1px solid rgba(253, 241, 225, 0.3);
  backdrop-filter: blur(6px);
}
.cinema-scroll .hero-stats strong {
  font-family: Prompt, system-ui, sans-serif;
  font-size: 2.5rem; font-weight: 600; line-height: 1.1;
}
.cinema-scroll .hero-stats span { font-size: 0.98rem; opacity: 0.88; }

/* แถบบอกว่าเลื่อนฉากมาถึงไหน */
.cinema-scroll .cine-progress {
  position: absolute; z-index: 40; left: 0; right: 0; bottom: 0; height: 3px;
  background: rgba(253, 241, 225, 0.16); pointer-events: none;
}
.cinema-scroll .cine-progress i {
  display: block; height: 100%; width: 100%; transform-origin: 0 50%;
  transform: scaleX(0); background: #fdf1e1;
}

.cinema-scroll .scroll-hint { margin-top: 20px; }
  .cinema-scroll .hero-tags { gap: 8px; }
  .cinema-scroll .hero-tags span { min-height: 38px; padding: 0 16px; font-size: 0.88rem; }
  .cinema-scroll .story-panel { top: 44%; }
  .cinema-scroll .panel-hi { top: 27%; }
  .cinema-scroll .panel-lo { top: 62%; }
  .cinema-scroll .panel-top { top: 32%; }
  .cinema-scroll .panel-search { top: clamp(150px, 24vh, 230px); }
  .cinema-scroll .panel-featured { top: clamp(340px, 50vh, 450px); }
  .cinema-scroll .fh-wrap { margin-top: 18px; }
  .cinema-scroll .panel-map { top: clamp(132px, 19vh, 175px); }
  .cinema-scroll .cine-map { width: calc(100vw - 24px); }
  .cinema-scroll .story-panel h2 { font-size: 1.75rem; }
  .cinema-scroll .sights-slider {
    -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%);
    mask-image: linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%);
  }
  /**
   * จอเล็กต้องอยู่แถวเดียวให้ครบสาม ไม่งั้นตกเป็น 2+1 ซึ่งดูเหมือนจัดวางพลาด
   * แบ่งความกว้างเท่ากันสามส่วน (flex 1 1 0 + min-width 0 เพื่อให้ยอมหด)
   * แล้วให้คำใต้ตัวเลขย่อตามความกว้างจอ — 2.9vw พอดีกับคำที่ยาวที่สุดคือ "ครอบครัวที่ไว้ใจเรา"
   */
  .cinema-scroll .hero-stats { gap: 8px; margin-top: 16px; flex-wrap: nowrap; }
  /* จอสัมผัสตัด backdrop-filter ทิ้ง — มันบังคับให้เครื่องประกอบภาพใหม่ทุกเฟรมที่วิดีโอขยับ
     บนมือถือเห็นเป็นภาพกระพริบ และกินแบตโดยได้ความสวยเพิ่มน้อยมาก */
  .cinema-scroll .hero-stats .hero-stat {
    backdrop-filter: none; -webkit-backdrop-filter: none;
    background: rgba(20, 32, 22, 0.42);
  }
  .cinema-scroll .hero-stats .hero-stat {
    flex: 1 1 0; min-width: 0; padding: 20px 5px; gap: 4px; border-radius: 16px;
  }
  /**
   * ความกว้างถูกจำกัดด้วยความกว้างจอ (สามกล่องต้องอยู่แถวเดียว) ขยายไม่ได้แล้ว
   * จึงเพิ่มความสูงกับขนาดตัวเลขแทน — คำใต้ตัวเลขคงขนาดเดิมเพราะเป็นตัวกำหนดความกว้าง
   */
  .cinema-scroll .hero-stats strong { font-size: clamp(1.45rem, 6vw, 1.85rem); }
  .cinema-scroll .hero-stats span {
    font-size: clamp(0.66rem, 2.9vw, 0.82rem); white-space: nowrap;
  }
}
/**
 * จอเตี้ย (มือถือรุ่นเล็ก, แนวนอน) — หัวเรื่องกับแผนที่แย่งที่กันจนทับ
 * ย่อหัวเรื่องและซ่อนปุ่ม เพราะตัวแผนที่ทำหน้าที่เป็นปุ่มอยู่แล้ว
 */
@media (max-height: 780px) {
  .cinema-scroll {
    --map-top: clamp(238px, 39vh, 300px);
    --map-height: clamp(230px, 45vh, 320px);
  }
  .cinema-scroll .panel-map { top: clamp(134px, 23vh, 168px); }
  .cinema-scroll .panel-search { top: clamp(140px, 22vh, 180px); }
  .cinema-scroll .panel-featured { top: clamp(210px, 34vh, 300px); }
  .cinema-scroll .fh-wrap { margin-top: 16px; }
  .cinema-scroll .panel-search h2 { font-size: 1.6rem; margin-bottom: 18px; }
  .cinema-scroll { --sights-top: clamp(240px, 36vh, 300px); }
  .cinema-scroll .panel-map h2 { font-size: 1.45rem; }
  .cinema-scroll .panel-map p { font-size: 0.86rem; }
}
@media (prefers-reduced-motion: reduce) {
  .cinema-scroll .scene, .cinema-scroll .hero-title, .cinema-scroll .intro-copy,
  .cinema-scroll .story-panel, .cinema-scroll .sights-slider { transition: none; }
  .cinema-scroll .cine-video, .cinema-scroll .cine-poster { transition: none; }
  .cinema-scroll .scroll-hint span { animation: none; }
}

/**
 * จอเตี้ย : แผ่น "บ้านเด่น" สูงกว่าแผ่นอื่นเพราะมีการ์ดอยู่ข้างใน
 * ถ้าไม่ย่อการ์ดกับขยับแผ่นลง ครึ่งบนจะยื่นขึ้นไปชนแถบเมนู
 * แยกกฎของจอคอมเตี้ยกับมือถือเตี้ยออกจากกัน เพราะหีบเพลงคนละแนว (นอน/ตั้ง)
 */
@media (max-height: 780px) and (min-width: 768px) {
  .cinema-scroll .panel-featured { top: clamp(290px, 46vh, 380px); }
  .cinema-scroll .fh-card { --fh-h: clamp(240px, 42vh, 340px); }
  .cinema-scroll .fh-wrap { margin-top: 14px; }
}
@media (max-width: 767px) and (max-height: 700px) {
  .cinema-scroll .panel-featured { top: clamp(300px, 50vh, 380px); }
  .cinema-scroll .fh-card { --fh-h: clamp(260px, 50vh, 360px); }
  .cinema-scroll .fh-wrap { margin-top: 12px; }
}
`;
