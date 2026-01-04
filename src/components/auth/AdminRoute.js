import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const AdminRoute = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdmin = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            // Check metadata first (fastest)
            if (user.user_metadata?.role === 'admin') {
                setIsAdmin(true);
                setLoading(false);
                return;
            }

            // Check profiles table
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (data && data.role === 'admin') {
                    setIsAdmin(true);
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
            }

            setLoading(false);
        };

        if (!authLoading) {
            checkAdmin();
        }
    }, [user, authLoading]);

    if (authLoading || loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                Loading...
            </div>
        );
    }

    if (!user || !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;
