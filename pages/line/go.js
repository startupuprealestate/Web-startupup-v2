import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { captureAttribution, contactAttribution, chatUrl, cleanText, cleanBookingText } from '../../lib/lineAttribution';
import { needsLineAppTap } from '../../lib/lineLaunch';
import styles from '../../styles/line-leads.module.css';

export default function LineGo({ bookingText, property }) {
  const started = useRef(false);
  const [error, setError] = useState('');
  const [launchUrl, setLaunchUrl] = useState('');
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function start() {
      try {
        const res = await fetch('/api/line/start', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attribution: contactAttribution(captureAttribution(), window.location.href), bookingText, property }), signal: AbortSignal.timeout(15000) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setLaunchUrl(data.url);
        if (needsLineAppTap(navigator.userAgent, navigator.platform, navigator.maxTouchPoints)) return;
        window.location.replace(data.url);
      } catch (err) { setError(err.message || 'เปิด LINE ไม่สำเร็จ กรุณาลองใหม่'); }
    }
    start();
  }, [bookingText, property]);
  return <main className={styles.gateway}><Head><title>ติดต่อ STARTUP UP ผ่าน LINE</title><meta name="robots" content="noindex,nofollow" /><meta name="referrer" content="no-referrer" /></Head>
    <section className={styles.gatewayCard}><span className={styles.eyebrow}>STARTUP UP · LINE</span>
      <h1>{error ? 'เปิด LINE ไม่สำเร็จ' : launchUrl ? 'ติดต่อทีมงานทาง LINE' : 'กำลังเปิด LINE…'}</h1>
      {error ? <>
        <p role="alert" className={styles.error}>{error}</p>
        <button className={styles.primary} onClick={() => window.location.reload()}>ลองอีกครั้ง</button>
        <a className={styles.secondary} href={chatUrl(bookingText)} rel="noreferrer">เปิดแชท LINE โดยตรง</a>
      </> : launchUrl ? <>
        <p role="status">แตะปุ่มเพื่อเปิดแอป LINE และติดต่อ @SURE141</p>
        <a className={styles.primary} href={launchUrl} rel="noreferrer">เปิดแอป LINE</a>
        <details><summary>หากแอป LINE ไม่เปิด</summary><p>ลองแตะปุ่มค้างแล้วเลือก “เปิดใน LINE” หรือใช้ตัวสแกน QR ภายในแอป LINE หากเปิดจาก Facebook หรือ TikTok ให้เปิดหน้านี้ใน Safari แล้วลองอีกครั้ง</p></details>
      </> : <p role="status">กรุณารอสักครู่ เราจะพาคุณไปที่ @SURE141 อัตโนมัติ</p>}
      <noscript><p>กรุณาเปิด JavaScript เพื่อเปิด LINE อัตโนมัติ</p><a className={styles.secondary} href={chatUrl(bookingText)} rel="noreferrer">เปิดแชท LINE โดยตรง</a></noscript>
      <a className={styles.textLink} href="/line/privacy" target="_blank" rel="noreferrer">อ่านคำชี้แจงการใช้ข้อมูล</a>
    </section></main>;
}

export async function getServerSideProps({ query, res }) {
  const { getLineConfig } = await import('../../lib/lineServer');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const bookingText = cleanBookingText(query.booking);
  const cfg = getLineConfig();
  if (!cfg.enabled || !cfg.ready) return { redirect: { destination: chatUrl(bookingText), permanent: false } };
  return { props: { bookingText, property: { id: cleanText(query.property, 100), name: cleanText(query.name) } } };
}
