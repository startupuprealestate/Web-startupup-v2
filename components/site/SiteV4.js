/**
 * v4 — เว็บ STARTUP UP ดีไซน์ใหม่
 *
 * ใช้ข้อมูลและระบบหลังบ้านชุดเดียวกับหน้าเดิมทั้งหมด (ผ่าน useSiteData + คอมโพเนนต์จาก SiteApp)
 * ต่างกันแค่เปลือกนอก : เปิดด้วยฉากภาพยนตร์เดินเข้าบ้าน แล้วห่อทุกส่วนด้วยชุดสีและฟอนต์ใหม่
 *
 *   ฉากเปิด        CinemaHero (การ์ดสไลด์ = บ้านจริงจาก Firestore)
 *   หน้าหลัก        HomeSection ตัวเดิมจากเว็บหลัก (ช่องค้นหา แถบทำเล แผนที่หมุด
 *                  บ้านแยกหมวด whyUs) — HeroSection ไม่ต้องใช้ ฉากภาพยนตร์แทนแล้ว
 *   แท็บอื่น        PropertiesList / CalculatorSection / PortfolioSection
 *   รายหลัง         SalePageV4 (ดีไซน์ใหม่ ไม่ได้แตะ SalePage เดิมที่หน้า / ใช้อยู่)
 *   หลังบ้าน        AdminPanel + LoginModal + โหมดแก้ไขหน้าเว็บ (ตัวเดิมทั้งหมด)
 */

import Head from 'next/head';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Settings, Search, Menu, X, Loader, Save, Layout, Type,
  ChevronLeft, ChevronRight, MessageCircle, Video,
} from 'lucide-react';

import useSiteData from './useSiteData';
import CinemaHero from './CinemaHero';
import SalePageV4 from './SalePageV4';
import FeaturedHomes from './FeaturedHomes';
import useRevealOnScroll from './useRevealOnScroll';
import { safeJsonLd } from '../../lib/seo';
import {
  HomeSection, LocationSection, PropertiesList, CalculatorSection, PortfolioSection,
  searchResultHref,
  LoginModal, CustomAlertModal, AdminPanel, Lightbox, SmartImage, EditableText,
  getOptimizedImg, DEFAULT_LOCATIONS_DATA, DEFAULT_VISUAL_CONTENT, db, appId,
} from './SiteApp';

const Facebook = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
);
const Instagram = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
);
const Youtube = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.13 1 12 1 12s0 3.87.54 5.58a2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.87 23 12 23 12s0-3.87-.54-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" /></svg>
);

/**
 * ระยะเลื่อนของจังหวะในฉากเปิด ต้องตรงกับ STATIONS ใน CinemaHero
 * ถ้าไม่ตรง หน้าจะเลื่อนถึงแล้วยังขยับต่ออีกนิดเพราะโดนดูดเข้าสถานี
 */
const STATION_AT = { locations: 2050, featured: 3740 };

const NAV_TABS = [
  { key: 'home', fallback: 'หน้าหลัก', field: 'navHome' },
  /* ทำเลมาก่อนบ้านทั้งหมด — ลูกค้าส่วนใหญ่เลือกจากทำเลก่อนแล้วค่อยดูว่ามีบ้านอะไร */
  { key: 'location', fallback: 'ทำเล', field: 'navLocation' },
  { key: 'all', fallback: 'บ้านทั้งหมด', field: 'navAll' },
  { key: 'promo', fallback: 'บ้านโปรโมชั่น', field: 'navPromo' },
  { key: 'calculator', fallback: 'คำนวณสินเชื่อ', field: 'navCalc' },
  { key: 'portfolio', fallback: 'ผลงาน', field: 'navPortfolio' },
];

function Waiting() {
  return (
    <div className="v4-loading">
      <Loader className="v4-spin" size={44} />
      <p>กำลังเตรียมข้อมูล...</p>
    </div>
  );
}

