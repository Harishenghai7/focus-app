/**
 * Debug Page for TeenCare System
 * Use this to check what data is being returned
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGuardianship } from '../hooks/useGuardianship';
import { useSafetyAlerts } from '../hooks/useSafetyAlerts';
import { supabase } from '../lib/supabase';

const TeenCareDebug = () => {
    const { user } = useAuth();
    const { teens, guardians, loading, error } = useGuardianship();
    const { alerts } = useSafetyAlerts();
    const [rawData, setRawData] = useState(null);

    useEffect(() => {
        const fetchRawData = async () => {
            if (!user) return;

            try {
                // Fetch raw guardian relationships
                const { data, error } = await supabase
                    .from('guardian_relationships')
                    .select('*')
                    .eq('parent_id', user.id);

                setRawData(data);
                console.log('Raw guardian_relationships data:', data);
            } catch (err) {
                console.error('Error fetching raw data:', err);
            }
        };

        fetchRawData();
    }, [user]);

    if (!user) {
        return <div style={styles.container}>
            <h1>🔐 Not Authenticated</h1>
            <p>Please log in to view debug info</p>
        </div>;
    }

    return (
        <div style={styles.container}>
            <h1>🔍 TeenCare Debug Dashboard</h1>

            <section style={styles.section}>
                <h2>👤 Current User</h2>
                <pre style={styles.pre}>{JSON.stringify(user, null, 2)}</pre>
            </section>

            <section style={styles.section}>
                <h2>👨‍👩‍👧 Guardianship Hook Status</h2>
                <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                <p><strong>Error:</strong> {error || 'None'}</p>
                <p><strong>Teens Count:</strong> {teens?.length || 0}</p>
                <p><strong>Guardians Count:</strong> {guardians?.length || 0}</p>

                <h3>Teens Data:</h3>
                <pre style={styles.pre}>{JSON.stringify(teens, null, 2)}</pre>

                <h3>Guardians Data:</h3>
                <pre style={styles.pre}>{JSON.stringify(guardians, null, 2)}</pre>
            </section>

            <section style={styles.section}>
                <h2>🚨 Safety Alerts</h2>
                <p><strong>Alerts Count:</strong> {alerts?.length || 0}</p>
                <pre style={styles.pre}>{JSON.stringify(alerts, null, 2)}</pre>
            </section>

            <section style={styles.section}>
                <h2>📊 Raw Database Query</h2>
                <p>Direct query to guardian_relationships table:</p>
                <pre style={styles.pre}>{JSON.stringify(rawData, null, 2)}</pre>
            </section>

            <section style={styles.section}>
                <h2>✅ What to Check</h2>
                <ul style={styles.list}>
                    <li>Is the user ID correct?</li>
                    <li>Are there any guardian_relationships in the database?</li>
                    <li>Do the teens have proper data structure?</li>
                    <li>Are there any errors showing?</li>
                    <li>Check browser console for additional logs</li>
                </ul>
            </section>
        </div>
    );
};

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'monospace'
    },
    section: {
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        border: '1px solid #ddd'
    },
    pre: {
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        padding: '1rem',
        borderRadius: '4px',
        overflow: 'auto',
        maxHeight: '400px',
        fontSize: '12px'
    },
    list: {
        lineHeight: '1.8'
    }
};

export default TeenCareDebug;
