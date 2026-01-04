import axios from 'axios';

const JAMENDO_API_URL = 'https://api.jamendo.com/v3.0';
const CLIENT_ID = process.env.REACT_APP_JAMENDO_CLIENT_ID || 'c9720322'; // Fallback demo key if env not set

export const searchTracks = async (query, limit = 20) => {
    try {
        const response = await axios.get(`${JAMENDO_API_URL}/tracks/`, {
            params: {
                client_id: CLIENT_ID,
                format: 'json',
                limit: limit,
                search: query,
                include: 'musicinfo',
                audioformat: 'mp32' // standard mp3
            }
        });
        return response.data.results;
    } catch (error) {
        console.error('Error searching Jamendo tracks:', error);
        return [];
    }
};

export const getTrendingTracks = async (limit = 20) => {
    try {
        const response = await axios.get(`${JAMENDO_API_URL}/tracks/`, {
            params: {
                client_id: CLIENT_ID,
                format: 'json',
                limit: limit,
                order: 'popularity_week',
                include: 'musicinfo',
                audioformat: 'mp32'
            }
        });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching trending Jamendo tracks:', error);
        return [];
    }
};

export const getTrackById = async (id) => {
    try {
        const response = await axios.get(`${JAMENDO_API_URL}/tracks/`, {
            params: {
                client_id: CLIENT_ID,
                format: 'json',
                id: id,
                include: 'musicinfo'
            }
        });
        return response.data.results[0];
    } catch (error) {
        console.error('Error fetching Jamendo track:', error);
        return null;
    }
};
