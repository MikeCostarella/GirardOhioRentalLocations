import { useCallback, useRef, useState } from 'react';

export type LocateStatus =
  | 'idle'
  | 'locating'
  | 'located' // position acquired
  | 'denied' // permission denied
  | 'error'; // unavailable / timed out

export interface LocateState {
  status: LocateStatus;
  position: { lat: number; lon: number } | null;
}

// Rough Girard, Ohio bounding box (with a little padding) so we can tell the
// user when their location is well outside the mapped area. Derived from the
// data extent: lat 41.134–41.177, lng -80.709 to -80.678.
const GIRARD_BOUNDS = {
  minLat: 41.10,
  maxLat: 41.21,
  minLng: -80.75,
  maxLng: -80.64,
};

export function isNearGirard(lat: number, lon: number): boolean {
  return (
    lat >= GIRARD_BOUNDS.minLat &&
    lat <= GIRARD_BOUNDS.maxLat &&
    lon >= GIRARD_BOUNDS.minLng &&
    lon <= GIRARD_BOUNDS.maxLng
  );
}

export function useGeolocation() {
  const [state, setState] = useState<LocateState>({
    status: 'idle',
    position: null,
  });
  // Guard so an auto-attempt only fires once.
  const attempted = useRef(false);

  const locate = useCallback((opts?: { auto?: boolean }) => {
    if (opts?.auto) {
      if (attempted.current) return;
      attempted.current = true;
    }
    if (!('geolocation' in navigator)) {
      setState({ status: 'error', position: null });
      return;
    }
    setState((s) => ({ ...s, status: 'locating' }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: 'located',
          position: { lat: pos.coords.latitude, lon: pos.coords.longitude },
        });
      },
      (err) => {
        setState({
          status: err.code === err.PERMISSION_DENIED ? 'denied' : 'error',
          position: null,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { ...state, locate };
}
