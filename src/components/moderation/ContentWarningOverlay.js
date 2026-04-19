import React from "react";

const ContentWarningOverlay = ({ warning }) => {
  return (
    <div style={{ padding: "10px", background: "#111", color: "#fff" }}>
      ⚠️ {warning || "Sensitive content"}
    </div>
  );
};

export default ContentWarningOverlay;
