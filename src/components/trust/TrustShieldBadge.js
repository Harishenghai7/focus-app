import React from "react";

const TrustShieldBadge = ({ trustScore = 100 }) => {
  return <span>🛡️ {trustScore}</span>;
};

export default TrustShieldBadge;
