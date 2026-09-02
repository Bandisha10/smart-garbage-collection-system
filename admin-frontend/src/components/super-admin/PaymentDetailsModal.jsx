"use client";

import { X, CreditCard, Calendar, Hash, Building2, Layout, CheckCircle2, XCircle, Clock } from "lucide-react";

function DetailRow({ icon: Icon, label, value, color = "#64748b" }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(99,102,241,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} color="#6366f1" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: color }}>{value || "—"}</div>
      </div>
    </div>
  );
}

export default function PaymentDetailsModal({ open, onClose, payment }) {
  if (!open || !payment) return null;

  const statusIcons = {
    Successful: { icon: CheckCircle2, color: "#16a34a" },
    Failed: { icon: XCircle, color: "#dc2626" },
    Pending: { icon: Clock, color: "#d97706" },
  };
  const StatusIcon = statusIcons[payment.status]?.icon || Clock;
  const statusColor = statusIcons[payment.status]?.color || "#d97706";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ position: "relative", background: "white", borderRadius: 24, boxShadow: "0 25px 80px rgba(0,0,0,0.2)", width: "100%", maxWidth: 500, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
        
        {/* Close Button - Top Right */}
        <button 
          onClick={onClose} 
          style={{ position: "absolute", top: 20, right: 20, width: 36, height: 36, borderRadius: 10, background: "white", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", zIndex: 10 }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "white"; }}
        >
          <X size={18} color="#64748b" />
        </button>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", padding: "24px 30px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>Transaction Details</h3>
          <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>Detailed overview of this payment</p>
        </div>

        {/* Body */}
        <div style={{ padding: "10px 30px 30px", overflowY: "auto", flexGrow: 1 }}>
          <DetailRow icon={Building2} label="Panchayat Name" value={payment.panchayatName} color="#0f172a" />
          <DetailRow icon={Layout} label="Subscription Plan" value={payment.planName} color="#6366f1" />
          <DetailRow icon={CreditCard} label="Amount Paid" value={payment.amount} color="#0f172a" />
          <DetailRow icon={Calendar} label="Payment Date" value={payment.paymentDate} />
          <DetailRow icon={Hash} label="Transaction ID" value={payment.transactionId} />
          <DetailRow icon={StatusIcon} label="Payment Status" value={payment.status} color={statusColor} />
        </div>

        {/* Footer */}
        <div style={{ padding: "20px 30px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: "#6366f1", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.24)", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
