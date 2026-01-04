import React from 'react';
import styles from './ChatList.module.css';
import Avatar from '../ui/Avatar';

const ChatList = ({ chats, activeChatId, onChatSelect }) => {
    return (
        <div className={styles.list}>
            {chats.map(chat => (
                <div
                    key={chat.id}
                    className={`${styles.item} ${activeChatId === chat.id ? styles.active : ''}`}
                    onClick={() => onChatSelect(chat.id)}
                >
                    <Avatar src={chat.user.avatar_url} size="md" status={chat.user.status} />
                    <div className={styles.info}>
                        <div className={styles.topRow}>
                            <span className={styles.username}>{chat.user.username}</span>
                            <span className={`${styles.time} ${chat.user.is_online ? styles.online : ''}`}>
                                {chat.user.is_online ? 'Online' : chat.last_message_time}
                            </span>
                        </div>
                        <p className={styles.lastMessage}>
                            {chat.last_message}
                            {chat.unread_count > 0 && (
                                <span className={styles.badge}>{chat.unread_count}</span>
                            )}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChatList;
