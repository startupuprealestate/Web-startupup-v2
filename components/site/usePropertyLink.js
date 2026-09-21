import { useEffect } from 'react';
import { fetchPublicPropertyRest, matchesPropertySlug } from '../../lib/firestorePublic';

export default function usePropertyLink({
  loading, requestedPropSlug, properties,
  setRequestedPropSlug, setSelectedProperty, setActiveTab, setGlobalAlert,
}) {
  useEffect(() => {
    if (loading || !requestedPropSlug) return;
    const cachedProperty = properties.find(property => matchesPropertySlug(property, requestedPropSlug));
    if (cachedProperty) {
      setSelectedProperty(cachedProperty);
      setRequestedPropSlug(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const closeAlert = () => setGlobalAlert(previous => ({ ...previous, isOpen: false }));

    fetchPublicPropertyRest(requestedPropSlug, { signal: controller.signal }).then(property => {
      if (cancelled) return;
      setSelectedProperty(property);
      setRequestedPropSlug(null);
      if (!property) {
        setActiveTab('home');
        setGlobalAlert({
          isOpen: true, type: 'error', title: 'ไม่พบข้อมูล',
          message: 'ไม่พบข้อมูลบ้านที่คุณระบุ ระบบจะพากลับหน้าหลัก',
          showCancel: false, onConfirm: closeAlert,
        });
      }
    }).catch(error => {
      if (cancelled) return;
      console.warn('Direct property lookup failed.', error);
      // Keep the original URL so a temporary network error can be retried.
      setGlobalAlert({
        isOpen: true, type: 'error', title: 'โหลดข้อมูลไม่สำเร็จ',
        message: 'ยังโหลดข้อมูลบ้านไม่ได้ในตอนนี้ กรุณากดตกลงเพื่อลองใหม่',
        showCancel: false, onConfirm: () => window.location.reload(),
      });
    }).finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [loading, requestedPropSlug, properties, setRequestedPropSlug, setSelectedProperty, setActiveTab, setGlobalAlert]);
}