export default function SiteV4({ basePath = '/v4' }) {
  const site = useSiteData({ basePath });
  const {
    userRole, userEmail, properties, publicProperties, companyInfo, authorizedUsers,
    loading, visualContent, popupData,
    activeTab, setActiveTab, searchParams, selectedProperty, requestedPropSlug, setSelectedProperty,
    showLoginModal, setShowLoginModal, showAdminPanel, setShowAdminPanel,
    showPopupModal, isSnoozeChecked, setIsSnoozeChecked, dismissPopup,
    lightbox, openLightbox, closeLightbox, globalAlert,
    isVisualEditMode, updateVisualContent, undoVisual, redoVisual,
    saveVisualEdit, cancelVisualEdit, isSavingVisual, canUndo, canRedo,
    handleLocationImageUpdate, handleRemoveLocationImage, enterVisualEditMode,
    handleLogout, handleGoogleLogin, goTab, handleFilterSelect, handleGlobalSearch, handleSelectProperty,
    seoMeta, structuredData,
  } = site;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navOverHero, setNavOverHero] = useState(false);

  /**
   * ช่องค้นหาบนแถบเมนู — ปกติเป็นแค่ปุ่มแว่นขยาย กดแล้วช่องพิมพ์คลี่ออกตรงนั้น
   * ตอนหุบช่องกว้าง 0 จึงไม่กินที่ในแถบเมนูเลย
   * ต่อเข้า handleGlobalSearch ตัวเดิมที่ช่องค้นหาหน้าแรกใช้อยู่ ไม่มีตรรกะค้นหาใหม่
   */
  const [isNavSearchOpen, setIsNavSearchOpen] = useState(false);
  const [navSearchText, setNavSearchText] = useState('');
  const navSearchInputRef = useRef(null);

  const closeNavSearch = useCallback(() => {
    setIsNavSearchOpen(false);
    setNavSearchText('');
  }, []);

  const runSearch = useCallback((keyword) => {
    handleGlobalSearch(keyword);
    closeNavSearch();
    setIsMenuOpen(false);
  }, [closeNavSearch, handleGlobalSearch]);

  /* ปุ่มแว่นขยายทำหน้าที่ทั้งเปิดช่องและสั่งค้นหา แล้วแต่ว่าตอนนั้นพิมพ์อะไรไว้หรือยัง */
  const submitNavSearch = useCallback((e) => {
    e.preventDefault();
    const keyword = navSearchText.trim();
    if (keyword) { runSearch(keyword); return; }
    if (!isNavSearchOpen) {
      setIsNavSearchOpen(true);
      /* โฟกัสหลัง React วาดช่องเสร็จ ไม่งั้นจะไปโฟกัสตัวที่ยังกว้าง 0 แล้วหลุด */
      requestAnimationFrame(() => navSearchInputRef.current?.focus());
      return;
    }
    closeNavSearch();
  }, [closeNavSearch, isNavSearchOpen, navSearchText, runSearch]);

  const submitMenuSearch = useCallback((e) => {
    e.preventDefault();
    const keyword = navSearchText.trim();
    if (keyword) runSearch(keyword);
  }, [navSearchText, runSearch]);

  /**
   * ทางเข้าหลังบ้าน — ไม่มีปุ่มให้ลูกค้าเห็นบนหน้าเว็บแล้ว เปิดด้วย ?admin=1 แทน
   * useSiteData จะล้างพารามิเตอร์นี้ออกจากแถบที่อยู่เองในจังหวะถัดไป
   * รอให้โหลดเสร็จก่อนค่อยตัดสินใจ เพราะสิทธิ์ของบัญชีเพิ่งกู้คืนมาจาก Firebase
   */
  /* อ่านตั้งแต่ render แรกเลย ไม่ใช่ใน useEffect
     เพราะ useSiteData ล้าง query string ทิ้งด้วย pushState ตั้งแต่จังหวะต้น ๆ
     ถ้าอ่านช้ากว่านั้นแม้เสี้ยววินาที ?admin=1 จะหายไปก่อนได้อ่าน */
  const [adminEntryPending, setAdminEntryPending] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return new URLSearchParams(window.location.search).get('admin') === '1'; }
    catch (e) { return false; }
  });
  useEffect(() => {
    if (!adminEntryPending) return;
    setAdminEntryPending(false);
    /* ห้ามรอ loading เด็ดขาด ถ้าโหลดข้อมูลค้าง มันรอได้ถึง 20 วินาทีก่อนยอมแพ้
       ระหว่างนั้นหน้าจะเงียบสนิทเหมือนลิงก์ใช้ไม่ได้ */
    if (userRole) setShowAdminPanel(true); else setShowLoginModal(true);
  }, [adminEntryPending, userRole, setShowAdminPanel, setShowLoginModal]);

  const isCinemaView = activeTab === 'home' && !selectedProperty && !requestedPropSlug;
  const isWaiting = loading || Boolean(requestedPropSlug);

  /* globals.css ซ่อนทุกส่วนที่ติด .reveal-on-scroll ไว้ที่ opacity 0
     ต้องมีตัวนี้คอยเติม .is-revealed ให้ ไม่งั้นเนื้อหาทั้งหน้าจะไม่โผล่เลย */
  useRevealOnScroll([activeTab, selectedProperty, loading, publicProperties.length]);

  /* ใช้เฉดมืดตราบใดที่แถบเมนูยังลอยอยู่บนภาพของฉากภาพยนตร์
     (วัดจากขอบล่างของ section จริง ไม่ใช่แค่ scrollY เพราะฉากยาวหลายพันพิกเซล) */
  useEffect(() => {
    const measure = () => {
      const stage = document.querySelector('.cinema-scroll');
      setNavOverHero(Boolean(stage) && stage.getBoundingClientRect().bottom > 90);
    };
    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [activeTab, selectedProperty, loading]);

  useEffect(() => { setIsMenuOpen(false); }, [activeTab, selectedProperty]);


  const navTransparent = navOverHero;

  /**
   * กด "ทำเล" บนเมนู = พาไปที่จังหวะการ์ดทำเลในฉากเปิด ไม่ใช่หน้าแยกอีกต่อไป
   * ต้องรอให้ฉากถูก render ก่อนถึงจะวัด offsetTop ได้ จึงเช็คซ้ำเป็นจังหวะ
   * (ฉากยาวหลายพันพิกเซล การ์ดทำเลอยู่ช่วง 1480-2520 เลือก 2000 ซึ่งเป็นจุดที่โผล่เต็ม)
   */
  /**
   * กลับไปบนสุด (ฉากประตูหน้าบ้าน)
   *
   * goTab เรียก jumpTop ให้อยู่แล้ว แต่ตอนอยู่ในฉากเปิดมันไม่พอ
   * เพราะ activeTab เป็น 'home' อยู่แล้ว React จึงไม่ re-render อะไร
   * และเอนจินของฉากเปิดมีตัวดูดเข้าสถานีที่สั่ง window.scrollTo ได้เอง
   * พอเลื่อนขึ้นบนแล้วเกิด event scroll มันจะตั้งเวลาไว้ดูดต่ออีกที
   *
   * จึงย้ำคำสั่งอีกสองจังหวะ หลัง React วาดเสร็จ และหลังพ้นเวลาหน่วงของตัวดูด
   * (SNAP_IDLE = 150ms ใน CinemaHero) เพื่อให้ชนะไม่ว่าอะไรจะแทรกเข้ามา
   */
  const goHomeTop = useCallback(() => {
    if (isVisualEditMode) return;
    goTab('home');
    const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    requestAnimationFrame(toTop);
    setTimeout(toTop, 220);
  }, [goTab, isVisualEditMode]);

  const goStation = useCallback((at) => {
    if (isVisualEditMode) return;
    if (activeTab !== 'home' || selectedProperty) goTab('home');
    let tries = 0;
    const jump = () => {
      const stage = document.querySelector('.cinema-scroll');
      if (stage) {
        window.scrollTo({ top: stage.offsetTop + at, behavior: 'smooth' });
        return;
      }
      if (tries++ < 40) setTimeout(jump, 100);
    };
    setTimeout(jump, 60);
  }, [activeTab, goTab, isVisualEditMode, selectedProperty]);

  /**
   * เมนูทำเลกับบ้านทั้งหมดพาไปหาจังหวะในฉากเปิด ไม่ใช่เปิดหน้าแยก
   *   ทำเล        -> แผงค้นหาบ้านที่ใช่สำหรับคุณ พร้อมการ์ดทำเล
   *   บ้านทั้งหมด  -> แผงบ้านเด่นที่เราคัดสรร
   * แท็บ location กับ all ยังอยู่ เพราะปุ่มอื่นในหน้ายังลิงก์เข้าไปได้
   */
  const onNavTab = useCallback((key) => {
    if (key === 'home') { goHomeTop(); return; }
    if (key === 'location') { goStation(STATION_AT.locations); return; }
    if (key === 'all') { goStation(STATION_AT.featured); return; }
    goTab(key);
  }, [goHomeTop, goStation, goTab]);
  const label = (field, fallback) => visualContent?.[field] || DEFAULT_VISUAL_CONTENT[field] || fallback;

  return (
    <>
      <style>{v4Css}</style>

      <Head>
        <title>{seoMeta.title}</title>
        <meta name="description" content={seoMeta.description} />
        <meta name="robots" content={seoMeta.robots} />
        <link rel="canonical" href={seoMeta.canonicalUrl} />
        <meta property="og:locale" content="th_TH" />
        <meta property="og:type" content={seoMeta.type} />
        <meta property="og:site_name" content={companyInfo?.name || 'STARTUP UP'} />
        <meta property="og:title" content={seoMeta.title} />
        <meta property="og:description" content={seoMeta.description} />
        <meta property="og:url" content={seoMeta.canonicalUrl} />
        <meta property="og:image" content={seoMeta.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="theme-color" content="#0b1f12" />
        <link rel="icon" type="image/png" href="/icon-192.png" sizes="192x192" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }} />
      </Head>

      <div className={`v4-shell${isVisualEditMode ? ' is-editing' : ''}`}>

        {/* ---------- ป็อปอัปโปรโมชั่น ---------- */}
        {showPopupModal && isCinemaView && (
          <div className="v4-popup-backdrop">
            <div className="v4-popup">
              <SmartImage src={getOptimizedImg(popupData.imageUrl, 900)} alt="โปรโมชั่น" className="v4-popup-img" />
              <div className="v4-popup-foot">
                <label>
                  <input type="checkbox" checked={isSnoozeChecked} onChange={e => setIsSnoozeChecked(e.target.checked)} />
                  ไม่แสดงหน้านี้อีกใน 24 ชม.
                </label>
                <button type="button" onClick={dismissPopup}>ปิดหน้าต่าง</button>
              </div>
            </div>
          </div>
        )}

        {/* ---------- แถบเมนู ---------- */}
        <header className={`v4-nav${navTransparent ? ' is-ghost' : ''}`}>
          <div className="v4-nav-inner">
            <button
              type="button"
              className="v4-logo"
              disabled={isVisualEditMode}
              onClick={goHomeTop}
            >
              {companyInfo?.logoUrl
                ? <SmartImage src={getOptimizedImg(companyInfo.logoUrl, 220)} alt={companyInfo?.name || 'STARTUP UP'} />
                : <span>{companyInfo?.name || 'STARTUP UP'}</span>}
            </button>

            <nav className="v4-nav-links" aria-label="เมนูหลัก">
              {NAV_TABS.map(tab => (
                <a
                  key={tab.key}
                  href={tab.key === 'home' || tab.key === 'location' ? '/v4' : `/v4?tab=${tab.key}`}
                  className={activeTab === tab.key && !selectedProperty ? 'is-active' : ''}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey || e.button) return;
                    e.preventDefault();
                    if (isVisualEditMode) return;
                    onNavTab(tab.key);
                  }}
                >
                  {isVisualEditMode
                    ? <EditableText tag="span" fieldKey={tab.field} content={visualContent} updateContent={updateVisualContent} isEditMode />
                    : label(tab.field, tab.fallback)}
                </a>
              ))}

              <form
                className={`v4-navsearch${isNavSearchOpen ? ' is-open' : ''}`}
                role="search"
                onSubmit={submitNavSearch}
                /* คลิกที่อื่นแล้วยังไม่ได้พิมพ์อะไร ให้หุบกลับเป็นปุ่มเหมือนเดิม */
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget) && !navSearchText.trim()) closeNavSearch();
                }}
              >
                <input
                  ref={navSearchInputRef}
                  type="text"
                  value={navSearchText}
                  onChange={(e) => setNavSearchText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') closeNavSearch(); }}
                  placeholder="ชื่อโครงการ ทำเล หรือราคา"
                  aria-label="ค้นหาบ้าน"
                  tabIndex={isNavSearchOpen ? 0 : -1}
                  disabled={isVisualEditMode}
                />
                <button type="submit" aria-label="ค้นหา" disabled={isVisualEditMode}>
                  <Search size={18} />
                </button>
              </form>
            </nav>

            <div className="v4-nav-actions">
              {/* ไม่มีปุ่ม Admin Login ให้ลูกค้าเห็นแล้ว คนที่ล็อกอินผ่านแล้วเท่านั้นถึงเห็นปุ่มนี้ */}
              {userRole && (
                <button type="button" className="v4-admin-btn" disabled={isVisualEditMode} onClick={() => setShowAdminPanel(true)}>
                  <Settings size={14} /> ระบบจัดการ
                </button>
              )}
              <button type="button" className="v4-burger" aria-label="เมนู" onClick={() => setIsMenuOpen(v => !v)}>
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="v4-mobile-menu">
              <form className="v4-msearch" role="search" onSubmit={submitMenuSearch}>
                <input
                  type="text"
                  value={navSearchText}
                  onChange={(e) => setNavSearchText(e.target.value)}
                  placeholder="ค้นหาบ้าน ทำเล หรือโครงการ"
                  aria-label="ค้นหาบ้าน"
                />
                <button type="submit" aria-label="ค้นหา"><Search size={18} /></button>
              </form>
              {NAV_TABS.map(tab => (
                <button key={tab.key} type="button" onClick={() => onNavTab(tab.key)}>
                  {label(tab.field, tab.fallback)}
                </button>
              ))}
              {userRole && (
                <>
                  <hr />
                  <button type="button" onClick={() => { setShowAdminPanel(true); setIsMenuOpen(false); }}>เข้าสู่ระบบหลังบ้าน</button>
                </>
              )}
            </div>
          )}
        </header>

        {/* ---------- เนื้อหา ---------- */}
        <main className={`v4-main${isCinemaView ? ' is-cinema' : ''}`}>
          {selectedProperty ? (
            <SalePageV4
              property={selectedProperty}
              companyInfo={companyInfo}
              onBack={() => { setSelectedProperty(null); window.scrollTo(0, 0); }}
              properties={publicProperties}
              onSelectProp={handleSelectProperty}
              visualContent={visualContent}
              updateVisualContent={updateVisualContent}
              isEditMode={isVisualEditMode}
              openLightbox={openLightbox}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <>
                  {!requestedPropSlug && (
                    <CinemaHero
                      properties={publicProperties}
                      onSelectProp={handleSelectProperty}
                      onSelectLocation={handleFilterSelect}
                      onSearch={handleGlobalSearch}
                      onSelectCategory={handleFilterSelect}
                      companyName={companyInfo?.name || 'STARTUP UP'}
                      tagline={companyInfo?.description || 'จุดเริ่มต้นของคนอยากมีบ้าน'}
                      visualContent={visualContent}
                      updateVisualContent={updateVisualContent}
                      isEditMode={isVisualEditMode}
                    />
                  )}
                  {/* เนื้อหาหน้าแรกตัวจริงบนเว็บหลัก : ช่องค้นหา บ้านแยกหมวด
                      และ "ซื้อบ้านกับ StartupUp ดีอย่างไร?" — แก้ได้จากหลังบ้านครบ
                      (HeroSection เดิมไม่ต้องใช้แล้ว เพราะฉากภาพยนตร์ทำหน้าที่แทน)

                      แถบทำเลกับแผนที่หมุดถูกยกขึ้นไปอยู่ในฉากภาพยนตร์แล้ว จึงปิดทั้งคู่ตรงนี้
                      ไม่งั้นจะเห็นของซ้ำสองรอบในหน้าเดียว */}
                  {isWaiting ? <Waiting /> : (
                    <HomeSection
                      showLocationMarquee={false}
                      showMap={false}
                      showSearch={false}
                      showCategorySections={false}
                      properties={publicProperties}
                      loading={loading}
                      onSelectProp={handleSelectProperty}
                      setActiveTab={setActiveTab}
                      onSelectLocation={handleFilterSelect}
                      onSearchCategory={handleFilterSelect}
                      onSearch={handleGlobalSearch}
                      visualContent={visualContent}
                      updateVisualContent={updateVisualContent}
                      onUpdateLocationImage={handleLocationImageUpdate}
                      onRemoveLocationImage={handleRemoveLocationImage}
                      isEditMode={isVisualEditMode}
                    />
                  )}
                </>
              )}

              {activeTab !== 'home' && isWaiting && <Waiting />}

              {activeTab === 'all' && !isWaiting && (
                <div className="v4-allhomes">
                  {/* บ้านเด่นที่เราคัดสรร — ชุดเดียวกับที่อยู่ในฉากเปิด */}
                  <section className="v4-allhomes-featured reveal-on-scroll">
                    <FeaturedHomes
                      isEditMode={isVisualEditMode}
                      hrefFor={(cat) => searchResultHref('category', cat)}
                      onSelectCategory={(e, cat) => {
                        if (e.ctrlKey || e.metaKey || e.button) return;
                        e.preventDefault();
                        handleFilterSelect('category', cat);
                      }}
                    />
                  </section>

                  {/* แยกตามหมวดหมู่ ทาวน์เฮาส์ / บ้านแฝด / บ้านเดี่ยว */}
                  <HomeSection
                    showLocationMarquee={false}
                    showMap={false}
                    showSearch={false}
                    showCategorySections
                    properties={publicProperties}
                    loading={loading}
                    onSelectProp={handleSelectProperty}
                    setActiveTab={setActiveTab}
                    onSelectLocation={handleFilterSelect}
                    onSearchCategory={handleFilterSelect}
                    onSearch={handleGlobalSearch}
                    visualContent={visualContent}
                    updateVisualContent={updateVisualContent}
                    onUpdateLocationImage={handleLocationImageUpdate}
                    onRemoveLocationImage={handleRemoveLocationImage}
                    isEditMode={isVisualEditMode}
                  />
                </div>
              )}

              {activeTab === 'location' && !isWaiting && (
                <LocationSection
                  onSelectLocation={handleFilterSelect}
                  visualContent={visualContent}
                  updateVisualContent={updateVisualContent}
                  onUpdateLocationImage={handleLocationImageUpdate}
                  isEditMode={isVisualEditMode}
                />
              )}

              {activeTab === 'promo' && !isWaiting && (
                <PropertiesList
                  properties={publicProperties}
                  searchParams={{ type: 'promo' }}
                  onSelectProp={handleSelectProperty}
                  visualContent={visualContent}
                  updateVisualContent={updateVisualContent}
                  isEditMode={isVisualEditMode}
                />
              )}

              {activeTab === 'search_result' && !isWaiting && (
                <PropertiesList
                  properties={publicProperties}
                  searchParams={searchParams}
                  onSelectProp={handleSelectProperty}
                  visualContent={visualContent}
                  updateVisualContent={updateVisualContent}
                  isEditMode={isVisualEditMode}
                />
              )}

              {/* หน้า "ทำเลยอดนิยม" ถูกถอดออกแล้ว — เมนู "ทำเล" พาไปที่การ์ดทำเลในฉากเปิดแทน
                  ถ้ามีลิงก์เก่า /v4?tab=location หลงเข้ามา จะถูกพากลับไปฉากเปิดโดยอัตโนมัติ */}

              {activeTab === 'calculator' && !isWaiting && (
                <div className="v4-calc-wrap">
                  <CalculatorSection
                    visualContent={visualContent}
                    updateVisualContent={updateVisualContent}
                    isEditMode={isVisualEditMode}
                  />
                </div>
              )}

              {activeTab === 'portfolio' && !isWaiting && (
                <PortfolioSection
                  companyInfo={companyInfo}
                  properties={publicProperties}
                  visualContent={visualContent}
                  updateVisualContent={updateVisualContent}
                  isEditMode={isVisualEditMode}
                  openLightbox={openLightbox}
                />
              )}
            </>
          )}
        </main>

        {/* ---------- ท้ายเว็บ ---------- */}
        <footer className="v4-footer">
          <div className="v4-footer-inner">
            <div>
              <h3>{companyInfo?.name || 'STARTUP UP'}</h3>
              <p>{companyInfo?.description || 'จุดเริ่มต้นของคนอยากมีบ้าน'}</p>
            </div>
            <div>
              <h4>{label('contactTitle', 'ติดต่อเรา')}</h4>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(companyInfo?.address || '')}`}
                target="_blank" rel="noopener noreferrer"
              >{companyInfo?.address}</a>
              <a className="v4-phone" href={`tel:${companyInfo?.phone}`}>โทร {companyInfo?.phone}</a>
              <span>{companyInfo?.email}</span>
            </div>
            <div>
              <h4>{label('followTitle', 'ติดตามเรา')}</h4>
              <div className="v4-social">
                <a href={companyInfo?.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook /></a>
                <a href="https://youtube.com/@startupupofficial" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><Youtube /></a>
                <a href={companyInfo?.line} target="_blank" rel="noopener noreferrer" aria-label="LINE"><MessageCircle size={22} /></a>
                <a href="https://www.instagram.com/startupuprealestate/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram /></a>
                <a href="https://www.tiktok.com/@startupupofficial" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><Video size={22} /></a>
              </div>
            </div>
          </div>
          <div className="v4-footer-base">
            © {new Date().getFullYear()} {companyInfo?.name || 'Startup Up Real Estate'}. All Rights Reserved.
          </div>
        </footer>

        {/* ---------- แถบโหมดแก้ไขหน้าเว็บ ---------- */}
        {isVisualEditMode && (
          <div className="v4-editbar">
            <div className="v4-editbar-info">
              <span className="v4-editbar-chip"><Layout size={16} /> โหมดแก้ไขหน้าตาเว็บไซต์</span>
              <small><Type size={14} /> คลิกไอคอนดินสอเพื่อแก้ข้อความ หรือชี้ที่รูปทำเลเพื่อเปลี่ยนรูป</small>
            </div>
            <div className="v4-editbar-history">
              <button type="button" onClick={undoVisual} disabled={!canUndo}><ChevronLeft size={16} /> Undo</button>
              <button type="button" onClick={redoVisual} disabled={!canRedo}>Redo <ChevronRight size={16} /></button>
            </div>
            <div className="v4-editbar-actions">
              <button type="button" className="v4-ghost" onClick={cancelVisualEdit}>ยกเลิก</button>
              <button type="button" className="v4-save" onClick={saveVisualEdit} disabled={isSavingVisual}>
                {isSavingVisual ? <Loader size={16} className="v4-spin" /> : <Save size={16} />} บันทึกการแก้ไข
              </button>
            </div>
          </div>
        )}

        <CustomAlertModal
          isOpen={globalAlert.isOpen}
          type={globalAlert.type}
          title={globalAlert.title}
          message={globalAlert.message}
          showCancel={globalAlert.showCancel}
          onCancel={globalAlert.onCancel}
          onConfirm={globalAlert.onConfirm}
        />

        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onGoogleLogin={handleGoogleLogin} />}

        {showAdminPanel && (
          <AdminPanel
            userRole={userRole}
            userEmail={userEmail}
            properties={properties}
            users={authorizedUsers}
            companyInfo={companyInfo}
            popupData={popupData}
            locations={visualContent.locations || DEFAULT_LOCATIONS_DATA}
            onClose={() => setShowAdminPanel(false)}
            onLogout={handleLogout}
            db={db}
            appId={appId}
            enterVisualEditMode={enterVisualEditMode}
            showAlert={site.showGlobalAlert}
            showConfirm={site.showGlobalConfirm}
          />
        )}

        <Lightbox
          isOpen={lightbox.isOpen}
          images={lightbox.images}
          startIndex={lightbox.startIndex}
          onClose={closeLightbox}
        />
      </div>
    </>
  );
}

const v4Css = `
.v4-shell {
  --paper: #fdf1e1;
  --paper-soft: #f6efe4;
  --ink: #111411;
  --brand: #0b3d1b;
  --brand-soft: #14512a;
  --line: rgba(11, 61, 27, 0.12);
  --display: Prompt, system-ui, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: var(--ink);
  background: var(--paper-soft);
  font-family: Prompt, system-ui, sans-serif;
}
.v4-shell.is-editing { padding-bottom: 96px; }

