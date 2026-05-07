import { useCallback } from 'react';

export const useShare = () => {
    const shareToFlash = useCallback(async (boltzId) => {
        // Logic to share to Flash/Story

    }, []);

    const copyLink = useCallback(async (boltzId) => {
        const url = `${window.location.origin}/boltz/${boltzId}`;
        try {
            await navigator.clipboard.writeText(url);
            return true;
        } catch (error) {
            console.error('Copy link error:', error);
            return false;
        }
    }, []);

    const shareExternal = useCallback((boltzId, platform) => {
        const url = `${window.location.origin}/boltz/${boltzId}`;
        const text = 'Check out this Boltz!';

        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        };

        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    }, []);

    const shareNative = useCallback(async (boltzId, title = 'Check out this Boltz!') => {
        const url = `${window.location.origin}/boltz/${boltzId}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    url: url
                });
                return true;
            } catch (error) {
                console.error('Native share error:', error);
                return false;
            }
        }
        return false;
    }, []);

    return { shareToFlash, copyLink, shareExternal, shareNative };
};
