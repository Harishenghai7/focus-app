import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import PostCard from '../posts/PostCard'; // Ensure this path is correct!
import styles from '../../pages/Home/Home.module.css'; // Use Home styles for consistency

const Feed = ({ feedType = 'home', userId, onShare }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, [feedType, userId]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('posts')
                .select(`
                    *,
                    profiles:user_id (id, username, avatar_url, is_verified),
                    likes:likes(user_id),
                    likes_count,
                    comments_count
                `)
                .order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            console.error('Error fetching feed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className={styles.loader}>Loading Feed...</div>;

    if (posts.length === 0) {
        return (
            <div className={styles.emptyState}>
                <h2>No Posts Yet</h2>
                <p>Follow some creators to see their content here!</p>
            </div>
        );
    }

    return (
        // Fragment is enough because the parent Home.js handles the container class
        <>
            {posts.map(post => (
                <PostCard 
                    key={post.id} 
                    post={post} 
                    onShare={onShare} 
                />
            ))}
        </>
    );
};

export default Feed;