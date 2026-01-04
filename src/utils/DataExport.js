/**
 * DataExport Utility
 * GDPR-compliant data export for users
 */

import { supabase } from '../lib/supabase';

class DataExport {
    /**
     * Export all user data
     * @param {string} userId - User ID
     * @returns {Object} - Exported data
     */
    async exportAllData(userId) {
        const data = {
            exportedAt: new Date().toISOString(),
            userId,
            profile: await this.exportProfile(userId),
            posts: await this.exportPosts(userId),
            comments: await this.exportComments(userId),
            messages: await this.exportMessages(userId),
            likes: await this.exportLikes(userId),
            saves: await this.exportSaves(userId),
            followers: await this.exportFollowers(userId),
            following: await this.exportFollowing(userId),
            settings: await this.exportSettings(userId)
        };

        return data;
    }

    /**
     * Export profile data
     */
    async exportProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Export posts
     */
    async exportPosts(userId) {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Export comments
     */
    async exportComments(userId) {
        const { data, error } = await supabase
            .from('post_comments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Export messages
     */
    async exportMessages(userId) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Export likes
     */
    async exportLikes(userId) {
        const { data, error } = await supabase
            .from('post_likes')
            .select('post_id, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Export saves
     */
    async exportSaves(userId) {
        const { data, error } = await supabase
            .from('post_saves')
            .select('post_id, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Export followers
     */
    async exportFollowers(userId) {
        const { data, error } = await supabase
            .from('follows')
            .select('follower_id, created_at')
            .eq('following_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Export following
     */
    async exportFollowing(userId) {
        const { data, error } = await supabase
            .from('follows')
            .select('following_id, created_at')
            .eq('follower_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Export settings
     */
    async exportSettings(userId) {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || {};
    }

    /**
     * Download data as JSON
     * @param {Object} data - Data to download
     * @param {string} filename - Filename
     */
    downloadJSON(data, filename = 'focus-data-export.json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Download data as CSV
     * @param {Object} data - Data to download
     * @param {string} filename - Filename
     */
    downloadCSV(data, filename = 'focus-data-export.csv') {
        // Convert to CSV format
        const csv = this.convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Convert data to CSV
     */
    convertToCSV(data) {
        const sections = [];

        for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value) && value.length > 0) {
                sections.push(`\n# ${key.toUpperCase()}\n`);
                const headers = Object.keys(value[0]).join(',');
                sections.push(headers);

                value.forEach(item => {
                    const row = Object.values(item)
                        .map(v => `"${String(v).replace(/"/g, '""')}"`)
                        .join(',');
                    sections.push(row);
                });
            }
        }

        return sections.join('\n');
    }
}

// Export singleton instance
export const dataExport = new DataExport();
export default dataExport;
