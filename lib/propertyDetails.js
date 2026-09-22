// Ignore the older local snapshot Firestore can emit before its server reply.
export function subscribePropertyDetails({ observe, onProperty, onMissing, onError }) {
  let disposed = false;
  const stop = observe({ includeMetadataChanges: true }, snapshot => {
    if (disposed || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
    if (snapshot.exists()) onProperty({ ...snapshot.data(), id: snapshot.id });
    else onMissing();
  }, error => {
    if (!disposed) onError(error);
  });
  return () => {
    disposed = true;
    stop();
  };
}
