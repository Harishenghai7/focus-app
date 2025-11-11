import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function VerifyGuardian() {
  const [searchParams] = useSearchParams();
  const verificationId = searchParams.get("vid");
  const [message, setMessage] = useState("Verifying...");
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        const { error } = await supabase.functions.invoke("verifyGuardian", {
          body: { verificationId }
        });
        if (error) throw error;
        setMessage("User verified successfully! 🎉 You can now log in.");
        setTimeout(() => navigate("/login"), 3000);
      } catch (err) {
        setMessage(err.message || "Verification failed.");
      }
    };
    if (verificationId) verify();
    else setMessage("Invalid verification link.");
  }, [verificationId]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Guardian Verification</h2>
      <p>{message}</p>
    </div>
  );
}
