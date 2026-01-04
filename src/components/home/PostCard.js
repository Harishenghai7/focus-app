import React, { useState } from 'react';
import styles from './PostCard.module.css';
import PostHeader from './PostHeader';
import PostMedia from './PostMedia';
import InteractionBar from './InteractionBar';
import PostCaption from './PostCaption';
import CommentsPreview from './CommentsPreview';
import PostOptionsMenu from './PostOptionsMenu';
import { useLike } from '../../hooks/useLike';
import { useSave } from '../../hooks/useSave';
import { useAuth } from '../../hooks/useAuth';

const PostCard = ({ post, onCommentClick, onShareClick }) => {
    const { user } = useAuth();
    const { isLiked, likesCount, toggleLike, animating } = useLike(post, 'post');
    const { isSaved, toggleSave } = useSave(post, 'post');
    const [showMenu, setShowMenu] = useState(false);

    const isOwnPost = user?.id === post.user_id;

    return (
        <div className={styles.card}>
            <PostHeader
                user={post.user}
                createdAt={post.created_at}
                location={post.location}
                onMenuClick={() => setShowMenu(true)}
            />

            <PostMedia
                media={post.media}
                onDoubleTap={toggleLike}
            />

            <InteractionBar
                isLiked={isLiked}
                likesCount={likesCount}
                onLike={toggleLike}
                onComment={() => onCommentClick(post)}
                onShare={() => onShareClick(post)}
                isSaved={isSaved}
                onSave={toggleSave}
                animating={animating}
            />

            <PostCaption
                username={post.user.username}
                caption={post.caption}
                likesCount={likesCount}
            />

            <CommentsPreview
                commentsCount={post.comments_count}
                comments={post.comments_preview}
                onShowAll={() => onCommentClick(post)}
            />

            <PostOptionsMenu
                isOpen={showMenu}
                onClose={() => setShowMenu(false)}
                isOwnPost={isOwnPost}
                onDelete={() => { }} // Delete logic
                onEdit={() => { }} // Edit logic
                onReport={() => { }} // Report logic
            />
        </div>
    );
};

export default PostCard;
