// Update PostDetail.js to include this
const [replyingTo, setReplyingTo] = useState(null);
const [replies, setReplies] = useState({});

const fetchReplies = async (commentId) => {
  const { data } = await supabase.rpc('get_comment_replies', {
    comment_uuid: commentId,
    user_uuid: user.id
  });
  setReplies(prev => ({ ...prev, [commentId]: data || [] }));
};

const handleReply = async (commentId, text) => {
  await supabase.from('comments').insert({
    user_id: user.id,
    content_type: 'post',
    content_id: postId,
    parent_comment_id: commentId,
    text: text
  });
  fetchReplies(commentId);
  setReplyingTo(null);
};

// In the comment rendering:
{comment.replies_count > 0 && (
  <button onClick={() => fetchReplies(comment.id)}>
    View {comment.replies_count} replies
  </button>
)}
{replies[comment.id]?.map(reply => (
  <div key={reply.id} className="reply-item">
    {/* Same structure as comment */}
  </div>
))}
