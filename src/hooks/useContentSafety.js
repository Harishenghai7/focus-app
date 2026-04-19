export const useContentSafety = (post) => {
  if (post?.isSensitive) {
    return { isRestricted: true, warning: "Sensitive content" };
  }
  return { isRestricted: false, warning: null };
};
