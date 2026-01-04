import { useState } from 'react';
import { signInWithOAuth } from '../utils/supabaseAuth';

const useOAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleOAuthLogin = async (provider) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await signInWithOAuth(provider);
            if (error) throw error;
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { handleOAuthLogin, loading, error };
};

export default useOAuth;
