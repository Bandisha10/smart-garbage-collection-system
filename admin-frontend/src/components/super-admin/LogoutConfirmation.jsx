"use client";

import { LogOut, X } from "lucide-react";

export default function LogoutConfirmation({ isOpen, onClose, onLogout }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "white", borderRadius: 24, boxShadow: "0 25px 80px rgba(0,0,0,0.2)", width: "100%", maxWidth: 400, overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
        
        {/* Header */}
        <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LogOut size={20} color="#ef4444" />
          </div>
          <button 
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <X size={16} color="#64748b" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px" }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>Sign Out?</h3>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>Are you sure you want to sign out of the Super Admin dashboard?</p>
        </div>

        {/* Actions */}
        <div style={{ padding: "16px 24px 24px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
          <button 
            onClick={onClose}
            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button 
            onClick={onLogout}
            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#ef4444", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 12px rgba(239,68,68,0.25)" }}
          >
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}
