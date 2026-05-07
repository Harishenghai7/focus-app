// ═══════════════════════════════════════════════════════════════════════
// 🔐 useMessageEncryption - E2EE Hook for Messages
// Sovereign Whisper Integration
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import sovereignCipher from '../utils/sovereignCipher';

/**
 * Hook for managing message encryption and decryption
 * Implements the Sovereign Whisper E2EE protocol
 */
export function useMessageEncryption(conversationId, currentUserId, otherUserId) {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);
    const [myKeyPair, setMyKeyPair] = useState(null);
    const [peerPublicKey, setPeerPublicKey] = useState(null);
    const conversationKeyRef = useRef(null);

    // Initialize encryption keys on mount
    useEffect(() => {
        if (!currentUserId || !conversationId) return;
        
        const initEncryption = async () => {
            try {
                setError(null);
                
                // Check if we have stored keys
                const storedPrivateKey = localStorage.getItem(`private_key_${currentUserId}`);
                const storedPublicKey = localStorage.getItem(`public_key_${currentUserId}`);
                
                let keyPair;
                
                if (storedPrivateKey && storedPublicKey) {
                    // Import existing keys
                    const privateKey = await sovereignCipher.importPrivateKey(storedPrivateKey);
                    const publicKey = await sovereignCipher.importPublicKey(storedPublicKey);
                    keyPair = { privateKey, publicKey, publicKeyBase64: storedPublicKey };
                } else {
                    // Generate new key pair
                    keyPair = await sovereignCipher.generateIdentityKeyPair();
                    const privateKeyBase64 = await sovereignCipher.exportPrivateKey(keyPair.privateKey);
                    const publicKeyBase64 = await sovereignCipher.exportPublicKey(keyPair.publicKey);
                    
                    // Store keys
                    localStorage.setItem(`private_key_${currentUserId}`, privateKeyBase64);
                    localStorage.setItem(`public_key_${currentUserId}`, publicKeyBase64);
                    
                    // Register public key with server
                    await registerPublicKey(publicKeyBase64);
                    
                    keyPair.publicKeyBase64 = publicKeyBase64;
                }
                
                setMyKeyPair(keyPair);
                setIsReady(true);
            } catch (err) {
                console.error('Failed to initialize encryption:', err);
                setError(err.message);
            }
        };

        initEncryption();
    }, [currentUserId, conversationId]);

    // Fetch peer's public key when otherUserId changes
    useEffect(() => {
        if (!otherUserId || !isReady) return;
        
        const fetchPeerKey = async () => {
            try {
                const { data, error } = await supabase
                    .rpc('get_user_public_key', { p_user_id: otherUserId });
                
                if (error) throw error;
                
                if (data && data.length > 0) {
                    setPeerPublicKey(data[0].public_key);
                } else {
                    console.warn('Peer has not set up encryption yet');
                    setPeerPublicKey(null);
                }
            } catch (err) {
                console.error('Failed to fetch peer public key:', err);
            }
        };

        fetchPeerKey();
    }, [otherUserId, isReady]);

    // Register public key with Supabase
    const registerPublicKey = async (publicKeyBase64) => {
        const { error } = await supabase
            .rpc('register_encryption_key', {
                p_public_key: publicKeyBase64,
                p_key_version: '1.0',
                p_algorithm: 'ECDH-P256'
            });
        
        if (error) throw error;
    };

    // Get or derive conversation key
    const getConversationKey = useCallback(async () => {
        if (!myKeyPair || !peerPublicKey) {
            throw new Error('Encryption keys not ready');
        }

        if (conversationKeyRef.current) {
            return conversationKeyRef.current;
        }

        const storedPrivateKey = localStorage.getItem(`private_key_${currentUserId}`);
        const key = await sovereignCipher.getConversationKey(
            conversationId,
            storedPrivateKey,
            peerPublicKey
        );

        conversationKeyRef.current = key;
        return key;
    }, [conversationId, currentUserId, myKeyPair, peerPublicKey]);

    /**
     * Encrypt a message before sending
     * @param {string} content - Plaintext message
     * @returns {Promise<Object>} Encrypted message bundle
     */
    const encryptMessage = useCallback(async (content) => {
        if (!peerPublicKey) {
            // Peer hasn't set up encryption, send unencrypted
            return {
                encrypted: false,
                content: content
            };
        }

        try {
            const aesKey = await getConversationKey();
            
            const encrypted = await sovereignCipher.encryptMessage(content, aesKey, {
                associatedData: {
                    conversationId,
                    timestamp: Date.now()
                }
            });

            return {
                encrypted: true,
                ciphertext: encrypted.ciphertext,
                iv: encrypted.iv,
                version: encrypted.version,
                algorithm: encrypted.algorithm
            };
        } catch (err) {
            console.error('Encryption failed:', err);
            // Fallback to unencrypted if encryption fails
            return {
                encrypted: false,
                content: content
            };
        }
    }, [conversationId, getConversationKey, peerPublicKey]);

    /**
     * Decrypt a received message
     * @param {Object} message - Message with encryption fields
     * @returns {Promise<string>} Decrypted plaintext
     */
    const decryptMessage = useCallback(async (message) => {
        // Check if message is encrypted
        if (!message.is_encrypted && !message.ciphertext) {
            return message.content;
        }

        try {
            const aesKey = await getConversationKey();
            
            const encryptedBundle = {
                ciphertext: message.ciphertext,
                iv: message.initialization_vector,
                version: message.encryption_version,
                metadata: {
                    associatedData: {
                        conversationId,
                        timestamp: new Date(message.created_at).getTime()
                    }
                }
            };

            const plaintext = await sovereignCipher.decryptMessage(encryptedBundle, aesKey);
            return plaintext;
        } catch (err) {
            console.error('Decryption failed:', err);
            // Return placeholder if decryption fails
            return '🔒 Unable to decrypt message';
        }
    }, [conversationId, getConversationKey]);

    /**
     * Batch decrypt multiple messages
     * @param {Array} messages - Array of encrypted messages
     * @returns {Promise<Array>} Decrypted messages
     */
    const decryptMessages = useCallback(async (messages) => {
        if (!messages || messages.length === 0) return [];
        
        const decryptedMessages = await Promise.all(
            messages.map(async (msg) => {
                if (msg.is_encrypted || msg.ciphertext) {
                    const content = await decryptMessage(msg);
                    return { ...msg, content, decrypted: true };
                }
                return msg;
            })
        );
        
        return decryptedMessages;
    }, [decryptMessage]);

    return {
        isReady,
        error,
        myKeyPair,
        peerPublicKey,
        encryptionEnabled: !!peerPublicKey,
        encryptMessage,
        decryptMessage,
        decryptMessages
    };
}

