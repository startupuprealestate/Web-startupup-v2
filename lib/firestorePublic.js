const appId = 'startup-up-realestate';

const firebaseConfig = {
  apiKey: 'AIzaSyDsEeGxKA90-URCn06F-K3U2dvlISf_2Jo',
  projectId: 'startup-up-realestate',
};

const publicDataBaseUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/artifacts/${appId}/public/data`;

export const safeDecodeURIComponent = (value) => {
  try {
    return decodeURIComponent(String(value || ''));
  } catch {
    return String(value || '');
  }
};

export const decodeRepeatedly = (value, maxPasses = 4) => {
  let current = String(value || '');
  for (let i = 0; i < maxPasses; i += 1) {
    const next = safeDecodeURIComponent(current);
    if (next === current) break;
    current = next;
  }
  return current;
};

const compactLookupValue = (value) => decodeRepeatedly(value)
  .toLowerCase()
  .trim()
  .replace(/\s+/g, '');

export const makePropertySlug = (property) => {
  if (!property) return '';
  const rawSlug = property.custom_id || property.id || '';
  return encodeURIComponent(String(rawSlug).trim());
};

const getLookupVariants = (value) => {
  const decoded = decodeRepeatedly(value).trim();
  const raw = String(value || '').trim();

  return Array.from(new Set([
    raw,
    decoded,
    decoded.replace(/\//g, '-'),
    decoded.replace(/-/g, '/'),
    raw.replace(/\//g, '-'),
    raw.replace(/-/g, '/'),
  ].filter(Boolean)));
};

export const matchesPropertySlug = (property, slug) => {
  if (!property || !slug) return false;

  const targets = getLookupVariants(slug).map(compactLookupValue);
  const values = [
    property.custom_id,
    property.house_number,
    property.id,
    makePropertySlug(property),
    decodeRepeatedly(makePropertySlug(property)),
  ].flatMap(getLookupVariants).map(compactLookupValue);

  return targets.some((target) => values.includes(target));
};

const timestampToFirestoreLikeObject = (timestampValue) => {
  const millis = Date.parse(timestampValue);
  if (!Number.isFinite(millis)) return timestampValue;
  return {
    seconds: Math.floor(millis / 1000),
    nanoseconds: 0,
  };
};

const firestoreValueToJs = (value) => {
  if (!value || typeof value !== 'object') return undefined;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('timestampValue' in value) return timestampToFirestoreLikeObject(value.timestampValue);
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map(firestoreValueToJs);
  }
  if ('mapValue' in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, nestedValue]) => [
        key,
        firestoreValueToJs(nestedValue),
      ])
    );
  }
  if ('geoPointValue' in value) return value.geoPointValue;
  if ('referenceValue' in value) return value.referenceValue;
  if ('bytesValue' in value) return value.bytesValue;
  return undefined;
};

const firestoreDocumentToJs = (document) => {
  if (!document) return null;
  const id = String(document.name || '').split('/').pop();
  const data = Object.fromEntries(
    Object.entries(document.fields || {}).map(([key, value]) => [key, firestoreValueToJs(value)])
  );
  return { id, ...data };
};

const buildRestUrl = (path, params = {}) => {
  const url = new URL(`${publicDataBaseUrl}/${path}`);
  url.searchParams.set('key', firebaseConfig.apiKey);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
};

export const fetchPublicCollectionRest = async (collectionName) => {
  const documents = [];
  let pageToken = '';

  do {
    const response = await fetch(buildRestUrl(collectionName, {
      pageSize: 100,
      pageToken,
    }));

    if (!response.ok) {
      throw new Error(`Firestore REST collection read failed (${response.status})`);
    }

    const payload = await response.json();
    documents.push(...(payload.documents || []).map(firestoreDocumentToJs).filter(Boolean));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  return documents;
};

export const fetchPublicDocumentRest = async (documentPath) => {
  const response = await fetch(buildRestUrl(documentPath));
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Firestore REST document read failed (${response.status})`);
  }

  return firestoreDocumentToJs(await response.json());
};
