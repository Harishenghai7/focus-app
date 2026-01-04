import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FaDesktop, FaMobileAlt, FaTrash } from 'react-icons/fa';
import styles from './DeviceList.module.css';

const DeviceList = ({ userId }) => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchDevices();
        }
    }, [userId]);

    const fetchDevices = async () => {
        try {
            const { data, error } = await supabase
                .from('user_devices')
                .select('*')
                .eq('user_id', userId)
                .order('last_active', { ascending: false });

            if (data) setDevices(data);
        } catch (error) {
            console.error('Error fetching devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeDevice = async (deviceId) => {
        try {
            await supabase.from('user_devices').delete().eq('id', deviceId);
            setDevices(prev => prev.filter(d => d.id !== deviceId));
        } catch (error) {
            console.error('Error removing device:', error);
        }
    };

    if (loading) return <div>Loading devices...</div>;

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Active Devices</h3>
            <div className={styles.list}>
                {devices.map(device => {
                    const isMobile = device.device_info?.userAgent?.toLowerCase().includes('mobile');
                    return (
                        <div key={device.id} className={styles.item}>
                            <div className={styles.iconWrapper}>
                                {isMobile ? <FaMobileAlt size={20} /> : <FaDesktop size={20} />}
                            </div>
                            <div className={styles.info}>
                                <div className={styles.deviceName}>
                                    {device.device_info?.platform || 'Unknown Device'}
                                    {device.is_suspicious && <span className={styles.suspiciousBadge}>Suspicious</span>}
                                </div>
                                <div className={styles.lastActive}>
                                    Last active: {new Date(device.last_active).toLocaleDateString()}
                                </div>
                            </div>
                            <button
                                onClick={() => removeDevice(device.id)}
                                className={styles.deleteButton}
                                title="Remove Device"
                            >
                                <FaTrash size={14} />
                            </button>
                        </div>
                    );
                })}
                {devices.length === 0 && <p className={styles.empty}>No devices found.</p>}
            </div>
        </div>
    );
};

export default DeviceList;
