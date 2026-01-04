import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import BlockedContentBadge from '../../components/moderation/BlockedContentBadge';

const AutoFlaggedContent = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('blocked_content')
            .select('*, users(username, full_name)')
            .eq('status', 'blocked')
            .order('created_at', { ascending: false });

        if (!error) {
            setItems(data);
        }
        setLoading(false);
    };

    const handleAction = async (id, action) => {
        // action: 'approve', 'reject'
        const status = action === 'approve' ? 'approved' : 'rejected';

        await supabase
            .from('blocked_content')
            .update({ status, admin_action: action })
            .eq('id', id);

        fetchItems();
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Auto-Flagged Content</h1>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '1rem' }}>User</th>
                            <th style={{ padding: '1rem' }}>Type</th>
                            <th style={{ padding: '1rem' }}>Reason</th>
                            <th style={{ padding: '1rem' }}>Scores</th>
                            <th style={{ padding: '1rem' }}>Date</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>
                                    {item.users?.username || 'Unknown'}
                                </td>
                                <td style={{ padding: '1rem' }}>{item.type}</td>
                                <td style={{ padding: '1rem' }}>
                                    <BlockedContentBadge reason={item.reason} />
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div>Toxic: {item.toxic_score || 0}</div>
                                    <div>NSFW: {item.nsfw_score || 0}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleAction(item.id, 'approve')}
                                        style={{ background: '#00b894', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(item.id, 'reject')}
                                        style={{ background: '#d63031', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Ban
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AutoFlaggedContent;
