import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
// Ensure you have your icons imported or use the svg paths as before
// Assuming lucide-react or similar for pro icons, but keeping your SVGs for now

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/home", label: "Home", icon: "🏠" }, // Replace with your SVGs
    { path: "/explore", label: "Explore", icon: "🌍" },
    { path: "/boltz", label: "Boltz", icon: "⚡" },
    { path: "/messages", label: "Messages", icon: "💬" },
    { path: "/notifications", label: "Notifications", icon: "🔔" },
    { path: "/profile", label: "Profile", icon: "👤" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <motion.aside 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 h-full w-[260px] hidden md:flex flex-col p-6 z-50 glass-panel"
      style={{ 
        background: 'var(--glass-surface)', 
        borderRight: '1px solid var(--glass-border)' 
      }}
    >
      {/* 🦁 Logo Area */}
      <div className="mb-10 px-4 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/home')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B7FD7] to-[#EE7BFA] flex items-center justify-center shadow-lg">
          <span className="text-xl">✨</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gradient">Focus</h1>
      </div>

      {/* 🧭 Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden ${
                isActive 
                  ? "text-white shadow-lg shadow-purple-500/20" 
                  : "text-secondary hover:bg-white/50 dark:hover:bg-white/5"
              }`}
              style={{
                background: isActive ? 'var(--gradient-primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: isActive ? '600' : '500'
              }}
            >
              <span className="text-xl relative z-10">{item.icon}</span>
              <span className="relative z-10">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* ➕ Create Button (Floating FAB style in Sidebar) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/create')}
        className="w-full py-4 rounded-2xl font-bold text-white shadow-xl mb-6 flex items-center justify-center gap-2"
        style={{ background: 'var(--gradient-accent)' }}
      >
        <span>+</span> Create New
      </motion.button>

    </motion.aside>
  );
};

export default Sidebar;