/**
 * Hook for managing user's encryption keys
 */
export function useEncryptionKeys(userId) {
    const [hasKeys, setHasKeys] = useState(false);
    const [publicKey, setPublicKey] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const checkKeys = async () => {
            setLoading(true);
            
            // Check local storage
            const storedPrivateKey = localStorage.getItem(`private_key_${userId}`);
            const storedPublicKey = localStorage.getItem(`public_key_${userId}`);
            
            if (storedPrivateKey && storedPublicKey) {
                setHasKeys(true);
                setPublicKey(storedPublicKey);
            } else {
                setHasKeys(false);
                setPublicKey(null);
            }
            
            setLoading(false);
        };

        checkKeys();
    }, [userId]);

    const generateKeys = async () => {
        if (!userId) return;

        try {
            const keyPair = await sovereignCipher.generateIdentityKeyPair();
            const privateKeyBase64 = await sovereignCipher.exportPrivateKey(keyPair.privateKey);
            const publicKeyBase64 = await sovereignCipher.exportPublicKey(keyPair.publicKey);

            // Store in localStorage
            localStorage.setItem(`private_key_${userId}`, privateKeyBase64);
            localStorage.setItem(`public_key_${userId}`, publicKeyBase64);

            // Register with Supabase
            await supabase.rpc('register_encryption_key', {
                p_public_key: publicKeyBase64,
                p_key_version: '1.0',
                p_algorithm: 'ECDH-P256'
            });

            setHasKeys(true);
            setPublicKey(publicKeyBase64);

            return { privateKey: privateKeyBase64, publicKey: publicKeyBase64 };
        } catch (err) {
            console.error('Failed to generate keys:', err);
            throw err;
        }
    };

    return {
        hasKeys,
        publicKey,
        loading,
        generateKeys
    };
}

export default useMessageEncryption;
