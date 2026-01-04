import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ImageReviewQueue = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        // Assuming we store image URL or reference in 'content_id' or a separate column. 
        // For this demo, we'll assume we can join or fetch related data.
        // This is a simplified view.
        const { data, error } = await supabase
            .from('blocked_content')
            .select('*')
            .gt('nsfw_score', 0.5)
            .eq('status', 'blocked');

        if (!error) {
            setItems(data);
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Image Review Queue</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {items.map(item => (
                    <div key={item.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem' }}>
                        <div style={{ height: '200px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', position: 'relative' }}>
                            <span style={{ filter: 'blur(10px)', fontSize: '2rem' }}>🖼️</span>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)' }}>
                                <button style={{ background: 'white', border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}>View</button>
                            </div>
                        </div>
                        <div>
                            <strong>Score:</strong> {item.nsfw_score}
                        </div>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                            <button style={{ flex: 1, background: '#00b894', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '4px' }}>Safe</button>
                            <button style={{ flex: 1, background: '#d63031', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '4px' }}>Unsafe</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImageReviewQueue;
