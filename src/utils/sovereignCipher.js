// ═══════════════════════════════════════════════════════════════════════
// 🔐 SOVEREIGN CIPHER - End-to-End Encryption (E2EE) Engine
// AES-GCM 256-bit with Diffie-Hellman Key Exchange
// ═══════════════════════════════════════════════════════════════════════

/**
 * SovereignCipher - Vault-Grade Message Encryption
 * 
 * Implements:
 * - AES-GCM 256-bit for message encryption
 * - ECDH (Elliptic Curve Diffie-Hellman) for key exchange
 * - PBKDF2 for key derivation
 * - Secure random IV generation
 * - Authenticated encryption with associated data (AEAD)
 */

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const AES_KEY_SIZE = 256; // bits
const AES_IV_SIZE = 12;   // bytes (96 bits for GCM)
const AES_TAG_SIZE = 16;  // bytes (128 bits authentication tag)
const ECDH_CURVE = 'P-256'; // NIST curve for key exchange
const PBKDF2_ITERATIONS = 100000;
const SALT_SIZE = 32; // bytes

// ═══════════════════════════════════════════════════════════════════════
// KEY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate a new ECDH key pair for the current user
 * @returns {Promise<CryptoKeyPair>} ECDH key pair
 */
export async function generateIdentityKeyPair() {
    return await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: ECDH_CURVE
        },
        true, // extractable
        ['deriveKey', 'deriveBits']
    );
}

/**
 * Export public key to string format for sharing
 * @param {CryptoKey} publicKey 
 * @returns {Promise<string>} Base64 encoded public key
 */
export async function exportPublicKey(publicKey) {
    const exported = await crypto.subtle.exportKey('raw', publicKey);
    return arrayBufferToBase64(exported);
}

/**
 * Import a peer's public key from string format
 * @param {string} publicKeyBase64 
 * @returns {Promise<CryptoKey>} CryptoKey
 */
export async function importPublicKey(publicKeyBase64) {
    const keyData = base64ToArrayBuffer(publicKeyBase64);
    return await crypto.subtle.importKey(
        'raw',
        keyData,
        {
            name: 'ECDH',
            namedCurve: ECDH_CURVE
        },
        false, // not extractable
        []
    );
}

/**
 * Import private key from stored format
 * @param {string} privateKeyBase64 
 * @returns {Promise<CryptoKey>} CryptoKey
 */
export async function importPrivateKey(privateKeyBase64) {
    const keyData = base64ToArrayBuffer(privateKeyBase64);
    return await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        {
            name: 'ECDH',
            namedCurve: ECDH_CURVE
        },
        true,
        ['deriveKey', 'deriveBits']
    );
}

/**
 * Export private key for secure storage
 * @param {CryptoKey} privateKey 
 * @returns {Promise<string>} Base64 encoded private key
 */
export async function exportPrivateKey(privateKey) {
    const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
    return arrayBufferToBase64(exported);
}

// ═══════════════════════════════════════════════════════════════════════
// KEY DERIVATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Derive a shared secret using ECDH
 * @param {CryptoKey} privateKey - Your private key
 * @param {CryptoKey} publicKey - Peer public key
 * @returns {Promise<ArrayBuffer>} Shared secret
 */
export async function deriveSharedSecret(privateKey, publicKey) {
    return await crypto.subtle.deriveBits(
        {
            name: 'ECDH',
            public: publicKey
        },
        privateKey,
        256 // bits
    );
}

/**
 * Derive an AES-GCM key from shared secret using PBKDF2
 * @param {ArrayBuffer} sharedSecret 
 * @param {Uint8Array} salt 
 * @returns {Promise<CryptoKey>} AES-GCM key
 */
export async function deriveAESKey(sharedSecret, salt) {
    // Import shared secret as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        sharedSecret,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    // Derive AES-GCM key
    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        keyMaterial,
        {
            name: 'AES-GCM',
            length: AES_KEY_SIZE
        },
        false, // not extractable
        ['encrypt', 'decrypt']
    );
}

// ═══════════════════════════════════════════════════════════════════════
// MESSAGE ENCRYPTION / DECRYPTION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Encrypt a message using AES-GCM
 * @param {string} plaintext - Message content
 * @param {CryptoKey} aesKey - AES-GCM key
 * @param {Object} metadata - Additional authenticated data
 * @returns {Promise<EncryptedMessage>} Encrypted message bundle
 */
