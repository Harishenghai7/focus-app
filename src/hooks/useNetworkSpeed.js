import { useEffect, useState } from 'react';

/**
 * useNetworkSpeed
 * Monitor network quality using image download.
 * @returns {number} speedMbps - Estimated speed in Mbps
 * @example
 * const speed = useNetworkSpeed();
 */
export default function useNetworkSpeed() {
  const [speed, setSpeed] = useState(null);
  useEffect(() => {
    const img = new window.Image();
    const start = performance.now();
    img.src = 'https://www.google.com/images/phd/px.gif?' + Math.random();
    img.onload = () => {
      const end = performance.now();
      const duration = (end - start) / 1000;
      const size = 35 * 1024; // 35KB
      setSpeed(Number(((size * 8) / (duration * 1024 * 1024)).toFixed(2)));
    };
  }, []);
  return speed;
}
