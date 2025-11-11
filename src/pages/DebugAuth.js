import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function DebugAuth() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("123456");
  const [result, setResult] = useState("");

  const testSignup = async () => {
    setResult("Testing signup...");
    
    try {
      const response = await fetch(`${supabase.supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey
        },
        body: JSON.stringify({
          email,
          password
        })
      });
      
      const data = await response.json();
      setResult(`Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Debug Supabase Auth</h2>
      
      <div>
        <input 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{ margin: '5px', padding: '5px' }}
        />
        <input 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ margin: '5px', padding: '5px' }}
        />
        <button onClick={testSignup} style={{ margin: '5px', padding: '5px' }}>
          Test Signup
        </button>
      </div>
      
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '10px', 
        marginTop: '10px',
        whiteSpace: 'pre-wrap',
        fontSize: '12px'
      }}>
        {result}
      </pre>
    </div>
  );
}