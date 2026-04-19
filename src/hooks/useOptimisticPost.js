import { useState } from "react";

export const useOptimisticPost = () => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleLike = () => setLiked((v) => !v);
  const toggleSave = () => setSaved((v) => !v);

  return { liked, saved, toggleLike, toggleSave };
};
