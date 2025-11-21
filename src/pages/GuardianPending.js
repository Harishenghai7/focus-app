import React from "react";
import { useNavigate } from "react-router-dom";

export default function GuardianPending() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Guardian Verification Pending</h2>
      <p>You cannot access the app until your guardian verifies your account.</p>
      <button onClick={() => navigate("/login")} style={{ padding: "10px 20px", marginTop: "20px" }}>
        Back to Login
      </button>
    </div>
  );
}
