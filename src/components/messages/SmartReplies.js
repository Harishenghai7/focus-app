import React, { useState, useEffect } from 'react';
import { useFocuslyAI } from '../../hooks/useFocuslyAI';
import styles from './SmartReplies.module.css';

const SmartReplies = ({ lastMessage, onSelectReply }) => {
    const [suggestions, setSuggestions] = useState([]);
    const { processing, generateSmartReplies } = useFocuslyAI();

    useEffect(() => {
        if (lastMessage?.content) {
            loadSuggestions();
        }
    }, [lastMessage]);

    const loadSuggestions = async () => {
        const replies = await generateSmartReplies(lastMessage.content);
        setSuggestions(replies);
    };

    if (!suggestions.length || processing) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2a6 6 0 0 1 6 6c0 1.5-.5 2.9-1.4 4L14 14l-2-1.4A6 6 0 1 1 8 2z"
                        fill="url(#ai-gradient)" />
                    <defs>
                        <linearGradient id="ai-gradient" x1="0" y1="0" x2="16" y2="16">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#a78bfa" />
                        </linearGradient>
                    </defs>
                </svg>
                <span>Focusly AI Suggestions</span>
            </div>
            <div className={styles.chips}>
                {suggestions.map((reply, index) => (
                    <button
                        key={index}
                        className={styles.chip}
                        onClick={() => onSelectReply(reply)}
                    >
                        {reply}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SmartReplies;
