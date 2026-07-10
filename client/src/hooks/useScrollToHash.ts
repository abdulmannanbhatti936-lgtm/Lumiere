import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * wouter navigates via history.pushState, which — unlike a real browser
 * navigation — never triggers the native "scroll to #fragment" behavior.
 * Call this in a page that has anchor targets (id="...") so links like
 * `/experience#tours` actually land on the right section.
 */
export function useScrollToHash() {
  const [location] = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // location (path only, no hash) is the effect's real dependency — wouter
    // re-runs this whenever the route changes, including hash-only arrivals
    // via a fresh mount of the destination page.
  }, [location]);
}
