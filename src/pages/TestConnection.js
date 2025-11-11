import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function TestConnection() {
  const [status, setStatus] = useState("Testing...");

  useEffect(() => {
    async function testConnection() {
      try {
        // Test basic connection
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        
        if (error) {
          setStatus(`Connection Error: ${error.message}`);
        } else {
          setStatus("✅ Supabase Connected Successfully!");
        }
      } catch (err) {
        setStatus(`❌ Connection Failed: ${err.message}`);
      }
    }
    
    testConnection();
  }, []);

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>FOCUS - Connection Test</h1>
      <p>{status}</p>
      <p>URL: {supabase.supabaseUrl}</p>
      <p>Key: {supabase.supabaseKey?.substring(0, 20)}...</p>
    </div>
  );
}