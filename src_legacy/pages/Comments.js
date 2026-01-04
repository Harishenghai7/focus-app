import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import CommentCard from "../components/CommentCard";
import MessageInput from "../components/MessageInput";
import { useRealtimeInteractions } from "../hooks/useRealtimeInteractions";
import { formatDate } from "../utils/dateFormatter";
import { linkifyAll } from "../utils/linkifiedText";
import "./Comments.css";

/**
 * Comments Component - Display and manage comments with nested replies
 * @component
 * @param {string} postId - ID of the post
 * @param {Object} user - Current logged-in user
 * @param {string} contentType - Type of content (post, boltz, flash)
 * @returns {React.ReactElement}
 */
export default function Comments({ postId, user, contentType = 'post' }) {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReplies, setLoadingReplies] = useState({});
  const [visibleReplies, setVisibleReplies] = useState({});
  const [error, setError] = useState(null);
  const [loadMoreLimit, setLoadMoreLimit] = useState(10);
  const [hasMore, setHasMore] = useState(false);

  // Use realtime interactions hook
  const { commentsCount } = useRealtimeInteractions(postId, contentType, user);

  /**
   * Build comment tree structure from flat array
   */
  const buildCommentTree = useCallback((flatComments) => {
    const commentMap = {};
    const rootComments = [];

    // Initialize all comments in map
    (flatComments || []).forEach(comment => {
      commentMap[comment.id] = { 
        ...comment, 
        replies: [],
        replies_count: 0
      };
    });

    // Build tree structure
    (flatComments || []).forEach(comment => {
      if (comment.parent_id) {
        // This is a reply
        const parent = commentMap[comment.parent_id];
        if (parent) {
          parent.replies.push(commentMap[comment.id]);
          parent.replies_count = (parent.replies_count || 0) + 1;
        }
      } else {
        // This is a root comment
        rootComments.push(commentMap[comment.id]);
      }
    });

    return rootComments;
  }, []);

  /**
   * Fetch comments with user data
   */
  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError, count } = await supabase
        .from("comments")
        .select(`
          *,
          user:users!comments_user_id_fkey (
            id,
            username,
            avatar_url
          ),
          comment_likes (
            user_id
          )
        `, { count: 'exact' })
        .eq("post_id", postId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(loadMoreLimit);

      if (fetchError) throw fetchError;

      // Enrich comments with like info
      const enrichedComments = (data || []).map(comment => ({
        ...comment,
        is_liked: comment.comment_likes?.some(like => like.user_id === user?.id),
        likes_count: comment.comment_likes?.length || 0
      }));

      const tree = buildCommentTree(enrichedComments);
      setComments(tree);
      setHasMore(count > loadMoreLimit);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [postId, user, loadMoreLimit, buildCommentTree]);

  /**
   * Setup realtime subscriptions
   */
  useEffect(() => {
    if (!postId) return;

    fetchComments();

    // Subscribe to comment changes
    const channel = supabase
      .channel(`comments_${postId}`)
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "comments", 
        filter: `post_id=eq.${postId}` 
      }, async (payload) => {
        // Fetch the new comment with user data
        const { data: newComment } = await supabase
          .from("comments")
          .select(`
            *,
            user:users!comments_user_id_fkey (
              id,
              username,
              avatar_url
            )
          `)
          .eq("id", payload.new.id)
          .single();

        if (newComment) {
          setComments(prev => {
            const allComments = [...flattenComments(prev), newComment];
            return buildCommentTree(allComments);
          });
        }
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "comments",
        filter: `post_id=eq.${postId}`
      }, (payload) => {
        setComments(prev => {
          const allComments = flattenComments(prev).filter(c => c.id !== payload.old.id);
          return buildCommentTree(allComments);
        });
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "comments",
        filter: `post_id=eq.${postId}`
      }, (payload) => {
        setComments(prev => {
          const allComments = flattenComments(prev).map(c => 
            c.id === payload.new.id ? { ...c, ...payload.new } : c
          );
          return buildCommentTree(allComments);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchComments, buildCommentTree]);

  /**
   * Flatten comment tree to array
   */
  const flattenComments = (commentTree) => {
    const result = [];
    const traverse = (comments) => {
      (comments || []).forEach(comment => {
        result.push(comment);
        if (comment.replies?.length > 0) {
          traverse(comment.replies);
        }
      });
    };
    traverse(commentTree);
    return result;
  };

  /**
   * Add new comment
   */
  const handleAddComment = async (content) => {
    if (!content.trim() || !user) return;

    try {
      const { error: insertError } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
          parent_id: null,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment. Please try again.');
    }
  };

  /**
   * Reply to comment
   */
  const handleReply = async (parentId, content) => {
    if (!content.trim() || !user) return;

    try {
      const { error: insertError } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
    } catch (err) {
      console.error('Error replying to comment:', err);
      alert('Failed to reply. Please try again.');
    }
  };

  /**
   * Delete comment
   */
  const handleDelete = async (commentId) => {
    // Optimistically update UI
    setComments(prev => {
      const allComments = flattenComments(prev).filter(c => c.id !== commentId);
      return buildCommentTree(allComments);
    });
  };

  /**
   * Load more comments
   */
  const handleLoadMore = () => {
    setLoadMoreLimit(prev => prev + 10);
  };

  /**
   * Load replies for a comment
   */
  const handleLoadReplies = async (commentId) => {
    if (visibleReplies[commentId]) {
      setVisibleReplies(prev => ({ ...prev, [commentId]: false }));
      return;
    }

    setLoadingReplies(prev => ({ ...prev, [commentId]: true }));

    try {
      const { data, error: fetchError } = await supabase
        .from("comments")
        .select(`
          *,
          user:users!comments_user_id_fkey (
            id,
            username,
            avatar_url
          ),
          comment_likes (
            user_id
          )
        `)
        .eq("parent_id", commentId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      // Update comment tree with replies
      setComments(prev => {
        const allComments = flattenComments(prev);
        const enrichedReplies = (data || []).map(reply => ({
          ...reply,
          is_liked: reply.comment_likes?.some(like => like.user_id === user?.id),
          likes_count: reply.comment_likes?.length || 0
        }));

        // Add replies to allComments if not already present
        enrichedReplies.forEach(reply => {
          if (!allComments.find(c => c.id === reply.id)) {
            allComments.push(reply);
          }
        });

        return buildCommentTree(allComments);
      });

      setVisibleReplies(prev => ({ ...prev, [commentId]: true }));
    } catch (err) {
      console.error('Error loading replies:', err);
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  if (loading && comments.length === 0) {
    return (
      <div className="comments-section">
        <div className="comments-loading">Loading comments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comments-section">
        <div className="comments-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="comments-section">
      <div className="comments-header">
        <h3>Comments {commentsCount > 0 && `(${commentsCount})`}</h3>
      </div>

      {user ? (
        <div className="comment-input-wrapper">
          <MessageInput
            onSend={handleAddComment}
            placeholder="Add a comment..."
          />
        </div>
      ) : (
        <div className="comments-login-prompt">
          Please log in to comment
        </div>
      )}

      <div className="comments-list">
        {(comments || []).length === 0 ? (
          <div className="comments-empty">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <>
            {(comments || []).map(comment => (
              <CommentCard
                key={comment.id}
                comment={comment}
                currentUser={user}
                onReply={handleReply}
                onDelete={handleDelete}
                depth={0}
                onLoadReplies={handleLoadReplies}
                onUserClick={(username) => navigate(`/profile/${username}`)}
              />
            ))}

            {hasMore && (
              <button 
                className="load-more-comments"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More Comments'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
