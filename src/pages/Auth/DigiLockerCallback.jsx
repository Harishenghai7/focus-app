import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * DigiLocker OAuth Callback Handler
 * Redirects back to GovernmentIDVerification with authorization code
 */
const DigiLockerCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // The actual processing is handled in GovernmentIDVerification component
        // This component just redirects back with the code in URL
        const searchParams = window.location.search;
        navigate(`/verification/government-id${searchParams}`);
    }, [navigate]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '20px'
        }}>
            <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ color: '#666', fontSize: '16px' }}>
                Processing DigiLocker verification...
            </p>
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default DigiLockerCallback;
