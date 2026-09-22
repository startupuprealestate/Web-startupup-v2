import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { fetchPublicDocumentRest, fetchPublicPropertyRest, matchesPropertySlug } from '../../lib/firestorePublic';
import { subscribePropertyDetails } from '../../lib/propertyDetails';

export default function usePropertyLink({
  db, appId, loading, requestedPropSlug, properties, selectedProperty,
  setRequestedPropSlug, setSelectedProperty, setActiveTab, setGlobalAlert,
}) {
  useEffect(() => {
    if (loading || !requestedPropSlug) return;
    const cachedProperty = properties.find(property => matchesPropertySlug(property, requestedPropSlug));

    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const closeAlert = () => setGlobalAlert(previous => ({ ...previous, isOpen: false }));

    // The cached list identifies the document; its price may already be stale.
    const request = cachedProperty?.id
      ? fetchPublicDocumentRest(`properties/${encodeURIComponent(cachedProperty.id)}`, { signal: controller.signal, cache: 'no-store' })
      : fetchPublicPropertyRest(requestedPropSlug, { signal: controller.signal });
    request.then(property => {
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
      // Retry the requested house, including navigation from another card/page.
      setGlobalAlert({
        isOpen: true, type: 'error', title: 'โหลดข้อมูลไม่สำเร็จ',
        message: 'ยังโหลดข้อมูลบ้านไม่ได้ในตอนนี้ กรุณากดตกลงเพื่อลองใหม่',
        showCancel: false,
        onConfirm: () => window.location.assign(`/api/share?property=${encodeURIComponent(requestedPropSlug)}`),
      });
    }).finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [loading, requestedPropSlug, properties, setRequestedPropSlug, setSelectedProperty, setActiveTab, setGlobalAlert]);

  const selectedId = selectedProperty?.id;
  useEffect(() => {
    if (!selectedId || requestedPropSlug) return;
    const propertyRef = doc(db, 'artifacts', appId, 'public', 'data', 'properties', selectedId);
    // Subscribe only to the house being viewed, not the entire catalogue.
    return subscribePropertyDetails({
      observe: (options, onValue, onError) => onSnapshot(propertyRef, options, onValue, onError),
      onProperty: property => setSelectedProperty(current => current?.id === selectedId ? property : current),
      onMissing: () => {
        setSelectedProperty(current => current?.id === selectedId ? null : current);
        setActiveTab('home');
        setGlobalAlert({
          isOpen: true, type: 'error', title: 'ไม่พบข้อมูล',
          message: 'บ้านหลังนี้ถูกนำออกจากรายการแล้ว ระบบจะพากลับหน้าหลัก',
          showCancel: false,
          onConfirm: () => setGlobalAlert(previous => ({ ...previous, isOpen: false })),
        });
      },
      onError: error => console.warn('Live property updates unavailable.', error),
    });
  }, [db, appId, selectedId, requestedPropSlug, setSelectedProperty, setActiveTab, setGlobalAlert]);
}
