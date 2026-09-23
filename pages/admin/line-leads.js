import Head from 'next/head';
import Link from 'next/link';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { ArrowLeft, ArrowUpRight, Check, Copy, Link2, LockKeyhole, RefreshCw, Search, Users, X } from 'lucide-react';
import { lineAdminAuth } from '../../lib/lineClientAuth';
import { SOURCE_LABELS, sourceGroup } from '../../lib/lineAttribution';
import { PLATFORM_LABELS, defaultReportRange, formatReportDate, parseReportDate, reportPlatform, reportRange } from '../../lib/lineReport';
import styles from '../../styles/line-leads.module.css';

const ROOT = 'https://www.startupup-real-estate.com';
const linkPresets = [
  { label: 'TikTok · หน้าโปรไฟล์', source: 'tiktok', medium: 'social', campaign: 'tiktok_bio', path: '/line/go' },
  { label: 'Facebook · หน้าเพจ', source: 'facebook', medium: 'social', campaign: 'facebook_page', path: '/line/go' },
  { label: 'Google Ads · เข้าเว็บไซต์', source: 'google', medium: 'cpc', campaign: 'google_search', path: '/' },
];
const formatDate = value => value ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(new Date(value)) : '—';
function Tag({ touch }) { const source = sourceGroup(touch); return <span className={styles.tag} data-source={source}>{SOURCE_LABELS[source] || SOURCE_LABELS.unknown}</span>; }
function ContactStatus({ lead }) {
  if ((lead.lastUnfollowAt || 0) > (lead.lastFollowAt || 0)) return 'บล็อกบัญชี';
  if (lead.lastMessageAt) return 'มีข้อความเข้าแล้ว';
  if (lead.lastFollowAt) return 'เพิ่มเพื่อนแล้ว';
  return lead.attributedAt ? 'เชื่อมต้นทางแล้ว' : SOURCE_LABELS.unknown;
}

function demoLeads() {
  const now = Date.now();
  return ['google_ads', 'tiktok', 'facebook_ads', 'facebook', 'unknown', 'tiktok'].map((source, i) => ({
    eventId: `demo-${i}`, occurredAt: now - i * 3600000, platform: reportPlatform({ source }), kind: 'connection',
    touch: { source, campaign: 'แคมเปญตัวอย่าง' }, property: { name: i < 3 ? 'บ้านตัวอย่าง คลองหลวง' : '' },
    userId: 'U' + String(i === 5 ? 2 : i + 1).padStart(32, '0'), displayName: ['คุณเอ · ตัวอย่าง', 'คุณบี · ตัวอย่าง', 'คุณซี · ตัวอย่าง', 'คุณดี · ตัวอย่าง', 'ลูกค้าตัวอย่าง', 'คุณบี · ตัวอย่าง'][i],
    firstTouch: { source, campaign: ['บ้านคลองหลวง', 'tiktok_bio', 'บ้านพร้อมอยู่', 'facebook_page', ''][i] },
    lastTouch: { source, campaign: ['บ้านคลองหลวง', 'tiktok_bio', 'บ้านพร้อมอยู่', 'facebook_page', ''][i] },
    lastProperty: { name: i < 3 ? 'บ้านตัวอย่าง คลองหลวง' : '' }, updatedAt: now - i * 3600000,
    firstSeenAt: now - i * 86400000, attributedAt: i < 4 ? now : null,
    lastMessageAt: i < 2 ? now - i * 3600000 : null, connectionCount: i + 1,
  }));
}

