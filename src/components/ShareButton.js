import React, { useState } from "react";
import { components, hooks, utils } from "@/importMap";
import './ShareButton.css';

export default function ShareButton({ url }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = () => {
    if (navigator.share) {
      navigator.share({ url }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <button onClick={shareUrl} className="share-btn">
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
