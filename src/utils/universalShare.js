export const universalShare = async ({ type, id, title, description }) => {
    const deepLink = `https://focus.h2.in/${type}/${id}`;

    const shareData = {
        title: title || 'Focus',
        text: description || 'Check this out on Focus',
        url: deepLink
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            return { success: true };
        } else {
            await navigator.clipboard.writeText(deepLink);
            return { success: true, fallback: 'clipboard' };
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            return { success: false, cancelled: true };
        }
        return { success: false, error };
    }
};

export default universalShare;
