import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ModerationLogs = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            const { data } = await supabase
                .from('blocked_content')
                .select('*')
                .not('admin_action', 'is', null)
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) setLogs(data);
        };
        fetchLogs();
    }, []);

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Moderation Audit Log</h1>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {logs.map(log => (
                    <li key={log.id} style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                        <strong>{new Date(log.created_at).toLocaleString()}</strong>:
                        Admin action <strong>{log.admin_action}</strong> on content type <em>{log.type}</em>.
                        Reason: {log.reason}.
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ModerationLogs;
