import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const useSuggestedUsers = (interests) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                // In a real app, this would be a complex query filtering by interests.
                // For now, we'll fetch random profiles as a mockup of "suggestions".
                // Ideally: select * from profiles where id != current_user limit 10

                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url, bio, is_verified')
                    .limit(10);

                if (error) throw error;
                setUsers(data || []);
            } catch (error) {
                console.error('Error fetching suggested users:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [interests]);

    return { users, loading };
};

export default useSuggestedUsers;
