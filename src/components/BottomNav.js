import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import "./BottomNav.css";

const navItems = [
  { 
    path: "/", 
    label: "Home", 
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" />
        <path d="M9 22V12H15V22" />
      </svg>
    )
  },
  { 
    path: "/explore", 
    label: "Explore", 
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21L16.65 16.65" />
      </svg>
    )
  },
  { 
    path: "/create", 
    label: "Create", 
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8V16" />
        <path d="M8 12H16" />
      </svg>
    )
  },
  { 
    path: "/boltz", 
    label: "Boltz", 
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
      </svg>
    )
  },
  { 
    path: "/profile", 
    label: "Me", 
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  }
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.nav 
      className="bottom-nav" 
      role="navigation"
      aria-label="Bottom navigation"
      initial={{ y: 60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {navItems.map(item => {
        const isActive = location.pathname === item.path;
        return (
          <motion.button
            key={item.path}
            className={`nav-btn${isActive ? " active" : ""}${item.path === "/create" ? " create-btn" : ""}`}
            onClick={() => navigate(item.path)}
            aria-label={`${item.label}${isActive ? ', current page' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            whileTap={{ scale: 0.9 }}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon(isActive)}</span>
            <span className="nav-label">{item.label}</span>
          </motion.button>
        );
      })}
    </motion.nav>
  );
}