export async function encryptMessage(plaintext, aesKey, metadata = {}) {
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(AES_IV_SIZE));
    
    // Prepare authenticated data
    const associatedData = metadata.associatedData 
        ? new TextEncoder().encode(JSON.stringify(metadata.associatedData))
        : new Uint8Array(0);

    // Encode plaintext
    const encoded = new TextEncoder().encode(plaintext);

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
            additionalData: associatedData,
            tagLength: AES_TAG_SIZE * 8 // bits
        },
        aesKey,
        encoded
    );

    return {
        ciphertext: arrayBufferToBase64(ciphertext),
        iv: arrayBufferToBase64(iv),
        version: '1.0',
        algorithm: 'AES-GCM-256',
        metadata: metadata
    };
}

/**
 * Decrypt a message using AES-GCM
 * @param {EncryptedMessage} encryptedMessage 
 * @param {CryptoKey} aesKey 
 * @returns {Promise<string>} Decrypted plaintext
 */
export async function decryptMessage(encryptedMessage, aesKey) {
    const ciphertext = base64ToArrayBuffer(encryptedMessage.ciphertext);
    const iv = base64ToArrayBuffer(encryptedMessage.iv);
    
    // Prepare authenticated data if present
    const associatedData = encryptedMessage.metadata?.associatedData 
        ? new TextEncoder().encode(JSON.stringify(encryptedMessage.metadata.associatedData))
        : new Uint8Array(0);

    try {
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
                additionalData: associatedData,
                tagLength: AES_TAG_SIZE * 8
            },
            aesKey,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        throw new Error('Decryption failed: Invalid key or tampered message');
    }
}

// ═══════════════════════════════════════════════════════════════════════
// CONVERSATION KEY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate or retrieve conversation-specific key
 * Each conversation has its own unique key derived from the shared secret
 * @param {string} conversationId 
 * @param {string} myPrivateKeyBase64 
 * @param {string} peerPublicKeyBase64 
 * @returns {Promise<CryptoKey>} AES key for this conversation
 */
export async function getConversationKey(conversationId, myPrivateKeyBase64, peerPublicKeyBase64) {
    // Check if we have a cached key
    const cacheKey = `conv_key_${conversationId}`;
    const cachedKey = sessionStorage.getItem(cacheKey);
    
    if (cachedKey) {
        // Import cached key
        const keyData = base64ToArrayBuffer(cachedKey);
        return await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM', length: AES_KEY_SIZE },
            false,
            ['encrypt', 'decrypt']
        );
    }

    // Derive new key
    const privateKey = await importPrivateKey(myPrivateKeyBase64);
    const publicKey = await importPublicKey(peerPublicKeyBase64);
    
    // Generate shared secret
    const sharedSecret = await deriveSharedSecret(privateKey, publicKey);
    
    // Create unique salt from conversation ID
    const salt = await createConversationSalt(conversationId);
    
    // Derive AES key
    const aesKey = await deriveAESKey(sharedSecret, salt);
    
    // Cache the key (export raw key for storage)
    const exportedKey = await crypto.subtle.exportKey('raw', aesKey);
    sessionStorage.setItem(cacheKey, arrayBufferToBase64(exportedKey));
    
    // Re-import as non-extractable for security
    return await crypto.subtle.importKey(
        'raw',
        exportedKey,
        { name: 'AES-GCM', length: AES_KEY_SIZE },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Create a deterministic salt from conversation ID
 * This ensures both parties derive the same key
 * @param {string} conversationId 
 * @returns {Promise<Uint8Array>} Salt
 */
async function createConversationSalt(conversationId) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`sovereign:${conversationId}:salt`);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hash);
}

// ═══════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Generate a random encryption key for group conversations
 * This key will be encrypted for each participant separately
 * @returns {Promise<CryptoKey>} AES key
 */
export async function generateGroupKey() {
    return await crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: AES_KEY_SIZE
        },
        true, // extractable (needed for sharing with group members)
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt a group key for a specific recipient
 * @param {CryptoKey} groupKey 
 * @param {string} recipientPublicKeyBase64 
 * @param {string} senderPrivateKeyBase64 
 * @returns {Promise<string>} Encrypted key (base64)
 */
