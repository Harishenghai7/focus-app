import { useState } from 'react';
import { supabase, supabaseAnonKey } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useFreeModeration } from './useFreeModeration';
import { playPublish } from '../utils/audioFX';
import { runPreUploadSafetyCheck } from '../utils/uploadSafetyMiddleware';

export const usePublish = () => {
    const { user } = useAuth();
    const { moderate } = useFreeModeration(); // 🛡️ 100% FREE - Zero API costs
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const publish = async (mediaFiles, details, music, createMode = 'post') => {
        console.log('🚀 PUBLISH START', { mediaFiles, details, music, createMode });
        setLoading(true);
        setError(null);

        try {
            if (!user) throw new Error('You must be logged in to publish.');
            console.log('✅ User authenticated:', user.id);

            const moderationResult = await runPreUploadSafetyCheck({
                userId: user.id,
                caption: details?.caption || '',
                mediaFiles,
            });

            if (moderationResult.blocked) {
                throw new Error(moderationResult.reason || 'Upload blocked by Focus Content Filter');
            }

            const uploadedMedia = [];

            // 1. Upload Media using REST API (bypassing SDK)
            console.log('📤 Starting media upload via REST API...');
            for (const item of mediaFiles) {
                let fileToUpload = item.file;

                // Compress images before upload
                if (item.type === 'image') {
                    try {
                        console.log('🗜️ Compressing image...');
                        const imageCompression = (await import('browser-image-compression')).default;

                        const options = {
                            maxSizeMB: 2,
                            maxWidthOrHeight: 1920,
                            useWebWorker: true,
                            fileType: 'image/jpeg'
                        };

                        fileToUpload = await imageCompression(item.file, options);
                        console.log('✅ Image compressed:', {
                            originalSize: (item.file.size / 1024 / 1024).toFixed(2) + 'MB',
                            compressedSize: (fileToUpload.size / 1024 / 1024).toFixed(2) + 'MB'
                        });
                    } catch (compressionError) {
                        console.warn('⚠️ Image compression failed, using original:', compressionError);
                        fileToUpload = item.file;
                    }
                }

                const fileExt = fileToUpload.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;
                const bucket = 'posts';

                console.log('📁 Uploading to bucket:', bucket, 'path:', filePath);

                try {
                    // Get fresh JWT token with timeout to prevent hanging
                    let userToken = null;

                    try {
                        const sessionPromise = supabase.auth.getSession();
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Session timeout')), 5000)
                        );

                        const { data: { session }, error: sessionError } = await Promise.race([
                            sessionPromise,
                            timeoutPromise
                        ]);

                        if (!sessionError && session) {
                            userToken = session.access_token;
                        }
                    } catch (sessionErr) {
                        console.warn('⚠️ Session fetch failed, using anon key:', sessionErr.message);
                    }

                    // Fallback to anon key if session failed
                    if (!userToken) {
                        console.log('🔑 Using anon key for upload');
                        userToken = supabaseAnonKey;
                    }

                    if (!userToken || !supabaseAnonKey) {
                        throw new Error('Authentication required');
                    }

                    // Upload using REST API directly
                    const uploadUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`;

                    console.log('🌐 Uploading to:', uploadUrl);

                    const uploadResponse = await fetch(uploadUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${userToken}`,
                            'apikey': supabaseAnonKey,
                        },
                        body: fileToUpload
                    });

                    console.log('📡 Response status:', uploadResponse.status);

                    if (!uploadResponse.ok) {
                        const errorText = await uploadResponse.text();
                        console.error('❌ Upload failed:', errorText);
                        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
                    }

                    const uploadData = await uploadResponse.json();
                    console.log('✅ Upload successful:', uploadData);

                    // Construct public URL
                    const publicUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
                    console.log('✅ Public URL:', publicUrl);

                    uploadedMedia.push({
                        url: publicUrl,
                        type: item.type,
                        edits: item.edits
                    });
                } catch (uploadError) {
                    console.error('❌ Upload error:', uploadError);
                    throw uploadError;
                }
            }


            const uploadDataUrlToStorage = async (dataUrl, folder = 'thumbs') => {
                if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return null;
                const [meta, b64] = dataUrl.split(',');
                const mime = (meta.match(/data:(.*?);base64/) || [])[1] || 'image/jpeg';
                const ext = mime.split('/')[1] || 'jpg';
                const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
                const filePath = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                const uploadUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/posts/${filePath}`;
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token || supabaseAnonKey;
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        apikey: supabaseAnonKey,
                        'Content-Type': mime,
                    },
                    body: bytes,
                });
                if (!response.ok) return null;
                return `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/posts/${filePath}`;
            };

            // 2. Insert Record using REST API (bypassing SDK)
            console.log('💾 Inserting post record via REST API...');

            // Get fresh session token with timeout
            let userToken = null;

            try {
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Session timeout')), 5000)
                );

                const { data: { session }, error: sessionError } = await Promise.race([
                    sessionPromise,
                    timeoutPromise
                ]);

                if (!sessionError && session) {
                    userToken = session.access_token;
                }
            } catch (sessionErr) {
                console.warn('⚠️ Session fetch failed, using anon key:', sessionErr.message);
            }

            // Fallback to anon key if session failed
            if (!userToken) {
                console.log('🔑 Using anon key for insert');
                userToken = supabaseAnonKey;
            }

            let tableName = 'posts';
            // ╔══════════════════════════════════════════════════════════════════╗
            // ║ 🛡️  PILLAR 2 + PILLAR 3 — AI Moderation + Teen Lock          ║
            // ║                                                                  ║
            // ║ AFTER upload, BEFORE insert: run the Gemini-powered content-   ║
            // ║ moderator edge function. Merge its verdict directly into the    ║
            // ║ row being inserted. Shadow-moderation happens at the DB layer   ║
            // ║ via moderation_status — no branching in UI, no blurs, no       ║
            // ║ censors. The post INSERTs fine; only the author will see it    ║
            // ║ if the verdict is 'restricted'.                                 ║
            // ║                                                                  ║
            // ║ Teens (guardian_consent_status != 'active') get an additional   ║
            // ║ hard-lock: their content is forced to 'restricted' regardless   ║
            // ║ of the AI verdict, until the guardian handshake confirms.      ║
            // ╚══════════════════════════════════════════════════════════════════╝
            let moderationDb = {
                moderation_status: 'approved',
                moderation_reason: null,
                moderation_score: null,
                moderation_categories: [],
                moderated_at: new Date().toISOString(),
                moderator_type: 'auto',
            };
            try {
                const imageUrls = uploadedMedia
                    .filter(m => m.type === 'image')
                    .map(m => m.url);
                const verdict = await moderate({
                    text: details?.caption || '',
                    imageUrls,
                });
                if (verdict?.dbColumns) moderationDb = verdict.dbColumns;
                console.log('🛡️ Moderation verdict:', verdict?.moderationStatus, verdict?.toxicityType);

                // Pillar 3 — Teen auto-restriction until guardian consent is active
                try {
                    const { data: prof } = await supabase
                        .from('profiles')
                        .select('can_post, guardian_consent_status, is_teen_mode')
                        .eq('id', user.id)
                        .maybeSingle();
                    const teenNeedsLock =
                        prof?.is_teen_mode === true &&
                        prof?.guardian_consent_status !== 'active';
                    const postingBlocked = prof?.can_post === false;
                    if (teenNeedsLock || postingBlocked) {
                        moderationDb = {
                            ...moderationDb,
                            moderation_status: 'restricted',
                            moderation_reason:
                                'Teen account — content is pending guardian consent.',
                            moderator_type: 'auto',
                        };
                        console.log('🛡️ Teen lock applied — content restricted until guardian handshake.');
                    }
                } catch (profErr) {
                    console.warn('[publish] profile lookup for teen lock failed:', profErr);
                }
            } catch (modErr) {
                // Fail CLOSED per Pillar 2 — never silently approve
                console.error('[publish] Gemini moderation call failed:', modErr);
                moderationDb = {
                    ...moderationDb,
                    moderation_status: 'flagged',
                    moderation_reason: 'Moderation service unavailable — queued for human review.',
                };
            }

            let postData = {
                user_id: user.id,
                caption: details.caption,
                location: details.location,
                media_url: uploadedMedia[0].url,
                thumbnail_url: uploadedMedia[0].type === 'video' ? uploadedMedia[0].url : null,
                type: uploadedMedia[0].type === 'video' ? 'video' : 'image',
                ...moderationDb,
            };

            if (createMode === 'boltz') {
                const selectedThumb =
                    details?.thumbnail ||
                    details?.thumbnailDataUrl ||
                    mediaFiles?.[0]?.thumbnail ||
                    null;
                const uploadedThumb = await uploadDataUrlToStorage(selectedThumb, 'boltz-thumbs');
                tableName = 'boltz';
                postData = {
                    user_id: user.id,
                    description: details.caption,
                    video_url: uploadedMedia[0].url,
                    thumbnail_url: uploadedThumb,
                    poster_url: uploadedThumb,
                    music_url: music?.audio || null,
                    duration: uploadedMedia[0].duration || null,
                    ...moderationDb,
                };
            } else if (createMode === 'flash') {
                tableName = 'stories';
                postData = {
                    user_id: user.id,
                    media_url: uploadedMedia[0].url,
                    media_type: uploadedMedia[0].type === 'video' ? 'video' : 'image',
                    duration: 15,
                    ...moderationDb,
                };
            }

            const insertUrl = `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/${tableName}?select=*`;
            console.log('🌐 Inserting to:', insertUrl);

            const insertResponse = await fetch(insertUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(postData)
            });

            console.log('📡 Insert response status:', insertResponse.status);

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                console.error('❌ Insert failed:', errorText);
                throw new Error(`Insert failed: ${insertResponse.status} - ${errorText}`);
            }

            const insertedData = await insertResponse.json();
            const resultData = Array.isArray(insertedData) ? insertedData[0] : insertedData;
            console.log('✅ Post created:', resultData);

            // Success!
            console.log('🎉 PUBLISH SUCCESS!');
            const { focusToast } = require('../utils/focusToast');
            const kind = createMode === 'boltz' ? 'Boltz' : (createMode === 'flash' ? 'Flash' : 'Post');
            if (moderationDb.moderation_status === 'restricted') {
                // Spec: "Toxic users remain in an echo chamber." Be honest with the author.
                focusToast.info(
                    `${kind} published — visible only to you. ${moderationDb.moderation_reason || 'Violates Focus Constitution.'}`,
                    { duration: 6000 }
                );
            } else if (moderationDb.moderation_status === 'flagged') {
                focusToast.info(`${kind} pending review. We'll notify you once it's approved.`);
            } else {
                focusToast.success(`${kind} published successfully!`);
            }
            playPublish();

            return true;
        } catch (err) {
            console.error('❌ PUBLISH ERROR:', err);
            setError(err.message || 'Failed to publish.');
            const { focusToast } = require('../utils/focusToast');
            focusToast.error(err.message || 'Failed to publish.');
            return false;
        } finally {
            console.log('🏁 PUBLISH END');
            setLoading(false);
        }
    };

    return { publish, loading, error };
};
