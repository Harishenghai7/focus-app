import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FaGoogle, FaMicrosoft, FaGithub, FaDiscord, FaTwitter } from 'react-icons/fa';

const OAuthLinker = ({ linkedProviders = [] }) => {
    const [loading, setLoading] = useState(false);

    const providers = [
        { id: 'google', name: 'Google', icon: FaGoogle, color: '#DB4437' },
        { id: 'azure', name: 'Microsoft', icon: FaMicrosoft, color: '#00A4EF' },
        { id: 'github', name: 'GitHub', icon: FaGithub, color: '#333' },
        { id: 'discord', name: 'Discord', icon: FaDiscord, color: '#7289DA' },
        { id: 'twitter', name: 'Twitter', icon: FaTwitter, color: '#1DA1F2' },
    ];

    const handleLink = async (provider) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: window.location.origin + '/security',
                    scopes: 'email'
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error linking account:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>Link Accounts</h3>
            <p style={styles.subtitle}>Link verified accounts to boost your Trust Score.</p>

            <div style={styles.grid}>
                {providers.map(p => {
                    const isLinked = linkedProviders.includes(p.id);
                    return (
                        <button
                            key={p.id}
                            onClick={() => !isLinked && handleLink(p.id)}
                            disabled={isLinked || loading}
                            style={{
                                ...styles.button,
                                borderColor: isLinked ? '#22c55e' : '#e2e8f0',
                                opacity: isLinked ? 0.8 : 1
                            }}
                        >
                            <p.icon size={20} color={p.color} />
                            <span style={styles.buttonText}>
                                {isLinked ? `Linked ${p.name}` : `Link ${p.name}`}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
    },
    title: {
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '8px'
    },
    subtitle: {
        color: '#64748b',
        fontSize: '14px',
        marginBottom: '20px'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px'
    },
    button: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: '14px',
        fontWeight: '500',
        color: '#1e293b'
    },
    buttonText: {
        flex: 1,
        textAlign: 'left'
    }
};

export default OAuthLinker;
