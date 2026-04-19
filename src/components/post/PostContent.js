import React from "react";
import styles from "./PostContent.module.css";

const PostContent = ({ post, blurred }) => {
  return (
    <div className={`${styles.content} ${blurred ? styles.blurred : ""}`}>
      {post.text && <p>{post.text}</p>}
      {post.media && (
        <img src={post.media} alt="post media" />
      )}
    </div>
  );
};

export default PostContent;
