import { useState } from 'react';
import { supabase, supabaseAnonKey } from '../lib/supabase';
import { useAuth } from './useAuth';

export const usePublish = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const publish = async (mediaFiles, details, music, createMode = 'post') => {
        console.log('🚀 PUBLISH START', { mediaFiles, details, music, createMode });
        setLoading(true);
        setError(null);

        try {
            if (!user) throw new Error('You must be logged in to publish.');
            console.log('✅ User authenticated:', user.id);

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
            let postData = {
                user_id: user.id,
                caption: details.caption,
                location: details.location,
                media_url: uploadedMedia[0].url,
                thumbnail_url: uploadedMedia[0].type === 'video' ? uploadedMedia[0].url : null,
                type: uploadedMedia[0].type === 'video' ? 'video' : 'image'
            };

            if (createMode === 'boltz') {
                tableName = 'boltz';
                postData = {
                    user_id: user.id,
                    description: details.caption,
                    video_url: uploadedMedia[0].url,
                    thumbnail_url: uploadedMedia[0].url,
                    music_url: music?.audio || null,
                    duration: uploadedMedia[0].duration || null
                };
            } else if (createMode === 'flash') {
                tableName = 'stories';
                postData = {
                    user_id: user.id,
                    media_url: uploadedMedia[0].url,
                    media_type: uploadedMedia[0].type === 'video' ? 'video' : 'image',
                    duration: 15
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
            focusToast.success(`${createMode === 'boltz' ? 'Boltz' : (createMode === 'flash' ? 'Flash' : 'Post')} published successfully!`);

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
