import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./Comments.css";

export default function Comments({ postId, user }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (!ignore && !error) setComments(data || []);
    };

    fetchComments();

    const channel = supabase
      .channel(`public:comments_post_${postId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `post_id=eq.${postId}` }, payload => {
        setComments(prev => [...prev, payload.new]);
      }).subscribe();

    return () => { ignore = true; supabase.removeChannel(channel); };
  }, [postId]);

  const addComment = async () => {
    if (!content.trim()) return;
    await supabase.from("comments").insert({ post_id: postId, user_id: user.id, content, created_at: new Date().toISOString() });
    setContent("");
  };

  return (
    <div className="comments-section">
      {comments.map(c => (
        <div key={c.id} className="comment">
          <strong>{c.user_id}</strong>: {c.content}
        </div>
      ))}
      <div className="comment-input">
        <input value={content} onChange={e => setContent(e.target.value)} placeholder="Add a comment..." />
        <button onClick={addComment}>Post</button>
      </div>
    </div>
  );
}
