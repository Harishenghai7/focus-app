import { useEffect, useState } from 'react';

/**
 * useBatteryStatus
 * Battery level monitoring (if supported).
 * @returns {Object} { level, charging }
 * @example
 * const { level, charging } = useBatteryStatus();
 */
export default function useBatteryStatus() {
  const [status, setStatus] = useState({ level: 1, charging: true });
  useEffect(() => {
    let battery;
    const update = () => setStatus({ level: battery.level, charging: battery.charging });
    if (navigator.getBattery) {
      navigator.getBattery().then(bat => {
        battery = bat;
        update();
        battery.addEventListener('levelchange', update);
        battery.addEventListener('chargingchange', update);
      });
    }
    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', update);
        battery.removeEventListener('chargingchange', update);
      }
    };
  }, []);
  return status;
}