export default function LineLeads({ isDemo, initialRange }) {
  const [authReady, setAuthReady] = useState(isDemo);
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState(null);
  const [filters, setFilters] = useState({ ...initialRange, platform: 'all' });
  const [dateError, setDateError] = useState('');
  const [setup, setSetup] = useState(isDemo ? { ready: false, enabled: false, missing: [] } : null);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [listOpen, setListOpen] = useState(false);
  const [copied, setCopied] = useState('');
  const [preset, setPreset] = useState(0);
  const [campaign, setCampaign] = useState(linkPresets[0].campaign);
  const generation = useRef(0);
  const authRef = useRef(null);
  const listRef = useRef(null);
  const dialogRef = useRef(null);
  const canView = isDemo || Boolean(user);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!listOpen || !canView) { if (dialog.open) dialog.close(); return; }
    if (!dialog.open) dialog.showModal();
    listRef.current?.focus({ preventScroll: true });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [listOpen, canView]);
  const load = useCallback(async (account, after = null) => {
    const requestGeneration = ++generation.current;
    setLoading(true); setError('');
    try {
      const token = await account.getIdToken();
      const params = new URLSearchParams(filters);
      if (after) params.set('cursor', after);
      const response = await fetch('/api/line/leads?' + params, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (requestGeneration !== generation.current) return;
      setLeads(previous => after ? [...new Map([...previous, ...data.leads].map(row => [row.eventId, row])).values()] : data.leads);
      setCounts(data.counts);
      setSetup(data.setup); setCursor(data.nextCursor);
    } catch (err) { if (requestGeneration === generation.current) setError(err.message || 'โหลดข้อมูลไม่สำเร็จ'); }
    finally { if (requestGeneration === generation.current) setLoading(false); }
  }, [filters]);
  useEffect(() => {
    if (isDemo) return;
    authRef.current = lineAdminAuth();
    const stop = onAuthStateChanged(authRef.current, account => {
      generation.current += 1;
      setUser(account && !account.isAnonymous ? account : null);
      setAuthReady(true); setLeads([]); setSelected(null); setListOpen(false); setSetup(null); setCursor(null);
      setCounts(null);
    });
    return () => { generation.current += 1; stop(); };
  }, [isDemo]);
  useEffect(() => {
    setLeads([]); setCursor(null); setSelected(null); setCounts(null); setSearch('');
    if (isDemo) {
      const range = reportRange(filters);
      const entries = demoLeads().filter(row => row.occurredAt >= range.from && row.occurredAt < range.until);
      setCounts(Object.fromEntries(Object.keys(PLATFORM_LABELS).map(key => [key, entries.filter(row => row.platform === key).length])));
      setLeads(entries.filter(row => filters.platform === 'all' || row.platform === filters.platform));
    } else if (user) load(user);
    return () => { generation.current += 1; };
  }, [isDemo, user, filters, load]);

  function applyDates(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let dates;
    try {
      dates = { start: parseReportDate(form.get('start')), end: parseReportDate(form.get('end')) };
      reportRange(dates);
    }
    catch (err) { setDateError(err.message); return; }
    setDateError(''); setFilters(previous => ({ ...previous, ...dates }));
  }
  function choosePlatform(platform) {
    setFilters(previous => ({ ...previous, platform }));
    setListOpen(true);
  }

  async function login() {
    setError('');
    try { await signInWithPopup(authRef.current || lineAdminAuth(), new GoogleAuthProvider()); }
    catch (err) { if (err.code !== 'auth/popup-closed-by-user') setError('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่'); }
  }
  async function copy(text, key) {
    try { await navigator.clipboard.writeText(text); setCopied(key); }
    catch { setError('คัดลอกไม่สำเร็จ กรุณาเลือกข้อความแล้วคัดลอกด้วยตนเอง'); }
  }
  const visible = leads.filter(lead => [lead.displayName, lead.userId, lead.touch?.campaign, lead.property?.name]
      .some(value => String(value || '').toLowerCase().includes(search.toLowerCase())));
  const total = counts ? Object.values(counts).reduce((sum, count) => sum + count, 0) : null;
  const selectedTotal = filters.platform === 'all' ? total : counts?.[filters.platform];
  const p = linkPresets[preset];
  const generatedLink = `${ROOT}${p.path}?${new URLSearchParams({ utm_source: p.source, utm_medium: p.medium, utm_campaign: campaign.trim() || p.campaign })}`;

  return <div className={styles.app}><Head><title>ที่มาลูกค้า LINE · STARTUP UP</title><meta name="robots" content="noindex,nofollow" /><meta name="referrer" content="no-referrer" /></Head>
    <header className={styles.topbar}><Link href="/" className={styles.brand}>STARTUP UP<span>ทีมดูแลลูกค้า</span></Link>
      <div className={styles.headerActions}><span className={styles.account}>บัญชีหลัก @SURE141</span><Link href="/" className={styles.textLink}><ArrowLeft size={16} aria-hidden="true" /> กลับเว็บไซต์</Link></div></header>
    <main className={styles.main}>
      <div className={styles.heading}><div><span className={styles.eyebrow}>CUSTOMER SOURCES</span><h1>ทุกช่องทาง อยู่ใน LINE เดียว</h1><p>ดูต้นทางลูกค้าและแคมเปญ เพื่อให้ทีมงานรับช่วงดูแลได้ทันที</p></div>
        <span className={styles.private}><LockKeyhole size={15} aria-hidden="true" /> เฉพาะผู้ดูแล</span></div>
      {isDemo && <div className={styles.notice} role="status"><strong>หน้าตัวอย่าง · ข้อมูลสมมติทั้งหมด</strong> ยังไม่ได้เชื่อม LINE หรือเก็บข้อมูลลูกค้าจริง</div>}
      {!authReady && <p role="status">กำลังตรวจสอบการเข้าสู่ระบบ…</p>}
      {authReady && !canView && <section className={styles.loginCard}><LockKeyhole size={32} aria-hidden="true" /><h2>เข้าสู่ระบบเพื่อดูที่มาลูกค้า</h2><p>ใช้บัญชี Google ที่ได้รับสิทธิ์ดูข้อมูลลูกค้า LINE</p><button className={styles.primary} onClick={login}>เข้าสู่ระบบด้วย Google</button></section>}
      {error && !listOpen && <div className={styles.error} role="alert">{error}{user && <button className={styles.textButton} onClick={() => load(user)}>ลองอีกครั้ง</button>}</div>}
      {canView && <>
        {!isDemo && setup && (!setup.enabled || !setup.ready || !setup.webhookReady) && <div className={styles.notice}><strong>กำลังเตรียมเชื่อมบัญชีหลัก</strong><p>{!setup.enabled || !setup.ready ? 'ยังไม่เปิดใช้งานการติดตามจริง ปุ่มติดต่อยังพาลูกค้าไป LINE ได้ตามปกติ' : 'บันทึกต้นทางได้แล้ว แต่ยังไม่ได้เปิดรับสถานะเพิ่มเพื่อนและข้อความจาก LINE'}</p><p>ให้ผู้ดูแลตั้งค่า LINE Login / LIFF และการเชื่อมฐานข้อมูลตามคู่มือติดตั้งก่อนเปิดใช้งาน</p></div>}
        <section className={styles.panel} aria-labelledby="sources-title" aria-busy={loading}>
          <div className={styles.panelHeading}><div><h2 id="sources-title">สรุปที่มาลูกค้าแยกช่องทาง</h2><p>นับจำนวนครั้งที่เข้ามา รวมลูกค้าคนเดิมที่กลับมาอีกครั้ง</p></div><button className={styles.secondary} disabled={loading || isDemo} onClick={() => load(user)}><RefreshCw size={16} aria-hidden="true" />{loading ? 'กำลังโหลด…' : 'อัปเดตข้อมูล'}</button></div>
          <form className={styles.dateFilters} onSubmit={applyDates} noValidate>
            <label><span>วันที่เริ่มต้น</span><input type="text" name="start" required placeholder="dd/mm/yyyy" maxLength={10} defaultValue={formatReportDate(initialRange.start)} aria-describedby={dateError ? 'date-help date-error' : 'date-help'} aria-invalid={Boolean(dateError)} /></label>
            <label><span>วันที่สิ้นสุด</span><input type="text" name="end" required placeholder="dd/mm/yyyy" maxLength={10} defaultValue={formatReportDate(initialRange.end)} aria-describedby={dateError ? 'date-help date-error' : 'date-help'} aria-invalid={Boolean(dateError)} /></label>
            <button className={styles.primary} disabled={loading}>ดูข้อมูลตามวันที่</button>
          </form>
          {dateError && <p id="date-error" role="alert" className={styles.error}>{dateError}</p>}
          <p id="date-help" className={styles.muted}>วัน/เดือน/ปี ค.ศ. (dd/mm/yyyy) · เวลาไทย · รวมทั้งวันเริ่มต้นและวันสิ้นสุด · กดดูข้อมูลตามวันที่เพื่อใช้ช่วงที่เลือก</p>
          <p className={styles.resultCount} role="status">ช่วงที่แสดง {formatReportDate(filters.start)} ถึง {formatReportDate(filters.end)}{loading ? ' · กำลังโหลด…' : ''}</p>
          <table className={styles.sourceTable}><caption className={styles.srOnly}>จำนวนรายการแต่ละช่องทางในช่วงวันที่ที่แสดง</caption><thead><tr><th scope="col">ช่องทาง</th><th scope="col">จำนวนครั้ง</th><th scope="col"><span className={styles.srOnly}>ดูรายชื่อ</span></th></tr></thead><tbody>
            {Object.entries(PLATFORM_LABELS).map(([key, label]) => <tr key={key} data-active={filters.platform === key}><th scope="row"><button className={styles.platformButton} disabled={loading} aria-haspopup="dialog" aria-controls="line-customer-dialog" onClick={() => choosePlatform(key)}>{label}</button></th><td className={styles.numeric}>{counts?.[key] ?? '—'}</td><td><button className={styles.textButton} disabled={loading} onClick={() => choosePlatform(key)} aria-haspopup="dialog" aria-controls="line-customer-dialog" aria-label={`ดูรายชื่อจาก ${label}`}>ดูรายชื่อ <ArrowUpRight size={14} aria-hidden="true" /></button></td></tr>)}
          </tbody><tfoot><tr><th scope="row">รวมทุกช่องทาง</th><td className={styles.numeric}>{total ?? '—'}</td><td><button className={styles.textButton} disabled={loading} onClick={() => choosePlatform('all')} aria-haspopup="dialog" aria-controls="line-customer-dialog">ดูทั้งหมด</button></td></tr></tfoot></table>
          <p className={styles.muted}>นับเมื่อเชื่อมบัญชี LINE สำเร็จ หรือพบการติดต่อโดยตรงครั้งแรก ไม่ใช่จำนวนคนที่ไม่ซ้ำกัน ข้อความแชทแต่ละข้อความไม่นับเป็นการเข้ามาใหม่</p>
          <p className={styles.muted}>ข้อมูลเดิมก่อนเปิดประวัติแยกครั้งแสดงได้เท่าที่มีบันทึกไว้ และติดป้าย “ข้อมูลเดิม” การกลับมาครั้งใหม่จะเพิ่มแถวโดยไม่แทนที่แถวเดิม</p>
        </section>
        <dialog id="line-customer-dialog" ref={dialogRef} className={styles.customerDialog} aria-labelledby="customers-title" aria-describedby="customers-period" onClose={() => { setListOpen(false); setSelected(null); }}>
          <div className={styles.dialogHeader}><div><h2 id="customers-title" tabIndex={-1} ref={listRef}>รายการลูกค้า · {PLATFORM_LABELS[filters.platform] || 'ทุกช่องทาง'}</h2><p id="customers-period">{formatReportDate(filters.start)} ถึง {formatReportDate(filters.end)} · เวลาไทย</p></div><button className={styles.closeDialog} onClick={() => dialogRef.current?.close()} aria-label="ปิดรายการลูกค้า"><X size={22} aria-hidden="true" /></button></div>
          <div className={styles.dialogBody} aria-busy={loading}>
          <div className={styles.dialogToolbar}><p>รายการแยกแต่ละครั้งที่เข้ามา รวมลูกค้าคนเดิมที่กลับมา</p>{filters.platform !== 'all' && <button className={styles.secondary} disabled={loading} onClick={() => choosePlatform('all')}>ดูทุกช่องทาง</button>}</div>
          {error && <div className={styles.error} role="alert">{error}{user && <button className={styles.textButton} onClick={() => load(user)}>ลองอีกครั้ง</button>}</div>}
          <label className={styles.search}><span>ค้นหาในรายการที่โหลดแล้ว</span><div><Search size={18} aria-hidden="true" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ชื่อ แคมเปญ หรือโครงการ" /></div></label>
          <p className={styles.resultCount} role="status">{loading ? 'กำลังโหลดรายการ…' : `แสดง ${visible.length} รายการ จาก ${leads.length} รายการที่โหลด · ช่องทางนี้มี ${selectedTotal ?? '—'} ครั้งในช่วงวันที่`}</p>
          {visible.length ? <div className={styles.popupTableScroll} tabIndex={0} role="region" aria-label="ตารางรายการลูกค้า เลื่อนแนวนอนเพื่อดูทุกคอลัมน์"><table className={styles.popupTable}><thead><tr><th scope="col">ลูกค้า</th><th scope="col">ช่องทางของครั้งนี้ / แคมเปญ</th><th scope="col">สถานะปัจจุบัน</th><th scope="col">วันที่เข้ามา</th><th scope="col"><span className={styles.srOnly}>รายละเอียด</span></th></tr></thead><tbody>{visible.map(lead => <Fragment key={lead.eventId}><tr>
            <td><div className={styles.person}>{lead.pictureUrl ? <img src={lead.pictureUrl} width={42} height={42} alt="" referrerPolicy="no-referrer" /> : <span className={styles.avatar} aria-hidden="true">{lead.displayName?.slice(0, 1) || 'L'}</span>}<div><strong>{lead.displayName || 'ลูกค้า LINE'}</strong><small>{lead.property?.name || 'ยังไม่ระบุโครงการ'}</small></div></div></td>
            <td><span className={styles.tag} data-source={lead.platform}>{PLATFORM_LABELS[lead.platform]}</span><small className={styles.campaign}>{lead.touch?.campaign || 'ไม่ระบุแคมเปญ'}</small>{lead.kind === 'legacy' && <small className={styles.campaign}>ข้อมูลเดิม · ประวัติอาจไม่ครบทุกครั้ง</small>}{lead.kind === 'contact' && <small className={styles.campaign}>พบการติดต่อโดยตรงครั้งแรก</small>}</td><td><ContactStatus lead={lead} /></td><td className={styles.date}>{formatDate(lead.occurredAt)}</td><td><button className={styles.textButton} onClick={() => setSelected(selected?.eventId === lead.eventId ? null : lead)} aria-expanded={selected?.eventId === lead.eventId} aria-controls={`detail-${lead.eventId}`} aria-label={`ดูรายละเอียด ${lead.displayName} ${formatDate(lead.occurredAt)}`}>{selected?.eventId === lead.eventId ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}</button></td>
          </tr>{selected?.eventId === lead.eventId && <tr className={styles.expandedRow}><td colSpan={5} id={`detail-${lead.eventId}`}><div className={styles.details}><div><h3>ช่องทางของครั้งนี้</h3><Tag touch={lead.touch} /><p>{lead.touch?.campaign || 'ไม่ระบุแคมเปญ'}</p></div><div><h3>วันที่เข้ามาครั้งนี้</h3><p>{formatDate(lead.occurredAt)}</p></div><div><h3>โครงการที่สนใจครั้งนี้</h3><p>{lead.property?.name || 'ยังไม่ระบุโครงการ'}</p></div></div><p className={styles.muted}>รหัสลูกค้า: {lead.userId}</p><p className={styles.muted}>ชื่อ LINE อาจซ้ำกันได้ ใช้รูปโปรไฟล์ประกอบการตรวจสอบ และตอบลูกค้าผ่าน LINE OA</p></td></tr>}</Fragment>)}</tbody></table></div> : !loading && <div className={styles.empty}><Users size={32} aria-hidden="true" /><h3>{search ? 'ไม่พบรายการที่ตรงกับการค้นหา' : 'ยังไม่มีรายการในช่วงวันที่และช่องทางนี้'}</h3><p>{search ? 'ค้นหาเฉพาะรายการที่โหลดแล้ว ลองเปลี่ยนคำค้นหรือโหลดรายการเพิ่ม' : 'เลือกช่วงวันที่อื่นหรือดูทุกช่องทางได้'}</p></div>}
          {cursor && <button className={styles.secondary} disabled={loading} onClick={() => load(user, cursor)}>โหลดรายการเพิ่ม</button>}
          </div>
        </dialog>
        <section className={styles.panel} aria-labelledby="links-title"><div className={styles.panelHeading}><div><h2 id="links-title"><Link2 size={20} aria-hidden="true" /> ลิงก์เข้าบัญชีหลัก</h2><p>ใช้ลิงก์แยกช่องทาง ทุกลิงก์ติดต่อทีมเดียวกันที่ @SURE141</p></div></div>
          <div className={styles.linkBuilder}><label><span>ตำแหน่งที่จะนำลิงก์ไปใช้</span><select value={preset} onChange={e => { const index = Number(e.target.value); setPreset(index); setCampaign(linkPresets[index].campaign); setCopied(''); }}>{linkPresets.map((item, i) => <option value={i} key={item.source}>{item.label}</option>)}</select></label><label><span>ชื่อแคมเปญ</span><input value={campaign} maxLength={160} onChange={e => { setCampaign(e.target.value); setCopied(''); }} /></label></div>
          <div className={styles.copyRow}><input aria-label="ลิงก์ติดตามต้นทาง" readOnly value={generatedLink} /><button className={styles.primary} onClick={() => copy(generatedLink, 'link')}>{copied === 'link' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}{copied === 'link' ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</button></div>
        </section>
        <footer className={styles.footer}><p>ต้นทางอาศัยลิงก์ที่ใช้และข้อมูลที่เบราว์เซอร์ส่งมา ลิงก์ที่ถูกแชร์ต่ออาจยังติดป้ายช่องทางเดิม</p><div><a href="https://manager.line.biz/" target="_blank" rel="noopener noreferrer">เปิด LINE OA เพื่อตอบลูกค้า <ArrowUpRight size={15} aria-hidden="true" /></a>{user && <button className={styles.textButton} onClick={() => signOut(authRef.current)}>ออกจากระบบ</button>}</div></footer>
      </>}
    </main></div>;
}

export async function getServerSideProps({ query, res }) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  return { props: { isDemo: process.env.NODE_ENV === 'development' && query.demo === '1', initialRange: defaultReportRange() } };
}
