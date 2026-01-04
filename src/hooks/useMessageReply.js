import { useState } from 'react';

export const useMessageReply = () => {
    const [replyTo, setReplyTo] = useState(null);

    const startReply = (message) => {
        setReplyTo(message);
    };

    const cancelReply = () => {
        setReplyTo(null);
    };

    const clearReply = () => {
        setReplyTo(null);
    };

    return {
        replyTo,
        startReply,
        cancelReply,
        clearReply
    };
};
