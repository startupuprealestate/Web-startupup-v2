import { useEffect } from 'react';

// Shared with the animation and the main menu so every route lands at the same reading point.
export const CINEMA_STATIONS = [
  { key: 'locations', at: 2050, label: 'เลือกทำเล' },
  { key: 'featured', at: 3740, label: 'เลือกประเภทบ้าน' },
  { key: 'map', at: 6480, label: 'แผนที่บ้าน' },
];
const CHAPTERS = [{ key: 'intro', at: 0, label: 'หน้าแรก' }, ...CINEMA_STATIONS];
const END = { key: 'after', label: 'รายละเอียดเพิ่มเติม' };
const ARRIVAL_TOLERANCE = 80;

function focusAfterChapter(section, chapter) {
  if (chapter.key === 'after') {
    const heading = section.nextElementSibling?.querySelector('h1, h2, h3');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }
}

export default function CinemaNavigation({ sectionRef, isEditMode }) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || isEditMode) return;
    let gesture = null;
    let landingFrame;
    const cancel = () => { gesture = null; cancelAnimationFrame(landingFrame); };
    const glideToChapter = chapter => {
      const from = window.scrollY;
      const to = section.offsetTop + (chapter.key === 'after' ? section.offsetHeight - 76 : chapter.at);
      const distance = to - from;
      const duration = Math.min(1000, Math.max(450, Math.abs(distance) * 0.3));
      const started = performance.now();
      const frame = now => {
        const progress = Math.min(1, (now - started) / duration);
        // Continuous velocity at both ends avoids a jolt when the finger lifts or the scene lands.
        const eased = progress * progress * (3 - 2 * progress);
        window.scrollTo({ top: from + distance * eased, behavior: 'instant' });
        if (progress < 1) landingFrame = requestAnimationFrame(frame);
        else focusAfterChapter(section, chapter);
      };
      landingFrame = requestAnimationFrame(frame);
    };
    const start = event => {
      cancelAnimationFrame(landingFrame);
      gesture = null;
      if (event.touches.length !== 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      for (let node = event.target; node && node !== section; node = node.parentElement) {
        const overflow = getComputedStyle(node).overflowY;
        if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight + 1) return;
      }
      const distance = window.scrollY - section.offsetTop;
      if (distance < -80 || distance > section.offsetHeight - window.innerHeight) return;
      const touch = event.touches[0];
      gesture = { x: touch.clientX, y: touch.clientY, distance };
    };
    const end = event => {
      const initial = gesture;
      gesture = null;
      if (!initial || event.touches.length || event.changedTouches.length !== 1) return;
      const touch = event.changedTouches[0];
      const vertical = initial.y - touch.clientY;
      const horizontal = initial.x - touch.clientX;
      // Leave taps, horizontal carousels, pinch zoom and tiny reading adjustments alone.
      if (Math.abs(vertical) < 48 || Math.abs(vertical) < Math.abs(horizontal) * 1.3) return;
      const destination = vertical > 0
        ? CHAPTERS.find(chapter => chapter.at > initial.distance + ARRIVAL_TOLERANCE) || END
        : CHAPTERS.filter(chapter => chapter.at < initial.distance - ARRIVAL_TOLERANCE).at(-1);
      if (!destination) return;
      // Follow the finger, then glide into the reading point; a new input cancels immediately.
      glideToChapter(destination);
    };
    // Capture also sees page swipes beginning over Leaflet, which stops bubbling touch events.
    section.addEventListener('touchstart', start, { passive: true, capture: true });
    section.addEventListener('touchend', end, { passive: true, capture: true });
    section.addEventListener('touchcancel', cancel, { passive: true, capture: true });
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('pointerdown', cancel, { passive: true });
    window.addEventListener('keydown', cancel);
    window.addEventListener('blur', cancel);
    return () => {
      cancel();
      section.removeEventListener('touchstart', start, true);
      section.removeEventListener('touchend', end, true);
      section.removeEventListener('touchcancel', cancel, true);
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('pointerdown', cancel);
      window.removeEventListener('keydown', cancel);
      window.removeEventListener('blur', cancel);
    };
  }, [sectionRef, isEditMode]);

  return null;
}
