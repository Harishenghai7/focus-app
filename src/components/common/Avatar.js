import React from "react";

const Avatar = ({ src }) => {
  return (
    <img
      src={src}
      alt="avatar"
      style={{ width: 40, height: 40, borderRadius: "50%" }}
    />
  );
};

export default Avatar;
