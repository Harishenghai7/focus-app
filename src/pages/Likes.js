import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function Likes({ postId, user }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    // fetch initial like status & count
    const fetchLikes = async () => {
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact" })
        .eq("post_id", postId);
      setLikesCount(count || 0);

      const { data } = await supabase
        .from("likes")
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", user.id);
      setLiked(data.length > 0);
    };
    fetchLikes();

    // subscribe to real-time likes update if needed, or refresh manually
  }, [postId, user.id]);

  const toggleLike = async () => {
    if (liked) {
      await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id);
      setLikesCount(likesCount - 1);
      setLiked(false);
    } else {
      await supabase.from("likes").insert({ post_id: postId, user_id: user.id, created_at: new Date().toISOString() });
      setLikesCount(likesCount + 1);
      setLiked(true);
    }
  };

  return (
    <button className="like-btn" onClick={toggleLike}>
      {liked ? "👍 Liked" : "👍 Like"} ({likesCount})
    </button>
  );
}
