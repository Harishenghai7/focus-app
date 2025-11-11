import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function SimpleSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const handleAuth = async () => {
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { emailRedirectTo: window.location.origin }
      });
      if (error) alert(error.message);
      else alert("Account created! You can now login.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>FOCUS</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: 'block', margin: '10px auto', padding: '10px', width: '300px' }}
      />
      <input
        type="password"
        placeholder="Password (min 6 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: 'block', margin: '10px auto', padding: '10px', width: '300px' }}
      />
      <button onClick={handleAuth} style={{ padding: '10px 20px', margin: '10px' }}>
        {isSignup ? 'Sign Up' : 'Login'}
      </button>
      <br/>
      <button onClick={() => setIsSignup(!isSignup)} style={{ padding: '5px 10px' }}>
        {isSignup ? 'Switch to Login' : 'Switch to Sign Up'}
      </button>
    </div>
  );
}