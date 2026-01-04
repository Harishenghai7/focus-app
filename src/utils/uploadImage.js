import { supabase } from '../lib/supabase';

/**
 * Uploads an image file to the 'avatars' bucket in Supabase.
 * @param {File} file - The file object to upload.
 * @param {string} userId - The user's ID to use in the filename.
 * @returns {Promise<string>} - The public URL of the uploaded image.
 */
export const uploadImage = async (file, userId) => {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};