/* หัวข้อทุกส่วนใช้ฟอนต์ชุดใหม่ รวมถึงส่วนที่ยกมาจากเว็บเดิม */
.v4-shell h1, .v4-shell h2, .v4-shell h3,
.v4-shell .np-section-head h2, .v4-shell .np-intro-copy h2 {
  font-family: var(--display);
  font-weight: 500;
  letter-spacing: 0.005em;
}
.v4-shell .np-home { background: var(--paper-soft); }

/* ---------- แถบเมนู ---------- */
/* แถบเมนูลอยอยู่เหนือเนื้อหา ไม่มีพื้นทึบ ไม่มีเส้นคั่น
   ใช้แค่ไล่เฉดจาง ๆ ให้ตัวหนังสืออ่านออก แล้วค่อย ๆ หายไปด้านล่าง */
.v4-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 60;
  border: 0;
  background: linear-gradient(180deg,
    rgba(253, 241, 225, 0.92) 0%,
    rgba(253, 241, 225, 0.62) 58%,
    rgba(253, 241, 225, 0) 100%);
  transition: background 320ms ease;
}
/* ตอนลอยอยู่บนภาพ ใช้เฉดมืดแทน ตัวหนังสือจะได้เป็นสีครีม */
.v4-nav.is-ghost {
  background: linear-gradient(180deg, rgba(5, 18, 9, 0.5) 0%, rgba(5, 18, 9, 0.18) 60%, rgba(5, 18, 9, 0) 100%);
}
.v4-nav-inner {
  max-width: 1400px; margin: 0 auto; padding: 0 28px;
  height: 76px; display: flex; align-items: center; justify-content: space-between; gap: 24px;
}
.v4-logo {
  display: inline-flex; align-items: center; border: 0; background: none;
  padding: 0; cursor: pointer; color: var(--brand);
  font-family: var(--display); font-size: 22px; font-weight: 300; letter-spacing: 0.2em;
  white-space: nowrap;
}
.v4-logo img { height: 42px; width: auto; object-fit: contain; display: block; }
.v4-logo:disabled { opacity: 0.5; cursor: default; }
.v4-nav.is-ghost .v4-logo { color: #fdf1e1; text-shadow: 0 2px 16px rgba(0,0,0,0.4); }
.v4-nav.is-ghost .v4-logo img { filter: brightness(0) invert(1); }

.v4-nav-links { display: flex; align-items: center; gap: clamp(18px, 2vw, 38px); }
.v4-nav-links a {
  position: relative; color: var(--brand); text-decoration: none;
  font-size: 16px; font-weight: 400; white-space: nowrap; padding: 6px 0;
  transition: opacity 200ms ease;
}
.v4-nav-links a::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px;
  background: currentColor; transform: scaleX(0); transform-origin: 0 50%;
  transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
}
.v4-nav-links a:hover::after, .v4-nav-links a.is-active::after { transform: scaleX(1); }
.v4-nav.is-ghost .v4-nav-links a { color: rgba(253, 241, 225, 0.92); text-shadow: 0 2px 16px rgba(0,0,0,0.4); }

