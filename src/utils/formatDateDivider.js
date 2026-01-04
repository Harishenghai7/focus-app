// Format date for message dividers
export const formatDateDivider = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to midnight for comparison
    const resetTime = (d) => {
        const newDate = new Date(d);
        newDate.setHours(0, 0, 0, 0);
        return newDate;
    };

    const messageDateReset = resetTime(messageDate);
    const todayReset = resetTime(today);
    const yesterdayReset = resetTime(yesterday);

    if (messageDateReset.getTime() === todayReset.getTime()) {
        return 'Today';
    } else if (messageDateReset.getTime() === yesterdayReset.getTime()) {
        return 'Yesterday';
    } else if (messageDate.getFullYear() === today.getFullYear()) {
        // Same year: show month and day
        return messageDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    } else {
        // Different year: show full date
        return messageDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
};
