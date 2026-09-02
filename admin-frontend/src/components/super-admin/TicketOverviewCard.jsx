import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

const ICON_MAP = {
  open: { icon: AlertCircle, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  progress: { icon: Loader2, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  solved: { icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
};

export default function TicketOverviewCard({ stat }) {
  const cfg = ICON_MAP[stat.icon] || ICON_MAP.open;
  const Icon = cfg.icon;

  return (
    <div style={{ background: "white", borderRadius: 16, padding: "22px 24px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={24} color={cfg.color} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{stat.title}</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", lineHeight: 1, marginBottom: 4 }}>{stat.count}</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>{stat.description}</div>
      </div>
    </div>
  );
}