export async function encryptGroupKeyForRecipient(groupKey, recipientPublicKeyBase64, senderPrivateKeyBase64) {
    const exportedKey = await crypto.subtle.exportKey('raw', groupKey);
    
    const privateKey = await importPrivateKey(senderPrivateKeyBase64);
    const publicKey = await importPublicKey(recipientPublicKeyBase64);
    
    const sharedSecret = await deriveSharedSecret(privateKey, publicKey);
    const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE));
    const aesKey = await deriveAESKey(sharedSecret, salt);
    
    const iv = crypto.getRandomValues(new Uint8Array(AES_IV_SIZE));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv, tagLength: AES_TAG_SIZE * 8 },
        aesKey,
        exportedKey
    );
    
    // Combine salt + iv + ciphertext
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    return arrayBufferToBase64(result);
}

/**
 * Decrypt a group key received from the sender
 * @param {string} encryptedKeyBase64 
 * @param {string} senderPublicKeyBase64 
 * @param {string} recipientPrivateKeyBase64 
 * @returns {Promise<CryptoKey>} Group AES key
 */
export async function decryptGroupKey(encryptedKeyBase64, senderPublicKeyBase64, recipientPrivateKeyBase64) {
    const data = base64ToArrayBuffer(encryptedKeyBase64);
    const dataArray = new Uint8Array(data);
    
    const salt = dataArray.slice(0, SALT_SIZE);
    const iv = dataArray.slice(SALT_SIZE, SALT_SIZE + AES_IV_SIZE);
    const ciphertext = dataArray.slice(SALT_SIZE + AES_IV_SIZE);
    
    const privateKey = await importPrivateKey(recipientPrivateKeyBase64);
    const publicKey = await importPublicKey(senderPublicKeyBase64);
    
    const sharedSecret = await deriveSharedSecret(privateKey, publicKey);
    const aesKey = await deriveAESKey(sharedSecret, salt);
    
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv, tagLength: AES_TAG_SIZE * 8 },
        aesKey,
        ciphertext
    );
    
    return await crypto.subtle.importKey(
        'raw',
        decrypted,
        { name: 'AES-GCM', length: AES_KEY_SIZE },
        false,
        ['encrypt', 'decrypt']
    );
}

// ═══════════════════════════════════════════════════════════════════════
// OFFLINE QUEUE ENCRYPTION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Encrypt a message for offline storage
 * Uses a key derived from the user's password/session
 * @param {string} plaintext 
 * @param {string} sessionToken 
 * @returns {Promise<Object>} Encrypted bundle
 */
export async function encryptOfflineMessage(plaintext, sessionToken) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(sessionToken));
    
    const key = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM', length: AES_KEY_SIZE },
        false,
        ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(AES_IV_SIZE));
    const encoded = encoder.encode(plaintext);
    
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv, tagLength: AES_TAG_SIZE * 8 },
        key,
        encoded
    );
    
    return {
        ciphertext: arrayBufferToBase64(ciphertext),
        iv: arrayBufferToBase64(iv),
        timestamp: Date.now()
    };
}

/**
 * Decrypt an offline stored message
 * @param {Object} encryptedBundle 
 * @param {string} sessionToken 
 * @returns {Promise<string>} Decrypted plaintext
 */
export async function decryptOfflineMessage(encryptedBundle, sessionToken) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(sessionToken));
    
    const key = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM', length: AES_KEY_SIZE },
        false,
        ['decrypt']
    );
    
    const ciphertext = base64ToArrayBuffer(encryptedBundle.ciphertext);
    const iv = base64ToArrayBuffer(encryptedBundle.iv);
    
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv, tagLength: AES_TAG_SIZE * 8 },
        key,
        ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════

export default {
    generateIdentityKeyPair,
    exportPublicKey,
    exportPrivateKey,
    importPublicKey,
    importPrivateKey,
    deriveSharedSecret,
    deriveAESKey,
    encryptMessage,
    decryptMessage,
    getConversationKey,
    generateGroupKey,
    encryptGroupKeyForRecipient,
    decryptGroupKey,
    encryptOfflineMessage,
    decryptOfflineMessage
};
