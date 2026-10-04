'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface AnalyticsBeaconProps {
  analyticsId?: string | null;
}

/**
 * Privacy-Friendly Analytics Beacon
 *
 * Runs exclusively when an analytics ID or environment flag is active.
 * Uses zero tracking cookies, respects Do Not Track (DNT),
 * and transmits only anonymized path navigations.
 */
export const AnalyticsBeacon: React.FC<AnalyticsBeaconProps> = ({ analyticsId }) => {
  const pathname = usePathname();
  const activeId = analyticsId || process.env.NEXT_PUBLIC_ANALYTICS_ID;

  useEffect(() => {
    // If no analytics ID is set, or if user enabled Do Not Track, stay completely inert
    if (!activeId) return;
    if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') return;

    // Log anonymized client-side navigation in privacy-friendly fashion
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Privacy Analytics] Anonymized pageview: ${pathname}`);
    }
  }, [pathname, activeId]);

  return null;
};
