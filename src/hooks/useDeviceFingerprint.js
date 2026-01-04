import { useState, useEffect } from 'react';
import { generateAdvancedFingerprint, isSuspiciousDevice } from '../utils/deviceFingerprint';
import { supabase } from '../lib/supabase';

export const useDeviceFingerprint = (user) => {
    const [fingerprint, setFingerprint] = useState(null);
    const [isSuspicious, setIsSuspicious] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initFingerprint = async () => {
            try {
                const fp = await generateAdvancedFingerprint();
                setFingerprint(fp);

                if (fp) {
                    const suspicious = isSuspiciousDevice(fp.details);
                    setIsSuspicious(suspicious);

                    if (user) {
                        // Log device to Supabase
                        await logDevice(user.id, fp, suspicious);
                    }
                }
            } catch (error) {
                console.error('Error initializing device fingerprint:', error);
            } finally {
                setLoading(false);
            }
        };

        initFingerprint();
    }, [user]);

    const logDevice = async (userId, fp, suspicious) => {
        try {
            // Check if device already exists
            const { data: existing } = await supabase
                .from('user_devices')
                .select('id')
                .eq('user_id', userId)
                .eq('device_hash', fp.fingerprintId)
                .single();

            if (!existing) {
                // Add new device
                await supabase.from('user_devices').insert({
                    user_id: userId,
                    device_hash: fp.fingerprintId,
                    device_info: fp.details,
                    is_suspicious: suspicious,
                    last_active: new Date().toISOString()
                });
            } else {
                // Update last active
                await supabase
                    .from('user_devices')
                    .update({ last_active: new Date().toISOString() })
                    .eq('id', existing.id);
            }
        } catch (error) {
            console.error('Error logging device:', error);
        }
    };

    return { fingerprint, isSuspicious, loading };
};
