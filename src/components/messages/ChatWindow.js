import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatWindow.module.css';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import Input from '../ui/Input';

import ContentFilter from '../moderation/ContentFilter';
import StickerPicker from './StickerPicker';
import GifPicker from './GifPicker';
import EmojiPicker from './EmojiPicker';

const ChatWindow = ({ chat, onBack, onSendMessage }) => {
    // Updated with media pickers - force reload
    const [message, setMessage] = useState('');
    const [showStickers, setShowStickers] = useState(false);
    const [showGifs, setShowGifs] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);
    const messagesEndRef = useRef(null);
    const contentFilterRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chat.messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        // Moderation Check
        if (contentFilterRef.current) {
            const isValid = await contentFilterRef.current.validate(message);
            if (!isValid) return;
        }

        // Handle send logic
        if (onSendMessage) {
            await onSendMessage(message, 'text');
        }
        setMessage('');
    };

    const handleSendMedia = async (content, type) => {
        if (onSendMessage) {
            await onSendMessage(content, type);
        }
        setShowStickers(false);
        setShowGifs(false);
    };

    return (
        <div className={styles.window}>
            <ContentFilter ref={contentFilterRef} contentType="message" />
            <div className={styles.header}>
                <Button variant="ghost" className={styles.backBtn} onClick={onBack}>
                    <Icon name="ArrowLeft" size={20} />
                </Button>
                <Avatar src={chat.user.avatar_url} size="sm" status={chat.user.status} />
                <span className={styles.username}>{chat.user.username}</span>
                <div className={styles.actions}>
                    <Button
                        variant="ghost"
                        icon={<Icon name="Phone" size={20} />}
                        onClick={() => alert("Audio calls coming soon!")}
                    />
                    <Button
                        variant="ghost"
                        icon={<Icon name="Video" size={20} />}
                        onClick={() => alert("Video calls coming soon!")}
                    />
                    <Button
                        variant="ghost"
                        icon={<Icon name="Info" size={20} />}
                        onClick={() => alert("Chat info coming soon!")}
                    />
                </div>
            </div>

            <div className={styles.messages}>
                {chat.messages.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>No messages yet. Say hi! 👋</p>
                    </div>
                )}
                {chat.messages.map(msg => {
                    if (!msg.text) return null;
                    return (
                        <div
                            key={msg.id}
                            className={`${styles.message} ${msg.isOwn ? styles.own : ''}`}
                        >
                            <div className={styles.bubble}>
                                {msg.text}
                            </div>
                            <span className={styles.time}>{msg.time}</span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form className={styles.inputArea} onSubmit={handleSend}>
                <button
                    type="button"
                    onClick={() => setShowStickers(!showStickers)}
                    className={styles.mediaBtn}
                    title="Send sticker"
                >
                    😊
                </button>
                <button
                    type="button"
                    onClick={() => setShowGifs(!showGifs)}
                    className={styles.mediaBtn}
                    title="Send GIF"
                >
                    GIF
                </button>
                <button
                    type="button"
                    onClick={() => setShowEmojis(!showEmojis)}
                    className={styles.mediaBtn}
                    title="Add emoji"
                >
                    😀
                </button>
                <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={styles.input}
                />
                <Button variant="primary" type="submit" icon={<Icon name="Send" size={20} />} />
            </form>

            {/* Media Pickers */}
            {showStickers && (
                <div className={styles.pickerContainer}>
                    <StickerPicker
                        onSelect={(path, name) => handleSendMedia(path, 'sticker')}
                        onClose={() => setShowStickers(false)}
                    />
                </div>
            )}
            {showGifs && (
                <div className={styles.pickerContainer}>
                    <GifPicker
                        onSelect={(url, desc) => handleSendMedia(url, 'gif')}
                        onClose={() => setShowGifs(false)}
                    />
                </div>
            )}
            {showEmojis && (
                <div className={styles.pickerContainer}>
                    <EmojiPicker
                        onSelect={(emoji) => setMessage(m => m + emoji)}
                        onClose={() => setShowEmojis(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default ChatWindow;
