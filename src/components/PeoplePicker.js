import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./PeoplePicker.css";

export default function PeoplePicker({ onSelect, excludeId }) {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      let q = supabase.from("users").select("id,name,avatar");
      if (excludeId) q = q.neq("id", excludeId);
      const { data, error } = await q.limit(50);
      if (error) setUsers([]);
      else setUsers(data || []);
    };
    fetchUsers();
  }, [excludeId]);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="people-picker-container">
      <input
        className="people-search"
        autoFocus
        placeholder="Search users..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <div className="people-picker-list">
        {filtered.map(user => (
          <button key={user.id} className="people-picker-user" onClick={() => onSelect(user)}>
            <img src={user.avatar || "/default-avatar.png"} alt={user.name} />
            <span>{user.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
