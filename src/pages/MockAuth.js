import React, { useState } from "react";

export default function MockAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (email && password.length >= 6) {
      // Create a mock user session
      const mockUser = {
        id: "mock-user-123",
        email: email,
        user_metadata: { email: email }
      };
      
      // Store in localStorage to persist
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      
      // Trigger a page reload to update App.js
      window.location.reload();
    } else {
      alert("Please enter valid email and password (min 6 chars)");
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '10px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#667eea', fontSize: '2.5rem', margin: 0 }}>FOCUS</h1>
          <p style={{ color: '#666', margin: '0.5rem 0 0 0' }}>
            Enter any email and password to continue
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e1e5e9',
              borderRadius: '5px',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e1e5e9',
              borderRadius: '5px',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Continue to App
        </button>
      </div>
    </div>
  );
}