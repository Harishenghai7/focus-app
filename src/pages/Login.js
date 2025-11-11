import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const calculateAge = dobStr => {
    const today = new Date();
    const birthDate = new Date(dobStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleLogin = async () => {
    setMessage("");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(data.user);

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("dob, guardian_verified")
        .eq("id", data.user.id)
        .maybeSingle();
      if (userError) throw userError;

      if (!userData?.dob) setStep(2);
      else {
        const age = calculateAge(userData.dob);
        if (age < 12) setMessage("You must be 12+ to use Focus.");
        else if (age < 18 && !userData.guardian_verified) setStep(3);
        else {
          setMessage("Login successful! Redirecting...");
          window.location.href = "/";
        }
      }
    } catch (err) {
      setMessage(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDobSubmit = async () => {
    const age = calculateAge(dob);
    if (age < 12) {
      setMessage("You must be 12+ to use Focus.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ dob, age, guardian_verified: age >= 18 })
        .eq("id", user.id);
      if (error) throw error;
      if (age >= 18) window.location.href = "/";
      else setStep(3);
    } catch {
      setMessage("Error submitting DOB");
    } finally {
      setLoading(false);
    }
  };

  const handleGuardianVerification = async () => {
    if (!guardianEmail.trim()) {
      setMessage("Please enter guardian email");
      return;
    }
    setLoading(true);
    setMessage("Sending verification email...");
    try {
      await new Promise(res => setTimeout(res, 1500)); // simulate verification email
      setMessage("Guardian verification email sent! Please check inbox.");
    } catch {
      setMessage("Failed to send verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-container">
      <h2>Focus Login</h2>
      {message && <p className="login-message">{message}</p>}

      {step === 1 && (
        <section className="login-form">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoFocus disabled={loading} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" disabled={loading} />
          <button onClick={handleLogin} disabled={loading || !email.trim() || !password.trim()} className="btn btn-green">{loading ? "Logging in..." : "Login"}</button>
        </section>
      )}

      {step === 2 && (
        <section className="dob-form">
          <p>Please enter your Date of Birth</p>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} disabled={loading} autoFocus />
          <button onClick={handleDobSubmit} disabled={loading || !dob} className="btn btn-blue">{loading ? "Submitting..." : "Submit"}</button>
        </section>
      )}

      {step === 3 && (
        <section className="guardian-verification">
          <p>Users under 18 require guardian verification</p>
          <input type="email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} placeholder="Guardian Email" disabled={loading} />
          <button onClick={handleGuardianVerification} disabled={loading || !guardianEmail.trim()} className="btn btn-yellow">{loading ? "Sending..." : "Send Verification"}</button>
        </section>
      )}
    </main>
  );
}
