import React from "react";
import styles from "./PostStats.module.css";

const PostStats = ({ likes, comments, trustScore }) => {
  return (
    <div className={styles.stats}>
      <span>{likes} likes</span>
      <span>{comments} comments</span>
      <span className={styles.trust}>Trust {trustScore}</span>
    </div>
  );
};

export default PostStats;
