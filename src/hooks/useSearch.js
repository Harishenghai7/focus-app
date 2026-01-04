import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import useDebounce from './useDebounce';

const HISTORY_KEY = 'focus_search_history';

export const useSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ users: [], hashtags: [], posts: [] });
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    const debouncedQuery = useDebounce(query, 300);

    // Load history on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem(HISTORY_KEY);
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    }, []);

    // Perform search
    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedQuery || debouncedQuery.length < 2) {
                setResults({ users: [], hashtags: [], posts: [] });
                return;
            }

            setLoading(true);
            try {
                // Parallel search requests
                const [usersRes, hashtagsRes, postsRes] = await Promise.all([
                    supabase
                        .from('profiles')
                        .select('id, username, full_name, avatar_url, verified')
                        .ilike('username', `%${debouncedQuery}%`)
                        .limit(5),
                    supabase
                        .from('hashtags') // Assuming table exists
                        .select('id, name, count')
                        .ilike('name', `%${debouncedQuery}%`)
                        .limit(5),
                    supabase
                        .from('posts')
                        .select('id, media, type')
                        .ilike('caption', `%${debouncedQuery}%`)
                        .limit(9)
                ]);

                setResults({
                    users: usersRes.data || [],
                    hashtags: hashtagsRes.data || [],
                    posts: postsRes.data || []
                });
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [debouncedQuery]);

    const addToHistory = (term) => {
        const newHistory = [term, ...history.filter(h => h !== term)].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem(HISTORY_KEY);
    };

    const removeFromHistory = (term) => {
        const newHistory = history.filter(h => h !== term);
        setHistory(newHistory);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    };

    return {
        query,
        setQuery,
        results,
        loading,
        history,
        addToHistory,
        clearHistory,
        removeFromHistory
    };
};
