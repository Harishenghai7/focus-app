// Utility functions for formatting setting labels and values

export const formatSettingLabel = (key) => {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
};

export const formatSettingValue = (value) => {
    if (typeof value === 'boolean') {
        return value ? 'Enabled' : 'Disabled';
    }

    if (typeof value === 'string') {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    return String(value);
};

export const formatTimeRange = (start, end) => {
    if (!start || !end) return 'Not set';

    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return `${formatTime(start)} - ${formatTime(end)}`;
};

export const getPrivacyLevelLabel = (level) => {
    const labels = {
        everyone: 'Everyone',
        followers: 'Followers Only',
        nobody: 'Nobody'
    };
    return labels[level] || level;
};
