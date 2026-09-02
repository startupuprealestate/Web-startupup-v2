import React, { useEffect, useMemo, useState } from 'react';
import { Bath, Bed, ChevronLeft, ChevronRight, Home, Loader, MapPin, Maximize, Phone, ShieldCheck, Star, Trash2, Upload, Users } from 'lucide-react';

const fallbackHero = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=88';
const lifestyle = [
  ['https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=82', 'บ้านที่พร้อมสำหรับทุกวัน'],
  ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=82', 'พื้นที่ของความสุข'],
  ['https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=900&q=82', 'ดีไซน์ที่อยู่สบาย'],
  ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=82', 'มุมโปรดของครอบครัว'],
];

const money = (value) => {
  const n = Number(String(value || 0).replace(/,/g, ''));
  if (!n) return 'สอบถามราคา';
  return n >= 1000000 ? `${(n / 1000000).toFixed(n % 1000000 ? 2 : 0)} ลบ.` : `${n.toLocaleString('th-TH')} บาท`;
};

export default function ReferenceHome({ properties = [], visualContent = {}, companyInfo = {}, onSelectProp, onSeeAll, isEditMode = false, updateVisualContent, uploadImage, showHero = true }) {
  const slides = useMemo(() => (visualContent.heroBgs?.length ? visualContent.heroBgs : [fallbackHero]), [visualContent.heroBgs]);
  const [slide, setSlide] = useState(0);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = setInterval(() => setSlide((v) => (v + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);
  const featured = properties.filter((p) => p.badge !== 'Sold Out').slice(0, 4);
  const handleHeroUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !uploadImage || !updateVisualContent) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      updateVisualContent({ ...visualContent, heroBgs: [...slides, url] });
      setSlide(slides.length);
    } catch (error) {
      window.alert(`อัปโหลดรูปไม่สำเร็จ: ${error.message}`);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };
  const removeHero = () => {
    if (!updateVisualContent || slides.length <= 1) return window.alert('ต้องมีรูปหน้าปกอย่างน้อย 1 รูป');
    const next = slides.filter((_, index) => index !== slide);
    updateVisualContent({ ...visualContent, heroBgs: next });
    setSlide(Math.min(slide, next.length - 1));
  };

  return <div className="np-home">
    {showHero && <section className="np-hero">
      {slides.map((src, i) => <img key={src} src={src} alt="บ้านสำหรับครอบครัว" className={`np-hero-img ${i === slide ? 'is-active' : ''}`} />)}
      <div className="np-hero-overlay" />
      {isEditMode && <div className="np-hero-editor">
        <label>{uploading ? <Loader className="animate-spin"/> : <Upload/>}<span>{uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปหน้าปก'}</span><input type="file" accept="image/*" disabled={uploading} onChange={handleHeroUpload}/></label>
        <button type="button" onClick={removeHero} disabled={slides.length <= 1}><Trash2/> ลบรูปนี้</button>
        <small>รูปที่ {slide + 1} / {slides.length}</small>
      </div>}
      <div className="np-hero-content">
        <div className="np-brand-mark"><Home size={28}/><span>{companyInfo.name || 'STARTUP UP'} PROPERTY</span></div>
        <p>บ้านพร้อมอยู่...ผ่อนหลักพัน</p>
        <h1>บ้านพิเศษ เพื่อคนพิเศษ</h1>
        <div className="np-hero-copy">บ้านคุณภาพที่ใส่ใจทุกช่วงเวลาของครอบครัว พร้อมพื้นที่ใช้ชีวิตที่ตอบโจทย์ทุกเจเนอเรชัน</div>
        <button onClick={onSeeAll}>ดูโครงการบ้าน</button>
      </div>
      {slides.length > 1 && <>
        <button aria-label="ภาพก่อนหน้า" className="np-arrow np-left" onClick={() => setSlide((slide - 1 + slides.length) % slides.length)}><ChevronLeft/></button>
        <button aria-label="ภาพถัดไป" className="np-arrow np-right" onClick={() => setSlide((slide + 1) % slides.length)}><ChevronRight/></button>
        <div className="np-dots">{slides.map((_, i) => <button aria-label={`ภาพที่ ${i + 1}`} key={i} onClick={() => setSlide(i)} className={i === slide ? 'active' : ''}/>)}</div>
      </>}
    </section>}

    <section className="np-intro">
      <div className="np-intro-copy"><span>STARTUP UP PROPERTY</span><h2>เลือกบ้านในไลฟ์สไตล์ที่ชอบ</h2><p>จะบ้านแบบไหน...ก็เติมเต็มความสุขให้กับครอบครัว</p></div>
      <div className="np-life-grid">{lifestyle.map(([img, label], i) => <article key={label} className={`np-life-${i + 1}`}><img src={img} alt={label}/><b>{label}</b></article>)}</div>
      <div className="np-stats">
        <div><ShieldCheck/><strong>98+</strong><span>คะแนนลูกค้าพึงพอใจ</span></div>
        <div><Home/><strong>1,000+</strong><span>กำลังใจจากทุกบ้าน</span></div>
        <div><Users/><strong>15+</strong><span>ปีประสบการณ์ดูแลบ้าน</span></div>
      </div>
    </section>

    <section className="np-projects">
      <div className="np-section-head"><span>โครงการบ้านคุณภาพ</span><h2>เลือกบ้านที่เหมาะกับทุกจังหวะชีวิต</h2></div>
      <div className="np-cards">
        {featured.length ? featured.map((p) => <button className="np-card" key={p.id || p.project_name} onClick={() => onSelectProp?.(p)}>
          <div className="np-card-image"><img src={p.images?.[0] || p.imageUrl || fallbackHero} alt={p.project_name || 'บ้านพร้อมอยู่'}/>{p.badge && <i>{p.badge}</i>}<b>{p.category || 'บ้านพร้อมอยู่'}</b></div>
          <div className="np-card-body"><div><small>โครงการ</small><strong>{money(p.price)}</strong></div><h3>{p.project_name || 'บ้านพร้อมอยู่ทำเลคุณภาพ'}</h3><p><MapPin size={14}/>{p.main_location || p.district || 'ปทุมธานี'}</p><footer><span><Maximize/> {p.land_size || p.area || '-'} ตร.ว.</span><span><Bed/> {p.bedrooms || '-'} นอน</span><span><Bath/> {p.bathrooms || '-'} น้ำ</span></footer></div>
        </button>) : <div className="np-empty">กำลังเตรียมบ้านที่น่าสนใจสำหรับคุณ</div>}
      </div>
      <button className="np-outline" onClick={onSeeAll}>ดูบ้านทั้งหมด <ChevronRight size={18}/></button>
    </section>

    <section className="np-care">
      <div className="np-section-head"><span>เริ่มต้นความสุขได้ทันที</span><h2>บ้านพิเศษ เพื่อคนพิเศษ</h2><p>เราใส่ใจตั้งแต่การเลือกบ้าน จนถึงวันที่คุณย้ายเข้า</p></div>
      <div className="np-care-grid"><article><Home/><h3>พร้อมเข้าอยู่ทันที</h3><p>คัดสรรบ้านสภาพดี พร้อมใช้ชีวิตได้อย่างสบายใจ</p></article><article><Star/><h3>บ้านที่ตอบโจทย์จริง</h3><p>เลือกจากทำเล งบประมาณ และไลฟ์สไตล์ของคุณ</p></article><article><ShieldCheck/><h3>ดูแลตั้งแต่ต้นจนจบ</h3><p>ให้คำปรึกษาเรื่องบ้านและสินเชื่อแบบเป็นกันเอง</p></article></div>
    </section>

    <section className="np-contact">
      <div><span>ปรึกษาเรื่องบ้าน ฟรี!</span><h2>ให้เราเป็นผู้ช่วยหาบ้านที่ใช่</h2><p>ฝากข้อมูลไว้ แล้วทีมงานจะติดต่อกลับเพื่อดูแลคุณ</p><a href={`tel:${companyInfo.phone || '0624782426'}`}><Phone/> {companyInfo.phone || '062-478-2426'}</a></div>
      <form onSubmit={(e) => e.preventDefault()}><input aria-label="ชื่อ" placeholder="ชื่อ"/><input aria-label="เบอร์โทร" placeholder="เบอร์โทร"/><select aria-label="เรื่องที่สนใจ" defaultValue=""><option value="" disabled>กำลังสนใจ</option><option>ซื้อบ้าน</option><option>ขอคำปรึกษาสินเชื่อ</option><option>ฝากขายบ้าน</option></select><button><Phone size={18}/> ยืนยันส่งข้อมูล</button></form>
    </section>
  </div>;
}