/**
 * ปุ่มแว่นขยายท้ายเมนู กดแล้วช่องพิมพ์คลี่ออกทางซ้ายตรงนั้นเลย
 * ไม่เปิดแผ่นซ้อนใหม่ หน้าเว็บจึงไม่ต้องโหลดอะไรเพิ่ม
 * ตอนหุบช่องกว้าง 0 และปิดรับคลิก เพื่อไม่ให้ดักโฟกัสตอนกด Tab
 */
.v4-navsearch {
  display: flex; align-items: center; gap: 6px;
  border-bottom: 1px solid transparent;
  transition: border-color 260ms ease;
}
.v4-navsearch.is-open { border-bottom-color: currentColor; }
.v4-navsearch input {
  width: 0; padding: 0; border: 0; background: none; outline: none;
  font: inherit; font-size: 15px; color: var(--brand);
  opacity: 0; pointer-events: none;
  transition: width 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease;
}
.v4-navsearch.is-open input {
  width: clamp(150px, 16vw, 230px); opacity: 1; pointer-events: auto;
}
.v4-navsearch input::placeholder { color: rgba(17, 20, 17, 0.38); }
.v4-navsearch button {
  display: inline-flex; align-items: center; justify-content: center;
  border: 0; background: none; padding: 4px; cursor: pointer;
  color: var(--brand); transition: opacity 200ms ease;
}
.v4-navsearch button:hover { opacity: 0.6; }
.v4-navsearch button:disabled { opacity: 0.4; cursor: not-allowed; }
.v4-nav.is-ghost .v4-navsearch { text-shadow: 0 2px 16px rgba(0, 0, 0, 0.4); }
.v4-nav.is-ghost .v4-navsearch input,
.v4-nav.is-ghost .v4-navsearch button { color: #fdf1e1; }
.v4-nav.is-ghost .v4-navsearch input::placeholder { color: rgba(253, 241, 225, 0.6); }

.v4-nav-actions { display: flex; align-items: center; gap: 12px; }
.v4-admin-btn {
  display: inline-flex; align-items: center; gap: 8px; border: 0; cursor: pointer;
  font-family: inherit; font-size: 14px; white-space: nowrap; background: none;
}
.v4-admin-btn {
  padding: 8px 18px; border-radius: 999px;
  border: 1px solid var(--brand); color: var(--brand); background: transparent;
  transition: background 220ms ease, color 220ms ease;
}
.v4-admin-btn:hover { background: var(--brand); color: var(--paper); }
.v4-admin-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.v4-nav.is-ghost .v4-admin-btn { border-color: rgba(253,241,225,0.7); color: #fdf1e1; }
.v4-nav.is-ghost .v4-admin-btn:hover { background: #fdf1e1; color: var(--brand); }

.v4-burger { display: none; border: 0; background: none; cursor: pointer; color: inherit; padding: 6px; }
.v4-nav.is-ghost .v4-burger { color: #fdf1e1; }

.v4-mobile-menu {
  display: flex; flex-direction: column; gap: 4px; padding: 12px 28px 20px;
  background: var(--paper); border: 0;
  box-shadow: 0 18px 40px rgba(11, 61, 27, 0.14);
}
.v4-mobile-menu button {
  border: 0; background: none; text-align: left; padding: 10px 0;
  font: inherit; font-size: 16px; color: var(--brand); cursor: pointer;
}
.v4-mobile-menu hr { border: 0; border-top: 1px solid var(--line); margin: 6px 0; }
.v4-msearch {
  display: flex; align-items: center; gap: 8px; margin: 2px 0 8px;
  padding: 10px 16px; border: 1px solid var(--line); border-radius: 999px; background: #fff;
}
.v4-msearch input {
  flex: 1 1 auto; min-width: 0; border: 0; background: none; outline: none;
  font: inherit; font-size: 15px; color: var(--brand);
}
.v4-msearch input::placeholder { color: rgba(17, 20, 17, 0.38); }
.v4-msearch button {
  display: inline-flex; border: 0; background: none; padding: 0;
  color: var(--brand); cursor: pointer;
}

@media (max-width: 1024px) {
  .v4-nav-links { display: none; }
  .v4-burger { display: inline-flex; }
  .v4-admin-btn span { display: none; }
}
@media (min-width: 1025px) { .v4-mobile-menu { display: none; } }

/* ---------- เนื้อหา ---------- */
.v4-main { flex: 1 1 auto; padding-top: 76px; }
.v4-main.is-cinema { padding-top: 0; }
.v4-calc-wrap { padding: 72px 20px; background: var(--paper-soft); }

/* ---------- ปรับเนื้อหาเดิมจากเว็บหลักให้เข้าชุดกับดีไซน์ใหม่ ----------
   ทุก selector อยู่ใต้ .v4-main จึงไม่กระทบหน้าเดิมที่ / เลย */
.v4-main > main,
.v4-main > div { background: var(--paper-soft); }

/* พื้นเทาเย็น ๆ ของบล็อก whyUs และแถบต่าง ๆ → เปลี่ยนเป็นครีมอุ่น */
.v4-main .bg-gray-50 { background-color: #fbf6ed; }
/* ยกเว้นช่องกรอกที่อ่านอย่างเดียว (ระยะเวลาในเครื่องคำนวณสินเชื่อ)
   ครีมทำให้ดูเหมือนช่องพัง ไม่เข้าชุดกับช่องอื่นที่เป็นขาว */
.v4-main .input-modern.bg-gray-50 { background-color: #fff; border-color: #e2e8f0; }
.v4-main .border-gray-100 { border-color: rgba(11, 61, 27, 0.1); }

/* หัวข้อทุกระดับใช้ฟอนต์ชุดใหม่ และหนักขึ้นนิดให้อ่านง่ายบนพื้นครีม */
.v4-main h2, .v4-main h3, .v4-main h4 {
  font-family: var(--display);
  letter-spacing: 0.005em;
}
.v4-main .text-brand-green { color: var(--brand); }

/* ช่องค้นหา */
.v4-main form input[type="text"] {
  background: #fffdf9;
  border-color: rgba(11, 61, 27, 0.14);
  box-shadow: 0 14px 34px rgba(11, 61, 27, 0.08);
}

/* แผนที่หมุด */
.v4-main .leaflet-container {
  border-radius: 22px;
  box-shadow: 0 22px 54px rgba(11, 61, 27, 0.16);
}

.v4-loading {
  min-height: 70vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 16px; color: var(--brand);
}
.v4-loading p { color: rgba(17,20,17,0.5); letter-spacing: 0.08em; font-weight: 300; }
.v4-spin { animation: v4spin 1s linear infinite; }
@keyframes v4spin { to { transform: rotate(360deg); } }

/* ---------- ป็อปอัป ---------- */
.v4-popup-backdrop {
  position: fixed; inset: 0; z-index: 200; display: flex; align-items: center;
  justify-content: center; padding: 16px; background: rgba(6, 20, 10, 0.72);
  backdrop-filter: blur(4px);
}
.v4-popup {
  background: var(--paper); border-radius: 22px; overflow: hidden;
  max-width: 520px; width: 100%; box-shadow: 0 40px 90px rgba(0,0,0,0.4);
  display: flex; flex-direction: column;
}
.v4-popup-img { width: 100%; height: auto; max-height: 78vh; object-fit: contain; display: block; }
.v4-popup-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px 18px; border-top: 1px solid var(--line); font-size: 14px;
}
.v4-popup-foot label { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: rgba(17,20,17,0.7); }
.v4-popup-foot button {
  border: 0; cursor: pointer; font: inherit; font-size: 14px;
  padding: 8px 20px; border-radius: 999px; background: var(--brand); color: var(--paper);
}

/* ---------- ท้ายเว็บ ---------- */
.v4-footer { margin-top: auto; background: #0b1f12; color: var(--paper); position: relative; z-index: 30; }
.v4-footer-inner {
  max-width: 1400px; margin: 0 auto; padding: 64px 28px 40px;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 40px;
}
.v4-footer h3 {
  margin: 0 0 12px; font-size: 26px; font-weight: 300; letter-spacing: 0.2em;
  font-family: var(--display); text-transform: uppercase;
}
.v4-footer h4 {
  margin: 0 0 14px; font-size: 13px; font-weight: 500;
  letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.75;
}
.v4-footer p, .v4-footer span, .v4-footer a {
  display: block; color: rgba(253, 241, 225, 0.78); font-size: 14px;
  line-height: 1.7; text-decoration: none; margin-bottom: 6px;
}
.v4-footer a:hover { color: #fff; text-decoration: underline; }
.v4-footer .v4-phone { font-size: 18px; color: var(--paper); margin: 8px 0; }
.v4-social { display: flex; gap: 16px; margin-top: 4px; }
.v4-social a { margin: 0; opacity: 0.8; transition: opacity 200ms ease, transform 200ms ease; }
.v4-social a:hover { opacity: 1; transform: translateY(-2px); }
.v4-footer-base {
  max-width: 1400px; margin: 0 auto; padding: 20px 28px 32px;
  border-top: 1px solid rgba(253, 241, 225, 0.18);
  text-align: center; font-size: 12px; letter-spacing: 0.05em; opacity: 0.6;
}

/* ---------- แถบโหมดแก้ไข ---------- */
.v4-editbar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 16px; padding: 14px 22px; background: #0f172a; color: #fff;
  box-shadow: 0 -10px 40px rgba(0,0,0,0.35);
}
.v4-editbar-info { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.v4-editbar-chip {
  display: inline-flex; align-items: center; gap: 8px;
  background: #2563eb; padding: 7px 14px; border-radius: 10px; font-size: 14px;
}
.v4-editbar-info small { color: #94a3b8; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
.v4-editbar-history { display: flex; gap: 2px; background: #1e293b; padding: 4px; border-radius: 10px; }
.v4-editbar-history button {
  display: inline-flex; align-items: center; gap: 6px; border: 0; cursor: pointer;
  background: none; color: inherit; font: inherit; font-size: 14px;
  padding: 7px 14px; border-radius: 7px;
}
.v4-editbar-history button:hover:not(:disabled) { background: #334155; }
.v4-editbar-history button:disabled { opacity: 0.3; cursor: not-allowed; }
.v4-editbar-actions { display: flex; gap: 12px; }
.v4-editbar-actions button {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border: 0; cursor: pointer; font: inherit; font-size: 14px;
  padding: 11px 26px; border-radius: 999px;
}
.v4-ghost { background: #334155; color: #fff; }
.v4-save { background: var(--brand); color: #fff; }
.v4-save:disabled { opacity: 0.5; cursor: not-allowed; }
`;
