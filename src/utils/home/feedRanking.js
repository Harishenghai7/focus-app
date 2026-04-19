export const rankFeed = (posts) => {
  return [...posts].sort((a, b) => {
    const scoreA = a.trustScore + a.engagementScore;
    const scoreB = b.trustScore + b.engagementScore;
    return scoreB - scoreA;
  });
};
